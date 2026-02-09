import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import ExpressionInput from './ExpressionInput';

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const PopupContainer = styled.div`
  background-color: ${props => props.theme.surfaceRaised};
  border-radius: 8px;
  box-shadow: 0 4px 20px ${props => props.theme.shadow};
  width: 400px;
  max-width: 90vw;
  overflow: hidden;
  animation: popup-appear 0.2s ease-out;

  @keyframes popup-appear {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PopupHeader = styled.div<{ type: 'info' | 'warning' | 'error' | 'success' | 'prompt' | 'confirm' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: ${props => {
    switch (props.type) {
      case 'warning': return props.theme.error + '20';
      case 'error': return props.theme.error + '20';
      case 'success': return props.theme.success + '20';
      case 'info': return props.theme.primary + '20';
      case 'prompt': return props.theme.primary + '20';
      case 'confirm': return props.theme.error + '20';
      default: return props.theme.primary + '20';
    }
  }};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const PopupTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  font-size: 20px;
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

const PopupContent = styled.div`
  padding: 16px;
  color: ${props => props.theme.text};
  font-size: 14px;
  line-height: 1.5;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  gap: 10px;
  border-top: 1px solid ${props => props.theme.border};
`;

const Button = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => {
    if (props.$danger) return props.theme.error;
    if (props.$primary) return props.theme.primary;
    return 'transparent';
  }};
  color: ${props => {
    if (props.$danger || props.$primary) return 'white';
    return props.theme.text;
  }};
  border: 1px solid ${props => {
    if (props.$danger) return 'transparent';
    if (props.$primary) return 'transparent';
    return props.theme.border;
  }};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => {
    if (props.$danger) return '#d32f2f';
    if (props.$primary) return props.theme.primaryDark;
    return props.theme.surfaceAlt;
  }};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  margin-top: 10px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}30;
  }
`;

interface PopupAction {
  label: string;
  action: string;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface PopupProps {
  type: 'info' | 'warning' | 'error' | 'success' | 'prompt' | 'confirm';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: (value?: string) => void;
  defaultValue?: string;
  placeholder?: string;
  customActions?: PopupAction[];
  onCustomAction?: (action: string) => void;
  useExpressionInput?: boolean;
  suggestionType?: 'all' | 'variables' | 'actions' | 'conditions';
}

const Popup: React.FC<PopupProps> = ({
  type,
  title,
  message,
  onClose,
  onConfirm,
  defaultValue = '',
  placeholder = '',
  customActions = [],
  onCustomAction,
  useExpressionInput = false,
  suggestionType = 'all',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && type === 'prompt' && onConfirm) {
        onConfirm(inputValue);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, onConfirm, inputValue, type]);

  const getIcon = () => {
    switch (type) {
      case 'warning': return <FiAlertCircle color="#f44336" size={20} />;
      case 'error': return <FiAlertCircle color="#f44336" size={20} />;
      case 'success': return <FiCheckCircle color="#4caf50" size={20} />;
      case 'confirm': return <FiAlertCircle color="#f44336" size={20} />;
      case 'info':
      case 'prompt':
      default: return <FiInfo color="#2196f3" size={20} />;
    }
  };

  return (
    <PopupOverlay onClick={onClose}>
      <PopupContainer onClick={e => e.stopPropagation()}>
        <PopupHeader type={type}>
          <PopupTitle>
            {getIcon()}
            {title}
          </PopupTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </PopupHeader>

        <PopupContent>
          {message}

          {type === 'prompt' && (
            useExpressionInput ? (
              <ExpressionInput
                value={inputValue}
                onChange={setInputValue}
                placeholder={placeholder}
                suggestionType={suggestionType}
              />
            ) : (
              <Input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            )
          )}
        </PopupContent>

        <PopupActions className="popup-actions">
          {type === 'confirm' && customActions.length > 0 ? (
            // Custom actions for confirm type
            customActions.map((action, index) => (
              <Button
                key={index}
                $primary={action.variant === 'primary'}
                $danger={action.variant === 'danger'}
                onClick={() => {
                  if (onCustomAction) {
                    onCustomAction(action.action);
                  }
                  onClose();
                }}
              >
                {action.label}
              </Button>
            ))
          ) : (
            // Default actions for other types
            <>
              {type !== 'success' && type !== 'info' && (
                <Button onClick={onClose}>Cancel</Button>
              )}

              <Button
                $primary
                onClick={() => {
                  if (type === 'prompt' && onConfirm) {
                    onConfirm(inputValue);
                  } else if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }}
              >
                {type === 'prompt' ? 'Confirm' : 'OK'}
              </Button>
            </>
          )}
        </PopupActions>
      </PopupContainer>
    </PopupOverlay>
  );
};

export default Popup;
