import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Group, Line } from 'react-konva';
import { Connection as ConnectionType } from '../../models/types';

import { useElementsStore } from '../../store/useElementsStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useTheme } from '../../context/ThemeContext';

interface ConnectionProps {
  connection: ConnectionType;
  isPreview?: boolean;
}

const Connection: React.FC<ConnectionProps> = ({ connection, isPreview = false }) => {
  const { segments, selected } = connection;

  const { selectElement } = useElementsStore();
  const {
    currentTool,
    clearSegmentSelection,
  } = useEditorStore();
  const { theme } = useTheme();


  // State declarations (simplified)
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  // Refs for smooth interaction handling
  const hoverTimeoutRef = useRef<any>(null);

  // Clear segment selection when connection is deselected (clean up old state if any)
  useEffect(() => {
    if (!selected) {
      clearSegmentSelection();
    }
  }, [selected, clearSegmentSelection]);

  // Handle segment mouse enter/leave for hover highlights
  const handleSegmentMouseEnter = useCallback((segmentId: string) => {
    if (isPreview) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSegmentId(segmentId);
    }, 10);
  }, [isPreview]);

  const handleSegmentMouseLeave = useCallback(() => {
    if (isPreview) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSegmentId(null);
    }, 50);
  }, [isPreview]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Render connection segments
  const renderSegments = () => {
    return segments.map((segment) => {
      const points = segment.points.flatMap((p) => [p.x, p.y]);
      const isHovered = hoveredSegmentId === segment.id;

      // Enhanced color scheme
      const lineColor = isHovered
        ? theme.primaryDark
        : selected
          ? theme.selectionBorder
          : theme.text;

      const strokeWidth = selected || isHovered ? 2 : 1;

      return (
        <Group key={segment.id}>
          <Line
            points={points}
            stroke={lineColor}
            strokeWidth={strokeWidth}
          />

          {/* Hitbox for hover effects */}
          <Line
            points={points}
            stroke="transparent"
            strokeWidth={16}
            onMouseEnter={() => handleSegmentMouseEnter(segment.id)}
            onMouseLeave={handleSegmentMouseLeave}
          />
        </Group>
      );
    });
  };

  // Handle click on connection
  const handleClick = () => {
    if (currentTool !== 'select' || isPreview) return;
    selectElement(connection.id);
  };


  return (
    <Group onClick={handleClick}>
      {renderSegments()}
    </Group>
  );
};

export default Connection;
