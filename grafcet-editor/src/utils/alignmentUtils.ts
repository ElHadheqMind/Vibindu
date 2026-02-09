import { GrafcetElement, Point, Size } from '../models/types';

// Get element bounds (position and size)
export const getElementBounds = (element: GrafcetElement): { position: Point; size: Size } => {
  const position = element.position;
  let size: Size = { width: 0, height: 0 };
  
  if ('size' in element) {
    size = element.size;
  }
  
  return { position, size };
};

// Align elements to the top
export const alignTop = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition } = getElementBounds(referenceElement);
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    newPositions[element.id] = {
      x: element.position.x,
      y: refPosition.y,
    };
  });
  
  return newPositions;
};

// Align elements to the bottom
export const alignBottom = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition, size: refSize } = getElementBounds(referenceElement);
  const refBottom = refPosition.y + refSize.height;
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    const { size } = getElementBounds(element);
    newPositions[element.id] = {
      x: element.position.x,
      y: refBottom - size.height,
    };
  });
  
  return newPositions;
};

// Align elements to the left
export const alignLeft = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition } = getElementBounds(referenceElement);
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    newPositions[element.id] = {
      x: refPosition.x,
      y: element.position.y,
    };
  });
  
  return newPositions;
};

// Align elements to the right
export const alignRight = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition, size: refSize } = getElementBounds(referenceElement);
  const refRight = refPosition.x + refSize.width;
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    const { size } = getElementBounds(element);
    newPositions[element.id] = {
      x: refRight - size.width,
      y: element.position.y,
    };
  });
  
  return newPositions;
};

// Align elements to the center horizontally
export const alignCenterHorizontal = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition, size: refSize } = getElementBounds(referenceElement);
  const refCenterX = refPosition.x + refSize.width / 2;
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    const { size } = getElementBounds(element);
    newPositions[element.id] = {
      x: refCenterX - size.width / 2,
      y: element.position.y,
    };
  });
  
  return newPositions;
};

// Align elements to the center vertically
export const alignCenterVertical = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 2) return {};
  
  const referenceElement = elements[0];
  const { position: refPosition, size: refSize } = getElementBounds(referenceElement);
  const refCenterY = refPosition.y + refSize.height / 2;
  const newPositions: { [id: string]: Point } = {};
  
  elements.slice(1).forEach((element) => {
    const { size } = getElementBounds(element);
    newPositions[element.id] = {
      x: element.position.x,
      y: refCenterY - size.height / 2,
    };
  });
  
  return newPositions;
};

// Distribute elements horizontally
export const distributeHorizontal = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 3) return {};
  
  // Sort elements by x position
  const sortedElements = [...elements].sort((a, b) => a.position.x - b.position.x);
  
  // Calculate total width and space
  const firstElement = sortedElements[0];
  const lastElement = sortedElements[sortedElements.length - 1];
  const { position: firstPos } = getElementBounds(firstElement);
  const { position: lastPos, size: lastSize } = getElementBounds(lastElement);
  
  const totalWidth = (lastPos.x + lastSize.width) - firstPos.x;
  const totalElementWidth = sortedElements.reduce((sum, element) => {
    const { size } = getElementBounds(element);
    return sum + size.width;
  }, 0);
  
  const spacing = (totalWidth - totalElementWidth) / (sortedElements.length - 1);
  
  // Calculate new positions
  const newPositions: { [id: string]: Point } = {};
  let currentX = firstPos.x;
  
  sortedElements.forEach((element, index) => {
    if (index === 0) return; // Skip first element
    
    const prevElement = sortedElements[index - 1];
    const { size: prevSize } = getElementBounds(prevElement);
    
    currentX += prevSize.width + spacing;
    
    newPositions[element.id] = {
      x: currentX,
      y: element.position.y,
    };
  });
  
  return newPositions;
};

// Distribute elements vertically
export const distributeVertical = (elements: GrafcetElement[]): { [id: string]: Point } => {
  if (elements.length < 3) return {};
  
  // Sort elements by y position
  const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y);
  
  // Calculate total height and space
  const firstElement = sortedElements[0];
  const lastElement = sortedElements[sortedElements.length - 1];
  const { position: firstPos } = getElementBounds(firstElement);
  const { position: lastPos, size: lastSize } = getElementBounds(lastElement);
  
  const totalHeight = (lastPos.y + lastSize.height) - firstPos.y;
  const totalElementHeight = sortedElements.reduce((sum, element) => {
    const { size } = getElementBounds(element);
    return sum + size.height;
  }, 0);
  
  const spacing = (totalHeight - totalElementHeight) / (sortedElements.length - 1);
  
  // Calculate new positions
  const newPositions: { [id: string]: Point } = {};
  let currentY = firstPos.y;
  
  sortedElements.forEach((element, index) => {
    if (index === 0) return; // Skip first element
    
    const prevElement = sortedElements[index - 1];
    const { size: prevSize } = getElementBounds(prevElement);
    
    currentY += prevSize.height + spacing;
    
    newPositions[element.id] = {
      x: element.position.x,
      y: currentY,
    };
  });
  
  return newPositions;
};
