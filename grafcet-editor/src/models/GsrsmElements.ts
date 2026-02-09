import { v4 as uuidv4 } from 'uuid';
import {
  GsrsmMode,
  GsrsmDiagram,
  GsrsmProject,
  GsrsmCategory,
  GsrsmModeType,
  Point,
  Size,
} from './types';
import {
  Gsrsm_MODE_SIZE,
} from './constants';
import { STANDARD_CONNECTION_IDS } from './GsrsmConnections';

// Factory functions for creating Gsrsm elements
export const createGsrsmMode = (
  code: string,
  title: string,
  description: string,
  category: GsrsmCategory,
  position: Point,
  type: GsrsmModeType = 'normal',
  size: Size = Gsrsm_MODE_SIZE
): GsrsmMode => ({
  id: uuidv4(),
  code,
  title,
  description,
  category,
  position,
  size,
  type,
  activated: false, // Default to not activated
  selected: false,
});

// Standard Gsrsm modes
export const STANDARD_MODES_DEFINITIONS = [
  // A Modes
  { code: 'A1', category: 'A' },
  { code: 'A2', category: 'A' },
  { code: 'A3', category: 'A' },
  { code: 'A4', category: 'A' },
  { code: 'A5', category: 'A' },
  { code: 'A6', category: 'A' },
  { code: 'A7', category: 'A' },
  // D Modes
  { code: 'D1', category: 'D' },
  { code: 'D2', category: 'D' },
  { code: 'D3', category: 'D' },
  // F Modes
  { code: 'F1', category: 'F' },
  { code: 'F2', category: 'F' },
  { code: 'F3', category: 'F' },
  { code: 'F4', category: 'F' },
  { code: 'F5', category: 'F' },
  { code: 'F6', category: 'F' }
];

export const createGsrsmDiagram = (name: string): GsrsmDiagram => {
  const timestamp = new Date().toISOString();

  const modes = STANDARD_MODES_DEFINITIONS.map(m =>
    createGsrsmMode(
      m.code,
      m.code, // Use code as title initially
      '', // Empty description
      m.category as GsrsmCategory,
      { x: 0, y: 0 } // Default position, layout handled by component
    )
  );

  const connections = STANDARD_CONNECTION_IDS.map(id => ({
    id,
    activated: false,
    condition: ''
  }));

  return {
    id: uuidv4(),
    name,
    modes,
    connections,
    version: '1.0',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const createGsrsmProject = (name: string): GsrsmProject => {
  const timestamp = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    diagram: createGsrsmDiagram('Gsrsm Diagram'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

// Helper function to check if a point is inside a Gsrsm mode
export const isPointInGsrsmMode = (point: Point, mode: GsrsmMode): boolean => {
  const { position, size } = mode;
  return (
    point.x >= position.x &&
    point.x <= position.x + size.width &&
    point.y >= position.y &&
    point.y <= position.y + size.height
  );
};
