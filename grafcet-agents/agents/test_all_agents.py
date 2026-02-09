"""
Comprehensive Agent Pipeline Test

Tests all agents in sequence:
1. SpecAnalyst (ProjectIOTool) - Extract IO from spec.md
2. GsrsmEngineer (UpdateGsrsmModesTool) - Define GSRSM modes
3. ConductSFCAgent (CompileAndSaveSFCTool) - Generate conduct.sfc
4. ModeSFC Agents (CompileAndSaveSFCTool) - Generate mode SFCs (one by one)
5. SimulationAgent (RunSimulationTool) - Validate SFCs

Each agent must:
- Receive correct state/context from previous agents
- Output expected results (especially SFCs with Jump 0)
"""

import os
import sys
import asyncio
import json

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
BOLD = "\033[1m"


def log_pass(name, msg=""):
    print(f"  {GREEN}✅ PASS{RESET} {name} {msg}")

def log_fail(name, msg=""):
    print(f"  {RED}❌ FAIL{RESET} {name} - {msg}")

def log_info(msg):
    print(f"  {CYAN}ℹ️  {msg}{RESET}")

def log_step(step_num, name):
    print(f"\n{BOLD}[{step_num}] {name}{RESET}")
    print("-" * 50)


# ============================================================================
# STEP 1: Test SpecAnalyst (ProjectIOTool)
# ============================================================================
async def test_spec_analyst():
    """Test ProjectIOTool - extract IO from spec.md."""
    log_step(1, "SpecAnalyst - ProjectIOTool")
    from project_io_tool import ProjectIOTool

    # Read spec.md if it exists
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    spec_content = ""
    if os.path.exists(spec_path):
        with open(spec_path, "r", encoding="utf-8") as f:
            spec_content = f.read()
        log_info(f"Loaded spec.md ({len(spec_content)} chars)")
    else:
        log_info("No spec.md found, using sample data")

    tool = ProjectIOTool()

    # Sample IO data (simulating what SpecAnalyst would extract)
    actions = [
        {"name": "MOTOR_CONV", "qualifier": "N", "condition": "PB_START AND NOT E_STOP", "description": "Conveyor Motor"},
        {"name": "VALVE_FILL", "qualifier": "S", "condition": "LEVEL < 80", "description": "Fill Valve"},
        {"name": "PUMP_RUN", "qualifier": "N", "condition": "TANK_FULL", "description": "Pump Motor"},
        {"name": "LIGHT_RED", "qualifier": "N", "condition": "E_STOP", "description": "Red Indicator"},
        {"name": "LIGHT_GREEN", "qualifier": "N", "condition": "RUNNING", "description": "Green Indicator"},
        {"name": "ALARM_BUZZER", "qualifier": "P", "condition": "FAULT", "description": "Alarm Buzzer"}
    ]
    variables = [
        {"name": "PB_START", "type": "boolean", "description": "Start Button"},
        {"name": "PB_STOP", "type": "boolean", "description": "Stop Button"},
        {"name": "E_STOP", "type": "boolean", "description": "Emergency Stop"},
        {"name": "S_LEVEL_HIGH", "type": "boolean", "description": "Tank Level High Sensor"},
        {"name": "S_LEVEL_LOW", "type": "boolean", "description": "Tank Level Low Sensor"},
        {"name": "S_GUARDS_CLOSED", "type": "boolean", "description": "Safety Guards Closed"},
        {"name": "CYCLE_COMPLETE", "type": "boolean", "description": "Cycle Complete Signal"}
    ]

    try:
        result = await tool.extract_io_config(
            project_path=TEST_PROJECT,
            actions=actions,
            transition_variables=variables
        )

        if result.get("success"):
            log_pass("ProjectIOTool", f"saved to {result.get('savedPath')}")
            return {"success": True, "actions": actions, "variables": variables}
        else:
            log_fail("ProjectIOTool", result.get("message", result.get("error", "Unknown error")))
            return {"success": False}
    except Exception as e:
        log_fail("ProjectIOTool", str(e))
        return {"success": False}


