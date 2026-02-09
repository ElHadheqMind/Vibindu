import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { useElementsStore } from '../../store/useElementsStore';
import { ActionBlock, ActionType } from '../../models/types';
import { useSimulationStore } from '../../store/useSimulationStore';
import ExpressionInput from '../UI/ExpressionInput';

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
  box-shadow: 0 4px 20px ${props => props.theme.shadow};
  width: 500px;
  max-width: 90vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

const Content = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  font-size: 14px;
  &:focus { outline: none; border-color: ${props => props.theme.primary}; }
`;

const TextInput = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  font-size: 14px;
  &:focus { outline: none; border-color: ${props => props.theme.primary}; }
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

const QUALIFIERS: { value: ActionType; label: string }[] = [
  { value: 'N', label: 'N - Non-Stored (Normal)' },
  { value: 'S', label: 'S - Set (Stored)' },
  { value: 'R', label: 'R - Reset' },
  { value: 'L', label: 'L - Time Limited' },
  { value: 'D', label: 'D - Time Delayed' },
  { value: 'P', label: 'P - Pulse' },
  { value: 'SD', label: 'SD - Stored & Delayed' },
  { value: 'DS', label: 'DS - Delayed & Stored' },
  { value: 'SL', label: 'SL - Stored & Limited' },
];

interface ActionPropertiesModalProps {
  actionId: string;
  onClose: () => void;
}

const ActionPropertiesModal: React.FC<ActionPropertiesModalProps> = ({ actionId, onClose }) => {
  const { getElementById, updateElement } = useElementsStore();
  const actionBlock = getElementById<ActionBlock>(actionId);

  const [qualifier, setQualifier] = useState<ActionType>('N');
  const [variable, setVariable] = useState('');
  const [condition, setCondition] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (actionBlock) {
      setQualifier(actionBlock.qualifier || 'N');
      setVariable(actionBlock.variable || actionBlock.label || '');
      setCondition(actionBlock.condition || '');
      setDuration(actionBlock.duration || '');
    }
  }, [actionBlock]);

  if (!actionBlock) return null;

  const handleSave = () => {
    updateElement(actionId, {
      qualifier,
      variable,
      label: variable, // Sync label for backward compat
      condition,
      duration: isTimeBased(qualifier) ? duration : undefined,
    });
    onClose();
  };

  const isTimeBased = (q: string) => ['L', 'D', 'P', 'SD', 'DS', 'SL', 'temporal'].includes(q);

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Edit Action Properties</Title>
          <CloseButton onClick={onClose}><FiX /></CloseButton>
        </Header>

        <Content>
          <Field>
            <Label>Qualifier</Label>
            <Select value={qualifier} onChange={e => setQualifier(e.target.value as ActionType)}>
              {QUALIFIERS.map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </Select>
          </Field>

          <Field>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Variable / Action</Label>
              <button
                onClick={() => useSimulationStore.getState().setSimulationModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline', padding: 0 }}
              >
                Manage definitions...
              </button>
            </div>
            <ExpressionInput
              value={variable}
              onChange={setVariable}
              placeholder="Select variable or action..."
              suggestionType="actions"
            />
          </Field>

          {isTimeBased(qualifier) && (
            <Field>
              <Label>Duration (e.g., 5s, 500ms)</Label>
              <TextInput
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 2s"
              />
            </Field>
          )}

          <Field>
            <Label>Condition (Optional)</Label>
            <ExpressionInput
              value={condition}
              onChange={setCondition}
              placeholder="e.g. X1 AND X2"
              suggestionType="conditions"
            />
          </Field>
        </Content>

        <Footer>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={handleSave}>Confirm</Button>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

export default ActionPropertiesModal;
