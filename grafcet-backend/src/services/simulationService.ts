import type {
    GrafcetDiagram,
    GrafcetElement
} from '../types/index.js';

interface ActionBlock {
    type: string;
    content?: string;
    qualifier?: string;
    condition?: string;
    duration?: string;
}

interface Step extends GrafcetElement {
    stepType: 'initial' | 'normal' | 'macro';
    actions?: ActionBlock[];
}

interface Transition extends GrafcetElement {
    condition: string;
}

interface Connection extends GrafcetElement {
    sourceId: string;
    targetId: string;
}
interface SimulationState {
    activeSteps: string[]; // List of Step IDs
    variables: Record<string, any>;
    stepActivationTimes: Record<string, number>; // Map of Step ID -> Timestamp (ms)
}

interface SimulationInputs {
    transitions: Record<string, boolean>; // Map of Transition ID -> isActive/True
    variables: Record<string, any>; // Sensor inputs
    currentTime?: number; // Optional timestamp for deterministic simulation
}

interface SimulationResult {
    state: SimulationState;
    actions: { variable: string; value: any; type: string }[];
}

export class SimulationService {

    /**
     * Initializes the simulation state for a given diagram.
     * Activates all initial steps.
     */
    static init(diagram: GrafcetDiagram): SimulationState {
        const initialSteps = diagram.elements
            .filter(el => el.type === 'step' && (
                (el as any).stepType === 'initial' ||
                (el as any).initial === true
            ))
            .map(el => el.id);

        const now = Date.now();
        const activationTimes: Record<string, number> = {};
        initialSteps.forEach(id => activationTimes[id] = now);

        return {
            activeSteps: initialSteps as string[],
            variables: {},
            stepActivationTimes: activationTimes
        };
    }

