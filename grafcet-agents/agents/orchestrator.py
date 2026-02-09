# Main orchestrator for the VibIndu agent swarm.
# Handles agent routing, tool execution, and communication.
# Load environment variables FIRST, before any other imports
import os
import sys

# Fix Windows console encoding for Unicode (emojis, etc.)
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import asyncio
import base64
import tempfile
from pathlib import Path
from pydantic import BaseModel
from typing import Set, Optional, List, Dict
from dataclasses import dataclass

# --- Gemini Files API for PDF Handling ---
genai_client = None
try:
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai_client = genai.Client(api_key=api_key)
        print("✅ Gemini genai client initialized for PDF handling")
    else:
        print("⚠️  GEMINI_API_KEY not set - PDF uploads will be disabled")
except Exception as e:
    print(f"⚠️  Gemini genai client not available ({e}) - PDF uploads will be disabled")

# --- SpecGenerator for PDF to Markdown conversion ---
from spec_generator import spec_generator, SpecResult


# --- Spec Validation ---
SPEC_VALIDATION_KEYWORDS = [
    "io configuration", "inputs", "outputs", "sensors", "actuators",
    "sequence", "step", "transition", "grafcet", "sfc", "plc",
    "automation", "process", "conveyor", "motor", "valve", "safety",
    "e-stop", "emergency", "interlock", "timing", "cycle", "mode"
]

def validate_spec_content(content: str) -> tuple[bool, str]:
    """
    Validate if the generated spec content appears to be a valid automation specification.

    Returns:
        (is_valid, message) tuple
    """
    content_lower = content.lower()

    # Count how many spec-related keywords are found
    found_keywords = [kw for kw in SPEC_VALIDATION_KEYWORDS if kw in content_lower]
    keyword_count = len(found_keywords)

    # Check for essential sections
    has_io = "input" in content_lower or "output" in content_lower or "i/o" in content_lower
    has_sequence = "sequence" in content_lower or "step" in content_lower or "process" in content_lower
    has_equipment = "motor" in content_lower or "sensor" in content_lower or "actuator" in content_lower or "valve" in content_lower

    # Validation logic
    if keyword_count >= 5 and (has_io or has_sequence or has_equipment):
        return True, f"✅ Valid spec detected ({keyword_count} automation keywords found)"
    elif keyword_count >= 3:
        return True, f"⚠️ Partial spec detected ({keyword_count} keywords). May require manual review."
    else:
        return False, f"❌ This document doesn't appear to be an automation specification. Please upload a document containing: process description, I/O configuration, sequence of operations, or equipment specifications."


