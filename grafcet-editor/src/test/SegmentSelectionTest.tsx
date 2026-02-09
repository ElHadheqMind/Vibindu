import React, { useEffect } from 'react';
import { useElementsStore } from '../store/useElementsStore';
import { useEditorStore } from '../store/useEditorStore';
import { createStep, createTransition } from '../models/GrafcetElements';

/**
 * Test component to create a simple GRAFCET diagram for testing segment selection
 * This creates a basic flow: Step1 -> Transition1 -> Step2 -> Transition2 -> Step3
 */
export const SegmentSelectionTest: React.FC = () => {
  const { addElement, addConnection, clearElements } = useElementsStore();
  const { setCurrentTool } = useEditorStore();

  useEffect(() => {
    // Clear existing elements
    clearElements();

    // Create test elements
    const step1 = createStep({ x: 100, y: 100 }, 'initial');
    step1.number = 1;
    step1.label = 'Start';

    const transition1 = createTransition({ x: 95, y: 200 }, 1);
    transition1.condition = 'Start condition';

    const step2 = createStep({ x: 100, y: 300 }, 'normal');
    step2.number = 2;
    step2.label = 'Process';

    const transition2 = createTransition({ x: 95, y: 400 }, 2);
    transition2.condition = 'Process complete';

    const step3 = createStep({ x: 100, y: 500 }, 'normal');
    step3.number = 3;
    step3.label = 'End';

    // Add elements to store
    addElement(step1);
    addElement(transition1);
    addElement(step2);
    addElement(transition2);
    addElement(step3);

    // Create connections with complex paths to test segment selection
    // Connection 1: Step1 -> Transition1 (simple vertical connection)
    addConnection(step1.id, transition1.id);

    // Connection 2: Transition1 -> Step2 (simple vertical connection)
    addConnection(transition1.id, step2.id);

    // Connection 3: Step2 -> Transition2 (simple vertical connection)
    addConnection(step2.id, transition2.id);

    // Connection 4: Transition2 -> Step3 (simple vertical connection)
    addConnection(transition2.id, step3.id);

    // Create more complex connections for better testing
    // Add steps to the side to create connections with multiple segments
    const sideStep1 = createStep({ x: 300, y: 200 }, 'normal');
    sideStep1.number = 4;
    sideStep1.label = 'Side A';

    const sideStep2 = createStep({ x: 500, y: 300 }, 'normal');
    sideStep2.number = 5;
    sideStep2.label = 'Side B';

    const sideStep3 = createStep({ x: 300, y: 450 }, 'normal');
    sideStep3.number = 6;
    sideStep3.label = 'Side C';

    addElement(sideStep1);
    addElement(sideStep2);
    addElement(sideStep3);

    // Create connections that will definitely have multiple segments
    // These connections span different X and Y coordinates, forcing complex paths
    addConnection(step1.id, sideStep1.id);  // Horizontal then vertical
    addConnection(sideStep1.id, sideStep2.id);  // Complex path
    addConnection(sideStep2.id, step3.id);  // Back to main flow
    addConnection(step2.id, sideStep3.id);  // Another complex path

    // Set tool to select mode for testing
    setCurrentTool('select');

    console.log('✅ Test GRAFCET diagram created for segment selection testing');
    console.log('📋 Instructions:');
    console.log('1. Click on a connection to select it');
    console.log('2. Look for segment handles (circles) on intermediate segments');
    console.log('3. Click on a handle to select that segment (should turn green)');
    console.log('4. Use arrow keys to move the selected segment');
    console.log('5. Try selecting first/last segments (should not be selectable)');
    console.log('6. Press Escape to clear segment selection');

    // Verify the implementation after a short delay
    setTimeout(() => {
      const elements = useElementsStore.getState().elements;
      const connections = elements.filter(e => e.type === 'connection');
      console.log('🔍 Verification:');
      console.log(`- Created ${elements.length} elements`);
      console.log(`- Created ${connections.length} connections`);
      connections.forEach((conn: any, index) => {
        console.log(`- Connection ${index + 1}: ${conn.segments?.length || 0} segments`);
      });
    }, 1000);
  }, [addElement, addConnection, clearElements, setCurrentTool]);

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4>Segment Selection Test</h4>
      <p>Test diagram loaded. Instructions:</p>
      <ol style={{ margin: 0, paddingLeft: '20px' }}>
        <li>Select a connection</li>
        <li>Click segment handles (circles)</li>
        <li>Use arrow keys to move</li>
        <li>Press Escape to deselect</li>
      </ol>
      <p><strong>Note:</strong> First/last segments are protected</p>
      <button
        onClick={() => {
          // Test keyboard functionality programmatically
          const selectedSegment = useEditorStore.getState().getSelectedSegment();
          if (selectedSegment) {
            console.log('🧪 Testing keyboard movement for segment:', selectedSegment);
            const moveFunction = (window as any).moveSelectedSegment;
            if (moveFunction) {
              moveFunction({ x: 10, y: 0 });
              console.log('✅ Programmatic movement test completed');
            } else {
              console.log('❌ No movement function available');
            }
          } else {
            console.log('⚠️ No segment selected for testing');
          }
        }}
        style={{ marginTop: '10px', padding: '5px', fontSize: '10px' }}
      >
        Test Movement
      </button>
    </div>
  );
};

export default SegmentSelectionTest;
