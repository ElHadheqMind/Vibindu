"""
Real Pipeline Test - Simulates VibeSidebar WebSocket Flow
==========================================================

This script replicates EXACTLY what happens when you:
1. Upload a PDF in VibeSidebar
2. Send the prompt: "Build the complete automation project..."

Run with: python run_real_pipeline.py
"""

import os
import sys
import asyncio

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Configuration - SAME AS VIBESIDEBAR
PDF_PATH = r"C:\Users\pc\Desktop\G7V0101\GAI\Color Sorting System.pdf"
PROJECT_PATH = "users/agent/ColorSortingTest"

# THE EXACT PROMPT FROM VIBESIDEBAR
VIBE_PROMPT = """Build the complete automation project from this specification:

1. **Extract I/O Configuration**: Identify all inputs (sensors, buttons, switches) and outputs (motors, valves, actuators, indicators)

2. **Design GSRSM Modes**: Create the operating modes following IEC 61131-3 GEMMA:
   - A1: Initial Stop
   - A5: Restart Preparation
   - A6: Reset/Initialization
   - D1: Emergency Stop
   - F1: Normal Production

3. **Generate Conduct SFC**: Create the master coordination chart (conduct.sfc) that orchestrates mode transitions

4. **Generate Mode SFCs**: Create individual SFC files for each operating mode with proper steps, transitions, and actions

Execute all agents in sequence: SpecAnalyst → GsrsmEngineer → ConductSFC → ModeSFCs"""


def log_agent(agent_name: str, message: str):
    """Log agent output with color coding."""
    colors = {
        "Orchestrator": MAGENTA,
        "SpecGenerator": CYAN,
        "SpecAnalyst": GREEN,
        "GsrsmEngineer": YELLOW,
        "ConductSFCAgent": CYAN,
        "ModeSFC": GREEN,
        "SimulationAgent": MAGENTA,
        "ThinkingForge": BOLD,
    }
    color = colors.get(agent_name, RESET)
    print(f"{color}[{agent_name}]{RESET} {message}")


def log_section(title: str):
    """Log section header."""
    print(f"\n{BOLD}{'='*70}{RESET}")
    print(f"  {BOLD}{title}{RESET}")
    print(f"{BOLD}{'='*70}{RESET}\n")


