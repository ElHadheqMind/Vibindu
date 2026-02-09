import React, { useEffect } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { ActionBlock as ActionBlockType, Step } from '../../models/types';
import { useElementsStore } from '../../store/useElementsStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useTheme } from '../../context/ThemeContext';
import { useSimulationStore } from '../../store/useSimulationStore';





interface ActionBlockProps {
  actionBlock: ActionBlockType;
}

const ActionBlock: React.FC<ActionBlockProps> = ({ actionBlock }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { position, size, selected, label, condition, parentId, actionType: _actionType, qualifier = 'N', duration, variable, index = 0 } = actionBlock;

  const { setEditingActionId } = useEditorStore();
  const { theme } = useTheme();

  // Simulation State
  const { activeActionIds, isSimulating } = useSimulationStore();
  const isActive = activeActionIds.includes(actionBlock.id);


  // No longer need state for inline editing since we're using popups


  // Handle double click on label area
  const handleLabelDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // Trigger the new Action Modal manually
    setEditingActionId(actionBlock.id);
  };

  // Handle double click on condition area
  const handleConditionDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // Trigger the new Action Modal manually
    setEditingActionId(actionBlock.id);
  };

  // No longer need save handlers since we're using popups

  // Get parent step
  const parentStep = useElementsStore.getState().getElementById<Step>(parentId);

  // Get all actions for this step
  const stepActions = useElementsStore.getState().getStepActions(parentId);

  // Render connection line to parent step (only for the first action)
  const renderConnectionLine = () => {
    if (!parentStep) return null;

    // Get the actions before this one
    const actionsBefore = stepActions.filter(a => a.index < index);

    // Only show connection for the first action
    if (actionsBefore.length === 0) {
      // First action - connect to the parent step
      const distance = position.x - (parentStep.position.x + parentStep.size.width);

      return (
        <Line
          points={[0, size.height / 2, -distance, size.height / 2]}
          stroke={theme.text}
          strokeWidth={1}
        />
      );
    }

    // No connection line for subsequent actions
    return null;
  };



  // When the parent step moves, trigger reindexing of all actions
  useEffect(() => {
    if (parentStep && !selected) {
      // Only trigger if the parent step has moved significantly
      const idealY = parentStep.position.y;
      const dy = Math.abs(idealY - position.y);

      if (dy > 5) {
        // Reindex all actions for this step
        useElementsStore.getState().reindexStepActions(parentId);
      }
    }
  }, [parentId, parentStep, position.y, selected]);

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={false}
      onDblClick={handleLabelDblClick}
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

      {/* Connection line to parent step */}
      {renderConnectionLine()}

      {/* Qualifier box (left) */}
      <Rect
        width={20}
        height={size.height}
        stroke={theme.actionBlockBorder}
        strokeWidth={1}
        fill={theme.surface}
        cornerRadius={[2, 0, 0, 2]}
      />
      <Text
        text={qualifier}
        fontSize={12}
        fontStyle="bold"
        fill={theme.text}
        width={20}
        height={size.height}
        align="center"
        verticalAlign="middle"
      />

      {/* Action content box (right) */}
      <Rect
        x={20}
        width={size.width - 20}
        height={size.height}
        stroke={isActive && isSimulating ? "#16a34a" : theme.actionBlockBorder}
        strokeWidth={isActive && isSimulating ? 2 : 1}
        fill={isActive && isSimulating ? "#dcfce7" : theme.actionBlockBackground}
        cornerRadius={[0, 2, 2, 0]}
        shadowBlur={isActive && isSimulating ? 5 : 0}
        shadowColor="#16a34a"
      />



      {/* Action variable/label */}
      <Group onDblClick={handleLabelDblClick} x={20}>
        <Text
          text={variable || label || 'Action'}
          fontSize={14}
          fill={theme.text}
          width={size.width - 20}
          height={size.height}
          padding={5}
          align="center"
          verticalAlign="middle"
        />
        {/* Trigger/Duration display if applicable */}
        {(qualifier === 'L' || qualifier === 'D' || qualifier === 'SD' || qualifier === 'DS' || qualifier === 'SL' || qualifier === 'P') && duration && (
          <Text
            text={`t=${duration}`}
            fontSize={10}
            fill={theme.textSecondary}
            width={size.width - 20}
            y={size.height - 15}
            align="center"
          />
        )}
      </Group>

      {/* Condition (if present) */}
      {condition && (
        <>
          {/* Condition text above the action rectangle */}
          <Group
            x={size.width - 15}  /* Align with the vertical line */
            y={-35}
            onDblClick={handleConditionDblClick}
          >
            <Text
              text={condition || ''}
              fontSize={12}
              fontStyle="italic"
              fill={theme.text}
              width={100}
              height={20}
              align="center"
              verticalAlign="middle"
              x={-50} /* Center the text around the line position */
            />
          </Group>

          {/* Vertical line on the right between condition and action */}
          <Line
            points={[size.width - 15, -15, size.width - 15, 0]}
            stroke={theme.text}
            strokeWidth={1.5}
          />
        </>
      )}
    </Group>
  );
};

export default ActionBlock;
