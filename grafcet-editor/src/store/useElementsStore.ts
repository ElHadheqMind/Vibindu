import { create } from 'zustand';
import {
  GrafcetElement,
  Step,
  Transition,
  Connection,
  Gate,
  ActionBlock,
  Point,
  StepType,
  ActionType,
} from '../models/types';
import {
  createStep,
  createTransition,
  createConnection,
  createGate,
  createActionBlock,
} from '../models/GrafcetElements';
import { validateConnectionConstraints, enforceConnectionConstraints } from '../utils/connectionUtils';
import { useHistoryStore } from './useHistoryStore';
import { useSaveStatusStore } from './useSaveStatusStore';
import { useEditorStore } from './useEditorStore';
import { useProjectStore } from './useProjectStore';
import { useGsrsmStore } from './useGsrsmStore';
import { useGsrsmFileStore } from './useGsrsmFileStore';

interface ElementsState {
  elements: GrafcetElement[];
  selectedElementIds: string[];

  // Element actions
  addElement: (element: GrafcetElement) => void;
  updateElement: <T extends GrafcetElement>(id: string, updates: Partial<T>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  loadElements: (elements: GrafcetElement[]) => void;
  clearElements: (silent?: boolean) => void;

  // Selection actions
  selectElement: (id: string, multiSelect?: boolean) => void;
  deselectElement: (id: string) => void;
  selectElements: (ids: string[]) => void;
  deselectAll: () => void;

  // Factory methods
  addStep: (position: Point, stepType?: StepType) => Step;
  addTransition: (position: Point) => Transition;
  addConnection: (sourceId: string, targetId: string) => Connection;
  addGate: (position: Point, type: 'and-gate' | 'or-gate', gateMode?: 'divergence' | 'convergence', branchCount?: number) => Gate;
  addActionBlock: (parentId: string, position: Point, actionType?: ActionType, index?: number) => ActionBlock;
  addActionAfter: (actionId: string, actionType?: ActionType) => ActionBlock;
  removeAction: (actionId: string) => void;
  getStepActions: (stepId: string) => ActionBlock[];
  reindexStepActions: (stepId: string) => void;

  // Connection routing
  updateConnectionRouting: (connectionId: string) => void;
  routeAllConnections: () => void;
  validateAllConnections: () => { validConnections: number; violations: Array<{ connectionId: string; violations: string[] }> };
  enforceAllConnectionConstraints: () => void;

  // Movement
  moveElement: (id: string, newPosition: Point) => void;
  moveSelectedElements: (delta: Point) => void;

  // Alignment
  alignElements: (type: 'top' | 'bottom' | 'left' | 'right' | 'center-horizontal' | 'center-vertical') => void;
  distributeElements: (type: 'horizontal' | 'vertical') => void;

  // Getters
  getElementById: <T extends GrafcetElement>(id: string) => T | undefined;
  getSelectedElements: () => GrafcetElement[];
  getConnectedElements: (elementId: string) => GrafcetElement[];
  getNextStepNumber: () => number;
  getNextTransitionNumber: () => number;
  isStepNumberUnique: (number: number, excludeId?: string) => boolean;
  isTransitionNumberUnique: (number: number, excludeId?: string) => boolean;
  isTransitionConditionUnique: (condition: string, excludeId?: string) => boolean;
  addUpConnection: (stepAId: string, stepBId: string) => void;
}

// Helper to mark diagram as dirty (unsaved changes) and trigger auto-save
const markDirty = (elements: GrafcetElement[]) => {
  useSaveStatusStore.getState().markDirty();

  const gsrsmProject = useGsrsmStore.getState().project;
  const gsrsmFileStore = useGsrsmFileStore.getState();
  const projectStore = useProjectStore.getState();

  // 1. If we are in a GSRSM project AND editing an SFC file (pro way)
  if (gsrsmProject && gsrsmFileStore.currentFilePath) {
    gsrsmFileStore.requestAutoSave();
    return;
  }

  // 2. If we are in a standalone GRAFCET project
  if (projectStore.currentProjectId) {
    projectStore.requestAutoSave(elements);
    return;
  }

  // 3. Fallback for files opened without a fixed project context
  if (gsrsmFileStore.currentFilePath) {
    gsrsmFileStore.requestAutoSave();
  }
};

export const useElementsStore = create<ElementsState>((set, get) => ({
  elements: [],
  selectedElementIds: [],

  // Element actions
  addElement: (element: GrafcetElement) => {
    set((state) => ({
      elements: [...state.elements, element],
    }));

    // Mark as dirty - user needs to save
    markDirty(get().elements);

    // Add to history for undo/redo
    useHistoryStore.getState().addHistoryEntry(get().elements);
  },

  updateElement: <T extends GrafcetElement>(id: string, updates: Partial<T>) => {
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, ...updates } : element
      ),
    }));

    // Update connections if position changed
    if ('position' in updates) {
      const element = get().getElementById(id);
      if (element && (element.type === 'step' || element.type === 'transition' || element.type === 'and-gate' || element.type === 'or-gate')) {
        // Update all connections connected to this element
        const connectedConnections = get().elements.filter(
          (e) => e.type === 'connection' && ((e as Connection).sourceId === id || (e as Connection).targetId === id)
        ) as Connection[];

        connectedConnections.forEach((connection) => {
          get().updateConnectionRouting(connection.id);
        });

        // Update action blocks if step
        if (element.type === 'step') {
          const actionBlocks = get().elements.filter(
            (e) => e.type === 'action-block' && (e as ActionBlock).parentId === id
          ) as ActionBlock[];

          actionBlocks.forEach((actionBlock) => {
            const step = element as Step;
            const newPosition = {
              x: step.position.x + step.size.width + 10 + (actionBlock.index * (actionBlock.size?.width || 80)),
              y: step.position.y,
            };
            get().updateElement(actionBlock.id, { position: newPosition });
          });
        }
      }
    }

    // Mark as dirty - user needs to save
    markDirty(get().elements);

    // Add to history for undo/redo
    useHistoryStore.getState().addHistoryEntry(get().elements);
  },

  deleteElement: (id: string) => {
    // First, find any related elements to delete
    const element = get().getElementById(id);
    if (!element) return;

    const elementsToDelete = [id];

    // If deleting a step, also delete its action blocks
    if (element.type === 'step') {
      const actionBlocks = get().elements.filter(
        (e) => e.type === 'action-block' && (e as ActionBlock).parentId === id
      );
      elementsToDelete.push(...actionBlocks.map((ab) => ab.id));
    }

    // Delete any connections connected to this element
    const connections = get().elements.filter(
      (e) => e.type === 'connection' && ((e as Connection).sourceId === id || (e as Connection).targetId === id)
    );
    elementsToDelete.push(...connections.map((c) => c.id));

    // Remove from selection
    set((state) => ({
      selectedElementIds: state.selectedElementIds.filter((id) => !elementsToDelete.includes(id)),
    }));

    // Delete elements
    set((state) => ({
      elements: state.elements.filter((element) => !elementsToDelete.includes(element.id)),
    }));

    // Mark as dirty - user needs to save
    markDirty(get().elements);

    // Add to history for undo/redo
    useHistoryStore.getState().addHistoryEntry(get().elements);
  },

  deleteSelectedElements: () => {
    const { selectedElementIds } = get();

    // Process in reverse to handle dependencies
    [...selectedElementIds].reverse().forEach((id) => {
      get().deleteElement(id);
    });
  },

  loadElements: (elements: GrafcetElement[]) => {
    const safeElements = Array.isArray(elements) ? elements : [];
    console.debug('📥 Loading elements into store:', safeElements.length);
    set({
      elements: [...safeElements],
      selectedElementIds: [], // Clear selection
    });

    // Don't mark as dirty when loading - this is a clean load
    // Add to history as a fresh start point
    useHistoryStore.getState().addHistoryEntry(safeElements);
  },

  clearElements: (silent = false) => {
    set({
      elements: [],
      selectedElementIds: [],
    });

    if (!silent) {
      // Mark as dirty only if not silent
      markDirty(get().elements);
    }

    // Add to history
    useHistoryStore.getState().addHistoryEntry([]);
  },

  // Selection actions
  selectElement: (id: string, multiSelect = false) => {
    set((state) => ({
      selectedElementIds: multiSelect
        ? [...state.selectedElementIds, id]
        : [id],
      elements: state.elements.map((element) => ({
        ...element,
        selected: multiSelect
          ? element.id === id || state.selectedElementIds.includes(element.id)
          : element.id === id,
      })),
    }));
  },

  deselectElement: (id: string) => {
    set((state) => ({
      selectedElementIds: state.selectedElementIds.filter((elementId) => elementId !== id),
      elements: state.elements.map((element) => ({
        ...element,
        selected: element.id === id ? false : element.selected,
      })),
    }));
  },

  selectElements: (ids: string[]) => {
    set((state) => ({
      selectedElementIds: ids,
      elements: state.elements.map((element) => ({
        ...element,
        selected: ids.includes(element.id),
      })),
    }));
  },

  deselectAll: () => {
    set((state) => ({
      selectedElementIds: [],
      elements: state.elements.map((element) => ({
        ...element,
        selected: false,
      })),
    }));
  },

  // Factory methods
  addStep: (position: Point, stepType?: StepType) => {
    // Find a unique step number
    const nextNumber = get().getNextStepNumber();

    // If this is the first step in the diagram, make it an initial step
    // Otherwise, use the provided stepType or default to normal
    const steps = get().elements.filter((e) => e.type === 'step') as Step[];
    const actualStepType = steps.length === 0 ? 'initial' : (stepType || 'normal');

    const newStep = createStep(position, actualStepType, nextNumber);

    get().addElement(newStep);

    // Automatically add an action block for normal steps in any mode
    if (actualStepType === 'normal') {
      const actionPosition = {
        x: position.x + newStep.size.width + 10,
        y: position.y
      };
      get().addActionBlock(newStep.id, actionPosition);
    }

    return newStep;
  },

  addTransition: (position: Point) => {
    // Find a unique transition number
    const nextNumber = get().getNextTransitionNumber();

    const newTransition = createTransition(position, nextNumber);
    get().addElement(newTransition);
    return newTransition;
  },

  addConnection: (sourceId: string, targetId: string) => {
    const sourceElement = get().getElementById(sourceId);
    const targetElement = get().getElementById(targetId);

    if (!sourceElement || !targetElement) {
      throw new Error('Source or target element not found');
    }

    // Create a connection with empty segments initially
    // The routing will be handled by updateConnectionRouting
    const newConnection = createConnection(sourceId, targetId, []);
    get().addElement(newConnection);

    // Update routing using our GRAFCET-compliant algorithm
    get().updateConnectionRouting(newConnection.id);

    return newConnection;
  },

  addGate: (position: Point, type: 'and-gate' | 'or-gate', gateMode: 'divergence' | 'convergence' = 'divergence', branchCount = 2) => {
    const newGate = createGate(position, type, gateMode, branchCount);
    get().addElement(newGate);
    return newGate;
  },

  addActionBlock: (parentId: string, position: Point, actionType: ActionType = 'normal', index?: number) => {
    const parentStep = get().getElementById<Step>(parentId);
    if (!parentStep || parentStep.type !== 'step') {
      throw new Error('Parent step not found');
    }

    // Get existing actions for this step to determine index and position
    const existingActions = get().getStepActions(parentId);

    // If index is not provided, add to the end
    const actionIndex = index !== undefined ? index : existingActions.length;

    // Create the new action block with temporary position
    // We'll position it correctly after adding it
    const tempPosition = position || { x: 0, y: 0 };
    const newActionBlock = createActionBlock(parentId, tempPosition, actionType, actionIndex);
    get().addElement(newActionBlock);

    // Now reindex and reposition all actions for this step
    get().reindexStepActions(parentId);

    return newActionBlock;
  },

  reindexStepActions: (stepId: string) => {
    const parentStep = get().getElementById<Step>(stepId);
    if (!parentStep) return;

    // Get all actions for this step
    const actions = get().getStepActions(stepId);

    // Sort by x position first (to allow horizontal reordering)
    actions.sort((a, b) => a.position.x - b.position.x);

    // All actions have the same Y (aligned with step)
    const currentY = parentStep.position.y;
    const startX = parentStep.position.x + parentStep.size.width + 10;

    // Reindex and reposition each action horizontally
    actions.forEach((action, idx) => {
      get().updateElement(action.id, {
        index: idx,
        position: {
          x: startX + (idx * (action.size?.width || 80)),
          y: currentY
        }
      });
    });
  },

  addActionAfter: (actionId: string, actionType: ActionType = 'normal') => {
    const action = get().getElementById<ActionBlock>(actionId);
    if (!action || action.type !== 'action-block') {
      throw new Error('Action block not found');
    }

    // Add the new action after the current one's index
    return get().addActionBlock(action.parentId, { x: 0, y: 0 }, actionType, action.index + 1);
  },

  removeAction: (actionId: string) => {
    const action = get().getElementById<ActionBlock>(actionId);
    if (!action || action.type !== 'action-block') {
      throw new Error('Action block not found');
    }

    const parentId = action.parentId;

    // Delete the action
    get().deleteElement(actionId);

    // Reindex and reposition all remaining actions
    get().reindexStepActions(parentId);
  },

  getStepActions: (stepId: string) => {
    const actions = get().elements.filter(
      e => e.type === 'action-block' && (e as ActionBlock).parentId === stepId
    ) as ActionBlock[];

    // Sort by index
    return actions.sort((a, b) => a.index - b.index);
  },

  // Connection routing with STRICT CONSTRAINT ENFORCEMENT
  updateConnectionRouting: (connectionId: string) => {
    const connection = get().getElementById<Connection>(connectionId);
    if (!connection || connection.type !== 'connection') return;

    const sourceElement = get().getElementById(connection.sourceId);
    const targetElement = get().getElementById(connection.targetId);

    if (!sourceElement || !targetElement) return;

    // Get all elements except this connection to check for obstacles
    const obstacles = get().elements.filter(e => e.id !== connectionId);

    // Use the STRICT constraint enforcement to ensure proper connection points
    if ('size' in sourceElement && 'size' in targetElement) {
      const segments = enforceConnectionConstraints(
        connection,
        sourceElement as any,
        targetElement as any,
        obstacles
      );
      get().updateElement<Connection>(connectionId, { segments });
    }

  },

  routeAllConnections: () => {
    const connections = get().elements.filter((e) => e.type === 'connection') as Connection[];
    connections.forEach((connection) => {
      get().updateConnectionRouting(connection.id);
    });
  },

  // Validate all connections against strict GRAFCET constraints
  validateAllConnections: () => {
    const connections = get().elements.filter((e) => e.type === 'connection') as Connection[];
    const violations: Array<{ connectionId: string; violations: string[] }> = [];
    let validConnections = 0;

    connections.forEach((connection) => {
      const sourceElement = get().getElementById(connection.sourceId);
      const targetElement = get().getElementById(connection.targetId);

      if (sourceElement && targetElement && 'size' in sourceElement && 'size' in targetElement) {
        const validation = validateConnectionConstraints(
          sourceElement as any,
          targetElement as any,
          connection
        );

        if (validation.isValid) {
          validConnections++;
        } else {
          violations.push({
            connectionId: connection.id,
            violations: validation.violations
          });
        }
      }
    });

    return { validConnections, violations };
  },

  // Enforce strict constraints on all connections
  enforceAllConnectionConstraints: () => {
    const connections = get().elements.filter((e) => e.type === 'connection') as Connection[];

    connections.forEach((connection) => {
      const sourceElement = get().getElementById(connection.sourceId);
      const targetElement = get().getElementById(connection.targetId);

      if (sourceElement && targetElement && 'size' in sourceElement && 'size' in targetElement) {
        // Validate current connection
        const validation = validateConnectionConstraints(
          sourceElement as any,
          targetElement as any,
          connection
        );

        // If validation fails, enforce constraints by regenerating the connection
        if (!validation.isValid) {
          console.warn(`Connection ${connection.id} violates constraints: `, validation.violations);
          get().updateConnectionRouting(connection.id);
        }
      }
    });
  },

  // Movement
  moveElement: (id: string, newPosition: Point) => {
    get().updateElement(id, { position: newPosition });
  },

  moveSelectedElements: (delta: Point) => {
    const { selectedElementIds } = get();

    selectedElementIds.forEach((id) => {
      const element = get().getElementById(id);
      if (element) {
        const newPosition = {
          x: element.position.x + delta.x,
          y: element.position.y + delta.y,
        };
        get().moveElement(id, newPosition);
      }
    });
  },

  // Alignment
  alignElements: (type: 'top' | 'bottom' | 'left' | 'right' | 'center-horizontal' | 'center-vertical') => {
    const selectedElements = get().getSelectedElements();
    if (selectedElements.length < 2) return;

    // Find the reference element (first selected)
    const referenceElement = selectedElements[0];

    selectedElements.slice(1).forEach((element) => {
      const newPosition = { ...element.position };

      if ('size' in referenceElement && 'size' in element) {
        switch (type) {
          case 'top':
            newPosition.y = referenceElement.position.y;
            break;
          case 'bottom':
            newPosition.y = referenceElement.position.y + referenceElement.size.height - element.size.height;
            break;
          case 'left':
            newPosition.x = referenceElement.position.x;
            break;
          case 'right':
            newPosition.x = referenceElement.position.x + referenceElement.size.width - element.size.width;
            break;
          case 'center-horizontal':
            newPosition.x = referenceElement.position.x + referenceElement.size.width / 2 - element.size.width / 2;
            break;
          case 'center-vertical':
            newPosition.y = referenceElement.position.y + referenceElement.size.height / 2 - element.size.height / 2;
            break;
        }
      }

      get().moveElement(element.id, newPosition);
    });
  },

  distributeElements: (type: 'horizontal' | 'vertical') => {
    const selectedElements = get().getSelectedElements();
    if (selectedElements.length < 3) return;

    // Sort elements by position
    const sortedElements = [...selectedElements].sort((a, b) => {
      return type === 'horizontal'
        ? a.position.x - b.position.x
        : a.position.y - b.position.y;
    });

    // Filter elements that have size property
    const elementsWithSize = sortedElements.filter(element => 'size' in element);
    if (elementsWithSize.length < 2) return;

    const firstWithSize = elementsWithSize[0];
    const lastWithSize = elementsWithSize[elementsWithSize.length - 1];

    let totalSpace;
    if (type === 'horizontal') {
      totalSpace = lastWithSize.position.x + lastWithSize.size.width - firstWithSize.position.x;
    } else {
      totalSpace = lastWithSize.position.y + lastWithSize.size.height - firstWithSize.position.y;
    }

    // Calculate total element size
    const totalElementSize = elementsWithSize.reduce((sum, element) => {
      return sum + (type === 'horizontal' ? element.size.width : element.size.height);
    }, 0);

    // Calculate spacing
    const spacing = (totalSpace - totalElementSize) / (elementsWithSize.length - 1);

    // Distribute elements
    let currentPosition = type === 'horizontal' ? firstWithSize.position.x : firstWithSize.position.y;

    elementsWithSize.forEach((element, index) => {
      if (index === 0) return; // Skip first element

      const prevElement = elementsWithSize[index - 1];
      const prevSize = type === 'horizontal' ? prevElement.size.width : prevElement.size.height;

      currentPosition += prevSize + spacing;

      const newPosition = { ...element.position };
      if (type === 'horizontal') {
        newPosition.x = currentPosition;
      } else {
        newPosition.y = currentPosition;
      }

      get().moveElement(element.id, newPosition);
    });
  },

  // Getters
  getElementById: <T extends GrafcetElement>(id: string): T | undefined => {
    return get().elements.find((element) => element.id === id) as T | undefined;
  },

  getSelectedElements: () => {
    const { elements, selectedElementIds } = get();
    return elements.filter((element) => selectedElementIds.includes(element.id));
  },

  getConnectedElements: (elementId: string) => {
    const { elements } = get();
    const connections = elements.filter(
      (e) => e.type === 'connection' && ((e as Connection).sourceId === elementId || (e as Connection).targetId === elementId)
    ) as Connection[];

    const connectedElementIds = connections.flatMap((connection) => [
      connection.sourceId,
      connection.targetId,
    ]);

    return elements.filter((element) => connectedElementIds.includes(element.id));
  },

  getNextStepNumber: () => {
    const steps = get().elements.filter((e) => e.type === 'step') as Step[];
    const numbers = steps.map(s => s.number);
    let next = 1; // Steps usually start from 1
    while (numbers.includes(next)) {
      next++;
    }
    return next;
  },

  getNextTransitionNumber: () => {
    const transitions = get().elements.filter((e) => e.type === 'transition') as Transition[];
    const numbers = transitions.map(t => t.number);
    let next = 0; // Transitions often start from 0
    while (numbers.includes(next)) {
      next++;
    }
    return next;
  },

  isStepNumberUnique: (number: number, excludeId?: string) => {
    const steps = get().elements.filter((e) => e.type === 'step') as Step[];
    return !steps.some(s => s.number === number && s.id !== excludeId);
  },

  isTransitionNumberUnique: (number: number, excludeId?: string) => {
    const transitions = get().elements.filter((e) => e.type === 'transition') as Transition[];
    return !transitions.some(t => t.number === number && t.id !== excludeId);
  },

  isTransitionConditionUnique: (condition: string, excludeId?: string) => {
    const transitions = get().elements.filter((e) => e.type === 'transition') as Transition[];
    return !transitions.some(t => t.condition === condition && t.id !== excludeId);
  },

  addUpConnection: (stepAId: string, stepBId: string) => {
    const stepA = get().getElementById<Step>(stepAId);
    const stepB = get().getElementById<Step>(stepBId);

    if (!stepA || !stepB) return;

    // Determine upper and lower steps
    const isAAboveB = stepA.position.y < stepB.position.y;
    const upperStep = isAAboveB ? stepA : stepB;
    const lowerStep = isAAboveB ? stepB : stepA;

    // 1. Find transition below lower step
    const outgoingFromLower = get().elements.filter(
      e => e.type === 'connection' && (e as Connection).sourceId === lowerStep.id
    ) as Connection[];

    let transBelowLowerId = '';
    for (const conn of outgoingFromLower) {
      const target = get().getElementById(conn.targetId);
      if (target && target.type === 'transition') {
        transBelowLowerId = target.id;
        break;
      }
    }

    // If no transition exists below lower step, create one
    if (!transBelowLowerId) {
      const newTransPos = {
        x: lowerStep.position.x + (lowerStep.size.width / 2) - 20,
        y: lowerStep.position.y + lowerStep.size.height + 40
      };
      const newTrans = get().addTransition(newTransPos);
      get().addConnection(lowerStep.id, newTrans.id);
      transBelowLowerId = newTrans.id;
    }

    // 2. Find transition below upper step (to join "between" step and next transition)
    const outgoingFromUpper = get().elements.filter(
      e => e.type === 'connection' && (e as Connection).sourceId === upperStep.id
    ) as Connection[];

    let transBelowUpperId = '';
    for (const conn of outgoingFromUpper) {
      const target = get().getElementById(conn.targetId);
      if (target && target.type === 'transition') {
        transBelowUpperId = target.id;
        break;
      }
    }

    // 3. Create the jump transition (return path)
    const detourX = Math.min(lowerStep.position.x, upperStep.position.x) - 100;
    const jumpTransPos = {
      x: detourX - 20, // (detourX - width/2) to center it on the detour path
      y: (upperStep.position.y + lowerStep.position.y) / 2
    };
    const jumpTrans = get().addTransition(jumpTransPos);

    // 4. Connect: transBelowLower -> jumpTrans -> Target (Transition or Step)
    const targetId = transBelowUpperId || upperStep.id;

    get().addConnection(transBelowLowerId, jumpTrans.id);
    get().addConnection(jumpTrans.id, targetId);

    // REMOVED routeAllConnections() to prevent destroying existing manual layouts

    useEditorStore.getState().showSuccessToast('Up Connection created');
  },
}));
