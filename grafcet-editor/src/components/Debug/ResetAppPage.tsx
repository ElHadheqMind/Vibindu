import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiRefreshCw, FiArrowLeft, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { resetToDefaultState, loadAppState } from '../../utils/stateRestoration';
import { useProjectStore } from '../../store/useProjectStore';
import { useElementsStore } from '../../store/useElementsStore';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { usePopupStore } from '../../store/usePopupStore';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, ${props => props.theme.background} 0%, ${props => props.theme.surfaceAlt} 100%);
`;

const ResetContainer = styled.div`
  background: ${props => props.theme.surface};
  border-radius: 16px;
  padding: 48px;
  box-shadow: ${props => props.theme.shadow.large};
  border: 1px solid ${props => props.theme.border};
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  color: ${props => props.theme.text};
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.textSecondary};
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.6;
`;

const WarningBox = styled.div`
  background: ${props => props.theme.warning}20;
  border: 2px solid ${props => props.theme.warning};
  border-radius: 12px;
  padding: 24px;
  margin: 32px 0;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
`;

const WarningIcon = styled.div`
  color: ${props => props.theme.warning};
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  color: ${props => props.theme.warning};
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const WarningText = styled.p`
  color: ${props => props.theme.text};
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

const WarningList = styled.ul`
  color: ${props => props.theme.text};
  margin: 0;
  padding-left: 20px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all ${props => props.theme.transition.fast};
  min-width: 140px;
  justify-content: center;

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: ${props.theme.error};
          color: white;
          &:hover {
            background: ${props.theme.error}dd;
            transform: translateY(-1px);
          }
        `;
      case 'secondary':
        return `
          background: ${props.theme.surface};
          color: ${props.theme.text};
          border: 2px solid ${props.theme.border};
          &:hover {
            background: ${props.theme.surfaceAlt};
            border-color: ${props.theme.primary};
          }
        `;
      default:
        return `
          background: ${props.theme.primary};
          color: white;
          &:hover {
            background: ${props.theme.primaryHover};
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const DebugInfo = styled.div`
  background: ${props => props.theme.surfaceAlt};
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  text-align: left;
  border: 1px solid ${props => props.theme.border};
`;

const DebugTitle = styled.h3`
  color: ${props => props.theme.primary};
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DebugSection = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DebugLabel = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 4px;
`;

const DebugValue = styled.div`
  color: ${props => props.theme.text};
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background: ${props => props.theme.surface};
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.border};
  word-break: break-all;
`;

const ResetAppPage: React.FC = () => {
  const navigate = useNavigate();

  // Get current store states
  const projectStore = useProjectStore();
  const elementsStore = useElementsStore();
  const gsrsmStore = useGsrsmStore();

  // Get app state from localStorage
  const appState = loadAppState();

  const handleReset = () => {
    usePopupStore.getState().showConfirm(
      'FINAL CONFIRMATION',
      'Are you absolutely sure you want to reset the application?\n\n' +
      'This will permanently delete:\n' +
      '• All projects and diagrams\n' +
      '• All saved settings\n' +
      '• All application data\n\n' +
      'This action CANNOT be undone!',
      [
        {
          label: 'Go Back',
          action: 'cancel',
          variant: 'secondary'
        },
        {
          label: 'Reset Application',
          action: 'confirm',
          variant: 'danger'
        }
      ],
      (action) => {
        if (action === 'confirm') {
          resetToDefaultState();
        }
      }
    );
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <PageContainer>
      <ResetContainer>
        <Header>
          <Title>
            <FiRefreshCw />
            Reset Application
          </Title>
          <Subtitle>
            Reset the GRAFCET & GSRSM Editor to its default state
          </Subtitle>
        </Header>

        <WarningBox>
          <WarningIcon>
            <FiAlertTriangle />
          </WarningIcon>
          <WarningContent>
            <WarningTitle>⚠️ WARNING: This action is irreversible!</WarningTitle>
            <WarningText>
              Resetting the application will permanently delete all your data and return the application to its initial state.
            </WarningText>
            <WarningText>This includes:</WarningText>
            <WarningList>
              <li>All GRAFCET and GSRSM projects</li>
              <li>All diagrams and their content</li>
              <li>All saved settings and preferences</li>
              <li>All cached data and application state</li>
              <li>All user customizations</li>
            </WarningList>
            <WarningText>
              <strong>Make sure to export any important projects before proceeding!</strong>
            </WarningText>
          </WarningContent>
        </WarningBox>

        <DebugInfo>
          <DebugTitle>
            <FiInfo />
            Current Application State
          </DebugTitle>

          <DebugSection>
            <DebugLabel>App State (localStorage)</DebugLabel>
            <DebugValue>{JSON.stringify(appState, null, 2)}</DebugValue>
          </DebugSection>

          <DebugSection>
            <DebugLabel>Project Store</DebugLabel>
            <DebugValue>{JSON.stringify({
              currentProjectId: projectStore.currentProjectId,
              currentDiagramId: projectStore.currentDiagramId,
              projectsCount: projectStore.projects.length,
              projects: projectStore.projects.map(p => ({ id: p.id, name: p.name, diagramsCount: p.diagrams.length }))
            }, null, 2)}</DebugValue>
          </DebugSection>

          <DebugSection>
            <DebugLabel>Elements Store</DebugLabel>
            <DebugValue>{JSON.stringify({
              elementsCount: elementsStore.elements.length,
              selectedCount: elementsStore.selectedElementIds.length,
              elementTypes: elementsStore.elements.reduce((acc, el) => {
                acc[el.type] = (acc[el.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            }, null, 2)}</DebugValue>
          </DebugSection>

          <DebugSection>
            <DebugLabel>GSRSM Store</DebugLabel>
            <DebugValue>{JSON.stringify({
              hasProject: !!gsrsmStore.project,
              projectName: gsrsmStore.project?.name || null,
              selectedModes: gsrsmStore.selectedModeIds.length
            }, null, 2)}</DebugValue>
          </DebugSection>
        </DebugInfo>

        <ButtonGroup>
          <Button variant="secondary" onClick={handleGoBack}>
            <FiArrowLeft />
            Go Back
          </Button>
          <Button variant="danger" onClick={handleReset}>
            <FiRefreshCw />
            Reset Application
          </Button>
        </ButtonGroup>
      </ResetContainer>
    </PageContainer>
  );
};

export default ResetAppPage;
