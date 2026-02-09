
import { GrafcetElement, Step, Connection, Gate } from '../models/types';

export type DivergenceType = 'AND' | 'OR' | null;

interface OpenDivergenceResult {
    isOpen: boolean;
    type: DivergenceType;
    divergenceStart: Step | Gate | null;
    branchTips: GrafcetElement[];
}

/**
 * Finds the nearest open divergence relevant to the current element.
 * 
 * @param currentElementId The ID of the currently selected element (likely the tip of a branch)
 * @param elements All elements in the diagram
 * @returns Information about the open divergence, if any
 */
export const findNearestOpenDivergence = (
    currentElementId: string,
    elements: GrafcetElement[]
): OpenDivergenceResult => {
    const currentElement = elements.find(e => e.id === currentElementId);
    if (!currentElement) return { isOpen: false, type: null, divergenceStart: null, branchTips: [] };

    // Helper to get element by ID
    const getById = (id: string) => elements.find(e => e.id === id);

    // Helper to get outgoing connections
    const getOutgoingConnections = (id: string) =>
        elements.filter(e => e.type === 'connection' && (e as Connection).sourceId === id) as Connection[];

    // Helper to get incoming connections
    const getIncomingConnections = (id: string) =>
        elements.filter(e => e.type === 'connection' && (e as Connection).targetId === id) as Connection[];

    // 1. Traverse UPWARDS to find the start of the divergence
    // We look for a split point:
    // - OR Divergence: A Step with multiple outgoing connections (to transitions)
    // - AND Divergence: A Gate (type 'and-gate', mode 'divergence') or similar structure

    let divergenceStart: Step | Gate | null = null;
    let type: DivergenceType = null;

    // BFS queue for upward traversal
    const queue: string[] = [currentElementId];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const el = getById(id);
        if (!el) continue;

        // Check if this element is a divergence start
        if (el.type === 'step') {
            const outgoing = getOutgoingConnections(el.id);
            // If > 1 outgoing connection, it's an OR divergence (Step -> multiple Transitions)
            if (outgoing.length > 1) {
                divergenceStart = el as Step;
                type = 'OR';
                break;
            }
        } else if (el.type === 'and-gate' || el.type === 'or-gate') { // Check for explicit gate element
            const gate = el as Gate;
            if (gate.gateMode === 'divergence') {
                divergenceStart = gate;
                type = gate.type === 'and-gate' ? 'AND' : 'OR';
                break;
            }
        } else if (el.type === 'connection') {
            // Special check for implicit AND divergence (Double line represented as transition-like or just split connections)
            // Usually AND divergence start is explicitly a Gate or Transition -> Gate
            // But in some implementations (simple), it might be Transition -> Multiple Steps (which is technically invalid without double line)
            // Let's stick to valid structures: Step -> Transition -> AND Gate -> Multiple Steps
        }

        // Traverse upwards (incoming connections)
        const incoming = getIncomingConnections(el.id);
        for (const conn of incoming) {
            if (!visited.has(conn.sourceId)) {
                queue.push(conn.sourceId);
            }
        }
    }

    if (!divergenceStart || !type) {
        return { isOpen: false, type: null, divergenceStart: null, branchTips: [] };
    }

    // 2. Identify all branches starting from this divergence
    // AND: Gate -> Connections -> Steps (branch starts)
    // OR: Step -> Connections -> Transitions (branch starts)

    let branchStarts: GrafcetElement[] = [];

    const outgoingFromStart = getOutgoingConnections(divergenceStart.id);

    if (type === 'OR') {
        // Step -> Transitions
        branchStarts = outgoingFromStart
            .map(c => getById(c.targetId))
            .filter(e => e && e.type === 'transition') as GrafcetElement[];
    } else { // AND
        // Gate -> Steps (or Transitions if non-standard, but usually Steps)
        branchStarts = outgoingFromStart
            .map(c => getById(c.targetId))
            .filter(e => e && (e.type === 'step' || e.type === 'transition')) as GrafcetElement[];
    }

    // 3. Traverse DOWNWARDS from each branch start to find the "tip" (last element)
    // And warn if any branch is already "closed" (connected to a convergence)

    const branchTips: GrafcetElement[] = [];
    let allBranchesOpen = true;

    for (const startEl of branchStarts) {
        let currentTip = startEl;
        let branchClosed = false;

        // Simple downward traversal until we hit a leaf or a convergence
        // Avoid infinite loops
        const branchQueue = [startEl.id];
        const branchVisited = new Set<string>();

        while (branchQueue.length > 0) {
            const id = branchQueue.shift()!;
            if (branchVisited.has(id)) continue;
            branchVisited.add(id);

            const el = getById(id)!;
            currentTip = el;

            const outgoing = getOutgoingConnections(el.id);

            if (outgoing.length === 0) {
                // This is a tip
                break;
            } else {
                // Check what it connects to
                // If it connects to a Convergence (Gate or matching structure), this branch is closed
                for (const conn of outgoing) {
                    const target = getById(conn.targetId);

                    if (target) {
                        // Check closure
                        if ((target.type === 'and-gate' || target.type === 'or-gate') && (target as Gate).gateMode === 'convergence') {
                            branchClosed = true;
                        } else if (target.type === 'step' && type === 'OR') {
                            // OR convergence (Transitions -> Step)
                            // If a branch tip connects to a Step that has multiple incoming connections, it's joining
                            const incomingToTarget = getIncomingConnections(target.id);
                            if (incomingToTarget.length > 1) {
                                branchClosed = true;
                            }
                        }

                        if (!branchClosed) {
                            branchQueue.push(target.id);
                        }
                    }
                }
                if (branchClosed) break;
            }
        }

        if (branchClosed) {
            allBranchesOpen = false; // Even if one is closed, we might consider the whole structure partially closed
            // But for "closing the remainder", we might still want to proceed? 
            // Requirement: "if there is a convergence it should be closed and auto step added"
            // Let's assume we only auto-close if strictly OPEN (dangling tips).
        }
        branchTips.push(currentTip);
    }

    // If ANY branch is already closed, we treat is as NOT fully open for auto-closure convenience
    // (Or we could disable the button for specific lines, but simpler is: only allow closing if all pending)
    // Actually, user said: "close the selected activated divergence"
    if (!allBranchesOpen) {
        return { isOpen: false, type, divergenceStart, branchTips };
    }

    return {
        isOpen: true,
        type,
        divergenceStart,
        branchTips: branchTips
    };
};
