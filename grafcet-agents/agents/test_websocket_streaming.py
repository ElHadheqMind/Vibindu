#!/usr/bin/env python3
"""
Test WebSocket Streaming - Simulates VibeSidebar Frontend
============================================================
This test connects to the orchestrator WebSocket endpoint and sends
the same payload that VibeSidebar sends, then captures and displays
all streaming messages to verify the full pipeline works.

Run with: py test_websocket_streaming.py
Requires: orchestrator.py running on port 8000
"""

import asyncio
import json
import sys
from datetime import datetime

# Use aiohttp which is already installed
try:
    import aiohttp
except ImportError:
    print("❌ aiohttp package not installed. Run: pip install aiohttp")
    sys.exit(1)

WS_URL = "ws://127.0.0.1:8000/ws/vibe"

# Same prompt template as VibeSidebar QUICK_ACTIONS[0]
DEFAULT_PROMPT = """Build the complete automation project from the uploaded specification:

Extract I/O Configuration (sensors, buttons, motors, valves)
Design GSRSM Modes
Generate Conduct SFC and Mode SFCs"""

# Test with project Z spec - full pipeline test
PROJECT_Z_PROMPT = """Project path: users/agent/agent2

Here is the specification for the Automated Sorting System:

# Automated Sorting System Specification

## System Overview
An automated conveyor-based sorting system that detects products by color and sorts them into three output bins.

## Sensors (Inputs)
- S1: Photoelectric - Product entry detection
- S2: Color sensor - RGB color detection
- S3, S4, S5: Position detection before chutes
- S6: Inductive - Metal detection
- LC1, LC2: Light curtains for safety
- ES1: E-Stop button

## Actuators (Outputs)
- M1: AC Motor - Main conveyor drive
- M2, M3, M4: Servo motors for diverters
- CYL1, CYL2, CYL3: Pneumatic cylinders
- L1 (Green), L2 (Yellow), L3 (Red), L4 (Blue): LED indicators

## Operation
1. Press START, conveyor runs
2. Color sensor detects RED/GREEN/BLUE
3. Divert to appropriate bin
4. E-STOP triggers emergency stop

Build the complete automation project with GSRSM modes and all SFCs."""

# Full specification for testing the complete pipeline
FULL_SPEC_PROMPT = """Here is the specification for a Conveyor Belt System. Project path: projects/test_conveyor

## System Description
A simple conveyor belt system that transports boxes from station A to station B.

## Inputs (Sensors)
- S1: Start button (momentary push button)
- S2: Stop button (momentary push button, normally closed)
- S3: Emergency stop (mushroom button, normally closed)
- PS1: Presence sensor at station A (detects box arrival)
- PS2: Presence sensor at station B (detects box at destination)

## Outputs (Actuators)
- M1: Conveyor motor (ON/OFF)
- L1: Green indicator light (system running)
- L2: Red indicator light (system stopped/emergency)

## Operation
1. Press S1 to start the conveyor
2. When PS1 detects a box, conveyor runs until PS2 detects the box
3. Press S2 to stop normally
4. S3 triggers emergency stop immediately

Build the complete automation with GSRSM modes and SFCs."""

# Message type colors for terminal output
COLORS = {
    "thinking": "\033[36m",    # Cyan
    "stream": "\033[32m",      # Green
    "token": "\033[32m",       # Green
    "agent_response": "\033[33m",  # Yellow
    "tool_call": "\033[35m",   # Magenta
    "tool_result": "\033[34m", # Blue
    "error": "\033[31m",       # Red
    "status": "\033[90m",      # Gray
    "reset": "\033[0m"
}

def colorize(msg_type: str, text: str) -> str:
    """Add color to terminal output based on message type."""
    color = COLORS.get(msg_type, COLORS["reset"])
    return f"{color}{text}{COLORS['reset']}"