    /**
     * Executes one evaluation cycle of the SFC.
     * 1. Check enabled transitions (all upstream steps active).
     * 2. Check clearable transitions (condition is true).
     * 3. Fire transitions (deactivate upstream, activate downstream).
     * 4. Update actions.
     */
    static executeStep(
        diagram: GrafcetDiagram,
        currentState: SimulationState,
        inputs: SimulationInputs,
        globalActions: ActionBlock[] = []
    ): SimulationResult {

        const now = inputs.currentTime ?? Date.now();
        const nextActiveSteps = new Set(currentState.activeSteps);
        const stepsToDeactivate = new Set<string>();
        const stepsToActivate = new Set<string>();
        const nextActivationTimes = { ...currentState.stepActivationTimes };

        // Map elements for easy lookup
        const elementsMap = new Map<string, GrafcetElement>();
        diagram.elements.forEach(el => elementsMap.set(el.id, el));

        // Find Transitions
        const transitions = diagram.elements.filter(el => el.type === 'transition') as Transition[];

        // Find Connections
        const connections = diagram.elements.filter(el => el.type === 'connection') as any[]; // Type assertion needed?

        // 1. Identify CLEARABLE transitions
        const transitionsToFire: string[] = [];

        for (const trans of transitions) {
            // A. Check if ENABLED: All upstream steps must be active
            const upstreamLinks = connections.filter(c => c.targetId === trans.id);
            if (upstreamLinks.length === 0) continue; // Floating transition?

            const upstreamStepIds = upstreamLinks.map(c => c.sourceId);
            const isEnabled = upstreamStepIds.every(id => currentState.activeSteps.includes(id));

            if (!isEnabled) continue;

            // B. Check CONDITION
            // 1. Explicit Transition Trigger (e.g. user clicked the transition)
            const isExplicitTrigger = inputs.transitions[trans.id] === true;

            // 2. Variable evaluation (e.g. variable "SensorA" is true)
            // Use safe evaluator for conditions like "A AND B" or "T.T0"
            const conditionString = (trans as any).condition;
            let isVariableMet = false;

            if (conditionString) {
                // Prepare variables:

                const stepVars: Record<string, any> = {};
                currentState.activeSteps.forEach(stepId => {
                    const stepName = elementsMap.get(stepId)?.name || (elementsMap.get(stepId) as any)?.number || stepId;
                    // Xn
                    stepVars[`X${stepName}`] = true;
                    // Xn.t (Time in SECONDS)
                    const startTime = currentState.stepActivationTimes[stepId] || now;
                    const elapsedMs = now - startTime;
                    stepVars[`X${stepName}.t`] = elapsedMs / 1000.0;
                });

                const currentVars = {
                    ...currentState.variables,
                    ...inputs.variables,
                    ...stepVars
                };

                isVariableMet = SimulationService.evaluateCondition(conditionString, currentVars, currentState.variables);
            }

            if (isExplicitTrigger || isVariableMet) {
                transitionsToFire.push(trans.id);
            }
        }

        // 2. FIRE transitions
        for (const transId of transitionsToFire) {
            // Deactivate upstream steps
            const upstreamLinks = connections.filter(c => c.targetId === transId);
            upstreamLinks.forEach(c => {
                stepsToDeactivate.add(c.sourceId);
                delete nextActivationTimes[c.sourceId];
            });

            // Activate downstream steps
            const downstreamLinks = connections.filter(c => c.sourceId === transId);

            downstreamLinks.forEach(c => {
                const target = elementsMap.get(c.targetId);
                if (target?.type === 'step') {
                    stepsToActivate.add(target.id);
                    nextActivationTimes[target.id] = now;
                } else if (target?.type === 'and-gate' || target?.type === 'or-gate') {
                    // Gate logic (simplified)
                    const gateOut = connections.filter(gc => gc.sourceId === target.id);
                    gateOut.forEach(gc => {
                        stepsToActivate.add(gc.targetId);
                        nextActivationTimes[gc.targetId] = now;
                    });
                }
            });
        }

        // Apply changes
        stepsToDeactivate.forEach(id => nextActiveSteps.delete(id));
        stepsToActivate.forEach(id => nextActiveSteps.add(id));

        const finalActiveSteps = Array.from(nextActiveSteps);

        // 3. Update ACTIONS
        // Collect actions from all currently active steps
        const activeActions: { variable: string; value: any; type: string }[] = [];
        const nextVariables = { ...currentState.variables, ...inputs.variables };

        // Helper to evaluate an action block
        const evaluateActionBlock = (action: ActionBlock, stepActive: boolean, elapsedSec: number, prevVars: any) => {
            const varName = action.content || 'Unknown';
            const qualifier = action.qualifier || 'N';
            const conditionExpr = action.condition;
            const durationExpr = action.duration;

            let conditionMet = true;
            if (conditionExpr) {
                // Prepare context for evaluation
                const stepVars: Record<string, any> = {};
                finalActiveSteps.forEach(sid => {
                    const sname = (elementsMap.get(sid) as any)?.name || (elementsMap.get(sid) as any)?.number || sid;
                    stepVars[`X${sname}`] = true;
                    const sStartTime = nextActivationTimes[sid] || now;
                    stepVars[`X${sname}.t`] = (now - sStartTime) / 1000.0;
                });

                const evalVars = { ...nextVariables, ...stepVars };
                conditionMet = SimulationService.evaluateCondition(conditionExpr, evalVars, prevVars);
            }

            let isActive = false;
            const durationVal = durationExpr ? SimulationService.parseDuration(durationExpr) : 0;

            switch (qualifier) {
                case 'N': // Non-stored
                    isActive = stepActive && conditionMet;
                    break;
                case 'S': // Set (Stored)
                    if (stepActive && conditionMet) nextVariables[varName] = true;
                    break;
                case 'R': // Reset
                    if (stepActive && conditionMet) nextVariables[varName] = false;
                    break;
                case 'L': // Time Limited
                    isActive = stepActive && conditionMet && (elapsedSec < durationVal);
                    break;
                case 'D': // Time Delayed
                    isActive = stepActive && conditionMet && (elapsedSec >= durationVal);
                    break;
                case 'P': // Pulse
                    isActive = stepActive && conditionMet && (elapsedSec < 0.1);
                    break;
                case 'SD':
                case 'DS':
                    if (stepActive && conditionMet && elapsedSec >= durationVal) nextVariables[varName] = true;
                    break;
                case 'SL':
                    if (stepActive && conditionMet && elapsedSec < durationVal) nextVariables[varName] = true;
                    break;
                default:
                    isActive = stepActive && conditionMet;
            }

            if (isActive) {
                activeActions.push({
                    variable: varName,
                    value: true,
                    type: action.type || 'action'
                });
            }
        };

        // A. Evaluate diagram actions (attached to steps)
        for (const stepId of finalActiveSteps) {
            const step = elementsMap.get(stepId) as Step;
            if (step && (step as any).actions) {
                const startTime = nextActivationTimes[stepId] || now;
                const elapsedSec = (now - startTime) / 1000.0;
                const prevVars = currentState.variables;

                for (const action of (step as any).actions) {
                    evaluateActionBlock(action, true, elapsedSec, prevVars);
                }
            }
        }

        // B. Evaluate global actions (from simulation IO config)
        // Global actions are not attached to steps, so they are always "stepActive = true"
        // Their actual activation depends ONLY on their condition.
        for (const gAction of globalActions) {
            evaluateActionBlock(gAction, true, 0, currentState.variables);
        }

        // Add stored variables that are true to activeActions
        for (const [varName, value] of Object.entries(nextVariables)) {
            if (value === true && !activeActions.some(a => a.variable === varName)) {
                activeActions.push({
                    variable: varName,
                    value: true,
                    type: 'stored'
                });
            }
        }

        return {
            state: {
                activeSteps: finalActiveSteps,
                variables: nextVariables,
                stepActivationTimes: nextActivationTimes
            },
            actions: activeActions
        };
    }