# ============================================================================
# STEP 2: Test GsrsmEngineer (UpdateGsrsmModesTool)
# ============================================================================
async def test_gsrsm_engineer(io_data):
    """Test UpdateGsrsmModesTool - define GSRSM modes."""
    log_step(2, "GsrsmEngineer - UpdateGsrsmModesTool")
    from toolkit import UpdateGsrsmModesTool

    tool = UpdateGsrsmModesTool()

    # GSRSM data with proper closed loop: A1 → F1 → D1 → A5 → A6 → A1
    gsrsm_data = {
        "modes": [
            {"id": "A1", "name": "Initial Stop", "description": "System initialization. All actuators OFF. Wait for start signal.", "activated": True},
            {"id": "F1", "name": "Normal Production", "description": "Main production cycle. Fill tank, run pump, transport product.", "activated": True},
            {"id": "D1", "name": "Emergency Stop", "description": "Emergency shutdown. Stop all actuators. Activate alarm.", "activated": True},
            {"id": "A5", "name": "Preparation for Restart", "description": "Prepare system for restart after emergency.", "activated": True},
            {"id": "A6", "name": "Reset Complete", "description": "System reset complete. Ready to return to initial.", "activated": True}
        ],
        "transitions": [
            {"fromMode": "A1", "toMode": "F1", "condition": "PB_START AND NOT E_STOP AND S_GUARDS_CLOSED"},
            {"fromMode": "F1", "toMode": "A1", "condition": "PB_STOP AND CYCLE_COMPLETE"},
            {"fromMode": "F1", "toMode": "D1", "condition": "E_STOP"},
            {"fromMode": "D1", "toMode": "A5", "condition": "NOT E_STOP"},
            {"fromMode": "A5", "toMode": "A6", "condition": "RESET_COMPLETE"},
            {"fromMode": "A6", "toMode": "A1", "condition": "SYSTEM_READY"}
        ]
    }

    try:
        result = await tool.update_gsrsm_modes(project_path=TEST_PROJECT, gsrsm_data=gsrsm_data)

        if result.get("success"):
            log_pass("UpdateGsrsmModesTool", f"updated {result.get('updated_modes', len(gsrsm_data['modes']))} modes")
            return {"success": True, "gsrsm_data": gsrsm_data}
        else:
            log_fail("UpdateGsrsmModesTool", result.get("error", "Unknown error"))
            return {"success": False}
    except Exception as e:
        log_fail("UpdateGsrsmModesTool", str(e))
        return {"success": False}


# ============================================================================
# STEP 3: Test ConductSFCAgent (CompileAndSaveSFCTool)
# ============================================================================
async def test_conduct_sfc_agent(gsrsm_data):
    """Test CompileAndSaveSFCTool for Conduct SFC."""
    log_step(3, "ConductSFCAgent - CompileAndSaveSFCTool (conduct.sfc)")
    from compile_save_tool import CompileAndSaveSFCTool

    tool = CompileAndSaveSFCTool()

    # Generate Conduct SFC based on GSRSM data
    # This is what ConductSFCAgent would generate
    conduct_sfc = '''SFC "Conduct - Mode Orchestrator"

Step 0 (Initial)
Transition "SYSTEM_READY"

Step 1 (Task) "A1"
Transition "PB_START AND NOT E_STOP AND S_GUARDS_CLOSED"

Step 2 (Task) "F1"

Divergence OR
    Branch
        Transition "PB_STOP AND CYCLE_COMPLETE"
        Step 1 (Task) "A1"
        Transition "A1_CYCLE"
    EndBranch
    Branch
        Transition "E_STOP"
        Step 3 (Task) "D1"
        Transition "NOT E_STOP"
    EndBranch
EndDivergence

Step 4 (Task) "A5"
Transition "RESET_COMPLETE"

Step 5 (Task) "A6"
Transition "SYSTEM_READY"

Jump 0
'''

    log_info("Generated Conduct SFC:")
    for line in conduct_sfc.strip().split('\n')[:10]:
        print(f"    {line}")
    print("    ...")

    try:
        result = await tool.compile_and_save_sfc(
            sfc_code=conduct_sfc,
            mode_id="conduct",
            project_path=TEST_PROJECT,
            sfc_name="conduct"
        )

        if result.get("success"):
            log_pass("CompileAndSaveSFCTool (conduct)", f"saved to {result.get('path')}")
            return {"success": True, "conduct_sfc": conduct_sfc}
        else:
            log_fail("CompileAndSaveSFCTool (conduct)", result.get("error", "Unknown error"))
            return {"success": False}
    except Exception as e:
        log_fail("CompileAndSaveSFCTool (conduct)", str(e))
        return {"success": False}


