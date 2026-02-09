import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useEditorStore, ToastType } from '../../store/useEditorStore';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

// Animation for toast appearance
const slideIn = keyframes`
  from {
    transform: translateX(-50%) translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
`;

// Animation for toast disappearance
const slideOut = keyframes`
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(100px);
    opacity: 0;
  }
`;

// Pulse animation for attention
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

// Get background color based on toast type
const getBackgroundColor = (type: ToastType) => {
  switch (type) {
    case 'success': return '#4caf50';
    case 'warning': return '#ff9800';
    case 'info':
    default: return '#2196f3';
  }
};

// Enhanced toast container with animations and type-based styling
const ToastContainer = styled.div<{ visible: boolean; type: ToastType; $isExiting: boolean }>`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(${props => props.visible ? '0' : '100px'});
  background-color: ${props => getBackgroundColor(props.type)};
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  min-width: 300px;
  max-width: 500px;
  animation: ${props => props.$isExiting
    ? css`${slideOut} 0.4s ease-in-out forwards`
    : css`${slideIn} 0.4s ease-in-out, ${pulse} 1.5s infinite`};
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const IconContainer = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MessageContainer = styled.div`
  flex: 1;
  text-align: left;
  font-size: 14px;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-left: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;

  &:hover {
    opacity: 1;
  }
`;

// Function to determine toast type from message content
const determineToastType = (message: string | null): ToastType => {
  if (!message) return 'info';

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('success') ||
    lowerMessage.includes('created') ||
    lowerMessage.includes('added')) {
    return 'success';
  }

  if (lowerMessage.includes('warning') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('cancelled') ||
    lowerMessage.includes('please') ||
    lowerMessage.includes('select')) {
    return 'warning';
  }

  return 'info';
};

// Get icon based on toast type
const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success': return <FiCheckCircle size={20} />;
    case 'warning': return <FiAlertTriangle size={20} />;
    case 'info':
    default: return <FiInfo size={20} />;
  }
};

const Toast: React.FC = () => {
  const { toastMessage, toastVisible, toastType, hideToast } = useEditorStore();
  const [isExiting, setIsExiting] = useState(false);

  // For backward compatibility, we can still determine the type from the message
  // if needed, but we'll primarily use the type from the store
  const effectiveToastType = toastType || determineToastType(toastMessage);

  // Handle toast hiding with exit animation
  const handleHideToast = () => {
    setIsExiting(true);
    setTimeout(() => {
      hideToast();
      setIsExiting(false);
    }, 400); // Match animation duration
  };

  // Hide toast when clicking on it
  const handleClick = () => {
    handleHideToast();
  };

  // Hide toast when ESC key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toastVisible) {
        handleHideToast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toastVisible, hideToast, handleHideToast]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        handleHideToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toastVisible, toastMessage, handleHideToast]);

  if (!toastVisible && !isExiting) return null;

  return (
    <ToastContainer
      visible={toastVisible}
      type={effectiveToastType}
      $isExiting={isExiting}
    >
      <IconContainer>
        {getIcon(effectiveToastType)}
      </IconContainer>
      <MessageContainer>
        {toastMessage}
      </MessageContainer>
      <CloseButton onClick={handleClick}>
        <FiX size={18} />
      </CloseButton>
    </ToastContainer>
  );
};

export default Toast;
