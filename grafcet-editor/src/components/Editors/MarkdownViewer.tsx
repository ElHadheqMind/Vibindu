import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiX, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { ApiService } from '../../services/apiService';

interface MarkdownViewerProps {
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
  overflow-y: auto;
  padding: 24px 32px;
  
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.surface};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 5px;
  }
`;

const MarkdownContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.7;
  color: ${props => props.theme.text};
  
  h1 {
    font-size: 2em;
    font-weight: 600;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
  }
  
  h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 24px 0 12px 0;
    color: ${props => props.theme.text};
  }
  
  h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 20px 0 10px 0;
    color: ${props => props.theme.text};
  }
  
  h4, h5, h6 {
    font-size: 1em;
    font-weight: 600;
    margin: 16px 0 8px 0;
    color: ${props => props.theme.text};
  }
  
  p {
    margin: 0 0 16px 0;
  }
  
  ul, ol {
    margin: 0 0 16px 0;
    padding-left: 24px;
  }
  
  li {
    margin: 4px 0;
  }
  
  code {
    background-color: ${props => props.theme.surfaceAlt};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background-color: ${props => props.theme.surfaceAlt};
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0 0 16px 0;
    
    code {
      background: none;
      padding: 0;
    }
  }
  
  blockquote {
    border-left: 4px solid ${props => props.theme.primary};
    margin: 0 0 16px 0;
    padding: 8px 16px;
    background-color: ${props => props.theme.surfaceAlt};
    border-radius: 0 4px 4px 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 24px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid ${props => props.theme.border};
  }

  th, td {
    border: 1px solid ${props => props.theme.border};
    padding: 12px 16px;
    text-align: left;
    font-size: 0.95em;
  }

  th {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
    border-color: rgba(255, 255, 255, 0.1);
  }

  tbody tr {
    transition: background-color 0.15s ease;
  }

  tbody tr:nth-child(even) {
    background-color: ${props => props.theme.surfaceAlt};
  }

  tbody tr:hover {
    background-color: ${props => props.theme.primaryTransparent || 'rgba(99, 102, 241, 0.08)'};
  }

  td code {
    background-color: ${props => props.theme.primary}15;
    color: ${props => props.theme.primary};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  
  a {
    color: ${props => props.theme.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  hr {
    border: none;
    border-top: 1px solid ${props => props.theme.border};
    margin: 24px 0;
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.error};
  text-align: center;
  gap: 12px;
`;

// Parse markdown tables into HTML
const parseTable = (tableBlock: string): string => {
  const lines = tableBlock.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return tableBlock;

  // Check if this is a valid table (has separator line with dashes)
  const separatorIndex = lines.findIndex(line => /^\|[\s\-:|]+\|$/.test(line.trim()));
  if (separatorIndex === -1) return tableBlock;

  const headerLine = lines[separatorIndex - 1];
  const bodyLines = lines.slice(separatorIndex + 1);

  if (!headerLine) return tableBlock;

  // Parse header cells
  const headerCells = headerLine
    .split('|')
    .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    .map(cell => cell.trim());

  // Start building table HTML
  let tableHtml = '<table><thead><tr>';
  headerCells.forEach(cell => {
    tableHtml += `<th>${cell}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  // Parse body rows
  bodyLines.forEach(line => {
    if (!line.trim() || /^\|[\s\-:|]+\|$/.test(line)) return;
    const cells = line
      .split('|')
      .filter((_, i, arr) => i > 0 && i < arr.length - 1)
      .map(cell => cell.trim());

    tableHtml += '<tr>';
    cells.forEach(cell => {
      tableHtml += `<td>${cell}</td>`;
    });
    tableHtml += '</tr>';
  });

  tableHtml += '</tbody></table>';
  return tableHtml;
};

// Simple markdown parser for basic rendering
const parseMarkdown = (markdown: string): string => {
  let html = markdown;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Remove extra blank lines between table rows (common LLM issue)
  // This handles: | row1 |\n\n| row2 | -> | row1 |\n| row2 |
  html = html.replace(/(\|[^\n]+\|)\n\n+(\|)/g, '$1\n$2');

  // Escape HTML (but preserve pipe characters for tables)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (before other processing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Parse tables - find table blocks and convert them
  // A table block starts with | and has at least header + separator + 1 row
  const tableRegex = /^(\|[^\n]+\|\n)+/gm;
  html = html.replace(tableRegex, (match) => parseTable(match));

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');

  // Paragraphs (wrap remaining text blocks, but not table elements)
  html = html.replace(/^(?!<[huplobqt]|<li|<hr|<\/t)(.+)$/gm, '<p>$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  return html;
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileName = filePath.split(/[/\\]/).pop() || 'Unknown';
  
  const loadFile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.readTextFile(filePath);
      if (response.success && response.content !== undefined) {
        setContent(response.content);
      } else {
        setError(response.error || 'Failed to load file');
      }
    } catch (err) {
      setError('Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadFile();
  }, [filePath]);
  
  return (
    <ViewerContainer>
      <Header>
        <TitleSection>
          <FiFileText />
          <FileName>{fileName}</FileName>
          <FilePath>{filePath}</FilePath>
        </TitleSection>
        <HeaderActions>
          <IconButton onClick={loadFile} title="Refresh">
            <FiRefreshCw />
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <FiX />
          </IconButton>
        </HeaderActions>
      </Header>
      <Content>
        {isLoading ? (
          <LoadingState>Loading...</LoadingState>
        ) : error ? (
          <ErrorState>
            <span>{error}</span>
            <IconButton onClick={loadFile}>
              <FiRefreshCw /> Retry
            </IconButton>
          </ErrorState>
        ) : (
          <MarkdownContent 
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} 
          />
        )}
      </Content>
    </ViewerContainer>
  );
};

export default MarkdownViewer;

