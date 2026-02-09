import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { parseExpression, Token, TokenType, generateId, tokensToString } from '../../utils/expressionParser';

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 42px;
  padding: 6px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  background-color: ${props => props.theme.surface};
  cursor: text;
  
  &:focus-within {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}30;
  }
`;

const TokenBlock = styled.div<{ $type: TokenType; $inverted?: boolean; $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  
  background-color: ${props => {
        if (props.$selected) return props.theme.primary;
        switch (props.$type) {
            case 'variable': return '#e3f2fd';
            case 'operator': return 'transparent'; // Operators transparent
            case 'function': return '#f3e5f5';
            case 'timer': return '#fff3e0';
            case 'comparison': return '#e0f7fa';
            default: return '#f5f5f5';
        }
    }};
  
  color: ${props => {
        if (props.$selected) return 'white';
        switch (props.$type) {
            case 'variable': return '#1565c0';
            case 'operator': return props.theme.text;
            case 'function': return '#7b1fa2';
            case 'timer': return '#e65100';
            case 'comparison': return '#006064';
            default: return props.theme.text;
        }
    }};

  ${props => props.$inverted && `
    text-decoration: overline;
  `}
  
  border: 1px solid ${props => props.$selected ? props.theme.primary : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$selected ? props.theme.primary : props.theme.surfaceAlt};
  }
`;

const Input = styled.input`
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: ${props => props.theme.text};
  min-width: 20px;
  flex: 1;
`;

// Define props interface here to ensure it's available
interface VisualExpressionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelectionChange?: (token: Token | null) => void;
}

export interface VisualExpressionInputHandle {
    toggleInversion: () => void;
    insertToken: (text: string) => void;
    deleteSelected: () => void;
}

const VisualExpressionInput = React.forwardRef<VisualExpressionInputHandle, VisualExpressionInputProps>(({ value, onChange, onSelectionChange }, ref) => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
        toggleInversion: () => {
            if (selectedTokenId) {
                toggleTokenInversion(selectedTokenId);
            }
        },
        insertToken: (text: string) => {
            const newTokens = parseExpression(text);
            updateTokens([...tokens, ...newTokens]);
        },
        deleteSelected: () => {
            if (selectedTokenId) {
                const idx = tokens.findIndex(t => t.id === selectedTokenId);
                if (idx !== -1) {
                    const newTokens = [...tokens];
                    newTokens.splice(idx, 1);
                    updateTokens(newTokens);
                    setSelectedTokenId(null);
                }
            }
        }
    }));

    // Initial parse
    useEffect(() => {
        // Only parse if value is significantly different to avoid loop
        // Ideally we compare semantic value, but string compare is ok if we normalize
        const currentString = tokensToString(tokens);
        // Clean up formatting differences (whitespace)
        if (currentString.replace(/\s/g, '') !== value.replace(/\s/g, '')) {
            setTokens(parseExpression(value));
        }
    }, [value]);

    const onSelectionChangeRef = useRef(onSelectionChange);

    useEffect(() => {
        onSelectionChangeRef.current = onSelectionChange;
    }, [onSelectionChange]);

    useEffect(() => {
        if (onSelectionChangeRef.current) {
            const token = tokens.find(t => t.id === selectedTokenId) || null;
            onSelectionChangeRef.current(token);
        }
    }, [selectedTokenId, tokens]);

    const handleCommit = (text: string) => {
        if (!text.trim()) return;

        const newTokens = parseExpression(text);
        updateTokens([...tokens, ...newTokens]);
        setInputValue('');
    };

    const updateTokens = (newTokens: Token[]) => {
        setTokens(newTokens);
        // Update parent with string representation
        // We need to implement a stringifier that respects the SFC storage format
        // For SFC storage, standard grafscript usually uses "a AND b" or "a . b".
        // Let's default to standard form (spaced) or whatever the parser expects.
        // The parser supports both, so generating "A . B + C" is fine.
        // For inverted: "!A"
        onChange(tokensToString(newTokens));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !inputValue) {
            if (selectedTokenId) {
                // Delete selected
                const idx = tokens.findIndex(t => t.id === selectedTokenId);
                if (idx !== -1) {
                    const newTokens = [...tokens];
                    newTokens.splice(idx, 1);
                    updateTokens(newTokens);
                    setSelectedTokenId(null);
                }
            } else if (tokens.length > 0) {
                // Select last token
                setSelectedTokenId(tokens[tokens.length - 1].id);
            }
        } else if ((e.key === 'Enter' || e.key === ' ') && inputValue) {
            e.preventDefault();
            handleCommit(inputValue);
        } else if (['.', '+', '(', ')'].includes(e.key)) {
            // Commit current input if any, then add operator
            if (inputValue) {
                handleCommit(inputValue);
            }
            e.preventDefault();
            // Add operator token directly
            const opToken: Token = {
                id: generateId(),
                type: ['(', ')'].includes(e.key) ? 'paren' : 'operator',
                value: e.key
            };
            updateTokens([...tokens, opToken]);
            setInputValue(''); // Ensure input cleared
        }
    };

    const toggleTokenInversion = (id: string) => {
        const newTokens = tokens.map(t => {
            if (t.id === id && t.type === 'variable') {
                return { ...t, inverted: !t.inverted };
            }
            return t;
        });
        updateTokens(newTokens);
    };

    // Expose method to toggle inversion of selected token via Ref if needed, 
    // but better to pass this up via callback or expose a control prop.
    // For now, let's just expose a ref-like object or use an event?
    // Actually, the Toolbar is outside. We need a way to trigger logic from outside.
    // Parent should have access to selection? 
    // We already call onSelectionChange. 
    // But modification needs to come back in.

    // Changing approach: The parent uses a ref to call internal methods?
    // Or we lift state up? Lifting state ("tokens") is cleaner but more work refactoring TransitionPropertiesModal.
    // Let's use `useImperativeHandle` style pattern if we want parent control, OR simple props command?
    // Let's implement a custom event listener or just export a ref type.

    return (
        <Container onClick={() => inputRef.current?.focus()}>
            {tokens.map(token => (
                <TokenBlock
                    key={token.id}
                    $type={token.type}
                    $inverted={token.inverted}
                    $selected={selectedTokenId === token.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTokenId(token.id);
                        inputRef.current?.focus();
                        if (onSelectionChange) onSelectionChange(token);
                    }}
                >
                    {token.value}
                </TokenBlock>
            ))}
            <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    if (inputValue) handleCommit(inputValue);
                }}
            />
        </Container>
    );
});

export default VisualExpressionInput;
