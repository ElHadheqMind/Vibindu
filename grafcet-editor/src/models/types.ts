export type ElementType = 'step' | 'transition' | 'connection' | 'and-gate' | 'or-gate' | 'action-block';

export type StepType = 'initial' | 'normal' | 'task' | 'macro';

// GSRSM (Guide for the Study of Run and Stop Modes) specific types
export type GsrsmCategory = 'A' | 'F' | 'D';
export type GsrsmModeType = 'normal' | 'highlighted' | 'active';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementBase {
  id: string;
  type: ElementType;
  position: Point;
  selected: boolean;
}

export interface Step extends ElementBase {
  type: 'step';
  stepType: StepType;
  number: number;
  label: string;
  linkedFile?: string;
  size: Size;
}

export interface Transition extends ElementBase {
  type: 'transition';
  condition: string;
  number: number;
  size: Size;
}

export interface ConnectionSegment {
  id: string;
  points: Point[];
  orientation: 'horizontal' | 'vertical';
}

export interface Connection extends ElementBase {
  type: 'connection';
  sourceId: string;
  targetId: string;
  segments: ConnectionSegment[];
  divergenceType?: 'AND' | 'OR'; // Added to track if this is part of a divergence/convergence
}

export interface Gate extends ElementBase {
  type: 'and-gate' | 'or-gate';
  gateMode: 'divergence' | 'convergence';
  branchCount: number;
  size: Size;
}

export type ActionType = 'N' | 'S' | 'R' | 'L' | 'D' | 'P' | 'SD' | 'DS' | 'SL' | 'normal' | 'temporal';

export interface ActionBlock extends ElementBase {
  type: 'action-block';
  parentId: string;
  label: string;
  variable: string;
  condition?: string;
  actionType: ActionType; // Keeping name for compatibility, but moving towards qualifiers
  qualifier: ActionType;
  duration?: string;
  index: number; // Position in the chain of actions
  size: Size;
}

export type GrafcetElement = Step | Transition | Connection | Gate | ActionBlock;

export interface GrafcetDiagram {
  id: string;
  name: string;
  elements: GrafcetElement[];
  version: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
    createdBy?: string;
  };
  settings?: {
    gridSize: number;
    zoom: number;
    pan: { x: number; y: number };
  };
  thumbnail?: string;
}

export interface GrafcetProject {
  id: string;
  name: string;
  diagrams: GrafcetDiagram[];
  simulation?: {
    variables: any[];
    actions: any[];
  };
  createdAt: string;
  updatedAt: string;
  localPath?: string; // Path where the project is saved locally
}

// GSRSM specific interfaces
export interface GsrsmMode {
  id: string;
  code: string;
  title: string;
  description: string;
  category: GsrsmCategory;
  position: Point;
  size: Size;
  type: GsrsmModeType; // Keeping for backward compatibility/UI state
  activated: boolean;  // New explicit activation state
  selected: boolean;
}

export interface GsrsmConnectionState {
  id: string;
  condition?: string;
  activated: boolean; // New explicit activation state
}

export interface GsrsmDiagram {
  id: string;
  name: string;
  modes: GsrsmMode[];
  connections: GsrsmConnectionState[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface GsrsmProject {
  id: string;
  name: string;
  diagram: GsrsmDiagram;
  createdAt: string;
  updatedAt: string;
  localPath?: string; // Path where the project is saved locally
}

// GSRSM connection mapping types
export interface GsrsmConnectionDefinition {
  id: string;
  fromMode: string; // Mode code (e.g., 'A1', 'F1')
  toMode: string;   // Mode code (e.g., 'F1', 'A3')
  points: number[]; // Connection path points
  dash?: number[];
  pointerLength?: number;
  pointerWidth?: number;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
  strokeWidth?: number;
}

export interface HistoryEntry {
  elements: GrafcetElement[];
  timestamp: number;
}

export type Tool = 'select' | 'step' | 'transition' | 'and-gate' | 'or-gate' | 'action-block' | 'delete' | 'hand' | 'up-connection';

export type EditorMode = 'guided' | 'manual';

export interface ContextMenuOption {
  label: string;
  action: () => void;
  icon?: string;
}

export interface AlignmentOption {
  type: 'top' | 'bottom' | 'left' | 'right' | 'center-horizontal' | 'center-vertical' | 'distribute-horizontal' | 'distribute-vertical';
}

export interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
}
