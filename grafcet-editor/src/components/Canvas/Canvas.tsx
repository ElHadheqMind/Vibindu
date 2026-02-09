import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { useGsrsmFileStore } from '../../store/useGsrsmFileStore';
import { usePopupStore } from '../../store/usePopupStore';
import { Point, GrafcetElement, Step as StepInterface, StepType, Transition as TransitionInterface, Gate as GateInterface, ActionBlock as ActionBlockInterface, Connection as ConnectionInterface } from '../../models/types';
import Grid from './Grid';
import SelectionHandles from './SelectionHandles';
import DragPreview from './DragPreview';
import Step from '../Elements/Step';
import Transition from '../Elements/Transition';
import Connection from '../Elements/Connection';
import Gate from '../Elements/Gate';
import ActionBlock from '../Elements/ActionBlock';
import ContextMenu from '../Menu/ContextMenu';
import GuidedPositions from '../GuidedMode/GuidedPositions';
import ZoomControls from './ZoomControls';

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: calc(100vh - 40px);
  overflow: hidden;
  margin: 0;
  padding: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  color: ${props => props.theme.text};
  font-size: 16px;

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 32px;
    background: ${props => props.theme.surface};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid ${props => props.theme.border};
    border-top-color: ${props => props.theme.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CanvasProps {
  // No props needed for now, but keeping interface for future extensibility
}

const Canvas = React.forwardRef<Konva.Stage, CanvasProps>((_props, ref) => {
  // State for transition drawing
  const [transitionSourceId, setTransitionSourceId] = useState<string | null>(null);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);
  const internalRef = useRef<Konva.Stage>(null);
  const stageRef = ref || internalRef;
  const [, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 40
  });

  // Get state from stores
  const {
    scale,
    offset,
    currentTool,
    isDrawing,
    drawStartPoint,
    drawEndPoint,
    contextMenuPosition,
    contextMenuOptions,
    lastPlacedStepId,
    guidedModeActive,
    isPanning,
    setOffset,
    setIsPanning,
    startDrawing,
    updateDrawing,
    endDrawing,
    screenToCanvas,
    hideContextMenu,
    setLastPlacedStepId,
  } = useEditorStore();

  // Use selector for elements to ensure reactivity
  const elements = useElementsStore((state) => state.elements);
  const {
    addStep,
    addTransition,
    addConnection,
    addGate,
    selectElement,
    selectElements,
    deselectAll,
    loadElements,
    getSelectedElements,
  } = useElementsStore();

  const { getCurrentDiagram, currentDiagramId, updateDiagram } = useProjectStore();
  const { project: gsrsmProject } = useGsrsmStore();
  const {
    currentFilePath,
    currentDiagram: gsrsmCurrentDiagram,
    updateCurrentDiagram: updateGsrsmCurrentDiagram,
    isLoadingDiagram,
  } = useGsrsmFileStore();

  // Determine if we're in GSRSM mode by checking if we have a GSRSM project and we're editing a GRAFCET file
  const isGsrsmMode = gsrsmProject && currentFilePath;

  // Determine if we're in "active file" mode (GSRSM mode or standalone file)
  const isFileMode = !!currentFilePath;
  // Get the appropriate diagram based on mode (memoized for performance)
  const activeDiagram = useMemo(() => {
    return isFileMode ? gsrsmCurrentDiagram : getCurrentDiagram();
  }, [isFileMode, gsrsmCurrentDiagram, getCurrentDiagram]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 40, // Account for top bar
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear highlighted step when tool changes
  useEffect(() => {
    setHighlightedStepId(null);
    setTransitionSourceId(null);
  }, [currentTool]);

  // Handle diagram switching - save current diagram and load new one
  const diagramIdentifier = isGsrsmMode ? currentFilePath : currentDiagramId;
  useEffect(() => {
    try {
      if (activeDiagram) {
        // Load elements from the active diagram
        loadElements(activeDiagram.elements || []);
      }
    } catch (error) {
      console.error('Error loading diagram:', error);
      useEditorStore.getState().showWarningToast('Failed to load diagram');
    }
  }, [diagramIdentifier, activeDiagram, loadElements]);

  // Save elements to current diagram when elements change
  useEffect(() => {
    if (activeDiagram && elements.length >= 0) {
      // Debounce the save operation to avoid excessive saves
      const timeoutId = setTimeout(() => {
        try {
          if (isFileMode) {
            // Update GSRSM file store (handles auto-save to the specific file)
            updateGsrsmCurrentDiagram({ elements });
          } else {
            // Update regular project store
            updateDiagram(activeDiagram.id, { elements });
          }
        } catch (error) {
          console.error('Error saving diagram:', error);
          useEditorStore.getState().showWarningToast('Failed to save diagram changes');
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [elements, activeDiagram, isGsrsmMode, updateGsrsmCurrentDiagram, updateDiagram]);

  // Expose highlightedStepId to other components
  useEffect(() => {
    useEditorStore.setState({ _highlightedStepId: highlightedStepId });
  }, [highlightedStepId]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = useElementsStore.getState().selectedElementIds;
        if (selected.length > 0) {
          useElementsStore.getState().deleteSelectedElements();
          useEditorStore.getState().showToast(`Deleted ${selected.length} element(s)`, 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mouse down on canvas (memoized for performance)
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    try {
      // Ignore right clicks (handled by context menu)
      if (e.evt.button === 2) return;

      // Get mouse position in canvas coordinates
      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasPoint = screenToCanvas(pointerPos);

      // Hide context menu if open
      if (contextMenuPosition) {
        hideContextMenu();
        return;
      }

      // Middle mouse button (button 1) for panning in any tool
      if (e.evt.button === 1) {
        setIsPanning(true);
        startDrawing(pointerPos); // Use screen coordinates for panning
        e.evt.preventDefault();
        return;
      }

      // Handle based on current tool
      switch (currentTool) {
        case 'select': {
          // Check if clicked on an element
          const clickedElement = elements.find((element) => {
            // Simple hit detection - can be improved
            if (element.type === 'connection') return false;

            const elementWithSize = element as StepInterface | TransitionInterface | GateInterface | ActionBlockInterface;
            const { position, size } = elementWithSize;
            return (
              canvasPoint.x >= position.x &&
              canvasPoint.x <= position.x + size.width &&
              canvasPoint.y >= position.y &&
              canvasPoint.y <= position.y + size.height
            );
          });

          if (clickedElement) {
            // Enhanced multi-select: Ctrl+click or Shift+click for multi-selection
            selectElement(clickedElement.id, e.evt.ctrlKey || e.evt.shiftKey);
          } else {
            // Only deselect if not holding Ctrl (allows for additive selection)
            if (!e.evt.ctrlKey) {
              deselectAll();
            }
            startDrawing(canvasPoint);
          }
          break;
        }

        case 'step': {
          if (!guidedModeActive) {
            // Free placement mode
            const newStep = addStep(canvasPoint, 'normal');
            selectElement(newStep.id, false);
            break;
          }

          // In guided mode, the first step is always an initial step
          // After that, steps can only be placed using the guided positions

          // If this is the first step, place an initial step
          const steps = elements.filter(e => e.type === 'step');
          if (steps.length === 0) {
            const newStep = addStep(canvasPoint, 'initial');
            setLastPlacedStepId(newStep.id);
            selectElement(newStep.id, false);
          } else {
            // Check if we're clicking on an existing step to show suggestions
            const clickedStep = elements.find((element) => {
              if (element.type !== 'step') return false;

              const step = element as StepInterface;
              const { position, size } = step;
              return (
                canvasPoint.x >= position.x &&
                canvasPoint.x <= position.x + size.width &&
                canvasPoint.y >= position.y &&
                canvasPoint.y <= position.y + size.height
              );
            });

            if (clickedStep) {
              // If clicked on a step, set it as the last placed step to show suggestions
              setLastPlacedStepId(clickedStep.id);
              selectElement(clickedStep.id, false);
            }
          }
          break;
        }

        // Manual transition and gate tools removed as they are part of guided mode now



        case 'hand':
          // Start panning with left click
          setIsPanning(true);
          startDrawing(pointerPos); // Use screen coordinates for panning
          break;

        case 'delete': {
          // Click-to-delete: if clicking on an element, delete it
          const clickedElementToDelete = elements.find((element) => {
            if (element.type === 'connection') return false;

            const elementWithSize = element as StepInterface | TransitionInterface | GateInterface | ActionBlockInterface;
            const { position, size } = elementWithSize;
            return (
              canvasPoint.x >= position.x &&
              canvasPoint.x <= position.x + size.width &&
              canvasPoint.y >= position.y &&
              canvasPoint.y <= position.y + size.height
            );
          });

          if (clickedElementToDelete) {
            useElementsStore.getState().deleteElement(clickedElementToDelete.id);
            useEditorStore.getState().showToast(`Deleted element`, 'info');
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
      useEditorStore.getState().showWarningToast('An error occurred while handling mouse click');
    }
  }, [
    currentTool,
    contextMenuPosition,
    hideContextMenu,
    screenToCanvas,
    elements,
    selectElement,
    deselectAll,
    startDrawing,
    lastPlacedStepId,
    setLastPlacedStepId,
    addStep,
    transitionSourceId,
    setTransitionSourceId,
    setHighlightedStepId,
    addTransition,
    addConnection,
    addGate
  ]);

  // Handle mouse move on canvas (memoized for performance)
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    try {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Handle panning if active (either via hand tool or middle click)
      if (isPanning && drawStartPoint) {
        const dx = pointerPos.x - drawStartPoint.x;
        const dy = pointerPos.y - drawStartPoint.y;

        setOffset({
          x: offset.x + dx,
          y: offset.y + dy
        });

        // Update start point for next move to calculate delta correctly
        startDrawing(pointerPos);
        return;
      }

      if (!isDrawing) return;

      const canvasPoint = screenToCanvas(pointerPos);

      // Handle based on current tool
      switch (currentTool) {
        case 'select':
          // Update selection rectangle
          updateDrawing(canvasPoint);
          break;



        case 'hand':
          // Handled above in isPanning block
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  }, [isDrawing, currentTool, updateDrawing, drawStartPoint, offset, setOffset, startDrawing, screenToCanvas]);

  // Handle mouse up on canvas (memoized for performance)
  const handleMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
    try {
      // Read current state directly from store to avoid stale closure values
      const currentState = useEditorStore.getState();
      const currentIsDrawing = currentState.isDrawing;
      const currentIsPanning = currentState.isPanning;
      const currentDrawStartPoint = currentState.drawStartPoint;
      const currentDrawEndPoint = currentState.drawEndPoint;

      if (currentIsPanning) {
        setIsPanning(false);
        endDrawing();
        return;
      }

      // If not drawing, do nothing - element was clicked and selected in mouseDown
      if (!currentIsDrawing) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Handle based on current tool
      switch (currentTool) {
        case 'select':
          // Finish selection rectangle
          if (currentDrawStartPoint && currentDrawEndPoint) {
            // Select elements inside the rectangle
            const minX = Math.min(currentDrawStartPoint.x, currentDrawEndPoint.x);
            const maxX = Math.max(currentDrawStartPoint.x, currentDrawEndPoint.x);
            const minY = Math.min(currentDrawStartPoint.y, currentDrawEndPoint.y);
            const maxY = Math.max(currentDrawStartPoint.y, currentDrawEndPoint.y);

            // Only process selection rectangle if it has significant size (not just a click)
            const rectWidth = Math.abs(currentDrawEndPoint.x - currentDrawStartPoint.x);
            const rectHeight = Math.abs(currentDrawEndPoint.y - currentDrawStartPoint.y);
            const isActualRectangle = rectWidth > 5 || rectHeight > 5;

            if (isActualRectangle) {
              const selectedElementsInRect = elements.filter((element) => {
                if (element.type === 'connection') return false;

                const elementWithSize = element as StepInterface | TransitionInterface | GateInterface | ActionBlockInterface;
                const { position, size } = elementWithSize;
                // Check if element intersects with selection rectangle (not just fully contained)
                return (
                  position.x < maxX &&
                  position.x + (size?.width || 0) > minX &&
                  position.y < maxY &&
                  position.y + (size?.height || 0) > minY
                );
              });

              if (selectedElementsInRect.length > 0) {
                // Support additive selection with Ctrl key
                const ids = selectedElementsInRect.map((element) => element.id);
                if (e.evt.ctrlKey) {
                  const currentSelected = getSelectedElements();
                  const combinedIds = [...new Set([...currentSelected.map(el => el.id), ...ids])];
                  selectElements(combinedIds);
                } else {
                  // Use selectElements to set all IDs at once instead of multiple selectElement calls
                  selectElements(ids);
                }
              } else if (!e.evt.ctrlKey) {
                // Only deselect if drawing a rectangle that selected nothing
                deselectAll();
              }
            }
            // If it's just a click (not a rectangle), don't deselect - selection was already handled in mouseDown
          }
          break;



        default:
          break;
      }

      endDrawing();
    } catch (error) {
      console.error('Error in handleMouseUp:', error);
      endDrawing(); // Ensure drawing state is reset even on error
    }
  }, [
    currentTool,
    elements,
    getSelectedElements,
    selectElements,
    selectElement,
    deselectAll,
    endDrawing,
    setIsPanning
  ]);

  // Handle context menu
  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    try {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasPoint = screenToCanvas(pointerPos);

      // Check if right-clicked on an element
      const clickedElement = elements.find((element) => {
        if (element.type === 'connection') {
          // For connections, check if clicked near any segment
          // Simplified check - can be improved
          return false;
        } else {
          const elementWithSize = element as StepInterface | TransitionInterface | GateInterface | ActionBlockInterface;
          const { position, size } = elementWithSize;
          return (
            canvasPoint.x >= position.x &&
            canvasPoint.x <= position.x + size.width &&
            canvasPoint.y >= position.y &&
            canvasPoint.y <= position.y + size.height
          );
        }
      });

      if (clickedElement) {
        // Show element-specific context menu
        const options = getContextMenuOptions(clickedElement);
        useEditorStore.getState().showContextMenu(pointerPos, options);
      } else {
        // Show canvas context menu
        const canvasOptions = getCanvasContextMenuOptions(canvasPoint);
        useEditorStore.getState().showContextMenu(pointerPos, canvasOptions);
      }
    } catch (error) {
      console.error('Error in handleContextMenu:', error);
    }
  };

  // Get context menu options for an element
  const getContextMenuOptions = (element: GrafcetElement) => {
    const options = [
      {
        label: 'Delete',
        action: () => useElementsStore.getState().deleteElement(element.id),
        icon: 'trash',
      },
    ];

    // Add element-specific options
    switch (element.type) {
      case 'step': {
        const stepElement = element as StepInterface;
        options.unshift(
          {
            label: 'Edit Label',
            action: () => {
              usePopupStore.getState().showPrompt(
                'Edit Step Label',
                'Enter step label:',
                (newLabel) => {
                  if (newLabel !== null && newLabel.trim()) {
                    useElementsStore.getState().updateElement(element.id, { label: newLabel.trim() });
                  }
                },
                stepElement.label || '',
                'Enter step label'
              );
            },
            icon: 'edit',
          },
          {
            label: 'Change Type',
            action: () => {
              const types: StepType[] = ['normal', 'initial', 'task', 'macro'];
              const currentType = stepElement.stepType;
              const currentIndex = types.indexOf(currentType);
              const nextType = types[(currentIndex + 1) % types.length];
              useElementsStore.getState().updateElement(element.id, { stepType: nextType });
            },
            icon: 'type',
          },
          {
            label: 'Add Action',
            action: () => {
              useElementsStore.getState().addActionBlock(element.id, {
                x: element.position.x + 70,
                y: element.position.y,
              }, 'normal');
            },
            icon: 'plus-square',
          },
          {
            label: 'Add Temporal Action',
            action: () => {
              useElementsStore.getState().addActionBlock(element.id, {
                x: element.position.x + 70,
                y: element.position.y,
              }, 'temporal');
            },
            icon: 'clock',
          }
        );
        break;
      }

      case 'transition': {
        const transitionElement = element as TransitionInterface;
        options.unshift({
          label: 'Edit Condition',
          action: () => {
            usePopupStore.getState().showPrompt(
              'Edit Transition Condition',
              'Enter transition condition:',
              (newCondition) => {
                if (newCondition !== null) {
                  useElementsStore.getState().updateElement(element.id, { condition: newCondition });
                }
              },
              transitionElement.condition || '',
              'e.g. X > 10 || Timer.Done'
            );
          },
          icon: 'edit',
        });
        break;
      }

      case 'action-block': {
        const actionElement = element as ActionBlockInterface;
        options.unshift(
          {
            label: 'Edit Label',
            action: () => {
              usePopupStore.getState().showPrompt(
                'Edit Action Label',
                'Enter action label:',
                (newLabel) => {
                  if (newLabel !== null && newLabel.trim()) {
                    useElementsStore.getState().updateElement(element.id, { label: newLabel.trim() });
                  }
                },
                actionElement.label || '',
                'Enter action text'
              );
            },
            icon: 'edit',
          }
        );

        // Add action type options
        const actionType = actionElement.actionType || 'normal';
        if (actionType === 'normal') {
          options.splice(1, 0, {
            label: 'Convert to Temporal Action',
            action: () => {
              useElementsStore.getState().updateElement(element.id, { actionType: 'temporal' });
            },
            icon: 'clock',
          });
        } else {
          options.splice(1, 0, {
            label: 'Convert to Normal Action',
            action: () => {
              useElementsStore.getState().updateElement(element.id, { actionType: 'normal' });
            },
            icon: 'square',
          });
        }

        // Add options to add actions after this one
        options.splice(2, 0,
          {
            label: 'Add Action After',
            action: () => {
              useElementsStore.getState().addActionAfter(element.id, 'normal');
            },
            icon: 'plus-square',
          },
          {
            label: 'Add Temporal Action After',
            action: () => {
              useElementsStore.getState().addActionAfter(element.id, 'temporal');
            },
            icon: 'plus-circle',
          },
          {
            label: 'Remove Action',
            action: () => {
              useElementsStore.getState().removeAction(element.id);
            },
            icon: 'trash',
          }
        );

        // Add condition options based on whether a condition already exists
        if (actionElement.condition) {
          options.splice(5, 0,
            {
              label: 'Edit Condition',
              action: () => {
                usePopupStore.getState().showPrompt(
                  'Edit Action Condition',
                  'Enter action condition:',
                  (newCondition) => {
                    if (newCondition !== null) {
                      useElementsStore.getState().updateElement(element.id, { condition: newCondition });
                    }
                  },
                  actionElement.condition || '',
                  'Enter condition'
                );
              },
              icon: 'code',
            },
            {
              label: 'Remove Condition',
              action: () => {
                useElementsStore.getState().updateElement(element.id, { condition: '' });
              },
              icon: 'minus',
            }
          );
        } else {
          options.splice(5, 0, {
            label: 'Add Condition',
            action: () => {
              usePopupStore.getState().showPrompt(
                'Add Condition',
                'Enter a condition for this action:',
                (value) => {
                  if (value !== null) {
                    useElementsStore.getState().updateElement(element.id, { condition: value });
                  }
                },
                '',
                'e.g. X > 10 || Timer.Done'
              );
            },
            icon: 'plus',
          });
        }
        break;
      }

      case 'and-gate':
      case 'or-gate': {
        const gateElement = element as GateInterface;
        options.unshift(
          {
            label: 'Toggle Type',
            action: () => {
              const newType = element.type === 'and-gate' ? 'or-gate' : 'and-gate';
              useElementsStore.getState().updateElement(element.id, { type: newType });
            },
            icon: 'switch',
          },
          {
            label: 'Add Branch',
            action: () => {
              const currentBranchCount = gateElement.branchCount;
              useElementsStore.getState().updateElement(element.id, { branchCount: currentBranchCount + 1 });
            },
            icon: 'plus',
          }
        );

        if (gateElement.branchCount > 2) {
          options.splice(2, 0, {
            label: 'Remove Branch',
            action: () => {
              const currentBranchCount = gateElement.branchCount;
              useElementsStore.getState().updateElement(element.id, { branchCount: currentBranchCount - 1 });
            },
            icon: 'minus',
          });
        }
        break;
      }

      case 'connection': {
        options.unshift(
          {
            label: 'Recalculate Route',
            action: () => {
              useElementsStore.getState().updateConnectionRouting(element.id);
            },
            icon: 'refresh',
          },
          {
            label: 'Validate Constraints',
            action: () => {
              const { validateAllConnections } = useElementsStore.getState();
              const result = validateAllConnections();
              const connectionViolation = result.violations.find(v => v.connectionId === element.id);

              if (connectionViolation) {
                useEditorStore.getState().showToast(
                  `Connection has ${connectionViolation.violations.length} constraint violation(s)`,
                  'warning'
                );
              } else {
                useEditorStore.getState().showToast(
                  'Connection follows strict GRAFCET constraints',
                  'success'
                );
              }
            },
            icon: 'check',
          },
          {
            label: 'Enforce Constraints',
            action: () => {
              useElementsStore.getState().enforceAllConnectionConstraints();
              useEditorStore.getState().showToast(
                'Connection constraints enforced',
                'success'
              );
            },
            icon: 'shield',
          }
        );
        break;
      }
    }

    return options;
  };

  // Get context menu options for the canvas
  const getCanvasContextMenuOptions = (point: Point) => {
    // Base options that are always available
    const baseOptions = [
      {
        label: 'Reset View',
        action: () => useEditorStore.getState().resetView(),
        icon: 'maximize',
      },
    ];

    // In guided mode (default), restrict adding elements directly
    const steps = elements.filter(e => e.type === 'step');

    // If no steps exist yet, allow adding an initial step
    if (steps.length === 0) {
      return [
        {
          label: 'Add Initial Step',
          action: () => {
            const newStep = useElementsStore.getState().addStep(point, 'initial');
            setLastPlacedStepId(newStep.id);
          },
          icon: 'square',
        },
        ...baseOptions
      ];
    } else {
      // Show a message about using guided positions
      return [
        {
          label: 'Guided Mode Active',
          action: () => {
            usePopupStore.getState().showInfo(
              'Guided Mode',
              'In guided mode, you can only place steps in the highlighted positions around the last placed step.'
            );
          },
          icon: 'info',
        },
        ...baseOptions
      ];
    }
  };

  // Render selection rectangle (memoized for performance)
  const renderSelectionRect = useMemo(() => {
    if (!isDrawing || currentTool !== 'select' || !drawStartPoint || !drawEndPoint) {
      return null;
    }

    const x = Math.min(drawStartPoint.x, drawEndPoint.x);
    const y = Math.min(drawStartPoint.y, drawEndPoint.y);
    const width = Math.abs(drawEndPoint.x - drawStartPoint.x);
    const height = Math.abs(drawEndPoint.y - drawStartPoint.y);

    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(0, 161, 255, 0.3)"
        stroke="rgb(0, 161, 255)"
        strokeWidth={1 / scale}
      />
    );
  }, [isDrawing, currentTool, drawStartPoint, drawEndPoint, scale]);



  // Handle wheel zoom (memoized for performance)
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    try {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const mousePointTo = {
        x: (pointerPos.x - offset.x) / scale,
        y: (pointerPos.y - offset.y) / scale,
      };

      // Determine zoom direction
      const zoomDirection = e.evt.deltaY < 0 ? 1 : -1;

      // Calculate new scale
      const scaleBy = 1.1;
      const newScale = zoomDirection > 0
        ? Math.min(3, scale * scaleBy)
        : Math.max(0.1, scale / scaleBy);

      // Calculate new offset to zoom toward mouse position
      const newOffset = {
        x: pointerPos.x - mousePointTo.x * newScale,
        y: pointerPos.y - mousePointTo.y * newScale,
      };

      // Update state
      useEditorStore.getState().setScale(newScale);
      useEditorStore.getState().setOffset(newOffset);
    } catch (error) {
      console.error('Error in handleWheel:', error);
    }
  }, [scale, offset]);

  return (
    <CanvasContainer>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 40} // Account for top bar only
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      >
        <Layer>
          <Grid width={window.innerWidth} height={window.innerHeight - 40} />

          {/* Render connections first (below other elements) */}
          {elements
            .filter((element) => element?.type === 'connection' && element?.id)
            .map((connection) => (
              <Connection key={connection.id} connection={connection as ConnectionInterface} />
            ))}

          {/* Render steps, transitions, and gates */}
          {elements
            .filter((element) => element?.type && element?.id && element.type !== 'connection' && element.type !== 'action-block')
            .map((element) => {
              try {
                switch (element.type) {
                  case 'step':
                    return <Step key={element.id} step={element as StepInterface} />;
                  case 'transition':
                    return <Transition key={element.id} transition={element as TransitionInterface} />;
                  case 'and-gate':
                  case 'or-gate':
                    return <Gate key={element.id} gate={element as GateInterface} />;
                  default:
                    return null;
                }
              } catch (error) {
                console.error('Error rendering element:', element, error);
                return null;
              }
            })}

          {/* Render action blocks (on top) */}
          {elements
            .filter((element) => element?.type === 'action-block' && element?.id)
            .map((actionBlock) => (
              <ActionBlock key={actionBlock.id} actionBlock={actionBlock as ActionBlockInterface} />
            ))}

          {/* Render selection rectangle */}
          {renderSelectionRect}

          {/* Professional selection handles */}
          <SelectionHandles elements={getSelectedElements()} />

          {/* Professional drag preview */}
          <DragPreview />

          {/* Render guided positions only when guided mode is active */}
          {guidedModeActive && lastPlacedStepId && (() => {
            const step = elements.find(e => e?.id === lastPlacedStepId && e?.type === 'step') as StepInterface;
            return step ? <GuidedPositions step={step} /> : null;
          })()}


        </Layer>
      </Stage>

      {/* Context menu */}
      {contextMenuPosition && (
        <ContextMenu
          position={contextMenuPosition}
          options={contextMenuOptions}
          onClose={hideContextMenu}
        />
      )}

      {/* Zoom controls */}
      <ZoomControls />

      {/* Loading overlay - shown when diagram is being restored after browser refresh */}
      {isLoadingDiagram && (
        <LoadingOverlay>
          <div className="loading-content">
            <div className="spinner" />
            <span>Loading diagram...</span>
          </div>
        </LoadingOverlay>
      )}
    </CanvasContainer>
  );
});

export default Canvas;
