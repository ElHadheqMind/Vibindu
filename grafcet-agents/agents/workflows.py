# ============================================================================
# WORKFLOWS - Pipeline creation and execution functions
# ============================================================================
"""
This module contains workflow creation and execution functions.
Extracted from adk_swarm.py for cleaner separation of concerns.
"""

import logging
from typing import List, Dict, Any, Optional, Callable

from google.adk.agents import SequentialAgent, ParallelAgent
from google.adk.agents.llm_agent import LlmAgent

from sfc_programmer import ModeContext
from helpers import (
    build_mode_step_mapping,
    build_mode_contexts,
    build_io_context,
    format_io_for_instruction,
    run_sfc_generation_pipeline as _run_sfc_generation_pipeline_helper,
    validate_all_modes as _validate_all_modes_helper,
    run_full_pipeline as _run_full_pipeline_helper
)

logger = logging.getLogger(__name__)


# ============================================================================
# PIPELINE FACTORY FUNCTIONS
# ============================================================================

def create_sfc_generation_pipeline(
    conduct_sfc_agent: LlmAgent,
    modes_parallel_agent: ParallelAgent
) -> SequentialAgent:
    """
    Creates the SFC generation pipeline: Conduct SFC → Parallel Mode SFCs.

    Args:
        conduct_sfc_agent: The conduct SFC agent
        modes_parallel_agent: The parallel agent for mode SFCs

    Returns:
        SequentialAgent that generates all SFC files
    """
    return SequentialAgent(
        name="SFCGenerationPipeline",
        description="Sequential pipeline: Conduct SFC first, then all mode SFCs in parallel.",
        sub_agents=[conduct_sfc_agent, modes_parallel_agent]
    )


def create_full_automation_pipeline(
    spec_analyst: LlmAgent,
    gsrsm_engineer: LlmAgent,
    conduct_sfc_agent: LlmAgent,
    modes_parallel_agent: ParallelAgent,
    simulation_agent: LlmAgent = None
) -> SequentialAgent:
    """
    Creates the complete automation pipeline:
    SpecAnalyst → GsrsmEngineer → SFC Generation

    Note: Simulation is NOT included in the build pipeline by default.
    Use SimulationAgent explicitly when the user requests simulation.

    Args:
        spec_analyst: The spec analyst agent
        gsrsm_engineer: The GSRSM engineer agent
        conduct_sfc_agent: The conduct SFC agent
        modes_parallel_agent: The parallel agent for mode SFCs
        simulation_agent: Optional simulation agent (only included if provided)

    Returns:
        SequentialAgent for the complete pipeline
    """
    sfc_pipeline = create_sfc_generation_pipeline(conduct_sfc_agent, modes_parallel_agent)

    sub_agents = [spec_analyst, gsrsm_engineer, sfc_pipeline]

    # Only include simulation if explicitly provided
    if simulation_agent is not None:
        sub_agents.append(simulation_agent)

    return SequentialAgent(
        name="FullAutomationPipeline",
        description="Complete automation pipeline: IO extraction → GSRSM design → SFC generation.",
        sub_agents=sub_agents
    )


# ============================================================================
# WORKFLOW EXECUTION FUNCTIONS
# ============================================================================

async def run_sfc_generation_pipeline(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict,
    pipeline_factory: Callable
) -> dict:
    """
    Run the SFC generation pipeline using ADK workflow agents.
    
    Args:
        project_path: Path to the project
        gsrsm_data: GSRSM data dictionary
        io_data: IO data dictionary
        pipeline_factory: Factory function to create the pipeline
    """
    return await _run_sfc_generation_pipeline_helper(
        project_path, gsrsm_data, io_data, pipeline_factory
    )


async def validate_all_modes(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict
) -> dict:
    """
    Validate all generated SFCs using the Simulation Agent.
    """
    return await _validate_all_modes_helper(project_path, gsrsm_data, io_data)


async def run_full_pipeline(
    project_path: str,
    gsrsm_data: dict,
    io_data: dict,
    pipeline_factory: Callable,
    skip_validation: bool = False
) -> dict:
    """
    Runs the complete SFC generation and validation pipeline.
    
    Args:
        project_path: Path to the project
        gsrsm_data: GSRSM data dictionary
        io_data: IO data dictionary
        pipeline_factory: Factory function to create the pipeline
        skip_validation: Whether to skip validation step
    """
    return await _run_full_pipeline_helper(
        project_path, gsrsm_data, io_data, pipeline_factory, skip_validation
    )


def get_sfc_programmer_tool(program_all_modes_fn: Callable) -> Callable:
    """Returns the SFC Programmer tool for use in the toolkit."""
    return program_all_modes_fn


def get_simulation_agent_tool(validate_all_modes_fn: Callable) -> Callable:
    """Returns the Simulation Agent tool for use in the toolkit."""
    return validate_all_modes_fn