    /**
     * Parses duration string like "5s" or "200ms" to seconds.
     */
    static parseDuration(duration: string): number {
        const match = duration.match(/^(\d+(?:\.\d+)?)(s|ms)$/);
        if (!match) return 0;
        const val = parseFloat(match[1]);
        const unit = match[2];
        return unit === 's' ? val : val / 1000.0;
    }

    /**
     * Loads a diagram from a file and runs a simulation sequence.
     * @param filePath The absolute path to the SFC JSON file.
     * @param scenarios List of scenarios to execute.
     */
    static async runSequenceFromFile(filePath: string, scenarios: any[]): Promise<{ results: any[], loadedFilePath: string }> {
        const { getStorageService } = await import('../services/storageService.js');
        const storage = getStorageService();
        let diagram: GrafcetDiagram;

        try {
            // Try Flydrive first (Supports dynamic storage like Google Drive)
            diagram = await storage.readJson(filePath);
        } catch (error: any) {
            // Fallback: If path is external to storage root (Local Desktop scenario), use native FS
            if (error.message.includes('E_PATH_TRAVERSAL') || error.message.includes('E_INVALID_PATH')) {
                const fs = await import('fs/promises');
                const content = await fs.readFile(filePath, 'utf-8');
                diagram = JSON.parse(content);
            } else {
                throw new Error(`Failed to load diagram file: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Initialize from initial steps
        let state = SimulationService.init(diagram);
        const results: { name: string; activeSteps: string[]; activeActions: string[] }[] = [];

        // Execute all scenarios
        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];

            const inputs = {
                transitions: scenario.transitions || {},
                variables: scenario.variables || {}
            };

            // Get global actions from diagram (if stored there) or other source
            // Actually, diagram structure can have simulation.actions
            const globalActions = (diagram as any).simulation?.actions || [];

            const result = SimulationService.executeStep(diagram, state, inputs, globalActions);
            state = result.state;

            // Extract action names
            const actionNames = result.actions.map(a => a.variable);

            results.push({
                name: scenario.name || `Scenario ${i}`,
                activeSteps: state.activeSteps,
                activeActions: actionNames
            });
        }

        return { results, loadedFilePath: filePath };
    }

    /**
     * Safely evaluates a boolean condition string against provided variables.
     * Supports: AND, OR, NOT, RE, FE, >, <, >=, <=, parentheses, variable names, and literals (5s, 100ms).
     */
    static evaluateCondition(condition: string, variables: Record<string, any>, prevVariables: Record<string, any> = {}): boolean {
        if (!condition) return false;

        // Normalize and Tokenize
        // Ensure spaces around operators
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
                // Use ID if available
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
