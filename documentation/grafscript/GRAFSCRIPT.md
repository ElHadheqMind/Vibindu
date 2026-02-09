# GrafScript Language Reference

> **New to Actions?** Check out the [Action Qualifiers Guide](../action-qualifiers.md) to learn about SFC action types (N, S, R, D, L, P, etc.).

**GrafScript** is a domain-specific language (DSL) designed for defining Sequential Function Charts (SFC), also known as GRAFCET. It provides a human-readable text syntax to describe steps, transitions, actions, and complex control structures like parallel (AND) and alternative (OR) divergences.

## Table of Contents
1. [Introduction](#introduction)
2. [Basic Syntax](#basic-syntax)
   - [Steps](#steps)
   - [Transitions](#transitions)
   - [Actions](#actions)
3. [Control Structures](#control-structures)
   - [AND Divergence (Parallel)](#and-divergence-parallel)
   - [OR Divergence (Selection)](#or-divergence-selection)
   - [Jumps](#jumps)
4. [Validation Rules](#validation-rules)
5. [Complete Examples](#complete-examples)

---

## Introduction

GrafScript allows you to write SFC logic as code. The compiler validates your script and generates the visual diagram automatically.

**Example Snippet:**
```grafscript
Step 1 (Initial)
Transition "Start"
Step 2
    Action "Activate Motor"
Transition "Sensor OK"
Step 3
```

---

## Basic Syntax

### Steps
Steps are the fundamental states of the system.
- **Syntax**: `Step <Number> [(Type)]`
- **Number**: Unique integer identifier.
- **Type** (Optional):
    - `(Initial)`: Double-bordered box (Entry step).
    - `(Task)`: Sub-process or task step.
    - `(Macro)`: Macro step enclosing other logic.
    - *(Default)*: Normal single-bordered box.

**Examples:**
```grafscript
Step 0 (Initial)  // Initial step
Step 1            // Normal step
Step 10 (Macro)   // Macro step
```

### Transitions
Transitions define the conditions to move from one step to another.
- **Syntax**: `Transition <Condition>`
- **Condition**: Logic expression string (e.g., `a AND b`, `T0`).

**Examples:**
```grafscript
Transition "Start_Button"
Transition "Sensor_A AND Sensor_B"
```

### Actions
Actions are operations performed when a step is active. They are defined **immediately after** the `Step` they belong to.
- **Syntax**: `Action "<Description>" [(Type=<Type>, Condition="<Condition>")]`
- **Description**: What the action does (Content).
- **Parameters**:
    - `Type`: `Normal`, `Temporal` (for Delayed/Limited).
    - `Condition`: Maps to the **Qualifier** (e.g., `L`, `D`, `SD`).

**Examples:**
```grafscript
Step 5
    Action "Run Motor"                  // Default (Qualifier=N)
    Action "Open Valve" (Condition="D") // Qualifier=D (Delayed)
    Action "Alarm" (Condition="S")      // Qualifier=S (Stored)
```

---

## Control Structures

### AND Divergence (Parallel)
Executes multiple branches simultaneously.

**Syntax:**
```grafscript
Divergence AND
    Branch
        // Branch 1 logic
    EndBranch
    Branch
        // Branch 2 logic
    EndBranch
Converge // or EndDivergence
```

**Rules:**
1. **Predecessor**: Must be preceded by a `Transition`.
2. **Branches**: Must have at least 2 branches.
3. **Branch Content**: Branches must start with a `Step` and end with a `Step` (Compiler auto-adds the convergence transition).

### OR Divergence (Selection)
Executes only one branch based on transition conditions.

**Syntax:**
```grafscript
Divergence OR
    Branch
        // Branch 1 logic
    EndBranch
    Branch
        // Branch 2 logic
    EndBranch
Converge // or EndDivergence
```

**Rules:**
1. **Predecessor**: Usually preceded by a `Step`.
2. **Branches**: Must have at least 2 branches.
3. **Branch Content**: Every branch must **start with a Transition** and **end with a Transition**.

### Jumps
Jumps allow the flow to loop back or skip forward to another step.
- **Syntax**: `Jump <TargetStepNumber>`

**Example:**
```grafscript
Step 2
Transition "Reset"
Jump 0  // Go back to Step 0
```

---

## Validation Rules

The compiler strictly enforces Grafcet rules to ensure logical correctness.

| Feature | Rule | Explanation |
| :--- | :--- | :--- |
| **Sequence** | **Alternation** | Steps and Transitions must alternate. You cannot have two Steps or two Transitions in a row (except inside specific Divergence structures). |
| **AND Divergence** | **Transition Before** | An AND divergence must always be immediately preceded by a `Transition` to synchronize the split. |
| **AND Branch** | **Ends with Step** | Branches in an AND split must end with a `Step`. The compiler handles the synchronization transition at the convergence point automatically. **Do not put a transition at the end of an AND branch.** |
| **OR Divergence** | **Transition Start** | Each branch in an OR split must strictly begin with a `Transition` representing the condition for that path. |
| **OR Branch** | **Ends with Transition** | Each branch must also end with a `Transition` to merge back into the common path. |

---

## Complete Examples

### Example 1: Simple Sequence
```grafscript
Step 0 (Initial)
Transition "Start"
Step 1
    Action "Initialize"
Transition "Ready"
Step 2
    Action "Process"
    Action "Timeout" (Condition="L", Type="Temporal")
Transition "Done"
Jump 0
```

### Example 2: Parallel Process (AND) - Correct Structure
```grafscript
Step 10
Transition "Fork"
Divergence AND
    Branch
        Step 11
        Transition "T1"
        Step 12
    EndBranch
    Branch
        Step 21
        Transition "T2"
        Step 22
    EndBranch
Converge
// Convergence transition is automatic, so next element is a Step
Step 30
```

### Example 3: Selection (OR)
```grafscript
Step 5
Divergence OR
    Branch
        Transition "Mode A"
        Step 6
            Action "Run A"
        Transition "End A"
    EndBranch
    Branch
        Transition "Mode B"
        Step 7
            Action "Run B"
        Transition "End B"
    EndBranch
Converge
Step 8
```
