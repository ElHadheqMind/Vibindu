import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    FiFile,
    FiFolder,
    FiChevronRight,
    FiChevronDown,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiFileText,
    FiSettings,
    FiCode,
    FiDatabase,
    FiLayers,
    FiGitBranch,
    FiCheck,
    FiFilePlus
} from 'react-icons/fi';
import { useProjectStore } from '../../store/useProjectStore';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { useGsrsmFileStore } from '../../store/useGsrsmFileStore';
import { usePopupStore } from '../../store/usePopupStore';
import { useCreateProjectModalStore } from '../../store/useCreateProjectModalStore';
import { ApiService } from '../../services/apiService';
import { GrafcetDiagram, GrafcetProject, GsrsmProject, FileSystemItem } from '../../models/types';
import NewFileDialog from '../UI/NewFileDialog';

const PanelContainer = styled.div<{ $isVisible: boolean }>`
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.surface};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid ${props => props.theme.border};
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: linear-gradient(135deg, ${props => props.theme.surfaceRaised} 0%, ${props => props.theme.surface} 100%);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${props => props.theme.primary}40 50%, transparent 100%);
  }
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.text};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.surface};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 3px;

    &:hover {
      background: ${props => props.theme.textSecondary};
    }
  }
`;

const ProjectSection = styled.div`
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.theme.surfaceRaised};
  border: 1px solid ${props => props.theme.border};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`;

const ProjectHeader = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: ${props => props.$isOpen
        ? `linear-gradient(135deg, ${props.theme.primary}15 0%, ${props.theme.surfaceAlt} 100%)`
        : `linear-gradient(135deg, ${props.theme.surfaceRaised} 0%, ${props.theme.surface} 100%)`
    };
  border-bottom: ${props => props.$isOpen ? `1px solid ${props.theme.border}` : 'none'};
  transition: all 0.3s ease;
  user-select: none;
  position: relative;

  &:hover {
    background: linear-gradient(135deg, ${props => props.theme.primary}20 0%, ${props => props.theme.surfaceAlt} 100%);
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    transition: all 0.3s ease;
    color: ${props => props.theme.textSecondary};
    font-size: 16px;
  }

  &:hover svg {
    color: ${props => props.theme.primary};
    transform: scale(1.1);
  }

  ${props => props.$isOpen && `
    svg:first-child {
      transform: rotate(90deg);
    }
  `}
`;

const ProjectName = styled.div`
  font-weight: 700;
  margin-left: 12px;
  flex: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  font-size: 15px;
  color: ${props => props.theme.text};

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const FilesList = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'isVisible',
}) <{ isVisible: boolean }>`
  padding: ${props => props.isVisible ? '12px 16px 16px 16px' : '0'};
  display: ${props => props.isVisible ? 'block' : 'none'};
  background-color: ${props => props.theme.surface};
  border-top: ${props => props.isVisible ? `1px solid ${props.theme.border}` : 'none'};

  /* Smooth animation for expansion */
  transition: all 0.3s ease;
  max-height: ${props => props.isVisible ? '1000px' : '0'};
  overflow: hidden;
`;

const FileItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 6px;
  background-color: ${props => props.$isActive
        ? `linear-gradient(135deg, ${props.theme.primary}20 0%, ${props.theme.primaryLight} 100%)`
        : 'transparent'
    };
  color: ${props => props.$isActive ? props.theme.primary : props.theme.text};
  border: 1px solid ${props => props.$isActive ? props.theme.primary + '40' : 'transparent'};
  transition: all 0.3s ease;
  user-select: none;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: ${props => props.$isActive ? props.theme.primary : 'transparent'};
    border-radius: 0 2px 2px 0;
    transition: all 0.3s ease;
  }

  &:hover {
    background: ${props => props.$isActive
        ? `linear-gradient(135deg, ${props.theme.primary}25 0%, ${props.theme.primaryLight} 100%)`
        : `linear-gradient(135deg, ${props.theme.surfaceAlt} 0%, ${props.theme.surfaceRaised} 100%)`
    };
    border-color: ${props => props.theme.primary}60;
    transform: translateX(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);

    &::before {
      background-color: ${props => props.theme.primary};
    }
  }

  &:active {
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  svg {
    margin-right: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    color: ${props => props.$isActive ? props.theme.primary : props.theme.textSecondary};
  }

  &:hover svg {
    color: ${props => props.theme.primary};
    transform: scale(1.1);
  }
`;

const FileName = styled.div`
  margin-left: 2px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 14px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  opacity: 0.7;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    background-color: ${props => props.theme.primary}20;
    color: ${props => props.theme.primary};
    opacity: 1;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateX(8px);

  ${FileItem}:hover & {
    opacity: 1;
    transform: translateX(0);
  }

  ${ProjectHeader}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme.textSecondary};
  text-align: center;
  background: linear-gradient(135deg, ${props => props.theme.surface} 0%, ${props => props.theme.surfaceAlt} 100%);
  border-radius: 12px;
  border: 2px dashed ${props => props.theme.border};
  margin: 16px 0;
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
  color: ${props => props.theme.primary};

  svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
