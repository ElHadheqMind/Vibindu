"""
Orchestrator Integration Test - Simulating Vibe Chat

This test simulates how the vibe chat frontend will interact with the orchestrator.
It sends spec.md content + user prompts and streams all agent responses.

Test Modes:
1. Full Build - "Build the project" (Project IO → GSRSM → Conduct SFC → Modes SFC)
2. IO Only - "Extract IO variables"
3. GSRSM Only - "Design GSRSM modes"
4. SFC Only - "Generate SFC files"
5. Simulate - "Simulate the SFC"
"""

import os
import sys
import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, Any, List

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

# Terminal colors for streaming output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Test configuration
TEST_PROJECT = "C:/Users/pc/Documents/GrafcetProjects/users/test-orchestrator"

# Sample spec.md content for testing
SAMPLE_SPEC = """# Color Sorting System Specification

## Overview
Automated conveyor-based color sorting system with three output bins.

## Sensors (Inputs)
| Name | Type | Description |
|------|------|-------------|
| PB_START | boolean | Start pushbutton |
| PB_STOP | boolean | Stop pushbutton |
| E_STOP | boolean | Emergency stop mushroom button (NC) |
| S_PART_PRESENT | boolean | Part detected on conveyor entry |
| S_COLOR_RED | boolean | Color sensor - red detected |
| S_COLOR_BLUE | boolean | Color sensor - blue detected |
| S_COLOR_GREEN | boolean | Color sensor - green detected |
| S_BIN1_FULL | boolean | Bin 1 (red) full sensor |
| S_BIN2_FULL | boolean | Bin 2 (blue) full sensor |
| S_BIN3_FULL | boolean | Bin 3 (green) full sensor |

## Actuators (Outputs)
| Name | Description |
|------|-------------|
| CONV_MOTOR | Main conveyor motor |
| GATE_BIN1 | Diverter gate for red bin |
| GATE_BIN2 | Diverter gate for blue bin |
| GATE_BIN3 | Diverter gate for green bin |
| LIGHT_GREEN | System running indicator |
| LIGHT_RED | System stopped/error indicator |
| LIGHT_AMBER | Sorting in progress indicator |
| BUZZER | Alarm buzzer |

## Process Flow
1. Operator presses START button
2. Conveyor starts running
3. When part detected:
   a. Color sensor identifies color
   b. Appropriate gate opens
   c. Part diverted to bin
4. Cycle repeats until STOP or E-STOP

## Safety Requirements
- E-STOP must immediately stop all motion
- Bins must not overflow - stop when any bin is full
- Guard interlock required for maintenance access
"""


class StreamingOutputHandler:
    """Handles streaming output from agents - simulates frontend display."""

    def __init__(self):
        self.events: List[Dict[str, Any]] = []
        self.current_agent = "Orchestrator"

    def print_header(self, title: str):
        """Print a section header."""
        print(f"\n{BOLD}{'='*60}{RESET}")
        print(f"{BOLD}  {title}{RESET}")
        print(f"{BOLD}{'='*60}{RESET}\n")

    def print_status(self, text: str, agent: str = None):
        """Print status message like frontend would show."""
        agent = agent or self.current_agent
        print(f"{CYAN}[{agent}]{RESET} {text}")
        self.events.append({"type": "status", "agent": agent, "text": text})

    def print_thinking(self, text: str, agent: str = None):
        """Print thinking/reasoning like frontend would show."""
        agent = agent or self.current_agent
        print(f"{DIM}{MAGENTA}[{agent} thinking]{RESET} {DIM}{text[:100]}...{RESET}")
        self.events.append({"type": "thinking", "agent": agent, "text": text})

    def print_tool_call(self, tool_name: str, params: dict, agent: str = None):
        """Print tool call like frontend would show."""
        agent = agent or self.current_agent
        print(f"{YELLOW}[{agent}] 🔧 Calling {tool_name}{RESET}")
        print(f"{DIM}  params: {json.dumps(params, indent=2)[:200]}...{RESET}")
        self.events.append({"type": "tool_call", "agent": agent, "tool": tool_name, "params": params})

    def print_tool_result(self, tool_name: str, result: dict, agent: str = None):
        """Print tool result like frontend would show."""
        agent = agent or self.current_agent
        success = result.get("success", False)
        icon = "✅" if success else "❌"
        color = GREEN if success else RED
        print(f"{color}[{agent}] {icon} {tool_name} result:{RESET}")
        # Print summary, not full result
        if isinstance(result, dict):
            for key, value in list(result.items())[:3]:
                print(f"{DIM}  {key}: {str(value)[:80]}{RESET}")
        self.events.append({"type": "tool_result", "agent": agent, "tool": tool_name, "result": result})

    def print_agent_response(self, text: str, agent: str = None):
        """Print final agent response."""
        agent = agent or self.current_agent
        print(f"\n{GREEN}[{agent}] ✅ Complete{RESET}")
        print(f"{DIM}{text[:200]}...{RESET}" if len(text) > 200 else f"{DIM}{text}{RESET}")
        self.events.append({"type": "response", "agent": agent, "text": text})

    def print_error(self, error: str, agent: str = None):
        """Print error message."""
        agent = agent or self.current_agent
        print(f"{RED}[{agent}] ❌ Error: {error}{RESET}")
        self.events.append({"type": "error", "agent": agent, "text": error})


