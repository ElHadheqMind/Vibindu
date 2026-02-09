
import { ElementInput, CompilerInput } from './schemas.js';

export function parseSfcDsl(code: string): CompilerInput {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const sequence: ElementInput[] = [];

    // Stack for handling branches and divergences
    const stack: { branches: ElementInput[][], type: 'AND' | 'OR' }[] = [];
    let currentSequence = sequence;

    for (const line of lines) {
        if (line.startsWith('SFC')) continue;

        if (line.startsWith('Divergence')) {
            const type = line.includes('AND') ? 'AND' : 'OR';
            stack.push({ branches: [], type });
            continue;
        }

        if (line.startsWith('Branch')) {
            const newBranch: ElementInput[] = [];
            stack[stack.length - 1].branches.push(newBranch);
            currentSequence = newBranch;
            continue;
        }

        if (line.startsWith('EndBranch')) continue;

        if (line.startsWith('EndDivergence') || line.startsWith('Converge')) {
            const div = stack.pop();
            if (div) {
                const divergenceElement: any = {
                    type: 'divergence',
                    divergenceType: div.type,
                    branches: div.branches
                };

                if (stack.length === 0) {
                    sequence.push(divergenceElement);
                    currentSequence = sequence;
                } else {
                    const parentDiv = stack[stack.length - 1];
                    const activeBranch = parentDiv.branches[parentDiv.branches.length - 1];
                    activeBranch.push(divergenceElement);
                    currentSequence = activeBranch;
                }
            }
            continue;
        }

        // 1. Step parser - only accepts: Step NUMBER
        const stepMatch = line.match(/^Step\s+(\d+)\s*(\(([^)]+)\))?/i);
        if (stepMatch) {
            const number = stepMatch[1];
            const typeText = stepMatch[3] ? stepMatch[3].toLowerCase() : 'normal';

            currentSequence.push({
                type: 'step',
                name: number, // Display the step number in the box
                stepType: typeText === 'initial' ? 'initial' :
                    typeText === 'task' ? 'task' :
                        typeText === 'macro' ? 'macro' : 'normal',
                actions: []
            });
            continue;
        }

        // 2. Action parser (still attaches to last STEP in the current sequence)
        const actionMatch = line.match(/^Action\s+("?([^"]+)"?)\s*(\(([^)]+)\))?/i);
        if (actionMatch) {
            const label = actionMatch[2] || actionMatch[1];
            const meta = actionMatch[4] || "";

            const typeAttr = meta.match(/Type=([^,)]+)/i)?.[1] || 'normal';
            const condAttr = meta.match(/Condition="?([^"]+)"?/i)?.[1] || '';

            const lastItem = currentSequence[currentSequence.length - 1];
            if (lastItem && lastItem.type === 'step') {
                lastItem.actions = lastItem.actions || [];
                const lowerType = typeAttr.toLowerCase();
                const type: any = (lowerType === 'temporal' || lowerType === 'delayed' || lowerType === 'limited') ? 'temporal' : 'normal';
                lastItem.actions.push({
                    content: label.trim(),
                    qualifier: condAttr,
                    type: type
                });
            }
            continue;
        }

        // 3. Independent Transition parser - only accepts: Transition CONDITION
        const transMatch = line.match(/^Transition\s+(.+)/i);
        if (transMatch) {
            const condition = transMatch[1].trim();
            currentSequence.push({
                type: 'transition',
                condition: condition
            });
            continue;
        }

        // 4. Independent Jump parser
        const jumpMatch = line.match(/^Jump\s+(\d+|[^\s"]+)/i);
        if (jumpMatch) {
            const target = jumpMatch[1];
            currentSequence.push({
                type: 'jump',
                target: target
            });
            continue;
        }
    }

    return { sequence };
}
