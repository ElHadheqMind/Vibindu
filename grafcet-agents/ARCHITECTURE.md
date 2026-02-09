# Agent Architecture: Vibe Coding SFC Gemma

This directory contains the Python-based agent system for the Automation Forge.
The architecture is designed to be "Innovative" and "Autonomous", leveraging LLMs (Gemini/Ollama) to act as engineers rather than just text generators.

## Core Philosophy: "Vibe Coding"
The agents do not just output code; they **validate** it.
1.  **Generate**: Agent produces SFC DSL code.
2.  **Compile**: Agent immediately sends code to the backend compiler.
3.  **Fix**: If compilation fails, the agent self-corrects.
4.  **Configure**: Once compiled, the agent automatically configures the simulation environment (`index.sim`) so the user can hit "Play" immediately.

## Agents

### 1. Analyst (`analyst.py`)
-   **Role**: Senior System Analyst.
-   **Input**: User natural language description.
-   **Output**: Structured variables list (Inputs, Outputs, Internal).
-   **Goal**: Understand the physical system.

### 2. Gemma Architect (`gemma_architect.py`)
-   **Role**: System Architect.
-   **Input**: Variables and requirements.
-   **Output**: GEMMA Modes (A1, F1, etc.).
-   **Goal**: Define the high-level operating modes.

### 3. SFC Engineer (`sfc_engineer.py`)
-   **Role**: Control Engineer.
-   **Input**: Mode definition and variables.
-   **Output**: Validated, Compiled SFC Logic.
-   **Tools**: `SfcCompilerTool`.
-   **Behavior**:
    -   Generates code.
    -   loops: Code -> Compile -> Check Errors -> Fix -> Compile.
    -   Returns only when valid.

### 4. Simulator (`simulator.py`)
-   **Role**: Field Engineer / Tester.
-   **Input**: Compiled SFC and project path.
-   **Output**: Simulation Configuration (`index.sim`).
-   **Tools**: `SimulationConfigTool`.
-   **Behavior**:
    -   Analyzes the logic.
    -   Extracts signals.
    -   Calls backend to save `index.sim`.

## Tooling (`toolkit.py`)

The agents interact with the external world (Backend) via tools:

-   **`SfcCompilerTool`**:
    -   Endpoint: `POST /api/sfc/compile`
    -   Usage: verifies DSL syntax and logic structure.

-   **`SimulationConfigTool`**:
    -   Endpoint: `POST /api/simulation/save`
    -   Usage: Persists variables and actions to the user's project so the frontend stays in sync.

## Flow (`orchestrator.py`)

The orchestrator manages the state and routing:
1.  User Input (WebSocket) -> `Analyst`.
2.  `Analyst` -> `GemmaArchitect`.
3.  For each Mode: `GemmaArchitect` -> `SFCEngineer` (Loop) -> `Simulator`.
4.  Final Result -> User Client.
