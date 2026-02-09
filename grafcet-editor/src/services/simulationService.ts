import {
    GrafcetElement,
    Step,
    Transition,
    Connection
} from '../models/types';
import { SimulationVariable } from '../store/useSimulationStore';

export class SimulationService {
    /**
     * Evaluates the next state of the Grafcet based on current active steps and variable values.
     * Including advanced logic for Edge Detection (RE/FE) and Timers.
     */
    static evaluate(
        elements: GrafcetElement[],
        activeStepIds: string[],
        variableValues: Record<string, number | boolean>,
        variables: SimulationVariable[],
        stepActivationTimes: Record<string, number> = {},
        prevVariableValues: Record<string, number | boolean> = {}
    ): { nextActiveStepIds: string[]; firedTransitionIds: string[]; nextStepActivationTimes: Record<string, number> } {
        const steps = elements.filter(e => e.type === 'step') as Step[];
        const transitions = elements.filter(e => e.type === 'transition') as Transition[];

        const now = Date.now();
        const nextActiveStepIds = new Set(activeStepIds);
        const stepsToDeactivate = new Set<string>();
        const stepsToActivate = new Set<string>();
        const firedTransitionIds: string[] = [];
        const nextStepActivationTimes = { ...stepActivationTimes };

        // 1. Check Transitions
        for (const trans of transitions) {
            // A. Check ENABLING (All upstream steps active)
            const upstreamStepIds = this.getUpstreamSteps(trans.id, elements);
            if (upstreamStepIds.length === 0) continue;

            const isEnabled = upstreamStepIds.every(id => activeStepIds.includes(id));
            if (!isEnabled) continue;

            // B. Check CONDITION
            // Prepare variables including Xn and Xn.t
            const stepVars: Record<string, any> = {};
            activeStepIds.forEach(stepId => {
                const step = steps.find(s => s.id === stepId);
                const stepName = step?.number || stepId;
                // Xn
                stepVars[`X${stepName}`] = true;
                // Xn.t (Time in SECONDS)
                const startTime = stepActivationTimes[stepId] || now;
                const elapsedMs = now - startTime;
                stepVars[`X${stepName}.t`] = elapsedMs / 1000.0;
            });

            // Map standard variables by NAME -> Value
            const stdVars: Record<string, any> = {};
            variables.forEach(v => {
                stdVars[v.name] = variableValues[v.id] ?? v.value;
            });
            // Map prev standard variables by NAME -> Value
            const prevStdVars: Record<string, any> = {};
            variables.forEach(v => {
                prevStdVars[v.name] = prevVariableValues[v.id] ?? false; // Default false?
            });

            const currentVars = {
                ...stdVars,
                ...stepVars
            };

            const isVariableMet = this.evaluateCondition(trans.condition, currentVars, prevStdVars);

            if (isVariableMet) {
                firedTransitionIds.push(trans.id);
            }
        }

        // 2. Fire Transitions
        for (const transId of firedTransitionIds) {
            // Deactivate upstream steps
            const upstreamStepIds = this.getUpstreamSteps(transId, elements);
            upstreamStepIds.forEach(id => {
                stepsToDeactivate.add(id);
                delete nextStepActivationTimes[id];
            });

            // Activate downstream steps
            const downstreamStepIds = this.getDownstreamSteps(transId, elements);
            downstreamStepIds.forEach(id => {
                stepsToActivate.add(id);
                nextStepActivationTimes[id] = now;
            });
        }

        // Apply
        stepsToDeactivate.forEach(id => nextActiveStepIds.delete(id));
        stepsToActivate.forEach(id => nextActiveStepIds.add(id));

        return {
            nextActiveStepIds: Array.from(nextActiveStepIds),
            firedTransitionIds,
            nextStepActivationTimes
        };
    }

    /**
     * Helper to find upstream steps for a node (handling Convergence/OR-gates)
     */
    private static getUpstreamSteps(targetId: string, elements: GrafcetElement[]): string[] {
        const upstreamSteps: string[] = [];
        const visited = new Set<string>();

        const traverse = (currentId: string) => {
            if (visited.has(currentId)) return;
            visited.add(currentId);

            // Find connections entering execution node
            const incomingConnections = elements.filter(
                e => e.type === 'connection' && (e as Connection).targetId === currentId
            ) as Connection[];

            incomingConnections.forEach(conn => {
                const sourceElement = elements.find(e => e.id === conn.sourceId);
                if (!sourceElement) return;

                if (sourceElement.type === 'step') {
                    upstreamSteps.push(sourceElement.id);
                } else if (sourceElement.type === 'or-gate' || sourceElement.type === 'and-gate') {
                    // Recursively find steps feeding into the gate
                    traverse(sourceElement.id);
                }
            });
        };

        traverse(targetId);
        return upstreamSteps;
    }

    /**
    * Helper to find downstream steps for a node (handling Divergence/AND/OR-gates)
    */
    private static getDownstreamSteps(sourceId: string, elements: GrafcetElement[]): string[] {
        const downstreamSteps: string[] = [];
        const visited = new Set<string>();

        const traverse = (currentId: string) => {
            if (visited.has(currentId)) return;
            visited.add(currentId);

            // Find connections leaving this node
            const outgoingConnections = elements.filter(
                e => e.type === 'connection' && (e as Connection).sourceId === currentId
            ) as Connection[];

            outgoingConnections.forEach(conn => {
                const targetElement = elements.find(e => e.id === conn.targetId);
                if (!targetElement) return;

                if (targetElement.type === 'step') {
                    downstreamSteps.push(targetElement.id);
                } else if (targetElement.type === 'or-gate' || targetElement.type === 'and-gate') {
                    // Recursively find steps flowing out of the gate
                    traverse(targetElement.id);
                }
            });
        };

        traverse(sourceId);
        return downstreamSteps;
    }