# --- Default VibIndu Agent Test Prompt ---
DEFAULT_VIBE_PROMPT = """Build the complete automation project from this specification:

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


@dataclass
class UploadedFile:
    """Represents a file uploaded to Gemini Files API."""
    name: str
    uri: str
    mime_type: str
    display_name: str

    def to_part(self):
        """Convert to a format suitable for Gemini content."""
        return {"file_data": {"file_uri": self.uri, "mime_type": self.mime_type}}


class PDFHandler:
    """
    Handles PDF file uploads to Gemini Files API.

    Uses Gemini's native multimodal PDF understanding - does NOT convert to text.
    This preserves formatting, tables, diagrams, and visual context.
    """

    SUPPORTED_MIME_TYPES = {
        "application/pdf": ".pdf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }

    def __init__(self):
        self.uploaded_files: List[UploadedFile] = []
        self.temp_files: List[str] = []

    async def process_file_from_base64(
        self,
        file_data: dict,
        websocket: Optional[WebSocket] = None
    ) -> Optional[UploadedFile]:
        """
        Process a file from base64 data and upload to Gemini Files API.

        Args:
            file_data: Dict with 'name', 'type', and 'data' (base64 string)
            websocket: Optional WebSocket for status updates

        Returns:
            UploadedFile object if successful, None otherwise
        """
        if not genai_client:
            print("[PDFHandler] ❌ Gemini client not available")
            return None

        file_name = file_data.get("name", "document.pdf")
        mime_type = file_data.get("type", "application/pdf")
        base64_data = file_data.get("data", "")

        # Validate mime type
        if mime_type not in self.SUPPORTED_MIME_TYPES:
            print(f"[PDFHandler] ⚠️ Unsupported mime type: {mime_type}")
            return None

        # Extract base64 content (remove data URL prefix if present)
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]

        if not base64_data:
            print("[PDFHandler] ❌ No file data provided")
            return None

        try:
            # Decode base64 to bytes
            file_bytes = base64.b64decode(base64_data)
            file_size_kb = len(file_bytes) / 1024
            print(f"[PDFHandler] 📄 Processing: {file_name} ({file_size_kb:.1f} KB)")

            # No static status message - upload silently, let model output speak

            # Save to temporary file
            suffix = self.SUPPORTED_MIME_TYPES.get(mime_type, ".pdf")
            with tempfile.NamedTemporaryFile(
                suffix=suffix,
                delete=False,
                prefix="gemini_upload_"
            ) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
                self.temp_files.append(temp_path)

            print(f"[PDFHandler] 💾 Saved to temp: {temp_path}")

            # Upload to Gemini Files API
            uploaded = genai_client.files.upload(file=temp_path)

            result = UploadedFile(
                name=uploaded.name,
                uri=uploaded.uri,
                mime_type=mime_type,
                display_name=file_name
            )

            self.uploaded_files.append(result)
            print(f"[PDFHandler] ✅ Uploaded to Gemini: {result.uri}")

            # No static success message - let the model's output speak for itself
            print(f"[PDFHandler] 📄 {file_name} ready for model processing")

            return result

        except Exception as e:
            print(f"[PDFHandler] ❌ Upload failed: {e}")
            if websocket:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"PDF upload failed: {str(e)}"
                }))
            return None

    def cleanup(self):
        """Clean up temporary files and optionally delete from Gemini."""
        for temp_path in self.temp_files:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    print(f"[PDFHandler] 🗑️ Cleaned up: {temp_path}")
            except Exception as e:
                print(f"[PDFHandler] ⚠️ Cleanup failed for {temp_path}: {e}")

        self.temp_files.clear()
        # Note: Gemini files auto-delete after 48 hours
        # We don't delete them immediately as they may be needed for follow-up queries

    def get_files_for_context(self) -> List[dict]:
        """Get uploaded files in a format suitable for agent context."""
        return [
            {
                "name": f.display_name,
                "uri": f.uri,
                "mime_type": f.mime_type,
                "gemini_name": f.name
            }
            for f in self.uploaded_files
        ]


# Global PDF handler instance
pdf_handler = PDFHandler()


# --- Resilient ADK Import ---
# ADK is optional: /tools/execute works without it, only /ws/vibe needs it
adk = None
swarm = None
runner = None
session_service = None
try:
    from google import adk as _adk
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai.types import Content, Part
    adk = _adk
    from adk_swarm import get_swarm, get_toolkit, get_configured_swarm
    swarm = get_swarm()
    toolkit = get_toolkit()

    # Create session service for ADK (runner is created per-request for dynamic config)
    session_service = InMemorySessionService()

    # Default runner (used when no custom config provided)
    runner = Runner(
        agent=swarm,
        app_name="thinking_forge",
        session_service=session_service
    )
    print("✅ ADK loaded successfully - full orchestrator mode (Gemini 3 support)")
except Exception as e:
    print(f"⚠️  ADK not available ({e}) - running in TOOLS-ONLY mode")
    print("   /tools/execute will work, /ws/vibe will return an error")
    # Fallback: import toolkit directly without ADK dependency
    try:
        from toolkit import (
            NavigateTool, SfcCompilerTool, SimulationConfigTool,
            SaveDiagramTool, CreateProjectTool, CreateFileTool,
            ListFilesTool, ActivateModeTool, ConfigureIOTool,
            UpdateGsrsmModesTool, CreateSfcTool
        )
        from project_io_tool import ProjectIOTool
        from simulation_tool import RunSimulationTool
        from stop_simulation_tool import StopSimulationTool
        from compile_save_tool import CompileAndSaveSFCTool
        from get_sfc_tool import GetSFCContentTool
        toolkit = {
            "navigate": NavigateTool().execute,
            "compile_sfc": SfcCompilerTool().execute,
            "save_config": SimulationConfigTool().execute,
            "save_diagram": SaveDiagramTool().execute,
            "create_project": CreateProjectTool().execute,
            "create_file": CreateFileTool().execute,
            "list_files": ListFilesTool().execute,
            "activate_mode": ActivateModeTool().execute,
            "configure_io": ConfigureIOTool().execute,
            "update_gsrsm": UpdateGsrsmModesTool().execute,
            "create_sfc": CreateSfcTool().execute,
            "ProjectIOTool": ProjectIOTool().extract_io_config,
            "GetSFCContent": GetSFCContentTool().get_sfc_content,
            "RunSimulation": RunSimulationTool().run_simulation,
            "StopSimulation": StopSimulationTool().execute,
            "CompileAndSaveSFC": CompileAndSaveSFCTool().compile_and_save_sfc
        }
        print(f"✅ Toolkit loaded in fallback mode ({len(toolkit)} tools available)")
    except Exception as e2:
        print(f"❌ Toolkit also failed to load: {e2}")
        toolkit = {}

app = FastAPI()

# --- WebSocket Client Tracking ---
connected_clients: Set[WebSocket] = set()

# --- Conversation-to-Session Mapping ---
# Maps frontend conversationId to ADK session_id for multi-turn conversations
# This allows the agent to maintain context across multiple messages
conversation_sessions: Dict[str, str] = {}

class ToolRequest(BaseModel):
    tool: str
    projectPath: str
    payload: dict

class BroadcastRequest(BaseModel):
    payload: dict

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/tools/execute")
async def execute_tool(request: ToolRequest):
    print(f"[V3 ADK] Executing tool: {request.tool} for project: {request.projectPath}")
    
    # 1. Resolve Tool
    tool_func = toolkit.get(request.tool)
    if not tool_func:
        # Try lower case match
        tool_func = toolkit.get(request.tool.lower())
        
    if not tool_func:
        return {"success": False, "message": f"Tool '{request.tool}' not found in toolkit"}

    # 2. Prepare Arguments
    args = request.payload.copy()
    
    # Ensure project_path is available for the tool
    # Tools strictly expect 'project_path' (snake_case)
    if "project_path" not in args:
        args["project_path"] = request.projectPath or args.get("projectPath") or ""

    # Warn if project_path is empty or looks like a bad default
    if not args.get("project_path") or args["project_path"] in ("default_project", "None", "null"):
        print(f"[V3 ADK] ⚠️ Warning: project_path is '{args.get('project_path')}' - tools may fail. Ensure a project is open.")

    # Remove 'tool' and 'projectPath' (camelCase) from kwargs if they exist
    # as they would cause "unexpected keyword argument" errors
    if "tool" in args: del args["tool"]
    if "projectPath" in args: del args["projectPath"]

    # 3. Execute
    try:
        result = await tool_func(**args)
        return {"success": True, "result": result}
    except Exception as e:
        print(f"[V3 ADK] Tool Execution Error: {e}")
        return {"success": False, "message": str(e)}

@app.get("/")
async def root():
    return {
        "message": "🏗️ VibIndu Agent - ADK Native V3",
        "adk_available": adk is not None,
        "tools_available": list(toolkit.keys()) if toolkit else [],
        "features": ["LLM Agents", "Sub-Agents", "Native Tools"] if adk else ["Tools Only"]
    }

@app.get("/tools/list")
async def list_tools():
    """List all available tools and their status."""
    return {
        "success": True,
        "tools": list(toolkit.keys()) if toolkit else [],
        "count": len(toolkit) if toolkit else 0,
        "adk_mode": adk is not None
    }

# --- Broadcast Helper ---
async def broadcast_to_clients(payload: dict):
    """Send a message to all connected WebSocket clients."""
    if not connected_clients:
        print(f"[Broadcast] ⚠️ No connected clients to broadcast to")
        return 0

    message = json.dumps(payload)
    disconnected = set()
    sent = 0

    for client in connected_clients:
        try:
            await client.send_text(message)
            sent += 1
        except Exception as e:
            print(f"[Broadcast] Client send failed: {e}")
            disconnected.add(client)

    # Clean up disconnected clients
    for client in disconnected:
        connected_clients.discard(client)

    print(f"[Broadcast] 📡 Sent '{payload.get('type', '?')}' to {sent}/{sent + len(disconnected)} clients")
    return sent


@app.post("/api/broadcast")
async def broadcast_endpoint(request: Request):
    """
    Receive broadcast messages from backend or tools and relay to all WebSocket clients.
    Expected body: { "payload": { "type": "sim_panel_open", ... } }
    """
    try:
        body = await request.json()
        payload = body.get("payload", body)

        msg_type = payload.get("type", "unknown")
        print(f"[API Broadcast] 📨 Received: {msg_type}")

        sent = await broadcast_to_clients(payload)

        return {
            "success": True,
            "type": msg_type,
            "clientsNotified": sent
        }
    except Exception as e:
        print(f"[API Broadcast] ❌ Error: {e}")
        return {"success": False, "error": str(e)}


@app.websocket("/ws/vibe")
async def websocket_vibe_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for frontend clients and ADK agent interactions."""
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"[WS] ✅ Client connected ({len(connected_clients)} total)")

    try:
        if not adk or not swarm:
            # TOOLS-ONLY mode: keep connection alive for receiving broadcasts
            await websocket.send_text(json.dumps({
                "type": "status",
                "message": "Connected in TOOLS-ONLY mode. Broadcasts will be relayed."
            }))
            # Keep alive — just wait for messages (or disconnect)
            while True:
                try:
                    data = await websocket.receive_text()
                    # In TOOLS-ONLY mode, we can still handle simple pings
                    message = json.loads(data)
                    if message.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except WebSocketDisconnect:
                    break
                except Exception:
                    break
        else:
            # Full ADK mode with PDF support
            # Create a session-specific PDF handler for cleanup
            session_pdf_handler = PDFHandler()

            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    # --- Connection State Tracking ---
                    ws_connected = True  # Track if WebSocket is still connected

                    # --- Enhanced Streaming Helper ---
                    async def send_ws(msg_type: str, text: str, agent: str = None, **extra):
                        """Send a typed WebSocket message to this client. Handles disconnects gracefully."""
                        nonlocal ws_connected
                        if not ws_connected:
                            return  # Skip if already disconnected

                        payload = {"type": msg_type, "text": text, "agent": agent or swarm.name}
                        payload.update(extra)
                        try:
                            await websocket.send_text(json.dumps(payload))
                        except (WebSocketDisconnect, Exception) as e:
                            ws_connected = False
                            print(f"[WS] Client disconnected during send: {type(e).__name__}")

                    # ADK Streaming Callback — captures ALL agent activity
                    async def adk_callback(token: str, metadata: dict = None):
                        meta = metadata or {}
                        agent_name = meta.get("agent", swarm.name)
                        event_type = meta.get("type", "token")

                        if event_type == "thinking":
                            await send_ws("thinking", token, agent_name)
                        elif event_type == "task":
                            await send_ws("task", token, agent_name, task=meta.get("task", ""))
                        elif event_type == "tool_call":
                            await send_ws("tool_call", token, agent_name,
                                          tool_name=meta.get("tool_name", ""),
                                          tool_params=meta.get("tool_params", {}))
                        elif event_type == "tool_result":
                            await send_ws("tool_result", token, agent_name,
                                          tool_name=meta.get("tool_name", ""),
                                          tool_result=meta.get("tool_result", {}))
                        elif event_type == "status":
                            await send_ws("status", token, agent_name)
                        else:
                            # Default: stream token
                            await send_ws("token", token, agent_name)

                    user_text = message.get("text", "")

                    # --- Dynamic Model Configuration ---
                    # Extract model and thinking_level from frontend for Gemini 3 support
                    selected_model = message.get("model", "gemini-3-flash-preview")
                    thinking_level = message.get("thinking_level", "low")
                    print(f"[V3 ADK] Running interaction: {user_text[:50]}...")
                    print(f"[V3 ADK] Model: {selected_model}, Thinking Level: {thinking_level}")

                    # --- PDF File Handling ---
                    # Check if a file is attached and process it
                    uploaded_file = None
                    file_data = message.get("file")

                    if file_data and file_data.get("data"):
                        file_type = file_data.get("type", "")
                        file_name = file_data.get("name", "document")

                        print(f"[V3 ADK] 📎 File attached: {file_name} ({file_type})")

                        # Upload PDF/image to Gemini Files API
                        if file_type in PDFHandler.SUPPORTED_MIME_TYPES:
                            # No static message - just upload silently
                            uploaded_file = await session_pdf_handler.process_file_from_base64(
                                file_data,
                                websocket
                            )

                            if uploaded_file:
                                print(f"[V3 ADK] ✅ File uploaded to Gemini: {uploaded_file.uri}")
                            else:
                                await send_ws("error", f"Failed to upload {file_name}", "PDFHandler")
                        else:
                            await send_ws("error", f"⚠️ Unsupported file type: {file_type}", "System")

                    # --- Generate spec.md from PDF using Gemini directly ---
                    # This happens BEFORE ADK agents, providing text context
                    spec_content = None
                    spec_is_valid = False
                    if uploaded_file and uploaded_file.mime_type == "application/pdf":
                        # Get project path from context if available
                        project_path = message.get("project_path") or message.get("projectPath")

                        # Real-time streaming callback for spec generation
                        async def spec_stream_callback(text_chunk: str):
                            """Stream spec generation chunks to the UI in real-time."""
                            await send_ws("stream", text_chunk, "SpecGenerator", partial=True)

                        # Generate spec.md with REAL streaming
                        spec_result = await spec_generator.generate_spec_from_pdf(
                            file_uri=uploaded_file.uri,
                            mime_type=uploaded_file.mime_type,
                            project_path=project_path,
                            stream_callback=spec_stream_callback  # Enable real-time streaming!
                        )

                        if spec_result.success:
                            spec_content = spec_result.spec_content

                            # Validate if this is actually a spec document
                            spec_is_valid, validation_msg = validate_spec_content(spec_content)

                            if spec_is_valid:
                                # No static status - spec content was already streamed
                                print(f"[V3 ADK] ✅ Valid spec: {len(spec_content)} chars, {spec_result.images_described} images")
                            else:
                                # Document is NOT a valid spec - warn the user
                                await send_ws("error", validation_msg, "SpecValidator")
                                await send_ws("agent_response",
                                    "⚠️ **Please upload a valid automation specification document.**\n\n"
                                    "The uploaded document doesn't contain enough automation-related content.\n\n"
                                    "A valid spec should include:\n"
                                    "- **Process Description**: What the system does\n"
                                    "- **I/O Configuration**: Inputs (sensors, buttons) and Outputs (motors, valves)\n"
                                    "- **Sequence of Operations**: Step-by-step process flow\n"
                                    "- **Equipment List**: Motors, conveyors, actuators, etc.\n"
                                    "- **Timing Requirements**: Delays, durations, timeouts\n"
                                    "- **Safety Requirements**: E-Stop, interlocks, guards",
                                    "SpecValidator")
                                # Clear spec_content since it's not valid
                                spec_content = None
                        else:
                            await send_ws("error", f"Document analysis failed: {spec_result.error}", "SpecGenerator")

                    # NOTE: No static messages here - real model output will be streamed
                    # from the ADK event loop below with thinking_planner enabled

                    # --- Build Enhanced Context (State for all agents) ---
                    # This context is passed to ADK and becomes the shared state between agents
                    # All agents read from and write to this shared state
                    enhanced_context = message.copy()

                    # Initialize state keys that agents will use
                    # project_path: Required by all tools and agents
                    project_path = message.get("project_path") or message.get("projectPath") or ""
                    enhanced_context["project_path"] = project_path

                    # sfc_files: Will be populated by SFC agents (empty list to start)
                    if "sfc_files" not in enhanced_context:
                        enhanced_context["sfc_files"] = []

                    # validation_results: Will be populated by SimulationAgent
                    if "validation_results" not in enhanced_context:
                        enhanced_context["validation_results"] = []

                    if spec_content:
                        # Spec was generated from PDF - pass as text context
                        enhanced_context["spec_content"] = spec_content
                        enhanced_context["spec_source"] = uploaded_file.display_name
                        enhanced_context["spec_valid"] = True

                        # Build user text with spec context AND project_path
                        # Use DEFAULT_VIBE_PROMPT if user didn't provide custom text
                        actual_prompt = user_text.strip() if user_text.strip() else DEFAULT_VIBE_PROMPT

                        enhanced_user_text = (
                            f"[PROJECT CONTEXT]\n"
                            f"Project Path: {project_path}\n\n"
                            f"[SPECIFICATION DOCUMENT: {uploaded_file.display_name}]\n\n"
                            f"The following specification was extracted from the attached PDF:\n\n"
                            f"---\n{spec_content}\n---\n\n"
                            f"IMPORTANT: When calling tools, use this EXACT project_path: {project_path}\n\n"
                            f"User request: {actual_prompt}"
                        )
                    elif uploaded_file:
                        # Non-PDF file (image) - use multimodal approach
                        enhanced_context["attached_files"] = [{
                            "name": uploaded_file.display_name,
                            "uri": uploaded_file.uri,
                            "mime_type": uploaded_file.mime_type,
                            "gemini_name": uploaded_file.name
                        }]
                        enhanced_context["multimodal_content"] = [
                            uploaded_file.to_part(),
                            {"text": user_text}
                        ]
                        enhanced_user_text = (
                            f"[PROJECT CONTEXT]\n"
                            f"Project Path: {project_path}\n\n"
                            f"[ATTACHED IMAGE: {uploaded_file.display_name}]\n"
                            f"User request: {user_text}"
                        )
                    else:
                        # No file attached - just user text with project context
                        enhanced_user_text = (
                            f"[PROJECT CONTEXT]\n"
                            f"Project Path: {project_path}\n\n"
                            f"User request: {user_text}"
                        )

                    try:
                        # --- Multi-turn Conversation Support ---
                        # Get or create session based on conversationId from frontend
                        import uuid
                        conversation_id = message.get("conversationId")

                        session = None
                        if conversation_id and conversation_id in conversation_sessions:
                            # Reuse existing session for this conversation
                            existing_session_id = conversation_sessions[conversation_id]
                            try:
                                session = await session_service.get_session(
                                    app_name="thinking_forge",
                                    user_id="vibe_user",
                                    session_id=existing_session_id
                                )
                                print(f"[V3 ADK] ♻️ Reusing session {existing_session_id} for conversation {conversation_id}")
                            except Exception as e:
                                print(f"[V3 ADK] ⚠️ Session not found, creating new: {e}")
                                session = None

                        if session is None:
                            # Create new session
                            session = await session_service.create_session(
                                app_name="thinking_forge",
                                user_id="vibe_user",
                                state=enhanced_context
                            )
                            # Store mapping for future messages in this conversation
                            if conversation_id:
                                conversation_sessions[conversation_id] = session.id
                                print(f"[V3 ADK] 🆕 Created session {session.id} for conversation {conversation_id}")
                            else:
                                print(f"[V3 ADK] 🆕 Created one-shot session {session.id} (no conversationId)")

                        # Create content for the runner
                        user_content = Content(
                            role="user",
                            parts=[Part(text=enhanced_user_text)]
                        )

                        # --- Create Dynamic Runner with Model/Thinking Level from Frontend ---
                        # This allows real-time configuration of Gemini 3 models
                        dynamic_swarm = get_configured_swarm(
                            model=selected_model,
                            thinking_level=thinking_level
                        )
                        dynamic_runner = Runner(
                            agent=dynamic_swarm,
                            app_name="thinking_forge",
                            session_service=session_service
                        )

                        # Run ADK with streaming - REAL MODEL OUTPUT STREAMING (token by token)
                        full_response = ""
                        agent_responses = {}  # Track responses per agent for individual saves
                        current_agent = dynamic_swarm.name
                        last_streamed_agent = None  # Track agent for streaming continuity
                        event_count = 0  # Debug counter
                        tool_calls_made = []  # Track tool calls for summary if no text response
                        tool_results = []  # Track tool results
                        pending_transfers = []  # Track transfer_to_agent actions for manual execution
                        max_transfer_iterations = 10  # Prevent infinite loops
                        transfer_iteration = 0
                        current_message = user_content  # Message to send (changes on transfers)

                        print(f"[V3 ADK] 🚀 Starting ADK run_async with model={selected_model}")

                        # Main execution loop - continues while there are pending transfers
                        while transfer_iteration <= max_transfer_iterations:
                            transfer_iteration += 1
                            pending_transfers = []  # Reset for this iteration

                            if transfer_iteration > 1:
                                print(f"[V3 ADK] 🔄 Transfer iteration #{transfer_iteration}")

                            async for event in dynamic_runner.run_async(
                                user_id="vibe_user",
                                session_id=session.id,
                                new_message=current_message
                            ):
                                event_count += 1
                                # Debug: Print raw event info with more details
                                has_content = hasattr(event, 'content') and event.content is not None
                                has_actions = hasattr(event, 'actions') and event.actions is not None
                                is_final = getattr(event, 'is_final', None)
                                print(f"[V3 ADK] Event #{event_count}: author={getattr(event, 'author', 'N/A')}, partial={getattr(event, 'partial', 'N/A')}, has_content={has_content}, has_actions={has_actions}, is_final={is_final}")

                                # Debug: Print all event attributes to understand the structure
                                if event_count <= 5:  # Only for first 5 events to avoid spam
                                    try:
                                        event_attrs = {k: str(v)[:100] for k, v in vars(event).items() if not k.startswith('_')}
                                        print(f"[V3 ADK] Event #{event_count} attrs: {event_attrs}")
                                    except Exception as e:
                                        print(f"[V3 ADK] Event #{event_count} attrs error: {e}")

                                # Get the agent name from the event
                                agent_name = getattr(event, 'author', None) or dynamic_swarm.name

                                # Detect agent handoffs - stream when a new agent takes over
                                if agent_name != current_agent and agent_name != 'user':
                                    # SAVE previous agent's response before switching
                                    if current_agent and current_agent in agent_responses and agent_responses[current_agent]:
                                        prev_response = agent_responses[current_agent]
                                        print(f"[Stream] 💾 Saving {current_agent}'s response ({len(prev_response)} chars) before handoff")
                                        await send_ws("agent_response", prev_response, current_agent)

                                    current_agent = agent_name
                                    # No static handoff message - agent's output will identify itself
                                    print(f"[Stream] Agent handoff: {agent_name}")

                                # Check for transfer_to_agent action (agent delegation)
                                # Track transfers for manual execution after run completes
                                # This is a workaround for ADK issue #644 where transfer_to_agent
                                # doesn't actually transfer control in streaming mode
                                if hasattr(event, 'actions') and event.actions:
                                    transfer_target = getattr(event.actions, 'transfer_to_agent', None)
                                    if transfer_target:
                                        print(f"[Stream] 🎯 Transfer requested to: {transfer_target}")
                                        pending_transfers.append({
                                            'target': transfer_target,
                                            'context': enhanced_context
                                        })

                                # Process content parts - THIS IS THE REAL MODEL OUTPUT
                                if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts'):
                                    parts_count = len(event.content.parts) if hasattr(event.content.parts, '__len__') else 'unknown'
                                    print(f"[DEBUG EVENT] agent={agent_name}, has_content=True, parts_count={parts_count}")

                                    for part_idx, part in enumerate(event.content.parts):
                                        # Check if this is a partial (streaming) chunk
                                        # ADK sets partial=True for streaming chunks
                                        is_partial = getattr(event, 'partial', False)

                                        # Check if this is a THOUGHT part (from BuiltInPlanner with include_thoughts=True)
                                        # When thought=True, the text content IS the model's thinking
                                        # The thought attribute is a boolean - True for thoughts, False or None otherwise
                                        thought_attr = getattr(part, 'thought', None)
                                        is_thought_part = thought_attr is True  # Explicit True check

                                        # Also check for text content
                                        text_content = getattr(part, 'text', None)
                                        has_function_call = hasattr(part, 'function_call') and part.function_call
                                        has_function_response = hasattr(part, 'function_response') and part.function_response

                                        print(f"[DEBUG PART {part_idx}] agent={agent_name}, thought={thought_attr}, is_thought={is_thought_part}, partial={is_partial}, has_text={text_content is not None}, text_len={len(text_content) if text_content else 0}, has_fc={has_function_call}, has_fr={has_function_response}")

                                        # Stream TEXT - the actual model-generated content
                                        if hasattr(part, 'text') and part.text:
                                            text = part.text

                                            # If this is a thought part, stream as "thinking"
                                            if is_thought_part:
                                                await send_ws("thinking", text, agent_name, partial=is_partial)
                                                print(f"[{agent_name}] 🧠 THOUGHT SENT: {text[:100]}..." if len(text) > 100 else f"[{agent_name}] 🧠 THOUGHT SENT: {text}")
                                            else:
                                                # Regular text - add to full response AND per-agent response
                                                full_response += text
                                                last_streamed_agent = agent_name

                                                # Track per-agent response for individual saves on handoff
                                                if agent_name not in agent_responses:
                                                    agent_responses[agent_name] = ""
                                                agent_responses[agent_name] += text

                                                # ALWAYS stream token by token for real-time display
                                                # Send as 'stream' type which VibeSidebar appends to current message
                                                await send_ws("stream", text, agent_name, partial=True)

                                                # Also print to console for debugging
                                                print(f"[{agent_name}] {text[:100]}..." if len(text) > 100 else f"[{agent_name}] {text}")

                                        # Handle FUNCTION CALLS (tool requests)
                                        # Stream REAL tool call data to UI - no static messages
                                        if hasattr(part, 'function_call') and part.function_call:
                                            fc = part.function_call
                                            tool_name = fc.name
                                            # Extract actual tool parameters
                                            tool_params = dict(fc.args) if hasattr(fc, 'args') and fc.args else {}
                                            tool_calls_made.append({"agent": agent_name, "tool": tool_name, "params": tool_params})
                                            print(f"[{agent_name}] Tool call: {tool_name} with params: {tool_params}")
                                            # Stream REAL tool call with actual parameters to UI
                                            await send_ws("tool_call", "", agent_name, tool_name=tool_name, tool_params=tool_params)

                                        # Handle FUNCTION RESPONSES (tool results)
                                        # Stream REAL tool results to UI - no static messages
                                        if hasattr(part, 'function_response') and part.function_response:
                                            fr = part.function_response
                                            # Extract the FULL response data - this is the real output
                                            response_data = getattr(fr, 'response', {}) or {}
                                            if isinstance(response_data, dict):
                                                success = response_data.get('success', True)
                                                tool_results.append({
                                                    "tool": fr.name,
                                                    "success": success,
                                                    "result": response_data,  # Full result data
                                                    "agent": agent_name
                                                })
                                                # Stream REAL tool result with actual data to UI
                                                await send_ws("tool_result", "", agent_name, tool_name=fr.name, tool_result=response_data, success=success)
                                            print(f"[{agent_name}] Tool result: {fr.name} -> {response_data}")

                            # End of async for event loop - check for pending transfers
                            if pending_transfers:
                                # Get the first pending transfer target
                                next_transfer = pending_transfers[0]
                                target_agent = next_transfer['target']
                                print(f"[V3 ADK] 🔄 Processing pending transfer to: {target_agent}")

                                # Create a continuation message that tells the orchestrator to continue with the target agent
                                # This uses ADK's session memory - the orchestrator should pick up where it left off
                                continuation_text = f"Continue with the next step. Execute {target_agent} now."
                                current_message = Content(
                                    role="user",
                                    parts=[Part(text=continuation_text)]
                                )
                                print(f"[V3 ADK] 📨 Sending continuation: {continuation_text}")
                            else:
                                # No more transfers - exit the while loop
                                print(f"[V3 ADK] ✅ No pending transfers, execution complete")
                                break

                        # If we exit the while loop due to max iterations
                        if transfer_iteration > max_transfer_iterations:
                            print(f"[V3 ADK] ⚠️ Max transfer iterations ({max_transfer_iterations}) reached")

                        # Send agent_response with full accumulated text for persistence
                        # This ensures the complete response is saved to conversation history
                        print(f"[V3 ADK] ✅ ADK run completed. Total events: {event_count}, Response length: {len(full_response)}, Iterations: {transfer_iteration}")

                        # NOTE: Removed fallback summary generation
                        # Agents should provide their own text responses via their prompts
                        # If no text response, the UI will just show the agent name without content
                        if not full_response and tool_results:
                            print(f"[V3 ADK] ⚠️ No text response from agents. Tool results: {len(tool_results)}")
                            for result in tool_results:
                                print(f"  - {result.get('agent')}: {result.get('tool')} -> success={result.get('success')}")

                        final_agent = last_streamed_agent or current_agent or dynamic_swarm.name

                        # Only send if client is still connected
                        if ws_connected:
                            try:
                                await websocket.send_text(json.dumps({
                                    "type": "agent_response",
                                    "text": full_response if full_response else "",
                                    "agent": final_agent
                                }))
                            except (WebSocketDisconnect, Exception) as send_err:
                                print(f"[V3 ADK] Could not send final response (client disconnected): {type(send_err).__name__}")
                        else:
                            print(f"[V3 ADK] Skipping final response (client already disconnected)")

                    except Exception as e:
                        print(f"[V3 ADK] Runtime Error: {e}")
                        import traceback
                        traceback.print_exc()
                        # Only try to send error if client is still connected
                        if ws_connected:
                            try:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "message": f"ADK Runtime Error: {str(e)}"
                                }))
                            except (WebSocketDisconnect, Exception):
                                pass  # Client already disconnected
            finally:
                # Clean up temporary files when session ends
                session_pdf_handler.cleanup()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Error: {e}")
    finally:
        connected_clients.discard(websocket)
        print(f"[WS] 🔌 Client disconnected ({len(connected_clients)} remaining)")

if __name__ == "__main__":
    uvicorn.run("orchestrator:app", host="0.0.0.0", port=8000, reload=True)
