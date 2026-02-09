import React from 'react';
import styled from 'styled-components';
import { FiZoomIn, FiZoomOut, FiGrid, FiInfo, FiLayers, FiMousePointer, FiTarget, FiMove, FiTrash2, FiCornerLeftUp } from 'react-icons/fi';
import { useEditorStore } from '../../store/useEditorStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Tool } from '../../models/types';


const StatusBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  background-color: ${props => props.theme.surfaceRaised};
  border-top: 1px solid ${props => props.theme.border};
  padding: 0 16px;
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  box-shadow: 0 -1px 3px ${props => props.theme.shadowLight};
  z-index: 1000;
  position: relative;
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color ${props => props.theme.transition.fast};
  
  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    color: ${props => props.theme.text};
  }
  
  &:active {
    transform: ${props => props.theme.scale.active};
  }
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ZoomValue = styled.div`
  min-width: 40px;
  text-align: center;
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background-color: ${props => props.theme.divider};
  margin: 0 8px;
`;

const ToolButton = styled.button<{ $active: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid ${props => {
    if (props.$disabled) return props.theme.borderLight;
    return props.$active ? props.theme.primary : 'transparent';
  }};
  border-radius: 4px;
  background-color: ${props => {
    if (props.$disabled) return props.theme.surfaceAlt;
    return props.$active ? props.theme.primaryLight : 'transparent';
  }};
  color: ${props => {
    if (props.$disabled) return props.theme.textTertiary;
    return props.$active ? props.theme.primary : props.theme.textSecondary;
  }};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${props => props.theme.transition.fast};
  
  &:hover {
    background-color: ${props => {
    if (props.$disabled) return props.theme.surfaceAlt;
    return props.$active ? props.theme.primaryLight : props.theme.surfaceAlt;
  }};
    color: ${props => {
    if (props.$disabled) return props.theme.textTertiary;
    return props.$active ? props.theme.primary : props.theme.text;
  }};
  }

  &:focus {
    outline: none;
  }
`;

const StatusBar: React.FC = () => {
  const {
    scale,
    snapToGrid,
    zoomIn,
    zoomOut,
    toggleSnapToGrid,
    currentTool,
    setCurrentTool,
    guidedModeActive,
    toggleGuidedMode
  } = useEditorStore();
  const { elements } = useElementsStore();
  const { getCurrentDiagram } = useProjectStore();

  const currentDiagram = getCurrentDiagram();

  // Count elements by type
  const stepCount = elements.filter(e => e.type === 'step').length;
  const transitionCount = elements.filter(e => e.type === 'transition').length;
  const connectionCount = elements.filter(e => e.type === 'connection').length;

  // Format zoom percentage
  const zoomPercentage = Math.round(scale * 100);

  const selectionTools = [
    { id: 'select' as Tool, icon: <FiMousePointer />, title: 'Select' },
    { id: 'guided-mode', icon: <FiTarget />, title: 'Guided Mode', isToggle: true },
    { id: 'hand' as Tool, icon: <FiMove />, title: 'Pan (Or Middle Click)' },
    { id: 'delete' as Tool, icon: <FiTrash2 />, title: 'Delete' },
    { id: 'up-connection' as Tool, icon: <FiCornerLeftUp />, title: 'Up Connection' },
  ];

  return (
    <StatusBarContainer>
      <StatusGroup>
        <StatusItem>
          <FiLayers size={12} />
          <span>Elements: {elements.length}</span>
        </StatusItem>

        <Divider />

        <StatusItem>
          <span>Steps: {stepCount}</span>
        </StatusItem>

        <StatusItem>
          <span>Transitions: {transitionCount}</span>
        </StatusItem>

        <StatusItem>
          <span>Connections: {connectionCount}</span>
        </StatusItem>
      </StatusGroup>

      <StatusGroup>
        {selectionTools.map((tool) => {
          const isActive = tool.isToggle ? guidedModeActive : currentTool === tool.id;
          return (
            <ToolButton
              key={tool.id}
              $active={isActive}
              onClick={() => {
                if (tool.id === 'guided-mode') {
                  toggleGuidedMode();
                  // If turning on, also select step tool to start building
                  if (!guidedModeActive) {
                    setCurrentTool('step');
                    useEditorStore.getState().showToast('Guided Mode Active - Click to place first step', 'success');
                  } else {
                    setCurrentTool('select');
                  }
                  return;
                }

                if (tool.id === 'delete') {
                  const selectedCount = useElementsStore.getState().selectedElementIds.length;
                  if (selectedCount > 0) {
                    useElementsStore.getState().deleteSelectedElements();
                    useEditorStore.getState().showToast(`Deleted ${selectedCount} element(s)`, 'info');
                    return;
                  }
                }
                if (tool.id !== 'up-connection') {
                  useEditorStore.getState().clearUpConnectionStepSelection();
                } else {
                  useEditorStore.getState().showToast('Select two steps to create an up connection', 'info');
                }
                setCurrentTool(tool.id as Tool);
              }}
              title={tool.title}
            >
              {tool.icon}
              <span>{tool.title}</span>
            </ToolButton>
          );
        })}
      </StatusGroup>

      <StatusGroup>
        {currentDiagram && (
          <>
            <StatusItem>
              <FiInfo size={12} />
              <span>
                {currentDiagram.name}
              </span>
            </StatusItem>
            <Divider />
          </>
        )}

        <StatusItem>
          <ActionButton
            onClick={toggleSnapToGrid}
            title={snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap'}
          >
            <FiGrid size={14} color={snapToGrid ? undefined : '#aaa'} />
          </ActionButton>
          <span>Grid: {snapToGrid ? 'On' : 'Off'}</span>
        </StatusItem>

        <Divider />

        <ZoomControls>
          <ActionButton onClick={zoomOut} title="Zoom Out">
            <FiZoomOut size={14} />
          </ActionButton>

          <ZoomValue>{zoomPercentage}%</ZoomValue>

          <ActionButton onClick={zoomIn} title="Zoom In">
            <FiZoomIn size={14} />
          </ActionButton>
        </ZoomControls>
      </StatusGroup>
    </StatusBarContainer>
  );
};

export default StatusBar;
