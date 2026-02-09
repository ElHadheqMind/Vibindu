import { GrafcetElement, Point } from '../models/types';

export interface CollisionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}



// Get bounding box for an element
export const getElementBounds = (element: GrafcetElement): CollisionBounds => {
  const { position } = element;
  const size = 'size' in element ? (element as any).size : { width: 0, height: 0 };

  return {
    x: position.x,
    y: position.y,
    width: size?.width || 0,
    height: size?.height || 0,
  };
};

// Check if two bounding boxes intersect
export const boundsIntersect = (bounds1: CollisionBounds, bounds2: CollisionBounds): boolean => {
  return !(
    bounds1.x + bounds1.width <= bounds2.x ||
    bounds2.x + bounds2.width <= bounds1.x ||
    bounds1.y + bounds1.height <= bounds2.y ||
    bounds2.y + bounds2.height <= bounds1.y
  );
};

// Check if two elements collide
export const elementsCollide = (element1: GrafcetElement, element2: GrafcetElement): boolean => {
  if (element1.id === element2.id) return false;
  if (element1.type === 'connection' || element2.type === 'connection') return false;

  const bounds1 = getElementBounds(element1);
  const bounds2 = getElementBounds(element2);

  return boundsIntersect(bounds1, bounds2);
};

// Find all elements that would collide with the given element at a new position
export const findCollisions = (
  element: GrafcetElement,
  newPosition: Point,
  allElements: GrafcetElement[]
): GrafcetElement[] => {
  if (!('size' in element)) return [];
  const size = (element as any).size;

  const newBounds: CollisionBounds = {
    x: newPosition.x,
    y: newPosition.y,
    width: size.width,
    height: size.height,
  };

  return allElements.filter(otherElement => {
    if (otherElement.id === element.id) return false;
    if (otherElement.type === 'connection') return false;

    const otherBounds = getElementBounds(otherElement);
    return boundsIntersect(newBounds, otherBounds);
  });
};

// Find the nearest non-colliding position for an element
export const findNearestNonCollidingPosition = (
  element: GrafcetElement,
  desiredPosition: Point,
  allElements: GrafcetElement[],
  gridSize: number = 20
): Point => {
  if (!('size' in element)) return desiredPosition;


  // Check if desired position is already collision-free
  const collisions = findCollisions(element, desiredPosition, allElements);
  if (collisions.length === 0) {
    return desiredPosition;
  }

  // Search in expanding spiral pattern for collision-free position
  const maxSearchRadius = 200; // Maximum search distance
  const searchStep = gridSize; // Step size for search

  for (let radius = searchStep; radius <= maxSearchRadius; radius += searchStep) {
    // Check positions in a square pattern around the desired position
    const positions = [
      // Top row
      { x: desiredPosition.x - radius, y: desiredPosition.y - radius },
      { x: desiredPosition.x, y: desiredPosition.y - radius },
      { x: desiredPosition.x + radius, y: desiredPosition.y - radius },

      // Middle row (left and right)
      { x: desiredPosition.x - radius, y: desiredPosition.y },
      { x: desiredPosition.x + radius, y: desiredPosition.y },

      // Bottom row
      { x: desiredPosition.x - radius, y: desiredPosition.y + radius },
      { x: desiredPosition.x, y: desiredPosition.y + radius },
      { x: desiredPosition.x + radius, y: desiredPosition.y + radius },
    ];

    for (const position of positions) {
      const testCollisions = findCollisions(element, position, allElements);
      if (testCollisions.length === 0) {
        return position;
      }
    }
  }

  // If no collision-free position found, return original desired position
  return desiredPosition;
};

// Calculate smart positioning to avoid overlaps
export const calculateSmartPosition = (
  element: GrafcetElement,
  desiredPosition: Point,
  allElements: GrafcetElement[],
  options: {
    avoidCollisions?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
    preferredDirection?: 'horizontal' | 'vertical' | 'any';
  } = {}
): Point => {
  const {
    avoidCollisions = true,
    snapToGrid = true,
    gridSize = 20,
    preferredDirection = 'any'
  } = options;

  let finalPosition = { ...desiredPosition };

  // Apply grid snapping first
  if (snapToGrid) {
    finalPosition = {
      x: Math.round(finalPosition.x / gridSize) * gridSize,
      y: Math.round(finalPosition.y / gridSize) * gridSize,
    };
  }

  // Apply collision avoidance
  if (avoidCollisions) {
    const collisions = findCollisions(element, finalPosition, allElements);

    if (collisions.length > 0) {
      // Try to find a better position based on preferred direction
      if (preferredDirection === 'horizontal') {
        // Try moving horizontally first
        for (let offset = gridSize; offset <= 200; offset += gridSize) {
          const leftPos = { x: finalPosition.x - offset, y: finalPosition.y };
          const rightPos = { x: finalPosition.x + offset, y: finalPosition.y };

          if (findCollisions(element, rightPos, allElements).length === 0) {
            finalPosition = rightPos;
            break;
          }
          if (findCollisions(element, leftPos, allElements).length === 0) {
            finalPosition = leftPos;
            break;
          }
        }
      } else if (preferredDirection === 'vertical') {
        // Try moving vertically first
        for (let offset = gridSize; offset <= 200; offset += gridSize) {
          const upPos = { x: finalPosition.x, y: finalPosition.y - offset };
          const downPos = { x: finalPosition.x, y: finalPosition.y + offset };

          if (findCollisions(element, downPos, allElements).length === 0) {
            finalPosition = downPos;
            break;
          }
          if (findCollisions(element, upPos, allElements).length === 0) {
            finalPosition = upPos;
            break;
          }
        }
      } else {
        // Use spiral search for any direction
        finalPosition = findNearestNonCollidingPosition(element, finalPosition, allElements, gridSize);
      }
    }
  }

  return finalPosition;
};

// Check if a position is valid (no collisions, within bounds)
export const isValidPosition = (
  element: GrafcetElement,
  position: Point,
  allElements: GrafcetElement[],
  canvasBounds?: { width: number; height: number }
): boolean => {
  if (!('size' in element)) return true;
  const size = (element as any).size;

  // Check canvas bounds
  if (canvasBounds) {
    if (position.x < 0 || position.y < 0 ||
      position.x + size.width > canvasBounds.width ||
      position.y + size.height > canvasBounds.height) {
      return false;
    }
  }

  // Check collisions
  const collisions = findCollisions(element, position, allElements);
  return collisions.length === 0;
};