async def test_websocket_streaming(prompt: str = None, project_path: str = None):
    """
    Connect to WebSocket and test streaming like VibeSidebar does.

    Args:
        prompt: The user prompt to send (defaults to build automation prompt)
        project_path: Optional project path for context
    """
    prompt = prompt or DEFAULT_PROMPT

    print("=" * 70)
    print("  🧪 WebSocket Streaming Test - Simulating VibeSidebar")
    print("=" * 70)
    print(f"  URL: {WS_URL}")
    print(f"  Prompt: {prompt[:60]}...")
    print("=" * 70)
    print()

    try:
        timeout = aiohttp.ClientTimeout(total=300)  # 5 min timeout
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.ws_connect(WS_URL) as ws:
                print(f"✅ Connected to WebSocket at {datetime.now().strftime('%H:%M:%S')}")
                print()

                # Build payload exactly like VibeSidebar does
                payload = {
                    "text": prompt,
                    "model": "gemini-3-flash-preview",  # Use Gemini 3 Flash
                    "mode": "fast",
                    "thinking_level": "low",
                    "projectPath": project_path or "",
                    "conversationId": f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                }

                print(f"📤 Sending payload:")
                print(f"   model: {payload['model']}")
                print(f"   thinking_level: {payload['thinking_level']}")
                print(f"   conversationId: {payload['conversationId']}")
                print()
                print("-" * 70)
                print("  📥 STREAMING RESPONSES")
                print("-" * 70)

                # Send the message
                await ws.send_str(json.dumps(payload))

                # Track message counts
                msg_counts = {}
                current_agent = None
                full_response = ""

                # Receive streaming messages
                try:
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)

                            msg_type = data.get("type", "unknown")
                            agent = data.get("agent", "Unknown")
                            text = data.get("text", "")

                            # Count message types
                            msg_counts[msg_type] = msg_counts.get(msg_type, 0) + 1

                            # Track agent changes
                            if agent != current_agent:
                                if current_agent:
                                    print()
                                print(colorize("status", f"\n[{agent}]"))
                                current_agent = agent

                            # Display based on type
                            if msg_type == "thinking":
                                print(colorize("thinking", f"  🧠 {text[:100]}..." if len(text) > 100 else f"  🧠 {text}"))
                            elif msg_type in ("stream", "token", "text"):
                                print(colorize("stream", text), end="", flush=True)
                                full_response += text
                            elif msg_type == "agent_response":
                                if text and text != full_response:
                                    print(colorize("agent_response", f"\n  📝 Final: {text[:100]}..."))
                                print()  # New line after response
                                # agent_response signals end of this interaction
                                break
                            elif msg_type == "tool_call":
                                tool_name = data.get("tool_name", "?")
                                print(colorize("tool_call", f"\n  🔧 Tool Call: {tool_name}"))
                            elif msg_type == "tool_result":
                                tool_name = data.get("tool_name", "?")
                                print(colorize("tool_result", f"  ✅ Tool Result: {tool_name}"))
                            elif msg_type == "error":
                                error_msg = text or data.get("message", "Unknown error")
                                print(colorize("error", f"\n  ❌ ERROR: {error_msg}"))
                                break  # Stop on error
                            elif msg_type == "status":
                                print(colorize("status", f"  ℹ️ {text}"))
                            elif msg_type == "pong":
                                pass  # Ignore pong
                            else:
                                print(colorize("status", f"  [{msg_type}] {text[:50] if text else ''}"))

                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            print(f"\n❌ WebSocket error: {ws.exception()}")
                            break
                        elif msg.type == aiohttp.WSMsgType.CLOSED:
                            print("\n🔌 Connection closed by server")
                            break

                except Exception as e:
                    print(f"\n❌ Error receiving: {e}")

                # Summary
                print()
                print("=" * 70)
                print("  📊 SUMMARY")
                print("=" * 70)
                print(f"  Message counts:")
                for msg_type, count in sorted(msg_counts.items()):
                    print(f"    {msg_type}: {count}")
                print(f"\n  Total response length: {len(full_response)} chars")
                print("=" * 70)

    except aiohttp.ClientConnectorError:
        print("❌ Connection refused. Is orchestrator.py running on port 8000?")
        print("   Start it with: cd grafcet-agents/agents && py orchestrator.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    # Parse command line args
    prompt = None
    project_path = None

    if len(sys.argv) > 1:
        if sys.argv[1] == "--full" or sys.argv[1] == "-f":
            # Use full project Z spec for complete pipeline test
            prompt = PROJECT_Z_PROMPT
            project_path = "users/agent/agent2"
            print("🚀 Using PROJECT_Z_PROMPT (Automated Sorting System)")
        else:
            prompt = sys.argv[1]
    if len(sys.argv) > 2:
        project_path = sys.argv[2]

    # Default to PROJECT_Z_PROMPT for full pipeline testing
    if prompt is None:
        prompt = PROJECT_Z_PROMPT
        project_path = "users/agent/agent2"
        print("🚀 Using PROJECT_Z_PROMPT (Automated Sorting System)")

    # Run the test
    success = asyncio.run(test_websocket_streaming(prompt, project_path))
    sys.exit(0 if success else 1)

