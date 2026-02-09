import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import { useEditorStore } from '../../store/useEditorStore';
import { useTheme } from '../../context/ThemeContext';
import { GrafcetElement } from '../../models/types';

interface SelectionHandlesProps {
  elements: GrafcetElement[];
}

interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = 2;

const SelectionHandles: React.FC<SelectionHandlesProps> = ({ elements }) => {
  const { scale } = useEditorStore();
  const { theme } = useTheme();

  if (elements.length === 0) return null;

  // Calculate bounding box for all selected elements
  const calculateBounds = (elements: GrafcetElement[]): SelectionBounds => {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      const { position } = element;
      const size = 'size' in element ? element.size : null;
      
      if (size) {
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        maxX = Math.max(maxX, position.x + size.width);
        maxY = Math.max(maxY, position.y + size.height);
      } else {
        // For elements without size (like connections), just use position
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        maxX = Math.max(maxX, position.x);
        maxY = Math.max(maxY, position.y);
      }
    });

    return {
      x: minX - HANDLE_OFFSET,
      y: minY - HANDLE_OFFSET,
      width: maxX - minX + (HANDLE_OFFSET * 2),
      height: maxY - minY + (HANDLE_OFFSET * 2),
    };
  };

  const bounds = calculateBounds(elements);
  const handleSize = HANDLE_SIZE / scale;
  const strokeWidth = 1 / scale;

  // Handle positions for resize operations
  const handles = [
    { id: 'nw', x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
    { id: 'n', x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'n-resize' },
    { id: 'ne', x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
    { id: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'e-resize' },
    { id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' },
    { id: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 's-resize' },
    { id: 'sw', x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
    { id: 'w', x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'w-resize' },
  ];

  const handleMouseEnter = (cursor: string) => {
    document.body.style.cursor = cursor;
  };

  const handleMouseLeave = () => {
    document.body.style.cursor = 'default';
  };

  return (
    <Group>
      {/* Selection border */}
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        stroke={theme.selectionBorder}
        strokeWidth={strokeWidth}
        dash={[4 / scale, 4 / scale]}
        fill="transparent"
        listening={false}
      />

      {/* Selection handles */}
      {elements.length === 1 && handles.map(handle => (
        <Group key={handle.id}>
          {/* Handle background */}
          <Rect
            x={handle.x - handleSize / 2}
            y={handle.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill={theme.background}
            stroke={theme.selectionBorder}
            strokeWidth={strokeWidth}
            onMouseEnter={() => handleMouseEnter(handle.cursor)}
            onMouseLeave={handleMouseLeave}
          />
          
          {/* Handle center dot */}
          <Circle
            x={handle.x}
            y={handle.y}
            radius={1 / scale}
            fill={theme.selectionBorder}
            listening={false}
          />
        </Group>
      ))}

      {/* Multi-selection indicator */}
      {elements.length > 1 && (
        <Group>
          {/* Corner indicators for multi-selection */}
          {[
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height },
          ].map((corner, index) => (
            <Rect
              key={index}
              x={corner.x - handleSize / 4}
              y={corner.y - handleSize / 4}
              width={handleSize / 2}
              height={handleSize / 2}
              fill={theme.primary}
              stroke={theme.background}
              strokeWidth={strokeWidth / 2}
              listening={false}
            />
          ))}
          
          {/* Selection count indicator */}
          <Group
            x={bounds.x + bounds.width + 10 / scale}
            y={bounds.y}
          >
            <Rect
              x={0}
              y={0}
              width={20 / scale}
              height={16 / scale}
              fill={theme.primary}
              cornerRadius={2 / scale}
              listening={false}
            />
            <Text
              x={10 / scale}
              y={8 / scale}
              text={elements.length.toString()}
              fontSize={10 / scale}
              fill={theme.background}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </Group>
        </Group>
      )}
    </Group>
  );
};

export default SelectionHandles;
