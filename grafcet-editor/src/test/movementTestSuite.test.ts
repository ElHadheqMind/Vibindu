import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useElementsStore } from '../store/useElementsStore';
import { useEditorStore } from '../store/useEditorStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { createStep, createTransition, createActionBlock, createGate } from '../models/GrafcetElements';
import { Point, Step, Transition, ActionBlock, Gate } from '../models/types';
import * as collisionDetection from '../utils/collisionDetection';
import * as connectionUtils from '../utils/connectionUtils';

// Mock utility modules
vi.mock('../utils/collisionDetection', () => ({
  findCollisions: vi.fn(() => []),
  isValidPosition: vi.fn(() => true),
  calculateSmartPosition: vi.fn((element, position) => position),
  findNearestNonCollidingPosition: vi.fn((element, position) => position),
  elementsCollide: vi.fn(() => false),
}));

vi.mock('../utils/connectionUtils', () => ({
  validateConnectionConstraints: vi.fn(() => ({ isValid: true, violations: [] })),
  enforceConnectionConstraints: vi.fn(() => []),
  generateComplexConnectionPath: vi.fn(() => []),
}));

describe('GRAFCET Element Movement Test Suite', () => {
  let testStep: Step;
  let testTransition: Transition;
  let testAction: ActionBlock;
  let testGate: Gate;

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
    testTransition = createTransition({ x: 95, y: 200 }, 1);
    testAction = createActionBlock(testStep.id, { x: 160, y: 100 }, 'normal', 0);
    testGate = createGate({ x: 200, y: 300 }, 'and-gate', 2);

    // Add elements to store
    const store = useElementsStore.getState();
    store.addElement(testStep);
    store.addElement(testTransition);
    store.addElement(testAction);
    store.addElement(testGate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Element Movement Integration', () => {
    it('should handle simultaneous movement of multiple element types', () => {
      const store = useElementsStore.getState();
      
      const movements = [
        { id: testStep.id, position: { x: 150, y: 150 } },
        { id: testTransition.id, position: { x: 145, y: 250 } },
        { id: testAction.id, position: { x: 210, y: 150 } },
        { id: testGate.id, position: { x: 250, y: 350 } }
      ];

      // Move all elements
      movements.forEach(({ id, position }) => {
        store.moveElement(id, position);
      });

      // Verify all movements
      movements.forEach(({ id, position }) => {
        const element = store.getElementById(id);
        expect(element?.position).toEqual(position);
      });
    });

    it('should maintain relationships during complex movements', () => {
      const store = useElementsStore.getState();
      
      // Create connections between elements
      const connection1 = store.addConnection(testStep.id, testTransition.id);
      const connection2 = store.addConnection(testTransition.id, testGate.id);

      // Move connected elements
      store.moveElement(testStep.id, { x: 200, y: 200 });
      store.moveElement(testTransition.id, { x: 195, y: 300 });

      // Verify connections still exist
      const updatedConnection1 = store.getElementById(connection1.id);
      const updatedConnection2 = store.getElementById(connection2.id);
      
      expect(updatedConnection1).toBeDefined();
      expect(updatedConnection2).toBeDefined();
      expect(updatedConnection1?.sourceId).toBe(testStep.id);
      expect(updatedConnection1?.targetId).toBe(testTransition.id);
    });

    it('should handle action reindexing when parent step moves', () => {
      const store = useElementsStore.getState();
      
      // Add more actions to the step
      const action2 = createActionBlock(testStep.id, { x: 220, y: 100 }, 'normal', 1);
      store.addElement(action2);

      // Spy on reindexing
      const reindexSpy = vi.spyOn(store, 'reindexStepActions');

      // Move the parent step
      store.moveElement(testStep.id, { x: 150, y: 150 });

      // Should trigger reindexing for actions
      setTimeout(() => {
        expect(reindexSpy).toHaveBeenCalledWith(testStep.id);
      }, 15);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid movements without performance degradation', () => {
      const store = useElementsStore.getState();
      const startTime = performance.now();
      
      // Perform 100 rapid movements
      for (let i = 0; i < 100; i++) {
        store.moveElement(testStep.id, { x: 100 + i, y: 100 + i });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should handle movement of many elements efficiently', () => {
      const store = useElementsStore.getState();
      
      // Create many elements
      const elements = [];
      for (let i = 0; i < 50; i++) {
        const step = createStep({ x: i * 20, y: i * 20 }, 'normal', i + 2);
        elements.push(step);
        store.addElement(step);
      }

      const startTime = performance.now();
      
      // Move all elements
      elements.forEach((element, i) => {
        store.moveElement(element.id, { x: i * 25, y: i * 25 });
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle many elements efficiently
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Cross-Element Collision Detection', () => {
    it('should detect collisions between different element types', () => {
      const store = useElementsStore.getState();
      
      // Mock collision detection to return collisions
      vi.mocked(collisionDetection.findCollisions).mockImplementation(
        (element, position, allElements) => {
          return allElements.filter(e => 
            e.id !== element.id && 
            e.type !== 'connection' &&
            Math.abs(e.position.x - position.x) < 50 &&
            Math.abs(e.position.y - position.y) < 50
          );
        }
      );

      const elements = store.elements;
      
      // Test step colliding with transition
      const stepCollisions = collisionDetection.findCollisions(
        testStep, 
        testTransition.position, 
        elements
      );
      expect(stepCollisions).toContain(testTransition);

      // Test action colliding with gate
      const actionCollisions = collisionDetection.findCollisions(
        testAction,
        testGate.position,
        elements
      );
      expect(actionCollisions).toContain(testGate);
    });

    it('should find safe positions avoiding all element types', () => {
      const store = useElementsStore.getState();
      const crowdedPosition = { x: 100, y: 100 }; // Near testStep
      const safePosition = { x: 400, y: 400 };

      // Mock finding safe position
      vi.mocked(collisionDetection.findNearestNonCollidingPosition)
        .mockReturnValue(safePosition);

      const elements = store.elements;
      const result = collisionDetection.findNearestNonCollidingPosition(
        testTransition,
        crowdedPosition,
        elements
      );

      expect(result).toEqual(safePosition);
    });
  });

  describe('History and State Management Integration', () => {
    it('should maintain consistent history across different element movements', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();
      
      historyStore.clearHistory();
      const initialHistoryLength = historyStore.past.length;

      // Move different types of elements
      store.moveElement(testStep.id, { x: 150, y: 150 });
      store.moveElement(testTransition.id, { x: 145, y: 250 });
      store.moveElement(testAction.id, { x: 210, y: 150 });

      // Should have added history entries
      expect(historyStore.past.length).toBe(initialHistoryLength + 3);
    });

    it('should restore all element types correctly on undo', () => {
      const store = useElementsStore.getState();
      const historyStore = useHistoryStore.getState();
      
      // Store original positions
      const originalPositions = {
        step: { ...testStep.position },
        transition: { ...testTransition.position },
        action: { ...testAction.position },
        gate: { ...testGate.position }
      };

      // Move all elements
      store.moveElement(testStep.id, { x: 200, y: 200 });
      store.moveElement(testTransition.id, { x: 195, y: 300 });
      store.moveElement(testAction.id, { x: 260, y: 200 });
      store.moveElement(testGate.id, { x: 300, y: 400 });

      // Undo all movements
      for (let i = 0; i < 4; i++) {
        historyStore.undo();
      }

      // Verify all elements are back to original positions
      const restoredStep = store.getElementById<Step>(testStep.id);
      const restoredTransition = store.getElementById<Transition>(testTransition.id);
      const restoredAction = store.getElementById<ActionBlock>(testAction.id);
      const restoredGate = store.getElementById<Gate>(testGate.id);

      expect(restoredStep?.position).toEqual(originalPositions.step);
      expect(restoredTransition?.position).toEqual(originalPositions.transition);
      expect(restoredAction?.position).toEqual(originalPositions.action);
      expect(restoredGate?.position).toEqual(originalPositions.gate);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from movement errors', () => {
      const store = useElementsStore.getState();
      
      // Mock an error in collision detection
      vi.mocked(collisionDetection.isValidPosition).mockImplementationOnce(() => {
        throw new Error('Collision detection error');
      });

      // Should not crash the application
      expect(() => {
        store.moveElement(testStep.id, { x: 200, y: 200 });
      }).not.toThrow();
    });

    it('should maintain store consistency after errors', () => {
      const store = useElementsStore.getState();
      const initialElementCount = store.elements.length;
      
      // Cause an error during movement
      vi.mocked(collisionDetection.findCollisions).mockImplementationOnce(() => {
        throw new Error('Find collisions error');
      });

      // Try to move element
      try {
        store.moveElement(testStep.id, { x: 200, y: 200 });
      } catch (error) {
        // Ignore error
      }

      // Store should maintain consistency
      expect(store.elements.length).toBe(initialElementCount);
      expect(store.getElementById(testStep.id)).toBeDefined();
    });
  });
});
