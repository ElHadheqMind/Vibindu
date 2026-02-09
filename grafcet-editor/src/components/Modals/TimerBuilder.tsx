import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useElementsStore } from '../../store/useElementsStore';
import { Step } from '../../models/types';

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

const OPERATORS = ['>', '>=', '<', '<='];

interface TimerBuilderProps {
    initialValue?: string;
    onSave: (value: string) => void;
    onCancel: () => void;
}

const TimerBuilder: React.FC<TimerBuilderProps> = ({ initialValue, onSave, onCancel }) => {
    const { elements } = useElementsStore();
    const steps = elements.filter(e => e.type === 'step') as Step[];

    // Parse initial value if present
    const [stepNumber, setStepNumber] = useState<string>('');
    const [operator, setOperator] = useState('>');
    const [duration, setDuration] = useState('5s');

    useEffect(() => {
        if (steps.length > 0 && !stepNumber) {
            setStepNumber(steps[0].number.toString());
        }

        if (initialValue) {
            // Match X1.t > 5s
            const match = initialValue.match(/^X(\d+)\.t\s*(>=|<=|>|<)\s*(.+)$/);
            if (match) {
                setStepNumber(match[1]);
                setOperator(match[2]);
                setDuration(match[3]);
            }
        }
    }, [initialValue, steps, stepNumber]);

    const handleSave = () => {
        if (!stepNumber) return;
        const expression = `X${stepNumber}.t ${operator} ${duration}`;
        onSave(expression);
    };

    if (steps.length === 0) {
        return (
            <Container>
                <Title>No steps found</Title>
                <Button onClick={onCancel}>Close</Button>
            </Container>
        );
    }

    return (
        <Container>
            <Title>Configure Timer</Title>
            <Row>
                <Select value={stepNumber} onChange={e => setStepNumber(e.target.value)}>
                    {steps.sort((a, b) => a.number - b.number).map(s => (
                        <option key={s.id} value={s.number}>Step {s.number} {s.label ? `(${s.label})` : ''}</option>
                    ))}
                </Select>
                <span>.t</span>
            </Row>
            <Row>
                <Select value={operator} onChange={e => setOperator(e.target.value)} style={{ flex: '0 0 60px' }}>
                    {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                    ))}
                </Select>
                <Input
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="5s"
                />
            </Row>
            <Row style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <Button onClick={onCancel} style={{ background: 'transparent', color: 'inherit' }}>Cancel</Button>
                <Button onClick={handleSave}>Insert</Button>
            </Row>
        </Container>
    );
};

export default TimerBuilder;
