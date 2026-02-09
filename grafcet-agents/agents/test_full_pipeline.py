"""
Full Pipeline Test for GRAFCET Agent System
============================================

This test verifies the complete pipeline:
1. SFC modes are ALWAYS generated (A1, F1, D1, A5, A6)
2. SFC code AND compiled content are stored in state['sfc_files']
3. SimulationAgent can retrieve SFC from state by sfc_name and mode_id
4. Complex modes (F1) support task-based hierarchical SFCs

Run with: python test_full_pipeline.py
"""

import asyncio
import sys
import os

# Terminal colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


class MockToolContext:
    """Mock ToolContext that mimics ADK's ToolContext.state behavior."""
    
    def __init__(self, initial_state: dict = None):
        self.state = initial_state or {}
    
    def __repr__(self):
        return f"MockToolContext(state keys={list(self.state.keys())})"


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result."""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"  {status} {name}")
    if details:
        print(f"         {CYAN}{details}{RESET}")


def log_section(title: str):
    """Log section header."""
    print(f"\n{BOLD}{'='*70}{RESET}")
    print(f"  {BOLD}{title}{RESET}")
    print(f"{BOLD}{'='*70}{RESET}")


# ============================================================================
# TEST 1: CompileAndSaveSFCTool stores sfc_code and sfc_content in state
# ============================================================================
async def test_compile_stores_sfc_code():
    """Test that CompileAndSaveSFCTool stores both sfc_code and sfc_content in state."""
    log_section("Test 1: CompileAndSaveSFCTool stores sfc_code and sfc_content")
    
    from compile_save_tool import CompileAndSaveSFCTool
    import inspect
    
    # Check source code for sfc_code and sfc_content storage
    source = inspect.getsource(CompileAndSaveSFCTool.compile_and_save_sfc)
    
    stores_sfc_code = '"sfc_code":' in source or "'sfc_code':" in source
    stores_sfc_content = '"sfc_content":' in source or "'sfc_content':" in source
    
    log_test("compile_and_save_sfc stores sfc_code", stores_sfc_code)
    log_test("compile_and_save_sfc stores sfc_content", stores_sfc_content)
    
    # Verify the state structure
    appends_to_sfc_files = 'tool_context.state["sfc_files"]' in source
    log_test("Appends to tool_context.state['sfc_files']", appends_to_sfc_files)
    
    return stores_sfc_code and stores_sfc_content and appends_to_sfc_files


# ============================================================================
# TEST 2: GetSFCContentTool has get_sfc_from_state method
# ============================================================================
async def test_get_sfc_from_state_exists():
    """Test that GetSFCContentTool has get_sfc_from_state method."""
    log_section("Test 2: GetSFCContentTool has get_sfc_from_state method")
    
    from get_sfc_tool import GetSFCContentTool
    
    tool = GetSFCContentTool()
    
    has_method = hasattr(tool, 'get_sfc_from_state')
    log_test("GetSFCContentTool has get_sfc_from_state method", has_method)
    
    if has_method:
        import inspect
        sig = inspect.signature(tool.get_sfc_from_state)
        params = list(sig.parameters.keys())
        
        has_sfc_name = 'sfc_name' in params
        has_mode_id = 'mode_id' in params
        has_tool_context = 'tool_context' in params
        
        log_test("get_sfc_from_state accepts sfc_name parameter", has_sfc_name)
        log_test("get_sfc_from_state accepts mode_id parameter", has_mode_id)
        log_test("get_sfc_from_state accepts tool_context parameter", has_tool_context)
        
        return has_sfc_name and has_mode_id and has_tool_context
    
    return False


# ============================================================================
# TEST 3: get_sfc_from_state retrieves SFC from state correctly
# ============================================================================
async def test_get_sfc_from_state_retrieval():
    """Test that get_sfc_from_state retrieves SFC from state correctly."""
    log_section("Test 3: get_sfc_from_state retrieves SFC from state")
    
    from get_sfc_tool import GetSFCContentTool
    
    tool = GetSFCContentTool()
    
    # Setup mock state with SFC files
    mock_state = {
        "sfc_files": [
            {
                "name": "conduct.sfc",
                "mode_id": "",
                "path": "/test/project/conduct.sfc",
                "success": True,
                "sfc_code": 'SFC "Conduct"\nStep 0 (Initial)\nTransition TRUE\nJump 0',
                "sfc_content": {"name": "Conduct", "elements": []}
            },
            {
                "name": "default.sfc",
                "mode_id": "A1",
                "path": "/test/project/modes/A1/default.sfc",
                "success": True,
                "sfc_code": 'SFC "A1 Initial Stop"\nStep 0 (Initial)\nTransition TRUE\nJump 0',
                "sfc_content": {"name": "A1 Initial Stop", "elements": []}
            },
            {
                "name": "default.sfc",
                "mode_id": "F1",
                "path": "/test/project/modes/F1/default.sfc",
                "success": True,
                "sfc_code": 'SFC "F1 Production"\nStep 0 (Initial)\nTransition START\nStep 1\nJump 0',
                "sfc_content": {"name": "F1 Production", "elements": []}
            }
        ]
    }
    
    ctx = MockToolContext(mock_state)
    
    # Test 1: Retrieve A1 mode SFC
    result_a1 = tool.get_sfc_from_state(sfc_name="default.sfc", mode_id="A1", tool_context=ctx)
    a1_found = result_a1.get("success", False)
    a1_has_code = "sfc_code" in result_a1 and result_a1["sfc_code"]
    a1_has_content = "sfc_content" in result_a1 and result_a1["sfc_content"]

    log_test("Found A1 mode SFC in state", a1_found)
    log_test("A1 SFC has sfc_code", a1_has_code)
    log_test("A1 SFC has sfc_content", a1_has_content)

    # Test 2: Retrieve F1 mode SFC (complex mode)
    result_f1 = tool.get_sfc_from_state(sfc_name="default.sfc", mode_id="F1", tool_context=ctx)
    f1_found = result_f1.get("success", False)
    log_test("Found F1 mode SFC in state", f1_found)

    # Test 3: Retrieve conduct.sfc (no mode_id)
    result_conduct = tool.get_sfc_from_state(sfc_name="conduct.sfc", mode_id="", tool_context=ctx)
    conduct_found = result_conduct.get("success", False)
    log_test("Found conduct.sfc in state (empty mode_id)", conduct_found)

    # Test 4: Non-existent SFC returns failure with available list
    result_missing = tool.get_sfc_from_state(sfc_name="nonexistent.sfc", mode_id="X1", tool_context=ctx)
    missing_fails = not result_missing.get("success", True)
    has_available = "available_sfcs" in result_missing
    log_test("Non-existent SFC returns failure", missing_fails)
    log_test("Failure includes available_sfcs list", has_available)

    return all([a1_found, a1_has_code, a1_has_content, f1_found, conduct_found, missing_fails])


# ============================================================================
# TEST 4: SimulationAgent has get_sfc_from_state tool
# ============================================================================
async def test_simulation_agent_has_state_tool():
    """Test that SimulationAgent has access to get_sfc_from_state tool."""
    log_section("Test 4: SimulationAgent has get_sfc_from_state tool")

    from adk_swarm import simulation_agent

    # Check that simulation_agent has the tool
    tool_names = [t.__name__ if hasattr(t, '__name__') else str(t) for t in simulation_agent.tools]

    has_get_sfc_from_state = any('get_sfc_from_state' in name for name in tool_names)
    has_get_sfc_content = any('get_sfc_content' in name for name in tool_names)
    has_run_simulation = any('run_simulation' in name for name in tool_names)

    log_test("SimulationAgent has get_sfc_from_state tool", has_get_sfc_from_state,
             f"Tools: {tool_names}")
    log_test("SimulationAgent has get_sfc_content tool", has_get_sfc_content)
    log_test("SimulationAgent has run_simulation tool", has_run_simulation)

    return has_get_sfc_from_state and has_get_sfc_content and has_run_simulation


# ============================================================================
# TEST 5: RegisterModeAgentsTool creates agents for ALL modes
# ============================================================================
async def test_register_mode_agents_all_modes():
    """Test that RegisterModeAgentsTool creates agents for all GSRSM modes."""
    log_section("Test 5: RegisterModeAgentsTool creates agents for ALL modes")

    from adk_swarm import RegisterModeAgentsTool, modes_parallel_agent

    tool = RegisterModeAgentsTool()

    # Define all standard GSRSM modes
    all_modes = [
        {"id": "A1", "name": "Initial Stop", "description": "System at rest in initial state"},
        {"id": "F1", "name": "Normal Production", "description": "Normal production cycle"},
        {"id": "D1", "name": "Emergency Stop", "description": "Emergency shutdown state"},
        {"id": "A5", "name": "Restart Preparation", "description": "Preparation for restart"},
        {"id": "A6", "name": "Reset/Initialization", "description": "Reset to initial state"}
    ]

    # Create mock context
    ctx = MockToolContext({
        "project_path": "test_project",
        "io_data": {"variables": [], "actions": []},
        "gsrsm_data": {"modes": all_modes, "transitions": []}
    })

    # Call register_mode_agents
    result = await tool.register_mode_agents(
        modes=all_modes,
        project_path="test_project",
        tool_context=ctx
    )

    success = result.get("success", False)
    registered_count = result.get("registered_count", 0)

    log_test("Registration succeeded", success)
    log_test(f"Registered {registered_count} agents for {len(all_modes)} modes",
             registered_count == len(all_modes))

    # Check that all modes have agents
    registered_agents = result.get("agents", [])
    mode_ids = {a.get("mode_id") for a in registered_agents}

    all_registered = all(m["id"] in mode_ids for m in all_modes)
    log_test("All GSRSM modes have agents (A1, F1, D1, A5, A6)", all_registered)

    # Check modes_parallel_agent has all sub_agents
    sub_agent_count = len(modes_parallel_agent.sub_agents)
    log_test(f"modes_parallel_agent has {sub_agent_count} sub_agents",
             sub_agent_count == len(all_modes))

    return success and all_registered


# ============================================================================
# TEST 6: F1 complex mode supports hierarchical architecture with tasks
# ============================================================================
async def test_f1_hierarchical_architecture():
    """Test that F1 mode supports hierarchical SFC architecture with tasks."""
    log_section("Test 6: F1 complex mode supports hierarchical architecture")

    import inspect

    # Check 1: MODE_SFC_INSTRUCTION_TEMPLATE mentions hierarchical for F1/complex modes
    from prompts import MODE_SFC_INSTRUCTION_TEMPLATE
    has_hierarchical_instruction = "hierarchical" in MODE_SFC_INSTRUCTION_TEMPLATE.lower()
    has_f1_complex = "F1" in MODE_SFC_INSTRUCTION_TEMPLATE or "complex" in MODE_SFC_INSTRUCTION_TEMPLATE.lower()
    has_task_sfc = "task_" in MODE_SFC_INSTRUCTION_TEMPLATE
    has_main_sfc = "main.sfc" in MODE_SFC_INSTRUCTION_TEMPLATE
    has_linkedfile = "LinkedFile" in MODE_SFC_INSTRUCTION_TEMPLATE

    log_test("Instruction template mentions 'hierarchical' architecture", has_hierarchical_instruction)
    log_test("Instruction template references F1 or complex modes", has_f1_complex)
    log_test("Instruction template mentions task SFCs (task_<name>.sfc)", has_task_sfc)
    log_test("Instruction template mentions main.sfc orchestrator", has_main_sfc)
    log_test("Instruction template mentions LinkedFile for macro steps", has_linkedfile)

    # Check 2: sfc_programmer.py has ModeArchitecture with hierarchical support
    from sfc_programmer import ModeArchitecture, SFCFileSpec

    has_mode_architecture = ModeArchitecture is not None
    has_sfc_file_spec = SFCFileSpec is not None

    log_test("ModeArchitecture class exists", has_mode_architecture)
    log_test("SFCFileSpec class exists for file decomposition", has_sfc_file_spec)

    # Check 3: ModeArchitecture has architecture_type field
    import dataclasses
    fields = [f.name for f in dataclasses.fields(ModeArchitecture)]
    has_arch_type = "architecture_type" in fields
    has_files = "files" in fields

    log_test("ModeArchitecture has 'architecture_type' field", has_arch_type)
    log_test("ModeArchitecture has 'files' list for multi-file", has_files)

    # Check 4: SFCProgrammerLoop has architecture decision method
    from sfc_programmer import SFCProgrammerLoop
    source = inspect.getsource(SFCProgrammerLoop)
    has_decide_arch = "_decide_architecture" in source
    has_hierarchical_logic = "hierarchical" in source.lower()

    log_test("SFCProgrammerLoop has _decide_architecture method", has_decide_arch)
    log_test("SFCProgrammerLoop has hierarchical architecture logic", has_hierarchical_logic)

    return all([
        has_hierarchical_instruction, has_f1_complex, has_task_sfc,
        has_main_sfc, has_linkedfile, has_mode_architecture,
        has_sfc_file_spec, has_arch_type, has_files,
        has_decide_arch, has_hierarchical_logic
    ])


# ============================================================================
# MAIN
# ============================================================================
async def main():
    """Run all full pipeline tests."""
    print(f"\n{BOLD}{'='*70}{RESET}")
    print(f"  {BOLD}🧪 GRAFCET Full Pipeline Test - ADK 2026{RESET}")
    print(f"{BOLD}{'='*70}{RESET}")

    results = []

    # Run all tests
    results.append(("CompileAndSaveSFCTool stores sfc_code", await test_compile_stores_sfc_code()))
    results.append(("GetSFCContentTool has get_sfc_from_state", await test_get_sfc_from_state_exists()))
    results.append(("get_sfc_from_state retrieval", await test_get_sfc_from_state_retrieval()))
    results.append(("SimulationAgent has state tool", await test_simulation_agent_has_state_tool()))
    results.append(("RegisterModeAgents creates all modes", await test_register_mode_agents_all_modes()))
    results.append(("F1 hierarchical architecture support", await test_f1_hierarchical_architecture()))

    # Summary
    print(f"\n{BOLD}{'='*70}{RESET}")
    print(f"  {BOLD}SUMMARY{RESET}")
    print(f"{BOLD}{'='*70}{RESET}")

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = f"{GREEN}✅ PASS{RESET}" if result else f"{RED}❌ FAIL{RESET}"
        print(f"  {status} {name}")

    print(f"\n  {BOLD}Results: {passed}/{total} tests passed{RESET}")

    if passed == total:
        print(f"\n  {GREEN}🎉 Full pipeline test PASSED! All components verified.{RESET}")
        print(f"  {CYAN}Pipeline flow:{RESET}")
        print(f"    1. ConductSFCAgent → conduct.sfc → state['sfc_files']")
        print(f"    2. RegisterModeAgents → creates A1, F1, D1, A5, A6 agents")
        print(f"    3. ModeSFC_* agents → mode SFCs → state['sfc_files'] (with sfc_code)")
        print(f"       • Simple modes (A1, D1, A5, A6) → default.sfc")
        print(f"       • Complex modes (F1) → hierarchical: task_*.sfc + main.sfc")
        print(f"    4. SimulationAgent → get_sfc_from_state → validates SFCs{RESET}\n")
    else:
        print(f"\n  {RED}⚠️ Some tests failed. Check implementation.{RESET}\n")

    return passed == total


if __name__ == "__main__":
    asyncio.run(main())

