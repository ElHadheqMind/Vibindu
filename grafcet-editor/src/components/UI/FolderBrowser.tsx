import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiFolder, FiFile, FiChevronUp, FiHome, FiRefreshCw } from 'react-icons/fi';
import { ApiService } from '../../services/apiService';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 300px;
  max-height: 40vh;
  min-height: 200px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.theme.surface};

  @media (max-height: 800px) {
    height: 250px;
    max-height: 35vh;
    min-height: 180px;
  }

  @media (max-height: 700px) {
    height: 200px;
    max-height: 30vh;
    min-height: 150px;
  }

  @media (max-width: 768px) {
    height: 220px;
    max-height: 30vh;
    min-height: 160px;
  }

  @media (max-height: 600px) {
    height: 160px;
    max-height: 25vh;
    min-height: 120px;
  }

  @media (max-height: 500px) {
    height: 120px;
    max-height: 20vh;
    min-height: 100px;
  }
`;

const BrowserHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: ${props => props.theme.surfaceAlt};
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding: 8px;
    gap: 6px;
  }
`;

const PathDisplay = styled.div`
  flex: 1;
  padding: 8px 12px;
  background-color: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  color: ${props => props.theme.text};
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PathSegment = styled.button`
  background: none;
  border: none;
  font-family: monospace;
  font-size: 14px;
  color: ${props => props.theme.text};
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: ${props => props.theme.primaryLight};
    color: ${props => props.theme.primary};
  }

  &:active {
    background-color: ${props => props.theme.primary};
    color: white;
  }
`;

const PathSeparator = styled.span`
  color: ${props => props.theme.textSecondary};
  font-family: monospace;
  font-size: 14px;
  user-select: none;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  color: ${props => props.theme.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt};
    border-color: ${props => props.theme.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 16px;
  }
`;

const BrowserContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scroll-behavior: smooth;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Item = styled.div<{ isSelected?: boolean; isDirectory?: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.isSelected ? props.theme.primaryLight : 'transparent'};
  color: ${props => props.isSelected ? props.theme.primary : props.theme.text};
  border: 1px solid transparent;
  margin-bottom: 2px;
  user-select: none;

  &:hover {
    background-color: ${props => props.isSelected ? props.theme.primaryLight : props.theme.surfaceAlt};
    border-color: ${props => props.theme.border};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  svg {
    margin-right: 10px;
    color: ${props => props.isDirectory ? props.theme.primary : props.theme.textSecondary};
    font-size: 16px;
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: ${props => props.theme.primary};
  }
`;

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: ${props => props.theme.textSecondary};
  font-style: italic;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: ${props => props.theme.error};
  text-align: center;
`;

interface FolderBrowserProps {
  onFolderSelect: (folderPath: string) => void;
  selectedPath?: string;
}

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: string;
}

const FolderBrowser: React.FC<FolderBrowserProps> = ({ onFolderSelect, selectedPath }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string>('');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>(selectedPath || '');

  // Load directory contents
  const loadDirectory = async (path: string = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await ApiService.browseDirectory(path);
      
      if (response.success && response.contents) {
        setCurrentPath(response.path || '');
        setParentPath(response.parent || '');
        setItems(response.contents.filter(item => item.isDirectory)); // Only show directories
      } else {
        setError(response.error || 'Failed to load directory');
      }
    } catch {
      setError('Failed to communicate with backend');
    } finally {
      setLoading(false);
    }
  };

  // Load drives on component mount
  const loadDrives = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ApiService.getDrives();
      
      if (response.success && response.drives) {
        setCurrentPath('');
        setParentPath('');
        setItems(response.drives);
      } else {
        setError(response.error || 'Failed to load drives');
      }
    } catch {
      setError('Failed to communicate with backend');
    } finally {
      setLoading(false);
    }
  };

  // Initialize with drives
  useEffect(() => {
    loadDrives();
  }, []);

  // Handle item click
  const handleItemClick = (item: DirectoryItem) => {
    if (item.isDirectory) {
      setSelectedItem(item.path);
      onFolderSelect(item.path);
    }
  };

  // Handle item double click
  const handleItemDoubleClick = (item: DirectoryItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    }
  };

  // Navigate up
  const navigateUp = () => {
    if (parentPath) {
      loadDirectory(parentPath);
    } else {
      loadDrives();
    }
  };

  // Navigate to home
  const navigateHome = () => {
    loadDrives();
  };

  // Refresh current directory
  const refresh = () => {
    if (currentPath) {
      loadDirectory(currentPath);
    } else {
      loadDrives();
    }
  };

  // Navigate to a specific path segment
  const navigateToPath = (targetPath: string) => {
    if (targetPath === '') {
      loadDrives();
    } else {
      loadDirectory(targetPath);
    }
  };

  // Parse current path into clickable segments
  const getPathSegments = () => {
    if (!currentPath) {
      return [{ name: 'Computer', path: '' }];
    }

    const segments = [];
    const parts = currentPath.split(/[\\\\\/]/u).filter(part => part.length > 0);

    // Add root segment
    segments.push({ name: 'Computer', path: '' });

    // Add each path segment
    let buildPath = '';
    parts.forEach((part, index) => {
      if (index === 0 && part.endsWith(':')) {
        // Drive letter (e.g., "C:")
        buildPath = part + '\\';
        segments.push({ name: part, path: buildPath });
      } else {
        // Regular folder
        buildPath += (buildPath.endsWith('\\') ? '' : '\\') + part;
        segments.push({ name: part, path: buildPath });
      }
    });

    return segments;
  };

  return (
    <BrowserContainer>
      <BrowserHeader>
        <ActionButton onClick={navigateHome} title="Home">
          <FiHome />
        </ActionButton>
        
        <ActionButton 
          onClick={navigateUp} 
          disabled={!parentPath && !currentPath}
          title="Up"
        >
          <FiChevronUp />
        </ActionButton>

        <PathDisplay>
          {getPathSegments().map((segment, index) => (
            <React.Fragment key={segment.path}>
              {index > 0 && <PathSeparator>{'>'}</PathSeparator>}
              <PathSegment
                onClick={() => navigateToPath(segment.path)}
                title={`Navigate to ${segment.name}`}
              >
                {segment.name}
              </PathSegment>
            </React.Fragment>
          ))}
        </PathDisplay>

        <ActionButton onClick={refresh} title="Refresh">
          <FiRefreshCw />
        </ActionButton>
      </BrowserHeader>

      <BrowserContent>
        {loading ? (
          <LoadingMessage>Loading...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <ItemList>
            {items.map((item) => (
              <Item
                key={item.path}
                isSelected={selectedItem === item.path}
                isDirectory={item.isDirectory}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
              >
                {item.isDirectory ? <FiFolder /> : <FiFile />}
                <ItemName>{item.name}</ItemName>
              </Item>
            ))}
            
            {items.length === 0 && !loading && !error && (
              <LoadingMessage>No folders found</LoadingMessage>
            )}
          </ItemList>
        )}
      </BrowserContent>
    </BrowserContainer>
  );
};

export default FolderBrowser;
