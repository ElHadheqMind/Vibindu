import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FiArrowLeft, FiGrid, FiLayout, FiCheck, FiFolder, FiExternalLink, FiUpload, FiX, FiZap } from 'react-icons/fi';
import { useProjectStore } from '../../store/useProjectStore';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { ApiService } from '../../services/apiService';
import FolderBrowser from '../UI/FolderBrowser';
import { usePopupStore } from '../../store/usePopupStore';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, ${props => props.theme.background} 0%, ${props => props.theme.surfaceAlt} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  position: relative;
  scroll-behavior: smooth;

  /* Ensure proper scrolling on all screen sizes */
  @media (max-height: 900px) {
    padding: 15px;
  }

  @media (max-height: 700px) {
    padding: 10px;
  }

  @media (max-width: 768px) {
    padding: 10px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
`;

const CreateProjectContainer = styled.div`
  width: 800px;
  max-width: 95%;
  background-color: ${props => props.theme.surfaceRaised};
  border-radius: 16px;
  box-shadow: 0 20px 60px ${props => props.theme.shadow};
  overflow: hidden;
  animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  margin: 0 auto;
  flex-shrink: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);

  /* Responsive adjustments */
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
    max-height: calc(100vh - 20px);
  }

  @media (max-height: 800px) {
    margin: 0 auto;
    max-height: calc(100vh - 30px);
  }

  @media (max-height: 700px) {
    border-radius: 8px;
    max-height: calc(100vh - 20px);
  }

  @media (max-height: 600px) {
    max-height: calc(100vh - 16px);
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.primaryDark} 100%);
  color: white;
  padding: 32px;
  position: relative;
  flex-shrink: 0;

  @media (max-height: 700px) {
    padding: 24px;
  }

  @media (max-height: 600px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
`;

const Content = styled.div`
  padding: 40px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scroll-behavior: smooth;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-height: 800px) {
    padding: 24px;
  }

  @media (max-height: 700px) {
    padding: 20px;
  }

  @media (max-height: 600px) {
    padding: 16px;
  }
`;

const FormSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 12px;
  font-size: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 16px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 16px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const ProjectTypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const ProjectTypeCard = styled.div<{ selected: boolean }>`
  position: relative;
  padding: 20px;
  border: 2px solid ${props => props.selected ? props.theme.primary : props.theme.border};
  border-radius: 12px;
  background-color: ${props => props.selected ? props.theme.primary + '10' : props.theme.surface};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.shadow};
  }
`;

const SelectedIndicator = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background-color: ${props => props.theme.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
`;

const ProjectTypeIcon = styled.div<{ selected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${props => props.selected ? props.theme.primary : props.theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: ${props => props.selected ? 'white' : props.theme.textSecondary};
  font-size: 24px;
  transition: all 0.2s;
`;

const ProjectTypeName = styled.h3<{ selected: boolean }>`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.selected ? props.theme.primary : props.theme.text};
`;

const ProjectTypeDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  line-height: 1.4;
`;

const FileUploadArea = styled.div`
  border: 2px dashed ${props => props.theme.border};
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  background-color: ${props => props.theme.surface};
  transition: border-color 0.2s, background-color 0.2s;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.primary};
    background-color: ${props => props.theme.primary}10;
  }
`;

const UploadIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.theme.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${props => props.theme.primary};
  font-size: 24px;
`;

const UploadText = styled.p`
  margin: 0 0 8px 0;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const UploadSubtext = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
`;

const FileList = styled.div`
  margin-top: 16px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: ${props => props.theme.surface};
  border-radius: 6px;
  margin-bottom: 8px;
`;

const FileName = styled.span`
  color: ${props => props.theme.text};
  font-size: 14px;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.error};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.theme.error}20;
  }
`;

const BrowseSection = styled.div`
  margin-bottom: 16px;
`;

const BrowseControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BrowseButton = styled.button`
  padding: 10px 16px;
  background-color: ${props => props.theme.surface};
  border: 2px solid ${props => props.theme.border};
  border-radius: 6px;
  color: ${props => props.theme.textSecondary};
  cursor: not-allowed;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.6;
`;

const BrowserToggle = styled.button`
  padding: 10px 16px;
  background-color: ${props => props.theme.primary};
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.primaryDark};
  }
`;

const PathInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 6px;
  font-size: 14px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const SelectedPath = styled.div`
  padding: 12px 16px;
  background-color: ${props => props.theme.primary}10;
  border: 1px solid ${props => props.theme.primary}30;
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 14px;
  margin-top: 12px;
