"""
Full Pipeline Test: Color Sorting System PDF

Tests the complete PDF-to-SFC pipeline:
1. SpecGenerator - Upload PDF and generate spec.md
2. SpecAnalyst - Extract I/O variables  
3. GsrsmEngineer - Define GSRSM modes
4. SFCEngineer - Generate SFC code for each mode
5. SimulationAgent - Run simulation
"""

import os
import sys
import asyncio

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

# Test configuration
PDF_PATH = "C:/Users/pc/Desktop/G7V0101/GAI/Color Sorting System.pdf"
TEST_PROJECT = "C:/Users/pc/Documents/GrafcetProjects/users/9ad12f8d-ca85-4335-8f57-145f4d49ab44/Agent"

# Terminal colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def log_step(step, name):
    print(f"\n{'='*60}")
    print(f"  Step {step}: {name}")
    print(f"{'='*60}")

def log_pass(msg):
    print(f"  {GREEN}✅ {msg}{RESET}")

def log_fail(msg):
    print(f"  {RED}❌ {msg}{RESET}")

def log_info(msg):
    print(f"  {CYAN}ℹ️  {msg}{RESET}")


async def step1_generate_spec():
    """Step 1: Upload PDF to Gemini and generate spec.md"""
    log_step(1, "SpecGenerator - PDF to spec.md")
    
    from google import genai
    from spec_generator import SpecGenerator, SpecResult
    
    # Check PDF exists
    if not os.path.exists(PDF_PATH):
        log_fail(f"PDF not found: {PDF_PATH}")
        return None
    
    log_info(f"PDF: {PDF_PATH}")
    log_info(f"Project: {TEST_PROJECT}")
    
    # Initialize Gemini client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        log_fail("GEMINI_API_KEY not set")
        return None
    
    client = genai.Client(api_key=api_key)
    log_pass("Gemini client initialized")
    
    # Upload PDF to Gemini Files API
    log_info("Uploading PDF to Gemini Files API...")
    try:
        with open(PDF_PATH, "rb") as f:
            uploaded_file = client.files.upload(
                file=f,
                config={
                    "display_name": "Color Sorting System.pdf",
                    "mime_type": "application/pdf"
                }
            )
        log_pass(f"PDF uploaded: {uploaded_file.name}")
        log_info(f"URI: {uploaded_file.uri}")
    except Exception as e:
        log_fail(f"Upload failed: {e}")
        return None
    
    # Generate spec using SpecGenerator
    log_info("Generating spec.md from PDF...")
    generator = SpecGenerator()
    
    try:
        result = await generator.generate_spec_from_pdf(
            file_uri=uploaded_file.uri,
            mime_type="application/pdf",
            project_path=TEST_PROJECT
        )
        
        if result.success:
            log_pass(f"Spec generated ({len(result.spec_content)} chars)")
            log_info(f"Images described: {result.images_described}")
            
            # Save spec.md locally if backend save failed
            spec_path = os.path.join(TEST_PROJECT, "spec.md")
            with open(spec_path, "w", encoding="utf-8") as f:
                f.write(result.spec_content)
            log_pass(f"Saved to: {spec_path}")
            
            return result.spec_content
        else:
            log_fail(f"Generation failed: {result.error}")
            return None
    except Exception as e:
        log_fail(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


async def step2_spec_analyst():
    """Step 2: Run SpecAnalyst agent to extract I/O variables."""
    log_step(2, "SpecAnalyst - Extract I/O Variables")

    # Use official ADK import paths per documentation
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    from adk_swarm import spec_analyst

    # Read spec.md
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    if not os.path.exists(spec_path):
        log_fail(f"spec.md not found: {spec_path}")
        return None

    with open(spec_path, "r", encoding="utf-8") as f:
        spec_content = f.read()

    log_info(f"Loaded spec.md ({len(spec_content)} chars)")

    # Create prompt for the agent
    prompt_text = f"""Analyze this specification and extract all I/O variables.
Use the ProjectIOTool to save the configuration.

Project path: {TEST_PROJECT}

Specification:
{spec_content}
"""

    log_info("Running SpecAnalyst agent...")

    try:
        # Create session service and runner (per official ADK docs)
        session_service = InMemorySessionService()
        runner = Runner(
            agent=spec_analyst,
            app_name="test_color_sorting",
            session_service=session_service
        )

        # Create a session
        session = await session_service.create_session(
            app_name="test_color_sorting",
            user_id="test_user"
        )

        # Create proper Content message
        message = Content(role="user", parts=[Part(text=prompt_text)])

        # Run the agent and process events using official ADK patterns
        response_text = ""
        tool_calls = []
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=message
        ):
            # Use official ADK event methods per documentation
            # Check for function calls (tool requests)
            func_calls = event.get_function_calls()
            if func_calls:
                for call in func_calls:
                    tool_name = call.name
                    tool_calls.append(tool_name)
                    log_info(f"Tool call: {tool_name}")

            # Check for function responses (tool results)
            func_responses = event.get_function_responses()
            if func_responses:
                for resp in func_responses:
                    log_info(f"Tool response: {resp.name}")

            # Accumulate text content
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text += part.text
                        print(f".", end="", flush=True)

            # Check for final response using official method
            if event.is_final_response():
                log_info("Final response received")

        print()  # newline
        if response_text:
            log_info(f"Response: {response_text[:200]}...")
        if tool_calls:
            log_info(f"Tools called: {tool_calls}")
        log_pass("SpecAnalyst completed")
        return True
    except Exception as e:
        log_fail(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def step3_gsrsm_engineer():
    """Step 3: Run GsrsmEngineer agent to update GSRSM modes."""
    log_step(3, "GsrsmEngineer - Update GSRSM Modes")

    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    from adk_swarm import gsrsm_engineer

    # Read spec.md
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    with open(spec_path, "r", encoding="utf-8") as f:
        spec_content = f.read()

    prompt_text = f"""Analyze the specification and update the GSRSM operating modes.
Use the UpdateGsrsmModesTool to configure appropriate modes for this system.

Project path: {TEST_PROJECT}

Specification:
{spec_content}
"""

    log_info("Running GsrsmEngineer agent...")

    try:
        session_service = InMemorySessionService()
        runner = Runner(
            agent=gsrsm_engineer,
            app_name="test_color_sorting",
            session_service=session_service
        )

        session = await session_service.create_session(
            app_name="test_color_sorting",
            user_id="test_user"
        )

        message = Content(role="user", parts=[Part(text=prompt_text)])

        response_text = ""
        tool_calls = []
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=message
        ):
            func_calls = event.get_function_calls()
            if func_calls:
                for call in func_calls:
                    tool_calls.append(call.name)
                    log_info(f"Tool call: {call.name}")

            func_responses = event.get_function_responses()
            if func_responses:
                for resp in func_responses:
                    log_info(f"Tool response: {resp.name}")

            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text += part.text
                        print(f".", end="", flush=True)

            if event.is_final_response():
                log_info("Final response received")

        print()
        if response_text:
            log_info(f"Response: {response_text[:200]}...")
        if tool_calls:
            log_info(f"Tools called: {tool_calls}")
        log_pass("GsrsmEngineer completed")
        return True
    except Exception as e:
        log_fail(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def step4_sfc_engineer():
    """Step 4: Run SFCEngineer agent to compile SFC code."""
    log_step(4, "SFCEngineer - Compile SFC Code")

    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    from adk_swarm import sfc_engineer

    # Read spec.md
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    with open(spec_path, "r", encoding="utf-8") as f:
        spec_content = f.read()

    prompt_text = f"""Based on the specification, generate and compile the SFC code.
Use the CompileAndSaveSFCTool to save the SFC program.

Project path: {TEST_PROJECT}

Specification:
{spec_content}
"""

    log_info("Running SFCEngineer agent...")

    try:
        session_service = InMemorySessionService()
        runner = Runner(
            agent=sfc_engineer,
            app_name="test_color_sorting",
            session_service=session_service
        )

        session = await session_service.create_session(
            app_name="test_color_sorting",
            user_id="test_user"
        )

        message = Content(role="user", parts=[Part(text=prompt_text)])

        response_text = ""
        tool_calls = []
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=message
        ):
            func_calls = event.get_function_calls()
            if func_calls:
                for call in func_calls:
                    tool_calls.append(call.name)
                    log_info(f"Tool call: {call.name}")

            func_responses = event.get_function_responses()
            if func_responses:
                for resp in func_responses:
                    log_info(f"Tool response: {resp.name}")

            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text += part.text
                        print(f".", end="", flush=True)

            if event.is_final_response():
                log_info("Final response received")

        print()
        if response_text:
            log_info(f"Response: {response_text[:200]}...")
        if tool_calls:
            log_info(f"Tools called: {tool_calls}")
        log_pass("SFCEngineer completed")
        return True
    except Exception as e:
        log_fail(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run the full pipeline test."""
    print(f"\n{'='*60}")
    print(f"  🧪 Color Sorting System - Full Pipeline Test")
    print(f"{'='*60}")

    # Check if spec.md already exists (skip step 1 if so)
    spec_path = os.path.join(TEST_PROJECT, "spec.md")
    if os.path.exists(spec_path):
        log_info(f"spec.md already exists, skipping Step 1")
        with open(spec_path, "r", encoding="utf-8") as f:
            spec_content = f.read()
        print(f"{GREEN}✅ Step 1 Complete - spec.md exists ({len(spec_content)} chars){RESET}")
    else:
        # Step 1: Generate spec from PDF
        spec_content = await step1_generate_spec()
        if not spec_content:
            print(f"\n{RED}❌ Pipeline failed at Step 1{RESET}")
            return False
        print(f"\n{GREEN}✅ Step 1 Complete - spec.md generated{RESET}")

    # Step 2: Run SpecAnalyst
    result = await step2_spec_analyst()
    if result:
        print(f"\n{GREEN}✅ Step 2 Complete - I/O variables extracted{RESET}")
    else:
        print(f"\n{RED}❌ Pipeline failed at Step 2{RESET}")
        return False

    # Step 3: Run GsrsmEngineer
    result = await step3_gsrsm_engineer()
    if result:
        print(f"\n{GREEN}✅ Step 3 Complete - GSRSM modes updated{RESET}")
    else:
        print(f"\n{RED}❌ Pipeline failed at Step 3{RESET}")
        return False

    # Step 4: Run SFCEngineer
    result = await step4_sfc_engineer()
    if result:
        print(f"\n{GREEN}✅ Step 4 Complete - SFC code compiled{RESET}")
    else:
        print(f"\n{RED}❌ Pipeline failed at Step 4{RESET}")
        return False

    print(f"\n{'='*60}")
    print(f"  🎉 Full Pipeline Complete!")
    print(f"{'='*60}")
    return True


if __name__ == "__main__":
    asyncio.run(main())

