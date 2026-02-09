import React from 'react';
import { Group, Rect, Text, Circle, Line } from 'react-konva';
import { GsrsmCategory } from '../../models/types';
import {
  Gsrsm_HEADER_HEIGHT,
  Gsrsm_SECTION_TITLE_FONT_SIZE,
  Gsrsm_HEADER_CIRCLE_RADIUS
} from '../../models/constants';
import { useTheme } from '../../context/ThemeContext';

interface GsrsmSectionProps {
  title: string;
  category: GsrsmCategory;
  x: number;
  y: number;
  width: number;
  height: number;
}

const GsrsmSection: React.FC<GsrsmSectionProps> = ({
  title,
  category,
  x,
  y,
  width,
  height,
}) => {
  const { theme } = useTheme();

  // Get background color based on category to match the reference image
  const getBackgroundColor = () => {
    switch (category) {
      case 'A':
        return theme.mode === 'light' ? '#FFFFCC' : '#665500'; // Yellow for A section
      case 'F':
        return theme.mode === 'light' ? '#CCFFCC' : '#005500'; // Green for F section
      case 'D':
        return theme.mode === 'light' ? '#FFCCCC' : '#550000'; // Red for D section
      default:
        return theme.mode === 'light' ? '#f0f0f0' : '#2d2d2d';
    }
  };

  // Get header background color based on category
  const getHeaderColor = () => {
    switch (category) {
      case 'A':
        return theme.mode === 'light' ? '#FFFFAA' : '#776600'; // Slightly darker yellow for A header
      case 'F':
        return theme.mode === 'light' ? '#AAFFAA' : '#006600'; // Slightly darker green for F header
      case 'D':
        return theme.mode === 'light' ? '#FFAAAA' : '#660000'; // Slightly darker red for D header
      default:
        return theme.mode === 'light' ? '#e0e0e0' : '#424242';
    }
  };

  return (
    <Group x={x} y={y}>
      {/* Section background */}
      <Rect
        width={width}
        height={height}
        fill={getBackgroundColor()}
        stroke={theme.border}
        strokeWidth={1}
        cornerRadius={0}
      />

      {/* Section header */}
      <Rect
        width={width}
        height={Gsrsm_HEADER_HEIGHT}
        fill={getHeaderColor()}
        stroke={theme.border}
        strokeWidth={1}
        cornerRadius={0}
      />

      {/* Category circle with color based on category */}
      <Circle
        x={Gsrsm_HEADER_CIRCLE_RADIUS + 5}
        y={Gsrsm_HEADER_HEIGHT / 2}
        radius={Gsrsm_HEADER_CIRCLE_RADIUS}
        fill={category === 'A' ? '#FFFF00' : category === 'F' ? '#00FF00' : '#FF0000'} // Yellow for A, Green for F, Red for D
        stroke={'#000000'}
        strokeWidth={1}
      />

      {/* Category letter */}
      <Text
        text={category}
        x={5}
        y={Gsrsm_HEADER_HEIGHT / 2 - Gsrsm_HEADER_CIRCLE_RADIUS}
        width={Gsrsm_HEADER_CIRCLE_RADIUS * 2}
        height={Gsrsm_HEADER_CIRCLE_RADIUS * 2}
        fontSize={Gsrsm_HEADER_CIRCLE_RADIUS}
        fontStyle="bold"
        fill={'#000000'} // Black text for better visibility on colored circles
        align="center"
        verticalAlign="middle"
      />

      {/* Section title */}
      <Text
        text={title}
        x={Gsrsm_HEADER_CIRCLE_RADIUS * 2 + 10}
        y={8}
        width={width - (Gsrsm_HEADER_CIRCLE_RADIUS * 2 + 20)}
        height={Gsrsm_HEADER_HEIGHT - 16}
        fontSize={Gsrsm_SECTION_TITLE_FONT_SIZE}
        fontStyle="bold"
        fill={theme.text}
        align="left"
        verticalAlign="middle"
      />

      {/* Dotted grid lines - horizontal */}
      {Array.from({ length: Math.floor(height / 30) }).map((_, i) => (
        <Line
          key={`h-line-${i}`}
          points={[0, (i + 1) * 30 + Gsrsm_HEADER_HEIGHT, width, (i + 1) * 30 + Gsrsm_HEADER_HEIGHT]}
          stroke={theme.mode === 'light' ? '#cccccc' : '#444444'}
          strokeWidth={0.5}
          dash={[2, 4]}
        />
      ))}

      {/* Dotted grid lines - vertical */}
      {Array.from({ length: Math.floor(width / 30) }).map((_, i) => (
        <Line
          key={`v-line-${i}`}
          points={[(i + 1) * 30, Gsrsm_HEADER_HEIGHT, (i + 1) * 30, height]}
          stroke={theme.mode === 'light' ? '#cccccc' : '#444444'}
          strokeWidth={0.5}
          dash={[2, 4]}
        />
      ))}
    </Group>
  );
};

export default GsrsmSection;
