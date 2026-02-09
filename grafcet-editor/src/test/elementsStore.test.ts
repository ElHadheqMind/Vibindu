import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useElementsStore } from '../store/useElementsStore';
import * as connectionUtils from '../utils/connectionUtils';

// Mock the connection utils
vi.mock('../utils/connectionUtils', () => ({
  generateComplexConnectionPath: vi.fn(() => []),
  validateConnectionConstraints: vi.fn(() => ({ isValid: true, violations: [] })),
  enforceConnectionConstraints: vi.fn(() => []),
}));

describe('Elements Store Connection Constraints', () => {
  beforeEach(() => {
    // Reset the store before each test
    useElementsStore.setState({
      elements: [],
      selectedElementIds: [],
    });
  });

  describe('addConnection', () => {
    it('should create connection with proper routing', () => {
      const store = useElementsStore.getState();
      
      // Add source and target elements
      const sourceStep = store.addStep({ x: 100, y: 100 });
      const targetStep = store.addStep({ x: 200, y: 200 });
      
      // Add connection
      const connection = store.addConnection(sourceStep.id, targetStep.id);
      
      expect(connection).toBeDefined();
      expect(connection.sourceId).toBe(sourceStep.id);
      expect(connection.targetId).toBe(targetStep.id);
      expect(connection.type).toBe('connection');
    });

    it('should throw error for invalid source or target', () => {
      const store = useElementsStore.getState();
      
      expect(() => {
        store.addConnection('invalid-source', 'invalid-target');
      }).toThrow('Source or target element not found');
    });
  });

  describe('updateConnectionRouting', () => {
    it('should update connection segments', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connection
      const sourceStep = store.addStep({ x: 100, y: 100 });
      const targetStep = store.addStep({ x: 200, y: 200 });
      const connection = store.addConnection(sourceStep.id, targetStep.id);
      
      // Mock the routing function to return specific segments
      const mockSegments = [{ id: 'test-segment', points: [], orientation: 'vertical' as const }];
      vi.mocked(connectionUtils.enforceConnectionConstraints)
        .mockReturnValue(mockSegments);
      
      // Update routing
      store.updateConnectionRouting(connection.id);
      
      // Verify the connection was updated
      const updatedConnection = store.getElementById(connection.id);
      expect(updatedConnection).toBeDefined();
    });

    it('should handle missing connection gracefully', () => {
      const store = useElementsStore.getState();
      
      // Should not throw error for non-existent connection
      expect(() => {
        store.updateConnectionRouting('non-existent-id');
      }).not.toThrow();
    });

    it('should handle missing source or target elements', () => {
      const store = useElementsStore.getState();
      
      // Add a connection manually with invalid references
      const invalidConnection = {
        id: 'invalid-connection',
        type: 'connection' as const,
        sourceId: 'invalid-source',
        targetId: 'invalid-target',
        segments: [],
        position: { x: 0, y: 0 },
        selected: false,
      };
      
      store.addElement(invalidConnection);
      
      // Should not throw error
      expect(() => {
        store.updateConnectionRouting(invalidConnection.id);
      }).not.toThrow();
    });
  });

  describe('routeAllConnections', () => {
    it('should update all connections in the store', () => {
      const store = useElementsStore.getState();
      
      // Add multiple elements and connections
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      const step3 = store.addStep({ x: 300, y: 300 });
      
      const connection1 = store.addConnection(step1.id, step2.id);
      const connection2 = store.addConnection(step2.id, step3.id);
      
      // Spy on updateConnectionRouting
      const updateRoutingSpy = vi.spyOn(store, 'updateConnectionRouting');
      
      // Route all connections
      store.routeAllConnections();
      
      // Verify all connections were updated
      expect(updateRoutingSpy).toHaveBeenCalledWith(connection1.id);
      expect(updateRoutingSpy).toHaveBeenCalledWith(connection2.id);
      expect(updateRoutingSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle empty store gracefully', () => {
      const store = useElementsStore.getState();
      
      // Should not throw error with no connections
      expect(() => {
        store.routeAllConnections();
      }).not.toThrow();
    });
  });

  describe('validateAllConnections', () => {
    it('should validate all connections and return results', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connections
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      store.addConnection(step1.id, step2.id);
      
      // Mock validation to return specific results
      vi.mocked(connectionUtils.validateConnectionConstraints)
        .mockReturnValue({ isValid: true, violations: [] });
      
      const result = store.validateAllConnections();
      
      expect(result.validConnections).toBe(1);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect and report violations', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connections
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      const connection = store.addConnection(step1.id, step2.id);
      
      // Mock validation to return violations
      const mockViolations = ['Start point mismatch', 'End point mismatch'];
      vi.mocked(connectionUtils.validateConnectionConstraints)
        .mockReturnValue({ isValid: false, violations: mockViolations });
      
      const result = store.validateAllConnections();
      
      expect(result.validConnections).toBe(0);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].connectionId).toBe(connection.id);
      expect(result.violations[0].violations).toEqual(mockViolations);
    });

    it('should handle connections with missing elements', () => {
      const store = useElementsStore.getState();
      
      // Add a connection with missing source/target
      const invalidConnection = {
        id: 'invalid-connection',
        type: 'connection' as const,
        sourceId: 'missing-source',
        targetId: 'missing-target',
        segments: [],
        position: { x: 0, y: 0 },
        selected: false,
      };
      
      store.addElement(invalidConnection);
      
      const result = store.validateAllConnections();
      
      // Should not crash and should not count invalid connections
      expect(result.validConnections).toBe(0);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('enforceAllConnectionConstraints', () => {
    it('should enforce constraints on all connections', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connections
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      const connection = store.addConnection(step1.id, step2.id);
      
      // Mock validation to show violations initially
      vi.mocked(connectionUtils.validateConnectionConstraints)
        .mockReturnValue({ isValid: false, violations: ['Test violation'] });
      
      // Spy on updateConnectionRouting
      const updateRoutingSpy = vi.spyOn(store, 'updateConnectionRouting');
      
      // Enforce constraints
      store.enforceAllConnectionConstraints();
      
      // Should have attempted to fix the violating connection
      expect(updateRoutingSpy).toHaveBeenCalledWith(connection.id);
    });

    it('should not modify valid connections', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connections
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      const connection = store.addConnection(step1.id, step2.id);
      
      // Mock validation to show no violations
      vi.mocked(connectionUtils.validateConnectionConstraints)
        .mockReturnValue({ isValid: true, violations: [] });
      
      // Spy on updateConnectionRouting
      const updateRoutingSpy = vi.spyOn(store, 'updateConnectionRouting');
      
      // Enforce constraints
      store.enforceAllConnectionConstraints();
      
      // Should not have modified valid connections
      expect(updateRoutingSpy).not.toHaveBeenCalledWith(connection.id);
    });
  });

  describe('Element Movement Integration', () => {
    it('should update connections when elements are moved', () => {
      const store = useElementsStore.getState();
      
      // Add elements and connection
      const step1 = store.addStep({ x: 100, y: 100 });
      const step2 = store.addStep({ x: 200, y: 200 });
      const connection = store.addConnection(step1.id, step2.id);
      
      // Spy on connection routing
      const routingSpy = vi.spyOn(store, 'updateConnectionRouting');
      
      // Move an element
      store.moveElement(step1.id, { x: 150, y: 150 });
      
      // Should have triggered connection routing update
      expect(routingSpy).toHaveBeenCalledWith(connection.id);
    });
  });
});
