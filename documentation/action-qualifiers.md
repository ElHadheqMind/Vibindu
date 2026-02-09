# SFC Action Qualifiers Guide

This guide explains the different action qualifiers available in the GRAFCET editor, based on the IEC 61131-3 standard for Sequential Function Charts (SFC).

## What are Action Qualifiers?

Action qualifiers define **how** and **when** an action associated with a step is executed. They control the timing, storage, and behavior of actions throughout the step's lifecycle.

---

## Available Qualifiers

### **N - Non-Stored (Normal)**
- **Description**: The action is active **only while the step is active**.
- **Use Case**: Default behavior for most actions. The action starts when the step activates and stops when the step deactivates.
- **GrafScript**: `Action "Name"` (Default) or `(Condition="N")`
- **Example**: `Motor_ON` - Turn on a motor while a step is active.

```
┌─────────────┐
│  N │ Motor_ON │
└─────────────┘
```

---

### **S - Set (Stored)**
- **Description**: The action is **set (turned ON)** when the step activates and **remains ON** even after the step deactivates.
- **Use Case**: Actions that need to persist beyond the step's lifetime.
- **GrafScript**: `Action "Name" (Condition="S")`
- **Example**: `Alarm_ON` - Activate an alarm that stays on until explicitly reset.
- **Note**: Typically paired with an **R (Reset)** action in another step.

```
┌─────────────┐
│  S │ Alarm_ON │
└─────────────┘
```

---

### **R - Reset**
- **Description**: The action is **reset (turned OFF)** when the step activates.
- **Use Case**: Used to turn off actions that were previously set with **S**.
- **GrafScript**: `Action "Name" (Condition="R")`
- **Example**: `Alarm_OFF` - Deactivate the alarm.

```
┌──────────────┐
│  R │ Alarm_OFF │
└──────────────┘
```

---

### **L - Time Limited**
- **Description**: The action is active for a **limited duration** after the step activates, even if the step remains active longer.
- **Duration**: Specify the time limit (e.g., `5s`, `200ms`).
- **Use Case**: Actions that should only run for a specific time.
- **GrafScript**: `Action "Name" (Condition="L", Type="Temporal")` (Note: Duration handled via UI or specific syntax extensions)
- **Example**: `Buzzer_ON` for 3 seconds.

```
┌──────────────────┐
│  L │ Buzzer_ON    │
│    │ t=3s         │
└──────────────────┘
```

---

### **D - Time Delayed**
- **Description**: The action starts **after a delay** once the step activates. It remains active as long as the step is active.
- **Duration**: Specify the delay time (e.g., `2s`, `500ms`).
- **Use Case**: Actions that should start after a waiting period.
- **GrafScript**: `Action "Name" (Condition="D", Type="Temporal")`
- **Example**: `Valve_Open` after 2 seconds.

```
┌──────────────────┐
│  D │ Valve_Open   │
│    │ t=2s         │
└──────────────────┘
```

---

### **P - Pulse**
- **Description**: The action is executed as a **single pulse** when the step activates.
- **Duration**: Specify the pulse duration (e.g., `100ms`).
- **Use Case**: Momentary actions like triggering a counter or sending a signal.
- **GrafScript**: `Action "Name" (Condition="P", Type="Temporal")`
- **Example**: `Counter_Increment` for 100ms.

```
┌─────────────────────────┐
│  P │ Counter_Increment   │
│    │ t=100ms             │
└─────────────────────────┘
```

---

### **SD - Stored & Delayed**
- **Description**: Combines **S** and **D**. The action is set after a delay and remains on even after the step deactivates.
- **Duration**: Specify the delay time.
- **Use Case**: Actions that need to persist and start after a delay.
- **GrafScript**: `Action "Name" (Condition="SD", Type="Temporal")`
- **Example**: `Heater_ON` after 5 seconds, stays on.

```
┌──────────────────┐
│ SD │ Heater_ON    │
│    │ t=5s         │
└──────────────────┘
```

---

