import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Point, Tool, ContextMenuOption, EditorMode } from '../models/types';

// Toast type for different notification styles
export type ToastType = 'info' | 'success' | 'warning';

interface DragState {
  isDragging: boolean;
  draggedElementIds: string[];
  dragStartPosition: Point | null;
  dragCurrentPosition: Point | null;
  dragOffset: Point | null;
  showDragPreview: boolean;
  constrainToAxis: 'none' | 'horizontal' | 'vertical';
  snapIndicators: Point[];
}

interface EditorState {
  // Canvas state
  scale: number;
  offset: Point;
  gridSize: number;
  snapToGrid: boolean;
  isPanning: boolean;

  // Tool state
  currentTool: Tool;
  isDrawing: boolean;
  drawStartPoint: Point | null;
  drawEndPoint: Point | null;

  // Professional drag system
  dragState: DragState;

  // Segment selection state
  selectedSegment: {
    connectionId: string;
    segmentId: string;
  } | null;
  _pendingGateMode?: 'divergence' | 'convergence';

  // Editor mode
  editorMode: EditorMode;
  lastPlacedStepId: string | null;
  guidedModeActive: boolean; // Whether guided mode is currently active (showing positions)

  // Internal state for guided mode
  _pendingDivergencePosition?: string | null;
  _highlightedStepId?: string | null;
  upConnectionStepSelection: string[];

  // Context menu
  contextMenuPosition: Point | null;
  contextMenuOptions: ContextMenuOption[];



  // Toast notification
  toastMessage: string | null;
  toastVisible: boolean;
  toastType: ToastType;

  // Modal state
  editingActionId: string | null;
  editingTransitionId: string | null;

  // Actions
  setScale: (scale: number) => void;
  setOffset: (offset: Point) => void;
  panCanvas: (delta: Point) => void;
  setIsPanning: (isPanning: boolean) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;

  setCurrentTool: (tool: Tool) => void;
  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  endDrawing: () => void;
  cancelDrawing: () => void;

  // Editor mode actions
  setEditorMode: (mode: EditorMode) => void;
  setLastPlacedStepId: (id: string | null) => void;
  toggleGuidedMode: () => void;
  setGuidedModeActive: (active: boolean) => void;


  showContextMenu: (position: Point, options: ContextMenuOption[]) => void;
  hideContextMenu: () => void;



  // Toast actions
  showToast: (message: string, type?: ToastType) => void;
  showSuccessToast: (message: string) => void;
  showWarningToast: (message: string) => void;
  showInfoToast: (message: string) => void;
  hideToast: () => void;

  setEditingActionId: (id: string | null) => void;
  setEditingTransitionId: (id: string | null) => void;

  // Professional drag system actions
  startDrag: (elementIds: string[], startPosition: Point, offset: Point) => void;
  updateDrag: (currentPosition: Point, constrainToAxis?: 'none' | 'horizontal' | 'vertical') => void;
  endDrag: () => void;
  cancelDrag: () => void;

  // Segment selection actions
  selectSegment: (connectionId: string, segmentId: string) => void;
  clearSegmentSelection: () => void;
  getSelectedSegment: () => { connectionId: string; segmentId: string } | null;

  // Helper functions
  screenToCanvas: (point: Point) => Point;
  canvasToScreen: (point: Point) => Point;
  snapToGridPoint: (point: Point) => Point;

  // Up connection actions
  setUpConnectionStepSelection: (ids: string[]) => void;
  addUpConnectionStep: (id: string) => void;
  clearUpConnectionStepSelection: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Canvas state
      scale: 1,
      offset: { x: 0, y: 0 },
      gridSize: 20,
      snapToGrid: true,
      isPanning: false,

      // Tool state
      currentTool: 'select',
      isDrawing: false,
      drawStartPoint: null,
      drawEndPoint: null,

