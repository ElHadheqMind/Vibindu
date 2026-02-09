import { GsrsmConnectionDefinition } from './types';

import {
  Gsrsm_HEADER_HEIGHT,
  Gsrsm_A1_SIZE,
  Gsrsm_A2_SIZE,
  Gsrsm_A3_SIZE,
  Gsrsm_A4_SIZE,
  Gsrsm_A5_SIZE,
  Gsrsm_A6_SIZE,
  Gsrsm_A7_SIZE,
  Gsrsm_D1_SIZE,
  Gsrsm_D2_SIZE,
  Gsrsm_D3_SIZE,
  Gsrsm_F1_SIZE,
  Gsrsm_F2_SIZE,
  Gsrsm_F3_SIZE,
  Gsrsm_F4_SIZE,
  Gsrsm_F5_SIZE,
  Gsrsm_F6_SIZE,
  Gsrsm_VERTICAL_SPACING,
} from './constants';

// List of all standard connection IDs
export const STANDARD_CONNECTION_IDS = [
  'A3-D3', 'D3-A2', 'D2-A5', 'D1-D2', 'D1-A5', 'A5-A7', 'A5-A6', 'A2-A1', 'A3-A4',
  'F1-F3', 'F2-F1', 'F5-F4', 'A6-A1', 'A7-A4', 'F1-F5', 'F5-F1', 'F1-F6', 'F6-F1',
  'F6-D1', 'A1-F2', 'A1-F1', 'A4-F1', 'F3-A1', 'F4-A6', 'A1-F4', 'A1-F5', 'F1-F4',
  'F1-D1', 'F1-A3', 'F1-A2', 'F1-D3'
];