`;

const EmptyStateText = styled.div`
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
`;

const Button = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.primary}dd 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px ${props => props.theme.primary}40;

  &:hover {
    background: linear-gradient(135deg, ${props => props.theme.primary}dd 0%, ${props => props.theme.primary} 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.primary}60;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px ${props => props.theme.primary}40;
  }
`;

const FileTypeLabel = styled.span`
  font-size: 11px;
  opacity: 0.7;
  margin-left: auto;
  text-transform: uppercase;
  font-weight: 600;
  color: ${props => props.theme.primary};
  background-color: ${props => props.theme.primary}15;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

const ClickableFileItem = styled(FileItem) <{ canOpen: boolean }>`
  cursor: ${props => props.canOpen ? 'pointer' : 'default'};
  opacity: ${props => props.canOpen ? 1 : 0.5};

  &:hover {
    background: ${props => props.canOpen
        ? `linear-gradient(135deg, ${props.theme.surfaceAlt} 0%, ${props.theme.surfaceRaised} 100%)`
        : 'transparent'
    };
    border-color: ${props => props.canOpen ? props.theme.primary + '60' : 'transparent'};
    transform: ${props => props.canOpen ? 'translateX(4px)' : 'none'};
    box-shadow: ${props => props.canOpen ? '0 4px 8px rgba(0, 0, 0, 0.12)' : 'none'};
  }

  &:active {
    transform: ${props => props.canOpen ? 'translateX(2px)' : 'none'};
    box-shadow: ${props => props.canOpen ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none'};
  }

  ${props => !props.canOpen && `
    &:hover {
      cursor: not-allowed;
    }
  `}
`;

const FileCategory = styled.div`
  margin-bottom: 16px;
`;

const CategoryHeader = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${props => props.theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, ${props => props.theme.surfaceAlt} 0%, ${props => props.theme.surface} 100%);
  border-radius: 6px;
  border-left: 3px solid ${props => props.theme.primary};
`;

const ProjectTypeIndicator = styled.span.withConfig({
    shouldForwardProp: (prop) => prop !== 'projectType',
}) <{ projectType: 'grafcet' | 'gsrsm' }>`
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  background: ${props => props.projectType === 'grafcet'
        ? `linear-gradient(135deg, ${props.theme.primary} 0%, ${props.theme.primary}dd 100%)`
        : `linear-gradient(135deg, ${props.theme.secondary} 0%, ${props.theme.secondary}dd 100%)`
    };
  color: white;
  margin-left: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.projectType === 'grafcet' ? props.theme.primary : props.theme.secondary};
`;

const CurrentProjectIndicator = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: ${props => props.theme.success || props.theme.primary};
  font-size: 14px;
  opacity: 0.8;

  svg {
    transition: all 0.2s ease;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const FolderExpandIcon = styled.span`
  margin-right: 8px;
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  transition: all 0.2s ease;
  user-select: none;
`;

const NestedFolderContainer = styled.div<{ depth: number }>`
  margin-top: 4px;
  margin-left: ${props => props.depth * 16}px;
  border-left: 1px solid ${props => props.theme.border}20;
  padding-left: 8px;
`;

interface FilesPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

interface ProjectFolderContent {
    projectId: string;
    contents: Array<{
        name: string;
        path: string;
        isDirectory: boolean;
        size: number;
        lastModified: string;
    }>;
}

interface FileTypeInfo {
    icon: React.ComponentType;
    type: string;
    canOpen: boolean;
    category: 'diagram' | 'project' | 'mode' | 'mode-F' | 'mode-A' | 'mode-D' | 'control' | 'other';
    priority: number; // For sorting files
}

// Local storage keys for UI state persistence
const EXPANDED_PROJECTS_KEY = 'grafcet-files-panel-expanded-projects';
const EXPANDED_FOLDERS_KEY = 'grafcet-files-panel-expanded-folders';
const PROJECT_FOLDER_CONTENTS_KEY = 'grafcet-files-panel-project-contents';
const FOLDER_CONTENTS_KEY = 'grafcet-files-panel-folder-contents';

// Helper functions for persistence
const saveToLocalStorage = (key: string, data: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
    }
};

const loadFromLocalStorage = function <T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Failed to load ${key} from localStorage:`, error);
        return defaultValue;
    }
};

// Clear all file panel localStorage data
const clearFilesPanelStorage = () => {
    try {
        localStorage.removeItem(EXPANDED_PROJECTS_KEY);
        localStorage.removeItem(EXPANDED_FOLDERS_KEY);
        localStorage.removeItem(PROJECT_FOLDER_CONTENTS_KEY);
        localStorage.removeItem(FOLDER_CONTENTS_KEY);
    } catch (error) {
        console.error('Failed to clear files panel storage:', error);
    }
};

const FilesPanel: React.FC<FilesPanelProps> = ({ isVisible }) => {
    const navigate = useNavigate();

    // Initialize state from localStorage or defaults
    const [expandedProjects, setExpandedProjects] = useState<string[]>(() =>
        loadFromLocalStorage(EXPANDED_PROJECTS_KEY, [])
    );
    const [expandedFolders, setExpandedFolders] = useState<string[]>(() =>
        loadFromLocalStorage(EXPANDED_FOLDERS_KEY, [])
    );
    const [projectFolderContents, setProjectFolderContents] = useState<ProjectFolderContent[]>(() =>
        loadFromLocalStorage(PROJECT_FOLDER_CONTENTS_KEY, [])
    );
    const [folderContents, setFolderContents] = useState<{ [folderPath: string]: FileSystemItem[] }>(() =>
        loadFromLocalStorage(FOLDER_CONTENTS_KEY, {})
    );

    // Track if initial load is complete and if we've seen projects loaded
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
    const [hasSeenProjects, setHasSeenProjects] = useState(false);

    // State for NewFileDialog
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const [newFileParentPath, setNewFileParentPath] = useState<string>('');

    const {
        projects: grafcetProjects,
        currentProjectId,
        currentDiagramId,
        createDiagram,
        setCurrentProject,
        setCurrentDiagram,
        updateDiagram,
        deleteDiagram,
        getCurrentProject,
    } = useProjectStore();

    const { project: gsrsmProject } = useGsrsmStore();
    const { loadFile: loadGsrsmFile } = useGsrsmFileStore();

    // Check if any project is currently opened
    const hasOpenProject = getCurrentProject() !== null || gsrsmProject !== null;

    // Determine project type
    const getProjectType = (project: GrafcetProject | GsrsmProject): 'grafcet' | 'gsrsm' => {
        // GSRSM projects have a 'diagram' property, GRAFCET projects have 'diagrams' array
        return 'diagram' in project ? 'gsrsm' : 'grafcet';
    };

    // Get unified project list
    const getAllProjects = (): (GrafcetProject | GsrsmProject)[] => {
        const allProjects: (GrafcetProject | GsrsmProject)[] = [...grafcetProjects];
        if (gsrsmProject) {
            allProjects.push(gsrsmProject);
        }
        return allProjects;
    };

    const projects = getAllProjects();

    // Track when we first see projects loaded (to handle async loading from persistence)
    useEffect(() => {
        if (projects.length > 0 && !hasSeenProjects) {
            setHasSeenProjects(true);
            // Reset initial load complete to allow re-initialization when projects are loaded
            setIsInitialLoadComplete(false);
        }
    }, [projects.length, hasSeenProjects]);

    // Effect to restore state and auto-load folder contents after refresh
    useEffect(() => {
        const initializeFilePanel = async () => {
            if (isInitialLoadComplete) return;

            try {
                // Auto-expand current project if it exists and isn't already expanded
                if (currentProjectId && !expandedProjects.includes(currentProjectId)) {
                    const currentProject = projects.find(p => p.id === currentProjectId);
                    if (currentProject?.localPath) {
                        setExpandedProjects(prev => {
                            const updated = [...prev, currentProjectId];
                            saveToLocalStorage(EXPANDED_PROJECTS_KEY, updated);
                            return updated;
                        });
                        await loadProjectFolderContents(currentProjectId, currentProject.localPath);
                    }
                }

                // Reload folder contents for all expanded projects that don't have cached contents
                for (const projectId of expandedProjects) {
                    const project = projects.find(p => p.id === projectId);
                    const hasContents = projectFolderContents.some(pfc => pfc.projectId === projectId);

                    if (project?.localPath && !hasContents) {
                        await loadProjectFolderContents(projectId, project.localPath);
                    }
                }

                // Reload folder contents for all expanded folders that don't have cached contents
                for (const folderPath of expandedFolders) {
                    if (!folderContents[folderPath]) {
                        await loadFolderContents(folderPath);
                    }
                }

                setIsInitialLoadComplete(true);
            } catch (error) {
                console.error('Error initializing file panel:', error);
                setIsInitialLoadComplete(true);
            }
        };

        // Run initialization if:
        // 1. We have projects and haven't completed initial load, OR
        // 2. We have no projects but have seen projects before (meaning they were cleared)
        if ((projects.length > 0 && !isInitialLoadComplete) || (projects.length === 0 && hasSeenProjects)) {
            initializeFilePanel();
        }
    }, [projects.length, currentProjectId, expandedProjects, expandedFolders, folderContents, projectFolderContents, isInitialLoadComplete, hasSeenProjects]);

    // Clear storage when no projects exist and we've seen projects before
    useEffect(() => {
        if (projects.length === 0 && hasSeenProjects && isInitialLoadComplete) {
            clearFilesPanelStorage();
            setExpandedProjects([]);
            setExpandedFolders([]);
            setProjectFolderContents([]);
            setFolderContents({});
        }
    }, [projects.length, hasSeenProjects, isInitialLoadComplete]);

    // React to GSRSM mode changes - refresh project folder contents when modes are activated/deactivated
    useEffect(() => {
        if (gsrsmProject && gsrsmProject.localPath && isInitialLoadComplete) {
            // Reload the project folder contents to reflect mode folder changes
            const refreshProjectContents = async () => {
                await loadProjectFolderContents(gsrsmProject.id, gsrsmProject.localPath!);
            };

            refreshProjectContents();
        }
    }, [gsrsmProject, isInitialLoadComplete]);

    // Load project folder contents
    const loadProjectFolderContents = async (projectId: string, projectPath: string) => {
        try {
            const response = await ApiService.browseProjectFolder(projectPath);
            if (response.success && response.contents) {
                const newContents = { projectId, contents: response.contents! };
                setProjectFolderContents(prev => {
                    const filtered = prev.filter(p => p.projectId !== projectId);
                    const updated = [...filtered, newContents];
                    // Persist to localStorage
                    saveToLocalStorage(PROJECT_FOLDER_CONTENTS_KEY, updated);
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error loading project folder contents:', error);
        }
    };

    // Load specific folder contents
    const loadFolderContents = async (folderPath: string) => {
        try {
            const response = await ApiService.browseDirectory(folderPath);
            if (response.success && response.contents) {
                setFolderContents(prev => {
                    const updated = {
                        ...prev,
                        [folderPath]: response.contents!
                    };
                    // Persist to localStorage
                    saveToLocalStorage(FOLDER_CONTENTS_KEY, updated);
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error loading folder contents:', error);
        }
    };

    // Toggle folder expansion
    const toggleFolderExpansion = async (folderPath: string) => {
        const wasExpanded = expandedFolders.includes(folderPath);

        setExpandedFolders(prev => {
            const updated = prev.includes(folderPath)
                ? prev.filter(path => path !== folderPath)
                : [...prev, folderPath];
            // Persist to localStorage
            saveToLocalStorage(EXPANDED_FOLDERS_KEY, updated);
            return updated;
        });

        // Load folder contents when expanding
        if (!wasExpanded && !folderContents[folderPath]) {
            await loadFolderContents(folderPath);
        }
    };

    // Toggle project expansion
    const toggleProjectExpansion = async (projectId: string) => {
        const wasExpanded = expandedProjects.includes(projectId);

        setExpandedProjects(prev => {
            const updated = prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId];
            // Persist to localStorage
            saveToLocalStorage(EXPANDED_PROJECTS_KEY, updated);
            return updated;
        });

        // Load folder contents when expanding
        if (!wasExpanded) {
            const project = projects.find(p => p.id === projectId);
            if (project?.localPath) {
                await loadProjectFolderContents(projectId, project.localPath);
            }
        }
    };

    // Create a new project
    const handleCreateProject = () => {
        useCreateProjectModalStore.getState().openModal();
    };

    // Create a new diagram
    const handleCreateDiagram = (projectId: string) => {
        usePopupStore.getState().showPrompt(
            'New Diagram',
            'Enter diagram name:',
            (name) => {
                if (!name) return;

                createDiagram(projectId, name);
            },
            'New Diagram',
            'Enter diagram name'
        );
    };

    // Rename a diagram
    const handleRenameDiagram = (diagramId: string, currentName: string) => {
        usePopupStore.getState().showPrompt(
            'Rename Diagram',
            'Enter new diagram name:',
            (newName) => {
                if (!newName || newName === currentName) return;

                updateDiagram(diagramId, { name: newName });
            },
            currentName,
            'Enter new name'
        );
    };

    // Delete a diagram
    const handleDeleteDiagram = (diagramId: string, diagramName: string) => {
        usePopupStore.getState().showPopup(
            'warning',
            'Delete Diagram',
            `Are you sure you want to delete "${diagramName}"?`,
            () => {
                deleteDiagram(diagramId);
            }
        );
    };

    // Get activated GSRSM modes for the current project
    const getActivatedGsrsmModes = (project: GrafcetProject | GsrsmProject): string[] => {
        if (getProjectType(project) === 'gsrsm') {
            const gsrsmProject = project as GsrsmProject;
            return gsrsmProject.diagram.modes
                .filter(mode => mode.type === 'active')
                .map(mode => mode.code);
        }
        return [];
    };

    // Get file type and icon - show all files and folders
    const getFileTypeInfo = (fileName: string, isDirectory: boolean, projectType?: 'grafcet' | 'gsrsm', project?: GrafcetProject | GsrsmProject): FileTypeInfo | null => {
        if (isDirectory) {
            // For GSRSM projects, identify mode folders
            if (projectType === 'gsrsm' && project) {
                const activatedModes = getActivatedGsrsmModes(project);
                const allGsrsmModes = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'D1', 'D2', 'D3'];

                if (allGsrsmModes.includes(fileName)) {
                    // Show all mode folders, highlight activated ones
                    if (activatedModes.includes(fileName)) {
                        return { icon: FiLayers, type: 'GSRSM Mode (Active)', canOpen: true, category: 'mode', priority: 3 };
                    } else {
                        return { icon: FiFolder, type: 'GSRSM Mode (Inactive)', canOpen: true, category: 'mode', priority: 4 };
                    }
                }

                // Show other folders
                return { icon: FiFolder, type: 'folder', canOpen: true, category: 'other', priority: 10 };
            }

            // For GRAFCET projects, show diagrams folder with special icon
            if (fileName === 'diagrams') {
                return { icon: FiFolder, type: 'Diagrams', canOpen: true, category: 'diagram', priority: 1 };
            }

            // Show all other folders
            return { icon: FiFolder, type: 'folder', canOpen: true, category: 'other', priority: 10 };
        }

        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'json':
                if (fileName === 'project.json') {
                    return { icon: FiDatabase, type: 'Project', canOpen: false, category: 'project', priority: 0 };
                }
                if (fileName === 'gsrsm.json') {
                    return { icon: FiGitBranch, type: 'GSRSM', canOpen: true, category: 'project', priority: 1 };
                }
                if (fileName === 'grafcet_de_conduite.json') {
                    return { icon: FiFileText, type: 'Control GRAFCET', canOpen: true, category: 'control', priority: 2 };
                }
                // Diagram files in diagrams folder
                if (fileName.includes('grafcet') || fileName.includes('diagram') || fileName.endsWith('_grafcet.json')) {
                    return { icon: FiCode, type: 'GRAFCET', canOpen: true, category: 'diagram', priority: 2 };
                }
                return { icon: FiSettings, type: 'JSON Config', canOpen: false, category: 'other', priority: 15 };

            case 'grafcet':
                if (fileName === 'grafcet_de_conduite.grafcet') {
                    return { icon: FiFileText, type: 'Control GRAFCET', canOpen: true, category: 'control', priority: 2 };
                }
                return { icon: FiFileText, type: 'GRAFCET', canOpen: true, category: 'diagram', priority: 2 };

            case 'md':
                return { icon: FiFileText, type: 'Markdown', canOpen: false, category: 'other', priority: 20 };

            case 'txt':
                return { icon: FiFileText, type: 'Text', canOpen: false, category: 'other', priority: 20 };

            case 'xml':
                return { icon: FiCode, type: 'XML', canOpen: false, category: 'other', priority: 20 };

            default:
                // Show all other file types
                return { icon: FiFile, type: 'file', canOpen: false, category: 'other', priority: 25 };
        }
    };

    // Show all files and folders - no filtering
    const getFilteredFiles = (contents: FileSystemItem[], projectType: 'grafcet' | 'gsrsm', project?: GrafcetProject | GsrsmProject) => {
        const allFiles = contents
            .map(item => ({
                ...item,
                fileInfo: getFileTypeInfo(item.name, item.isDirectory, projectType, project)
            }))
            .sort((a, b) => {
                // Sort by: directories first, then by priority, then alphabetically
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                if ((a.fileInfo?.priority || 0) !== (b.fileInfo?.priority || 0)) {
                    return (a.fileInfo?.priority || 0) - (b.fileInfo?.priority || 0);
                }
                return a.name.localeCompare(b.name);
            });

        return allFiles;
    };

    // Group files by category with special handling for GSRSM modes
    const groupFilesByCategory = (files: (FileSystemItem & { fileInfo?: any })[], project?: GrafcetProject | GsrsmProject) => {
        const groups: { [key: string]: (FileSystemItem & { fileInfo?: any })[] } = {};

        files.forEach(file => {
            let category = file.fileInfo?.category || 'other';

            // Special handling for GSRSM mode folders - split by F/A/D and only show activated
            if (category === 'mode' && project && getProjectType(project) === 'gsrsm') {
                const activatedModes = getActivatedGsrsmModes(project);
                const allGsrsmModes = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'D1', 'D2', 'D3'];

                if (allGsrsmModes.includes(file.name)) {
                    // Only include activated modes
                    if (activatedModes.includes(file.name)) {
                        // Determine category based on mode prefix
                        if (file.name.startsWith('F')) {
                            category = 'mode-F';
                        } else if (file.name.startsWith('A')) {
                            category = 'mode-A';
                        } else if (file.name.startsWith('D')) {
                            category = 'mode-D';
                        }
                    } else {
                        // Skip inactive modes
                        return;
                    }
                }
            }

            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(file);
        });

        return groups;
    };

    // Render folder contents recursively
    const renderFolderContents = (folderPath: string, project: GrafcetProject | GsrsmProject, depth: number = 0) => {
        const contents = folderContents[folderPath];
        if (!contents) return null;

        const projectType = getProjectType(project);
        const allFiles = contents
            .map(item => ({
                ...item,
                fileInfo: getFileTypeInfo(item.name, item.isDirectory, projectType, project)
            }))
            .filter(item => {
                // Filter out inactive GSRSM mode folders
                if (item.isDirectory && item.fileInfo?.category === 'mode' && project && getProjectType(project) === 'gsrsm') {
                    const activatedModes = getActivatedGsrsmModes(project);
                    const allGsrsmModes = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'D1', 'D2', 'D3'];

                    if (allGsrsmModes.includes(item.name)) {
                        // Only include activated modes
                        return activatedModes.includes(item.name);
                    }
                }
                // Hide simulation files and vibe-chat.json/vibindu-chat.json
                if (item.name.endsWith('.sim') || item.name === 'simulation.json' || item.name === 'vibe-chat.json' || item.name === 'vibindu-chat.json') {
                    return false;
                }
                // Include all other files and folders
                return true;
            })
            .sort((a, b) => {
                // Sort by: directories first, then by priority, then alphabetically
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                const aPriority = a.fileInfo?.priority ?? 100;
                const bPriority = b.fileInfo?.priority ?? 100;
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                return a.name.localeCompare(b.name);
            });

        return allFiles.map(item => {
            const IconComponent = item.fileInfo?.icon;
            const isExpanded = expandedFolders.includes(item.path);
            const hasContents = item.isDirectory && folderContents[item.path];

            return (
                <NestedFolderContainer key={item.path} depth={depth}>
                    <ClickableFileItem
                        $isActive={false}
                        canOpen={item.fileInfo?.canOpen || item.isDirectory}
                        onClick={() => handleFileClick(item)}
                        onContextMenu={(e) => {
                            if (item.isDirectory) {
                                e.preventDefault();
                                e.stopPropagation();
                                setNewFileParentPath(item.path);
                                setShowNewFileDialog(true);
                            }
                        }}
                        title={item.fileInfo?.canOpen ? `Click to open ${item.fileInfo?.type}` : `${item.fileInfo?.type || 'File/Folder'} ${item.isDirectory ? 'folder' : 'file'}`}
                    >
                        {item.isDirectory && (
                            <FolderExpandIcon>
                                {isExpanded ? '▼' : '▶'}
                            </FolderExpandIcon>
                        )}
                        {IconComponent && <IconComponent />}
                        <FileName>{item.name}</FileName>
                        {item.fileInfo?.canOpen && !item.isDirectory && (
                            <FileTypeLabel>
                                {item.fileInfo?.type}
                            </FileTypeLabel>
                        )}
                    </ClickableFileItem>

                    {/* Render nested folder contents */}
                    {item.isDirectory && isExpanded && hasContents && (
                        <NestedFolderContainer depth={1}>
                            {renderFolderContents(item.path, project, depth + 1)}
                        </NestedFolderContainer>
                    )}
                </NestedFolderContainer>
            );
        });
    };

    // Load diagram from file
    const handleLoadDiagramFile = async (filePath: string) => {
        try {
            const response = await ApiService.loadDiagram({ diagramPath: filePath });

            if (response.success && response.diagram) {
                const diagram = response.diagram as unknown as GrafcetDiagram;

                // Find the current project
                const currentProject = projects.find(p => expandedProjects.includes(p.id));
                if (!currentProject) {
                    usePopupStore.getState().showWarning(
                        'No Project Selected',
                        'Please select a project first to load the diagram into.'
                    );
                    return;
                }

                // Check if diagram already exists in project (only for GRAFCET projects)
                if (getProjectType(currentProject) === 'grafcet') {
                    const grafcetProject = currentProject as GrafcetProject;
                    const existingDiagram = grafcetProject.diagrams.find((d) => d.name === diagram.name);
                    if (existingDiagram) {
                        usePopupStore.getState().showPopup(
                            'warning',
                            'Diagram Already Exists',
                            `A diagram named "${diagram.name}" already exists. Do you want to replace it?`,
                            () => {
                                // Replace existing diagram
                                updateDiagram(existingDiagram.id, diagram);
                                setCurrentDiagram(existingDiagram.id);
                                usePopupStore.getState().showSuccess(
                                    'Diagram Loaded',
                                    `Diagram "${diagram.name}" has been updated from file.`
                                );
                            }
                        );
                    } else {
                        // Add new diagram to project
                        const newDiagram = createDiagram(currentProject.id, diagram.name);
                        // Update the diagram with the loaded elements
                        updateDiagram(newDiagram.id, { elements: diagram.elements });
                        setCurrentDiagram(newDiagram.id);
                        usePopupStore.getState().showSuccess(
                            'Diagram Loaded',
                            `Diagram "${diagram.name}" has been loaded from file.`
                        );
                    }
                }
            } else {
                usePopupStore.getState().showWarning(
                    'Failed to Load Diagram',
                    response.error || 'Could not load the diagram file.'
                );
            }
        } catch (error) {
            usePopupStore.getState().showWarning(
                'Error',
                'Failed to communicate with the backend server.'
            );
        }
    };

    // Handle file click
    const handleFileClick = (item: FileSystemItem) => {
        const fileInfo = getFileTypeInfo(item.name, item.isDirectory);

        if (fileInfo && fileInfo.canOpen) {
            if (fileInfo.type === 'diagram' || fileInfo.type === 'grafcet' || fileInfo.type === 'GRAFCET' || fileInfo.type === 'Control GRAFCET') {
                // Check if this is a GRAFCET file in a full project
                const currentProject = projects.find(p => expandedProjects.includes(p.id));
                const isFullProject = currentProject && getProjectType(currentProject) === 'gsrsm';

                if (isFullProject && (fileInfo.type === 'grafcet' || fileInfo.type === 'GRAFCET' || fileInfo.type === 'Control GRAFCET')) {
                    // For GRAFCET files in GSRSM projects, load into GSRSM file store and switch to GRAFCET editor mode
                    loadGsrsmFile(item.path).then((success) => {
                        if (success) {
                            // Navigate to GRAFCET editor mode by triggering a state change
                            navigate('/', {
                                state: {
                                    editorType: 'grafcet',
                                    switchFromGsrsm: true,
                                    grafcetFile: item.path
                                }
                            });
                        } else {
                            usePopupStore.getState().showWarning(
                                'Failed to Load File',
                                'Could not load the GRAFCET file. Please check if the file exists and is valid.'
                            );
                        }
                    });
                } else {
                    // Regular diagram loading for GRAFCET projects or other diagram files
                    handleLoadDiagramFile(item.path);
                }
            } else if (fileInfo.type === 'GSRSM') {
                // Handle GSRSM file click - switch to GSRSM editor mode
                navigate('/', {
                    state: {
                        editorType: 'gsrsm',
                        switchFromGrafcet: true
                    }
                });
            } else if (item.isDirectory && (fileInfo.type === 'GSRSM Mode' || fileInfo.type === 'folder')) {
                // Handle folder expansion for GSRSM mode folders and other folders
                toggleFolderExpansion(item.path);
            }
        } else if (item.isDirectory) {
            // Handle folder navigation for non-openable folders
            toggleFolderExpansion(item.path);
        } else {
            usePopupStore.getState().showInfo(
                'File Type Not Supported',
                `Cannot open ${fileInfo?.type || 'this'} file directly. Only diagram files (.json, .grafcet) can be opened.`
            );
        }
    };

    // Render empty state
    const renderEmptyState = () => (
        <EmptyState>
            <EmptyStateIcon>
                <FiFolder />
            </EmptyStateIcon>
            <EmptyStateText>
                Welcome to VibIndu!<br />
                Create your first project to start designing automation systems.
            </EmptyStateText>
            <Button onClick={handleCreateProject}>
                <FiPlus style={{ marginRight: '8px' }} />
                Create Your First Project
            </Button>
        </EmptyState>
    );

    // Render projects and diagrams
    const renderProjects = () => (
        <>
            {projects.map(project => {
                const isExpanded = expandedProjects.includes(project.id);
                const isCurrentProject = currentProjectId === project.id;

                return (
                    <ProjectSection key={project.id}>
                        <ProjectHeader
                            $isOpen={isExpanded}
                            onClick={() => {
                                setCurrentProject(project.id);
                                toggleProjectExpansion(project.id);
                            }}
                        >
                            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                            <ProjectName>
                                {project.name}
                                <ProjectTypeIndicator projectType={getProjectType(project)}>
                                    {getProjectType(project).toUpperCase()}
                                </ProjectTypeIndicator>
                                {isCurrentProject && (
                                    <CurrentProjectIndicator title="Currently active project">
                                        <FiCheck />
                                    </CurrentProjectIndicator>
                                )}
                            </ProjectName>

                            <ActionButtonsContainer>
                                <ActionButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateDiagram(project.id);
                                    }}
                                    title="Add Diagram"
                                >
                                    <FiPlus />
                                </ActionButton>
                            </ActionButtonsContainer>
                        </ProjectHeader>

                        <FilesList isVisible={isExpanded}>
                            {/* Show project diagrams - only for GRAFCET projects */}
                            {getProjectType(project) === 'grafcet' && (project as GrafcetProject).diagrams.map(diagram => (
                                <FileItem
                                    key={diagram.id}
                                    $isActive={diagram.id === currentDiagramId}
                                    onClick={() => setCurrentDiagram(diagram.id)}
                                >
                                    <FiFile />
                                    <FileName>{diagram.name}</FileName>

                                    <ActionButtonsContainer>
                                        <ActionButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameDiagram(diagram.id, diagram.name);
                                            }}
                                            title="Rename"
                                        >
                                            <FiEdit2 />
                                        </ActionButton>
                                        <ActionButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDiagram(diagram.id, diagram.name);
                                            }}
                                            title="Delete"
                                        >
                                            <FiTrash2 />
                                        </ActionButton>
                                    </ActionButtonsContainer>
                                </FileItem>
                            ))}

                            {/* Show all folder contents */}
                            {(() => {
                                const folderContent = projectFolderContents.find(p => p.projectId === project.id);
                                if (folderContent?.contents) {
                                    const allFiles = getFilteredFiles(folderContent.contents, getProjectType(project), project);
                                    const groupedFiles = groupFilesByCategory(allFiles, project);

                                    // Define the desired order for categories, especially GSRSM modes
                                    const categoryOrder = [
                                        'project',
                                        'diagram',
                                        'mode-F',
                                        'mode-A',
                                        'mode-D',
                                        'mode',
                                        'control',
                                        'other'
                                    ];

                                    // Sort categories according to the defined order
                                    const sortedCategories = Object.entries(groupedFiles).sort(([a], [b]) => {
                                        const indexA = categoryOrder.indexOf(a);
                                        const indexB = categoryOrder.indexOf(b);
                                        // If category not in order list, put it at the end
                                        const orderA = indexA === -1 ? 999 : indexA;
                                        const orderB = indexB === -1 ? 999 : indexB;
                                        return orderA - orderB;
                                    });

                                    return sortedCategories.map(([category, files]) => {
                                        if (files.length === 0) return null;

                                        const categoryNames = {
                                            project: 'Project Files',
                                            diagram: 'Diagrams',
                                            mode: 'GSRSM Modes',
                                            'mode-F': 'F - Production Modes',
                                            'mode-A': 'A - Stop Procedures',
                                            'mode-D': 'D - Failure Modes',
                                            control: 'Control Files',
                                            other: 'Other Files'
                                        };

                                        return (
                                            <FileCategory key={category}>
                                                <CategoryHeader>
                                                    {categoryNames[category as keyof typeof categoryNames] || category}
                                                </CategoryHeader>
                                                {files.map(item => {
                                                    const IconComponent = item.fileInfo.icon;
                                                    const isExpanded = expandedFolders.includes(item.path);
                                                    const hasContents = item.isDirectory && folderContents[item.path];

                                                    return (
                                                        <div key={item.path}>
                                                            <ClickableFileItem
                                                                $isActive={false}
                                                                canOpen={item.fileInfo?.canOpen || item.isDirectory}
                                                                onClick={() => handleFileClick(item)}
                                                                onContextMenu={(e) => {
                                                                    if (item.isDirectory) {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setNewFileParentPath(item.path);
                                                                        setShowNewFileDialog(true);
                                                                    }
                                                                }}
                                                                title={item.fileInfo?.canOpen ? `Click to open ${item.fileInfo?.type}` : `${item.fileInfo?.type || 'File/Folder'} ${item.isDirectory ? 'folder' : 'file'}`}
                                                            >
                                                                {item.isDirectory && (
                                                                    <FolderExpandIcon>
                                                                        {isExpanded ? '▼' : '▶'}
                                                                    </FolderExpandIcon>
                                                                )}
                                                                {IconComponent && <IconComponent />}
                                                                <FileName>{item.name}</FileName>
                                                                {item.fileInfo?.canOpen && !item.isDirectory && (
                                                                    <FileTypeLabel>
                                                                        {item.fileInfo?.type}
                                                                    </FileTypeLabel>
                                                                )}
                                                            </ClickableFileItem>

                                                            {/* Render nested folder contents */}
                                                            {item.isDirectory && isExpanded && hasContents && (
                                                                <NestedFolderContainer depth={1}>
                                                                    {renderFolderContents(item.path, project, 1)}
                                                                </NestedFolderContainer>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </FileCategory>
                                        );
                                    });
                                }
                                return null;
                            })()}

                            {/* Show empty state if no content */}
                            {getProjectType(project) === 'grafcet' && (project as GrafcetProject).diagrams.length === 0 &&
                                !projectFolderContents.find(p => p.projectId === project.id)?.contents?.length && (
                                    <EmptyStateText>No files in this project</EmptyStateText>
                                )}
                        </FilesList>
                    </ProjectSection>
                );
            })}

            {/* Only show Create New Project button when no project is opened */}
            {!hasOpenProject && (
                <Button onClick={handleCreateProject} style={{ width: '100%', marginTop: '16px' }}>
                    Create New Project
                </Button>
            )}
        </>
    );

    return (
        <PanelContainer $isVisible={isVisible}>
            <PanelHeader>
                <PanelTitle>Project Files</PanelTitle>
                {hasOpenProject && (
                    <ActionButton
                        onClick={() => {
                            const currentProject = getCurrentProject() || gsrsmProject;
                            if (currentProject?.localPath) {
                                setNewFileParentPath(currentProject.localPath);
                                setShowNewFileDialog(true);
                            }
                        }}
                        title="New File"
                    >
                        <FiFilePlus />
                    </ActionButton>
                )}
            </PanelHeader>

            <PanelContent>
                {projects.length === 0 ? renderEmptyState() : renderProjects()}
            </PanelContent>

            {/* New File Dialog */}
            <NewFileDialog
                isOpen={showNewFileDialog}
                parentPath={newFileParentPath}
                onClose={() => setShowNewFileDialog(false)}
                onFileCreated={async (filePath, fileType) => {
                    // Refresh the folder contents
                    const currentProject = getCurrentProject() || gsrsmProject;
                    if (currentProject?.localPath) {
                        await loadProjectFolderContents(currentProject.id, currentProject.localPath);
                    }
                    // Show success message
                    usePopupStore.getState().showPopup(
                        'success',
                        'File Created',
                        `Successfully created ${fileType === 'folder' ? 'folder' : 'file'}: ${filePath.split(/[\/]/).pop()}`
                    );
                }}
            />
        </PanelContainer>
    );
};

export default FilesPanel;
