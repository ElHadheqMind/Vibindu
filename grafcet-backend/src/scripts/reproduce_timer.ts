
import { SimulationService } from '../services/simulationService.js';
import { GrafcetDiagram } from '../types/index.js';

// Mock Diagram with 2 steps and 1 timer transition
// Step 1 -> T1 (X1.t > 2s) -> Step 2
const mockDiagram: GrafcetDiagram = {
    id: 'timer_test',
    name: 'Timer Test',
    steps: [],
    transitions: [],
    connections: [],
    comments: [],
    elements: [
        { type: 'step', id: '1', number: '1', stepType: 'initial', x: 0, y: 0 },
        { type: 'step', id: '2', number: '2', stepType: 'normal', x: 0, y: 100 },
        { type: 'transition', id: 'T1', number: '1', condition: 'X1.t > 2s', x: 0, y: 50 },
        { type: 'connection', id: 'c1', sourceId: '1', targetId: 'T1', sourceHandle: 'bottom', targetHandle: 'top' },
        { type: 'connection', id: 'c2', sourceId: 'T1', targetId: '2', sourceHandle: 'bottom', targetHandle: 'top' },
        // Add positions to satisfy linter (basic check)
    ].map(e => ({ ...e, position: { x: (e as any).x, y: (e as any).y } })) as any
};

async function testTimer() {
    console.log('--- Testing Timer Logic ---');
    const startTime = 1000000; // Arbitrary start time
    // Patch Date.now? We use injected currentTime.

    // Init state. Note: Init calls Date.now().
    // We can't easily inject time into init() unless we hack it, OR we just trust executeStep updates?
    // SimulationService.init sets activationTimes to Date.now().
    // This makes deterministic testing hard if we can't control Init time.
    // Hack: Manually override state after init.

    let state = SimulationService.init(mockDiagram);
    state.stepActivationTimes['1'] = startTime;
    console.log('Initial State: Active Steps:', state.activeSteps, 'Start Time:', startTime);

    // Scenario 1: t = 1s. X1.t = 1s. Condition > 2s should be FALSE.
    console.log('\nTime: +1s (X1.t = 1s)');
    let res = SimulationService.executeStep(mockDiagram, state, {
        transitions: {},
        variables: {},
        currentTime: startTime + 1000
    });
    // State shouldn't change
    if (res.state.activeSteps.includes('2')) console.error('FAIL: T1 fired too early');
    else console.log('PASS: T1 did not fire.');

    // Scenario 2: t = 2.5s. X1.t = 2.5s. Condition > 2s should be TRUE.
    console.log('\nTime: +2.5s (X1.t = 2.5s)');
    res = SimulationService.executeStep(mockDiagram, state, {
        transitions: {},
        variables: {},
        currentTime: startTime + 2500
    });

    if (res.state.activeSteps.includes('2')) {
        console.log('PASS: T1 fired.');
    } else {
        console.error('FAIL: T1 did not fire. Active Steps:', res.state.activeSteps);
    }

    console.log('--- Test Complete ---');
}

testTimer().catch(console.error);
