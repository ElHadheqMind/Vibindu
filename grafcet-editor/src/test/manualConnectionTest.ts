/**
 * Manual Connection Constraints Test
 *
 * This file contains manual tests that can be run in the browser console
 * to verify that connection constraints are working properly.
 *
 * To run these tests:
 * 1. Open the GRAFCET editor in your browser
 * 2. Open the browser console (F12)
 * 3. Copy and paste the test functions below
 * 4. Run: runConnectionConstraintTests()
 */

import { createStep, createTransition } from '../models/GrafcetElements';
import * as connectionUtils from '../utils/connectionUtils';
import { useElementsStore } from '../store/useElementsStore';

// Test helper functions
function createTestStep(x: number, y: number, number: number = 1) {
  return createStep({ x, y }, 'normal', number);
}

function createTestTransition(x: number, y: number, number: number = 1) {
  return createTransition({ x, y }, number);
}

// Test 1: Basic Connection Point Calculation
function testConnectionPoints() {
  console.log('🧪 Testing Connection Point Calculation...');
  
  const { calculateConnectionPoints } = connectionUtils;
  
  const sourceStep = createTestStep(100, 100);
  const targetStep = createTestStep(200, 200);
  
  const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
  
  // Expected: start should be center-bottom of source, end should be center-top of target
  const expectedStart = {
    x: sourceStep.position.x + sourceStep.size.width / 2,
    y: sourceStep.position.y + sourceStep.size.height
  };
  const expectedEnd = {
    x: targetStep.position.x + targetStep.size.width / 2,
    y: targetStep.position.y
  };
  
  const startCorrect = Math.abs(start.x - expectedStart.x) < 0.1 && Math.abs(start.y - expectedStart.y) < 0.1;
  const endCorrect = Math.abs(end.x - expectedEnd.x) < 0.1 && Math.abs(end.y - expectedEnd.y) < 0.1;
  
  console.log(`  ✅ Start point: ${startCorrect ? 'PASS' : 'FAIL'} (${start.x}, ${start.y})`);
  console.log(`  ✅ End point: ${endCorrect ? 'PASS' : 'FAIL'} (${end.x}, ${end.y})`);
  
  return startCorrect && endCorrect;
}

// Test 2: Connection Path Generation
function testConnectionPath() {
  console.log('🧪 Testing Connection Path Generation...');
  
  const { generateSimpleConnectionPath } = connectionUtils;
  
  const start = { x: 100, y: 50 };
  const end = { x: 200, y: 150 };
  
  const segments = generateSimpleConnectionPath(start, end);
  
  // Should have 3 segments for non-aligned points
  const segmentCountCorrect = segments.length === 3;
  
  // First segment should be vertical and maintain start X
  const firstSegmentCorrect = segments[0].orientation === 'vertical' && 
    segments[0].points[0].x === start.x;
  
  // Last segment should be vertical and maintain end X
  const lastSegmentCorrect = segments[2].orientation === 'vertical' && 
    segments[2].points[1].x === end.x;
  
  // Middle segment should be horizontal
  const middleSegmentCorrect = segments[1].orientation === 'horizontal';
  
  console.log(`  ✅ Segment count: ${segmentCountCorrect ? 'PASS' : 'FAIL'} (${segments.length})`);
  console.log(`  ✅ First segment: ${firstSegmentCorrect ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Middle segment: ${middleSegmentCorrect ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Last segment: ${lastSegmentCorrect ? 'PASS' : 'FAIL'}`);
  
  return segmentCountCorrect && firstSegmentCorrect && middleSegmentCorrect && lastSegmentCorrect;
}