// Define all Gsrsm connections based on the hardcoded connections in GsrsmCanvas
// This function will be called with section positions to calculate actual points
export const createGsrsmConnections = (sectionPositions: any): GsrsmConnectionDefinition[] => {

  const connections: GsrsmConnectionDefinition[] = [];

  // A3 to D3 connection
  const a3X = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A3_SIZE.width - 20 + Gsrsm_A3_SIZE.width / 2;
  const a3Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A3_SIZE.height;
  const d3Y = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20;

  connections.push({
    id: 'A3-D3',
    fromMode: 'A3',
    toMode: 'D3',
    points: [a3X, a3Y, a3X, d3Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
    pointerAtBeginning: true,
    pointerAtEnding: false,
  });

  // D3 to A2 connection
  const d3X = sectionPositions.D.x + sectionPositions.D.width - Gsrsm_A2_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10 + Gsrsm_A2_SIZE.width / 2;
  const d3Y_top = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20;
  const a2Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A2_SIZE.height;

  connections.push({
    id: 'D3-A2',
    fromMode: 'D3',
    toMode: 'A2',
    points: [d3X, d3Y_top, d3X, a2Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // D2 to A5 connection
  const d2X = sectionPositions.A.x + 20 + Gsrsm_A5_SIZE.width - Gsrsm_D2_SIZE.width + Gsrsm_D2_SIZE.width / 2;
  const d2Y_top = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20;
  const a5Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A5_SIZE.height;

  connections.push({
    id: 'D2-A5',
    fromMode: 'D2',
    toMode: 'A5',
    points: [d2X, d2Y_top, d2X, a5Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // D1 to D2 connection
  const d1X = sectionPositions.D.x + 20 + Gsrsm_D1_SIZE.width / 2;
  const d1Y = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40;
  const d2Y_bottom = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20 + Gsrsm_D2_SIZE.height;

  connections.push({
    id: 'D1-D2',
    fromMode: 'D1',
    toMode: 'D2',
    points: [d1X, d1Y, d1X, d2Y_bottom],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // D1 to A5 connection
  const d1X_left = sectionPositions.D.x + 20 + Gsrsm_D1_SIZE.width / 6;
  const d1Y_top = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40;

  connections.push({
    id: 'D1-A5',
    fromMode: 'D1',
    toMode: 'A5',
    points: [d1X_left, d1Y_top, d1X_left, a5Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A5 to A7 connection
  const a5X = sectionPositions.A.x + 20 + Gsrsm_A5_SIZE.width / 2;
  const a5Y_top = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15;
  const a7Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A7_SIZE.height;

  connections.push({
    id: 'A5-A7',
    fromMode: 'A5',
    toMode: 'A7',
    points: [a5X, a5Y_top, a5X, a7Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A5 to A6 connection
  const a5X_left = sectionPositions.A.x + 20 + Gsrsm_A5_SIZE.width / 8;
  const a6Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height;

  connections.push({
    id: 'A5-A6',
    fromMode: 'A5',
    toMode: 'A6',
    points: [a5X_left, a5Y_top, a5X_left, a6Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A2 to A1 connection
  const a2X = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A2_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10 + Gsrsm_A2_SIZE.width / 4;
  const a2Y_top = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15;
  const a1Y_bottom = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height;

  connections.push({
    id: 'A2-A1',
    fromMode: 'A2',
    toMode: 'A1',
    points: [a2X, a2Y_top, a2X, a1Y_bottom],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A3 to A4 connection
  const a3X_center = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A3_SIZE.width - 20 + Gsrsm_A3_SIZE.width / 2;
  const a3Y_top = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15;
  const a4Y_bottom = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A4_SIZE.height;

  connections.push({
    id: 'A3-A4',
    fromMode: 'A3',
    toMode: 'A4',
    points: [a3X_center, a3Y_top, a3X_center, a4Y_bottom],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to F3 connection
  const f1X = sectionPositions.F.x + sectionPositions.F.width / 2;
  const f1Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40;
  const f3X = sectionPositions.F.x + sectionPositions.F.width / 2;
  const f3Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90 + Gsrsm_F3_SIZE.height;

  connections.push({
    id: 'F1-F3',
    fromMode: 'F1',
    toMode: 'F3',
    points: [f1X, f1Y, f3X, f3Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F2 to F1 connection
  const f2X = sectionPositions.F.x + sectionPositions.F.width / 4;
  const f2Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90 + Gsrsm_F2_SIZE.height;
  const f1Y_top = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40;

  connections.push({
    id: 'F2-F1',
    fromMode: 'F2',
    toMode: 'F1',
    points: [f2X, f2Y, f2X, f1Y_top],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F5 to F4 connection
  const f5X = sectionPositions.F.x + 4.2 * sectionPositions.F.width / 5 - Gsrsm_F5_SIZE.width / 2 + Gsrsm_F5_SIZE.width / 2;
  const f5Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 120;
  const f4Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90;

  connections.push({
    id: 'F5-F4',
    fromMode: 'F5',
    toMode: 'F4',
    points: [f5X, f5Y, f5X, f4Y],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A6 to A1 connection
  const a6X_right = sectionPositions.A.x + 20 + Gsrsm_A6_SIZE.width;
  const a6Y_center = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height / 2;
  const a1X_left = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A1_SIZE.width - 20;
  const a1Y_center = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height / 2;

  connections.push({
    id: 'A6-A1',
    fromMode: 'A6',
    toMode: 'A1',
    points: [a6X_right, a6Y_center, a1X_left, a1Y_center],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A7 to A4 connection
  const a7X_right = sectionPositions.A.x + Gsrsm_A6_SIZE.width - Gsrsm_A7_SIZE.width + 20 + Gsrsm_A7_SIZE.width;
  const a7Y_center = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A7_SIZE.height / 2;
  const a4X_left = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A4_SIZE.width - 20;
  const a4Y_center = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A4_SIZE.height / 2;

  connections.push({
    id: 'A7-A4',
    fromMode: 'A7',
    toMode: 'A4',
    points: [a7X_right, a7Y_center, a4X_left, a4Y_center],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to F5 connection (horizontal)
  const f1X_right = sectionPositions.F.x + sectionPositions.F.width / 3 - Gsrsm_F1_SIZE.width / 2 + Gsrsm_F1_SIZE.width;
  const f1Y_upper = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height / 3;
  const f5X_left = sectionPositions.F.x + 4.2 * sectionPositions.F.width / 5 - Gsrsm_F5_SIZE.width / 2;

  connections.push({
    id: 'F1-F5',
    fromMode: 'F1',
    toMode: 'F5',
    points: [f1X_right, f1Y_upper, f5X_left, f1Y_upper],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F5 to F1 connection (horizontal, slightly below)
  const f1Y_lower = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height / 3 + 10;

  connections.push({
    id: 'F5-F1',
    fromMode: 'F5',
    toMode: 'F1',
    points: [f5X_left, f1Y_lower, f1X_right, f1Y_lower],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to F6 connection (horizontal)
  const f1Y_bottom = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height * 0.9;
  const f6X_left = sectionPositions.F.x + 4.2 * sectionPositions.F.width / 5 - Gsrsm_F6_SIZE.width / 2;

  connections.push({
    id: 'F1-F6',
    fromMode: 'F1',
    toMode: 'F6',
    points: [f1X_right, f1Y_bottom, f6X_left, f1Y_bottom],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F6 to F1 connection (horizontal, slightly below)
  const f1Y_bottom_lower = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height * 0.9 + 15;

  connections.push({
    id: 'F6-F1',
    fromMode: 'F6',
    toMode: 'F1',
    points: [f6X_left, f1Y_bottom_lower, f1X_right, f1Y_bottom_lower],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F6 to D1 connection (horizontal)
  const d1CenterY = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40 + Gsrsm_D1_SIZE.height / 2;
  const d1RightX = sectionPositions.D.x + 20 + (sectionPositions.D.width - 40);

  connections.push({
    id: 'F6-D1',
    fromMode: 'F6',
    toMode: 'D1',
    points: [f6X_left, d1CenterY, d1RightX, d1CenterY],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // Complex connections between A and F sections

  // A1 to F2 connection (complex path)
  const a1X_right = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A1_SIZE.width - 20 + Gsrsm_A1_SIZE.width;
  const a1Y_middle = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height / 2;
  const f2X_top = sectionPositions.F.x + sectionPositions.F.width / 4;
  const f2Y_top = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90;

  connections.push({
    id: 'A1-F2',
    fromMode: 'A1',
    toMode: 'F2',
    points: [a1X_right, a1Y_middle, f2X_top, a1Y_middle, f2X_top, f2Y_top],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A1 to F1 connection (complex path)
  const a1Y_lower = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height * 0.7;
  const f1X_left = sectionPositions.F.x + sectionPositions.F.width / 5; // Moved slightly right
  const f1Y_top_entry = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40;

  connections.push({
    id: 'A1-F1',
    fromMode: 'A1',
    toMode: 'F1',
    points: [a1X_right, a1Y_lower, f1X_left, a1Y_lower, f1X_left, f1Y_top_entry],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A4 to F1 connection (complex path)
  const a4X_right = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A4_SIZE.width - 20 + Gsrsm_A4_SIZE.width;
  const a4Y_middle = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A4_SIZE.height / 2;
  const f1X_far_left = sectionPositions.F.x + sectionPositions.F.width / 8; // Moved further right (was /15)

  connections.push({
    id: 'A4-F1',
    fromMode: 'A4',
    toMode: 'F1',
    points: [a4X_right, a4Y_middle, f1X_far_left, a4Y_middle, f1X_far_left, f1Y_top_entry],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F3 to A1 connection (complex path)
  const f3X_center = sectionPositions.F.x + sectionPositions.F.width / 2;
  const f3Y_top = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90;
  const a1Y_upper = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height / 3;

  connections.push({
    id: 'F3-A1',
    fromMode: 'F3',
    toMode: 'A1',
    points: [f3X_center, f3Y_top, f3X_center, a1Y_upper, a1X_right, a1Y_upper],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F4 to A6 connection (complex path)
  const f4X_left = sectionPositions.F.x + 4.2 * sectionPositions.F.width / 5 - Gsrsm_F4_SIZE.width / 2;
  const f4Y_top = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90 - Gsrsm_F4_SIZE.height;
  const a6X_center = sectionPositions.A.x + 20 + Gsrsm_A6_SIZE.width / 2;
  const a6Y_top = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30;

  connections.push({
    id: 'F4-A6',
    fromMode: 'F4',
    toMode: 'A6',
    points: [f4X_left, f4Y_top, a6X_center, f4Y_top, a6X_center, a6Y_top],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A1 to F4 connection (with divergence to F5)
  const f4Y_upper = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 90 - Gsrsm_F4_SIZE.height * 0.7; // Moved down (was *0.8)
  const a1Y_f4_level = f4Y_upper; // Use same Y for horizontal line

  connections.push({
    id: 'A1-F4',
    fromMode: 'A1',
    toMode: 'F4',
    points: [a1X_right, a1Y_f4_level, f4X_left, f4Y_upper],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // A1 to F5 connection (diverged from A1-F4)
  const f5Y_middle = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 120 + Gsrsm_F5_SIZE.height / 2;
  const f1RightX = sectionPositions.F.x + sectionPositions.F.width / 3 - Gsrsm_F1_SIZE.width / 2 + Gsrsm_F1_SIZE.width;

  connections.push({
    id: 'A1-F5',
    fromMode: 'A1',
    toMode: 'F5',
    points: [
      a1X_right, a1Y_f4_level,
      f1RightX + 20, a1Y_f4_level,
      f1RightX + 20, f5Y_middle,
      f5X_left, f5Y_middle
    ],
    dash: [8, 4],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to F4 connection
  const f1Y_f4_level = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height * 0.2;

  connections.push({
    id: 'F1-F4',
    fromMode: 'F1',
    toMode: 'F4',
    points: [
      f1X_right, f1Y_f4_level,
      f1X_right + 20, f1Y_f4_level,
      f1X_right + 20, f4Y_upper,
      f4X_left, f4Y_upper
    ],
    dash: [8, 4],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to D1 connection (complex path)
  const f1X_center = sectionPositions.F.x + sectionPositions.F.width / 3 - Gsrsm_F1_SIZE.width / 2 + Gsrsm_F1_SIZE.width / 2;
  const f1Y_bottom_center = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40 + Gsrsm_F1_SIZE.height;

  connections.push({
    id: 'F1-D1',
    fromMode: 'F1',
    toMode: 'D1',
    points: [
      f1X_center, f1Y_bottom_center,
      f1X_center, d1CenterY,
      d1RightX, d1CenterY
    ],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // Additional cross-section connections

  // F1 to A3 connection (horizontal)
  const a3X_right = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A3_SIZE.width - 20 + Gsrsm_A3_SIZE.width;
  const a3Y_lower = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A3_SIZE.height * 0.7;
  const f1X_left_edge = sectionPositions.F.x + sectionPositions.F.width / 3 - Gsrsm_F1_SIZE.width / 2;

  connections.push({
    id: 'F1-A3',
    fromMode: 'F1',
    toMode: 'A3',
    points: [f1X_left_edge, a3Y_lower, a3X_right, a3Y_lower],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to A2 connection (horizontal)
  const a2X_right = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A2_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10 + Gsrsm_A2_SIZE.width;
  const a2Y_lower = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A2_SIZE.height * 0.9;

  connections.push({
    id: 'F1-A2',
    fromMode: 'F1',
    toMode: 'A2',
    points: [f1X_left_edge, a2Y_lower, a2X_right, a2Y_lower],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  // F1 to D3 connection (horizontal)
  const d3X_right = sectionPositions.D.x + sectionPositions.D.width - Gsrsm_A3_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10 + Gsrsm_D3_SIZE.width;
  const d3Y_center = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20 + Gsrsm_D3_SIZE.height / 2;

  connections.push({
    id: 'F1-D3',
    fromMode: 'F1',
    toMode: 'D3',
    points: [f1X_left_edge, d3Y_center, d3X_right, d3Y_center],
    dash: [5, 5],
    pointerLength: 10,
    pointerWidth: 8,
  });

  return connections;
};

// Helper function to determine if a connection should be highlighted
export const shouldHighlightConnection = (
  connection: GsrsmConnectionDefinition,
  activeModes: string[]
): boolean => {
  return activeModes.includes(connection.fromMode) && activeModes.includes(connection.toMode);
};
