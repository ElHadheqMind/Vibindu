
import { parseSfcDsl } from './src/services/sfc-compiler/dsl-parser.js';
import { compileSfc } from './src/services/sfc-compiler/core/compiler.js';

const code = `SFC "Official Export Demo"
Step 0 (Initial) "Setup"
Transition T0 "Ready"
Step 1 "Running"
    Action "L1"
    Action "Timer" (Type=Temporal, Condition="10s")
Divergence AND
    Branch
        Step 2 "Task A"
    EndBranch
    Branch
        Step 3 "Task B"
    EndBranch
EndDivergence
Converge AND
Step 4 "Finished"
Transition T1 "Reset"`;

try {
    const input = parseSfcDsl(code);
    console.log('Parser Input:', JSON.stringify(input, null, 2));
    const output = compileSfc(input);
    console.log('Final Elements Count:', output.elements.length);
    console.log('Final Elements:', JSON.stringify(output.elements, null, 2));
} catch (e) {
    console.error('Error:', e);
}
