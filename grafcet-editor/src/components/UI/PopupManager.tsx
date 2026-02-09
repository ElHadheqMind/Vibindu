import React from 'react';
import Popup from './Popup';
import { usePopupStore } from '../../store/usePopupStore';

const PopupManager: React.FC = () => {
  const {
    isOpen,
    type,
    title,
    message,
    defaultValue,
    placeholder,
    onConfirm,
    customActions,
    onCustomAction,
    hidePopup,
  } = usePopupStore();

  if (!isOpen) return null;

  return (
    <Popup
      type={type}
      title={title}
      message={message}
      defaultValue={defaultValue}
      placeholder={placeholder}
      customActions={customActions}
      onCustomAction={onCustomAction}
      onClose={hidePopup}
      onConfirm={onConfirm ? (value) => {
        if (onConfirm) onConfirm(value);
        hidePopup();
      } : undefined}
    />
  );
};

export default PopupManager;