async def main():
    """Run the full pipeline exactly like VibeSidebar."""
    
    log_section("🚀 REAL PIPELINE TEST - Simulating VibeSidebar Flow")
    
    # Step 1: Check API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(f"{RED}❌ GEMINI_API_KEY not set in environment{RESET}")
        return False
    log_agent("Orchestrator", f"✅ Gemini API key found")
    
    # Step 2: Check PDF exists
    if not os.path.exists(PDF_PATH):
        print(f"{RED}❌ PDF not found: {PDF_PATH}{RESET}")
        return False
    log_agent("Orchestrator", f"📄 PDF: {PDF_PATH}")
    log_agent("Orchestrator", f"📁 Project: {PROJECT_PATH}")
    
    # Step 3: Upload PDF to Gemini Files API (same as orchestrator.py)
    log_section("Step 1: Upload PDF to Gemini Files API")
    
    from google import genai
    client = genai.Client(api_key=api_key)
    
    log_agent("Orchestrator", "Uploading PDF to Gemini...")
    uploaded_file = client.files.upload(file=PDF_PATH)
    log_agent("Orchestrator", f"✅ Uploaded: {uploaded_file.name}")
    log_agent("Orchestrator", f"   URI: {uploaded_file.uri}")
    
    # Step 4: Generate spec.md using SpecGenerator (same as orchestrator.py)
    log_section("Step 2: Generate spec.md from PDF (SpecGenerator)")
    
    from spec_generator import spec_generator
    
    spec_chunks = []
    async def stream_callback(chunk: str):
        spec_chunks.append(chunk)
        # Print first 100 chars of each chunk
        preview = chunk[:80].replace('\n', ' ')
        if preview:
            print(f"{CYAN}  ...{preview}...{RESET}")
    
    log_agent("SpecGenerator", "Analyzing PDF and generating specification...")
    spec_result = await spec_generator.generate_spec_from_pdf(
        file_uri=uploaded_file.uri,
        mime_type="application/pdf",
        project_path=PROJECT_PATH,
        stream_callback=stream_callback
    )
    
    if not spec_result.success:
        print(f"{RED}❌ Spec generation failed: {spec_result.error}{RESET}")
        return False
    
    spec_content = spec_result.spec_content
    log_agent("SpecGenerator", f"✅ Generated spec.md ({len(spec_content)} chars, {spec_result.images_described} figures)")
    
    # Step 5: Run ADK Orchestrator with full prompt (same as orchestrator.py WebSocket flow)
    log_section("Step 3: Run ADK Orchestrator (ThinkingForge)")
    
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    from adk_swarm import get_configured_swarm
    
    # Build enhanced prompt (same as orchestrator.py lines 640-648)
    enhanced_prompt = f"""[PROJECT CONTEXT]
Project Path: {PROJECT_PATH}

[SPECIFICATION DOCUMENT: Color Sorting System.pdf]

The following specification was extracted from the attached PDF:

---
{spec_content}
---

IMPORTANT: When calling tools, use this EXACT project_path: {PROJECT_PATH}

User request: {VIBE_PROMPT}"""

    # Use Gemini 3 models only
    MODEL = "gemini-3-flash-preview"  # or gemini-3-pro-preview
    log_agent("ThinkingForge", f"Creating orchestrator with {MODEL}...")

    # Create configured swarm (same as orchestrator.py line 718-726)
    swarm = get_configured_swarm(model=MODEL, thinking_level="low")
    session_service = InMemorySessionService()
    runner = Runner(agent=swarm, app_name="real_test", session_service=session_service)
    
    # Create session with state (same as orchestrator.py)
    # Include spec_content in state so agents can access it
    session = await session_service.create_session(
        app_name="real_test",
        user_id="test_user",
        state={
            "project_path": PROJECT_PATH,
            "spec_content": spec_content,  # Critical for agents
            "sfc_files": [],
            "validation_results": []
        }
    )
    
    log_agent("ThinkingForge", f"Session created: {session.id}")
    log_agent("ThinkingForge", "Starting agent pipeline...")
    print()
    
    # Run the orchestrator and stream events (same as orchestrator.py lines 738-856)
    message = Content(role="user", parts=[Part(text=enhanced_prompt)])
    current_agent = "ThinkingForge"
    event_count = 0
    full_response = ""

    # Retry logic for 503 errors
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            async for event in runner.run_async(
                user_id="test_user",
                session_id=session.id,
                new_message=message
            ):
                event_count += 1
                agent_name = getattr(event, 'author', None) or current_agent

                # Debug: show event type
                event_type = type(event).__name__

                # Track agent handoffs
                if agent_name != current_agent and agent_name != 'user':
                    print()
                    log_agent(agent_name, f"🔄 Agent activated")
                    current_agent = agent_name

                # Process content
                if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        # Thinking output
                        if getattr(part, 'thought', False) and hasattr(part, 'text') and part.text:
                            thought_preview = part.text[:100].replace('\n', ' ')
                            log_agent(agent_name, f"🧠 {thought_preview}...")

                        # Text output
                        elif hasattr(part, 'text') and part.text:
                            full_response += part.text
                            text_preview = part.text[:100].replace('\n', ' ')
                            log_agent(agent_name, f"💬 {text_preview}...")

                        # Tool calls
                        if hasattr(part, 'function_call') and part.function_call:
                            fc = part.function_call
                            args_preview = str(fc.args)[:100] if hasattr(fc, 'args') else ''
                            log_agent(agent_name, f"🔧 Tool call: {fc.name}")
                            if args_preview:
                                log_agent(agent_name, f"   Args: {args_preview}...")

                        # Tool results - show detailed info
                        if hasattr(part, 'function_response') and part.function_response:
                            fr = part.function_response
                            resp = getattr(fr, 'response', {}) or {}
                            if isinstance(resp, dict):
                                success = resp.get('success', True)
                                msg = resp.get('message', '')
                                error = resp.get('error', '')
                                emoji = "✅" if success else "❌"
                                detail = msg or error or ''
                                log_agent(agent_name, f"{emoji} Tool result: {fr.name} - {detail[:100]}")
                            else:
                                log_agent(agent_name, f"📦 Tool result: {fr.name}")
                else:
                    # Event without content
                    log_agent(agent_name, f"📨 Event: {event_type}")

            # If we get here, no error - break the retry loop
            break

        except Exception as e:
            retry_count += 1
            error_msg = str(e)
            if "503" in error_msg or "overloaded" in error_msg.lower():
                if retry_count < max_retries:
                    log_agent("Orchestrator", f"⚠️ Model overloaded, retrying ({retry_count}/{max_retries})...")
                    await asyncio.sleep(5)  # Wait 5 seconds before retry
                    continue
            log_agent("Orchestrator", f"❌ Error: {error_msg[:200]}")
            import traceback
            traceback.print_exc()
            return False

    # Summary
    log_section("Pipeline Complete")
    log_agent("Orchestrator", f"Total events processed: {event_count}")
    log_agent("Orchestrator", f"Response length: {len(full_response)} chars")
    
    if full_response:
        print(f"\n{BOLD}Final Response:{RESET}")
        print(full_response[:500] + "..." if len(full_response) > 500 else full_response)
    
    print(f"\n{GREEN}{'='*70}{RESET}")
    print(f"{GREEN}  🎉 Pipeline completed successfully!{RESET}")
    print(f"{GREEN}{'='*70}{RESET}\n")
    
    return True


if __name__ == "__main__":
    asyncio.run(main())

