import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useSimulationStore } from '../../store/useSimulationStore';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    color: ${props => props.theme.text};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 32px 10px 12px;
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

const SuggestionItem = styled.li<{ $active: boolean; $type: 'variable' | 'operator' | 'action' }>`
  padding: 8px 12px;
  cursor: pointer;
  background-color: ${props => props.$active ? props.theme.surfaceAlt : 'transparent'};
  color: ${props => props.theme.text};
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
  }

  small {
    font-size: 10px;
    opacity: 0.7;
    text-transform: uppercase;
    background: ${props => {
        if (props.$type === 'variable') return '#e3f2fd'; // Blue-ish
        if (props.$type === 'action') return '#e8f5e9'; // Green-ish
        return '#f3e5f5'; // Purple-ish (operator)
    }};
    color: ${props => {
        if (props.$type === 'variable') return '#1976d2';
        if (props.$type === 'action') return '#2e7d32';
        return '#7b1fa2';
    }};
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

interface ExpressionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    suggestionType?: 'all' | 'variables' | 'actions' | 'conditions';
}

const OPERATORS = [
    { name: 'AND', type: 'operator' },
    { name: 'OR', type: 'operator' },
    { name: 'NOT', type: 'operator' },
    { name: '(', type: 'operator' },
    { name: ')', type: 'operator' },
];

const ExpressionInput = React.forwardRef<HTMLInputElement, ExpressionInputProps>(({ value, onChange, placeholder, id, suggestionType = 'all' }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState(0);
    const [filterText, setFilterText] = useState('');

    const localInputRef = useRef<HTMLInputElement>(null);

    // Combine refs
    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(localInputRef.current);
            } else {
                ref.current = localInputRef.current;
            }
        }
    }, [ref]);

    const { variables, actions } = useSimulationStore();

    // Determine what to include based on suggestionType
    const includeVariables = suggestionType === 'all' || suggestionType === 'variables' || suggestionType === 'conditions';
    const includeActions = suggestionType === 'all' || suggestionType === 'actions';
    const includeOperators = suggestionType === 'all' || suggestionType === 'conditions';

    const allSuggestions = [
        ...(includeVariables ? variables.map(v => ({ name: v.name, type: 'variable' as const })) : []),
        ...(includeActions ? actions.map(a => ({ name: a.name, type: 'action' as const })) : []),
        ...(includeOperators ? OPERATORS : [])
    ];

    const filteredSuggestions = allSuggestions.filter(item =>
        item.name.toLowerCase().startsWith(filterText.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const newCursorPos = e.target.selectionStart || 0;
        setCursorPos(newCursorPos);
        onChange(newValue);

        // Analyze text before cursor to find current word
        const textBeforeCursor = newValue.slice(0, newCursorPos);
        const words = textBeforeCursor.split(/[\s()]+/); // Split by space or parens
        const currentWord = words[words.length - 1];

        // Always update filter text, but only auto-show if meaningful or explicitly requested
        setFilterText(currentWord || '');
        if (currentWord) {
            setShowSuggestions(true);
            setActiveIndex(0);
        } else {
            // Don't auto-close if manually opened, but for now we stick to auto-behavior unless toggled
            // We keep it open if it was already open and effectively showing "all"
        }
    };

    const insertSuggestion = (suggestion: string) => {
        const textBeforeCursor = value.slice(0, cursorPos);
        const textAfterCursor = value.slice(cursorPos);

        // Find where the current word starts
        const lastSeparatorIndex = Math.max(
            textBeforeCursor.lastIndexOf(' '),
            textBeforeCursor.lastIndexOf('('),
            textBeforeCursor.lastIndexOf(')')
        );

        const prefix = textBeforeCursor.slice(0, lastSeparatorIndex + 1);

        const newValue = prefix + suggestion + ' ' + textAfterCursor;

        onChange(newValue);
        setShowSuggestions(false);

        // Defer focus restore and selection update
        setTimeout(() => {
            if (localInputRef.current) {
                localInputRef.current.focus();
                const newPos = prefix.length + suggestion.length + 1;
                localInputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            insertSuggestion(filteredSuggestions[activeIndex].name);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (localInputRef.current && !localInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <Container>
            <InputWrapper>
                <Input
                    ref={localInputRef}
                    id={id}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    onClick={() => {
                        // Optional: auto-open on click? Maybe too intrusive.
                    }}
                />
                <ToggleButton onClick={() => {
                    setShowSuggestions(!showSuggestions);
                    if (!showSuggestions) {
                        setFilterText(''); // Clear filter to show all when manually opening
                        if (localInputRef.current) localInputRef.current.focus();
                    }
                }}>
                    {showSuggestions ? <FiChevronUp /> : <FiChevronDown />}
                </ToggleButton>
            </InputWrapper>
            {showSuggestions && filteredSuggestions.length > 0 && (
                <SuggestionsList>
                    {filteredSuggestions.map((item, index) => (
                        <SuggestionItem
                            key={item.name}
                            $active={index === activeIndex}
                            $type={item.type as 'variable' | 'operator' | 'action'}
                            onClick={() => insertSuggestion(item.name)}
                        >
                            <span>{item.name}</span>
                            <small>{item.type}</small>
                        </SuggestionItem>
                    ))}
                </SuggestionsList>
            )}
        </Container>
    );
});

export default ExpressionInput;