# ============================================================================
# STEP 4: Test ModeSFC Agents (CompileAndSaveSFCTool for each mode)
# ============================================================================
async def test_mode_sfc_agents(gsrsm_data, io_data):
    """Test CompileAndSaveSFCTool for each mode SFC."""
    log_step(4, "ModeSFC Agents - CompileAndSaveSFCTool (mode SFCs)")
    from compile_save_tool import CompileAndSaveSFCTool

    tool = CompileAndSaveSFCTool()

    # Mode SFC templates - each MUST end with Jump 0
    mode_sfcs = {
        "A1": '''SFC "Mode A1 - Initial Stop"
Step 0 (Initial)
    Action LIGHT_RED (N)
    Action MOTOR_CONV (R)
    Action PUMP_RUN (R)
Transition "PB_START AND NOT E_STOP AND S_GUARDS_CLOSED"
Step 1
    Action LIGHT_RED (R)
    Action LIGHT_GREEN (N)
Transition "SYSTEM_READY"
Jump 0
''',
        # F1 uses HIERARCHICAL architecture - will be handled separately
        # Placeholder to maintain mode list order
    }

    # F1 Hierarchical SFCs - task files first, then main
    f1_hierarchical = {
        "task_filling": '''SFC "F1 Task - Filling"
Step 0 (Initial)
    Action VALVE_FILL (N)
Transition "S_LEVEL_HIGH"
Step 1
    Action VALVE_FILL (R)
    Action FILL_COMPLETE (S)
Transition "TRUE"
Jump 0
''',
        "task_pumping": '''SFC "F1 Task - Pumping"
Step 0 (Initial)
    Action PUMP_RUN (N)
Transition "S_LEVEL_LOW"
Step 1
    Action PUMP_RUN (R)
    Action PUMP_COMPLETE (S)
Transition "TRUE"
Jump 0
''',
        "main": '''SFC "Mode F1 - Production Orchestrator"
Step 0 (Initial)
    Action LIGHT_GREEN (N)
Transition "CYCLE_START AND NOT E_STOP"
Step 1 (Macro)
    LinkedFile "task_filling"
Transition "FILL_COMPLETE"
Step 2 (Macro)
    LinkedFile "task_pumping"
Transition "PUMP_COMPLETE"
Step 3
    Action MOTOR_CONV (N)
Transition "CYCLE_COMPLETE"
Step 4
    Action MOTOR_CONV (R)
Transition "NEXT_CYCLE OR PB_STOP"
Jump 0
'''
    }

    # Add remaining single-architecture modes
    mode_sfcs.update({
        "D1": '''SFC "Mode D1 - Emergency Stop"
Step 0 (Initial)
    Action MOTOR_CONV (R)
    Action PUMP_RUN (R)
    Action VALVE_FILL (R)
    Action ALARM_BUZZER (N)
    Action LIGHT_RED (S)
Transition "NOT E_STOP"
Step 1
    Action ALARM_BUZZER (R)
Transition "RESET_ACKNOWLEDGED"
Jump 0
''',
        "A5": '''SFC "Mode A5 - Preparation for Restart"
Step 0 (Initial)
    Action LIGHT_RED (N)
Transition "SYSTEM_CHECK_OK"
Step 1
    Action LIGHT_RED (R)
Transition "RESET_COMPLETE"
Jump 0
''',
        "A6": '''SFC "Mode A6 - Reset Complete"
Step 0 (Initial)
    Action LIGHT_GREEN (P)
Transition "SYSTEM_READY"
Jump 0
'''
    })

    results = []

    # First: Compile F1 hierarchical SFCs (task files first, then main)
    log_info("Compiling Mode F1 (HIERARCHICAL)...")
    f1_success = True
    f1_files = []

    for sfc_name, sfc_code in f1_hierarchical.items():
        # Verify SFC ends with Jump 0
        if "Jump 0" not in sfc_code:
            log_fail(f"F1/{sfc_name}", "SFC does not end with Jump 0!")
            f1_success = False
            continue

        try:
            result = await tool.compile_and_save_sfc(
                sfc_code=sfc_code,
                mode_id="F1",
                project_path=TEST_PROJECT,
                sfc_name=sfc_name
            )

            if result.get("success"):
                log_pass(f"F1/{sfc_name}", f"saved to {result.get('path')}")
                f1_files.append(sfc_name)
            else:
                log_fail(f"F1/{sfc_name}", result.get("error", "Unknown error"))
                f1_success = False
        except Exception as e:
            log_fail(f"F1/{sfc_name}", str(e))
            f1_success = False

    if f1_success:
        log_pass("Mode F1 (hierarchical)", f"{len(f1_files)} files: {', '.join(f1_files)}")
        results.append({"mode_id": "F1", "success": True, "files": f1_files, "architecture": "hierarchical"})
    else:
        results.append({"mode_id": "F1", "success": False, "architecture": "hierarchical"})

    # Then: Compile single-architecture modes
    for mode_id, sfc_code in mode_sfcs.items():
        log_info(f"Compiling Mode {mode_id}...")

        # Verify SFC ends with Jump 0
        if "Jump 0" not in sfc_code:
            log_fail(f"Mode {mode_id}", "SFC does not end with Jump 0!")
            results.append({"mode_id": mode_id, "success": False})
            continue

        try:
            result = await tool.compile_and_save_sfc(
                sfc_code=sfc_code,
                mode_id=mode_id,
                project_path=TEST_PROJECT,
                sfc_name="default"
            )

            if result.get("success"):
                log_pass(f"Mode {mode_id}", f"saved to {result.get('path')}")
                results.append({"mode_id": mode_id, "success": True, "path": result.get("path")})
            else:
                log_fail(f"Mode {mode_id}", result.get("error", "Unknown error"))
                results.append({"mode_id": mode_id, "success": False, "error": result.get("error")})
        except Exception as e:
            log_fail(f"Mode {mode_id}", str(e))
            results.append({"mode_id": mode_id, "success": False, "error": str(e)})

    success_count = sum(1 for r in results if r.get("success"))
    total_count = len(results)

    if success_count == total_count:
        log_pass(f"All Mode SFCs", f"{success_count}/{total_count} modes compiled successfully")
        return {"success": True, "results": results}
    else:
        log_fail(f"Mode SFCs", f"Only {success_count}/{total_count} modes compiled successfully")
        return {"success": False, "results": results}


