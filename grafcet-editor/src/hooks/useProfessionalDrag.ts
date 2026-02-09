import { useCallback, useEffect, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEditorStore } from '../store/useEditorStore';
import { useElementsStore } from '../store/useElementsStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { Point, GrafcetElement } from '../models/types';
import { calculateSmartPosition, findCollisions } from '../utils/collisionDetection';

interface UseProfessionalDragOptions {
  elementId: string;
  onDragStart?: (elementId: string) => void;
  onDragEnd?: (elementId: string, newPosition: Point) => void;
  constrainToParent?: boolean;
  maintainConnections?: boolean;
  enableCollisionDetection?: boolean;
  showCollisionWarning?: boolean;
}

export const useProfessionalDrag = (options: UseProfessionalDragOptions) => {
  const {
    elementId,
    onDragStart,
    onDragEnd,
    constrainToParent = false,
    maintainConnections = true,
    enableCollisionDetection = true,
    showCollisionWarning = true,
  } = options;

  const {
    currentTool,
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    snapToGridPoint,
  } = useEditorStore();

  const {
    selectElement,
    moveElement,
    moveSelectedElements,
    getElementById,
    getSelectedElements,
    selectedElementIds,
    elements,
  } = useElementsStore();

  const { addHistoryEntry } = useHistoryStore();

  const dragStartPositionRef = useRef<Point | null>(null);
  const initialElementPositionsRef = useRef<Map<string, Point>>(new Map());

  // Handle drag start
  const handleDragStart = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (currentTool !== 'select') return;

    const element = getElementById(elementId);
    if (!element) return;

    // Select the element if not already selected
    if (!selectedElementIds.includes(elementId)) {
      selectElement(elementId, e.evt.shiftKey);
    }

    // Get all selected elements for multi-drag
    const selectedElements = getSelectedElements();
    const draggedIds = selectedElements.map(el => el.id);

    // Store initial positions for all dragged elements
    const initialPositions = new Map<string, Point>();
    selectedElements.forEach(el => {
      initialPositions.set(el.id, { ...el.position });
    });
    initialElementPositionsRef.current = initialPositions;

    // Calculate drag offset from element position to mouse position
    const elementPosition = element.position;
    const mousePosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    
    const offset = {
      x: mousePosition.x - elementPosition.x,
      y: mousePosition.y - elementPosition.y,
    };

    dragStartPositionRef.current = elementPosition;

    // Start the professional drag system
    startDrag(draggedIds, elementPosition, offset);

    // Call custom drag start handler
    onDragStart?.(elementId);

    // Only prevent default behavior for multi-element drags
    // For single element drags, let Konva handle it naturally
    if (draggedIds.length > 1) {
      e.evt.preventDefault();
    }
  }, [
    currentTool,
    elementId,
    selectedElementIds,
    selectElement,
    getElementById,
    getSelectedElements,
    startDrag,
    onDragStart,
  ]);

  // Handle drag move
  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (currentTool !== 'select' || !dragState.isDragging) return;

    const currentPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    // Check for constraint modifiers
    const constrainToAxis = e.evt.shiftKey
      ? (Math.abs(currentPosition.x - (dragStartPositionRef.current?.x || 0)) >
         Math.abs(currentPosition.y - (dragStartPositionRef.current?.y || 0))
         ? 'horizontal' : 'vertical')
      : 'none';

    // Update drag state
    updateDrag(currentPosition, constrainToAxis);

    // Apply snap to grid if enabled
    const snappedPosition = snapToGridPoint(currentPosition);

    // Calculate delta from start position
    const startPos = dragStartPositionRef.current;
    if (!startPos) return;

    const delta = {
      x: snappedPosition.x - startPos.x,
      y: snappedPosition.y - startPos.y,
    };

    // Apply constraint to delta
    let constrainedDelta = delta;
    if (constrainToAxis === 'horizontal') {
      constrainedDelta = { x: delta.x, y: 0 };
    } else if (constrainToAxis === 'vertical') {
      constrainedDelta = { x: 0, y: delta.y };
    }

    // For single element drag (the current target), update its position directly
    // This allows Konva's built-in drag to work while we handle multi-element scenarios
    if (dragState.draggedElementIds.length === 1 && dragState.draggedElementIds[0] === elementId) {
      // Let Konva handle the single element drag naturally
      // We'll update the store position in dragEnd
      return;
    }

    // For multi-element drag, we need to update all other elements
    // but let the primary element (e.target) be handled by Konva
    dragState.draggedElementIds.forEach(id => {
      if (id === elementId) return; // Skip the primary element being dragged

      const initialPos = initialElementPositionsRef.current.get(id);
      if (initialPos) {
        const newPosition = {
          x: initialPos.x + constrainedDelta.x,
          y: initialPos.y + constrainedDelta.y,
        };

        // Update the element position in the store for real-time updates
        moveElement(id, newPosition);
      }
    });
  }, [
    currentTool,
    dragState.isDragging,
    dragState.draggedElementIds,
    updateDrag,
    snapToGridPoint,
    elementId,
    moveElement,
  ]);

  // Handle drag end
  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (currentTool !== 'select' || !dragState.isDragging) return;

    const finalPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const snappedPosition = snapToGridPoint(finalPosition);

    // Calculate final delta
    const startPos = dragStartPositionRef.current;
    if (!startPos) return;

    const delta = {
      x: snappedPosition.x - startPos.x,
      y: snappedPosition.y - startPos.y,
    };

    // Apply constraint to delta
    let constrainedDelta = delta;
    if (dragState.constrainToAxis === 'horizontal') {
      constrainedDelta = { x: delta.x, y: 0 };
    } else if (dragState.constrainToAxis === 'vertical') {
      constrainedDelta = { x: 0, y: delta.y };
    }

    // Update all dragged elements in the store with collision detection
    dragState.draggedElementIds.forEach(id => {
      const initialPos = initialElementPositionsRef.current.get(id);
      const element = getElementById(id);
      if (initialPos && element) {
        let newPosition;

        // For the primary dragged element, use its actual final position from Konva
        if (id === elementId) {
          newPosition = snappedPosition;
        } else {
          // For other elements, calculate based on delta
          newPosition = {
            x: initialPos.x + constrainedDelta.x,
            y: initialPos.y + constrainedDelta.y,
          };
        }

        // Apply collision detection if enabled
        if (enableCollisionDetection) {
          const otherElements = elements.filter(el =>
            !dragState.draggedElementIds.includes(el.id)
          );

          newPosition = calculateSmartPosition(element, newPosition, otherElements, {
            avoidCollisions: true,
            snapToGrid: true,
            gridSize: useEditorStore.getState().gridSize,
            preferredDirection: constrainedDelta.x !== 0 ? 'horizontal' : 'vertical',
          });

          // Show collision warning if position was adjusted
          if (showCollisionWarning &&
              (newPosition.x !== (id === elementId ? snappedPosition.x : initialPos.x + constrainedDelta.x) ||
               newPosition.y !== (id === elementId ? snappedPosition.y : initialPos.y + constrainedDelta.y))) {
            useEditorStore.getState().showToast(
              'Position adjusted to avoid collision',
              'warning'
            );
          }
        }

        moveElement(id, newPosition);
      }
    });

    // Add to history for undo/redo
    const currentElements = useElementsStore.getState().elements;
    addHistoryEntry(currentElements);

    // Handle connection updates if needed with STRICT CONSTRAINT ENFORCEMENT
    if (maintainConnections) {
      // Trigger connection routing updates with constraint enforcement
      setTimeout(() => {
        useElementsStore.getState().routeAllConnections();
        // Enforce strict constraints to ensure no violations after movement
        useElementsStore.getState().enforceAllConnectionConstraints();
      }, 10);
    }

    // Call custom drag end handler
    onDragEnd?.(elementId, snappedPosition);

    // End the drag operation
    endDrag();

    // Clear refs
    dragStartPositionRef.current = null;
    initialElementPositionsRef.current.clear();
  }, [
    currentTool,
    dragState.isDragging,
    dragState.draggedElementIds,
    dragState.constrainToAxis,
    snapToGridPoint,
    moveElement,
    addHistoryEntry,
    maintainConnections,
    onDragEnd,
    elementId,
    endDrag,
  ]);

  // Handle escape key to cancel drag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragState.isDragging) {
        cancelDrag();
        dragStartPositionRef.current = null;
        initialElementPositionsRef.current.clear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragState.isDragging, cancelDrag]);

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging: dragState.isDragging,
    draggedElementIds: dragState.draggedElementIds,
    showDragPreview: dragState.showDragPreview,
  };
};
