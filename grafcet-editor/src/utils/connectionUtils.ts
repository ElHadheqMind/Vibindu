import {
  Point,
  Connection,
  Step,
  Transition,
  Gate,
  ConnectionSegment,
  GrafcetElement,
} from '../models/types';
import { getConnectionPoints, createConnectionSegment } from '../models/GrafcetElements';

// Calculate the STRICT connection points between two elements
// This function enforces the non-negotiable GRAFCET constraint:
// ALL transitions must connect from bottom of source to top of target (or vice versa for upward flow)
// For AND gates, it allows connections anywhere along the width of the bar for synchronization.
export const calculateConnectionPoints = (
  sourceElement: Step | Transition | Gate,
  targetElement: Step | Transition | Gate
): { start: Point; end: Point } => {
  const sourcePoints = getConnectionPoints(sourceElement);
  const targetPoints = getConnectionPoints(targetElement);

  // Determine flow direction for specialized gate logic
  const isUpward = sourcePoints.bottom.y > targetPoints.top.y;

  // Initial standard GRAFCET points: Always bottom to top
  // In GRAFCET, connections always leave from the bottom and enter from the top
  let start = sourcePoints.bottom;
  let end = targetPoints.top;

  // Handle AND Gate width synchronization
  // This allows straight vertical lines from/to the horizontal AND bar
  if (sourceElement.type === 'and-gate') {
    const targetSize = 'size' in targetElement ? targetElement.size : { width: 0, height: 0 };
    const targetCenterX = targetElement.position.x + targetSize.width / 2;

    // Clamp targetCenterX to gate width
    const minX = sourceElement.position.x;
    const maxX = sourceElement.position.x + sourceElement.size.width;
    const clampedX = Math.max(minX, Math.min(maxX, targetCenterX));

    const yValue = isUpward ? sourceElement.position.y : sourceElement.position.y + sourceElement.size.height;
    start = { x: clampedX, y: yValue };
  }

  if (targetElement.type === 'and-gate') {
    const sourceSize = 'size' in sourceElement ? sourceElement.size : { width: 0, height: 0 };
    const sourceCenterX = sourceElement.position.x + sourceSize.width / 2;

    // Clamp sourceCenterX to gate width
    const minX = targetElement.position.x;
    const maxX = targetElement.position.x + targetElement.size.width;
    const clampedX = Math.max(minX, Math.min(maxX, sourceCenterX));

    const yValue = isUpward ? targetElement.position.y + targetElement.size.height : targetElement.position.y;
    end = { x: clampedX, y: yValue };
  }

  return { start, end };
};

// Validate that a connection follows strict GRAFCET constraints
export const validateConnectionConstraints = (
  sourceElement: Step | Transition | Gate,
  targetElement: Step | Transition | Gate,
  connection: Connection
): { isValid: boolean; violations: string[] } => {
  const violations: string[] = [];

  // Get the expected connection points
  const { start: expectedStart, end: expectedEnd } = calculateConnectionPoints(sourceElement, targetElement);

  // Check if connection has segments
  if (!connection.segments || connection.segments.length === 0) {
    violations.push('Connection has no segments');
    return { isValid: false, violations };
  }

  // Get actual start and end points from segments
  const firstSegment = connection.segments[0];
  const lastSegment = connection.segments[connection.segments.length - 1];

  if (firstSegment.points.length === 0 || lastSegment.points.length === 0) {
    violations.push('Connection segments have no points');
    return { isValid: false, violations };
  }

  const actualStart = firstSegment.points[0];
  const actualEnd = lastSegment.points[lastSegment.points.length - 1];

  // Check start point (with small tolerance for floating point precision)
  const tolerance = 1;
  if (Math.abs(actualStart.x - expectedStart.x) > tolerance ||
    Math.abs(actualStart.y - expectedStart.y) > tolerance) {
    violations.push(`Start point mismatch: expected (${expectedStart.x}, ${expectedStart.y}), got (${actualStart.x}, ${actualStart.y})`);
  }

  // Check end point
  if (Math.abs(actualEnd.x - expectedEnd.x) > tolerance ||
    Math.abs(actualEnd.y - expectedEnd.y) > tolerance) {
    violations.push(`End point mismatch: expected (${expectedEnd.x}, ${expectedEnd.y}), got (${actualEnd.x}, ${actualEnd.y})`);
  }

  return { isValid: violations.length === 0, violations };
};

