import React from 'react';
import styled from 'styled-components';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { useGsrsmStore } from '../../store/useGsrsmStore';

const ZoomControlsContainer = styled.div`
  position: absolute;
  bottom: 40px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${props => props.theme.surfaceRaised};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
  z-index: 100;
`;

const ZoomButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.surfaceHover};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ZoomDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.surfaceHover};
  }
`;

const GsrsmZoomControls: React.FC = () => {
  const { scale, zoomIn, zoomOut, resetView, setScale } = useGsrsmStore();

  // Format scale as percentage
  const scalePercentage = Math.round(scale * 100);

  // Custom zoom levels
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

  // Handle zoom display click to show zoom level options
  const handleZoomDisplayClick = () => {
    // Create context menu options for zoom levels
    const options = zoomLevels.map(level => ({
      label: `${level * 100}%`,
      action: () => setScale(level),
    }));

    // Show context menu at zoom display position
    const rect = document.getElementById('Gsrsm-zoom-display')?.getBoundingClientRect();
    if (rect) {
      useGsrsmStore.getState().showContextMenu(
        { x: rect.left, y: rect.top - 100 },
        options
      );
    }
  };

  // Test function to simulate Agent update
  const handleTestAgent = () => {
    // 1. Define a sample "Agent Generated" Gsrsm structure
    // This simulates the JSON the agent would produce: only specific modes and connections
    const agentGeneratedModes = [
      { id: 'A1', type: 'normal' },
      { id: 'F1', type: 'normal' },
      { id: 'D1', type: 'normal' }
    ];

    const agentGeneratedConnections = [
      { id: 'A1-F1', fromMode: 'A1', toMode: 'F1' },
      { id: 'F1-D1', fromMode: 'F1', toMode: 'D1' }
      // Note: We are missing 'D1-A1' or others, and many A/F/D modes
    ];

    // 2. Map to full internal structure (preserving layout info if needed, or resetting)
    // We get current modes to preserve category/position if possible, or just use standard
    const currentProject = useGsrsmStore.getState().project;
    if (!currentProject) return;

    // Helper to get standard or existing mode data
    const getModeData = (id: string) => {
      const existing = currentProject.diagram.modes.find(m => m.id === id);
      if (existing) return existing;
      // Fallback to standard creation if missing (would require importing createGsrsmMode, but we can just use existing for this test if they exist)
      return null;
    };

    const newModes = agentGeneratedModes.map(m => {
      const existing = getModeData(m.id);
      if (existing) return existing;
      // If not found, we skip or would need to create. 
      // For this test, we assume the user has a "Full" project and we are "Filtering" it down.
      return null;
    }).filter(Boolean) as any[];

    // 3. Update the Store
    // This immediately updates the UI to show only the selected modes and connections
    useGsrsmStore.getState().updateProject({
      diagram: {
        ...currentProject.diagram,
        modes: newModes,
        connections: agentGeneratedConnections as any // Cast for test simplicity
      }
    });

    console.log("🤖 Agent Test: Updated Gsrsm with restricted modes/connections");
  };

  return (
    <ZoomControlsContainer>
      <ZoomButton onClick={handleTestAgent} title="Test Agent Generation" style={{ marginBottom: '8px', color: '#8b5cf6' }}>
        <FiMaximize style={{ transform: 'rotate(45deg)' }} />
      </ZoomButton>

      <ZoomButton onClick={zoomIn} title="Zoom In">
        <FiZoomIn />
      </ZoomButton>

      <ZoomDisplay
        id="Gsrsm-zoom-display"
        onClick={handleZoomDisplayClick}
        title="Click to select zoom level"
      >
        {scalePercentage}%
      </ZoomDisplay>

      <ZoomButton onClick={zoomOut} title="Zoom Out">
        <FiZoomOut />
      </ZoomButton>

      <ZoomButton onClick={resetView} title="Reset View">
        <FiMaximize />
      </ZoomButton>
    </ZoomControlsContainer>
  );
};

export default GsrsmZoomControls;
