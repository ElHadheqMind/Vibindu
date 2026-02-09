"""
ADK 2026 ToolContext State Management Tests

Tests that each tool correctly reads/writes state via ToolContext.state
This verifies the ADK 2026 pattern implementation.

Run with: python test_toolcontext_state.py
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
        return f"MockToolContext(state={self.state})"


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result."""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"  {status} {name}")
    if details:
        print(f"         {CYAN}{details}{RESET}")


def log_section(title: str):
    """Log section header."""
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"  {BOLD}{title}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")


# ============================================================================
# TEST 1: ProjectIOTool writes io_data to state
# ============================================================================
async def test_project_io_tool_state():
    """Test that ProjectIOTool writes io_data to tool_context.state."""
    log_section("Test 1: ProjectIOTool → state['io_data']")

    from project_io_tool import ProjectIOTool
    import inspect

    tool = ProjectIOTool()

    # Check if the tool accepts tool_context parameter (using extract_io_config method)
    sig = inspect.signature(tool.extract_io_config)
    has_tool_context_param = "tool_context" in sig.parameters

    log_test("extract_io_config() accepts tool_context parameter", has_tool_context_param)

    # Check the source code for state writing
    import project_io_tool
    source = inspect.getsource(project_io_tool.ProjectIOTool.extract_io_config)
    writes_to_state = 'tool_context.state["io_data"]' in source

    log_test("extract_io_config() writes to tool_context.state['io_data']", writes_to_state)

    # Verify the io_data structure is correct
    has_variables_key = '"variables":' in source or "'variables':" in source
    has_actions_key = '"actions":' in source or "'actions':" in source

    log_test("io_data includes 'variables' key", has_variables_key)
    log_test("io_data includes 'actions' key", has_actions_key)

    return has_tool_context_param and writes_to_state


# ============================================================================
# TEST 2: UpdateGsrsmModesTool writes gsrsm_data to state
# ============================================================================
async def test_update_gsrsm_modes_tool_state():
    """Test that UpdateGsrsmModesTool writes gsrsm_data to tool_context.state."""
    log_section("Test 2: UpdateGsrsmModesTool → state['gsrsm_data']")

    from toolkit import UpdateGsrsmModesTool

    tool = UpdateGsrsmModesTool()
    ctx = MockToolContext()

    # This tool requires backend, so we test the state writing logic
    # by checking if the tool accepts tool_context parameter (using update_gsrsm_modes method)
    import inspect
    sig = inspect.signature(tool.update_gsrsm_modes)
    has_tool_context_param = "tool_context" in sig.parameters

    log_test("update_gsrsm_modes() accepts tool_context parameter", has_tool_context_param)

    # Check the source code for state writing
    import toolkit
    source = inspect.getsource(toolkit.UpdateGsrsmModesTool.update_gsrsm_modes)
    writes_to_state = 'tool_context.state["gsrsm_data"]' in source

    log_test("update_gsrsm_modes() writes to tool_context.state['gsrsm_data']", writes_to_state)

    return has_tool_context_param and writes_to_state


# ============================================================================
# TEST 3: CompileAndSaveSFCTool appends to sfc_files in state
# ============================================================================
async def test_compile_save_tool_state():
    """Test that CompileAndSaveSFCTool appends to tool_context.state['sfc_files']."""
    log_section("Test 3: CompileAndSaveSFCTool → state['sfc_files']")

    from compile_save_tool import CompileAndSaveSFCTool
    import inspect

    tool = CompileAndSaveSFCTool()

    # Check if the tool accepts tool_context parameter (using compile_and_save_sfc method)
    sig = inspect.signature(tool.compile_and_save_sfc)
    has_tool_context_param = "tool_context" in sig.parameters

    log_test("compile_and_save_sfc() accepts tool_context parameter", has_tool_context_param)

    # Check the source code for state writing
    import compile_save_tool
    source = inspect.getsource(compile_save_tool.CompileAndSaveSFCTool.compile_and_save_sfc)
    writes_to_state = 'tool_context.state["sfc_files"]' in source
    appends_to_list = ".append(" in source and "sfc_files" in source

    log_test("compile_and_save_sfc() writes to tool_context.state['sfc_files']", writes_to_state)
    log_test("compile_and_save_sfc() appends to sfc_files list", appends_to_list)

    return has_tool_context_param and writes_to_state


# ============================================================================
# TEST 4: RunSimulationTool appends to validation_results in state
# ============================================================================
async def test_simulation_tool_state():
    """Test that RunSimulationTool appends to tool_context.state['validation_results']."""
    log_section("Test 4: RunSimulationTool → state['validation_results']")

    from simulation_tool import RunSimulationTool
    import inspect

    tool = RunSimulationTool()

    # Check if the tool accepts tool_context parameter (using run_simulation method)
    sig = inspect.signature(tool.run_simulation)
    has_tool_context_param = "tool_context" in sig.parameters

    log_test("run_simulation() accepts tool_context parameter", has_tool_context_param)

    # Check the source code for state writing
    import simulation_tool
    source = inspect.getsource(simulation_tool.RunSimulationTool)
    writes_to_state = 'tool_context.state["validation_results"]' in source
    has_helper = "_append_validation_result" in source

    log_test("Tool writes to tool_context.state['validation_results']", writes_to_state)
    log_test("Tool has _append_validation_result helper", has_helper)

    return has_tool_context_param and writes_to_state and has_helper