// Generate connection segments for a GRAFCET-compliant vertical-horizontal-vertical path
// This function ENFORCES the strict constraint that connections must start and end
// at the exact center points of elements (center-bottom to center-top)
export const generateSimpleConnectionPath = (
  start: Point,
  end: Point
): ConnectionSegment[] => {
  // STRICT CONSTRAINT: The start and end points are FIXED and cannot be modified
  // They represent the exact center-bottom and center-top points of elements

  // If points are aligned vertically (within a small threshold)
  if (Math.abs(start.x - end.x) < 5) {
    // Direct vertical connection - maintain the exact X position of both points
    // Use the average to handle minor floating point differences
    const averageX = (start.x + end.x) / 2;
    const adjustedStart = { x: averageX, y: start.y };
    const adjustedEnd = { x: averageX, y: end.y };
    return [createConnectionSegment([adjustedStart, adjustedEnd], 'vertical')];
  }

  // Standard 3-segment path with FIXED vertical entry/exit points
  // CRITICAL: The first and last segments maintain their exact X positions
  // This ensures the connection always starts and ends at the element centers

  // Calculate the midpoint Y based on the available space
  // Always position the horizontal line exactly in the middle between the two points
  // This ensures consistent positioning for transitions along the connection path
  const midY = (start.y + end.y) / 2;

  return [
    // First vertical segment - MAINTAINS EXACT X position of start point (center-bottom)
    createConnectionSegment([start, { x: start.x, y: midY }], 'vertical'),

    // Horizontal segment - connects the two vertical segments at the midpoint
    createConnectionSegment(
      [
        { x: start.x, y: midY },
        { x: end.x, y: midY },
      ],
      'horizontal'
    ),

    // Second vertical segment - MAINTAINS EXACT X position of end point (center-top)
    createConnectionSegment([{ x: end.x, y: midY }, end], 'vertical'),
  ];
};

// Generate a more complex path that avoids obstacles while maintaining GRAFCET constraints
export const generateComplexConnectionPath = (
  start: Point,
  end: Point,
  obstacles: GrafcetElement[]
): ConnectionSegment[] => {
  // Start with a simple path
  const simplePath = generateSimpleConnectionPath(start, end);

  // Check if the simple path intersects with any obstacles
  const hasIntersections = checkPathIntersections(simplePath, obstacles);

  if (!hasIntersections) {
    return simplePath;
  }

  // If there are intersections, generate a more complex path
  // The key constraint is that vertical segments must maintain their X positions
  // at the center of the source and target elements

  // Determine if this is an upward or downward connection
  const isUpwardConnection = start.y > end.y;

  // For upward connections (going against the normal flow), use a simple 3-segment orthogonal path
  if (isUpwardConnection) {
    // Determine the detour X position. 
    // If aligned vertically, we detour to the left.
    // If already apart (like in a jump structure), we use the leftmost X as the vertical path.
    const xDistance = Math.abs(start.x - end.x);
    const midX = xDistance < 20 ? start.x - 100 : Math.min(start.x, end.x);

    const points = [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];

    const upSegments: ConnectionSegment[] = [];
    if (Math.abs(points[0].x - points[1].x) > 1) {
      upSegments.push(createConnectionSegment([points[0], points[1]], 'horizontal'));
    }
    if (Math.abs(points[1].y - points[2].y) > 1) {
      upSegments.push(createConnectionSegment([points[1], points[2]], 'vertical'));
    }
    if (Math.abs(points[2].x - points[3].x) > 1) {
      upSegments.push(createConnectionSegment([points[2], points[3]], 'horizontal'));
    }

    return upSegments;
  }

  // For standard downward connections, we can use a simpler path
  // but still need to avoid obstacles

  // Calculate the ideal midpoint Y

  // Always position the horizontal line exactly in the middle between the two points
  // This ensures consistent positioning for divergence and convergence structures
  const midY = (start.y + end.y) / 2;

  // Use the exact middle for consistent positioning
  // This ensures transitions will be properly centered

  return [
    // First vertical segment - maintains exact X position of start point
    createConnectionSegment([start, { x: start.x, y: midY }], 'vertical'),

    // Horizontal segment - connects the two vertical segments
    createConnectionSegment(
      [
        { x: start.x, y: midY },
        { x: end.x, y: midY },
      ],
      'horizontal'
    ),

    // Second vertical segment - maintains exact X position of end point
    createConnectionSegment([{ x: end.x, y: midY }, end], 'vertical'),
  ];
};

