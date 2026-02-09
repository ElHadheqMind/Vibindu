
import asyncio
from google import adk
from adk_swarm import spec_analyst
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)

async def test_spec_analyst():
    print("Testing SpecAnalyst Agent...")
    
    # Mocking the user input that would typically come from the Orchestrator
    test_input = """
    Start a new project analysis for a 'Filling Station'.
    
    Requirements:
    1. A start button (PB_START) of type boolean.
    2. A tank level sensor (LEVEL) which is an integer.
    3. A Fill Valve (VALVE_FILL).
    4. When PB_START is pressed, the VALVE_FILL should be SET (S).
    5. When LEVEL reach 100, the VALVE_FILL should be RESET (R).
    6. There is a Alarm Light (ALARM) that should be active with a 5 second delay (D) if the system stays in filling state too long.
    """
    
    print("\n--- Input Spec ---")
    print(test_input)
    print("------------------\n")

    # In a real scenario, we'd run the agent. 
    # Since we can't easily mock the LLM response in this environment without actually calling it (which might be costly or slow),
    # we will rely on the fact that we updated the prompt. 
    # However, if we assume the user WANTS to run it against the real LLM to verify the prompt works:
    
    try:
        print("Invoking agent (this may take a few seconds)...")
        
        # Using the same pattern as orchestrator.py
        response = await adk.runtime.run_async(
            spec_analyst, 
            test_input
        )
        
        print("\n--- Agent Response ---")
        print(response)
        
    except Exception as e:
        print(f"Test failed or model invocation error: {e}")
        # If we can't run the model, manual inspection of the prompt file is the fallback.

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(test_spec_analyst())
