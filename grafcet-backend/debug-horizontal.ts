
import { parseSfcDsl } from './src/services/sfc-compiler/dsl-parser.js';
import { compileSfc } from './src/services/sfc-compiler/core/compiler.js';
import * as fs from 'fs';

const code = `
Step 0 (Initial)
Transition "Start"
Step 1
    Action "Initialize1"
    Action "Initialize2"

Transition "Ready"
Step 2
    Action "Process"
Transition "Done"
Jump 0
`;

const parserInput = parseSfcDsl(code);
const result = compileSfc(parserInput);

fs.writeFileSync('horizontal-debug.json', JSON.stringify(result, null, 2));
console.log('Done');