# ============================================================================
# STEP 5: Test SimulationAgent (RunSimulationTool)
# ============================================================================
async def test_simulation_agent(mode_results):
    """Test RunSimulationTool for each mode SFC."""
    log_step(5, "SimulationAgent - RunSimulationTool (one SFC at a time)")
    from simulation_tool import RunSimulationTool

    tool = RunSimulationTool()

    # Test simulation for each successfully compiled mode
    modes_to_test = ["A1", "F1", "D1"]  # Test subset
    results = []

    for mode_id in modes_to_test:
        log_info(f"Simulating Mode {mode_id}...")

        try:
            result = await tool.run_simulation(
                project_path=TEST_PROJECT,
                mode_id=mode_id,
                file_name="default.sfc",
                steps=10,
                auto_stop=True
            )

            if result.get("success"):
                log_pass(f"Simulation {mode_id}", result.get("message", "OK"))
                results.append({"mode_id": mode_id, "success": True})
            else:
                log_fail(f"Simulation {mode_id}", result.get("error", "Unknown error"))
                results.append({"mode_id": mode_id, "success": False})
        except Exception as e:
            log_fail(f"Simulation {mode_id}", str(e))
            results.append({"mode_id": mode_id, "success": False})

    success_count = sum(1 for r in results if r.get("success"))
    return {"success": success_count > 0, "results": results}



