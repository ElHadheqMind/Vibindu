"""
Test Simulation Flow via WebSocket - Simplified for quick testing
"""

import asyncio
import websockets
import json

async def test_simulation():
    uri = "ws://localhost:8000/ws/vibe"

    # Test simulation prompt - NOTE: Use "text" key, not "prompt"
    message = {
        "text": "Run simulation on the A1 mode default.sfc. Use get_sfc_content first to get the SFC file, then run_simulation with test scenarios.",
        "project_path": "users/agent/ToolFailureTest",
        "conversationId": "test-simulation-002"
    }

    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri, ping_interval=20, ping_timeout=60) as websocket:
            print(f"Connected!")
            print(f"Sending prompt...")

            await websocket.send(json.dumps(message))

            print(f"\nReceiving responses:")
            print("-" * 60)

            # Receive responses - limited to 60 seconds
            for i in range(60):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    data = json.loads(response)
                    msg_type = data.get("type", "unknown")

                    if msg_type == "chunk":
                        print(data.get("content", ""), end="", flush=True)
                    elif msg_type in ["tool_call", "function_call"]:
                        fn = data.get("function_name") or data.get("tool_name", "?")
                        print(f"\n[TOOL] {fn}")
                    elif msg_type in ["tool_result", "function_result"]:
                        res = data.get("result", {})
                        print(f"[RESULT] success={res.get('success', '?')}")
                    elif msg_type == "complete":
                        print(f"\nComplete!")
                        break
                    elif msg_type == "error":
                        print(f"\nError: {data.get('message', data)}")
                        break
                    else:
                        print(f"\n[{msg_type}] {str(data)[:150]}")

                except asyncio.TimeoutError:
                    print(".", end="", flush=True)
                    continue

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_simulation())

