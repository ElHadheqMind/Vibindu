import aiohttp
import logging
import os
import json
import aiofiles
from typing import Optional
from base_tool import BaseTool

# ADK 2026: Import ToolContext for direct state management
try:
    from google.adk.tools import ToolContext
except ImportError:
    ToolContext = None  # Fallback for testing

logger = logging.getLogger(__name__)


class CompileAndSaveSFCTool(BaseTool):
    """Compiles SFC DSL code and saves it as a JSON diagram file.

    ADK 2026 Pattern: Uses ToolContext.state for direct state management.
    Appends to: tool_context.state['sfc_files']
    """

    def __init__(
        self,
        compile_url: str = "http://localhost:3001/api/sfc/compile",
        save_url: str = "http://localhost:3001/api/files/save-diagram"
    ):
        super().__init__(
            name="CompileAndSaveSFC",
            description="Compiles SFC DSL code and saves it as a JSON diagram if successful.",
        )
        self.compile_url = compile_url
        self.save_url = save_url

    async def compile_and_save_sfc(
        self,
        sfc_code: str,
        mode_id: str,
        project_path: str,
        sfc_name: str,
        tool_context: Optional["ToolContext"] = None  # ADK 2026: ToolContext for state
    ) -> dict:
        """Compile SFC DSL code and save the resulting diagram to a file.

        Takes SFC DSL source code, compiles it to a GRAFCET diagram JSON structure,
        and saves it to the appropriate location based on the mode_id.

        Args:
            sfc_code: The SFC DSL source code as a string. Must follow SFC DSL syntax:
                - Start with: SFC "Title"
                - Define steps: Step 0 (Initial), Step 1, Step 2, etc.
                - Define transitions: Transition T0 "condition"
                - Use Divergence AND/OR for parallel/alternative paths
            mode_id: GSRSM mode identifier (e.g. "A1", "F1", "D1").
                - If provided: saves to {project_path}/modes/{mode_id}/{sfc_name}.sfc
                - If empty: saves to {project_path}/{sfc_name}.sfc
            project_path: Path to the project folder (e.g. "my_project").
            sfc_name: Name for the output file (without extension, e.g. "default").

        Returns:
            dict with keys:
                - success (bool): True if compilation and save succeeded
                - path (str): Full path where the file was saved
                - message (str): Status message
                - error (str): Error message if failed
        """
        # Construct path based on mode_id
        if mode_id:
            target_dir = f"{project_path}/modes/{mode_id}"
        else:
            target_dir = project_path
            
        logger.info(f"[{self.name}] Compiling SFC: {sfc_name} for Mode: {mode_id} in {target_dir}")
        
        headers = {"x-agent-secret": "antigravity-local-agent"}
        
        async with aiohttp.ClientSession(headers=headers) as session:
            try:
                # 1. Compile
                compile_payload = {"code": sfc_code, "title": sfc_name}
                
                async with session.post(self.compile_url, json=compile_payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return {
                            "success": False, 
                            "error": f"Compilation failed for '{sfc_name}': {error_text}"
                        }
                    
                    data = await response.json()
                    generated_sfc = data.get("generatedSFC")
                    
                    if not generated_sfc:
                        return {
                            "success": False, 
                            "error": f"Compiler returned no SFC data for '{sfc_name}'"
                        }

                # 2. Save locally (bypass backend storage restrictions)
                # Ensure we use .sfc extension as requested
                target_filename = f"{sfc_name}.sfc" if not sfc_name.endswith(".sfc") else sfc_name
                # Ensure we use valid OS separators
                full_target_dir = os.path.normpath(target_dir)
                full_target_path = os.path.join(full_target_dir, target_filename)
                
                # Ensure directory exists
                if not os.path.exists(full_target_dir):
                    try:
                        os.makedirs(full_target_dir, exist_ok=True)
                    except Exception as e:
                         return {"success": False, "error": f"Failed to create directory {full_target_dir}: {str(e)}"}

                try:
                    async with aiofiles.open(full_target_path, mode='w') as f:
                        await f.write(json.dumps(generated_sfc, indent=2))

                    logger.info(f"[{self.name}] Saved locally to {full_target_path}")

                    # SFC file metadata for state tracking
                    # ADK 2026: Store BOTH metadata AND sfc_code for SimulationAgent access
                    sfc_file = {
                        "name": target_filename,
                        "mode_id": mode_id or "",
                        "path": full_target_path,
                        "success": True,
                        "sfc_code": sfc_code,  # Original DSL code
                        "sfc_content": generated_sfc  # Compiled JSON diagram
                    }

                    # ADK 2026: Append to ToolContext.state['sfc_files']
                    if tool_context is not None:
                        if "sfc_files" not in tool_context.state:
                            tool_context.state["sfc_files"] = []
                        tool_context.state["sfc_files"].append(sfc_file)
                        logger.info(f"[{self.name}] Appended sfc_file to tool_context.state['sfc_files']")

                    # Broadcast project_reload to trigger frontend auto-refresh
                    try:
                        async with session.post(
                            "http://127.0.0.1:8000/api/broadcast",
                            json={"payload": {"type": "project_reload"}}
                        ) as broadcast_resp:
                            if broadcast_resp.status == 200:
                                logger.info(f"[{self.name}] Broadcast project_reload sent")
                    except Exception as be:
                        logger.warning(f"[{self.name}] Broadcast failed (non-critical): {be}")

                    return {
                        "success": True,
                        "path": full_target_path,
                        "message": f"Successfully compiled and saved {sfc_name}",
                        "sfc_file": sfc_file
                    }
                except Exception as e:
                    sfc_file = {
                        "name": f"{sfc_name}.sfc",
                        "mode_id": mode_id or "",
                        "path": "",
                        "success": False
                    }
                    # ADK 2026: Track failures too
                    if tool_context is not None:
                        if "sfc_files" not in tool_context.state:
                            tool_context.state["sfc_files"] = []
                        tool_context.state["sfc_files"].append(sfc_file)

                    return {
                        "success": False,
                        "error": f"Local save failed: {str(e)}",
                        "sfc_file": sfc_file
                    }

            except Exception as e:
                logger.error(f"[{self.name}] Failed: {e}")
                sfc_file = {
                    "name": f"{sfc_name}.sfc",
                    "mode_id": mode_id or "",
                    "path": "",
                    "success": False
                }
                return {
                    "success": False,
                    "error": str(e),
                    "sfc_file": sfc_file
                }
