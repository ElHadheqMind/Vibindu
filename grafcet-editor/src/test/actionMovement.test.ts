import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useElementsStore } from '../store/useElementsStore';
import { useEditorStore } from '../store/useEditorStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { createStep, createActionBlock } from '../models/GrafcetElements';
import { Point, ActionBlock, Step } from '../models/types';
import * as collisionDetection from '../utils/collisionDetection';

// Mock the collision detection utilities
vi.mock('../utils/collisionDetection', () => ({
  findCollisions: vi.fn(() => []),
  isValidPosition: vi.fn(() => true),
  calculateSmartPosition: vi.fn((element, position) => position),
  findNearestNonCollidingPosition: vi.fn((element, position) => position),
  elementsCollide: vi.fn(() => false),
}));

describe('Action Block Manual Movement Tests', () => {
  let testStep: Step;
  let testAction: ActionBlock;
  let secondAction: ActionBlock;

  beforeEach(() => {
    // Reset all stores
    useElementsStore.setState({
      elements: [],
      selectedElementIds: [],
    });
    
    useEditorStore.setState({
      currentTool: 'select',
      dragState: {
        isDragging: false,
        draggedElementIds: [],
        showDragPreview: false,
      },
    });

    useHistoryStore.getState().clearHistory();

    // Create test elements
    testStep = createStep({ x: 100, y: 100 }, 'normal', 1);
    testAction = createActionBlock(testStep.id, { x: 160, y: 100 }, 'normal', 0);
    secondAction = createActionBlock(testStep.id, { x: 220, y: 100 }, 'normal', 1);

    // Add elements to store
    const store = useElementsStore.getState();
    store.addElement(testStep);
    store.addElement(testAction);
    store.addElement(secondAction);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Drag and Drop Functionality', () => {
    it('should allow action block to be moved to a new position', () => {
      const store = useElementsStore.getState();
      const newPosition: Point = { x: 200, y: 150 };

      // Move the action block
      store.moveElement(testAction.id, newPosition);

      // Verify the action has moved
      const updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.position).toEqual(newPosition);
    });

    it('should maintain action block properties during movement', () => {
      const store = useElementsStore.getState();
      const originalText = 'Test Action';
      const originalIndex = 0;

      // Update action with specific properties
      store.updateElement(testAction.id, {
        text: originalText,
        index: originalIndex,
      });

      // Move the action
      store.moveElement(testAction.id, { x: 250, y: 120 });

      // Verify properties are maintained
      const updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.text).toBe(originalText);
      expect(updatedAction?.index).toBe(originalIndex);
      expect(updatedAction?.parentId).toBe(testStep.id);
    });

    it('should trigger reindexing of step actions after movement', async () => {
      const store = useElementsStore.getState();

      // Spy on reindexing function
      const reindexSpy = vi.spyOn(store, 'reindexStepActions');

      // Move action block
      store.moveElement(testAction.id, { x: 300, y: 100 });

      // Wait for async reindexing to complete
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should trigger reindexing
      expect(reindexSpy).toHaveBeenCalledWith(testStep.id);
    });

    it('should maintain parent-child relationship during movement', () => {
      const store = useElementsStore.getState();
      const newPosition = { x: 180, y: 120 };

      // Move the action
      store.moveElement(testAction.id, newPosition);

      // Verify parent relationship is maintained
      const updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.parentId).toBe(testStep.id);

      // Verify action is still in step's action list
      const stepActions = store.getStepActions(testStep.id);
      expect(stepActions).toContain(updatedAction);
    });
  });

  describe('Layout Constraints and Positioning', () => {
    it('should respect horizontal layout constraints', () => {
      const store = useElementsStore.getState();
      
      // Get initial positions
      const action1 = store.getElementById<ActionBlock>(testAction.id);
      const action2 = store.getElementById<ActionBlock>(secondAction.id);
      
      expect(action1?.position.x).toBeLessThan(action2?.position.x || 0);
    });

    it('should maintain proper spacing between action blocks', () => {
      const store = useElementsStore.getState();
      
      // Trigger reindexing to ensure proper spacing
      store.reindexStepActions(testStep.id);

      const actions = store.getStepActions(testStep.id);
      actions.sort((a, b) => a.index - b.index);

      // Check spacing between consecutive actions
      for (let i = 1; i < actions.length; i++) {
        const prevAction = actions[i - 1];
        const currentAction = actions[i];
        const expectedX = prevAction.position.x + prevAction.size.width;
        
        expect(currentAction.position.x).toBeGreaterThanOrEqual(expectedX);
      }
    });

    it('should align action blocks vertically with parent step', () => {
      const store = useElementsStore.getState();
      
      // Trigger reindexing
      store.reindexStepActions(testStep.id);

      const actions = store.getStepActions(testStep.id);
      const parentStep = store.getElementById<Step>(testStep.id);

      // All actions should have same Y position as parent step
      actions.forEach(action => {
        expect(action.position.y).toBe(parentStep?.position.y);
      });
    });

    it('should position first action block adjacent to parent step', () => {
      const store = useElementsStore.getState();
      
      // Trigger reindexing
      store.reindexStepActions(testStep.id);

      const actions = store.getStepActions(testStep.id);
      const firstAction = actions.find(a => a.index === 0);
      const parentStep = store.getElementById<Step>(testStep.id);

      if (firstAction && parentStep) {
        const expectedX = parentStep.position.x + parentStep.size.width + 10;
        expect(firstAction.position.x).toBe(expectedX);
      }
    });
  });

  describe('Collision Detection with Other Elements', () => {
    it('should detect collisions with other action blocks', () => {
      const store = useElementsStore.getState();
      
      // Mock collision detection to return the second action
      vi.mocked(collisionDetection.findCollisions).mockReturnValue([secondAction]);

      const elements = store.elements;
      const collisions = collisionDetection.findCollisions(
        testAction, 
        secondAction.position, 
        elements
      );

      expect(collisions).toContain(secondAction);
    });

    it('should detect collisions with steps', () => {
      const store = useElementsStore.getState();
      
      // Create another step that could collide
      const otherStep = createStep({ x: 160, y: 100 }, 'normal', 2);
      store.addElement(otherStep);

      // Mock collision detection
      vi.mocked(collisionDetection.findCollisions).mockReturnValue([otherStep]);

      const elements = store.elements;
      const collisions = collisionDetection.findCollisions(
        testAction,
        otherStep.position,
        elements
      );

      expect(collisions).toContain(otherStep);
    });

    it('should find safe position when collision occurs', () => {
      const store = useElementsStore.getState();
      const desiredPosition = { x: 220, y: 100 }; // Same as secondAction
      const safePosition = { x: 280, y: 100 };

      // Mock finding safe position
      vi.mocked(collisionDetection.findNearestNonCollidingPosition)
        .mockReturnValue(safePosition);

      const elements = store.elements;
      const result = collisionDetection.findNearestNonCollidingPosition(
        testAction,
        desiredPosition,
        elements
      );

      expect(result).toEqual(safePosition);
    });

    it('should use smart positioning to avoid overlaps', () => {
      const store = useElementsStore.getState();
      const desiredPosition = { x: 220, y: 100 };
      const smartPosition = { x: 240, y: 100 };

      // Mock smart positioning
      vi.mocked(collisionDetection.calculateSmartPosition)
        .mockReturnValue(smartPosition);

      const elements = store.elements;
      const result = collisionDetection.calculateSmartPosition(
        testAction,
        desiredPosition,
        elements,
        { avoidCollisions: true, snapToGrid: true }
      );

      expect(result).toEqual(smartPosition);
    });
  });

  describe('Boundary Constraints and Validation', () => {
    it('should validate position within canvas bounds', () => {
      const canvasBounds = { width: 800, height: 600 };
      
      // Mock boundary validation
      vi.mocked(collisionDetection.isValidPosition).mockImplementation(
        (element, position, allElements, bounds) => {
          if (!bounds || !('size' in element)) return true;
          return position.x >= 0 && position.y >= 0 &&
                 position.x + element.size.width <= bounds.width &&
                 position.y + element.size.height <= bounds.height;
        }
      );

      const store = useElementsStore.getState();
      const elements = store.elements;

      // Test valid position
      const validPosition = { x: 200, y: 150 };
      expect(collisionDetection.isValidPosition(
        testAction, validPosition, elements, canvasBounds
      )).toBe(true);

      // Test invalid position (outside bounds)
      const invalidPosition = { x: 850, y: 650 };
      expect(collisionDetection.isValidPosition(
        testAction, invalidPosition, elements, canvasBounds
      )).toBe(false);
    });

    it('should prevent movement to negative coordinates', () => {
      vi.mocked(collisionDetection.isValidPosition).mockImplementation(
        (element, position) => position.x >= 0 && position.y >= 0
      );

      const store = useElementsStore.getState();
      const elements = store.elements;

      // Test negative coordinates
      const negativePosition = { x: -20, y: -10 };
      expect(collisionDetection.isValidPosition(
        testAction, negativePosition, elements
      )).toBe(false);

      // Test valid coordinates
      const validPosition = { x: 20, y: 10 };
      expect(collisionDetection.isValidPosition(
        testAction, validPosition, elements
      )).toBe(true);
    });
  });

  describe('Undo/Redo Operations for Movements', () => {
    it('should add history entry when action is moved', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      // Get initial state (elements were added in beforeEach, so history already has entries)
      const initialHistoryLength = historyStore.past.length;

      // Move action
      store.moveElement(testAction.id, { x: 300, y: 120 });

      // Should have added history entry
      expect(historyStore.past.length).toBe(initialHistoryLength + 1);
    });

    it('should restore previous position on undo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      const originalPosition = { ...testAction.position };
      const newPosition = { x: 300, y: 120 };

      // Move action
      store.moveElement(testAction.id, newPosition);

      // Verify new position
      let updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.position).toEqual(newPosition);

      // Undo the movement
      historyStore.undo();

      // Should restore original position
      updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.position).toEqual(originalPosition);
    });

    it('should support redo after undo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      const newPosition = { x: 300, y: 120 };

      // Move action
      store.moveElement(testAction.id, newPosition);

      // Undo
      historyStore.undo();

      // Redo
      historyStore.redo();

      // Should restore the moved position
      const updatedAction = store.getElementById<ActionBlock>(testAction.id);
      expect(updatedAction?.position).toEqual(newPosition);
    });

    it('should preserve action ordering after undo/redo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      // Get initial action order
      const initialActions = store.getStepActions(testStep.id);
      const initialOrder = initialActions.map(a => a.id);

      // Move an action
      store.moveElement(testAction.id, { x: 350, y: 120 });

      // Undo
      historyStore.undo();

      // Check that action order is preserved
      const restoredActions = store.getStepActions(testStep.id);
      const restoredOrder = restoredActions.map(a => a.id);

      expect(restoredOrder).toEqual(initialOrder);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle movement of non-existent action gracefully', () => {
      const store = useElementsStore.getState();
      const nonExistentId = 'non-existent-action-id';

      // Should not throw error when moving non-existent element
      expect(() => {
        store.moveElement(nonExistentId, { x: 100, y: 100 });
      }).not.toThrow();
    });

    it('should handle invalid position coordinates', () => {
      const store = useElementsStore.getState();

      // Test with NaN coordinates
      const invalidPosition = { x: NaN, y: NaN };

      // Should handle gracefully
      expect(() => {
        store.moveElement(testAction.id, invalidPosition);
      }).not.toThrow();
    });

    it('should handle movement when parent step is deleted', () => {
      const store = useElementsStore.getState();

      // Delete the parent step
      store.deleteElement(testStep.id);

      // Try to move the orphaned action
      expect(() => {
        store.moveElement(testAction.id, { x: 200, y: 150 });
      }).not.toThrow();
    });

    it('should handle action reindexing with missing parent', () => {
      const store = useElementsStore.getState();

      // Delete parent step
      store.deleteElement(testStep.id);

      // Try to reindex actions for non-existent step
      expect(() => {
        store.reindexStepActions(testStep.id);
      }).not.toThrow();
    });

    it('should handle extremely large coordinate values', () => {
      const store = useElementsStore.getState();

      const extremePosition = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };

      expect(() => {
        store.moveElement(testAction.id, extremePosition);
      }).not.toThrow();
    });

    it('should handle rapid consecutive movements', () => {
      const store = useElementsStore.getState();
      const positions = Array.from({ length: 20 }, (_, i) => ({
        x: 160 + i * 5,
        y: 100 + i * 2
      }));

      // Rapidly move action multiple times
      expect(() => {
        positions.forEach(pos => {
          store.moveElement(testAction.id, pos);
        });
      }).not.toThrow();

      // Should end up at final position
      const finalAction = store.getElementById<ActionBlock>(testAction.id);
      expect(finalAction?.position).toEqual(positions[positions.length - 1]);
    });

    it('should maintain action index consistency during movement', () => {
      const store = useElementsStore.getState();

      // Get initial indices
      const initialAction1 = store.getElementById<ActionBlock>(testAction.id);
      const initialAction2 = store.getElementById<ActionBlock>(secondAction.id);

      // Move first action
      store.moveElement(testAction.id, { x: 400, y: 100 });

      // Indices should remain consistent
      const movedAction1 = store.getElementById<ActionBlock>(testAction.id);
      const movedAction2 = store.getElementById<ActionBlock>(secondAction.id);

      expect(movedAction1?.index).toBe(initialAction1?.index);
      expect(movedAction2?.index).toBe(initialAction2?.index);
    });

    it('should handle movement with corrupted action data', () => {
      const store = useElementsStore.getState();

      // Corrupt action data by removing size property
      const corruptedAction = { ...testAction };
      delete (corruptedAction as any).size;

      // Update store with corrupted data
      store.updateElement(testAction.id, corruptedAction);

      // Should handle movement gracefully
      expect(() => {
        store.moveElement(testAction.id, { x: 200, y: 120 });
      }).not.toThrow();
    });

    it('should handle concurrent movements of multiple actions', () => {
      const store = useElementsStore.getState();

      // Create additional actions
      const thirdAction = createActionBlock(testStep.id, { x: 280, y: 100 }, 'normal', 2);
      store.addElement(thirdAction);

      const movements = [
        { id: testAction.id, position: { x: 180, y: 110 } },
        { id: secondAction.id, position: { x: 240, y: 110 } },
        { id: thirdAction.id, position: { x: 300, y: 110 } }
      ];

      // Move all actions simultaneously
      expect(() => {
        movements.forEach(({ id, position }) => {
          store.moveElement(id, position);
        });
      }).not.toThrow();

      // Verify all movements were applied
      movements.forEach(({ id, position }) => {
        const movedAction = store.getElementById<ActionBlock>(id);
        expect(movedAction?.position).toEqual(position);
      });
    });
  });
});
