import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { FiInfo, FiDownload, FiImage } from 'react-icons/fi';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { usePopupStore } from '../../store/usePopupStore';
import { useLanguage } from '../../context/LanguageContext';
import GsrsmCanvas from './GsrsmCanvas';
import { exportGsrsmToPdf, exportToPng } from '../../utils/exportUtils';
import { Stage as KonvaStage } from 'konva/lib/Stage';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.background};
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background-color: ${props => props.theme.surfaceRaised};
  border-bottom: 1px solid ${props => props.theme.border};
  box-shadow: 0 2px 4px ${props => props.theme.shadowLight};
  z-index: 10;
`;

const ToolbarTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-right: 20px;
  color: ${props => props.theme.text};
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: ${props => props.active ? props.theme.primaryLight : 'transparent'};
  color: ${props => props.active ? props.theme.primary : props.theme.text};
  border: 1px solid ${props => props.active ? props.theme.primary : props.theme.border};
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;

  &:hover {
    background-color: ${props => props.active ? props.theme.primaryLight : props.theme.surfaceAlt};
    border-color: ${props => props.active ? props.theme.primary : props.theme.primary};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 16px;
  }
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  background-color: ${props => props.theme.surfaceRaised};
  border-top: 1px solid ${props => props.theme.border};
  padding: 0 16px;
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
`;

const GsrsmEditor: React.FC = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<KonvaStage | null>(null);
  const { t } = useLanguage();

  const {
    project,
    ensureStandardModes
  } = useGsrsmStore();

  // Ensure standard modes exist when editor mounts or project changes
  useEffect(() => {
    if (project) {
      ensureStandardModes();
    }
  }, [project?.id, ensureStandardModes]); // Only run when project ID changes to avoid loops if ensureStandardModes updates project ref


  const { showInfo, showSuccess } = usePopupStore();

  // Handle export to PDF
  const handleExportToPdf = async () => {
    if (!project) {
      showInfo('No Project', 'Please create a Gsrsm project first.');
      return;
    }

    try {
      await exportGsrsmToPdf(stageRef as React.RefObject<KonvaStage>, project.name, { hideGrid: true });
      showSuccess('Export Successful', 'Gsrsm diagram exported to PDF successfully.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showInfo('Export Failed', 'Failed to export Gsrsm diagram to PDF. Please try again.');
    }
  };

  // Handle export to PNG
  const handleExportToPng = () => {
    if (!project) {
      showInfo('No Project', 'Please create a Gsrsm project first.');
      return;
    }

    try {
      // Since exportToPng expects a GrafcetDiagram, we need to mock it or update exportToPng
      // But checking exportToPng signature: it takes GrafcetDiagram.
      // For Gsrsm, we might want to just pass an object with name property which is what exportToPng mostly uses for filename.
      // Let's create a minimal object conforming to the interface just for the name, or update exportToPng to take IDiagram or similar.
      // Given existing code, let's cast or construct.
      const mockDiagram = { name: project.name } as any;
      exportToPng(stageRef as React.RefObject<KonvaStage>, mockDiagram, { hideGrid: true });
      showSuccess('Export Successful', 'Gsrsm diagram exported to PNG successfully.');
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      showInfo('Export Failed', 'Failed to export Gsrsm diagram to PNG. Please try again.');
    }
  };

  // No longer auto-initializing Gsrsm project here to avoid resets on refresh.
  // Project initialization should happen in MainApp.tsx or through user action.
  useEffect(() => {
    // Update canvas size on window resize
    const handleResize = () => {
      const container = document.getElementById('Gsrsm-canvas-container');
      if (container) {
        setCanvasSize({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [project]);

  // The initializeGsrsmModes function was removed to prevent accidental resets.
  // Standard modes are now part of the project template or loaded from disk.

  return (
    <EditorContainer>
      <ToolbarContainer>
        <ToolbarTitle>{t('COMMON.Gsrsm_EDITOR')}</ToolbarTitle>

        <ToolbarButton onClick={() => showInfo(t('COMMON.ABOUT_Gsrsm'), t('COMMON.ABOUT_TEXT'))}>
          <FiInfo />
          <span>{t('COMMON.ABOUT_Gsrsm')}</span>
        </ToolbarButton>

        <ToolbarButton onClick={handleExportToPng}>
          <FiImage />
          <span>{t('COMMON.EXPORT_PNG')}</span>
        </ToolbarButton>

        <ToolbarButton onClick={handleExportToPdf}>
          <FiDownload />
          <span>{t('COMMON.EXPORT_PDF')}</span>
        </ToolbarButton>
      </ToolbarContainer>

      <CanvasContainer id="Gsrsm-canvas-container">
        <GsrsmCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          stageRef={stageRef}
        />
      </CanvasContainer>

      <StatusBar>
        <div>
          {t('COMMON.Gsrsm_DIAGRAM')}
        </div>
        <div>
          {project?.diagram?.modes?.length || 0} {t('COMMON.MODES')}
        </div>
      </StatusBar>
    </EditorContainer>
  );
};

export default GsrsmEditor;
