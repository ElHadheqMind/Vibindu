import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useProjectStore } from '../../store/useProjectStore';
import { SimulationService } from '../../services/simulationService';
import { FaPlay, FaStop, FaRedo, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

// Styled similar to PropertiesPanel to look consistent but on the left
const PanelContainer = styled.div.attrs<{ $left: number, $top: number }>(props => ({
  style: {
    left: props.$left,
    top: props.$top
  }
})) <{ $left: number, $top: number }>`
  position: absolute;
  width: 280px;
  max-height: calc(100% - 40px);
  background-color: ${props => props.theme.surfaceRaised};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  box-shadow: 2px 2px 8px ${props => props.theme.shadow};
  padding: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  user-select: none;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme.divider};
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.text};
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      display: block;
      width: 4px;
      height: 16px;
      background-color: ${props => props.theme.success};
      border-radius: 2px;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.textSecondary};
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    color: ${props => props.theme.text};
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  transition: all 0.2s;

  background-color: ${props => {
    switch (props.$variant) {
      case 'primary': return props.theme.success;
      case 'danger': return props.theme.error;
      default: return props.theme.secondary;
    }
  }};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SectionTitle = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  letter-spacing: 0.5px;
`;

const AddVarButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme.primary}15;
  }
`;

const VariablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 200px;
  margin-bottom: 16px;
  padding-right: 4px;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.border};
    border-radius: 4px;
  }
`;

const VariableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${props => props.theme.primary}50;
  }
`;

const VarNameGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const VarName = styled.span`
  font-weight: 600;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: ${props => props.theme.text};
`;

const VarType = styled.span`
  font-size: 10px;
  color: ${props => props.theme.textTertiary};
`;

const VarControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Modern Toggle Switch
const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.theme.secondaryLight};
    transition: .3s;
    border-radius: 18px;
  }

  span:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  input:checked + span {
    background-color: ${props => props.theme.success};
  }

  input:checked + span:before {
    transform: translateX(14px);
  }
`;

const NumberInput = styled.input`
  width: 60px;
  padding: 4px 6px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 12px;
  text-align: right;
  background-color: ${props => props.theme.surfaceAlt};
  color: ${props => props.theme.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textTertiary};
  cursor: pointer;
  padding: 4px;
  display: flex;
  
  &:hover {
    color: ${props => props.theme.error};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 16px;
  color: ${props => props.theme.textTertiary};
  font-size: 12px;
  font-style: italic;
  background-color: ${props => props.theme.surface}50;
  border-radius: 6px;
  border: 1px dashed ${props => props.theme.border};
`;

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const ActionBadge = styled.div`
  padding: 6px 10px;
  background-color: ${props => props.theme.primary}15;
  border-left: 3px solid ${props => props.theme.primary};
  color: ${props => props.theme.primary};
  font-size: 12px;
  font-weight: 500;
  border-radius: 0 4px 4px 0;
`;

