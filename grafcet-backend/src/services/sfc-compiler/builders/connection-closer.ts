
import { v4 as uuidv4 } from 'uuid';
import { CompilerContext } from './step-builder.js';

export function closeGrafcet(
    ctx: CompilerContext,
    lastElementId: string,
    lastX: number,
    lastY: number,
    targetId: string,
    targetX: number,
    targetY: number
) {
    // Find the leftmost element in the diagram (matching guided mode lines 1199-1208)
    const leftmostX = ctx.elements.reduce((min, element) => {
        if (element.type === 'step' || element.type === 'transition') {
            return Math.min(min, element.position.x);
        }
        return min;
    }, targetX);

    // Calculate a safe offset to the left (at least 100px to the left of the leftmost element)
    const sideX = leftmostX - 100;

    const dropDownY = lastY + 40;

    ctx.elements.push({
        id: uuidv4(),
        type: 'connection',
        sourceId: lastElementId,
        targetId: targetId,
        segments: [
            {
                id: uuidv4(),
                points: [
                    { x: lastX + 20, y: lastY },
                    { x: lastX + 20, y: dropDownY }
                ],
                orientation: 'vertical'
            },
            {
                id: uuidv4(),
                points: [
                    { x: lastX + 20, y: dropDownY },
                    { x: sideX, y: dropDownY }
                ],
                orientation: 'horizontal'
            },
            {
                id: uuidv4(),
                points: [
                    { x: sideX, y: dropDownY },
                    { x: sideX, y: targetY - 50 }
                ],
                orientation: 'vertical'
            },
            {
                id: uuidv4(),
                points: [
                    { x: sideX, y: targetY - 50 },
                    { x: targetX + 20, y: targetY - 50 }
                ],
                orientation: 'horizontal'
            },
            {
                id: uuidv4(),
                points: [
                    { x: targetX + 20, y: targetY - 50 },
                    { x: targetX + 20, y: targetY }
                ],
                orientation: 'vertical'
            }
        ],
        position: { x: 0, y: 0 },
        selected: false
    });
}
