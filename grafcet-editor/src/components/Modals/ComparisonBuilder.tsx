import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSimulationStore } from '../../store/useSimulationStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Embedded style updates */
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h4`
    margin: 0 0 8px 0;
    font-size: 14px;
    color: ${props => props.theme.text};
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Select = styled.select`
  padding: 6px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surfaceAlt};
  color: ${props => props.theme.text};
  flex: 1;
`;

const Input = styled.input`
  padding: 6px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surfaceAlt};
  color: ${props => props.theme.text};
  flex: 1;
  width: 80px;
`;

const Button = styled.button`
    padding: 6px 12px;
    background: ${props => props.theme.primary};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
        opacity: 0.9;
    }
`;

const OPERATORS = ['>', '>=', '<', '<=', '=', '!='];

interface ComparisonBuilderProps {
    initialValue?: string;
    onSave: (value: string) => void;
    onCancel: () => void;
}

const ComparisonBuilder: React.FC<ComparisonBuilderProps> = ({ initialValue, onSave, onCancel }) => {
    const { variables } = useSimulationStore();
    const numericVariables = variables.filter(v => v.type === 'integer' || v.type === 'float');

    // Parse initial value if present
    const [variableId, setVariableId] = useState('');
    const [operator, setOperator] = useState('>');
    const [value, setValue] = useState('0');
    const initializedRef = useRef(false);

    useEffect(() => {
        // Only run initialization once to prevent resetting user input
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (initialValue) {
            // regex to match "Var Op Val"
            const match = initialValue.match(/^(\w+)\s*(>=|<=|>|<|=|!=)\s*(.+)$/);
            if (match) {
                const varName = match[1];
                const foundVar = numericVariables.find(v => v.name === varName);
                if (foundVar) setVariableId(foundVar.id);
                setOperator(match[2]);
                setValue(match[3]);
            }
        } else if (numericVariables.length > 0) {
            setVariableId(numericVariables[0].id);
        }
    }, [initialValue]);

    const handleSave = () => {
        const selectedVar = variables.find(v => v.id === variableId);
        if (!selectedVar) return;

        const expression = `${selectedVar.name} ${operator} ${value}`;
        onSave(expression);
    };

    if (numericVariables.length === 0) {
        return (
            <Container>
                <Title>No numeric variables found</Title>
                <Button onClick={onCancel}>Close</Button>
            </Container>
        );
    }

    return (
        <Container>
            <Title>Compare Variable</Title>
            <Row>
                <Select value={variableId} onChange={e => setVariableId(e.target.value)}>
                    {numericVariables.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </Select>
                <Select value={operator} onChange={e => setOperator(e.target.value)} style={{ flex: '0 0 60px' }}>
                    {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                    ))}
                </Select>
                <Input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Value"
                />
            </Row>
            <Row style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <Button onClick={onCancel} style={{ background: 'transparent', color: 'inherit' }}>Cancel</Button>
                <Button onClick={handleSave}>Insert</Button>
            </Row>
        </Container>
    );
};

export default ComparisonBuilder;
