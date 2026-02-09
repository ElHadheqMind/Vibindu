# ============================================================================
# GRAFCET STATE - Unified State Management for All Agents
# ============================================================================
"""
This module defines the GrafcetState class that provides a unified state
container for all agents in the pipeline. Each agent reads from and writes
to specific state keys, enabling proper data flow between agents.

State Flow:
    SpecAnalyst     → reads: spec_content, project_path
                    → writes: io_data (variables, actions)
    
    GsrsmEngineer   → reads: io_data, project_path
                    → writes: gsrsm_data (modes, transitions)
    
    ConductSFCAgent → reads: gsrsm_data, io_data, project_path
                    → writes: conduct_result, sfc_files
    
    ModeSFC_*       → reads: mode_context, io_data, project_path, gsrsm_data
                    → writes: mode_{id}_result, sfc_files (appends)
    
    SimulationAgent → reads: sfc_files, gsrsm_data, io_data, project_path
                    → writes: validation_result
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime


@dataclass
class IOData:
    """IO configuration extracted by SpecAnalyst."""
    variables: List[Dict[str, Any]] = field(default_factory=list)
    actions: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {"variables": self.variables, "actions": self.actions}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "IOData":
        return cls(
            variables=data.get("variables", data.get("transition_variables", [])),
            actions=data.get("actions", [])
        )


@dataclass
class GsrsmMode:
    """A single GSRSM mode definition."""
    id: str
    name: str
    description: str
    category: str = "A"  # A, D, or F
    activated: bool = True
    conduct_step: int = 1  # Position in conduct.sfc
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "activated": self.activated,
            "conduct_step": self.conduct_step
        }


@dataclass
class GsrsmTransition:
    """A transition between GSRSM modes."""
    id: str
    from_mode: str
    to_mode: str
    condition: str
    activated: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "fromMode": self.from_mode,
            "toMode": self.to_mode,
            "condition": self.condition,
            "activated": self.activated
        }


@dataclass
class GsrsmData:
    """GSRSM configuration created by GsrsmEngineer."""
    modes: List[GsrsmMode] = field(default_factory=list)
    transitions: List[GsrsmTransition] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "modes": [m.to_dict() for m in self.modes],
            "transitions": [t.to_dict() for t in self.transitions]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GsrsmData":
        modes = []
        for i, m in enumerate(data.get("modes", []), start=1):
            modes.append(GsrsmMode(
                id=m.get("id", m.get("code", f"M{i}")),
                name=m.get("name", m.get("title", f"Mode {i}")),
                description=m.get("description", ""),
                category=m.get("category", m.get("id", "A")[0] if m.get("id") else "A"),
                activated=m.get("activated", True),
                conduct_step=i
            ))
        
        transitions = []
        for t in data.get("transitions", []):
            transitions.append(GsrsmTransition(
                id=t.get("id", f"{t.get('fromMode', '')}-{t.get('toMode', '')}"),
                from_mode=t.get("fromMode", ""),
                to_mode=t.get("toMode", ""),
                condition=t.get("condition", "TRUE"),
                activated=t.get("activated", True)
            ))
        
        return cls(modes=modes, transitions=transitions)
    
    def get_activated_modes(self) -> List[GsrsmMode]:
        """Return only activated modes."""
        return [m for m in self.modes if m.activated]


@dataclass
class SFCFile:
    """Represents a generated SFC file."""
    name: str           # e.g., "default.sfc", "conduct.sfc"
    mode_id: str        # e.g., "A1", "F1", "" for conduct
    path: str           # Full path where saved
    success: bool
    error: Optional[str] = None
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "mode_id": self.mode_id,
            "path": self.path,
            "success": self.success,
            "error": self.error,
            "generated_at": self.generated_at
        }


@dataclass
class ModeContext:
    """Context passed to each Mode SFC agent."""
    mode_id: str
    mode_name: str
    mode_description: str
    category: str
    conduct_step: int
    io_data: IOData
    project_path: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode_id": self.mode_id,
            "mode_name": self.mode_name,
            "mode_description": self.mode_description,
            "category": self.category,
            "conduct_step": self.conduct_step,
            "io_data": self.io_data.to_dict(),
            "project_path": self.project_path
        }


@dataclass
class ValidationIssue:
    """A single validation issue found during simulation."""
    severity: str  # "error", "warning", "info"
    issue_type: str
    message: str
    mode_id: Optional[str] = None
    step_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "issue_type": self.issue_type,
            "message": self.message,
            "mode_id": self.mode_id,
            "step_id": self.step_id
        }


@dataclass
class ValidationResult:
    """Result of simulation validation."""
    status: str  # "PASS", "FAIL", "PARTIAL"
    sfc_file: str
    mode_id: str
    issues: List[ValidationIssue] = field(default_factory=list)
    steps_visited: List[str] = field(default_factory=list)
    execution_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "sfc_file": self.sfc_file,
            "mode_id": self.mode_id,
            "issues": [i.to_dict() for i in self.issues],
            "steps_visited": self.steps_visited,
            "execution_time_ms": self.execution_time_ms
        }


@dataclass
class GrafcetState:
    """
    Unified state container for all agents in the GRAFCET pipeline.

    This class is the single source of truth for state passing between agents.
    Each agent reads from and writes to specific fields.

    Usage:
        state = GrafcetState(project_path="/path/to/project")
        state.spec_content = "..."  # Set by orchestrator from PDF
        state.io_data = IOData(...)  # Set by SpecAnalyst
        state.gsrsm_data = GsrsmData(...)  # Set by GsrsmEngineer
        # etc.
    """
    # Core project info
    project_path: str = ""
    spec_content: str = ""
    spec_source: str = ""  # Original filename (e.g., "spec.pdf")

    # Agent outputs
    io_data: Optional[IOData] = None
    gsrsm_data: Optional[GsrsmData] = None
    conduct_result: Optional[Dict[str, Any]] = None
    sfc_files: List[SFCFile] = field(default_factory=list)
    mode_results: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    validation_results: List[ValidationResult] = field(default_factory=list)

    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert state to dictionary for serialization."""
        return {
            "project_path": self.project_path,
            "spec_content": self.spec_content,
            "spec_source": self.spec_source,
            "io_data": self.io_data.to_dict() if self.io_data else None,
            "gsrsm_data": self.gsrsm_data.to_dict() if self.gsrsm_data else None,
            "conduct_result": self.conduct_result,
            "sfc_files": [f.to_dict() for f in self.sfc_files],
            "mode_results": self.mode_results,
            "validation_results": [v.to_dict() for v in self.validation_results],
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GrafcetState":
        """Create state from dictionary."""
        state = cls(
            project_path=data.get("project_path", ""),
            spec_content=data.get("spec_content", ""),
            spec_source=data.get("spec_source", "")
        )

        if data.get("io_data"):
            state.io_data = IOData.from_dict(data["io_data"])

        if data.get("gsrsm_data"):
            state.gsrsm_data = GsrsmData.from_dict(data["gsrsm_data"])

        state.conduct_result = data.get("conduct_result")
        state.mode_results = data.get("mode_results", {})

        return state

    def add_sfc_file(self, sfc_file: SFCFile):
        """Add a generated SFC file to the state."""
        self.sfc_files.append(sfc_file)
        self.updated_at = datetime.now().isoformat()

    def add_validation_result(self, result: ValidationResult):
        """Add a validation result to the state."""
        self.validation_results.append(result)
        self.updated_at = datetime.now().isoformat()

    def get_mode_contexts(self) -> List[ModeContext]:
        """Generate ModeContext objects for all activated modes."""
        if not self.gsrsm_data or not self.io_data:
            return []

        contexts = []
        for mode in self.gsrsm_data.get_activated_modes():
            contexts.append(ModeContext(
                mode_id=mode.id,
                mode_name=mode.name,
                mode_description=mode.description,
                category=mode.category,
                conduct_step=mode.conduct_step,
                io_data=self.io_data,
                project_path=self.project_path
            ))
        return contexts

    def get_sfc_files_for_simulation(self) -> List[Dict[str, str]]:
        """Get list of SFC files ready for simulation."""
        return [
            {"mode_id": f.mode_id, "file_name": f.name, "path": f.path}
            for f in self.sfc_files
            if f.success
        ]

    def get_io_context_text(self) -> str:
        """Generate text representation of IO for agent prompts."""
        if not self.io_data:
            return ""

        lines = ["## AVAILABLE VARIABLES"]
        for v in self.io_data.variables:
            lines.append(f"- {v['name']} ({v.get('type', 'boolean')}): {v.get('description', '')}")

        lines.append("\n## AVAILABLE ACTIONS")
        for a in self.io_data.actions:
            lines.append(f"- {a['name']}: {a.get('description', '')}")

        return "\n".join(lines)

    def get_gsrsm_context_text(self) -> str:
        """Generate text representation of GSRSM for agent prompts."""
        if not self.gsrsm_data:
            return ""

        lines = ["## GSRSM MODES"]
        for m in self.gsrsm_data.get_activated_modes():
            lines.append(f"- {m.id} ({m.name}): {m.description}")

        lines.append("\n## GSRSM TRANSITIONS")
        for t in self.gsrsm_data.transitions:
            if t.activated:
                lines.append(f"- {t.from_mode} → {t.to_mode}: {t.condition}")

        return "\n".join(lines)


# ============================================================================
# STATE KEYS - Constants for state dictionary keys
# ============================================================================
# These are the keys used in the ADK InvocationContext state dictionary

STATE_KEY_PROJECT_PATH = "project_path"
STATE_KEY_SPEC_CONTENT = "spec_content"
STATE_KEY_SPEC_SOURCE = "spec_source"
STATE_KEY_IO_DATA = "io_data"
STATE_KEY_GSRSM_DATA = "gsrsm_data"
STATE_KEY_CONDUCT_RESULT = "conduct_result"
STATE_KEY_SFC_FILES = "sfc_files"
STATE_KEY_MODE_RESULTS = "mode_results"
STATE_KEY_VALIDATION_RESULTS = "validation_results"


def state_to_context(state: GrafcetState) -> Dict[str, Any]:
    """Convert GrafcetState to a context dictionary for ADK agents."""
    return {
        STATE_KEY_PROJECT_PATH: state.project_path,
        STATE_KEY_SPEC_CONTENT: state.spec_content,
        STATE_KEY_SPEC_SOURCE: state.spec_source,
        STATE_KEY_IO_DATA: state.io_data.to_dict() if state.io_data else None,
        STATE_KEY_GSRSM_DATA: state.gsrsm_data.to_dict() if state.gsrsm_data else None,
        STATE_KEY_CONDUCT_RESULT: state.conduct_result,
        STATE_KEY_SFC_FILES: [f.to_dict() for f in state.sfc_files],
        STATE_KEY_MODE_RESULTS: state.mode_results,
        STATE_KEY_VALIDATION_RESULTS: [v.to_dict() for v in state.validation_results],
    }


def context_to_state(context: Dict[str, Any]) -> GrafcetState:
    """Convert a context dictionary to GrafcetState."""
    return GrafcetState.from_dict(context)