### **DS - Delayed & Stored**
- **Description**: Similar to **SD**, but the action is stored first, then delayed.
- **Duration**: Specify the delay time.
- **Use Case**: Rare; used in specific control scenarios.
- **GrafScript**: `Action "Name" (Condition="DS", Type="Temporal")`

```
┌──────────────────┐
│ DS │ Action_Name  │
│    │ t=2s         │
└──────────────────┘
```

---

### **SL - Stored & Limited**
- **Description**: Combines **S** and **L**. The action is set for a limited time, then remains stored.
- **Duration**: Specify the time limit.
- **Use Case**: Actions that run for a specific duration and then persist.
- **GrafScript**: `Action "Name" (Condition="SL", Type="Temporal")`
- **Example**: `Pump_ON` for 10 seconds, then stays on.

```
┌──────────────────┐
│ SL │ Pump_ON      │
│    │ t=10s        │
└──────────────────┘
```

---

## How to Use Action Qualifiers

### Step 1: Create or Select an Action Block
- Add a step to your GRAFCET diagram.
- An action block is automatically created for normal steps.

### Step 2: Open the Action Properties Modal
- **Double-click** the action block to open the editor.

### Step 3: Configure the Action
1. **Qualifier**: Select the appropriate qualifier from the dropdown (N, S, R, D, L, P, etc.).
2. **Variable/Action**: Enter the variable or action name (e.g., `Motor_ON`, `Valve_Close`).
3. **Duration** (if applicable): For time-based qualifiers (D, L, P, SD, DS, SL), enter the duration (e.g., `5s`, `200ms`).
4. **Condition** (optional): Add a condition for conditional execution (e.g., `Sensor_A AND NOT Sensor_B`).

### Step 4: Save
- Click **Confirm** to apply the changes.
- The action block will visually display the qualifier and duration.

---

## Visual Representation

Action blocks are rendered with:
- **Qualifier Box** (left): Shows the qualifier letter (e.g., `D`, `S`, `N`).
- **Variable/Action** (center): The action name.
- **Duration** (bottom, if applicable): Displays `t=...` for time-based actions.

Example:
```
┌──────────────────┐
│  D │ Motor_ON     │
│    │ t=2s         │
└──────────────────┘
```

---

## Common Use Cases

### Example 1: Start a Motor (Normal)
- **Qualifier**: `N`
- **Variable**: `Motor_ON`
- **Behavior**: Motor runs while the step is active.

### Example 2: Activate an Alarm (Set)
- **Qualifier**: `S`
- **Variable**: `Alarm_ON`
- **Behavior**: Alarm turns on and stays on until reset.

### Example 3: Reset the Alarm (Reset)
- **Qualifier**: `R`
- **Variable**: `Alarm_ON`
- **Behavior**: Alarm turns off.

### Example 4: Delayed Valve Opening
- **Qualifier**: `D`
- **Variable**: `Valve_Open`
- **Duration**: `3s`
- **Behavior**: Valve opens 3 seconds after the step activates.

### Example 5: Pulse a Counter
- **Qualifier**: `P`
- **Variable**: `Counter_Inc`
- **Duration**: `100ms`
- **Behavior**: Counter increments with a 100ms pulse.

---

## Duration Format

For time-based qualifiers, use the following format:
- **Seconds**: `5s`, `10s`, `0.5s`
- **Milliseconds**: `200ms`, `1000ms`
- **Minutes**: `2m`, `5m` (if supported)

---

## Best Practices

1. **Use N for most actions**: Default to `N` unless you need specific timing or storage behavior.
2. **Pair S with R**: Always reset stored actions to avoid unintended behavior.
3. **Test time-based actions**: Verify that delays and durations work as expected in your control logic.
4. **Document complex qualifiers**: Add comments or descriptions for actions using SD, DS, or SL.

---

## Reference

This implementation follows the **IEC 61131-3** standard for Sequential Function Charts (SFC). For more details, refer to the official IEC documentation or GRAFCET/SFC textbooks.

---

## Need Help?

If you have questions or encounter issues with action qualifiers, please refer to the main documentation or contact support.
