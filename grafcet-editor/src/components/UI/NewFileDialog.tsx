import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiX, FiFile, FiFolder, FiFileText, FiGitBranch } from 'react-icons/fi';
import { ApiService, FileType } from '../../services/apiService';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const Dialog = styled.div`
  background: ${props => props.theme.surface};
  border-radius: 16px;
  padding: 24px;
  width: 440px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.theme.border};
  animation: ${fadeIn} 0.2s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.surfaceAlt};
    color: ${props => props.theme.text};
  }
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const TypeCard = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid ${props => props.$selected ? props.theme.primary : props.theme.border};
  background: ${props => props.$selected
    ? `${props.theme.primary}15`
    : props.theme.surfaceAlt};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.primary};
    transform: translateY(-2px);
  }

  svg {
    font-size: 32px;
    color: ${props => props.$selected ? props.theme.primary : props.theme.textSecondary};
  }
`;

const TypeLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const TypeDescription = styled.span`
  font-size: 11px;
  color: ${props => props.theme.textSecondary};
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.textTertiary};
  }
`;

const ParentPath = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: ${props => props.theme.textSecondary};
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$primary ? `
    background: linear-gradient(135deg, ${props.theme.primary} 0%, ${props.theme.primary}dd 100%);
    color: white;
    box-shadow: 0 2px 8px ${props.theme.primary}40;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${props.theme.primary}60;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  ` : `
    background: ${props.theme.surfaceAlt};
    color: ${props.theme.text};
    border: 1px solid ${props.theme.border};

    &:hover {
      background: ${props.theme.surface};
    }
  `}
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.error || '#e53935'};
  font-size: 13px;
  margin-top: 8px;
  padding: 8px 12px;
  background: ${props => (props.theme.error || '#e53935') + '15'};
  border-radius: 6px;
`;

interface FileTypeOption {
  type: FileType;
  label: string;
  description: string;
  icon: React.ComponentType;
  placeholder: string;
}

const FILE_TYPES: FileTypeOption[] = [
  {
    type: 'grafcet',
    label: 'GRAFCET (.sfc)',
    description: 'Sequential Function Chart',
    icon: FiFileText,
    placeholder: 'e.g., main_sequence'
  },
  {
    type: 'gsrsm',
    label: 'GSRSM (.gsrsm)',
    description: 'Mode diagram',
    icon: FiGitBranch,
    placeholder: 'e.g., main'
  },
  {
    type: 'folder',
    label: 'Folder',
    description: 'New directory',
    icon: FiFolder,
    placeholder: 'e.g., documentation'
  },
  {
    type: 'custom',
    label: 'Other File',
    description: 'Any file type',
    icon: FiFile,
    placeholder: 'e.g., notes.txt'
  }
];

interface NewFileDialogProps {
  isOpen: boolean;
  parentPath: string;
  onClose: () => void;
  onFileCreated: (filePath: string, fileType: FileType) => void;
}

const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  parentPath,
  onClose,
  onFileCreated
}) => {
  const [selectedType, setSelectedType] = useState<FileType>('grafcet');
  const [fileName, setFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTypeInfo = FILE_TYPES.find(t => t.type === selectedType);

  const handleCreate = async () => {
    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await ApiService.createFile({
        parentPath,
        fileName: fileName.trim(),
        fileType: selectedType
      });

      if (result.success && result.filePath) {
        onFileCreated(result.filePath, selectedType);
        setFileName('');
        setSelectedType('grafcet');
        onClose();
      } else {
        setError(result.error || 'Failed to create file');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && fileName.trim()) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <Header>
          <Title>
            <FiFile />
            New File
          </Title>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
        </Header>

        <TypeGrid>
          {FILE_TYPES.map(typeOption => {
            const IconComponent = typeOption.icon;
            return (
              <TypeCard
                key={typeOption.type}
                $selected={selectedType === typeOption.type}
                onClick={() => {
                  setSelectedType(typeOption.type);
                  setError(null);
                }}
              >
                <IconComponent />
                <TypeLabel>{typeOption.label}</TypeLabel>
                <TypeDescription>{typeOption.description}</TypeDescription>
              </TypeCard>
            );
          })}
        </TypeGrid>

        <InputGroup>
          <Label>Parent Location</Label>
          <ParentPath title={parentPath}>
            {parentPath}
          </ParentPath>
        </InputGroup>

        <InputGroup>
          <Label>Name</Label>
          <Input
            type="text"
            value={fileName}
            onChange={e => {
              setFileName(e.target.value);
              setError(null);
            }}
            placeholder={selectedTypeInfo?.placeholder}
            autoFocus
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputGroup>

        <ButtonGroup>
          <Button onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            $primary
            onClick={handleCreate}
            disabled={isCreating || !fileName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </ButtonGroup>
      </Dialog>
    </Overlay>
  );
};

export default NewFileDialog;
