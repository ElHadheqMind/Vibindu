import { create } from 'zustand';

type PopupType = 'info' | 'warning' | 'error' | 'success' | 'prompt' | 'confirm';

interface PopupAction {
  label: string;
  action: string;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface PopupState {
  isOpen: boolean;
  type: PopupType;
  title: string;
  message: string;
  defaultValue: string;
  placeholder: string;
  onConfirm?: (value?: string) => void;
  useExpressionInput?: boolean;
  suggestionType?: 'all' | 'variables' | 'actions' | 'conditions';
  customActions?: PopupAction[];
  onCustomAction?: (action: string) => void;

  // Actions
  showPopup: (
    type: PopupType,
    title: string,
    message: string,
    onConfirm?: (value?: string) => void,
    defaultValue?: string,
    placeholder?: string
  ) => void;

  hidePopup: () => void;

  // Convenience methods
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showPrompt: (
    title: string,
    message: string,
    onConfirm: (value?: string) => void,
    defaultValue?: string,
    placeholder?: string,
    useExpressionInput?: boolean,
    suggestionType?: 'all' | 'variables' | 'actions' | 'conditions'
  ) => void;

  showConfirm: (
    title: string,
    message: string,
    actions: PopupAction[],
    onAction: (action: string) => void
  ) => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  defaultValue: '',
  placeholder: '',
  onConfirm: undefined,
  useExpressionInput: false,
  suggestionType: 'all',
  customActions: undefined,
  onCustomAction: undefined,

  showPopup: (type, title, message, onConfirm, defaultValue = '', placeholder = '') => {
    set({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      defaultValue,
      placeholder,
    });
  },

  hidePopup: () => {
    set({
      isOpen: false,
      customActions: undefined,
      onCustomAction: undefined,
    });
  },

  showInfo: (title, message) => {
    set({
      isOpen: true,
      type: 'info',
      title,
      message,
      onConfirm: undefined,
      defaultValue: '',
      placeholder: '',
    });
  },

  showWarning: (title, message) => {
    set({
      isOpen: true,
      type: 'warning',
      title,
      message,
      onConfirm: undefined,
      defaultValue: '',
      placeholder: '',
    });
  },

  showError: (title, message) => {
    set({
      isOpen: true,
      type: 'error',
      title,
      message,
      onConfirm: undefined,
      defaultValue: '',
      placeholder: '',
    });
  },

  showSuccess: (title, message) => {
    set({
      isOpen: true,
      type: 'success',
      title,
      message,
      onConfirm: undefined,
      defaultValue: '',
      placeholder: '',
    });
  },

  showPrompt: (title, message, onConfirm, defaultValue = '', placeholder = '', useExpressionInput = false, suggestionType = 'all') => {
    set({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      onConfirm,
      defaultValue,
      placeholder,
      useExpressionInput,
      suggestionType,
    });
  },

  showConfirm: (title, message, actions, onAction) => {
    set({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      customActions: actions,
      onCustomAction: onAction,
      defaultValue: '',
      placeholder: '',
      onConfirm: undefined,
      useExpressionInput: false,
    });
  },
}));
