import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
    FiX,
    FiFolder,
    FiSave
} from 'react-icons/fi';
import { ApiService } from '../../services/apiService';
import { useProjectStore } from '../../store/useProjectStore';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
`;

const Modal = styled.div`
  background: ${props => props.theme.surface};
  border-radius: 20px;
  width: 500px;
  max-width: 95vw;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid ${props => props.theme.border};
  animation: ${fadeIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  background: ${props => props.theme.surfaceAlt};
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  &:hover { background: ${props => props.theme.surface}; color: ${props => props.theme.text}; }
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FolderTree = styled.div`
  height: 200px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  overflow-y: auto;
  padding: 8px;
`;

const TreeItem = styled.div<{ $depth: number; $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  padding-left: ${props => 8 + props.$depth * 20}px;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.$isActive ? props.theme.primary + '15' : 'transparent'};
  color: ${props => props.$isActive ? props.theme.primary : props.theme.text};
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  
  &:hover {
    background: ${props => props.$isActive ? props.theme.primary + '20' : props.theme.surfaceAlt};
  }

  svg {
    margin-right: 8px;
    font-size: 16px;
    opacity: ${props => props.$isActive ? 1 : 0.7};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 4px ${props => props.theme.primary}20;
  }
`;

const Footer = styled.div`
  padding: 24px;
  background: ${props => props.theme.surfaceAlt};
  border-top: 1px solid ${props => props.theme.border};
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$primary ? `
    background: ${props.theme.primary};
    color: white;
    &:hover { opacity: 0.9; transform: translateY(-1px); }
    &:disabled { background: ${props.theme.border}; cursor: not-allowed; transform: none; }
  ` : `
    background: ${props.theme.surface};
    color: ${props.theme.text};
    border: 1px solid ${props.theme.border};
    &:hover { background: ${props.theme.surfaceAlt}; }
  `}
`;

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    isExpanded?: boolean;
}

interface SaveDiagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (path: string, name: string) => Promise<void>;
    defaultName: string;
}

const SaveDiagramModal: React.FC<SaveDiagramModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [fileName, setFileName] = useState(defaultName);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getCurrentProject: getProject } = useProjectStore();
    const project = getProject();

    useEffect(() => {
        if (isOpen && project?.localPath) {
            loadTree();
            setSelectedFolder(project.localPath);
        }
    }, [isOpen, project?.localPath]);

    const loadTree = async () => {
        if (!project?.localPath) return;
        const res = await ApiService.getFileTree(project.localPath);
        if (res.success && res.tree) {
            // We only want folders for selection
            const filterFolders = (node: FileNode): FileNode => {
                return {
                    ...node,
                    children: node.children?.filter(c => c.type === 'folder').map(filterFolders)
                };
            };
            const foldersOnly = filterFolders(res.tree);
            setFileTree(foldersOnly.children || []);
        }
    };

    const toggleExpand = (path: string) => {
        const update = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(n => {
                if (n.path === path) return { ...n, isExpanded: !n.isExpanded };
                if (n.children) return { ...n, children: update(n.children) };
                return n;
            });
        };
        setFileTree(update(fileTree));
    };

    const handleSaveClick = async () => {
        if (!fileName.trim()) {
            setError('Name is required');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await onSave(selectedFolder, fileName.trim());
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const renderNodes = (nodes: FileNode[], depth = 0) => {
        return nodes.map(node => (
            <React.Fragment key={node.path}>
                <TreeItem
                    $depth={depth}
                    $isActive={selectedFolder === node.path}
                    onClick={() => {
                        setSelectedFolder(node.path);
                        if (!node.isExpanded) toggleExpand(node.path);
                    }}
                >
                    <FiFolder />
                    {node.name}
                </TreeItem>
                {node.isExpanded && node.children && renderNodes(node.children, depth + 1)}
            </React.Fragment>
        ));
    };

    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    <Title><FiSave /> Save Diagram As</Title>
                    <CloseButton onClick={onClose}><FiX size={24} /></CloseButton>
                </Header>

                <Content>
                    <div>
                        <SectionLabel>Select Destination Folder</SectionLabel>
                        <FolderTree>
                            <TreeItem
                                $depth={0}
                                $isActive={selectedFolder === project?.localPath}
                                onClick={() => setSelectedFolder(project?.localPath || '')}
                            >
                                <FiFolder />
                                {project?.name} (Root)
                            </TreeItem>
                            {renderNodes(fileTree, 1)}
                        </FolderTree>
                    </div>

                    <div>
                        <SectionLabel>Diagram Name</SectionLabel>
                        <Input
                            placeholder="e.g. sequence_v1"
                            value={fileName}
                            onChange={e => setFileName(e.target.value)}
                            autoFocus
                        />
                        {error && <div style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '8px' }}>{error}</div>}
                    </div>
                </Content>

                <Footer>
                    <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button $primary onClick={handleSaveClick} disabled={isSaving || !fileName.trim()}>
                        {isSaving ? 'Saving...' : 'Save Diagram'}
                    </Button>
                </Footer>
            </Modal>
        </Overlay>
    );
};

export default SaveDiagramModal;
