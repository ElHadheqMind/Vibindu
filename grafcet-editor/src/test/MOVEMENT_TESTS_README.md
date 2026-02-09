# GRAFCET Element Movement Tests

This directory contains comprehensive test suites for testing the manual movement functionality of different GRAFCET elements. The tests are organized into separate files to maintain clear separation of concerns and provide focused testing for each element type.

## Test Files Structure

### 1. `transitionMovement.test.ts`
**Purpose**: Tests manual movement functionality for transition elements

**Test Coverage**:
- ✅ Basic drag and drop functionality
- ✅ Connection updates during movement
- ✅ Property preservation during movement
- ✅ Boundary constraints and validation
- ✅ Canvas bounds checking
- ✅ Negative coordinate prevention
- ✅ Constraint validation during movement
- ✅ Collision detection with other transitions
- ✅ Safe position finding
- ✅ Connection exclusion from collisions
- ✅ Undo/redo operations
- ✅ History entry creation
- ✅ Position restoration
- ✅ Multiple consecutive movements
- ✅ Edge cases and error handling
- ✅ Non-existent element handling
- ✅ Invalid coordinates handling
- ✅ Extreme coordinate values
- ✅ Number uniqueness maintenance
- ✅ Rapid consecutive movements
- ✅ Constraint violation handling

### 2. `actionMovement.test.ts`
**Purpose**: Tests manual movement functionality for action block elements

**Test Coverage**:
- ✅ Basic drag and drop functionality
- ✅ Property preservation during movement
- ✅ Parent-child relationship maintenance
- ✅ Action reindexing after movement
- ✅ Layout constraints and positioning
- ✅ Horizontal layout constraints
- ✅ Proper spacing between action blocks
- ✅ Vertical alignment with parent step
- ✅ First action positioning
- ✅ Collision detection with other actions and steps
- ✅ Safe position finding
- ✅ Smart positioning
- ✅ Boundary constraints and validation
- ✅ Canvas bounds checking
- ✅ Negative coordinate prevention
- ✅ Undo/redo operations
- ✅ Action ordering preservation
- ✅ Edge cases and error handling
- ✅ Orphaned action handling
- ✅ Missing parent handling
- ✅ Index consistency maintenance
- ✅ Corrupted data handling
- ✅ Concurrent movements

### 3. `movementTestSuite.test.ts`
**Purpose**: Integration tests for multi-element movement scenarios

**Test Coverage**:
- ✅ Multi-element movement integration
- ✅ Simultaneous movement of different element types
- ✅ Relationship maintenance during complex movements
- ✅ Action reindexing when parent moves
- ✅ Performance and stress testing
- ✅ Rapid movement performance
- ✅ Many elements efficiency
- ✅ Cross-element collision detection
- ✅ Different element type collisions
- ✅ Safe position finding across types
- ✅ History and state management integration
- ✅ Consistent history across movements
- ✅ Multi-element undo/redo
- ✅ Error recovery and resilience
- ✅ Graceful error recovery
- ✅ Store consistency after errors

## Running the Tests

### Run All Movement Tests
```bash
npm test -- --run src/test/transitionMovement.test.ts src/test/actionMovement.test.ts src/test/movementTestSuite.test.ts
```

### Run Individual Test Files
```bash
# Transition movement tests only
npm test -- --run src/test/transitionMovement.test.ts

# Action movement tests only
npm test -- --run src/test/actionMovement.test.ts

# Integration tests only
npm test -- --run src/test/movementTestSuite.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch src/test/transitionMovement.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage src/test/transitionMovement.test.ts src/test/actionMovement.test.ts src/test/movementTestSuite.test.ts
```

## Test Framework and Dependencies

### Framework
- **Vitest**: Modern testing framework with TypeScript support
- **jsdom**: Browser environment simulation
- **vi**: Mocking utilities

### Mocked Dependencies
- `../utils/collisionDetection`: Collision detection utilities
- `../utils/connectionUtils`: Connection constraint utilities
- `konva`: Canvas rendering library (mocked in setup.ts)

### Store Dependencies
- `useElementsStore`: Element management and operations
- `useEditorStore`: Editor state and tools
- `useHistoryStore`: Undo/redo functionality

## Test Patterns and Best Practices

### 1. Store Reset Pattern
Each test starts with a clean state:
```typescript
beforeEach(() => {
  useElementsStore.setState({ elements: [], selectedElementIds: [] });
  useEditorStore.setState({ currentTool: 'select', dragState: { ... } });
  useHistoryStore.getState().clearHistory();
});
```

### 2. Mock Cleanup Pattern
Mocks are cleared after each test:
```typescript
afterEach(() => {
  vi.clearAllMocks();
});
```

### 3. Element Creation Pattern
Test elements are created using factory functions:
```typescript
const testTransition = createTransition({ x: 95, y: 200 }, 1);
const testAction = createActionBlock(parentId, { x: 160, y: 100 }, 'normal', 0);
```

### 4. Assertion Patterns
- Position verification: `expect(element?.position).toEqual(expectedPosition)`
- Property preservation: `expect(element?.property).toBe(originalValue)`
- Function calls: `expect(mockFunction).toHaveBeenCalledWith(expectedArgs)`
- Error handling: `expect(() => { ... }).not.toThrow()`

## Adding New Movement Tests

### 1. Create Test File
Follow the naming convention: `[elementType]Movement.test.ts`

### 2. Include Required Test Categories
- Basic drag and drop functionality
- Boundary constraints and validation
- Collision detection with other elements
- Undo/redo operations for movements
- Edge cases and error handling

### 3. Mock Required Dependencies
```typescript
vi.mock('../utils/collisionDetection', () => ({ ... }));
vi.mock('../utils/connectionUtils', () => ({ ... }));
```

### 4. Follow Store Reset Pattern
Use the established beforeEach/afterEach patterns for consistency.

## Debugging Tests

### Console Output
Tests include descriptive error messages and can be debugged using:
```bash
npm test -- --reporter=verbose src/test/transitionMovement.test.ts
```

### Individual Test Execution
Run specific tests using the test name:
```bash
npm test -- --run -t "should allow transition to be moved"
```

### Mock Inspection
Use `vi.mocked()` to inspect mock calls:
```typescript
expect(vi.mocked(collisionDetection.findCollisions)).toHaveBeenCalledWith(
  expectedElement, expectedPosition, expectedElements
);
```

## Performance Considerations

The tests include performance benchmarks to ensure movement operations remain efficient:
- Rapid movements should complete within 1 second for 100 operations
- Many element movements should complete within 2 seconds for 50 elements
- Memory usage should remain stable during stress tests

## Integration with CI/CD

These tests are designed to run in continuous integration environments:
- No external dependencies required
- Deterministic results
- Fast execution times
- Clear pass/fail criteria
- Comprehensive error reporting