      // Professional drag system
      dragState: {
        isDragging: false,
        draggedElementIds: [],
        dragStartPosition: null,
        dragCurrentPosition: null,
        dragOffset: null,
        showDragPreview: false,
        constrainToAxis: 'none',
        snapIndicators: [],
      },

      // Segment selection state
      selectedSegment: null,

      // Editor mode
      editorMode: 'free',
      lastPlacedStepId: null,
      guidedModeActive: false,


      // Internal state for guided mode
      _pendingDivergencePosition: null,
      _pendingGateMode: 'divergence',
      upConnectionStepSelection: [],

      // Context menu (not persisted)
      contextMenuPosition: null,
      contextMenuOptions: [],



      // Toast notification (not persisted)
      toastMessage: null,
      toastVisible: false,
      toastType: 'info',

      editingActionId: null,
      editingTransitionId: null,

      // Actions
      setScale: (scale: number) => set({ scale: Math.max(0.1, Math.min(5, scale)) }),

      setOffset: (offset: Point) => set({ offset }),

      panCanvas: (delta: Point) => set((state) => ({
        offset: {
          x: state.offset.x + delta.x,
          y: state.offset.y + delta.y,
        },
      })),

      setIsPanning: (isPanning: boolean) => set({ isPanning }),

      resetView: () => set({ scale: 1, offset: { x: 0, y: 0 } }),

      zoomIn: () => set((state) => ({ scale: Math.min(5, state.scale * 1.2) })),

      zoomOut: () => set((state) => ({ scale: Math.max(0.1, state.scale / 1.2) })),

      setGridSize: (size: number) => set({ gridSize: size }),

      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

      setCurrentTool: (tool: Tool) => set((state) => ({
        // If the same tool is clicked again, switch back to select
        currentTool: state.currentTool === tool ? 'select' : tool
      })),

      startDrawing: (point: Point) => set({
        isDrawing: true,
        drawStartPoint: point,
        drawEndPoint: point,
      }),

      updateDrawing: (point: Point) => set((state) => ({
        drawEndPoint: state.isDrawing ? point : state.drawEndPoint,
      })),

      endDrawing: () => set({ isDrawing: false }),

      cancelDrawing: () => set({
        isDrawing: false,
        drawStartPoint: null,
        drawEndPoint: null,
      }),

      showContextMenu: (position: Point, options: ContextMenuOption[]) => set({
        contextMenuPosition: position,
        contextMenuOptions: options,
      }),

      hideContextMenu: () => set({
        contextMenuPosition: null,
        contextMenuOptions: [],
      }),



      // Toast actions
      showToast: (message: string, type: ToastType = 'info') => {
        set({
          toastMessage: message,
          toastVisible: true,
          toastType: type
        });

        // Auto-hide is now handled in the Toast component
      },

      showSuccessToast: (message: string) => {
        set({
          toastMessage: message,
          toastVisible: true,
          toastType: 'success'
        });
      },

      showWarningToast: (message: string) => {
        set({
          toastMessage: message,
          toastVisible: true,
          toastType: 'warning'
        });
      },

      showInfoToast: (message: string) => {
        set({
          toastMessage: message,
          toastVisible: true,
          toastType: 'info'
        });
      },

      hideToast: () => set({ toastVisible: false }),

      setEditingActionId: (id: string | null) => set({ editingActionId: id }),
      setEditingTransitionId: (id: string | null) => set({ editingTransitionId: id }),

      // Editor mode actions
      setEditorMode: (mode: EditorMode) => set({
        editorMode: mode,
        lastPlacedStepId: null,
        currentTool: 'select',
      }),


      setLastPlacedStepId: (id: string | null) => set({
        lastPlacedStepId: id,
      }),

      toggleGuidedMode: () => set((state) => ({ guidedModeActive: !state.guidedModeActive })),

      setGuidedModeActive: (active: boolean) => set({ guidedModeActive: active }),