    /**
     * Safely evaluates a boolean condition string against provided variables.
     * Supports: AND, OR, NOT, RE, FE, >, <, >=, <=, parentheses, variable names, and literals (5s, 100ms).
     * Uses Shunting-yard algorithm.
     */
    static evaluateCondition(condition: string, variables: Record<string, any>, prevVariables: Record<string, any> = {}): boolean {
        if (!condition) return false;

        // Normalize and Tokenize
        let normalized = condition
            .replace(/\(/g, ' ( ')
            .replace(/\)/g, ' ) ')
            .replace(/>=/g, ' >= ')
            .replace(/<=/g, ' <= ')
            .replace(/>(?!=)/g, ' > ')
            .replace(/<(?!=)/g, ' < ')
            .trim();

        const tokens = normalized.split(/\s+/).filter(t => t.length > 0);

        // Shunting-yard
        const outputQueue: string[] = [];
        const operatorStack: string[] = [];

        const precedence: Record<string, number> = {
            'NOT': 5, 'RE': 5, 'FE': 5,
            '>': 4, '<': 4, '>=': 4, '<=': 4, // Comparators
            'AND': 2, '*': 2, '.': 2,
            'OR': 1, '+': 1,
            '(': 0
        };

        for (const token of tokens) {
            const upperToken = token.toUpperCase();

            if (['AND', 'OR', 'NOT', '*', '.', '+', 'RE', 'FE', '>', '<', '>=', '<='].includes(upperToken)) {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    precedence[operatorStack[operatorStack.length - 1]] >= precedence[upperToken]
                ) {
                    if (['NOT', 'RE', 'FE'].includes(upperToken) && precedence[operatorStack[operatorStack.length - 1]] < precedence[upperToken]) {
                        break;
                    }
                    outputQueue.push(operatorStack.pop()!);
                }
                operatorStack.push(upperToken);
            } else if (token === '(') {
                operatorStack.push('(');
            } else if (token === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop()!);
                }
                operatorStack.pop();

                if (operatorStack.length > 0) {
                    const top = operatorStack[operatorStack.length - 1];
                    if (top === 'RE' || top === 'FE') {
                        outputQueue.push(operatorStack.pop()!);
                    }
                }
            } else {
                outputQueue.push(token);
            }
        }

        while (operatorStack.length > 0) {
            outputQueue.push(operatorStack.pop()!);
        }

        // Evaluate RPN
        const evalStack: any[] = [];

        const parseTimeLiteral = (val: string): number | null => {
            const match = val.match(/^(\d+)(s|ms)$/);
            if (!match) return null;
            const num = parseInt(match[1]);
            const unit = match[2];
            return unit === 's' ? num : num / 1000;
        };

        for (const token of outputQueue) {
            const upperToken = token.toUpperCase();
            const pop = () => evalStack.pop();

            if (['AND', '*', '.', 'OR', '+'].includes(upperToken)) {
                const b = pop();
                const a = pop();
                const valA = typeof a === 'object' ? a.val : a;
                const valB = typeof b === 'object' ? b.val : b;
                if (['AND', '*', '.'].includes(upperToken)) evalStack.push({ val: !!valA && !!valB });
                else evalStack.push({ val: !!valA || !!valB });
            } else if (['>', '<', '>=', '<='].includes(upperToken)) {
                let b = pop();
                let a = pop();
                const valA = typeof a === 'object' ? a.val : a;
                const valB = typeof b === 'object' ? b.val : b;

                let res = false;
                if (upperToken === '>') res = valA > valB;
                else if (upperToken === '<') res = valA < valB;
                else if (upperToken === '>=') res = valA >= valB;
                else res = valA <= valB;

                evalStack.push({ val: res });
            } else if (upperToken === 'NOT') {
                const a = pop();
                const valA = typeof a === 'object' ? a.val : a;
                evalStack.push({ val: !valA });
            } else if (upperToken === 'RE' || upperToken === 'FE') {
                const a = pop();
                // Use ID (variable name) if available
                const curr = typeof a === 'object' ? a.val : a;
                const id = typeof a === 'object' ? a.id : null;
                const prevVal = id ? !!prevVariables[id] : false;

                if (upperToken === 'RE') evalStack.push({ val: !prevVal && !!curr });
                else evalStack.push({ val: prevVal && !curr });
            } else if (upperToken === 'TRUE' || token === '1') {
                evalStack.push({ val: true });
            } else if (upperToken === 'FALSE' || token === '0') {
                evalStack.push({ val: false });
            } else {
                // Literal or Variable
                const timeVal = parseTimeLiteral(token);
                if (timeVal !== null) {
                    evalStack.push({ val: timeVal });
                } else if (!isNaN(Number(token)) && token.trim() !== '') {
                    evalStack.push({ val: Number(token) });
                } else {
                    // Variable
                    const val = variables[token] ?? false;
                    evalStack.push({ val: val, id: token });
                }
            }
        }

        if (evalStack.length !== 1) return false;
        const res = evalStack[0];
        return typeof res === 'object' ? res.val : res;
    }
}
