import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiX, FiImage, FiVideo, FiDownload, FiMaximize2, FiRefreshCw } from 'react-icons/fi';
import { ApiService } from '../../services/apiService';

interface MediaViewerProps {
  filePath: string;
  onClose: () => void;
}

const ViewerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.surface};
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${props => props.theme.surfaceAlt};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.text};
  font-weight: 500;
  
  svg {
    color: ${props => props.theme.primary};
  }
`;

const FileName = styled.span`
  font-size: 14px;
`;

const FilePath = styled.span`
  font-size: 11px;
  color: ${props => props.theme.textSecondary};
  margin-left: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  
  &:hover {
    background-color: ${props => props.theme.surfaceRaised};
    color: ${props => props.theme.text};
  }
  
  svg {
    font-size: 16px;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  padding: 24px;
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const MediaVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const LoadingState = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ErrorState = styled.div`
  color: #f44336;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const isVideoFile = (path: string): boolean => {
  const lower = path.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi');
};

const isImageFile = (path: string): boolean => {
  const lower = path.toLowerCase();
  return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || 
         lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.bmp');
};

const MediaViewer: React.FC<MediaViewerProps> = ({ filePath, onClose }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileName = filePath.split(/[/\\]/).pop() || 'Unknown';
  const isVideo = isVideoFile(filePath);
  const isImage = isImageFile(filePath);

  const loadMedia = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.getMediaFile(filePath);
      if (response.success && response.dataUrl) {
        setMediaUrl(response.dataUrl);
      } else {
        setError(response.error || 'Failed to load media file');
      }
    } catch (err) {
      setError('Failed to load media file');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filePath]);

  const handleDownload = () => {
    if (mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleFullscreen = () => {
    if (mediaUrl) {
      const win = window.open();
      if (win) {
        if (isVideo) {
          win.document.write(`
            <html><head><title>${fileName}</title></head>
            <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <video src="${mediaUrl}" controls autoplay style="max-width:100%;max-height:100vh;"/>
            </body></html>
          `);
        } else {
          win.document.write(`
            <html><head><title>${fileName}</title></head>
            <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${mediaUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;"/>
            </body></html>
          `);
        }
      }
    }
  };

  return (
    <ViewerContainer>
      <Header>
        <TitleSection>
          {isVideo ? <FiVideo /> : <FiImage />}
          <FileName>{fileName}</FileName>
          <FilePath>{filePath}</FilePath>
        </TitleSection>
        <HeaderActions>
          <IconButton onClick={handleDownload} title="Download">
            <FiDownload />
          </IconButton>
          <IconButton onClick={handleFullscreen} title="Open in new window">
            <FiMaximize2 />
          </IconButton>
          <IconButton onClick={loadMedia} title="Refresh">
            <FiRefreshCw />
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <FiX />
          </IconButton>
        </HeaderActions>
      </Header>
      <Content>
        {isLoading ? (
          <LoadingState>Loading media...</LoadingState>
        ) : error ? (
          <ErrorState>
            <span>{error}</span>
            <IconButton onClick={loadMedia}>
              <FiRefreshCw /> Retry
            </IconButton>
          </ErrorState>
        ) : mediaUrl ? (
          isVideo ? (
            <MediaVideo controls autoPlay={false}>
              <source src={mediaUrl} />
              Your browser does not support video playback.
            </MediaVideo>
          ) : (
            <MediaImage
              src={mediaUrl}
              alt={fileName}
              onClick={handleFullscreen}
              style={{ cursor: 'pointer' }}
            />
          )
        ) : (
          <ErrorState>No media data available</ErrorState>
        )}
      </Content>
    </ViewerContainer>
  );
};

export default MediaViewer;

export { isImageFile, isVideoFile };

