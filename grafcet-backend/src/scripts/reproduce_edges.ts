
import { SimulationService } from '../services/simulationService.js';
import { GrafcetDiagram } from '../types/index.js';

// Mock Diagram with 2 transitions: T1 (RE A), T2 (FE A)
const mockDiagram: GrafcetDiagram = {
    id: 'test',
    name: 'test',
    steps: [],
    transitions: [],
    connections: [],
    comments: [],
    elements: [
        { type: 'step', id: '1', number: '1', stepType: 'initial', x: 0, y: 0 },
        { type: 'step', id: '2', number: '2', stepType: 'normal', x: 0, y: 100 },
        { type: 'step', id: '3', number: '3', stepType: 'normal', x: 0, y: 200 },
        // T1: 1 -> 2 on RE(A)
        { type: 'transition', id: 'T1', number: '1', condition: 'RE A', x: 0, y: 50 },
        { type: 'connection', id: 'c1', sourceId: '1', targetId: 'T1', points: [] },
        { type: 'connection', id: 'c2', sourceId: 'T1', targetId: '2', points: [] },
        // T2: 2 -> 3 on FE(A)
        { type: 'transition', id: 'T2', number: '2', condition: 'FE A', x: 0, y: 150 },
        { type: 'connection', id: 'c3', sourceId: '2', targetId: 'T2', points: [] },
        { type: 'connection', id: 'c4', sourceId: 'T2', targetId: '3', points: [] }
    ]
};

async function testEdges() {
    console.log('--- Testing Edge Detection ---');
    let state = SimulationService.init(mockDiagram);
    console.log('Initial State:', state.activeSteps); // Should be ['1']

    // Scenarios
    // 1. A = 0. RE(A) should be False.
    console.log('\nStep 1: A=0');
    let res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: false } });
    state = res.state;
    console.log('Active Steps:', state.activeSteps); // ['1']
    if (state.activeSteps.includes('2')) console.error('FAIL: T1 fired on A=0');

    // 2. A = 1. RE(A) should be True (0 -> 1).
    console.log('\nStep 2: A=1');
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: true } });
    state = res.state;
    console.log('Active Steps:', state.activeSteps); // ['2']
    if (!state.activeSteps.includes('2')) console.error('FAIL: T1 did not fire on RE(A)');

    // 3. A = 1. RE(A) should be False (1 -> 1, steady state).
    console.log('\nStep 3: A=1 (Steady)');
    // Note: T1 is already done, we are in step 2. T2 condition is FE(A).
    // FE(A) should be False (1 -> 1).
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: true } });
    state = res.state;
    console.log('Active Steps:', state.activeSteps); // ['2']
    if (state.activeSteps.includes('3')) console.error('FAIL: T2 fired on steady A=1');

    // 4. A = 0. FE(A) should be True (1 -> 0).
    console.log('\nStep 4: A=0');
    res = SimulationService.executeStep(mockDiagram, state, { transitions: {}, variables: { A: false } });
    state = res.state;
    console.log('Active Steps:', state.activeSteps); // ['3']
    if (!state.activeSteps.includes('3')) console.error('FAIL: T2 did not fire on FE(A)');

    console.log('\n--- Test Complete ---');
}

testEdges().catch(console.error);