# Create global output handler
output = StreamingOutputHandler()


async def create_test_project():
    """Ensure test project directory exists."""
    os.makedirs(TEST_PROJECT, exist_ok=True)
    os.makedirs(os.path.join(TEST_PROJECT, "modes"), exist_ok=True)

    # Save sample spec.md
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(SAMPLE_SPEC)

    output.print_status(f"✅ Test project created: {TEST_PROJECT}")
    output.print_status(f"✅ spec.md saved ({len(SAMPLE_SPEC)} chars)")
    return spec_path


async def run_orchestrator_with_streaming(
    user_prompt: str,
    spec_content: str = SAMPLE_SPEC,
    project_path: str = TEST_PROJECT
) -> Dict[str, Any]:
    """
    Run the orchestrator with streaming callbacks - simulates WebSocket flow.

    This mimics exactly what happens in /ws/vibe endpoint.
    """
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    from adk_swarm import get_swarm

    output.print_header(f"Running: {user_prompt}")
    output.print_status(f"Project: {project_path}")

    # Get the orchestrator (ThinkingForge swarm)
    swarm = get_swarm()
    output.current_agent = swarm.name

    # Create session service and runner (ADK 2026 pattern)
    session_service = InMemorySessionService()
    runner = Runner(
        agent=swarm,
        app_name="orchestrator_test",
        session_service=session_service
    )

    # Create session with initial state (mimics enhanced_context from orchestrator.py)
    session = await session_service.create_session(
        app_name="orchestrator_test",
        user_id="test_user",
        state={
            "project_path": project_path,
            "spec_content": spec_content,
            "sfc_files": [],
            "validation_results": []
        }
    )

    # Build enhanced user text (like orchestrator.py does for PDF)
    # IMPORTANT: Include project_path explicitly so agents know where to save files
    enhanced_user_text = f"""[PROJECT CONTEXT]
Project Path: {project_path}

[SPECIFICATION DOCUMENT]

The following specification was provided:

---
{spec_content}
---

IMPORTANT: When calling tools, use this EXACT project_path: {project_path}

User request: {user_prompt}
"""

    # Create content for the runner
    user_content = Content(
        role="user",
        parts=[Part(text=enhanced_user_text)]
    )

    output.print_status("🧠 Analyzing request...")
    output.print_status("📋 Routing to specialized agents...")

    # Track responses
    full_response = ""
    tool_calls = []

    # Run with streaming
    try:
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=user_content
        ):
            # Process ADK events - these are what get streamed to frontend
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        text = part.text
                        full_response += text

                        # Detect thinking patterns
                        if any(p in text.lower() for p in ["let me", "i will", "i'll", "analyzing"]):
                            output.print_thinking(text, event.author if hasattr(event, 'author') else None)
                        else:
                            # Stream token (would be real-time in frontend)
                            print(f"{DIM}{text}{RESET}", end="", flush=True)

                    # Handle tool calls
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        tool_name = fc.name
                        tool_params = dict(fc.args) if fc.args else {}
                        output.print_tool_call(tool_name, tool_params, event.author if hasattr(event, 'author') else None)
                        tool_calls.append({"tool": tool_name, "params": tool_params})

                    # Handle tool results
                    if hasattr(part, 'function_response') and part.function_response:
                        fr = part.function_response
                        tool_name = fr.name
                        result = dict(fr.response) if fr.response else {}
                        output.print_tool_result(tool_name, result, event.author if hasattr(event, 'author') else None)

            # Handle agent transitions
            if hasattr(event, 'author'):
                if event.author != output.current_agent:
                    output.current_agent = event.author
                    output.print_status(f"🔄 Agent handoff to: {event.author}")

        print()  # Newline after streaming
        output.print_agent_response(full_response[-500:] if len(full_response) > 500 else full_response)

        return {
            "success": True,
            "response": full_response,
            "tool_calls": tool_calls,
            "events": output.events
        }

    except Exception as e:
        output.print_error(str(e))
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}



# ============================================================================
# TEST SCENARIOS - Simulating different user prompts
# ============================================================================

async def test_full_build():
    """Test: 'Build the project' - Full pipeline without simulation."""
    await create_test_project()
    return await run_orchestrator_with_streaming(
        user_prompt="Build the project. Extract IO, design GSRSM modes, and generate all SFC files.",
        spec_content=SAMPLE_SPEC,
        project_path=TEST_PROJECT
    )


