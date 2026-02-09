import React from 'react';
import styled from 'styled-components';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { useEditorStore } from '../../store/useEditorStore';

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
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    border-color: ${props => props.theme.primary};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ZoomDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.surfaceAlt};
  color: ${props => props.theme.text};
  font-size: 12px;
  font-weight: 600;
  user-select: none;
`;

const ZoomControls: React.FC = () => {
  const { scale, zoomIn, zoomOut, resetView, setScale } = useEditorStore();
  
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
    const rect = document.getElementById('zoom-display')?.getBoundingClientRect();
    if (rect) {
      useEditorStore.getState().showContextMenu(
        { x: rect.left, y: rect.top - 100 },
        options
      );
    }
  };
  
  return (
    <ZoomControlsContainer>
      <ZoomButton onClick={zoomIn} title="Zoom In">
        <FiZoomIn size={18} />
      </ZoomButton>
      
      <ZoomDisplay 
        id="zoom-display"
        onClick={handleZoomDisplayClick}
        title="Click to select zoom level"
      >
        {scalePercentage}%
      </ZoomDisplay>
      
      <ZoomButton onClick={zoomOut} title="Zoom Out">
        <FiZoomOut size={18} />
      </ZoomButton>
      
      <ZoomButton onClick={resetView} title="Reset View">
        <FiMaximize size={16} />
      </ZoomButton>
    </ZoomControlsContainer>
  );
};

export default ZoomControls;
