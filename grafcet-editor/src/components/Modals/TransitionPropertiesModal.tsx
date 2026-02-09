import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiX, FiClock, FiActivity } from 'react-icons/fi';
import { useElementsStore } from '../../store/useElementsStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Transition } from '../../models/types';
import VisualExpressionInput, { VisualExpressionInputHandle } from '../UI/VisualExpressionInput';
import { Token } from '../../utils/expressionParser';
import ComparisonBuilder from './ComparisonBuilder';
import TimerBuilder from './TimerBuilder';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${props => props.theme.surfaceRaised};
  border-radius: 8px;
  width: 800px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  font-size: 20px;
  &:hover { color: ${props => props.theme.text}; }
`;

const ContentLayout = styled.div`
    display: flex;
    height: 400px;
`;

const Sidebar = styled.div`
    width: 250px;
    border-right: 1px solid ${props => props.theme.border};
    padding: 12px;
    overflow-y: auto;
    background: ${props => props.theme.surfaceAlt};
`;

const MainArea = styled.div`
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
`;

const SectionTitle = styled.h3`
    font-size: 12px;
    text-transform: uppercase;
    color: ${props => props.theme.textSecondary};
    margin: 16px 0 8px 0;
    &:first-child { margin-top: 0; }
`;

const VariableItem = styled.div`
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    &:hover {
        background: ${props => props.theme.surface};
    }
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const LinkButton = styled.button`
    background: none;
    border: none;
    color: ${props => props.theme.primary};
    font-size: 11px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;

    &:hover {
        color: ${props => props.theme.primaryDark};
    }
`;

const VarBadge = styled.span`
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 3px;
    background: ${props => props.theme.border};
`;

const ConfigPanel = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${props => props.theme.border};
    animation: fadeIn 0.2s;
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  padding-right: 8px;
  border-right: 1px solid ${props => props.theme.border};
  
  &:last-child {
    border-right: none;
  }
`;

const ToolButton = styled.button`
  padding: 4px 8px;
  font-size: 12px;
  background-color: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  color: ${props => props.theme.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    border-color: ${props => props.theme.primary};
  }
`;

const Footer = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.$primary ? props.theme.primary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.text};
  border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.border};
  cursor: pointer;
  font-weight: 500;
  &:hover {
    background-color: ${props => props.$primary ? props.theme.primaryDark : props.theme.surfaceAlt};
  }
`;

interface TransitionPropertiesModalProps {
  transitionId: string;
  onClose: () => void;
}

