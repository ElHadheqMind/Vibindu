
import { parseSfcDsl } from './src/services/sfc-compiler/dsl-parser.js';
import { compileSfc } from './src/services/sfc-compiler/core/compiler.js';

const code = `SFC "Image Debug"
Step 0 (Initial)
Transition T0
Step 1
    Action "L1"
Step 4
Transition T1
Step 5
Transition T2
Jump 0`;

try {
    const input = parseSfcDsl(code);
    const output = compileSfc(input);
    console.log('--- Compilation Success ---');
    console.log('Total Elements:', output.elements.length);

    output.elements.forEach(e => {
        if (e.type !== 'connection') {
            console.log(`${e.type.toUpperCase()} ${e.label || e.condition || ''} y=${e.position.y}`);
        }
    });

    const jumpConn = output.elements.find(e => e.type === 'connection' && e.segments.length > 2);
    if (jumpConn) {
        console.log('Jump Connection First Point:', jumpConn.segments[0].points[0]);
    }

} catch (e) {
    console.error('Error:', e);
}
