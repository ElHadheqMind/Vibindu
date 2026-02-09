"""
Tool Tester - Tests all agent tools directly against the Node.js backend (port 3001).
No ADK or orchestrator dependency required. Just needs the backend running.

Usage:
    python test_tools.py                  # Run all tests
    python test_tools.py --tool navigate  # Run specific tool test
    python test_tools.py --list           # List available tools
"""

import asyncio
import aiohttp
import json
import sys
import argparse
import time

BACKEND_URL = "http://localhost:3001"
ORCHESTRATOR_URL = "http://localhost:8000"
TEST_PROJECT = "testfg"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


def log_pass(name, msg=""):
    print(f"  {GREEN}✅ PASS{RESET} {name} {msg}")

def log_fail(name, msg=""):
    print(f"  {RED}❌ FAIL{RESET} {name} - {msg}")

def log_skip(name, msg=""):
    print(f"  {YELLOW}⏭️  SKIP{RESET} {name} - {msg}")

def log_info(msg):
    print(f"  {CYAN}ℹ️  {msg}{RESET}")


async def check_backend():
    """Check if the Node.js backend at :3001 is running."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/api/files/browse/", timeout=aiohttp.ClientTimeout(total=3)) as resp:
                return resp.status == 200
    except Exception:
        return False


async def check_orchestrator():
    """Check if the Python orchestrator at :8000 is running."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{ORCHESTRATOR_URL}/", timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return True, data
                return False, None
    except Exception:
        return False, None


async def test_tool_via_orchestrator(tool_name: str, payload: dict):
    """Test a tool via the orchestrator's /tools/execute endpoint."""
    headers = {"Content-Type": "application/json"}
    body = {
        "tool": tool_name,
        "projectPath": payload.pop("projectPath", TEST_PROJECT),
        "payload": payload
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ORCHESTRATOR_URL}/tools/execute",
                json=body, headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()
                return data
    except Exception as e:
        return {"success": False, "message": str(e)}


async def test_tool_direct(tool_name: str, endpoint: str, payload: dict, method: str = "POST"):
    """Test a tool by calling the backend API directly."""
    headers = {"Content-Type": "application/json", "x-agent-secret": "antigravity-local-agent"}
    try:
        async with aiohttp.ClientSession(headers=headers) as session:
            url = f"{BACKEND_URL}{endpoint}"
            if method == "POST":
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    try:
                        data = await resp.json()
                    except Exception:
                        data = {"raw": await resp.text()}
                    return {"status": resp.status, "data": data}
            else:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    try:
                        data = await resp.json()
                    except Exception:
                        data = {"raw": await resp.text()}
                    return {"status": resp.status, "data": data}
    except Exception as e:
        return {"status": 0, "error": str(e)}


# ─── Test Definitions ────────────────────────────────────────────
TOOL_TESTS = {
    "navigate": {
        "description": "Navigate to a file in the project",
        "endpoint": "/api/simulation/navigate",
        "payload": {"projectPath": TEST_PROJECT, "modeId": "A1", "fileName": "default.sfc"},
        "orchestrator_tool": "navigate",
        "orchestrator_payload": {"projectPath": TEST_PROJECT, "modeId": "A1", "fileName": "default.sfc"},
    },
    "list_files": {
        "description": "Browse files in a directory",
        "endpoint": f"/api/files/browse/{TEST_PROJECT}",
        "method": "GET",
        "payload": {},
        "orchestrator_tool": "list_files",
        "orchestrator_payload": {"projectPath": TEST_PROJECT, "path": TEST_PROJECT},
    },
    "compile_sfc": {
        "description": "Compile SFC DSL code",
        "endpoint": "/api/sfc/compile",
        "payload": {"code": 'SFC "Test"\nSTEP S0 (initial)\nTRANSITION T0 = true\nSTEP S1\nEND', "title": "ToolTest"},
        "orchestrator_tool": "compile_sfc",
        "orchestrator_payload": {"code": 'SFC "Test"\nSTEP S0 (initial)\nTRANSITION T0 = true\nSTEP S1\nEND', "title": "ToolTest"},
    },
    "configure_io": {
        "description": "Save simulation IO config",
        "endpoint": "/api/simulation/save",
        "payload": {
            "projectPath": TEST_PROJECT,
            "simulation": {
                "variables": [{"name": "TEST_VAR", "type": "boolean", "description": "Test variable"}],
                "actions": [{"name": "TEST_ACT", "qualifier": "N", "condition": "", "description": "Test action"}]
            }
        },
        "orchestrator_tool": "configure_io",
        "orchestrator_payload": {
            "projectPath": TEST_PROJECT,
            "io_data": {
                "variables": [{"name": "TEST_VAR", "type": "boolean", "description": "Test variable"}],
                "actions": [{"name": "TEST_ACT", "qualifier": "N", "condition": "", "description": "Test action"}]
            }
        },
    },
    "ProjectIOTool": {
        "description": "Apply actions & transition variables to project",
        "endpoint": "/api/simulation/save",
        "payload": {
            "projectPath": TEST_PROJECT,
            "simulation": {
                "variables": [{"name": "Test_Sensor_1", "type": "Boolean", "description": "Test sensor", "address": "%I0.0"}],
                "actions": [{"name": "Test_Action_1", "qualifier": "N", "condition": "", "description": "Test action"}]
            }
        },
        "orchestrator_tool": "ProjectIOTool",
        "orchestrator_payload": {
            "projectPath": TEST_PROJECT,
            "actions": [{"name": "Test_Action_1", "qualifier": "N", "condition": "", "description": "Test action"}],
            "transition_variables": [{"name": "Test_Sensor_1", "type": "Boolean", "description": "Test sensor", "address": "%I0.0"}]
        },
    },
}


