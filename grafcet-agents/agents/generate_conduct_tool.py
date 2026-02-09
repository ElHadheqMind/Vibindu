"""
GSRSM-to-Conduct SFC Generator Tool

Generates a Conduct SFC (orchestrator) from GSRSM data.
The Conduct SFC uses Macro steps to link to mode-specific SFC files.

Key Rules:
- Step 0 (Initial) always maps to A1 mode
- All modes become Macro steps with LinkedFile
- Only OR divergences are used (never AND)
- Transition conditions come from GSRSM transitions
- The SFC forms a closed loop (returns to Step 0)
"""

import logging
import aiohttp
import os
import json
import aiofiles
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from base_tool import BaseTool

logger = logging.getLogger(__name__)


@dataclass
class ModeNode:
    """Represents a GSRSM mode in the graph."""
    id: str
    name: str
    activated: bool
    outgoing: List[Tuple[str, str]]  # List of (target_mode_id, condition)
    incoming: List[Tuple[str, str]]  # List of (source_mode_id, condition)


class GsrsmGraph:
    """Graph representation of GSRSM modes and transitions."""
    
    def __init__(self, gsrsm_data: dict):
        self.modes: Dict[str, ModeNode] = {}
        self.transitions: List[dict] = []
        self._build_graph(gsrsm_data)
    
    def _build_graph(self, gsrsm_data: dict):
        """Build graph from GSRSM data."""
        # Initialize modes
        for mode in gsrsm_data.get("modes", []):
            mode_id = mode.get("id") or mode.get("code")
            if mode_id and mode.get("activated", False):
                self.modes[mode_id] = ModeNode(
                    id=mode_id,
                    name=mode.get("name", mode_id),
                    activated=True,
                    outgoing=[],
                    incoming=[]
                )
        
        # Build transition edges
        for trans in gsrsm_data.get("transitions", []):
            if not trans.get("activated", False):
                continue
            
            from_mode = trans.get("fromMode")
            to_mode = trans.get("toMode")
            condition = trans.get("condition", "TRUE")
            
            if from_mode in self.modes and to_mode in self.modes:
                self.modes[from_mode].outgoing.append((to_mode, condition))
                self.modes[to_mode].incoming.append((from_mode, condition))
                self.transitions.append(trans)
    
    def get_activated_modes(self) -> List[str]:
        """Get list of activated mode IDs in priority order."""
        # Priority: A1 first, then A modes, F modes, D modes
        priority = {'A': 0, 'F': 1, 'D': 2}
        modes = list(self.modes.keys())
        modes.sort(key=lambda m: (priority.get(m[0], 9), int(m[1:]) if m[1:].isdigit() else 99))
        return modes


class ConductSFCGenerator:
    """Generates Conduct SFC DSL from GSRSM graph."""
    
    def __init__(self, graph: GsrsmGraph):
        self.graph = graph
        self.step_counter = 0
        self.transition_counter = 0
        self.mode_to_step: Dict[str, int] = {}
        self.lines: List[str] = []
    
    def generate(self) -> str:
        """Generate the complete Conduct SFC DSL code."""
        self.lines = []
        self.step_counter = 0
        self.transition_counter = 0
        self.mode_to_step = {}
        
        # Header
        self.lines.append('SFC "System Conduct - GSRSM Orchestrator"')
        
        # Get activated modes
        modes = self.graph.get_activated_modes()
        if not modes:
            return self._generate_empty_sfc()
        
        # Assign step numbers to modes
        for mode_id in modes:
            self.mode_to_step[mode_id] = self.step_counter
            self.step_counter += 1
        
        # Generate the SFC structure
        self._generate_mode_sequence(modes)
        
        return "\n".join(self.lines)
    
    def _generate_empty_sfc(self) -> str:
        """Generate minimal SFC when no modes are activated."""
        return '''SFC "System Conduct - GSRSM Orchestrator"
Step 0 (Initial)
Transition T0 "TRUE"
Step 0 (Initial)'''
    
    def _generate_mode_sequence(self, modes: List[str]):
        """Generate SFC sequence for all modes."""
        # Start with A1 (or first mode) as Initial
        first_mode = modes[0] if modes else "A1"
        first_step = self.mode_to_step.get(first_mode, 0)
        
        # Step 0 (Initial) - A1
        self.lines.append(f'Step {first_step} (Initial)')
        self.lines.append(f'    LinkedFile "{first_mode}/default"')
        
        # Process each mode's outgoing transitions
        self._generate_transitions_from_mode(first_mode, modes)
    
    def _generate_transitions_from_mode(self, current_mode: str, all_modes: List[str]):
        """Generate transitions from a mode, handling divergences."""
        if current_mode not in self.graph.modes:
            return
        
        node = self.graph.modes[current_mode]
        outgoing = node.outgoing
        
        if not outgoing:
            # No outgoing transitions - loop back to initial
            self.lines.append(f'Transition T{self.transition_counter} "CYCLE_COMPLETE"')
            self.transition_counter += 1
            self.lines.append('Step 0 (Initial)')
            return
        
        if len(outgoing) == 1:
            # Single transition - simple sequence
            target, condition = outgoing[0]
            self._add_transition_to_mode(target, condition, all_modes)
        else:
            # Multiple transitions - OR divergence
            self.lines.append('Divergence OR')
            for target, condition in outgoing:
                self.lines.append('    Branch')
                self._add_transition_to_mode(target, condition, all_modes, indent=8)
                self.lines.append('    EndBranch')
            self.lines.append('EndDivergence')

