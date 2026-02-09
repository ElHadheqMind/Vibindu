
import { SimulationService } from '../services/simulationService.js';
import { GrafcetDiagram } from '../types/index.js';

// Comprehensive Mock Diagram
const mockDiagram: GrafcetDiagram = {
    id: 'full_test',
    name: 'Full Logic Test',
    steps: [],
    transitions: [],
    connections: [],
    comments: [],
    elements: [
        // Steps
        { type: 'step', id: '1', number: '1', stepType: 'initial', x: 0, y: 0 },
        { type: 'step', id: '2', number: '2', stepType: 'normal', x: 0, y: 100 },
        { type: 'step', id: '3', number: '3', stepType: 'normal', x: 0, y: 200 },
        { type: 'step', id: '4', number: '4', stepType: 'normal', x: 0, y: 300 },

        // Transitions
        // T1: Basic AND + Implicit .
        { type: 'transition', id: 'T1', number: '1', condition: 'A . B', x: 0, y: 50 },
        // T2: Implicit OR + Dot Notation
        { type: 'transition', id: 'T2', number: '2', condition: 'T.T0 + C', x: 0, y: 150 },
        // T3: Rising Edge
        { type: 'transition', id: 'T3', number: '3', condition: 'RE D', x: 0, y: 250 },
        // T4: Timer
        { type: 'transition', id: 'T4', number: '4', condition: 'X3.t > 1s', x: 0, y: 350 },

        // Connections (Linear Sequence: 1 -> T1 -> 2 -> T2 -> 3 -> T3 -> 4 -> T4 -> 1)
        { type: 'connection', id: 'c1', sourceId: '1', targetId: 'T1' }, { type: 'connection', id: 'c2', sourceId: 'T1', targetId: '2' },
        { type: 'connection', id: 'c3', sourceId: '2', targetId: 'T2' }, { type: 'connection', id: 'c4', sourceId: 'T2', targetId: '3' },
        { type: 'connection', id: 'c5', sourceId: '3', targetId: 'T3' }, { type: 'connection', id: 'c6', sourceId: 'T3', targetId: '4' },
        { type: 'connection', id: 'c7', sourceId: '4', targetId: 'T4' }, { type: 'connection', id: 'c8', sourceId: 'T4', targetId: '1' },
    ].map(e => ({ ...e, position: { x: (e as any).x || 0, y: (e as any).y || 0 }, points: [] })) as any
};

async function runTests() {
    console.log('--- Starting Comprehensive Simulation Verification ---');
    const start = 1000000;

    // Init
    let state = SimulationService.init(mockDiagram);
    state.stepActivationTimes['1'] = start;
    console.log('[Init] Active:', state.activeSteps); // ['1']

    // 1. Test Implicit AND (A . B)
    console.log('\n--- Test 1: Implicit AND (A . B) ---');
    // Try A=1, B=0 (Should fail)
    let res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: true, B: false } });
    if (res.state.activeSteps.includes('2')) console.error('FAIL: T1 fired with A=1, B=0');
    else console.log('PASS: T1 held (A=1, B=0)');

    // Try A=1, B=1 (Should fire)
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: true, B: true } });
    state = res.state;
    if (state.activeSteps.includes('2')) console.log('PASS: T1 fired (A=1, B=1)');
    else console.error('FAIL: T1 did not fire (A=1, B=1). Active:', state.activeSteps);

    // 2. Test Implicit OR + Dot Notation (T.T0 + C)
    console.log('\n--- Test 2: Implicit OR + Dot Var (T.T0 + C) ---');
    // Try T.T0=1 (Should fire)
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { 'T.T0': true, C: false } });
    state = res.state;
    if (state.activeSteps.includes('3')) {
        console.log('PASS: T2 fired (T.T0=1)');
        state.stepActivationTimes['3'] = start + 5000; // Mock activation time for X3
    } else console.error('FAIL: T2 did not fire (T.T0=1)');

    // 3. Test Rising Edge (RE D)
    console.log('\n--- Test 3: Rising Edge (RE D) ---');
    // D=0 (Steady Low)
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { D: false } });
    state = res.state;
    // D=1 (Rising Edge) -> Should Fire
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { D: true } });
    state = res.state;
    if (state.activeSteps.includes('4')) {
        console.log('PASS: T3 fired on RE(D)');
        state.stepActivationTimes['4'] = start + 10000; // Activation time for X4
    } else console.error('FAIL: T3 did not fire on RE(D)');

    // 4. Test Timer (X3.t > 1s) - Wait, we are in Step 4 now. T4 condition is X3.t...
    // My Diagram logic: T4 connects 4 -> 1.
    // Wait, T4 condition should probably be X4.t > 1s for the sequence to make sense.
    // Let's re-eval: The diagram says T4 condition is "X3.t > 1s". 
    // If we are in Step 4, X3 is NOT active (unless it was kept active, but this is a linear sequence).
    // So X3 is false. X3.t should be... undefined or 0?
    // In strict Grafcet, Xn.t is valid only if Xn is active? Or it resets?
    // Usually Xn.t is the time SINCE Xn last activation.
    // If X3 is NOT active, X3.t is usually 0.
    // Let's Test that!

    // Testing Cross-Step Timer Ref:
    // If I want to test "Wait 1s in Step 4", condition should be "X4.t > 1s".
    // If I test "X3.t > 1s" while in Step 4, it should fail if X3 is inactive.

    // Let's modify the diagram in-memory for the test to be "X4.t > 1s" which is the standard usage.
    const t4 = mockDiagram.elements.find(e => e.id === 'T4') as any;
    t4.condition = 'X4.t > 1s';

    console.log('\n--- Test 4: Timer (X4.t > 1s) ---');
    state.stepActivationTimes['4'] = start + 10000;

    // Time = Start + 10000 + 500ms (0.5s elapsed)
    res = SimulationService.executeStep(mockDiagram, state, {
        transitions: {}, variables: {}, currentTime: start + 10500
    });
    if (res.state.activeSteps.includes('1')) console.error('FAIL: T4 fired early (0.5s)');
    else console.log('PASS: T4 held (0.5s)');

    // Time = Start + 10000 + 1500ms (1.5s elapsed)
    res = SimulationService.executeStep(mockDiagram, state, {
        transitions: {}, variables: {}, currentTime: start + 11500
    });
    if (res.state.activeSteps.includes('1')) console.log('PASS: T4 fired (1.5s)');
    else console.error('FAIL: T4 did not fire (1.5s). Active:', res.state.activeSteps);

    console.log('\n--- Verification Complete ---');
}

runTests().catch(console.error);
