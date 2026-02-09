"""
Agent Pipeline Integration Tests

Tests the full PDF-to-SFC pipeline:
1. SpecGenerator - PDF to spec.md 
2. SpecAnalyst (ProjectIOTool) - Extract variables and actions
3. GsrsmEngineer (UpdateGsrsmModesTool) - Define GSRSM modes
4. SFCEngineer (CompileAndSaveSFCTool) - Compile SFC code
5. SimulationAgent (RunSimulationTool) - Run simulation
"""

import os
import sys
import asyncio

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

# Test project path
TEST_PROJECT = "C:/Users/pc/Documents/GrafcetProjects/users/9ad12f8d-ca85-4335-8f57-145f4d49ab44/Agent"

# Terminal colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def log_pass(name, msg=""):
    print(f"  {GREEN}✅ PASS{RESET} {name} {msg}")

def log_fail(name, msg=""):
    print(f"  {RED}❌ FAIL{RESET} {name} - {msg}")

def log_info(msg):
    print(f"  {CYAN}ℹ️  {msg}{RESET}")


async def test_project_io_tool():
    """Test ProjectIOTool - configure variables and actions."""
    print(f"\n[1/4] Testing ProjectIOTool...")
    from project_io_tool import ProjectIOTool
    
    tool = ProjectIOTool()
    
    # Sample actions and variables
    actions = [
        {"name": "MOTOR_CONV", "qualifier": "N", "condition": "PB_START AND NOT E_STOP", "description": "Conveyor Motor"},
        {"name": "VALVE_FILL", "qualifier": "S", "condition": "LEVEL < 80", "description": "Fill Valve"}
    ]
    variables = [
        {"name": "PB_START", "type": "boolean", "description": "Start Button"},
        {"name": "E_STOP", "type": "boolean", "description": "Emergency Stop"},
        {"name": "LEVEL", "type": "integer", "description": "Tank Level Sensor"}
    ]
    
    try:
        result = await tool.extract_io_config(
            project_path=TEST_PROJECT,
            actions=actions,
            transition_variables=variables
        )
        
        if result.get("success"):
            log_pass("ProjectIOTool", f"saved to {result.get('savedPath')}")
            return True
        else:
            log_fail("ProjectIOTool", result.get("message", result.get("error", "Unknown error")))
            return False
    except Exception as e:
        log_fail("ProjectIOTool", str(e))
        return False


async def test_update_gsrsm_modes_tool():
    """Test UpdateGsrsmModesTool - define GSRSM modes."""
    print(f"\n[2/4] Testing UpdateGsrsmModesTool...")
    from toolkit import UpdateGsrsmModesTool
    
    tool = UpdateGsrsmModesTool()
    
    gsrsm_data = {
        "modes": [
            {"id": "A1", "name": "Initial State", "description": "System ready and waiting", "activated": True},
            {"id": "F1", "name": "Normal Production", "description": "Main production cycle", "activated": True},
            {"id": "D1", "name": "Emergency Stop", "description": "Emergency shutdown", "activated": True}
        ],
        "transitions": [
            {"fromMode": "A1", "toMode": "F1", "condition": "PB_START AND NOT E_STOP"},
            {"fromMode": "F1", "toMode": "D1", "condition": "E_STOP"},
            {"fromMode": "D1", "toMode": "A1", "condition": "NOT E_STOP AND RESET"}
        ]
    }
    
    try:
        result = await tool.update_gsrsm_modes(project_path=TEST_PROJECT, gsrsm_data=gsrsm_data)
        
        if result.get("success"):
            log_pass("UpdateGsrsmModesTool", f"updated {result.get('updated_modes', 0)} modes")
            return True
        else:
            log_fail("UpdateGsrsmModesTool", result.get("error", "Unknown error"))
            return False
    except Exception as e:
        log_fail("UpdateGsrsmModesTool", str(e))
        return False


async def test_compile_and_save_sfc_tool():
    """Test CompileAndSaveSFCTool - compile SFC code."""
    print(f"\n[3/4] Testing CompileAndSaveSFCTool...")
    from compile_save_tool import CompileAndSaveSFCTool
    
    tool = CompileAndSaveSFCTool()
    
    sfc_code = '''SFC "A1 Initial State"
Step 0 (Initial)
  Action INDICATOR_READY N
Transition T0 "PB_START AND NOT E_STOP"
Step 1
  Action MOTOR_CONV N
Transition T1 "CYCLE_COMPLETE"
Step 0 (Initial)
'''
    
    try:
        result = await tool.compile_and_save_sfc(
            sfc_code=sfc_code,
            mode_id="A1",
            project_path=TEST_PROJECT,
            sfc_name="default"
        )
        
        if result.get("success"):
            log_pass("CompileAndSaveSFCTool", f"saved to {result.get('path')}")
            return True
        else:
            log_fail("CompileAndSaveSFCTool", result.get("error", "Unknown error"))
            return False
    except Exception as e:
        log_fail("CompileAndSaveSFCTool", str(e))
        return False


async def test_run_simulation_tool():
    """Test RunSimulationTool - run simulation."""
    print(f"\n[4/4] Testing RunSimulationTool...")
    from simulation_tool import RunSimulationTool
    
    tool = RunSimulationTool()
    
    try:
        result = await tool.run_simulation(
            project_path=TEST_PROJECT,
            mode_id="A1",
            file_name="default.sfc",
            steps=5,
            auto_stop=True
        )
        
        if result.get("success"):
            log_pass("RunSimulationTool", result.get("message", "OK"))
            return True
        else:
            log_fail("RunSimulationTool", result.get("error", "Unknown error"))
            return False
    except Exception as e:
        log_fail("RunSimulationTool", str(e))
        return False


async def main():
    """Run all tests."""
    print(f"\n{'='*60}")
    print(f"  🧪 Agent Pipeline Integration Tests")
    print(f"  Project: {TEST_PROJECT}")
    print(f"{'='*60}")
    
    # Check if project exists
    if not os.path.exists(TEST_PROJECT):
        print(f"\n{RED}❌ Test project does not exist: {TEST_PROJECT}{RESET}")
        return False
    
    results = []
    
    # Test each tool
    results.append(("ProjectIOTool", await test_project_io_tool()))
    results.append(("UpdateGsrsmModesTool", await test_update_gsrsm_modes_tool()))
    results.append(("CompileAndSaveSFCTool", await test_compile_and_save_sfc_tool()))
    results.append(("RunSimulationTool", await test_run_simulation_tool()))
    
    # Summary
    print(f"\n{'='*60}")
    passed = sum(1 for _, r in results if r)
    print(f"  Results: {GREEN}{passed}/{len(results)} passed{RESET}")
    print(f"{'='*60}\n")
    
    return all(r for _, r in results)


if __name__ == "__main__":
    asyncio.run(main())

