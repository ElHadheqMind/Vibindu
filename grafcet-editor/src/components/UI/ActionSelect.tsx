import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useSimulationStore } from '../../store/useSimulationStore';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  font-size: 14px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  transition: all ${props => props.theme.transition.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}30;
  }
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.surfaceRaised};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
`;

const SuggestionItem = styled.li<{ $active: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  background-color: ${props => props.$active ? props.theme.surfaceAlt : 'transparent'};
  color: ${props => props.theme.text};
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
  }

  .name {
    font-weight: 500;
  }

  .description {
    font-size: 11px;
    color: ${props => props.theme.textSecondary};
  }
`;

interface ActionSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
}

const ActionSelect: React.FC<ActionSelectProps> = ({ value, onChange, placeholder, id }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { actions } = useSimulationStore();

    const filteredActions = actions.filter(action =>
        action.name.toLowerCase().includes(value.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setShowSuggestions(true);
        setActiveIndex(0);
    };

    const handleSelect = (name: string) => {
        onChange(name);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || filteredActions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(filteredActions[activeIndex].name);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleFocus = () => {
        if (value === '' || filteredActions.length > 0) {
            setShowSuggestions(true);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Use type assertion or check if e.target is a Node
            const target = e.target as Node;
            if (inputRef.current && !inputRef.current.contains(target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <Container>
            <Input
                ref={inputRef}
                id={id}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder={placeholder}
                autoComplete="off"
            />
            {showSuggestions && filteredActions.length > 0 && (
                <SuggestionsList>
                    {filteredActions.map((action, index) => (
                        <SuggestionItem
                            key={action.id}
                            $active={index === activeIndex}
                            onClick={() => handleSelect(action.name)}
                        >
                            <span className="name">{action.name}</span>
                            {action.description && <span className="description">{action.description}</span>}
                        </SuggestionItem>
                    ))}
                </SuggestionsList>
            )}
        </Container>
    );
};

export default ActionSelect;