`;

const GenerateButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.primaryDark} 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${props => props.theme.primary}40;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

type ProjectType = 'grafcet' | 'gsrsm';

const CreateAIProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ProjectType>('grafcet');
  const [projectName, setProjectName] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [manualPath, setManualPath] = useState('');
  const [showBrowser, setShowBrowser] = useState(true);

  // Check backend availability on mount
  useEffect(() => {
    const checkBackend = async () => {
      const isAvailable = await ApiService.checkHealth();
      setBackendAvailable(isAvailable);
    };

    checkBackend();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateProject = () => {
    // Show "coming soon" popup
    usePopupStore.getState().showInfo(
      'AI Project Generation',
      'This feature will be available soon! We are working on implementing AI-powered project generation based on your specifications.'
    );
  };

  const handleFolderSelect = (folderPath: string) => {
    setSelectedFolder(folderPath);
    setManualPath(''); // Clear manual path when folder is selected
  };

  const handleManualPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualPath(e.target.value);
    setSelectedFolder(''); // Clear selected folder when manual path is entered
  };

  const handleBrowseWithExplorer = () => {
    // This will be implemented later
  };

  return (
    <PageContainer>
      <CreateProjectContainer>
        <Header>
          <BackButton onClick={() => navigate('/')}>
            <FiArrowLeft size={20} />
          </BackButton>
          <HeaderContent>
            <Title>
              <FiZap />
              Generate Project with AI
            </Title>
            <Subtitle>
              Describe your project requirements and let AI create the initial structure for you
            </Subtitle>
          </HeaderContent>
        </Header>

        <Content>
          <FormSection>
            <Label>Project Type</Label>
            <ProjectTypeGrid>
              <ProjectTypeCard
                selected={selectedType === 'grafcet'}
                onClick={() => setSelectedType('grafcet')}
              >
                {selectedType === 'grafcet' && (
                  <SelectedIndicator>
                    <FiCheck />
                  </SelectedIndicator>
                )}
                <ProjectTypeIcon selected={selectedType === 'grafcet'}>
                  <FiGrid />
                </ProjectTypeIcon>
                <ProjectTypeName selected={selectedType === 'grafcet'}>
                  GRAFCET Project
                </ProjectTypeName>
                <ProjectTypeDescription>
                  AI will generate sequential control diagrams with steps, transitions, and actions
                </ProjectTypeDescription>
              </ProjectTypeCard>

              <ProjectTypeCard
                selected={selectedType === 'gsrsm'}
                onClick={() => setSelectedType('gsrsm')}
              >
                {selectedType === 'gsrsm' && (
                  <SelectedIndicator>
                    <FiCheck />
                  </SelectedIndicator>
                )}
                <ProjectTypeIcon selected={selectedType === 'gsrsm'}>
                  <FiLayout />
                </ProjectTypeIcon>
                <ProjectTypeName selected={selectedType === 'gsrsm'}>
                  GSRSM Project
                </ProjectTypeName>
                <ProjectTypeDescription>
                  AI will design operational mode diagrams for automated systems
                </ProjectTypeDescription>
              </ProjectTypeCard>
            </ProjectTypeGrid>
          </FormSection>

          <FormSection>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              type="text"
              placeholder="Enter your project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
          </FormSection>

          <FormSection>
            <Label htmlFor="specifications">Project Specifications (Cahier de Charge)</Label>
            <TextArea
              id="specifications"
              placeholder="Describe your project requirements in detail. For example:
- What type of system are you controlling?
- What are the main steps in your process?
- What sensors and actuators are involved?
- What are the safety requirements?
- Any specific timing or sequencing requirements?"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
            />
          </FormSection>

          <FormSection>
            <Label>Additional Files (Optional)</Label>
            <FileUploadArea onClick={() => document.getElementById('fileInput')?.click()}>
              <UploadIcon>
                <FiUpload />
              </UploadIcon>
              <UploadText>Upload supporting documents</UploadText>
              <UploadSubtext>
                Add technical drawings, specifications, or reference documents (PDF, DOC, TXT, images)
              </UploadSubtext>
            </FileUploadArea>
            <input
              id="fileInput"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {uploadedFiles.length > 0 && (
              <FileList>
                {uploadedFiles.map((file, index) => (
                  <FileItem key={index}>
                    <FileName>{file.name}</FileName>
                    <RemoveFileButton onClick={() => removeFile(index)}>
                      <FiX size={16} />
                    </RemoveFileButton>
                  </FileItem>
                ))}
              </FileList>
            )}
          </FormSection>

          <FormSection>
            <Label>Save Location</Label>

            <BrowseSection>
              <BrowseControls>
                <BrowseButton onClick={handleBrowseWithExplorer} disabled>
                  <FiExternalLink />
                  Browse with File Explorer (Soon)
                </BrowseButton>

                <BrowserToggle onClick={() => setShowBrowser(!showBrowser)}>
                  <FiFolder />
                  {showBrowser ? 'Hide' : 'Show'} Folder Browser
                </BrowserToggle>
              </BrowseControls>

              <BrowseControls>
                <PathInput
                  type="text"
                  placeholder="Or enter folder path manually (e.g., C:\Users\YourName\Documents\Projects)"
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

            {(selectedFolder || manualPath) && (
              <SelectedPath>
                Selected: {selectedFolder || manualPath}
              </SelectedPath>
            )}
          </FormSection>

          <GenerateButton
            onClick={handleGenerateProject}
            disabled={!projectName.trim() || !specifications.trim() || isGenerating}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <FiZap />
                Generate Project with AI
              </>
            )}
          </GenerateButton>
        </Content>
      </CreateProjectContainer>
    </PageContainer>
  );
};

export default CreateAIProjectPage;
