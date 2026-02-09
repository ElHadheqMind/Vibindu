# Manages agent context and project state across agent lifecycle.

from typing import Dict, List, Any
import json

class ContextManager:
    def __init__(self):
        self._context = {
            "variables": [],
            "modes": [],
            "sfc_logic": {},
            "verification_reports": {}
        }
    
    def update_variables(self, variables: List[Dict]):
        self._context["variables"] = variables
        
    def update_modes(self, modes: List[Dict]):
        self._context["modes"] = modes
        
    def get_context(self) -> Dict:
        return self._context
        
    def add_sfc_for_mode(self, mode_id: str, sfc_data: Dict):
        self._context["sfc_logic"][mode_id] = sfc_data
        
    def add_verification_report(self, mode_id: str, report: Dict):
        self._context["verification_reports"][mode_id] = report
        
    def get_mode_context(self, mode_id: str) -> Dict:
        """
        Returns a specific context package for a single mode loop.
        """
        mode_def = next((m for m in self._context["modes"] if m["id"] == mode_id), None)
        return {
            "variables": self._context["variables"],
            "current_mode": mode_def,
            "global_constraints": [] # To be implemented
        }
    
    def clear(self):
        self.__init__()
