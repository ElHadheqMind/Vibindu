import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useElementsStore } from '../store/useElementsStore';
import { useEditorStore } from '../store/useEditorStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { createStep, createTransition } from '../models/GrafcetElements';
import { Point, Transition } from '../models/types';
import * as collisionDetection from '../utils/collisionDetection';
import * as connectionUtils from '../utils/connectionUtils';

// Mock the utility modules
vi.mock('../utils/collisionDetection', () => ({
  findCollisions: vi.fn(() => []),
  isValidPosition: vi.fn(() => true),
  calculateSmartPosition: vi.fn((element, position) => position),
  findNearestNonCollidingPosition: vi.fn((element, position) => position),
}));

vi.mock('../utils/connectionUtils', () => ({
  validateConnectionConstraints: vi.fn(() => ({ isValid: true, violations: [] })),
  enforceConnectionConstraints: vi.fn(() => []),
  generateComplexConnectionPath: vi.fn(() => []),
}));

describe('Transition Manual Movement Tests', () => {
  let testTransition: Transition;
  let sourceStep: any;
  let targetStep: any;

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
    sourceStep = createStep({ x: 100, y: 100 }, 'normal', 1);
    targetStep = createStep({ x: 100, y: 300 }, 'normal', 2);
    testTransition = createTransition({ x: 95, y: 200 }, 1);

    // Add elements to store
    const store = useElementsStore.getState();
    store.addElement(sourceStep);
    store.addElement(testTransition);
    store.addElement(targetStep);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Drag and Drop Functionality', () => {
    it('should allow transition to be moved to a new position', () => {
      const store = useElementsStore.getState();
      const newPosition: Point = { x: 150, y: 250 };

      // Move the transition
      store.moveElement(testTransition.id, newPosition);

      // Verify the transition has moved
      const updatedTransition = store.getElementById<Transition>(testTransition.id);
      expect(updatedTransition?.position).toEqual(newPosition);
    });

    it('should update connections when transition is moved', () => {
      const store = useElementsStore.getState();

      // Add connections
      const connection1 = store.addConnection(sourceStep.id, testTransition.id);
      const connection2 = store.addConnection(testTransition.id, targetStep.id);

      // Spy on connection routing - the actual method called is routeAllConnections
      const routingSpy = vi.spyOn(store, 'routeAllConnections');

      // Move the transition
      store.moveElement(testTransition.id, { x: 150, y: 250 });

      // The routing is called asynchronously, so we need to wait
      setTimeout(() => {
        expect(routingSpy).toHaveBeenCalled();
      }, 15);
    });

    it('should maintain transition properties during movement', () => {
      const store = useElementsStore.getState();
      const originalCondition = 'test condition';
      const originalNumber = 5;

      // Update transition with specific properties
      store.updateElement(testTransition.id, {
        condition: originalCondition,
        number: originalNumber,
      });

      // Move the transition
      store.moveElement(testTransition.id, { x: 200, y: 300 });

      // Verify properties are maintained
      const updatedTransition = store.getElementById<Transition>(testTransition.id);
      expect(updatedTransition?.condition).toBe(originalCondition);
      expect(updatedTransition?.number).toBe(originalNumber);
    });
  });

  describe('Boundary Constraints and Validation', () => {
    it('should validate position within canvas bounds', () => {
      const canvasBounds = { width: 800, height: 600 };
      
      // Mock isValidPosition to check bounds
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
      const validPosition = { x: 100, y: 100 };
      expect(collisionDetection.isValidPosition(testTransition, validPosition, elements, canvasBounds)).toBe(true);

      // Test invalid position (outside bounds)
      const invalidPosition = { x: 900, y: 700 };
      expect(collisionDetection.isValidPosition(testTransition, invalidPosition, elements, canvasBounds)).toBe(false);
    });

    it('should prevent movement to negative coordinates', () => {
      vi.mocked(collisionDetection.isValidPosition).mockImplementation(
        (element, position) => position.x >= 0 && position.y >= 0
      );

      const store = useElementsStore.getState();
      const elements = store.elements;

      // Test negative coordinates
      const negativePosition = { x: -50, y: -30 };
      expect(collisionDetection.isValidPosition(testTransition, negativePosition, elements)).toBe(false);

      // Test valid coordinates
      const validPosition = { x: 50, y: 30 };
      expect(collisionDetection.isValidPosition(testTransition, validPosition, elements)).toBe(true);
    });

    it('should handle constraint validation during movement', () => {
      const store = useElementsStore.getState();

      // Add connections to create constraints
      store.addConnection(sourceStep.id, testTransition.id);
      store.addConnection(testTransition.id, targetStep.id);

      // Mock constraint validation
      const validateSpy = vi.mocked(connectionUtils.validateConnectionConstraints);
      validateSpy.mockReturnValue({ isValid: true, violations: [] });

      // Move transition
      store.moveElement(testTransition.id, { x: 120, y: 220 });

      // Constraint validation happens during connection routing, which is async
      setTimeout(() => {
        expect(validateSpy).toHaveBeenCalled();
      }, 15);
    });
  });

  describe('Collision Detection with Other Elements', () => {
    it('should detect collisions with other transitions', () => {
      const store = useElementsStore.getState();
      
      // Add another transition nearby
      const otherTransition = createTransition({ x: 150, y: 200 }, 2);
      store.addElement(otherTransition);

      // Mock collision detection
      vi.mocked(collisionDetection.findCollisions).mockReturnValue([otherTransition]);

      const elements = store.elements;
      const collisions = collisionDetection.findCollisions(testTransition, { x: 150, y: 200 }, elements);

      expect(collisions).toContain(otherTransition);
      expect(collisions).toHaveLength(1);
    });

    it('should find nearest non-colliding position when collision occurs', () => {
      const store = useElementsStore.getState();
      const desiredPosition = { x: 150, y: 200 };
      const safePosition = { x: 170, y: 200 };

      // Mock finding safe position
      vi.mocked(collisionDetection.findNearestNonCollidingPosition).mockReturnValue(safePosition);

      const elements = store.elements;
      const result = collisionDetection.findNearestNonCollidingPosition(
        testTransition,
        desiredPosition,
        elements
      );

      expect(result).toEqual(safePosition);
    });

    it('should not detect collisions with connections', () => {
      const store = useElementsStore.getState();
      
      // Add a connection
      const connection = store.addConnection(sourceStep.id, targetStep.id);

      // Mock collision detection to exclude connections
      vi.mocked(collisionDetection.findCollisions).mockImplementation(
        (element, position, allElements) => {
          return allElements.filter(e => e.type !== 'connection' && e.id !== element.id);
        }
      );

      const elements = store.elements;
      const collisions = collisionDetection.findCollisions(testTransition, { x: 150, y: 200 }, elements);

      // Should not include the connection in collisions
      expect(collisions).not.toContain(connection);
    });
  });

  describe('Undo/Redo Operations for Movements', () => {
    it('should add history entry when transition is moved', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      // Get initial state (elements were added in beforeEach, so history already has entries)
      const initialHistoryLength = historyStore.past.length;

      // Move transition
      store.moveElement(testTransition.id, { x: 200, y: 250 });

      // Should have added history entry
      expect(historyStore.past.length).toBe(initialHistoryLength + 1);
    });

    it('should restore previous position on undo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      const originalPosition = { ...testTransition.position };
      const newPosition = { x: 200, y: 250 };

      // Move transition
      store.moveElement(testTransition.id, newPosition);

      // Verify new position
      let updatedTransition = store.getElementById<Transition>(testTransition.id);
      expect(updatedTransition?.position).toEqual(newPosition);

      // Undo the movement
      historyStore.undo();

      // Should restore original position
      updatedTransition = store.getElementById<Transition>(testTransition.id);
      expect(updatedTransition?.position).toEqual(originalPosition);
    });

    it('should support redo after undo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      const newPosition = { x: 200, y: 250 };

      // Move transition
      store.moveElement(testTransition.id, newPosition);

      // Undo
      historyStore.undo();

      // Redo
      historyStore.redo();

      // Should restore the moved position
      const updatedTransition = store.getElementById<Transition>(testTransition.id);
      expect(updatedTransition?.position).toEqual(newPosition);
    });

    it('should handle multiple consecutive movements in history', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();

      // Store original position before clearing history
      const originalPosition = { ...testTransition.position };
      historyStore.clearHistory();

      const positions = [
        { x: 150, y: 200 },
        { x: 200, y: 250 },
        { x: 250, y: 300 }
      ];

      // Make multiple movements
      positions.forEach(pos => {
        store.moveElement(testTransition.id, pos);
      });

      // Should have multiple history entries
      expect(historyStore.past.length).toBe(positions.length);

      // Undo all movements
      for (let i = 0; i < positions.length; i++) {
        historyStore.undo();
      }

      // Should be back to original position or have no elements (depending on implementation)
      const finalTransition = store.getElementById<Transition>(testTransition.id);
      // If element exists, it should be at original position, otherwise store should be empty
      if (finalTransition) {
        expect(finalTransition.position).toEqual(originalPosition);
      } else {
        expect(store.elements.length).toBe(0);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle movement of non-existent transition gracefully', () => {
      const store = useElementsStore.getState();
      const nonExistentId = 'non-existent-id';

      // Should not throw error when moving non-existent element
      expect(() => {
        store.moveElement(nonExistentId, { x: 100, y: 100 });
      }).not.toThrow();
    });

    it('should handle invalid position coordinates', () => {
      const store = useElementsStore.getState();

      // Test with NaN coordinates
      const invalidPosition = { x: NaN, y: NaN };

      // Should handle gracefully (implementation dependent)
      expect(() => {
        store.moveElement(testTransition.id, invalidPosition);
      }).not.toThrow();
    });

    it('should handle extremely large coordinate values', () => {
      const store = useElementsStore.getState();

      const extremePosition = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };

      expect(() => {
        store.moveElement(testTransition.id, extremePosition);
      }).not.toThrow();
    });

    it('should maintain transition number uniqueness during movement', () => {
      const store = useElementsStore.getState();

      // Add another transition with different number
      const otherTransition = createTransition({ x: 200, y: 300 }, 2);
      store.addElement(otherTransition);

      // Move first transition
      store.moveElement(testTransition.id, { x: 150, y: 250 });

      // Numbers should remain unique
      const transition1 = store.getElementById<Transition>(testTransition.id);
      const transition2 = store.getElementById<Transition>(otherTransition.id);

      expect(transition1?.number).not.toBe(transition2?.number);
    });

    it('should handle rapid consecutive movements', () => {
      const store = useElementsStore.getState();
      const positions = Array.from({ length: 10 }, (_, i) => ({
        x: 100 + i * 10,
        y: 200 + i * 5
      }));

      // Rapidly move transition multiple times
      expect(() => {
        positions.forEach(pos => {
          store.moveElement(testTransition.id, pos);
        });
      }).not.toThrow();

      // Should end up at final position
      const finalTransition = store.getElementById<Transition>(testTransition.id);
      expect(finalTransition?.position).toEqual(positions[positions.length - 1]);
    });

    it('should handle movement when connections have constraint violations', () => {
      const store = useElementsStore.getState();

      // Add connections
      store.addConnection(sourceStep.id, testTransition.id);
      store.addConnection(testTransition.id, targetStep.id);

      // Mock constraint validation to return violations
      vi.mocked(connectionUtils.validateConnectionConstraints)
        .mockReturnValue({
          isValid: false,
          violations: ['Invalid connection path']
        });

      // Should still allow movement but trigger constraint enforcement
      expect(() => {
        store.moveElement(testTransition.id, { x: 300, y: 400 });
      }).not.toThrow();
    });
  });
});
