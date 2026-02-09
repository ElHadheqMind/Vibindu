import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import { useEditorStore } from '../../store/useEditorStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useTheme } from '../../context/ThemeContext';
import { GrafcetElement, Point, Step, Transition, ActionBlock } from '../../models/types';

const DragPreview: React.FC = () => {
  const { dragState, scale, snapToGridPoint } = useEditorStore();
  const { getElementById } = useElementsStore();
  const { theme } = useTheme();

  if (!dragState.isDragging || !dragState.showDragPreview || !dragState.dragCurrentPosition) {
    return null;
  }

  const renderElementPreview = (element: GrafcetElement, position: Point, opacity: number = 0.5) => {
    const size = 'size' in element ? element.size : null;
    if (!size) return null;

    switch (element.type) {
      case 'step': {
        const step = element as Step;
        return (
          <Group key={element.id} x={position.x} y={position.y} opacity={opacity}>
            {/* Step circle */}
            <Circle
              x={size.width / 2}
              y={size.height / 2}
              radius={size.width / 2}
              fill="transparent"
              stroke={theme.primary}
              strokeWidth={2 / scale}
              dash={[4 / scale, 4 / scale]}
            />
            
            {/* Step number */}
            <Text
              x={0}
              y={size.height / 2 - 6}
              width={size.width}
              text={step.number?.toString() || ''}
              fontSize={12 / scale}
              fill={theme.primary}
              align="center"
              listening={false}
            />
          </Group>
        );
      }

      case 'transition': {
        const transition = element as Transition;
        return (
          <Group key={element.id} x={position.x} y={position.y} opacity={opacity}>
            {/* Transition rectangle */}
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fill="transparent"
              stroke={theme.primary}
              strokeWidth={2 / scale}
              dash={[4 / scale, 4 / scale]}
            />
            
            {/* Transition condition */}
            <Text
              x={0}
              y={size.height / 2 - 6}
              width={size.width}
              text={transition.condition || ''}
              fontSize={10 / scale}
              fill={theme.primary}
              align="center"
              listening={false}
            />
          </Group>
        );
      }

      case 'action-block': {
        const actionBlock = element as ActionBlock;
        return (
          <Group key={element.id} x={position.x} y={position.y} opacity={opacity}>
            {/* Action block rectangle */}
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fill="transparent"
              stroke={theme.primary}
              strokeWidth={2 / scale}
              dash={[4 / scale, 4 / scale]}
            />
            
            {/* Action label */}
            <Text
              x={4}
              y={size.height / 2 - 6}
              width={size.width - 8}
              text={actionBlock.label || ''}
              fontSize={10 / scale}
              fill={theme.primary}
              align="center"
              listening={false}
            />
          </Group>
        );
      }

      case 'and-gate':
      case 'or-gate': {
        return (
          <Group key={element.id} x={position.x} y={position.y} opacity={opacity}>
            {/* Gate lines */}
            {element.type === 'and-gate' ? (
              // AND gate - double lines
              <>
                <Rect
                  x={0}
                  y={size.height / 2 - 2}
                  width={size.width}
                  height={1}
                  fill={theme.primary}
                />
                <Rect
                  x={0}
                  y={size.height / 2 + 1}
                  width={size.width}
                  height={1}
                  fill={theme.primary}
                />
              </>
            ) : (
              // OR gate - single line
              <Rect
                x={0}
                y={size.height / 2}
                width={size.width}
                height={1}
                fill={theme.primary}
              />
            )}
          </Group>
        );
      }

      default:
        return (
          <Rect
            key={element.id}
            x={position.x}
            y={position.y}
            width={size.width}
            height={size.height}
            fill="transparent"
            stroke={theme.primary}
            strokeWidth={2 / scale}
            dash={[4 / scale, 4 / scale]}
            opacity={opacity}
          />
        );
    }
  };

  // Calculate preview positions for all dragged elements
  const previewElements = dragState.draggedElementIds.map(id => {
    const element = getElementById(id);
    if (!element) return null;

    // Calculate the new position based on drag delta
    const startPos = dragState.dragStartPosition;
    const currentPos = dragState.dragCurrentPosition;
    
    if (!startPos || !currentPos) return null;

    const delta = {
      x: currentPos.x - startPos.x,
      y: currentPos.y - startPos.y,
    };

    // Apply constraints
    let constrainedDelta = delta;
    if (dragState.constrainToAxis === 'horizontal') {
      constrainedDelta = { x: delta.x, y: 0 };
    } else if (dragState.constrainToAxis === 'vertical') {
      constrainedDelta = { x: 0, y: delta.y };
    }

    const previewPosition = {
      x: element.position.x + constrainedDelta.x,
      y: element.position.y + constrainedDelta.y,
    };

    return {
      element,
      position: snapToGridPoint(previewPosition),
    };
  }).filter(Boolean);

  return (
    <Group>
      {/* Render preview elements */}
      {previewElements.map(item => 
        item ? renderElementPreview(item.element, item.position, 0.6) : null
      )}

      {/* Snap indicators */}
      {dragState.snapIndicators.map((snapPoint, index) => (
        <Group key={index}>
          {/* Snap point indicator */}
          <Circle
            x={snapPoint.x}
            y={snapPoint.y}
            radius={3 / scale}
            fill={theme.primary}
            opacity={0.8}
          />
          
          {/* Snap lines */}
          <Rect
            x={snapPoint.x - 10 / scale}
            y={snapPoint.y - 0.5 / scale}
            width={20 / scale}
            height={1 / scale}
            fill={theme.primary}
            opacity={0.6}
          />
          <Rect
            x={snapPoint.x - 0.5 / scale}
            y={snapPoint.y - 10 / scale}
            width={1 / scale}
            height={20 / scale}
            fill={theme.primary}
            opacity={0.6}
          />
        </Group>
      ))}

      {/* Constraint indicator */}
      {dragState.constrainToAxis !== 'none' && dragState.dragStartPosition && (
        <Group>
          <Text
            x={dragState.dragStartPosition.x + 20 / scale}
            y={dragState.dragStartPosition.y - 20 / scale}
            text={dragState.constrainToAxis === 'horizontal' ? '↔' : '↕'}
            fontSize={16 / scale}
            fill={theme.primary}
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
};

export default DragPreview;