async def test_io_only():
    """Test: Extract IO variables only."""
    await create_test_project()
    return await run_orchestrator_with_streaming(
        user_prompt="Extract the IO variables and actions from this specification. Use the ProjectIOTool.",
        spec_content=SAMPLE_SPEC,
        project_path=TEST_PROJECT
    )


async def test_gsrsm_only():
    """Test: Design GSRSM modes only."""
    await create_test_project()
    return await run_orchestrator_with_streaming(
        user_prompt="Design the GSRSM operating modes for this system. Include A1, F1, D1, A5, A6 modes.",
        spec_content=SAMPLE_SPEC,
        project_path=TEST_PROJECT
    )


async def test_sfc_only():
    """Test: Generate SFC files only (assumes IO and GSRSM exist)."""
    await create_test_project()
    return await run_orchestrator_with_streaming(
        user_prompt="Generate all SFC files including conduct.sfc and mode SFCs.",
        spec_content=SAMPLE_SPEC,
        project_path=TEST_PROJECT
    )


async def test_simulate():
    """Test: Run simulation on existing SFC files."""
    await create_test_project()
    return await run_orchestrator_with_streaming(
        user_prompt="Simulate the A1 mode SFC to validate the logic.",
        spec_content=SAMPLE_SPEC,
        project_path=TEST_PROJECT
    )


# ============================================================================
# MAIN - Interactive test menu
# ============================================================================

async def main():
    """Interactive test menu for orchestrator integration testing."""
    output.print_header("🧪 Orchestrator Integration Test")

    print(f"""
{BOLD}Select a test to run:{RESET}

  {CYAN}1{RESET}. Full Build      - "Build the project" (IO → GSRSM → SFCs)
  {CYAN}2{RESET}. IO Only         - "Extract IO variables"
  {CYAN}3{RESET}. GSRSM Only      - "Design GSRSM modes"
  {CYAN}4{RESET}. SFC Only        - "Generate SFC files"
  {CYAN}5{RESET}. Simulate        - "Simulate the SFC"
  {CYAN}6{RESET}. Custom Prompt   - Enter your own prompt
  {CYAN}0{RESET}. Exit

""")

    while True:
        try:
            choice = input(f"{BOLD}Enter choice (0-6): {RESET}").strip()

            if choice == "0":
                print(f"{YELLOW}Exiting...{RESET}")
                break
            elif choice == "1":
                result = await test_full_build()
            elif choice == "2":
                result = await test_io_only()
            elif choice == "3":
                result = await test_gsrsm_only()
            elif choice == "4":
                result = await test_sfc_only()
            elif choice == "5":
                result = await test_simulate()
            elif choice == "6":
                custom_prompt = input(f"{CYAN}Enter your prompt: {RESET}")
                await create_test_project()
                result = await run_orchestrator_with_streaming(
                    user_prompt=custom_prompt,
                    spec_content=SAMPLE_SPEC,
                    project_path=TEST_PROJECT
                )
            else:
                print(f"{RED}Invalid choice. Enter 0-6.{RESET}")
                continue

            # Print summary
            if result.get("success"):
                print(f"\n{GREEN}{'='*60}{RESET}")
                print(f"{GREEN}  ✅ Test Complete{RESET}")
                print(f"{GREEN}{'='*60}{RESET}")
                print(f"  Tool calls: {len(result.get('tool_calls', []))}")
                print(f"  Events: {len(result.get('events', []))}")
            else:
                print(f"\n{RED}{'='*60}{RESET}")
                print(f"{RED}  ❌ Test Failed: {result.get('error')}{RESET}")
                print(f"{RED}{'='*60}{RESET}")

            print()  # Blank line before next menu

        except KeyboardInterrupt:
            print(f"\n{YELLOW}Interrupted.{RESET}")
            break
        except Exception as e:
            print(f"{RED}Error: {e}{RESET}")
            import traceback
            traceback.print_exc()


async def run_single_test(test_name: str = "full_build"):
    """Run a single test non-interactively (for CI/automation)."""
    tests = {
        "full_build": test_full_build,
        "io_only": test_io_only,
        "gsrsm_only": test_gsrsm_only,
        "sfc_only": test_sfc_only,
        "simulate": test_simulate
    }

    if test_name not in tests:
        print(f"{RED}Unknown test: {test_name}. Available: {list(tests.keys())}{RESET}")
        return False

    result = await tests[test_name]()
    return result.get("success", False)


if __name__ == "__main__":
    # Check for command-line argument for non-interactive mode
    if len(sys.argv) > 1:
        test_name = sys.argv[1]
        success = asyncio.run(run_single_test(test_name))
        sys.exit(0 if success else 1)
    else:
        # Interactive mode
        asyncio.run(main())

