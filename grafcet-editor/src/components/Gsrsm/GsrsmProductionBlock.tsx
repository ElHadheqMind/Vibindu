import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { useTheme } from '../../context/ThemeContext';
import { Gsrsm_PRODUCTION_DASH } from '../../models/constants';

interface GsrsmProductionBlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

/**
 * Component that renders a production block with double discontinued line rectangle
 * Used to visually group related Gsrsm modes
 */
const GsrsmProductionBlock: React.FC<GsrsmProductionBlockProps> = ({
  x,
  y,
  width,
  height,
  label = 'Production'
}) => {
  const { theme } = useTheme();
  const lineColor = theme.mode === 'light' ? '#000000' : '#ffffff';
  const spacing = 5; // Spacing between the double lines
  const labelWidth = 90; // Increased width for the label
  const labelPadding = 5;
  const labelStartX = x + 30; // Moved further to the right (from 15 to 30)
  const labelEndX = labelStartX + labelWidth;
  const gapForLabel = 10; // Extra space around the label

  return (
    <Group>
      {/* Outer discontinued line - Top with gap for label */}
      <Line
        points={[
          x, y, // Start at top-left
          labelStartX - gapForLabel, y, // Line until label start
        ]}
        stroke={lineColor}
        strokeWidth={1.5}
        dash={Gsrsm_PRODUCTION_DASH}
      />

      <Line
        points={[
          labelEndX + gapForLabel, y, // Start after label
          x + width, y, // Line to top-right corner
          x + width, y + height, // Right side
          x, y + height, // Bottom side
          x, y // Back to top-left
        ]}
        stroke={lineColor}
        strokeWidth={1.5}
        dash={Gsrsm_PRODUCTION_DASH}
        closed={false}
      />

      {/* Inner discontinued line - Top with gap for label */}
      <Line
        points={[
          x + spacing, y + spacing, // Start at inner top-left
          labelStartX - gapForLabel, y + spacing, // Line until label start
        ]}
        stroke={lineColor}
        strokeWidth={1.5}
        dash={Gsrsm_PRODUCTION_DASH}
      />

      <Line
        points={[
          labelEndX + gapForLabel, y + spacing, // Start after label
          x + width - spacing, y + spacing, // Line to inner top-right corner
          x + width - spacing, y + height - spacing, // Right side
          x + spacing, y + height - spacing, // Bottom side
          x + spacing, y + spacing // Back to inner top-left
        ]}
        stroke={lineColor}
        strokeWidth={1.5}
        dash={Gsrsm_PRODUCTION_DASH}
        closed={false}
      />

      {/* Label - positioned at top left, on the line */}
      {label && (
        <Text
          text={label}
          x={labelStartX}
          y={y - 6}
          width={labelWidth}
          height={12}
          fontSize={11}
          fontStyle="bold"
          fill={lineColor}
          align="left"
          verticalAlign="middle"
        />
      )}
    </Group>
  );
};

export default GsrsmProductionBlock;
