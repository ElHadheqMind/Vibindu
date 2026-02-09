
import { parseSfcDsl } from './src/services/sfc-compiler/dsl-parser.js';
import { compileSfc } from './src/services/sfc-compiler/core/compiler.js';

const code = `SFC "Loopback Test"
Step 0 (Initial)
Transition T0
Step 1
Action "L1"
Step 4
Transition T1
Jump 0`;

try {
    const input = parseSfcDsl(code);
    const output = compileSfc(input);
    console.log('--- Compilation Success ---');
    console.log('Total Elements:', output.elements.length);

    const steps = output.elements.filter(e => e.type === 'step');
    const transitions = output.elements.filter(e => e.type === 'transition');
    const connections = output.elements.filter(e => e.type === 'connection');

    console.log('Steps:', steps.length, steps.map(s => s.label));
    console.log('Transitions:', transitions.length, transitions.map(t => t.condition));
    console.log('Connections:', connections.length);

    // Check loopback connection (should be 1 per transition + 1 for loopback)
    // T0 (Step0->T0), Step 1 (T0->Step1), T1 (Step1->T1), Step 4 (T1->Step4), T2 (Step4->T2), Loopback (T2->Step0)
    // Wait, let's see how many connections were made.
} catch (e) {
    console.error('Error:', e);
}
