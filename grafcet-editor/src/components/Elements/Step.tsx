import React, { useEffect, useState } from 'react';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
import { Step as StepType } from '../../models/types';
import { useElementsStore } from '../../store/useElementsStore';
import { useEditorStore } from '../../store/useEditorStore';
import { usePopupStore } from '../../store/usePopupStore';
import { useTheme } from '../../context/ThemeContext';

import { useSimulationStore } from '../../store/useSimulationStore';

interface StepProps {
  step: StepType;
}

const Step: React.FC<StepProps> = ({ step }) => {
  const { position, size, selected, stepType, number, label } = step;

  const { selectElement, updateElement } = useElementsStore();
  const { currentTool, setLastPlacedStepId } = useEditorStore();
  const { theme } = useTheme();

  // Simulation State
  const { activeStepIds, isSimulating } = useSimulationStore();
  const isActive = activeStepIds.includes(step.id);

  // Get the highlighted step ID from Canvas
  const highlightedStepId = useEditorStore((state) => state._highlightedStepId);
  const upConnectionStepSelection = useEditorStore((state) => state.upConnectionStepSelection);
  const isSelectedForUpConnection = upConnectionStepSelection.includes(step.id);

  // Animation state
  const [highlightOpacity, setHighlightOpacity] = useState(0.2);
  const [animationDirection, setAnimationDirection] = useState(1);

  // Highlight animation effect
  useEffect(() => {
    if (highlightedStepId === step.id) {
      const animationInterval = setInterval(() => {
        setHighlightOpacity(prev => {
          const newOpacity = prev + (0.05 * animationDirection);
          if (newOpacity >= 0.6) setAnimationDirection(-1);
          if (newOpacity <= 0.2) setAnimationDirection(1);
          return newOpacity;
        });
      }, 50);

      return () => clearInterval(animationInterval);
    } else {
      setHighlightOpacity(0.2);
      setAnimationDirection(1);
    }
  }, [highlightedStepId, step.id, animationDirection]);


  // Handle double click
  const handleDblClick = () => {
    // Use popup instead of browser prompt
    usePopupStore.getState().showPrompt(
      'Edit Step Label',
      `Enter label for Step ${number}:`,
      (newLabel) => {
        if (newLabel !== null) {
          updateElement(step.id, { label: newLabel });
        }
      },
      label,
      'Enter step label'
    );
  };

  // Render step based on type
  const renderStepShape = () => {
    switch (stepType) {
      case 'initial':
        // Double square for initial step
        return (
          <>
            <Rect
              width={size.width}
              height={size.height}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={isActive && isSimulating ? 3 : 2}
              fill={isActive && isSimulating ? "#dcfce7" : theme.stepBackground} // Light green for active
              shadowBlur={isActive && isSimulating ? 10 : 0}
              shadowColor="#16a34a"
            />
            <Rect
              x={4}
              y={4}
              width={size.width - 8}
              height={size.height - 8}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={isActive && isSimulating ? 2 : 2}
              fill={isActive && isSimulating ? "#dcfce7" : theme.stepBackground}
            />
          </>
        );

      case 'task':
        // Square with vertical lines for task step
        return (
          <>
            <Rect
              width={size.width}
              height={size.height}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={isActive && isSimulating ? 3 : 2}
              fill={isActive && isSimulating ? "#dcfce7" : theme.stepBackground}
              shadowBlur={isActive && isSimulating ? 10 : 0}
              shadowColor="#16a34a"
            />
            <Line
              points={[10, 0, 10, size.height]}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={2}
            />
            <Line
              points={[size.width - 10, 0, size.width - 10, size.height]}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={2}
            />
          </>
        );

      case 'macro':
        // Square with horizontal lines for macro step
        return (
          <>
            <Rect
              width={size.width}
              height={size.height}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={isActive && isSimulating ? 3 : 2}
              fill={isActive && isSimulating ? "#dcfce7" : theme.stepBackground}
              shadowBlur={isActive && isSimulating ? 10 : 0}
              shadowColor="#16a34a"
            />
            <Line
              points={[0, 10, size.width, 10]}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={2}
            />
            <Line
              points={[0, size.height - 10, size.width, size.height - 10]}
              stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
              strokeWidth={2}
            />
          </>
        );

      default:
        // Normal step
        return (
          <Rect
            width={size.width}
            height={size.height}
            stroke={isActive && isSimulating ? "#16a34a" : theme.stepBorder}
            strokeWidth={isActive && isSimulating ? 3 : 2}
            fill={isActive && isSimulating ? "#dcfce7" : theme.stepBackground}
            shadowBlur={isActive && isSimulating ? 10 : 0}
            shadowColor="#16a34a"
          />
        );
    }
  };

  // Handle click for guided mode
  const handleClick = (e: any) => {
    e.cancelBubble = true;

    // Handle Up Connection tool logic
    if (currentTool === 'up-connection') {
      const { upConnectionStepSelection, addUpConnectionStep, clearUpConnectionStepSelection, showToast } = useEditorStore.getState();
      const { addUpConnection } = useElementsStore.getState();

      if (upConnectionStepSelection.includes(step.id)) {
        showToast('Step already selected', 'warning');
        return;
      }

      const newSelection = [...upConnectionStepSelection, step.id];
      addUpConnectionStep(step.id);

      if (newSelection.length === 1) {
        showToast(`Step ${number} selected. Select another step to complete the up connection.`, 'info');
      } else if (newSelection.length === 2) {
        addUpConnection(newSelection[0], newSelection[1]);
        clearUpConnectionStepSelection();
      }

      // Visual feedback
      setHighlightOpacity(0.5);
      setTimeout(() => setHighlightOpacity(0.2), 500);
      return;
    }

    // In guided mode (now default), set this as the last placed step to show suggestions
    // regardless of the current tool
    selectElement(step.id);
    setLastPlacedStepId(step.id);

    // Reset active steps in GuidedPositions component
    // We need to access the component's state through a custom event
    const event = new CustomEvent('resetActiveSteps', {
      detail: { stepId: step.id, step: step }
    });
    window.dispatchEvent(event);

    // Add a pulsing animation effect
    setHighlightOpacity(0.5);
    setTimeout(() => {
      setHighlightOpacity(0.2);
    }, 500);

    useEditorStore.getState().showToast(`Selected step ${number}. Showing available positions.`);
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={false}
      onDblClick={handleDblClick}
      onClick={handleClick}
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

      {/* Up Connection selection highlight */}
      {isSelectedForUpConnection && (
        <Rect
          x={-5}
          y={-5}
          width={size.width + 10}
          height={size.height + 10}
          stroke={theme.primary}
          strokeWidth={3}
          cornerRadius={8}
          dash={[10, 5]}
          opacity={0.8}
        />
      )}

      {/* Connection point indicators - show fixed anchor points */}
      {(selected || currentTool === 'transition') && (
        <>
          {/* Top connection point (center-top) */}
          <Circle
            x={size.width / 2}
            y={0}
            radius={4}
            fill={theme.connectionAnchor || '#4CAF50'}
            stroke={theme.stepBorder}
            strokeWidth={1}
            opacity={0.8}
          />
          {/* Bottom connection point (center-bottom) */}
          <Circle
            x={size.width / 2}
            y={size.height}
            radius={4}
            fill={theme.connectionAnchor || '#4CAF50'}
            stroke={theme.stepBorder}
            strokeWidth={1}
            opacity={0.8}
          />
          {/* Visual indicator text */}
          {selected && (
            <>
              <Text
                x={size.width / 2}
                y={-12}
                text="IN"
                fontSize={8}
                fill={theme.connectionAnchor || '#4CAF50'}
                align="center"
                fontStyle="bold"
              />
              <Text
                x={size.width / 2}
                y={size.height + 8}
                text="OUT"
                fontSize={8}
                fill={theme.connectionAnchor || '#4CAF50'}
                align="center"
                fontStyle="bold"
              />
            </>
          )}
        </>
      )}

      {/* Highlight effect for selected transition step */}
      {highlightedStepId === step.id && (
        <Rect
          x={-5}
          y={-5}
          width={size.width + 10}
          height={size.height + 10}
          stroke={theme.primary}
          strokeWidth={2}
          fill={theme.primary}
          cornerRadius={6}
          opacity={highlightOpacity}
        />
      )}

      {/* Step shape */}
      {renderStepShape()}

      {/* Step number */}
      <Text
        text={number.toString()}
        fontSize={16}
        fontStyle="bold"
        fill={theme.text}
        width={size.width}
        height={size.height}
        align="center"
        verticalAlign="middle"
      />

      {/* Simulation Token (Activity Indicator) */}
      {(isSimulating && isActive) && (
        <Circle
          x={size.width / 2}
          y={size.height / 2 + 12} // Below the number
          radius={4}
          fill="#22c55e" // Green-500
          stroke="#15803d" // Green-700
          strokeWidth={1}
          shadowColor="black"
          shadowBlur={2}
          shadowOpacity={0.3}
        />
      )}

      {/* Step label (below the step) */}
      {label && label !== `Step ${number}` && (
        <Text
          y={size.height + 5}
          text={label}
          fontSize={12}
          fill={theme.text}
          width={size.width}
          align="center"
        />
      )}
    </Group>
  );
};

export default Step;
