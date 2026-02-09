import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useElementsStore } from '../../store/useElementsStore';
import { useEditorStore } from '../../store/useEditorStore';
import { GrafcetElement } from '../../models/types';
import Konva from 'konva';

const MiniMapContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 180px;
  height: 140px;
  background-color: ${props => props.theme.surfaceRaised};
  border-top: 1px solid ${props => props.theme.border};
  border-left: 1px solid ${props => props.theme.border};
  border-right: none;
  border-bottom: none;
  border-radius: 8px 0 0 0;
  box-shadow: -2px -2px 8px ${props => props.theme.shadow};
  overflow: hidden;
  z-index: 100;
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(calc(100% - 32px))'};
  transition: transform ${props => props.theme.transition.normal};
`;

const MiniMapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: ${props => props.theme.surfaceAlt};
  border-bottom: 1px solid ${props => props.theme.border};
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.surfaceAlt}aa;
  }
`;

const MiniMapTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const MiniMapContent = styled.div`
  position: relative;
  width: 100%;
  height: calc(100% - 32px);
  overflow: hidden;
`;

const MiniMapCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const ViewportIndicator = styled.div`
  position: absolute;
  border: 2px solid ${props => props.theme.primary};
  background-color: ${props => props.theme.primary}20;
  pointer-events: none;
`;

interface MiniMapProps {
  canvasWidth: number;
  canvasHeight: number;
  stageRef: React.RefObject<Konva.Stage>;
}

const MiniMap: React.FC<MiniMapProps> = ({ canvasWidth, canvasHeight }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { elements } = useElementsStore();
  const { scale, offset } = useEditorStore();

  // Toggle minimap open/closed
  const toggleMiniMap = () => {
    setIsOpen(!isOpen);
  };

  // Draw elements on the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find bounds of all elements
    const bounds = getElementsBounds(elements);
    if (!bounds) return;

    // Calculate scale to fit all elements in the minimap
    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / bounds.width;
    const scaleY = (canvas.height - padding * 2) / bounds.height;
    const miniMapScale = Math.min(scaleX, scaleY);

    // Draw elements
    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(miniMapScale, miniMapScale);
    ctx.translate(-bounds.x, -bounds.y);

    // Draw connections first
    elements
      .filter(e => e.type === 'connection')
      .forEach(element => {
        drawElement(ctx, element);
      });

    // Draw other elements
    elements
      .filter(e => e.type !== 'connection')
      .forEach(element => {
        drawElement(ctx, element);
      });

    ctx.restore();
  }, [elements]);

  // Calculate bounds of all elements
  const getElementsBounds = (elements: GrafcetElement[]) => {
    if (elements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      if (element.type === 'connection') return;
      if (!('size' in element)) return;

      const { position, size } = element;

      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Draw an element on the minimap
  const drawElement = (ctx: CanvasRenderingContext2D, element: GrafcetElement) => {
    ctx.fillStyle = '#1976d2';
    ctx.strokeStyle = '#1976d2';

    if (element.type === 'step') {
      if ('size' in element) {
        const { position, size } = element;
        ctx.fillRect(position.x, position.y, size.width, size.height);
      }
    } else if (element.type === 'transition') {
      if ('size' in element) {
        const { position, size } = element;
        ctx.fillRect(position.x, position.y, size.width, size.height);
      }
    } else if (element.type === 'connection') {
      if ('segments' in element) {
        const { segments } = element;

        if (!segments || segments.length === 0) return;

        ctx.beginPath();

        segments.forEach(segment => {
          const { points } = segment;

          if (points.length < 2) return;

          ctx.moveTo(points[0].x, points[0].y);

          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
        });

        ctx.stroke();
      }
    } else if (element.type === 'and-gate' || element.type === 'or-gate') {
      if ('size' in element) {
        const { position, size } = element;
        ctx.fillRect(position.x, position.y, size.width, size.height);
      }
    } else if (element.type === 'action-block') {
      if ('size' in element) {
        const { position, size } = element;
        ctx.fillRect(position.x, position.y, size.width, size.height);
      }
    }
  };

  // Calculate viewport indicator position and size
  const getViewportIndicator = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0, width: 0, height: 0 };

    const bounds = getElementsBounds(elements);
    if (!bounds) return { left: 0, top: 0, width: 0, height: 0 };

    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / bounds.width;
    const scaleY = (canvas.height - padding * 2) / bounds.height;
    const miniMapScale = Math.min(scaleX, scaleY);

    // Calculate viewport position and size in minimap coordinates
    const viewportLeft = padding + (-offset.x / scale - bounds.x) * miniMapScale;
    const viewportTop = padding + (-offset.y / scale - bounds.y) * miniMapScale;
    const viewportWidth = (canvasWidth / scale) * miniMapScale;
    const viewportHeight = (canvasHeight / scale) * miniMapScale;

    return {
      left: viewportLeft,
      top: viewportTop,
      width: viewportWidth,
      height: viewportHeight,
    };
  };

  const viewport = getViewportIndicator();

  // Handle click on minimap to navigate
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = getElementsBounds(elements);
    if (!bounds) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / bounds.width;
    const scaleY = (canvas.height - padding * 2) / bounds.height;
    const miniMapScale = Math.min(scaleX, scaleY);

    // Calculate target position in canvas coordinates
    const targetX = (x - padding) / miniMapScale + bounds.x;
    const targetY = (y - padding) / miniMapScale + bounds.y;

    // Center viewport on target position
    const newOffset = {
      x: -targetX * scale + canvasWidth / 2,
      y: -targetY * scale + canvasHeight / 2,
    };

    useEditorStore.getState().setOffset(newOffset);
  };

  return (
    <MiniMapContainer $isOpen={isOpen}>
      <MiniMapHeader onClick={toggleMiniMap}>
        <MiniMapTitle>Minimap</MiniMapTitle>
      </MiniMapHeader>

      <MiniMapContent onClick={handleMiniMapClick}>
        <MiniMapCanvas
          ref={canvasRef}
          width={200}
          height={118}
        />

        <ViewportIndicator
          style={{
            left: `${viewport.left}px`,
            top: `${viewport.top}px`,
            width: `${viewport.width}px`,
            height: `${viewport.height}px`,
          }}
        />
      </MiniMapContent>
    </MiniMapContainer>
  );
};

export default MiniMap;
