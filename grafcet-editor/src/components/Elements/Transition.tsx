import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Transition as TransitionType } from '../../models/types';
import { useElementsStore } from '../../store/useElementsStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useTheme } from '../../context/ThemeContext';
import { useSimulationStore } from '../../store/useSimulationStore';



interface TransitionProps {
  transition: TransitionType;
}

const Transition: React.FC<TransitionProps> = ({ transition }) => {
  const { position, size, selected, condition, number } = transition;

  const { selectElement } = useElementsStore();
  const { currentTool } = useEditorStore();
  const { theme } = useTheme();

  // Simulation State
  const { activeTransitionIds, isSimulating } = useSimulationStore();
  const isFired = activeTransitionIds.includes(transition.id);

  // No longer need state for inline editing since we're using popups


  // Handle click for selection
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'select') {
      e.cancelBubble = true;
      selectElement(transition.id, e.evt.shiftKey || e.evt.ctrlKey);
    }
  };

  // Handle double click on condition text
  const handleConditionDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

    // Use popup instead of inline editing
    useEditorStore.getState().setEditingTransitionId(transition.id);
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={false}
      onClick={handleClick}
      onDblClick={handleConditionDblClick}
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

      {/* Connection point indicators - show fixed anchor points */}
      {(selected || currentTool === 'transition') && (
        <>
          {/* Top connection point (center-top) */}
          <Circle
            x={size.width / 2}
            y={0}
            radius={3}
            fill={theme.connectionAnchor || '#FF9800'}
            stroke={theme.transitionBackground}
            strokeWidth={1}
            opacity={0.8}
          />
          {/* Bottom connection point (center-bottom) */}
          <Circle
            x={size.width / 2}
            y={size.height}
            radius={3}
            fill={theme.connectionAnchor || '#FF9800'}
            stroke={theme.transitionBackground}
            strokeWidth={1}
            opacity={0.8}
          />
          {/* Visual indicator text for transitions */}
          {selected && (
            <>
              <Text
                x={size.width / 2}
                y={-10}
                text="IN"
                fontSize={7}
                fill={theme.connectionAnchor || '#FF9800'}
                align="center"
                fontStyle="bold"
              />
              <Text
                x={size.width / 2}
                y={size.height + 6}
                text="OUT"
                fontSize={7}
                fill={theme.connectionAnchor || '#FF9800'}
                align="center"
                fontStyle="bold"
              />
            </>
          )}
        </>
      )}

      {/* Transition bar */}
      <Rect
        width={size.width}
        height={size.height}
        fill={isFired && isSimulating ? "#16a34a" : theme.transitionBackground} // Green if fired
        shadowBlur={isFired && isSimulating ? 10 : 0}
        shadowColor="#16a34a"
      />

      {/* Condition text (on the right, centered vertically) */}
      <Group
        x={size.width + 8}
        y={(size.height / 2) - 7}
        onDblClick={handleConditionDblClick}
      >
        <Text
          text={condition || `T${number}`}
          fontSize={14}
          fontStyle={isFired && isSimulating ? "bold" : "bold"}
          fill={isFired && isSimulating ? "#16a34a" : theme.text}
          width={250}
          align="left"
        />
      </Group>
    </Group>
  );
};

export default Transition;