const SimulationPanel: React.FC = () => {
  const { t } = useLanguage();
  const {
    isSimulating,
    activeStepIds,
    variables,
    variableValues,
    addVariable,
    updateVariableValue,
    startSimulation,
    stopSimulation,
    setActiveSteps,
    setActiveTransitions,
    setActiveActions,
    deleteVariable,
    toggleSimulationPanel
  } = useSimulationStore();

  const { elements } = useElementsStore();
  const currentProject = useProjectStore(state => state.projects.find(p => p.id === state.currentProjectId));
  const [activeActionsDisplay, setActiveActionsDisplay] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load simulation data when panel mounts or project changes
  useEffect(() => {
    if (currentProject?.localPath) {
      console.log('[SimulationPanel] 🔄 Loading simulation data for project:', currentProject.localPath);
      useSimulationStore.getState().loadSimulation(currentProject.localPath);
    }
  }, [currentProject?.localPath]);

  // Draggable state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 60 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Simulation loop
  useEffect(() => {
    let intervalId: any;

    if (isSimulating) {
      intervalId = setInterval(() => {
        try {
          const {
            nextActiveStepIds,
            firedTransitionIds,
            nextStepActivationTimes
          } = SimulationService.evaluate(
            elements,
            activeStepIds,
            variableValues,
            variables,
            useSimulationStore.getState().stepActivationTimes,
            useSimulationStore.getState().prevVariableValues
          );

          const stepsChanged = nextActiveStepIds.length !== activeStepIds.length ||
            !nextActiveStepIds.every(id => activeStepIds.includes(id));

          // Always update to catch transition flashes
          if (stepsChanged || firedTransitionIds.length > 0) {
            setActiveSteps(nextActiveStepIds);
            setActiveTransitions(firedTransitionIds);
            useSimulationStore.getState().setStepActivationTimes(nextStepActivationTimes);

            // Clear fired transitions after a short delay for visual effect
            if (firedTransitionIds.length > 0) {
              setTimeout(() => setActiveTransitions([]), 200);
            }
          }

          // Sync current variables to prev for next cycle (Reason: RE/FE logic needs history)
          useSimulationStore.getState().updatePrevVariableValues();

          setError(null);
        } catch (e) {
          console.error("Simulation error", e);
          setError("Simulation Error");
          stopSimulation();
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSimulating, activeStepIds, variableValues, variables, elements, setActiveSteps, setActiveTransitions]);

  // Update active actions list for display & store active actions
  useEffect(() => {
    const actions: string[] = [];
    const actionIds: string[] = [];

    if (activeStepIds.length > 0) {
      const actionBlocks = elements.filter(e =>
        e.type === 'action-block' && activeStepIds.includes((e as any).parentId)
      );
      actionBlocks.forEach((ab: any) => {
        // Display text
        const name = ab.variable || ab.label || '?';
        actions.push(`${ab.actionType} ${name}`);

        // Store ID for canvas highlighting
        actionIds.push(ab.id);
      });
    }

    setActiveActionsDisplay(actions);
    setActiveActions(actionIds);

  }, [activeStepIds, elements, setActiveActions]);


  const handleStart = () => {
    const initialSteps = elements.filter(e => e.type === 'step' && (e as any).stepType === 'initial');
    const initialStepIds = initialSteps.map(s => s.id);

    if (initialStepIds.length === 0) {
      const firstStep = elements.find(e => e.type === 'step' && (e as any).number === 1);
      if (firstStep) initialStepIds.push(firstStep.id);
    }

    if (initialStepIds.length === 0) {
      setError("No initial step found");
      return;
    }

    startSimulation(initialStepIds);
    setError(null);
  };

  const handleStop = () => {
    stopSimulation();
  };

  const handleReset = () => {
    stopSimulation();
    setError(null);
  };

  const promptAddVariable = () => {
    const isBool = window.confirm("Add Boolean Variable?\nOK = Boolean\nCancel = Integer");

    setTimeout(() => {
      const name = prompt("Variable Name:", "Var" + (variables.length + 1));
      if (name) {
        if (variables.some(v => v.name === name)) {
          alert("Variable already exists!");
          return;
        }
        addVariable({
          name,
          type: isBool ? 'boolean' : 'integer',
          description: ''
        });
      }
    }, 50);
  };

  return (
    <PanelContainer $left={position.x} $top={position.y}>
      <Header onMouseDown={handleMouseDown}>
        <h3>Simulation</h3>
        <CloseButton onClick={toggleSimulationPanel} title="Close Panel">
          <FaTimes />
        </CloseButton>
      </Header>

      <Controls>
        {!isSimulating ? (
          <ControlButton $variant="primary" onClick={handleStart}>
            <FaPlay /> Run
          </ControlButton>
        ) : (
          <ControlButton $variant="danger" onClick={handleStop}>
            <FaStop /> Stop
          </ControlButton>
        )}
        <ControlButton $variant="secondary" onClick={handleReset} disabled={!isSimulating}>
          <FaRedo /> Reset
        </ControlButton>
      </Controls>

      {error && <div style={{ color: '#ef4444', fontSize: '11px', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

      <SectionTitle>
        Variables
        <AddVarButton onClick={promptAddVariable}>
          <FaPlus size={10} /> Add
        </AddVarButton>
      </SectionTitle>

      <VariablesList>
        {variables.length === 0 ? (
          <EmptyState>No variables</EmptyState>
        ) : (
          variables.map(variable => (
            <VariableRow key={variable.id}>
              <VarNameGroup>
                <VarName>{variable.name}</VarName>
                <VarType>{variable.type}</VarType>
              </VarNameGroup>

              <VarControls>
                {variable.type === 'boolean' ? (
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={!!variableValues[variable.id]}
                      onChange={(e) => updateVariableValue(variable.id, e.target.checked)}
                    />
                    <span />
                  </ToggleSwitch>
                ) : (
                  <NumberInput
                    type="number"
                    value={variableValues[variable.id] as number || 0}
                    onChange={(e) => updateVariableValue(variable.id, parseFloat(e.target.value) || 0)}
                  />
                )}
                <DeleteBtn onClick={() => deleteVariable(variable.id)}>
                  <FaTrash size={10} />
                </DeleteBtn>
              </VarControls>
            </VariableRow>
          ))
        )}
      </VariablesList>

      <SectionTitle>Active Actions</SectionTitle>
      <ActionsList>
        {activeActionsDisplay.length === 0 ? (
          <EmptyState>None active</EmptyState>
        ) : (
          activeActionsDisplay.map((action, idx) => (
            <ActionBadge key={idx}>
              {action}
            </ActionBadge>
          ))
        )}
      </ActionsList>

    </PanelContainer>
  );
};

export default SimulationPanel;
