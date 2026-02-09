import React from 'react';
import { Line, Group } from 'react-konva';
import { useEditorStore } from '../../store/useEditorStore';
import { useTheme } from '../../context/ThemeContext';

interface GridProps {
  width: number;
  height: number;
}

const Grid: React.FC<GridProps> = ({ width, height }) => {
  const { scale, offset, gridSize, snapToGrid } = useEditorStore();
  const { theme } = useTheme();

  // Calculate grid lines
  const calculateGridLines = () => {
    const lines = [];
    const gridSizeScaled = gridSize;

    // Calculate visible area in canvas coordinates
    const startX = -offset.x / scale;
    const startY = -offset.y / scale;
    const endX = (width - offset.x) / scale;
    const endY = (height - offset.y) / scale;

    // Round to nearest grid line
    const roundedStartX = Math.floor(startX / gridSizeScaled) * gridSizeScaled;
    const roundedStartY = Math.floor(startY / gridSizeScaled) * gridSizeScaled;

    // Vertical lines
    for (let x = roundedStartX; x < endX; x += gridSizeScaled) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={theme.gridColor}
          strokeWidth={x % (gridSizeScaled * 5) === 0 ? 0.5 / scale : 0.25 / scale}
        />
      );
    }

    // Horizontal lines
    for (let y = roundedStartY; y < endY; y += gridSizeScaled) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke={theme.gridColor}
          strokeWidth={y % (gridSizeScaled * 5) === 0 ? 0.5 / scale : 0.25 / scale}
        />
      );
    }

    return lines;
  };

  // Only render grid if snap to grid is enabled
  if (!snapToGrid) {
    return null;
  }

  return <Group name="grid-layer">{calculateGridLines()}</Group>;
};

export default Grid;
