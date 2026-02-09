import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { useElementsStore } from '../store/useElementsStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useGsrsmFileStore } from '../store/useGsrsmFileStore';
import { useProjectStore } from '../store/useProjectStore';

export const useKeyboardShortcuts = () => {
  const {
    zoomIn,
    zoomOut,
    resetView,
    setCurrentTool,
    toggleSnapToGrid,
    getSelectedSegment,
    clearSegmentSelection,
    showSuccessToast,
    showWarningToast,
  } = useEditorStore();

  const { deleteSelectedElements, moveSelectedElements, getSelectedElements } = useElementsStore();

  const { undo, redo, canUndo, canRedo, addHistoryEntry } = useHistoryStore();

  // Helper function to move selected elements by delta
  const moveSelectedElementsByDelta = (delta: { x: number; y: number }) => {
    const selectedElements = getSelectedElements();
    if (selectedElements.length === 0) return;

    // Apply snap to grid for precise movement
    const snappedDelta = {
      x: Math.round(delta.x / 10) * 10, // Snap to 10px grid for keyboard movement
      y: Math.round(delta.y / 10) * 10,
    };

    moveSelectedElements(snappedDelta);

    // Add to history for undo/redo
    const currentElements = useElementsStore.getState().elements;
    addHistoryEntry(currentElements);
  };

  // Helper function to move selected segment by delta
  const moveSelectedSegmentByDelta = (delta: { x: number; y: number }) => {
    const selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;

    // Check if there's a global segment movement function available
    const moveFunction = (window as any).moveSelectedSegment;
    if (typeof moveFunction === 'function') {
      // Apply snap to grid for precise movement
      const snappedDelta = {
        x: Math.round(delta.x / 10) * 10, // Snap to 10px grid for keyboard movement
        y: Math.round(delta.y / 10) * 10,
      };

      moveFunction(snappedDelta);

      // Add to history for undo/redo
      const currentElements = useElementsStore.getState().elements;
      addHistoryEntry(currentElements);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl key combinations
      if (e.ctrlKey) {
        switch (e.key) {
          case 'z':
            // Ctrl+Z: Undo
            if (canUndo()) {
              e.preventDefault();
              undo();
            }
            break;

          case 'y':
            // Ctrl+Y: Redo
            if (canRedo()) {
              e.preventDefault();
              redo();
            }
            break;

          case '=':
          case '+':
            // Ctrl++: Zoom in
            e.preventDefault();
            zoomIn();
            break;

          case '-':
            // Ctrl+-: Zoom out
            e.preventDefault();
            zoomOut();
            break;

          case '0':
            // Ctrl+0: Reset view
            e.preventDefault();
            resetView();
            break;

          case 'g':
            // Ctrl+G: Toggle grid
            e.preventDefault();
            toggleSnapToGrid();
            break;

          case 's':
            // Ctrl+S: Save current file or project
            e.preventDefault();
            (async () => {
              const gsrsmFileStore = useGsrsmFileStore.getState();
              const projectStore = useProjectStore.getState();

              // Check if we have an open single file (SFC mode)
              if (gsrsmFileStore.currentFilePath) {
                const success = await gsrsmFileStore.saveCurrentFile();
                if (success) {
                  showSuccessToast('File saved');
                } else {
                  showWarningToast('Failed to save file');
                }
              }
              // Check if we have an open project
              else if (projectStore.currentProjectId) {
                // Also sync elements to the current diagram before saving
                const elements = useElementsStore.getState().elements;
                const currentDiagramId = projectStore.currentDiagramId;
                if (currentDiagramId) {
                  projectStore.updateDiagram(currentDiagramId, { elements });
                }
                const success = await projectStore.saveProject(projectStore.currentProjectId);
                if (success) {
                  showSuccessToast('Project saved');
                } else {
                  showWarningToast('Failed to save project');
                }
              } else {
                showWarningToast('Nothing to save');
              }
            })();
            break;

          default:
            break;
        }
      } else {
        // Single key shortcuts
        switch (e.key) {
          case 'Delete':
            // Delete: Delete selected elements
            e.preventDefault();
            deleteSelectedElements();
            break;

          case 'v':
            // V: Select tool
            e.preventDefault();
            setCurrentTool('select');
            break;

          case 'h':
            // H: Hand (pan) tool
            e.preventDefault();
            setCurrentTool('hand');
            break;

          case 's':
            // S: Step tool
            e.preventDefault();
            setCurrentTool('step');
            break;

          case 't':
            // T: Transition tool
            e.preventDefault();
            setCurrentTool('transition');
            break;

          case 'c':
            // C: Connection tool
            e.preventDefault();
            setCurrentTool('connection');
            break;

          case 'a':
            // A: AND gate tool
            e.preventDefault();
            setCurrentTool('and-gate');
            break;

          case 'o':
            // O: OR gate tool
            e.preventDefault();
            setCurrentTool('or-gate');
            break;

          case 'b':
            // B: Action block tool
            e.preventDefault();
            setCurrentTool('action-block');
            break;

          case 'Escape':
            // Escape: Clear segment selection first, then cancel current operation and switch to select tool
            e.preventDefault();
            if (getSelectedSegment()) {
              clearSegmentSelection();
            } else {
              setCurrentTool('select');
            }
            break;

          case 'ArrowUp':
            // Arrow Up: Move selected segment or elements up (fine movement with Shift)
            e.preventDefault();
            if (getSelectedSegment()) {
              moveSelectedSegmentByDelta({ x: 0, y: e.shiftKey ? -1 : -10 });
            } else {
              moveSelectedElementsByDelta({ x: 0, y: e.shiftKey ? -1 : -10 });
            }
            break;

          case 'ArrowDown':
            // Arrow Down: Move selected segment or elements down (fine movement with Shift)
            e.preventDefault();
            if (getSelectedSegment()) {
              moveSelectedSegmentByDelta({ x: 0, y: e.shiftKey ? 1 : 10 });
            } else {
              moveSelectedElementsByDelta({ x: 0, y: e.shiftKey ? 1 : 10 });
            }
            break;

          case 'ArrowLeft':
            // Arrow Left: Move selected segment or elements left (fine movement with Shift)
            e.preventDefault();
            if (getSelectedSegment()) {
              moveSelectedSegmentByDelta({ x: e.shiftKey ? -1 : -10, y: 0 });
            } else {
              moveSelectedElementsByDelta({ x: e.shiftKey ? -1 : -10, y: 0 });
            }
            break;

          case 'ArrowRight':
            // Arrow Right: Move selected segment or elements right (fine movement with Shift)
            e.preventDefault();
            if (getSelectedSegment()) {
              moveSelectedSegmentByDelta({ x: e.shiftKey ? 1 : 10, y: 0 });
            } else {
              moveSelectedElementsByDelta({ x: e.shiftKey ? 1 : 10, y: 0 });
            }
            break;

          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    zoomIn,
    zoomOut,
    resetView,
    setCurrentTool,
    toggleSnapToGrid,
    deleteSelectedElements,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);
};