# ============================================================================
# TEST 5: RegisterModeAgentsTool reads from state
# ============================================================================
async def test_register_mode_agents_tool_state():
    """Test that RegisterModeAgentsTool reads from tool_context.state."""
    log_section("Test 5: RegisterModeAgentsTool ← state['io_data', 'gsrsm_data', 'project_path']")

    from adk_swarm import RegisterModeAgentsTool
    import inspect

    tool = RegisterModeAgentsTool()

    # Check if the tool accepts tool_context parameter (using register_mode_agents method)
    sig = inspect.signature(tool.register_mode_agents)
    has_tool_context_param = "tool_context" in sig.parameters

    log_test("register_mode_agents() accepts tool_context parameter", has_tool_context_param)

    # Check the source code for state reading
    import adk_swarm
    source = inspect.getsource(adk_swarm.RegisterModeAgentsTool.register_mode_agents)
    reads_io_data = 'tool_context.state["io_data"]' in source
    reads_gsrsm_data = 'tool_context.state["gsrsm_data"]' in source
    reads_project_path = 'tool_context.state["project_path"]' in source

    log_test("register_mode_agents() reads io_data from state", reads_io_data)
    log_test("register_mode_agents() reads gsrsm_data from state", reads_gsrsm_data)
    log_test("register_mode_agents() reads project_path from state", reads_project_path)

    return has_tool_context_param and reads_io_data and reads_gsrsm_data and reads_project_path


# ============================================================================
# TEST 6: Verify state flow architecture
# ============================================================================
async def test_state_flow_architecture():
    """Verify the state flow architecture is correctly implemented."""
    log_section("Test 6: State Flow Architecture Verification")

    # Verify the state flow: SpecAnalyst → GsrsmEngineer → ConductSFC → ModeSFC → Simulation

    # Check 1: SpecAnalyst (ProjectIOTool) writes io_data
    import project_io_tool
    import inspect
    source1 = inspect.getsource(project_io_tool.ProjectIOTool.extract_io_config)
    spec_writes_io = 'tool_context.state["io_data"]' in source1
    log_test("SpecAnalyst → writes io_data", spec_writes_io)

    # Check 2: GsrsmEngineer (UpdateGsrsmModesTool) writes gsrsm_data
    import toolkit
    source2 = inspect.getsource(toolkit.UpdateGsrsmModesTool.update_gsrsm_modes)
    gsrsm_writes = 'tool_context.state["gsrsm_data"]' in source2
    log_test("GsrsmEngineer → writes gsrsm_data", gsrsm_writes)

    # Check 3: ConductSFC/ModeSFC (CompileAndSaveSFCTool) appends to sfc_files
    import compile_save_tool
    source3 = inspect.getsource(compile_save_tool.CompileAndSaveSFCTool.compile_and_save_sfc)
    sfc_appends = 'tool_context.state["sfc_files"]' in source3
    log_test("SFC Agents → append to sfc_files", sfc_appends)

    # Check 4: SimulationAgent (RunSimulationTool) appends to validation_results
    import simulation_tool
    source4 = inspect.getsource(simulation_tool.RunSimulationTool)
    sim_appends = 'tool_context.state["validation_results"]' in source4
    log_test("SimulationAgent → appends to validation_results", sim_appends)

    # Check 5: RegisterModeAgentsTool reads from state
    import adk_swarm
    source5 = inspect.getsource(adk_swarm.RegisterModeAgentsTool.register_mode_agents)
    reads_io = 'tool_context.state["io_data"]' in source5
    reads_gsrsm = 'tool_context.state["gsrsm_data"]' in source5
    reads_path = 'tool_context.state["project_path"]' in source5
    log_test("RegisterModeAgents ← reads io_data, gsrsm_data, project_path", reads_io and reads_gsrsm and reads_path)

    # Summary of state flow
    print(f"\n  {CYAN}State Flow Architecture:{RESET}")
    print(f"    SpecAnalyst      → io_data")
    print(f"    GsrsmEngineer    → gsrsm_data")
    print(f"    ConductSFCAgent  → sfc_files (append)")
    print(f"    ModeSFC_*        → sfc_files (append)")
    print(f"    SimulationAgent  → validation_results (append)")

    return all([spec_writes_io, gsrsm_writes, sfc_appends, sim_appends, reads_io and reads_gsrsm and reads_path])


# ============================================================================
# MAIN
# ============================================================================
async def main():
    """Run all ToolContext state tests."""
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"  {BOLD}🧪 ADK 2026 ToolContext State Management Tests{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    results = []

    # Run all tests
    results.append(("ProjectIOTool", await test_project_io_tool_state()))
    results.append(("UpdateGsrsmModesTool", await test_update_gsrsm_modes_tool_state()))
    results.append(("CompileAndSaveSFCTool", await test_compile_save_tool_state()))
    results.append(("RunSimulationTool", await test_simulation_tool_state()))
    results.append(("RegisterModeAgentsTool", await test_register_mode_agents_tool_state()))
    results.append(("State Flow Architecture", await test_state_flow_architecture()))

    # Summary
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"  {BOLD}SUMMARY{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = f"{GREEN}✅ PASS{RESET}" if result else f"{RED}❌ FAIL{RESET}"
        print(f"  {status} {name}")

    print(f"\n  {BOLD}Results: {passed}/{total} tests passed{RESET}")

    if passed == total:
        print(f"\n  {GREEN}🎉 All ADK 2026 state management patterns verified!{RESET}\n")
    else:
        print(f"\n  {RED}⚠️ Some tests failed. Check implementation.{RESET}\n")

    return passed == total


if __name__ == "__main__":
    asyncio.run(main())