      // Helper functions
      screenToCanvas: (point: Point) => {
        const { scale, offset } = get();
        return {
          x: (point.x - offset.x) / scale,
          y: (point.y - offset.y) / scale,
        };
      },

      canvasToScreen: (point: Point) => {
        const { scale, offset } = get();
        return {
          x: point.x * scale + offset.x,
          y: point.y * scale + offset.y,
        };
      },

      snapToGridPoint: (point: Point) => {
        const { gridSize, snapToGrid } = get();
        if (!snapToGrid) return point;

        return {
          x: Math.round(point.x / gridSize) * gridSize,
          y: Math.round(point.y / gridSize) * gridSize,
        };
      },

      // Professional drag system actions
      startDrag: (elementIds: string[], startPosition: Point, offset: Point) => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            isDragging: true,
            draggedElementIds: elementIds,
            dragStartPosition: startPosition,
            dragCurrentPosition: startPosition,
            dragOffset: offset,
            showDragPreview: true,
            constrainToAxis: 'none',
            snapIndicators: [],
          },
        }));
      },

      updateDrag: (currentPosition: Point, constrainToAxis: 'none' | 'horizontal' | 'vertical' = 'none') => {
        const { dragState } = get();
        if (!dragState.isDragging) return;

        // Apply axis constraints
        let constrainedPosition = currentPosition;
        if (constrainToAxis === 'horizontal' && dragState.dragStartPosition) {
          constrainedPosition = {
            x: currentPosition.x,
            y: dragState.dragStartPosition.y,
          };
        } else if (constrainToAxis === 'vertical' && dragState.dragStartPosition) {
          constrainedPosition = {
            x: dragState.dragStartPosition.x,
            y: currentPosition.y,
          };
        }

        // Calculate snap indicators
        const snapIndicators: Point[] = [];
        const { snapToGrid } = get();
        if (snapToGrid) {
          const snappedPoint = get().snapToGridPoint(constrainedPosition);
          snapIndicators.push(snappedPoint);
        }

        set((state) => ({
          dragState: {
            ...state.dragState,
            dragCurrentPosition: constrainedPosition,
            constrainToAxis,
            snapIndicators,
          },
        }));
      },

      endDrag: () => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            isDragging: false,
            draggedElementIds: [],
            dragStartPosition: null,
            dragCurrentPosition: null,
            dragOffset: null,
            showDragPreview: false,
            constrainToAxis: 'none',
            snapIndicators: [],
          },
        }));
      },

      cancelDrag: () => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            isDragging: false,
            draggedElementIds: [],
            dragStartPosition: null,
            dragCurrentPosition: null,
            dragOffset: null,
            showDragPreview: false,
            constrainToAxis: 'none',
            snapIndicators: [],
          },
        }));
      },

      // Segment selection actions
      selectSegment: (connectionId: string, segmentId: string) => {
        set({ selectedSegment: { connectionId, segmentId } });
      },

      clearSegmentSelection: () => {
        set({ selectedSegment: null });
      },

      getSelectedSegment: () => {
        return get().selectedSegment;
      },

      // Up connection actions
      setUpConnectionStepSelection: (ids: string[]) => set({ upConnectionStepSelection: ids }),
      addUpConnectionStep: (id: string) => set((state) => {
        if (state.upConnectionStepSelection.includes(id)) return state;
        const newSelection = [...state.upConnectionStepSelection, id];
        return { upConnectionStepSelection: newSelection };
      }),
      clearUpConnectionStepSelection: () => set({ upConnectionStepSelection: [] }),
    }),
    {
      name: 'grafcet-editor-state',
      partialize: (state) => ({
        // Persist only essential state, exclude temporary UI state
        scale: state.scale,
        offset: state.offset,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        currentTool: state.currentTool,
        editorMode: state.editorMode,
        lastPlacedStepId: state.lastPlacedStepId,
        guidedModeActive: state.guidedModeActive,
        _pendingDivergencePosition: state._pendingDivergencePosition,
      }),
    }
  )
);
