import React, { useState } from 'react';
import styled from 'styled-components';
import { FiFolder, FiX, FiSearch, FiTrash2 } from 'react-icons/fi';
import FolderBrowser from './FolderBrowser';
import { ApiService } from '../../services/apiService';
import { useProjectStore } from '../../store/useProjectStore';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { usePopupStore } from '../../store/usePopupStore';
import { GrafcetProject, GsrsmProject } from '../../models/types';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid ${({ theme }) => theme.border};
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.menuHover};
    color: ${({ theme }) => theme.text};
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const HeaderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.text};
`;

const HeaderSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 0 0;
`;

const FormSection = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.text};
`;

const BrowseSection = styled.div`
  margin-bottom: 1rem;
`;

const BrowseControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;


const BrowserToggle = styled.button`
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.menuHover};
    border-color: ${({ theme }) => theme.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PathInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
  }
`;

const SelectedPathDisplay = styled.div`
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-family: monospace;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  word-break: break-all;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  margin-bottom: 1rem;

  svg {
    color: ${({ theme }) => theme.textSecondary};
  }

  input {
    flex: 1;
    background: none;
    border: none;
    color: ${({ theme }) => theme.text};
    font-size: 0.9rem;
    outline: none;
    
    &::placeholder {
      color: ${({ theme }) => theme.textTertiary};
    }
  }
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin-bottom: 1.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 3px;
  }
`;

const ProjectItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: ${({ theme, $selected }) => $selected ? theme.primaryLight : theme.surfaceAlt};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.primary : theme.border};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.primary};
    background: ${({ theme, $selected }) => $selected ? theme.primaryLight : theme.menuHover};
  }

  svg {
    color: ${({ theme }) => theme.primary};
    font-size: 1.25rem;
  }
`;

const ProjectInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProjectName = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProjectMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  gap: 1rem;
`;

const ProjectType = styled.span`
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.7rem;
  background: ${({ theme }) => theme.border};
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.error || '#e53935'}20;
    color: ${({ theme }) => theme.error || '#e53935'};
  }
  
  svg {
    font-size: 1rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  background: ${({ theme, primary }) => primary ? theme.primary : theme.surface};
  color: ${({ theme, primary }) => primary ? 'white' : theme.text};
  border: 1px solid ${({ theme, primary }) => primary ? theme.primary : theme.border};
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme, primary }) => primary ? theme.primaryDark : theme.menuHover};
    border-color: ${({ theme }) => theme.primary};
  }

  &:disabled {
    background: ${({ theme }) => theme.textTertiary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpenProjectModal: React.FC<OpenProjectModalProps> = ({ isOpen, onClose }) => {
  const {
    remoteProjects,
    fetchRemoteProjects,
    loadProject,
    setCurrentProject,
    setCurrentDiagram
  } = useProjectStore();
  const { loadProject: loadGsrsmProject } = useGsrsmStore();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [manualPath, setManualPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBrowser, setShowBrowser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch remote projects on mount
  React.useEffect(() => {
    if (isOpen) {
      fetchRemoteProjects();
    }
  }, [isOpen, fetchRemoteProjects]);

  if (!isOpen) return null;

  // Filter projects based on search query
  const filteredProjects = remoteProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle folder selection from browser
  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
    setManualPath(path);
  };

  // Handle manual path input
  const handleManualPathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const path = event.target.value;
    setManualPath(path);
    setSelectedFolder(path);
  };

  const handleProjectClick = (project: any) => {
    setSelectedFolder(project.path);
    setManualPath(project.path);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle project deletion
  const handleDeleteProject = async (project: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent project selection

    usePopupStore.getState().showConfirm(
      'Delete Project',
      `Are you sure you want to delete the project "${project.name}"?\n\nThis action cannot be undone and will permanently delete all project files.`,
      [
        { label: 'Cancel', action: 'cancel', variant: 'secondary' },
        { label: 'Delete', action: 'delete', variant: 'danger' }
      ],
      async (action) => {
        if (action !== 'delete') return;

        try {
          const response = await ApiService.deleteProject(project.path);

          if (response.success) {
            usePopupStore.getState().showSuccess(
              'Project Deleted',
              `Project "${project.name}" has been deleted successfully.`
            );

            // Refresh the project list
            fetchRemoteProjects();

            // Clear selection if deleted project was selected
            if (selectedFolder === project.path) {
              setSelectedFolder('');
              setManualPath('');
            }
          } else {
            usePopupStore.getState().showWarning(
              'Delete Failed',
              response.error || 'Failed to delete the project.'
            );
          }
        } catch (error) {
          usePopupStore.getState().showWarning(
            'Error',
            'Failed to communicate with the backend server.'
          );
        }
      }
    );
  };

  // Get the final selected path
  const getFinalPath = (): string => {
    return manualPath.trim() || selectedFolder;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle project opening
  const handleOpenProject = async () => {
    const projectPath = getFinalPath();

    if (!projectPath) {
      usePopupStore.getState().showWarning(
        'No Path Selected',
        'Please select a project folder or enter a path manually.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.loadProject({ projectPath });

      if (response.success && response.project) {
        // Determine project type based on project structure
        const grafcetProject = response.project as GrafcetProject;
        const isGrafcetProject = (grafcetProject as any).diagrams !== undefined;

        if (isGrafcetProject) {
          loadProject(grafcetProject);
          setCurrentProject(grafcetProject.id);
          if (grafcetProject.diagrams && grafcetProject.diagrams.length > 0) {
            setCurrentDiagram(grafcetProject.diagrams[0].id);
          }
        } else {
          const gsrsmProject = response.project as GsrsmProject;
          loadGsrsmProject(gsrsmProject);
          loadProject(gsrsmProject as any);
        }

        usePopupStore.getState().showSuccess(
          'Project Opened',
          `Project "${response.project.name}" opened successfully.`
        );

        onClose();

        // Dispatch event for MainApp to react
        window.dispatchEvent(new CustomEvent('projectOpened', {
          detail: {
            editorType: isGrafcetProject ? 'grafcet' : 'gsrsm'
          }
        }));
      } else {
        usePopupStore.getState().showWarning(
          'Failed to Open Project',
          response.error || 'The selected folder does not contain a valid project.'
        );
      }
    } catch {
      usePopupStore.getState().showWarning(
        'Error',
        'Failed to communicate with the backend server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const finalPath = getFinalPath();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>

        <Header>
          <HeaderTitle>Open Existing Project</HeaderTitle>
          <HeaderSubtitle>Discover and open your previous projects</HeaderSubtitle>
        </Header>

        <FormSection>
          <Label>Find Project</Label>
          <SearchBar>
            <FiSearch />
            <input
              type="text"
              placeholder="Search projects by name or path..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </SearchBar>

          <ProjectList>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, idx) => (
                <ProjectItem
                  key={`${project.path}-${idx}`}
                  $selected={selectedFolder === project.path}
                  onClick={() => handleProjectClick(project)}
                >
                  <FiFolder />
                  <ProjectInfo>
                    <ProjectName>{project.name}</ProjectName>
                    <ProjectMeta>
                      <ProjectType>{project.type}</ProjectType>
                      <span>Created: {formatDate(project.lastModified)}</span>
                    </ProjectMeta>
                  </ProjectInfo>
                  <DeleteButton
                    onClick={(e) => handleDeleteProject(project, e)}
                    title="Delete project"
                  >
                    <FiTrash2 />
                  </DeleteButton>
                </ProjectItem>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {searchQuery ? 'No projects match your search.' : 'No projects found on server.'}
              </div>
            )}
          </ProjectList>

          <Label>Advanced Location</Label>
          <BrowseSection>
            <BrowseControls>
              <BrowserToggle onClick={() => setShowBrowser(!showBrowser)}>
                <FiFolder />
                {showBrowser ? 'Hide' : 'Show'} Folder Browser
              </BrowserToggle>

              <PathInput
                type="text"
                style={{ flex: 1 }}
                placeholder="Or enter project folder path manually"
                value={manualPath}
                onChange={handleManualPathChange}
              />
            </BrowseControls>
          </BrowseSection>

          {showBrowser && (
            <FolderBrowser
              onFolderSelect={handleFolderSelect}
              selectedPath={selectedFolder}
            />
          )}

          {finalPath && (
            <div style={{ marginTop: '1rem' }}>
              <Label>Selected Project Path:</Label>
              <SelectedPathDisplay>
                {finalPath}
              </SelectedPathDisplay>
            </div>
          )}
        </FormSection>

        <ActionButtons>
          <ActionButton onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            primary
            onClick={handleOpenProject}
            disabled={!finalPath || isLoading}
          >
            {isLoading ? 'Opening...' : 'Open Project'}
          </ActionButton>
        </ActionButtons>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default OpenProjectModal;
