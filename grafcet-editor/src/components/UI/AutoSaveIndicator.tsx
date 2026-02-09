import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const AutoSaveContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
`;

const SavingIndicator = styled(AutoSaveContainer)`
  background-color: ${props => props.theme.warning}20;
  color: ${props => props.theme.warning};
  animation: ${pulse} 1.5s infinite;
`;

const SavedIndicator = styled(AutoSaveContainer)`
  background-color: ${props => props.theme.success}20;
  color: ${props => props.theme.success};
`;

const ErrorIndicator = styled(AutoSaveContainer)`
  background-color: ${props => props.theme.error}20;
  color: ${props => props.theme.error};
`;

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date;
  error?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ 
  status, 
  lastSaved, 
  error 
}) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 3000); // Show "saved" for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (status === 'saving') {
    return (
      <SavingIndicator>
        <FiClock />
        <span>Saving...</span>
      </SavingIndicator>
    );
  }

  if (status === 'error') {
    return (
      <ErrorIndicator title={error || 'Save failed'}>
        <FiAlertCircle />
        <span>Save failed</span>
      </ErrorIndicator>
    );
  }

  if (showSaved || status === 'saved') {
    return (
      <SavedIndicator>
        <FiCheck />
        <span>
          Saved {lastSaved ? `at ${formatTime(lastSaved)}` : ''}
        </span>
      </SavedIndicator>
    );
  }

  return null;
};

export default AutoSaveIndicator;