const TransitionPropertiesModal: React.FC<TransitionPropertiesModalProps> = ({ transitionId, onClose }) => {
  const { getElementById, updateElement, elements } = useElementsStore();
  const { variables } = useSimulationStore();
  const transition = getElementById<Transition>(transitionId);

  const [condition, setCondition] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const visualInputRef = useRef<VisualExpressionInputHandle>(null);

  const [activeBuilder, setActiveBuilder] = useState<'none' | 'comparison' | 'timer'>('none');
  const [builderInitialValue, setBuilderInitialValue] = useState('');

  useEffect(() => {
    if (transition) {
      setCondition(transition.condition || '');
    }
  }, [transition]);

  if (!transition) return null;

  const handleSave = () => {
    updateElement(transitionId, {
      condition: condition || undefined,
    });
    onClose();
  };


  const insertText = (text: string) => {
    // visualInputRef.current?.insertToken(text);
    // Wait, insertToken parses the text.
    if (visualInputRef.current) {
      visualInputRef.current.insertToken(text);
    }
  };

  const handleToggleInversion = () => {
    visualInputRef.current?.toggleInversion();
  };

  const handleDelete = () => {
    visualInputRef.current?.deleteSelected();
  };

  const handleOpenTimerBuilder = () => {
    setBuilderInitialValue('');
    setActiveBuilder('timer');
  };

  const handleVariableClick = (variable: any) => {
    if (variable.type === 'boolean') {
      insertText(variable.name);
    } else {
      // Open comparison builder
      setBuilderInitialValue(`${variable.name} > 0`);
      setActiveBuilder('comparison');
    }
  };

  const handleBuilderSave = (value: string) => {
    insertText(value);
    setActiveBuilder('none');
  };

  const booleanVars = variables.filter(v => v.type === 'boolean');
  const numericVars = variables.filter(v => v.type !== 'boolean');

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Edit Transition T{transition.number}</Title>
          <CloseButton onClick={onClose}><FiX /></CloseButton>
        </Header>

        <ContentLayout>
          <Sidebar>
            <SidebarHeader>
              <SectionTitle style={{ margin: 0 }}>Variables</SectionTitle>
              <LinkButton onClick={() => useSimulationStore.getState().setSimulationModalOpen(true)}>
                Manage...
              </LinkButton>
            </SidebarHeader>

            <SectionTitle>Boolean Variables</SectionTitle>
            {booleanVars.map(v => (
              <VariableItem key={v.id} onClick={() => handleVariableClick(v)}>
                {v.name} <VarBadge>BOOL</VarBadge>
              </VariableItem>
            ))}

            <SectionTitle>Numeric Variables</SectionTitle>
            {numericVars.map(v => (
              <VariableItem key={v.id} onClick={() => handleVariableClick(v)}>
                {v.name} <VarBadge>{v.type === 'integer' ? 'INT' : 'REAL'}</VarBadge>
              </VariableItem>
            ))}
          </Sidebar>

          <MainArea>
            <Field>
              <Label>Condition Editor</Label>
              <Toolbar>
                <ToolbarGroup>
                  <ToolButton onClick={() => insertText('.')} title="AND">.</ToolButton>
                  <ToolButton onClick={() => insertText('+')} title="OR">+</ToolButton>
                  <ToolButton onClick={handleToggleInversion} title="Toggle NOT (Overbar)">
                    <span style={{ textDecoration: 'overline' }}>A</span>
                  </ToolButton>
                  <ToolButton onClick={() => insertText('(')}>(</ToolButton>
                  <ToolButton onClick={() => insertText(')')}>)</ToolButton>
                </ToolbarGroup>
                <ToolbarGroup>
                  <ToolButton onClick={() => insertText('RE')} title="Rising Edge"><FiActivity /> RE</ToolButton>
                  <ToolButton onClick={() => insertText('FE')} title="Falling Edge"><FiActivity style={{ transform: 'scaleY(-1)' }} /> FE</ToolButton>
                </ToolbarGroup>
                <ToolbarGroup>
                  <ToolButton onClick={handleOpenTimerBuilder} title="Insert Timer"><FiClock /> Timer</ToolButton>
                </ToolbarGroup>
                <ToolbarGroup>
                  <ToolButton onClick={handleDelete} title="Delete Selected">Del</ToolButton>
                </ToolbarGroup>
              </Toolbar>
              <VisualExpressionInput
                ref={visualInputRef}
                value={condition}
                onChange={setCondition}
                onSelectionChange={(token) => {
                  setSelectedToken(token);
                  if (token && token.type === 'comparison') {
                    setBuilderInitialValue(token.value);
                    setActiveBuilder('comparison');
                  } else if (token && token.type === 'timer') {
                    setBuilderInitialValue(token.value);
                    setActiveBuilder('timer');
                  } else {
                    // Don't auto-close if we are just moving cursor, but maybe we should?
                    // User complains popup disappears. 
                    // Let's keep it open only if explicitly editing, OR if we select a relevant token.
                    // If we click empty space, token is null.
                    // If token is null, we should probably close builder unless it was just opened for *new* insertion.
                    // But handleOpenTimerBuilder sets activeBuilder. 
                    // We need to be careful not to override that immediately if selection changes due to focus loss.
                    // VisualExpressionInput manages selection internally.
                    if (token === null && activeBuilder !== 'none' && !builderInitialValue) {
                      // If we opened a NEW builder (empty initial), keep it? 
                      // Or just rely on user explicit close?
                      // Let's NOT auto-close strictly on null selection unless we want to.
                      // But user says "disappears without doing anything". 
                      // This implies selection change logic is flaky.
                      // Let's only switch builder if we select a *different* valid token.
                    } else if (token === null) {
                      setActiveBuilder('none');
                    }
                  }
                }}
              />
            </Field>

            {activeBuilder === 'comparison' && (
              <ConfigPanel>
                <ComparisonBuilder
                  initialValue={builderInitialValue}
                  onSave={handleBuilderSave}
                  onCancel={() => setActiveBuilder('none')}
                />
              </ConfigPanel>
            )}
            {activeBuilder === 'timer' && (
              <ConfigPanel>
                <TimerBuilder
                  initialValue={builderInitialValue}
                  onSave={handleBuilderSave}
                  onCancel={() => setActiveBuilder('none')}
                />
              </ConfigPanel>
            )}
          </MainArea>
        </ContentLayout>

        <Footer>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={handleSave}>Confirm</Button>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

export default TransitionPropertiesModal;