// Test 3: Connection Validation
function testConnectionValidation() {
  console.log('🧪 Testing Connection Validation...');
  
  const { validateConnectionConstraints, calculateConnectionPoints, generateSimpleConnectionPath } = connectionUtils;
  
  const sourceStep = createTestStep(100, 100);
  const targetStep = createTestStep(200, 200);
  
  // Create a proper connection
  const { start, end } = calculateConnectionPoints(sourceStep, targetStep);
  const segments = generateSimpleConnectionPath(start, end);
  const connection = createConnection(sourceStep.id, targetStep.id, segments);
  
  const validation = validateConnectionConstraints(sourceStep, targetStep, connection);
  
  console.log(`  ✅ Valid connection: ${validation.isValid ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ No violations: ${validation.violations.length === 0 ? 'PASS' : 'FAIL'}`);
  
  if (validation.violations.length > 0) {
    console.log(`    Violations: ${validation.violations.join(', ')}`);
  }
  
  return validation.isValid && validation.violations.length === 0;
}

// Test 4: Store Integration
function testStoreIntegration() {
  console.log('🧪 Testing Store Integration...');
  
  try {
    const store = useElementsStore.getState();
    
    // Clear existing elements
    store.clearElements();
    
    // Add test elements
    const step1 = store.addStep({ x: 100, y: 100 });
    const step2 = store.addStep({ x: 200, y: 200 });
    
    // Add connection
    const connection = store.addConnection(step1.id, step2.id);
    
    // Validate all connections
    const validationResult = store.validateAllConnections();
    
    console.log(`  ✅ Connection created: ${connection ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Valid connections: ${validationResult.validConnections === 1 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ No violations: ${validationResult.violations.length === 0 ? 'PASS' : 'FAIL'}`);
    
    // Test constraint enforcement
    store.enforceAllConnectionConstraints();
    
    console.log(`  ✅ Constraint enforcement: PASS (no errors)`);
    
    return connection && validationResult.validConnections === 1 && validationResult.violations.length === 0;
  } catch (error) {
    console.log(`  ❌ Store integration failed: ${error.message}`);
    return false;
  }
}

// Test 5: Element Movement Integration
function testElementMovement() {
  console.log('🧪 Testing Element Movement Integration...');
  
  try {
    const store = useElementsStore.getState();
    
    // Clear and setup
    store.clearElements();
    const step1 = store.addStep({ x: 100, y: 100 });
    const step2 = store.addStep({ x: 200, y: 200 });
    store.addConnection(step1.id, step2.id);
    
    // Move element
    store.moveElement(step1.id, { x: 150, y: 150 });
    
    // Validate connections are still valid
    const validationResult = store.validateAllConnections();
    
    console.log(`  ✅ Element moved: PASS`);
    console.log(`  ✅ Connections still valid: ${validationResult.validConnections === 1 ? 'PASS' : 'FAIL'}`);
    
    return validationResult.validConnections === 1;
  } catch (error) {
    console.log(`  ❌ Element movement test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
function runConnectionConstraintTests() {
  console.log('🚀 Running Connection Constraint Tests...\n');
  
  const tests = [
    { name: 'Connection Points', fn: testConnectionPoints },
    { name: 'Connection Path', fn: testConnectionPath },
    { name: 'Connection Validation', fn: testConnectionValidation },
    { name: 'Store Integration', fn: testStoreIntegration },
    { name: 'Element Movement', fn: testElementMovement },
  ];
  
  let passed = 0;
  const total = tests.length;
  
  tests.forEach(test => {
    try {
      const result = test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: PASSED\n`);
      } else {
        console.log(`❌ ${test.name}: FAILED\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}\n`);
    }
  });
  
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All connection constraint tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }
  
  return passed === total;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runConnectionConstraintTests = runConnectionConstraintTests;
  (window as any).testConnectionPoints = testConnectionPoints;
  (window as any).testConnectionPath = testConnectionPath;
  (window as any).testConnectionValidation = testConnectionValidation;
  (window as any).testStoreIntegration = testStoreIntegration;
  (window as any).testElementMovement = testElementMovement;
}

export {
  runConnectionConstraintTests,
  testConnectionPoints,
  testConnectionPath,
  testConnectionValidation,
  testStoreIntegration,
  testElementMovement
};
