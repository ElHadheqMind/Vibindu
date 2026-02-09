
import { parseSfcDsl } from './src/services/sfc-compiler/dsl-parser.js';
import { compileSfc } from './src/services/sfc-compiler/core/compiler.js';

const code = `SFC "Refactor Verification"
Step 0 (Initial)
Transition T0 "Ready"
Step 1 
    Action "L1"

Step 4 
Transition T1 
Step 4 
Transition T1 
Jump 0`;

try {
    const input = parseSfcDsl(code);
    console.log('Parser Sequence:', JSON.stringify(input.sequence.map(s => s.type), null, 2));

    const output = compileSfc(input);
    console.log('--- Compilation Success ---');
    console.log('Total Elements:', output.elements.length);

    const steps = output.elements.filter(e => e.type === 'step');
    const transitions = output.elements.filter(e => e.type === 'transition');
    const connections = output.elements.filter(e => e.type === 'connection');

    console.log('Steps:', steps.length, steps.map(s => s.label));
    console.log('Transitions:', transitions.length, transitions.map(t => t.condition));
    console.log('Connections:', connections.length);

    // Verify connections: 
    // Step 0 -> T0 (1)
    // T0 -> Step 1 (2)
    // Step 1 -> Step 4 (3) - wait, is there a transition between Step 1 and Step 4 in the DSL?
    // In the user's DSL: Transition T0, Step 1, <empty>, Step 4. 
    // So Step 1 connects to Step 4.
    // Step 4 -> T1 (4)
    // T1 -> Step 4 (5)
    // Step 4 -> T1 (6)
    // T1 -> Jump 0 (7)

} catch (e) {
    console.error('Error:', e);
}
