import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateConnectionPoints, 
  validateConnectionConstraints, 
  generateSimpleConnectionPath,
  enforceConnectionConstraints 
} from '../utils/connectionUtils';
import { createStep, createTransition, createConnection } from '../models/GrafcetElements';
import { Step, Transition } from '../models/types';

describe('Connection Constraints', () => {
  let sourceStep: Step;
  let targetStep: Step;
  let sourceTransition: Transition;
  let targetTransition: Transition;

  beforeEach(() => {
    // Create test elements with known positions
    sourceStep = createStep({ x: 100, y: 100 }, 'normal', 1);
    targetStep = createStep({ x: 200, y: 200 }, 'normal', 2);
    sourceTransition = createTransition({ x: 150, y: 150 }, 1);
    targetTransition = createTransition({ x: 250, y: 250 }, 2);
  });

  describe('calculateConnectionPoints', () => {
    it('should always use center-bottom to center-top for downward flow', () => {
      const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
      
      // Source should be center-bottom
      expect(start.x).toBe(sourceStep.position.x + sourceStep.size.width / 2);
      expect(start.y).toBe(sourceStep.position.y + sourceStep.size.height);
      
      // Target should be center-top
      expect(end.x).toBe(targetStep.position.x + targetStep.size.width / 2);
      expect(end.y).toBe(targetStep.position.y);
    });

    it('should use center-top to center-bottom for upward flow', () => {
      // Swap positions to create upward flow
      const upperStep = createStep({ x: 100, y: 50 }, 'normal', 1);
      const lowerStep = createStep({ x: 200, y: 150 }, 'normal', 2);
      
      const { start, end } = calculateConnectionPoints(lowerStep, upperStep);
      
      // Source (lower) should be center-top
      expect(start.x).toBe(lowerStep.position.x + lowerStep.size.width / 2);
      expect(start.y).toBe(lowerStep.position.y);
      
      // Target (upper) should be center-bottom
      expect(end.x).toBe(upperStep.position.x + upperStep.size.width / 2);
      expect(end.y).toBe(upperStep.position.y + upperStep.size.height);
    });

    it('should work with transitions as well as steps', () => {
      const { start, end } = calculateConnectionPoints(sourceTransition, targetTransition);
      
      // Should use center points regardless of element type
      expect(start.x).toBe(sourceTransition.position.x + sourceTransition.size.width / 2);
      expect(start.y).toBe(sourceTransition.position.y + sourceTransition.size.height);
      expect(end.x).toBe(targetTransition.position.x + targetTransition.size.width / 2);
      expect(end.y).toBe(targetTransition.position.y);
    });
  });

  describe('generateSimpleConnectionPath', () => {
    it('should create direct vertical connection for aligned elements', () => {
      const start = { x: 100, y: 50 };
      const end = { x: 102, y: 150 }; // Slightly offset but within threshold
      
      const segments = generateSimpleConnectionPath(start, end);
      
      expect(segments).toHaveLength(1);
      expect(segments[0].orientation).toBe('vertical');
      expect(segments[0].points).toHaveLength(2);
      
      // Should use average X position
      const avgX = (start.x + end.x) / 2;
      expect(segments[0].points[0].x).toBe(avgX);
      expect(segments[0].points[1].x).toBe(avgX);
    });

    it('should create 3-segment path for non-aligned elements', () => {
      const start = { x: 100, y: 50 };
      const end = { x: 200, y: 150 };
      
      const segments = generateSimpleConnectionPath(start, end);
      
      expect(segments).toHaveLength(3);
      expect(segments[0].orientation).toBe('vertical');
      expect(segments[1].orientation).toBe('horizontal');
      expect(segments[2].orientation).toBe('vertical');
      
      // First segment should maintain start X
      expect(segments[0].points[0].x).toBe(start.x);
      expect(segments[0].points[1].x).toBe(start.x);
      
      // Last segment should maintain end X
      expect(segments[2].points[0].x).toBe(end.x);
      expect(segments[2].points[1].x).toBe(end.x);
      
      // Middle segment should connect at midpoint Y
      const midY = (start.y + end.y) / 2;
      expect(segments[1].points[0].y).toBe(midY);
      expect(segments[1].points[1].y).toBe(midY);
    });

    it('should preserve exact start and end points', () => {
      const start = { x: 100, y: 50 };
      const end = { x: 200, y: 150 };
      
      const segments = generateSimpleConnectionPath(start, end);
      
      // First point should be exact start
      expect(segments[0].points[0]).toEqual(start);
      
      // Last point should be exact end
      const lastSegment = segments[segments.length - 1];
      const lastPoint = lastSegment.points[lastSegment.points.length - 1];
      expect(lastPoint).toEqual(end);
    });
  });

  describe('validateConnectionConstraints', () => {
    it('should validate compliant connections', () => {
      // Create a proper connection with correct segments
      const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
      const segments = generateSimpleConnectionPath(start, end);
      const connection = createConnection(sourceStep.id, targetStep.id, segments);
      
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect start point violations', () => {
      // Create connection with wrong start point
      const wrongStart = { x: 50, y: 50 }; // Not center-bottom
      const { end } = calculateConnectionPoints(sourceStep, targetStep);
      const segments = generateSimpleConnectionPath(wrongStart, end);
      const connection = createConnection(sourceStep.id, targetStep.id, segments);
      
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('Start point mismatch'))).toBe(true);
    });

    it('should detect end point violations', () => {
      // Create connection with wrong end point
      const { start } = calculateConnectionPoints(sourceStep, targetStep);
      const wrongEnd = { x: 300, y: 300 }; // Not center-top
      const segments = generateSimpleConnectionPath(start, wrongEnd);
      const connection = createConnection(sourceStep.id, targetStep.id, segments);
      
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('End point mismatch'))).toBe(true);
    });

    it('should handle connections with no segments', () => {
      const connection = createConnection(sourceStep.id, targetStep.id, []);
      
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('no segments'))).toBe(true);
    });

    it('should allow small tolerance for floating point precision', () => {
      // Create connection with tiny offset (within tolerance)
      const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
      const slightlyOffStart = { x: start.x + 0.5, y: start.y + 0.5 }; // Within 1px tolerance
      const segments = generateSimpleConnectionPath(slightlyOffStart, end);
      const connection = createConnection(sourceStep.id, targetStep.id, segments);
      
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('enforceConnectionConstraints', () => {
    it('should regenerate connection with correct constraints', () => {
      // Create a connection with wrong points
      const wrongConnection = createConnection(sourceStep.id, targetStep.id, []);
      
      const correctedSegments = enforceConnectionConstraints(
        wrongConnection,
        sourceStep,
        targetStep,
        []
      );
      
      expect(correctedSegments.length).toBeGreaterThan(0);
      
      // Verify the corrected connection follows constraints
      const correctedConnection = { ...wrongConnection, segments: correctedSegments };
      const validation = validateConnectionConstraints(sourceStep, targetStep, correctedConnection);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain constraints through complete workflow', () => {
      // 1. Calculate connection points
      const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
      
      // 2. Generate path
      const segments = generateSimpleConnectionPath(start, end);
      
      // 3. Create connection
      const connection = createConnection(sourceStep.id, targetStep.id, segments);
      
      // 4. Validate
      const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
      
      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should handle various element combinations', () => {
      const combinations = [
        [sourceStep, targetStep],
        [sourceStep, targetTransition],
        [sourceTransition, targetStep],
        [sourceTransition, targetTransition],
      ];

      combinations.forEach(([source, target]) => {
        const { start, end } = calculateConnectionPoints(source, target);
        const segments = generateSimpleConnectionPath(start, end);
        const connection = createConnection(source.id, target.id, segments);
        
        const validation = validateConnectionConstraints(source, target, connection);
        
        expect(validation.isValid).toBe(true);
      });
    });
  });
});
