# GRAFCET Connection Constraints Implementation

## Overview
This document describes the implementation of strict connection constraints for transitions between steps in the GRAFCET editor. The implementation ensures that **every transition must connect from the center-bottom point of the source step to the center-top point of the destination step**.

## Key Requirements Implemented

### 1. Fixed Connection Points ✅
- **Source Connection Point**: Always center-bottom of the source element
- **Target Connection Point**: Always center-top of the target element
- **Non-negotiable**: These connection points cannot be modified or overridden

### 2. Connection Path Routing ✅
- Connections follow vertical-horizontal-vertical path segments
- First and last segments maintain exact X positions of element centers
- Middle segments can be adjusted but anchor points remain fixed

### 3. Automatic Constraint Enforcement ✅
- Connections are automatically validated and corrected when elements move
- Manual connection editing is constrained to prevent anchor point violations
- Real-time validation with visual feedback

### 4. Visual Feedback ✅
- Connection anchor points are visually indicated when elements are selected
- Constraint violations are highlighted with red coloring and warning indicators
- Clear "IN" and "OUT" labels show the fixed connection directions

## Implementation Details

### Core Functions

#### `calculateConnectionPoints(sourceElement, targetElement)`
- **Location**: `src/utils/connectionUtils.ts`
- **Purpose**: Calculates the strict connection points between two elements
- **Constraint**: Always returns center-bottom to center-top points
- **Handles**: Both normal and upward flow connections

#### `validateConnectionConstraints(sourceElement, targetElement, connection)`
- **Location**: `src/utils/connectionUtils.ts`
- **Purpose**: Validates that a connection follows strict constraints
- **Returns**: `{ isValid: boolean, violations: string[] }`
- **Tolerance**: 1px tolerance for floating-point precision

#### `enforceConnectionConstraints(connection, sourceElement, targetElement, obstacles)`
- **Location**: `src/utils/connectionUtils.ts`
- **Purpose**: Regenerates connection path with strict constraints
- **Usage**: Called when constraint violations are detected

#### `generateSimpleConnectionPath(start, end)`
- **Location**: `src/utils/connectionUtils.ts`
- **Enhanced**: Now enforces strict start/end point preservation
- **Path Types**: Direct vertical (aligned) or 3-segment vertical-horizontal-vertical

### Store Integration

#### Enhanced `useElementsStore`
- **New Methods**:
  - `validateAllConnections()`: Validates all connections in the store
  - `enforceAllConnectionConstraints()`: Fixes all constraint violations
- **Enhanced Methods**:
  - `updateConnectionRouting()`: Now uses strict constraint enforcement
  - `addConnection()`: Automatically applies constraints during creation

### Visual Components

#### Enhanced Step Component
- **Visual Indicators**: Shows connection anchor points when selected
- **Labels**: "IN" (top) and "OUT" (bottom) labels for clarity
- **Colors**: Green indicators for connection points

#### Enhanced Transition Component
- **Visual Indicators**: Shows connection anchor points when selected
- **Labels**: "IN" (top) and "OUT" (bottom) labels for clarity
- **Colors**: Orange indicators for connection points

#### Enhanced Connection Component
- **Constraint Validation**: Real-time validation of connection constraints
- **Visual Feedback**: Red coloring for constraint violations
- **Warning Indicators**: Warning symbols at violation points
- **Protected Anchors**: First and last segments cannot be modified to break constraints

### Drag System Integration

#### Enhanced `useProfessionalDrag`
- **Automatic Enforcement**: Calls `enforceAllConnectionConstraints()` after element movement
- **Real-time Updates**: Maintains connections during drag operations
- **Constraint Preservation**: Ensures constraints are never violated during movement

### User Interface Enhancements

#### Properties Panel
- **Constraint Status**: Shows validation status for selected connections
- **Violation Details**: Lists specific constraint violations
- **Action Buttons**: "Recalculate Route" and "Enforce Constraints" buttons

#### Context Menu
- **Connection Validation**: Right-click option to validate connection constraints
- **Constraint Enforcement**: Right-click option to enforce constraints
- **Visual Feedback**: Toast notifications for validation results

## Usage Examples

### Creating a Connection
```typescript
const store = useElementsStore.getState();
const step1 = store.addStep({ x: 100, y: 100 });
const step2 = store.addStep({ x: 200, y: 200 });

// Connection automatically follows strict constraints
const connection = store.addConnection(step1.id, step2.id);
```

### Validating Connections
```typescript
const store = useElementsStore.getState();
const result = store.validateAllConnections();

console.log(`Valid connections: ${result.validConnections}`);
console.log(`Violations: ${result.violations.length}`);
```

### Enforcing Constraints
```typescript
const store = useElementsStore.getState();
store.enforceAllConnectionConstraints(); // Fixes all violations
```

## Testing

### Automated Tests
- **Location**: `src/test/connectionConstraints.test.ts`
- **Coverage**: Connection point calculation, path generation, validation, enforcement
- **Store Tests**: `src/test/elementsStore.test.ts`

### Manual Testing
- **Location**: `src/test/manualConnectionTest.ts`
- **Usage**: Run in browser console with `runConnectionConstraintTests()`
- **Coverage**: End-to-end testing of all constraint features

## Constraint Enforcement Scenarios

### 1. Element Creation
- New connections automatically follow strict constraints
- No user intervention required

### 2. Element Movement
- Connections automatically update to maintain constraints
- Real-time validation and correction

### 3. Manual Connection Editing
- First and last segments are protected from modification
- Middle segments can be adjusted without breaking anchor constraints
- Automatic correction if violations are detected

### 4. Import/Load Operations
- All loaded connections are validated
- Constraint violations are automatically corrected
- User is notified of any corrections made

## Benefits

1. **Consistency**: All connections follow the same strict pattern
2. **Reliability**: No possibility of creating invalid connections
3. **User Experience**: Clear visual feedback and automatic correction
4. **Maintainability**: Centralized constraint logic with comprehensive validation
5. **GRAFCET Compliance**: Ensures proper GRAFCET flow representation

## Future Enhancements

1. **Performance Optimization**: Batch validation for large diagrams
2. **Advanced Routing**: Obstacle avoidance while maintaining constraints
3. **User Preferences**: Optional constraint strictness levels
4. **Export Validation**: Ensure exported diagrams maintain constraints

## Conclusion

The strict connection constraints implementation ensures that the GRAFCET editor maintains proper flow representation at all times. The combination of automatic enforcement, visual feedback, and comprehensive validation provides a robust foundation for creating accurate GRAFCET diagrams.
