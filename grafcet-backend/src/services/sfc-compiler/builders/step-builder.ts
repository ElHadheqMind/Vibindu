
import { v4 as uuidv4 } from 'uuid';
import { StepInput } from '../schemas.js';
import {
    DEFAULT_STEP_SIZE,
    DEFAULT_ACTION_BLOCK_SIZE
} from '../core/constants.js';

export interface CompilerContext {
    elements: any[];
    currentY: number;
    nextTransitionNumber: number;
}

/**
 * Simplified Step Builder. 
 * Only responsible for creating the Step and its Actions.
 * Connections are handled by the core compiler.
 */
export function addStep(
    ctx: CompilerContext,
    stepData: StepInput,
    x: number
): { stepId: string, nextStepY: number } {

    const stepId = stepData.id || uuidv4();
    const stepY = ctx.currentY;

    // 1. Create Step
    const step = {
        id: stepId,
        type: 'step',
        stepType: stepData.stepType,
        number: parseInt(stepData.name.replace(/\D/g, '')) || 0,
        position: { x, y: stepY },
        size: DEFAULT_STEP_SIZE,
        selected: false
    };
    ctx.elements.push(step);

    // 2. Add Actions (if any)
    if (stepData.actions && stepData.actions.length > 0) {
        stepData.actions.forEach((action, index) => {
            ctx.elements.push({
                id: uuidv4(),
                type: 'action-block',
                parentId: stepId,
                label: action.content || 'Action',
                condition: action.qualifier || '',
                actionType: action.type,
                index: index,
                position: {
                    x: x + DEFAULT_STEP_SIZE.width + 10 + (index * DEFAULT_ACTION_BLOCK_SIZE.width),
                    y: stepY
                },
                size: DEFAULT_ACTION_BLOCK_SIZE,
                selected: false
            });
        });
    }

    // Step height is constant 40
    const nextStepY = stepY + DEFAULT_STEP_SIZE.height;

    return { stepId, nextStepY };
}
