import { v4 as uuidv4 } from 'uuid';
import {
  Step,
  Transition,
  Connection,
  Gate,
  ActionBlock,
  Point,
  StepType,
  ConnectionSegment,
  ActionType,
} from './types';
import {
  DEFAULT_STEP_SIZE,
  DEFAULT_TRANSITION_SIZE,
  DEFAULT_ACTION_BLOCK_SIZE,
  DEFAULT_GATE_SIZE
} from './constants';

// Factory functions for creating elements
export const createStep = (position: Point, stepType: StepType = 'normal', number: number = 1): Step => ({
  id: uuidv4(),
  type: 'step',
  stepType,
  number,
  label: `Step ${number}`,
  position,
  size: DEFAULT_STEP_SIZE,
  selected: false,
});

export const createTransition = (position: Point, number: number = 1): Transition => ({
  id: uuidv4(),
  type: 'transition',
  condition: `T${number}`,
  number,
  position,
  size: DEFAULT_TRANSITION_SIZE,
  selected: false,
});

export const createConnection = (sourceId: string, targetId: string, segments: ConnectionSegment[] = []): Connection => ({
  id: uuidv4(),
  type: 'connection',
  sourceId,
  targetId,
  segments,
  position: { x: 0, y: 0 }, // Position is determined by segments
  selected: false,
});

export const createGate = (position: Point, type: 'and-gate' | 'or-gate', gateMode: 'divergence' | 'convergence' = 'divergence', branchCount: number = 2): Gate => ({
  id: uuidv4(),
  type,
  gateMode,
  branchCount,
  position,
  size: DEFAULT_GATE_SIZE,
  selected: false,
});

export const createActionBlock = (
  parentId: string,
  position: Point,
  actionType: ActionType = 'normal',
  index: number = 0,
  label: string = 'Action'
): ActionBlock => ({
  id: uuidv4(),
  type: 'action-block',
  parentId,
  label,
  variable: label, // Default variable to label
  condition: '',
  actionType,
  qualifier: actionType === 'temporal' ? 'D' : 'N', // Default qualifier mapping
  index,
  position,
  size: DEFAULT_ACTION_BLOCK_SIZE,
  selected: false,
});

// Helper function to create a connection segment
export const createConnectionSegment = (points: Point[], orientation: 'horizontal' | 'vertical'): ConnectionSegment => ({
  id: uuidv4(),
  points,
  orientation,
});

// Helper function to calculate connection points for elements
export const getConnectionPoints = (element: Step | Transition | Gate) => {
  const { position, size } = element;

  return {
    top: { x: position.x + size.width / 2, y: position.y },
    right: { x: position.x + size.width, y: position.y + size.height / 2 },
    bottom: { x: position.x + size.width / 2, y: position.y + size.height },
    left: { x: position.x, y: position.y + size.height / 2 },
  };
};

// Helper function to calculate the distance between two points
export const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};

// Helper function to check if a point is inside an element
export const isPointInElement = (point: Point, element: Step | Transition | Gate | ActionBlock): boolean => {
  const { position, size } = element;
  return (
    point.x >= position.x &&
    point.x <= position.x + size.width &&
    point.y >= position.y &&
    point.y <= position.y + size.height
  );
};