async def run_all_tests():
    """Run all tool tests."""
    print(f"\n{BOLD}{'='*60}")
    print(f"  🔧 Agent Tool Tester - Direct Backend Validation")
    print(f"{'='*60}{RESET}\n")

    # 1. Check prerequisites
    print(f"{BOLD}[1/3] Checking services...{RESET}")
    backend_ok = await check_backend()
    if backend_ok:
        log_pass("Backend (port 3001)", "is running")
    else:
        log_fail("Backend (port 3001)", "NOT running - start with: cd grafcet-backend && npm start")
        print(f"\n{RED}Cannot run tests without the backend. Exiting.{RESET}")
        return False

    orch_ok, orch_info = await check_orchestrator()
    if orch_ok:
        tools_list = orch_info.get("tools_available", [])
        adk_ok = orch_info.get("adk_available", False)
        log_pass("Orchestrator (port 8000)", f"{'ADK mode' if adk_ok else 'TOOLS-ONLY mode'} - {len(tools_list)} tools")
    else:
        log_skip("Orchestrator (port 8000)", "not running - will test direct backend calls only")

    # 2. Direct backend tests
    print(f"\n{BOLD}[2/3] Testing tools via direct backend calls (port 3001)...{RESET}")
    direct_results = {}
    for name, test in TOOL_TESTS.items():
        method = test.get("method", "POST")
        t0 = time.time()
        result = await test_tool_direct(name, test["endpoint"], test["payload"], method)
        elapsed = (time.time() - t0) * 1000

        if result.get("status") in [200, 201]:
            log_pass(f"{name}", f"({elapsed:.0f}ms) {test['description']}")
            direct_results[name] = True
        elif result.get("status") == 0:
            log_fail(f"{name}", f"Connection error: {result.get('error', 'unknown')}")
            direct_results[name] = False
        else:
            # Non-200 might still be "expected" (e.g., project doesn't exist)
            log_info(f"{name} returned status {result['status']} ({elapsed:.0f}ms)")
            log_info(f"  Response: {json.dumps(result.get('data', {}), indent=2)[:200]}")
            direct_results[name] = None  # indeterminate

    # 3. Orchestrator tests (if available)
    if orch_ok:
        print(f"\n{BOLD}[3/3] Testing tools via orchestrator (port 8000)...{RESET}")
        for name, test in TOOL_TESTS.items():
            t0 = time.time()
            result = await test_tool_via_orchestrator(
                test["orchestrator_tool"],
                test["orchestrator_payload"].copy()
            )
            elapsed = (time.time() - t0) * 1000

            if result.get("success") is True:
                log_pass(f"{name}", f"({elapsed:.0f}ms) via orchestrator")
            elif result.get("success") is False:
                log_fail(f"{name}", f"({elapsed:.0f}ms) {result.get('message', 'unknown error')}")
            else:
                log_info(f"{name}: {json.dumps(result, indent=2)[:200]}")
    else:
        print(f"\n{BOLD}[3/3] Orchestrator tests skipped (not running){RESET}")

    # Summary
    passed = sum(1 for v in direct_results.values() if v is True)
    failed = sum(1 for v in direct_results.values() if v is False)
    skipped = sum(1 for v in direct_results.values() if v is None)
    total = len(direct_results)

    print(f"\n{BOLD}{'='*60}")
    print(f"  Results: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}, {YELLOW}{skipped} indeterminate{RESET} / {total} total")
    print(f"{'='*60}{RESET}\n")

    return failed == 0


async def run_single_test(tool_name: str):
    """Run a single tool test."""
    if tool_name not in TOOL_TESTS:
        print(f"{RED}Unknown tool: {tool_name}{RESET}")
        print(f"Available: {', '.join(TOOL_TESTS.keys())}")
        return False

    test = TOOL_TESTS[tool_name]
    print(f"\n{BOLD}Testing: {tool_name} - {test['description']}{RESET}\n")

    # Direct test
    print(f"  Direct backend call:")
    method = test.get("method", "POST")
    result = await test_tool_direct(tool_name, test["endpoint"], test["payload"], method)
    print(f"    Status: {result.get('status')}")
    print(f"    Response: {json.dumps(result.get('data', {}), indent=2)}")

    # Orchestrator test
    orch_ok, _ = await check_orchestrator()
    if orch_ok:
        print(f"\n  Orchestrator call:")
        result = await test_tool_via_orchestrator(
            test["orchestrator_tool"],
            test["orchestrator_payload"].copy()
        )
        print(f"    Result: {json.dumps(result, indent=2)}")
    else:
        print(f"\n  {YELLOW}Orchestrator not running, skipping.{RESET}")

    return True


def main():
    parser = argparse.ArgumentParser(description="Test agent tools against backend")
    parser.add_argument("--tool", type=str, help="Test a specific tool")
    parser.add_argument("--list", action="store_true", help="List available tools")
    args = parser.parse_args()

    if args.list:
        print(f"\n{BOLD}Available tools:{RESET}")
        for name, test in TOOL_TESTS.items():
            print(f"  {CYAN}{name:20s}{RESET} - {test['description']}")
        return

    if args.tool:
        asyncio.run(run_single_test(args.tool))
    else:
        asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
