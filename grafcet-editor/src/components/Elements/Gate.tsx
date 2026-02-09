import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import { Gate as GateType } from '../../models/types';
import { useElementsStore } from '../../store/useElementsStore';
import { useTheme } from '../../context/ThemeContext';

interface GateProps {
  gate: GateType;
}

const Gate: React.FC<GateProps> = ({ gate }) => {
  const { position, size, selected, type } = gate;

  const { updateElement } = useElementsStore();
  const { theme } = useTheme();



  // Handle double click
  const handleDblClick = () => {
    // Toggle gate type on double click
    const newType = type === 'and-gate' ? 'or-gate' : 'and-gate';
    updateElement(gate.id, { type: newType });
  };

  // Render gate based on type
  const renderGate = () => {
    if (type === 'and-gate') {
      // Double horizontal line for AND gate (parallel lines)
      return (
        <>
          <Line
            points={[0, size.height / 2 - 2, size.width, size.height / 2 - 2]}
            stroke={theme.stepBorder}
            strokeWidth={2}
          />
          <Line
            points={[0, size.height / 2 + 2, size.width, size.height / 2 + 2]}
            stroke={theme.stepBorder}
            strokeWidth={2}
          />
        </>
      );
    } else {
      // Single horizontal line for OR gate
      return (
        <Line
          points={[0, size.height / 2, size.width, size.height / 2]}
          stroke={theme.stepBorder}
          strokeWidth={2}
        />
      );
    }
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={false}
      onDblClick={handleDblClick}
      onMouseEnter={() => {
        // No longer draggable
      }}
      onMouseLeave={() => {
        // No longer draggable
      }}
    >
      {/* Selection indicator */}
      {selected && (
        <Rect
          x={-2}
          y={-2}
          width={size.width + 4}
          height={size.height + 4}
          stroke={theme.selectionBorder}
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* Gate shape */}
      {renderGate()}
    </Group>
  );
};

export default Gate;
