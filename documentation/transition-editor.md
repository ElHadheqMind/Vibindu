# Transition Editor Guide

The Transition Editor is a powerful tool for defining the logic that moves your process from one step to the next. It supports both a visual block-based approach and raw GRAFSCRIPT logic.

## 🧱 Block-Based Editing

Instead of typing complex expressions, you can build your conditions using logical blocks:

### 1. Variables & Comparisons
- Select variables from your project.
- Use comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.
- Example: `Temperature > 80`.

### 2. Time-Based Transitions (Timers)
The editor makes it easy to add timing logic:
- **Syntax**: `Step_Number / Duration`
- **Example**: `5 / 3s` (Active 3 seconds after Step 5 starts).
- **Visual Block**: Select the "Timer" block, pick the step, and enter the duration.

### 3. Logical Operators
Combine multiple conditions using standard SFC logic:
- **AND**: All conditions must be true.
- **OR**: At least one condition must be true.
- **NOT**: Inverts a condition.

## ✍️ GRAFSCRIPT Integration

For power users, the "Script Mode" allows you to type logic directly. The compiler validates this in real-time.

```grafscript
Transition "Sensor_A AND NOT (Stop_Button OR T1)"
```

## 🔍 Validation

The editor prevents common logic errors:
- **Undefined Variables**: Highlighting variables that don't exist in the project scope.
- **Syntax Errors**: Providing immediate feedback on malformed expressions.
- **Infinite Loops**: Warning you if a transition logic creates an immediate loop back to the same state without a condition change.

## 🚀 How to Edit a Transition

1. **Double-Click** any transition line (the horizontal bar) on the canvas.
2. The **Transition Modal** will open.
3. Choose between **Guided Mode** (Blocks) or **Advanced Mode** (Text/Script).
4. Click **Confirm** to apply and re-render the diagram.

---

**Next Steps**: Check out the [AND/OR Divergence Rules](compiler-rules.md) for structuring complex sequences.
