import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiPlus, FiTrash2, FiEdit2, FiSave } from 'react-icons/fi';
import { useSimulationStore, SimulationVariable, SimulationAction, VariableType } from '../../store/useSimulationStore';
import { usePopupStore } from '../../store/usePopupStore';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background-color: ${props => props.theme.surfaceRaised};
  border-radius: 12px;
  box-shadow: 0 20px 60px ${props => props.theme.shadow};
  width: 900px;
  max-width: 95vw;
  height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.primaryDark} 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background-color: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 16px;
  background: ${props => props.$active ? props.theme.surfaceAlt : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? props.theme.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.primary : props.theme.textSecondary};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    color: ${props => props.theme.primary};
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: ${props => props.theme.background};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid ${props => props.theme.border};
  color: ${props => props.theme.textSecondary};
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.$danger ? props.theme.error : props.theme.textSecondary};
  padding: 4px;
  font-size: 16px;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.$danger ? '#d32f2f' : props.theme.primary};
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: ${props => props.theme.surface};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.$primary ? props.theme.primary : props.theme.surfaceAlt};
  color: ${props => props.$primary ? 'white' : props.theme.text};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: ${props => props.$primary ? props.theme.primaryDark : props.theme.border};
  }
`;

interface SimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'variables' | 'actions'>('variables');
    const { variables, actions, addVariable, deleteVariable, addAction, deleteAction, updateVariable, updateAction } = useSimulationStore();
    const { showWarning } = usePopupStore();

    const [newVarName, setNewVarName] = useState('');
    const [newVarType, setNewVarType] = useState<VariableType>('boolean');
    const [newVarDesc, setNewVarDesc] = useState('');

    const [newActionName, setNewActionName] = useState('');
    const [newActionDesc, setNewActionDesc] = useState('');
    const [newActionQualifier, setNewActionQualifier] = useState('N');
    const [newActionCondition, setNewActionCondition] = useState('');
    const [newActionDuration, setNewActionDuration] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editQualifier, setEditQualifier] = useState('N');
    const [editCondition, setEditCondition] = useState('');
    const [editDuration, setEditDuration] = useState('');

    const QUALIFIERS = [
        { value: 'N', label: 'N - Non-Stored' },
        { value: 'S', label: 'S - Set (Stored)' },
        { value: 'R', label: 'R - Reset' },
        { value: 'L', label: 'L - Time Limited' },
        { value: 'D', label: 'D - Time Delayed' },
        { value: 'P', label: 'P - Pulse' },
        { value: 'SD', label: 'SD - Stored & Delayed' },
        { value: 'DS', label: 'DS - Delayed & Stored' },
        { value: 'SL', label: 'SL - Stored & Limited' },
    ];

    const isTimeBased = (q: string) => ['L', 'D', 'P', 'SD', 'DS', 'SL'].includes(q);

    if (!isOpen) return null;

    const handleAddVariable = () => {
        if (!newVarName.trim()) {
            showWarning('Invalid Input', 'Variable name cannot be empty');
            return;
        }
        if (variables.some(v => v.name === newVarName.trim())) {
            showWarning('Duplicate Variable', 'A variable with this name already exists');
            return;
        }
        addVariable({
            name: newVarName.trim(),
            type: newVarType,
            description: newVarDesc,
        });
        setNewVarName('');
        setNewVarType('boolean');
        setNewVarDesc('');
    };

    const handleAddAction = () => {
        if (!newActionName.trim()) {
            showWarning('Invalid Input', 'Action name cannot be empty');
            return;
        }
        if (actions.some(a => a.name === newActionName.trim())) {
            showWarning('Duplicate Action', 'An action with this name already exists');
            return;
        }
        addAction({
            name: newActionName.trim(),
            description: newActionDesc,
            qualifier: newActionQualifier,
            condition: newActionCondition,
            duration: isTimeBased(newActionQualifier) ? newActionDuration : undefined,
        });
        setNewActionName('');
        setNewActionDesc('');
        setNewActionQualifier('N');
        setNewActionCondition('');
        setNewActionDuration('');
    };

    const startEditing = (item: SimulationVariable | SimulationAction) => {
        setEditingId(item.id);
        setEditName(item.name);
        setEditDesc(item.description || '');
        if ('qualifier' in item) {
            setEditQualifier(item.qualifier || 'N');
            setEditCondition(item.condition || '');
            setEditDuration(item.duration || '');
        }
    };

    const saveEdit = (type: 'variable' | 'action') => {
        if (!editName.trim()) return;

        if (type === 'variable') {
            updateVariable(editingId!, { name: editName, description: editDesc });
        } else {
            updateAction(editingId!, {
                name: editName,
                description: editDesc,
                qualifier: editQualifier,
                condition: editCondition,
                duration: isTimeBased(editQualifier) ? editDuration : undefined,
            });
        }
        setEditingId(null);
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>Simulation Configuration</ModalTitle>
                    <CloseButton onClick={onClose}><FiX /></CloseButton>
                </ModalHeader>

                <TabsContainer>
                    <Tab $active={activeTab === 'variables'} onClick={() => setActiveTab('variables')}>
                        Variables
                    </Tab>
                    <Tab $active={activeTab === 'actions'} onClick={() => setActiveTab('actions')}>
                        Actions
                    </Tab>
                </TabsContainer>

                <ModalContent>
                    {activeTab === 'variables' ? (
                        <>
                            <AddRow>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        placeholder="Variable Name (e.g., sensor_a)"
                                        value={newVarName}
                                        onChange={e => setNewVarName(e.target.value)}
                                    />
                                </div>
                                <div style={{ width: '120px' }}>
                                    <Select
                                        value={newVarType}
                                        onChange={e => setNewVarType(e.target.value as VariableType)}
                                    >
                                        <option value="boolean">Boolean</option>
                                        <option value="integer">Integer</option>
                                        <option value="float">Float</option>
                                    </Select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <Input
                                        placeholder="Description (optional)"
                                        value={newVarDesc}
                                        onChange={e => setNewVarDesc(e.target.value)}
                                    />
                                </div>
                                <Button $primary onClick={handleAddVariable}>
                                    <FiPlus /> Add Variable
                                </Button>
                            </AddRow>

                            <Table>
                                <thead>
                                    <tr>
                                        <Th style={{ width: '30%' }}>Name</Th>
                                        <Th style={{ width: '15%' }}>Type</Th>
                                        <Th style={{ width: '45%' }}>Description</Th>
                                        <Th style={{ width: '10%' }}>Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variables.length === 0 ? (
                                        <tr>
                                            <Td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: '30px' }}>
                                                No variables defined. Add one above!
                                            </Td>
                                        </tr>
                                    ) : (
                                        variables.map(v => (
                                            <tr key={v.id}>
                                                <Td>
                                                    {editingId === v.id ? (
                                                        <Input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                                                    ) : (
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v.name}</span>
                                                    )}
                                                </Td>
                                                <Td><span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e3f2fd', color: '#1976d2', fontSize: '12px', textTransform: 'uppercase' }}>{v.type}</span></Td>
                                                <Td>
                                                    {editingId === v.id ? (
                                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                                    ) : (
                                                        v.description
                                                    )}
                                                </Td>
                                                <Td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {editingId === v.id ? (
                                                            <ActionButton onClick={() => saveEdit('variable')} title="Save">
                                                                <FiSave />
                                                            </ActionButton>
                                                        ) : (
                                                            <ActionButton onClick={() => startEditing(v)} title="Edit">
                                                                <FiEdit2 />
                                                            </ActionButton>
                                                        )}
                                                        <ActionButton $danger onClick={() => deleteVariable(v.id)} title="Delete">
                                                            <FiTrash2 />
                                                        </ActionButton>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </>
                    ) : (
                        <>
                            <AddRow style={{ flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            placeholder="Action Name (e.g., Motor_On)"
                                            value={newActionName}
                                            onChange={e => setNewActionName(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ width: '130px' }}>
                                        <Select
                                            value={newActionQualifier}
                                            onChange={e => setNewActionQualifier(e.target.value)}
                                        >
                                            {QUALIFIERS.map(q => (
                                                <option key={q.value} value={q.value}>{q.label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    {isTimeBased(newActionQualifier) && (
                                        <div style={{ width: '100px' }}>
                                            <Input
                                                placeholder="Time (2s)"
                                                value={newActionDuration}
                                                onChange={e => setNewActionDuration(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            placeholder="Condition (optional, e.g. S1 AND S2)"
                                            value={newActionCondition}
                                            onChange={e => setNewActionCondition(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            placeholder="Description (optional)"
                                            value={newActionDesc}
                                            onChange={e => setNewActionDesc(e.target.value)}
                                        />
                                    </div>
                                    <Button $primary onClick={handleAddAction}>
                                        <FiPlus /> Add Action
                                    </Button>
                                </div>
                            </AddRow>

                            <Table>
                                <thead>
                                    <tr>
                                        <Th style={{ width: '20%' }}>Name</Th>
                                        <Th style={{ width: '10%' }}>Q</Th>
                                        <Th style={{ width: '20%' }}>Condition</Th>
                                        <Th style={{ width: '30%' }}>Description</Th>
                                        <Th style={{ width: '10%' }}>Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actions.length === 0 ? (
                                        <tr>
                                            <Td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '30px' }}>
                                                No actions defined. Add one above!
                                            </Td>
                                        </tr>
                                    ) : (
                                        actions.map(a => (
                                            <tr key={a.id}>
                                                <Td>
                                                    {editingId === a.id ? (
                                                        <Input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                                                    ) : (
                                                        <span style={{ fontWeight: 600 }}>{a.name}</span>
                                                    )}
                                                </Td>
                                                <Td>
                                                    {editingId === a.id ? (
                                                        <Select value={editQualifier} onChange={e => setEditQualifier(e.target.value)}>
                                                            {QUALIFIERS.map(q => (
                                                                <option key={q.value} value={q.value}>{q.value}</option>
                                                            ))}
                                                        </Select>
                                                    ) : (
                                                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#f5f5f5', fontWeight: 'bold' }}>{a.qualifier || 'N'}</span>
                                                    )}
                                                </Td>
                                                <Td>
                                                    {editingId === a.id ? (
                                                        <Input
                                                            placeholder="Condition"
                                                            value={editCondition}
                                                            onChange={e => setEditCondition(e.target.value)}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '13px', color: '#666' }}>{a.condition}</span>
                                                    )}
                                                    {editingId === a.id && isTimeBased(editQualifier) && (
                                                        <Input
                                                            style={{ marginTop: '4px' }}
                                                            placeholder="Duration"
                                                            value={editDuration}
                                                            onChange={e => setEditDuration(e.target.value)}
                                                        />
                                                    )}
                                                    {a.duration && !editingId && (
                                                        <div style={{ fontSize: '11px', color: '#1976d2' }}>Duration: {a.duration}</div>
                                                    )}
                                                </Td>
                                                <Td>
                                                    {editingId === a.id ? (
                                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                                    ) : (
                                                        a.description
                                                    )}
                                                </Td>
                                                <Td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {editingId === a.id ? (
                                                            <ActionButton onClick={() => saveEdit('action')} title="Save">
                                                                <FiSave />
                                                            </ActionButton>
                                                        ) : (
                                                            <ActionButton onClick={() => startEditing(a)} title="Edit">
                                                                <FiEdit2 />
                                                            </ActionButton>
                                                        )}
                                                        <ActionButton $danger onClick={() => deleteAction(a.id)} title="Delete">
                                                            <FiTrash2 />
                                                        </ActionButton>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </>
                    )}
                </ModalContent>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default SimulationModal;