# ============================================================================
# STEP 6: Test Orchestrator Agent
# ============================================================================
async def test_orchestrator():
    """Test the ThinkingForge orchestrator agent configuration."""
    log_step(6, "Orchestrator - ThinkingForge Configuration")

    try:
        from adk_swarm import orchestrator, get_swarm

        # Verify orchestrator exists
        if orchestrator is None:
            log_fail("Orchestrator", "orchestrator is None")
            return {"success": False}

        # Verify orchestrator has correct sub_agents
        expected_agents = ["SpecAnalyst", "GsrsmEngineer", "ConductSFCAgent", "ModesSFCParallel", "SimulationAgent"]
        actual_agents = [agent.name for agent in orchestrator.sub_agents]

        log_info(f"Orchestrator sub_agents: {actual_agents}")

        missing = set(expected_agents) - set(actual_agents)
        if missing:
            log_fail("Orchestrator", f"Missing sub_agents: {missing}")
            return {"success": False}

        # Verify orchestrator instruction contains key routing rules
        instruction = orchestrator.instruction
        key_phrases = [
            "SpecAnalyst",
            "GsrsmEngineer",
            "ConductSFCAgent",
            "ModesSFCParallel",
            "SimulationAgent",
            "BUILD PIPELINE",
            "SIMULATION",
            "ONLY IF USER ASKS"
        ]

        missing_phrases = [p for p in key_phrases if p not in instruction]
        if missing_phrases:
            log_fail("Orchestrator", f"Missing instruction phrases: {missing_phrases}")
            return {"success": False}

        log_pass("Orchestrator", f"Configured with {len(actual_agents)} sub_agents")

        # Verify get_swarm returns the orchestrator
        swarm = get_swarm()
        if swarm.name != "ThinkingForge":
            log_fail("get_swarm()", f"Expected ThinkingForge, got {swarm.name}")
            return {"success": False}

        log_pass("get_swarm()", "Returns ThinkingForge orchestrator")

        # Test create_mode_sfc_agent - model decides architecture
        from adk_swarm import create_mode_sfc_agent
        f1_agent = create_mode_sfc_agent(
            mode_id="F1",
            mode_name="Production",
            mode_description="Normal production cycle with filling and pumping"
        )

        # Verify F1 agent has GSRSM expertise
        if "GSRSM" in f1_agent.instruction and "F1" in f1_agent.instruction:
            log_pass("F1 Agent", "Has GSRSM mode F1 expertise")
        else:
            log_fail("F1 Agent", "Missing GSRSM mode expertise")
            return {"success": False}

        # Verify prompt mentions architecture decision
        if "ARCHITECTURE DECISION" in f1_agent.instruction:
            log_pass("F1 Agent", "Has architecture decision guidance")
        else:
            log_fail("F1 Agent", "Missing architecture decision guidance")
            return {"success": False}

        return {"success": True}

    except Exception as e:
        log_fail("Orchestrator", str(e))
        return {"success": False}


# ============================================================================
# MAIN - Run All Tests
# ============================================================================
async def main():
    """Run all agent tests in sequence."""
    print(f"\n{'='*60}")
    print(f"  🧪 {BOLD}Comprehensive Agent Pipeline Test{RESET}")
    print(f"  Project: {TEST_PROJECT}")
    print(f"{'='*60}")

    # Check if project exists
    if not os.path.exists(TEST_PROJECT):
        print(f"\n{RED}❌ Test project does not exist: {TEST_PROJECT}{RESET}")
        return False

    all_results = {}

    # Step 1: SpecAnalyst
    io_result = await test_spec_analyst()
    all_results["SpecAnalyst"] = io_result.get("success", False)
    if not io_result.get("success"):
        print(f"\n{RED}Pipeline stopped at SpecAnalyst{RESET}")
        return False

    # Step 2: GsrsmEngineer
    gsrsm_result = await test_gsrsm_engineer(io_result)
    all_results["GsrsmEngineer"] = gsrsm_result.get("success", False)
    if not gsrsm_result.get("success"):
        print(f"\n{RED}Pipeline stopped at GsrsmEngineer{RESET}")
        return False

    # Step 3: ConductSFCAgent
    conduct_result = await test_conduct_sfc_agent(gsrsm_result.get("gsrsm_data"))
    all_results["ConductSFCAgent"] = conduct_result.get("success", False)
    if not conduct_result.get("success"):
        print(f"\n{YELLOW}Warning: Conduct SFC failed, continuing with modes...{RESET}")

    # Step 4: ModeSFC Agents
    mode_result = await test_mode_sfc_agents(gsrsm_result.get("gsrsm_data"), io_result)
    all_results["ModeSFCAgents"] = mode_result.get("success", False)

    # Step 5: SimulationAgent (only if modes compiled)
    if mode_result.get("success"):
        sim_result = await test_simulation_agent(mode_result.get("results"))
        all_results["SimulationAgent"] = sim_result.get("success", False)
    else:
        all_results["SimulationAgent"] = False
        log_info("Skipping simulation - mode SFCs failed to compile")

    # Step 6: Orchestrator Configuration
    orch_result = await test_orchestrator()
    all_results["Orchestrator"] = orch_result.get("success", False)

    # Summary
    print(f"\n{'='*60}")
    print(f"  {BOLD}SUMMARY{RESET}")
    print(f"{'='*60}")

    for agent, success in all_results.items():
        status = f"{GREEN}✅ PASS{RESET}" if success else f"{RED}❌ FAIL{RESET}"
        print(f"  {status} {agent}")

    passed = sum(1 for s in all_results.values() if s)
    total = len(all_results)

    print(f"\n  {BOLD}Results: {passed}/{total} agents passed{RESET}")
    print(f"{'='*60}\n")

    return all(all_results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)