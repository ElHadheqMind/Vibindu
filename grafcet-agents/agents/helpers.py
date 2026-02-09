# ============================================================================
# HELPER FUNCTIONS - Utility functions for ADK agent workflows
# ============================================================================
# This file contains helper functions extracted from adk_swarm.py
# to keep the main agent definitions file clean and focused.

import json
import logging
from typing import List, Dict, Any, Optional

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from sfc_programmer import ModeContext
from simulation_agent import (
    run_simulation_validation,
    get_validation_summary,
    FeedbackGenerator
)

logger = logging.getLogger(__name__)


# ============================================================================
# MODE CONTEXT BUILDERS
# ============================================================================

def build_mode_step_mapping(gsrsm_data: dict) -> Dict[str, int]:
    """
    Build mapping of mode_id to Conduct SFC step number.

    This determines the step number offset for each mode:
    - Mode at Conduct Step 1 → Steps start at 10
    - Mode at Conduct Step 2 → Steps start at 20
    - Mode at Conduct Step N → Steps start at N*10

    Args:
        gsrsm_data: GSRSM data with modes and transitions

    Returns:
        Dict mapping mode_id to conduct_step_number
    """
    modes = gsrsm_data.get("modes", [])
    activated_modes = [m for m in modes if m.get("activated", False)]

    mode_step_mapping = {}
    step_num = 1  # Step 0 is Initial in Conduct SFC

    for mode in activated_modes:
        mode_id = mode.get("id") or mode.get("code")
        if mode_id:
            mode_step_mapping[mode_id] = step_num
            step_num += 1

    return mode_step_mapping


def build_mode_contexts(gsrsm_data: dict) -> List[ModeContext]:
    """
    Build list of ModeContext objects from GSRSM data.

    Args:
        gsrsm_data: GSRSM data with modes and transitions

    Returns:
        List of ModeContext objects for use with workflow agents
    """
    modes = gsrsm_data.get("modes", [])
    transitions = gsrsm_data.get("transitions", [])
    activated_modes = [m for m in modes if m.get("activated", False)]

    # Build transition lookup
    entry_conditions = {}
    exit_conditions = {}
    for t in transitions:
        to_mode = t.get("toMode")
        from_mode = t.get("fromMode")
        condition = t.get("condition", "")

        if to_mode:
            entry_conditions.setdefault(to_mode, []).append(condition)
        if from_mode:
            exit_conditions.setdefault(from_mode, []).append(condition)

    mode_contexts = []
    for idx, mode in enumerate(activated_modes, start=1):
        mode_id = mode.get("id") or mode.get("code")
        if not mode_id:
            continue

        # Determine category from first letter
        category = mode_id[0].upper() if mode_id else "A"

        mode_contexts.append(ModeContext(
            mode_id=mode_id,
            name=mode.get("name", f"Mode {mode_id}"),
            description=mode.get("description", ""),
            entry_conditions=entry_conditions.get(mode_id, []),
            exit_conditions=exit_conditions.get(mode_id, []),
            category=category,
            conduct_step=idx
        ))

    return mode_contexts


def build_io_context(io_data: dict) -> Dict[str, Any]:
    """
    Build IO context dictionary from IO data.

    Args:
        io_data: IO data from SpecAnalyst

    Returns:
        Dict with variables and actions
    """
    return {
        "variables": io_data.get("variables", io_data.get("transition_variables", [])),
        "actions": io_data.get("actions", [])
    }


def format_io_for_instruction(io_context: Dict[str, Any]) -> str:
    """
    Format IO context as text for agent instructions.

    Args:
        io_context: Dict with variables and actions

    Returns:
        Formatted string for inclusion in agent instructions
    """
    vars_text = "\n".join([
        f"- {v['name']} ({v.get('type', 'boolean')}): {v.get('description', '')}"
        for v in io_context.get('variables', [])
    ])
    actions_text = "\n".join([
        f"- {a['name']}: {a.get('description', '')}"
        for a in io_context.get('actions', [])
    ])
    return f"## AVAILABLE VARIABLES\n{vars_text}\n\n## AVAILABLE ACTIONS\n{actions_text}"



# ============================================================================
# WORKFLOW EXECUTION FUNCTIONS
# ============================================================================