// Check if a path intersects with any obstacles
const checkPathIntersections = (
  segments: ConnectionSegment[],
  obstacles: GrafcetElement[]
): boolean => {
  // Filter obstacles to only include steps, transitions, and gates
  // (we don't care about intersections with connections or action blocks)
  const relevantObstacles = obstacles.filter(o =>
    o.type === 'step' || o.type === 'transition' ||
    o.type === 'and-gate' || o.type === 'or-gate'
  );

  // Check each segment for intersections
  for (const segment of segments) {
    // Skip segments with less than 2 points
    if (segment.points.length < 2) continue;

    // Check each line segment (between consecutive points)
    for (let i = 0; i < segment.points.length - 1; i++) {
      const p1 = segment.points[i];
      const p2 = segment.points[i + 1];

      // Check if this line segment intersects with any obstacle
      for (const obstacle of relevantObstacles) {
        // Get obstacle bounds
        const bounds = {
          x1: obstacle.position.x,
          y1: obstacle.position.y,
          x2: obstacle.position.x + (obstacle as any).size.width,
          y2: obstacle.position.y + (obstacle as any).size.height
        };

        // Check if the line segment intersects with the obstacle
        if (lineIntersectsRectangle(p1, p2, bounds)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Helper function to check if a line segment intersects with a rectangle
const lineIntersectsRectangle = (
  p1: Point,
  p2: Point,
  rect: { x1: number, y1: number, x2: number, y2: number }
): boolean => {
  // Check if either endpoint is inside the rectangle
  if (pointInRectangle(p1, rect) || pointInRectangle(p2, rect)) {
    return true;
  }

  // Check if the line intersects any of the rectangle's edges
  const rectEdges = [
    // Top edge
    { p1: { x: rect.x1, y: rect.y1 }, p2: { x: rect.x2, y: rect.y1 } },
    // Right edge
    { p1: { x: rect.x2, y: rect.y1 }, p2: { x: rect.x2, y: rect.y2 } },
    // Bottom edge
    { p1: { x: rect.x1, y: rect.y2 }, p2: { x: rect.x2, y: rect.y2 } },
    // Left edge
    { p1: { x: rect.x1, y: rect.y1 }, p2: { x: rect.x1, y: rect.y2 } }
  ];

  for (const edge of rectEdges) {
    if (lineSegmentsIntersect(p1, p2, edge.p1, edge.p2)) {
      return true;
    }
  }

  return false;
};

// Helper function to check if a point is inside a rectangle
const pointInRectangle = (
  p: Point,
  rect: { x1: number, y1: number, x2: number, y2: number }
): boolean => {
  return p.x >= rect.x1 && p.x <= rect.x2 && p.y >= rect.y1 && p.y <= rect.y2;
};

// Helper function to check if two line segments intersect
const lineSegmentsIntersect = (
  p1: Point, p2: Point,
  p3: Point, p4: Point
): boolean => {
  // Calculate the direction vectors
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  // Calculate the determinant
  const det = d1x * d2y - d1y * d2x;

  // If determinant is zero, lines are parallel
  if (Math.abs(det) < 0.001) return false;

  // Calculate the parameters for the intersection point
  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;

  const t1 = (dx * d2y - dy * d2x) / det;
  const t2 = (dx * d1y - dy * d1x) / det;

  // Check if the intersection point is within both line segments
  return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
};

// Update a connection segment by dragging with STRICT CONSTRAINT ENFORCEMENT
export const updateConnectionSegment = (
  connection: Connection,
  segmentId: string,
  dragPoint: Point
): ConnectionSegment[] => {
  const updatedSegments = [...connection.segments];
  const segmentIndex = updatedSegments.findIndex((s) => s.id === segmentId);

  if (segmentIndex === -1) return updatedSegments;

  const segment = updatedSegments[segmentIndex];
  const prevSegment = segmentIndex > 0 ? updatedSegments[segmentIndex - 1] : null;
  const nextSegment = segmentIndex < updatedSegments.length - 1 ? updatedSegments[segmentIndex + 1] : null;

  // STRICT CONSTRAINT ENFORCEMENT:
  // The first and last segments are PROTECTED and cannot be modified
  // This ensures connections always maintain their exact anchor points
  const isFirstSegment = segmentIndex === 0;
  const isLastSegment = segmentIndex === updatedSegments.length - 1;

  // PREVENT modification of anchor segments to maintain strict connection constraints
  if (isFirstSegment || isLastSegment) {
    // For anchor segments (first and last), we only allow limited modifications
    // that don't affect the connection points to the elements

    if (isFirstSegment && segment.orientation === 'vertical') {
      // First vertical segment: can only modify the end point Y, not the start point
      const startPoint = segment.points[0]; // This is the anchor point - NEVER modify
      const newEndY = dragPoint.y;

      updatedSegments[segmentIndex] = {
        ...segment,
        points: [startPoint, { x: startPoint.x, y: newEndY }],
      };

      // Update the next segment if it's horizontal
      if (nextSegment && nextSegment.orientation === 'horizontal') {
        const nextPoints = [...nextSegment.points];
        nextPoints[0] = { x: nextPoints[0].x, y: newEndY };

        updatedSegments[segmentIndex + 1] = {
          ...nextSegment,
          points: nextPoints,
        };
      }
    } else if (isLastSegment && segment.orientation === 'vertical') {
      // Last vertical segment: can only modify the start point Y, not the end point
      const endPoint = segment.points[segment.points.length - 1]; // This is the anchor point - NEVER modify
      const newStartY = dragPoint.y;

      updatedSegments[segmentIndex] = {
        ...segment,
        points: [{ x: endPoint.x, y: newStartY }, endPoint],
      };

      // Update the previous segment if it's horizontal
      if (prevSegment && prevSegment.orientation === 'horizontal') {
        const prevPoints = [...prevSegment.points];
        prevPoints[prevPoints.length - 1] = { x: prevPoints[prevPoints.length - 1].x, y: newStartY };

        updatedSegments[segmentIndex - 1] = {
          ...prevSegment,
          points: prevPoints,
        };
      }
    }
    // For horizontal anchor segments or other cases, no modification allowed
    return updatedSegments;
  }

  // For middle segments, allow normal dragging behavior
  if (segment.orientation === 'horizontal') {
    // Dragging a horizontal segment changes its Y position
    const newY = dragPoint.y;
    const newPoints = segment.points.map((p) => ({ x: p.x, y: newY }));

    updatedSegments[segmentIndex] = {
      ...segment,
      points: newPoints,
    };

    // Update connecting segments
    if (prevSegment && prevSegment.orientation === 'vertical') {
      const prevPoints = [...prevSegment.points];
      prevPoints[prevPoints.length - 1] = { x: prevPoints[prevPoints.length - 1].x, y: newY };

      updatedSegments[segmentIndex - 1] = {
        ...prevSegment,
        points: prevPoints,
      };
    }

    if (nextSegment && nextSegment.orientation === 'vertical') {
      const nextPoints = [...nextSegment.points];
      nextPoints[0] = { x: nextPoints[0].x, y: newY };

      updatedSegments[segmentIndex + 1] = {
        ...nextSegment,
        points: nextPoints,
      };
    }
  } else if (segment.orientation === 'vertical') {
    // Dragging a vertical segment changes its X position
    const newX = dragPoint.x;
    const newPoints = segment.points.map((p) => ({ x: newX, y: p.y }));

    updatedSegments[segmentIndex] = {
      ...segment,
      points: newPoints,
    };

    // Update connecting segments
    if (prevSegment && prevSegment.orientation === 'horizontal') {
      const prevPoints = [...prevSegment.points];
      prevPoints[prevPoints.length - 1] = { x: newX, y: prevPoints[prevPoints.length - 1].y };

      updatedSegments[segmentIndex - 1] = {
        ...prevSegment,
        points: prevPoints,
      };
    }

    if (nextSegment && nextSegment.orientation === 'horizontal') {
      const nextPoints = [...nextSegment.points];
      nextPoints[0] = { x: newX, y: nextPoints[0].y };

      updatedSegments[segmentIndex + 1] = {
        ...nextSegment,
        points: nextPoints,
      };
    }
  }

  return updatedSegments;
};

// Enforce strict connection constraints by regenerating the connection path
// This function is called to restore proper connection constraints if they've been violated
export const enforceConnectionConstraints = (
  _connection: Connection,
  sourceElement: Step | Transition | Gate,
  targetElement: Step | Transition | Gate,
  obstacles: GrafcetElement[] = []
): ConnectionSegment[] => {
  // Get the strict connection points
  const { start, end } = calculateConnectionPoints(sourceElement, targetElement);

  // Regenerate the connection path using the strict constraints
  return generateComplexConnectionPath(start, end, obstacles);
};