async def run_sfc_generation_pipeline(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict,
    create_pipeline_fn
) -> dict:
    """
    Run the SFC generation pipeline using ADK workflow agents.

    Architecture:
    ┌─────────────────────────────────────────────────────────────────┐
    │  Phase 1 (SEQUENTIAL): ConductSFCAgent → conduct.sfc            │
    │  Phase 2 (PARALLEL): All Mode SFC agents run concurrently       │
    │    ├── ModeSFC_A1 → a1/default.sfc                              │
    │    ├── ModeSFC_F1 → f1/default.sfc                              │
    │    └── ...                                                      │
    └─────────────────────────────────────────────────────────────────┘

    Args:
        project_path: Path to the project
        gsrsm_data: Output from GsrsmEngineer containing modes and transitions
        io_data: Output from SpecAnalyst containing variables and actions
        create_pipeline_fn: Function to create the SFC generation pipeline

    Returns:
        dict with success status, conduct SFC result, and per-mode results
    """
    results = {
        "conduct_sfc": None,
        "mode_sfcs": [],
        "mode_step_mapping": {},
        "success": False
    }

    try:
        # Build mode contexts from GSRSM data
        mode_contexts = build_mode_contexts(gsrsm_data)
        results["mode_step_mapping"] = build_mode_step_mapping(gsrsm_data)

        if not mode_contexts:
            results["error"] = "No activated modes found in GSRSM data"
            return results

        # Create the SFC generation pipeline
        io_context = build_io_context(io_data)
        pipeline = create_pipeline_fn(mode_contexts, io_context)

        # Build the prompt with context
        prompt = f"""Generate all SFC files for this automation system.

## Project Path: {project_path}

## GSRSM Data:
```json
{json.dumps(gsrsm_data, indent=2)}
```

## IO Configuration:
```json
{json.dumps(io_context, indent=2)}
```

First generate the Conduct SFC (master orchestrator), then generate each mode's SFC.
"""

        # Run the pipeline using Runner + InMemorySessionService (ADK best practice)
        APP_NAME = "sfc_generation_pipeline"
        USER_ID = "system"

        session_service = InMemorySessionService()
        runner = Runner(
            agent=pipeline,
            app_name=APP_NAME,
            session_service=session_service
        )

        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID
        )

        result_text = ""
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session.id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=prompt)]
            )
        ):
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        result_text += part.text

        results["success"] = True
        results["agent_response"] = result_text
        results["summary"] = f"Pipeline completed for {len(mode_contexts)} modes"

        return results

    except Exception as e:
        logger.error(f"SFC generation pipeline failed: {e}")
        results["error"] = str(e)
        results["summary"] = f"Pipeline failed: {str(e)}"
        return results


# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

async def validate_all_modes(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict
) -> dict:
    """
    Validate all generated SFCs using the Simulation Agent.

    Args:
        project_path: Path to the project
        gsrsm_data: Output from GsrsmEngineer containing modes and transitions
        io_data: Output from SpecAnalyst containing variables and actions

    Returns:
        dict with validation results and feedback
    """
    try:
        result = await run_simulation_validation(project_path, gsrsm_data, io_data)

        return {
            "success": result.all_passed,
            "summary": result.summary(),
            "total_modes": result.total_modes,
            "passed": result.passed,
            "failed": result.failed,
            "results": [
                {
                    "mode_id": r.mode_id,
                    "mode_name": r.mode_name,
                    "status": r.status,
                    "error_count": r.error_count,
                    "warning_count": r.warning_count,
                    "issues": [i.to_dict() for i in r.issues],
                    "feedback": FeedbackGenerator.generate_feedback(r)
                }
                for r in result.results
            ],
            "validation_summary": get_validation_summary(result)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": f"Validation failed: {str(e)}"
        }


async def run_full_pipeline(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict,
    create_pipeline_fn,
    skip_validation: bool = False
) -> dict:
    """
    Runs the complete SFC generation and validation pipeline.

    Args:
        project_path: Path to the project
        gsrsm_data: GSRSM data with modes and transitions
        io_data: IO configuration with variables and actions
        create_pipeline_fn: Function to create the SFC generation pipeline
        skip_validation: If True, skip simulation validation

    Returns:
        dict with results from all pipeline stages
    """
    results = {
        "sfc_generation": None,
        "validation": None,
        "success": False
    }

    try:
        # Step 1: Generate all SFCs
        sfc_result = await run_sfc_generation_pipeline(
            project_path, gsrsm_data, io_data, create_pipeline_fn
        )
        results["sfc_generation"] = sfc_result

        if not sfc_result.get("success"):
            results["error"] = sfc_result.get("error", "SFC generation failed")
            return results

        # Step 2: Validate (if not skipped)
        if not skip_validation:
            validation_result = await validate_all_modes(project_path, gsrsm_data, io_data)
            results["validation"] = validation_result
            results["success"] = validation_result.get("success", False)
        else:
            results["success"] = True

        return results

    except Exception as e:
        results["error"] = str(e)
        return results