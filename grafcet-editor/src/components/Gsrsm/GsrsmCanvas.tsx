import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Group, Text, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGsrsmStore } from '../../store/useGsrsmStore';
import { usePopupStore } from '../../store/usePopupStore';
import Konva from 'konva';
import GsrsmProductionBlock from './GsrsmProductionBlock';
import GsrsmZoomControls from './GsrsmZoomControls';
import GsrsmContextMenu from './GsrsmContextMenu';
import {
  Gsrsm_SECTION_MARGIN,
  Gsrsm_CANVAS_PADDING,
  Gsrsm_HEADER_HEIGHT,
  Gsrsm_A1_SIZE,
  Gsrsm_A3_SIZE,
  Gsrsm_A4_SIZE,
  Gsrsm_D3_SIZE,
  Gsrsm_A2_SIZE,
  Gsrsm_D1_SIZE,
  Gsrsm_A6_SIZE,
  Gsrsm_A7_SIZE,
  Gsrsm_F1_SIZE,
  Gsrsm_F5_SIZE,
  Gsrsm_VERTICAL_SPACING,
  Gsrsm_FIXED_CANVAS_WIDTH,
  Gsrsm_FIXED_CANVAS_HEIGHT
} from '../../models/constants';
import GsrsmSection from './GsrsmSection';
import GsrsmModes from './GsrsmModes';
import GsrsmConnection from './GsrsmConnection';
import { createGsrsmConnections, shouldHighlightConnection } from '../../models/GsrsmConnections';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
`;


interface GsrsmCanvasProps {
  width: number;
  height: number;
  stageRef?: React.RefObject<any>;
}

const GsrsmCanvas: React.FC<GsrsmCanvasProps> = ({ width, height, stageRef: externalStageRef }) => {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const [stageSize, setStageSize] = useState({ width, height });
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Get zoom and pan state from store
  const {
    scale,
    offset,
    setScale,
    setOffset,
    panCanvas,
    contextMenuPosition,
    contextMenuOptions,
    hideContextMenu,
    showContextMenu,
    project,
    updateConnection
  } = useGsrsmStore();

  const { showPopup } = usePopupStore();
  const connectionsState = project?.diagram?.connections || [];

  const handleConnectionDoubleClick = (id: string, currentCondition?: string) => {
    showPopup(
      'prompt',
      'Edit Transition Condition',
      'Enter condition for this transition:',
      (newCondition?: string) => {
        if (newCondition !== undefined) {
          updateConnection(id, { condition: newCondition });
        }
      },
      currentCondition || ''
    );
  };

  const handleConnectionContextMenu = (e: KonvaEventObject<MouseEvent>, id: string, currentActivated: boolean) => {
    e.evt.preventDefault();
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    showContextMenu(pointerPos, [
      {
        label: currentActivated ? 'Deactivate Transition' : 'Activate Transition',
        action: () => updateConnection(id, { activated: !currentActivated }),
        icon: currentActivated ? 'eye-off' : 'eye',
      }
    ]);
  };

  // State for tracking mouse interactions
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState<{ x: number, y: number } | null>(null);

  // Update stage size when container size changes
  useEffect(() => {
    setStageSize({ width, height });
  }, [width, height]);

  // Handle mouse down on canvas
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Ignore right clicks (handled by context menu)
    if (e.evt.button === 2) return;

    // Get mouse position
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Hide context menu if open
    if (contextMenuPosition) {
      hideContextMenu();
      return;
    }

    // Start panning the canvas
    setIsDrawing(true);
    setLastPointerPosition(pointerPos);
  };

  // Handle mouse move on canvas
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos || !lastPointerPosition) return;

    // Calculate the distance moved
    const dx = pointerPos.x - lastPointerPosition.x;
    const dy = pointerPos.y - lastPointerPosition.y;

    // Pan the canvas
    panCanvas({ x: dx, y: dy });

    // Update last pointer position
    setLastPointerPosition(pointerPos);
  };

  // Handle mouse up on canvas
  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPointerPosition(null);
  };

  // Handle wheel zoom
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Use combined scale for calculating mouse position in canvas coordinates
    const combinedScale = scale * fitScale;

    const mousePointTo = {
      x: (pointerPos.x - offset.x) / combinedScale,
      y: (pointerPos.y - offset.y) / combinedScale,
    };

    // Determine zoom direction
    const zoomDirection = e.evt.deltaY < 0 ? 1 : -1;

    // Calculate new scale
    const scaleBy = 1.1;
    const newScale = zoomDirection > 0
      ? Math.min(5, scale * scaleBy)
      : Math.max(0.1, scale / scaleBy);

    // Calculate new offset to zoom toward mouse position using the new combined scale
    const newOffset = {
      x: pointerPos.x - mousePointTo.x * (newScale * fitScale),
      y: pointerPos.y - mousePointTo.y * (newScale * fitScale),
    };

    // Update scale and offset
    setScale(newScale);
    setOffset(newOffset);
  };

  // Handle context menu
  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Show canvas context menu with reset view option
    const canvasOptions = [
      {
        label: 'Reset View',
        action: () => useGsrsmStore.getState().resetView(),
        icon: 'maximize',
      },
    ];

    showContextMenu(pointerPos, canvasOptions);
  };

  // Calculate section dimensions based on the Gsrsm structure to match the reference image
  // Define the left sidebar width
  const leftSidebarWidth = 60 * 0.6; // Width of the left sidebar (reduced by 0.6)

  // USE FIXED DIMENSIONS FOR LAYOUT TO PROTECT POSITIONS
  const layoutBaseWidth = Gsrsm_FIXED_CANVAS_WIDTH;
  const layoutBaseHeight = Gsrsm_FIXED_CANVAS_HEIGHT;

  // Calculate the available width for the main sections using layoutBaseWidth
  const availableWidth = (layoutBaseWidth - 2 * Gsrsm_CANVAS_PADDING - leftSidebarWidth - 3 * Gsrsm_SECTION_MARGIN) * 0.6;

  // A and D sections have equal width, F section is 10% wider, all increased by 10%
  const baseSectionWidth = availableWidth / 2; // Base width calculation
  const sectionWidth = baseSectionWidth * 1.10; // A and D sections: 10% wider
  const fSectionWidth = baseSectionWidth * 1.1 * 1.10; // F section: 10% wider + 10% increase = 21% wider than base

  // Increase the spacing between F and A/D sections
  const sectionSpacing = Gsrsm_SECTION_MARGIN * 5; // Increased from 2x to 5x the normal margin

  // Calculate heights - use independent absolute dimensions for each section
  const topSectionHeight = 332; // A section: reduced by 5% (350 * 0.95 = 332.5, rounded to 332)
  const bottomSectionHeight = 212; // D section: unchanged

  // Calculate the horizontal centering offset using layoutBaseWidth
  const totalWidthUsed = leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing + fSectionWidth;
  const horizontalOffset = Gsrsm_CANVAS_PADDING + (layoutBaseWidth - 2 * Gsrsm_CANVAS_PADDING - totalWidthUsed) / 2;

  // Section positions based on the Gsrsm structure with F and D sections aligned at the bottom
  const sectionPositions = {
    // Left sidebar
    sidebar: {
      x: horizontalOffset,
      y: Gsrsm_CANVAS_PADDING,
      width: leftSidebarWidth,
      height: topSectionHeight + Gsrsm_SECTION_MARGIN + bottomSectionHeight,
    },
    // A section is on the top-center (more square-like)
    A: {
      x: horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN,
      y: Gsrsm_CANVAS_PADDING,
      width: sectionWidth,
      height: topSectionHeight,
    },
    // F section aligned with bottom of D section
    F: {
      x: horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing,
      y: Gsrsm_CANVAS_PADDING,
      width: fSectionWidth, // F section uses 10% wider width
      height: topSectionHeight + Gsrsm_SECTION_MARGIN + bottomSectionHeight, // Align with bottom of D section
    },
    // D section is on the bottom-center
    D: {
      x: horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN,
      y: Gsrsm_CANVAS_PADDING + topSectionHeight + Gsrsm_SECTION_MARGIN,
      width: sectionWidth,
      height: bottomSectionHeight,
    },
  };

  // Calculate the auto-fit scale to keep it responsive within the actual width/height
  const fitScaleX = width / layoutBaseWidth;
  const fitScaleY = height / layoutBaseHeight;
  const fitScale = Math.min(fitScaleX * 0.95, fitScaleY * 0.95, 1); // 0.95 for small padding, cap at 1

  // Calculate centering offsets to keep the "block" centered in the available space
  const centeringOffsetX = (width - layoutBaseWidth * fitScale) / 2;
  const centeringOffsetY = (height - layoutBaseHeight * fitScale) / 2;

  // Get active modes for connection highlighting
  const activeModes = project?.diagram?.modes
    .filter(mode => mode.type === 'active')
    .map(mode => mode.code) || [];

  // Create dynamic connections with highlighting
  const allStandardConnections = createGsrsmConnections(sectionPositions);

  // Filter connections: if the project has specific connections defined, only show those. 
  // Otherwise (e.g. new/legacy projects with empty connections), show all standard connections as specific "potential" paths.
  // This allows the Agent to define the topology by populating the connections array.
  const GsrsmConnections = (connectionsState && connectionsState.length > 0)
    ? allStandardConnections.filter(std => connectionsState.some(c => c.id === std.id))
    : allStandardConnections;

  // Define total height for the container border and other elements
  const totalHeight = layoutBaseHeight - 2 * Gsrsm_CANVAS_PADDING - Gsrsm_SECTION_MARGIN;


  if (stageSize.width <= 0 || stageSize.height <= 0) {
    return null;
  }

  return (
    <CanvasContainer>

      <Stage
        ref={stageRef}

        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale * fitScale}
        scaleY={scale * fitScale}
        x={offset.x + centeringOffsetX}
        y={offset.y + centeringOffsetY}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        draggable={false}
      >
        <Layer>
          {/* Render left sidebar (without text) */}
          <Group>
            <Rect
              x={sectionPositions.sidebar.x}
              y={sectionPositions.sidebar.y}
              width={sectionPositions.sidebar.width}
              height={sectionPositions.sidebar.height}
              fill="#CCCCCC" // Gray background
              stroke={theme.border}
              strokeWidth={1}
            />
          </Group>

          {/* Render sections */}
          <GsrsmSection
            title={t('Gsrsm.SECTIONS.A')}
            category="A"
            x={sectionPositions.A.x}
            y={sectionPositions.A.y}
            width={sectionPositions.A.width}
            height={sectionPositions.A.height}
          />

          <GsrsmSection
            title={t('Gsrsm.SECTIONS.F')}
            category="F"
            x={sectionPositions.F.x}
            y={sectionPositions.F.y}
            width={sectionPositions.F.width}
            height={sectionPositions.F.height}
          />

          <GsrsmSection
            title={t('Gsrsm.SECTIONS.D')}
            category="D"
            x={sectionPositions.D.x}
            y={sectionPositions.D.y}
            width={sectionPositions.D.width}
            height={sectionPositions.D.height}
          />

          {/* Production block encompassing A2, A3, F1, D3, and F5 - placed BEFORE modes so it appears behind them */}
          {(() => {
            // Calculate the position and size of the production block
            // We need to find the leftmost, rightmost, topmost, and bottommost points of the modes

            // A2 position
            const a2X = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A2_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10;
            const a2Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15;

            // A3 position
            const a3X = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A3_SIZE.width - 20;
            const a3Y = sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15;

            // F1 position
            const f1Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + sectionPositions.F.height / 3 + 40;

            // D3 position
            const d3X = sectionPositions.A.x + sectionPositions.A.width - Gsrsm_A2_SIZE.width - 20 - Gsrsm_A3_SIZE.width - 10;
            const d3Y = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + 20;

            // F5 position
            const f5X = sectionPositions.F.x + 4.2 * sectionPositions.F.width / 5 - Gsrsm_F5_SIZE.width / 2;
            const f5Y = sectionPositions.F.y + Gsrsm_HEADER_HEIGHT + 120;

            // Calculate the bounding box
            const leftX = Math.min(a2X, d3X) - 20; // Add some padding
            const topY = Math.min(a2Y, a3Y, f1Y) - 20 + 10; // Add some padding and move down by 10px
            const rightX = Math.max(f5X + Gsrsm_F5_SIZE.width, a3X + Gsrsm_A3_SIZE.width) + 20; // Add some padding, include F5
            const bottomY = Math.max(f1Y + Gsrsm_F1_SIZE.height, d3Y + Gsrsm_D3_SIZE.height, f5Y + Gsrsm_F5_SIZE.height) + 0 + 10; // Reduced padding by 5px more (from 5px to 0px)

            const blockWidth = rightX - leftX;
            const blockHeight = bottomY - topY;

            return (
              <GsrsmProductionBlock
                x={leftX}
                y={topY}
                width={blockWidth}
                height={blockHeight}
                label={t('Gsrsm.LABELS.PRODUCTION')}
              />
            );
          })()}

          {/* Gsrsm Connections - Dynamic rendering with highlighting */}
          <Group>
            {GsrsmConnections.map((connection) => {
              const isHighlighted = shouldHighlightConnection(connection, activeModes);
              const connectionState = connectionsState.find(c => c.id === connection.id);
              const condition = connectionState?.condition;
              // Default to false unless explicitly activated in state
              const isActivated = connectionState?.activated ?? false;

              return (
                <GsrsmConnection
                  key={connection.id}
                  points={connection.points}
                  dash={connection.dash}
                  pointerLength={connection.pointerLength}
                  pointerWidth={connection.pointerWidth}
                  pointerAtBeginning={connection.pointerAtBeginning}
                  pointerAtEnding={connection.pointerAtEnding}
                  strokeWidth={connection.strokeWidth}
                  highlighted={isHighlighted}
                  condition={condition}
                  activated={isActivated}
                  onDoubleClick={() => handleConnectionDoubleClick(connection.id, condition)}
                  onContextMenu={(e: any) => handleConnectionContextMenu(e, connection.id, isActivated)}
                />
              );
            })}
















          </Group>



          {/* Add "Demandes de marche" text in the area between F and A,D sections, under the A4-F1 connection */}
          <Group>
            <Text
              text={t('Gsrsm.LABELS.DEMANDES_MARCHE')}
              x={horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing / 2 - 25} // Centered in the area between F and A,D
              y={sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A1_SIZE.height + Gsrsm_VERTICAL_SPACING + Gsrsm_A4_SIZE.height / 2 + 5} // Aligned with the A4-F1 connection
              fontSize={7} // Small font size as requested
              fontStyle="bold"
              fill={theme.mode === 'light' ? '#000000' : '#ffffff'}
              align="center"
              width={50} // Enough width for the text
            />
          </Group>

          {/* Add "Demandes d'arrêt" text over the F1-A3 connection */}
          <Group>
            <Text
              text={t('Gsrsm.LABELS.DEMANDES_ARRET')}
              x={horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing / 2 - 25} // Centered in the area between F and A,D
              y={sectionPositions.A.y + Gsrsm_HEADER_HEIGHT + 30 + Gsrsm_A6_SIZE.height + Gsrsm_A7_SIZE.height + 2 * Gsrsm_VERTICAL_SPACING + 15 + Gsrsm_A3_SIZE.height * 0.7 - 20} // Moved higher above the F1-A3 connection
              fontSize={7} // Small font size as requested
              fontStyle="bold"
              fill={theme.mode === 'light' ? '#000000' : '#ffffff'}
              align="center"
              width={50} // Enough width for the text
            />
          </Group>

          {/* Add "Détection défaillance" text under the F6-D1 connection */}
          <Group>
            <Text
              text={t('Gsrsm.LABELS.DETECTION_DEFAILLANCE')}
              x={horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing / 2 - 25} // Centered in the area between F and A,D
              y={sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40 + Gsrsm_D1_SIZE.height / 2 + 10} // Just below the F6-D1 connection
              fontSize={7} // Small font size as requested
              fontStyle="bold"
              fill={theme.mode === 'light' ? '#000000' : '#ffffff'}
              align="center"
              width={50} // Enough width for the text
            />
          </Group>

          {/* Add letter V between F and A,D zones, aligned with top line of D1 */}
          <Group>
            <Text
              text="V"
              x={horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing / 2 - 10} // More to the left in the area between F and A,D
              y={sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40 - 10} // Moved up by 10px from D1 top line
              fontSize={18}
              fontStyle="bold"
              fill={theme.mode === 'light' ? '#000000' : '#ffffff'}
              align="center"
              width={20}
            />

            {/* Connection from V to D1 */}
            {(() => {
              // Calculate V position (center bottom)
              const vX = horizontalOffset + leftSidebarWidth + Gsrsm_SECTION_MARGIN + sectionWidth + sectionSpacing / 2 - 10 + 10; // Center of V
              const vY = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40 - 10 + 9; // Bottom of V

              // Calculate D1 right center position
              const d1RightX = sectionPositions.D.x + 20 + (sectionPositions.D.width - 40); // Right edge of D1
              const d1CenterY = sectionPositions.D.y + Gsrsm_HEADER_HEIGHT + sectionPositions.D.height / 2 - Gsrsm_D1_SIZE.height / 2 + 40 + Gsrsm_D1_SIZE.height / 2; // Center of D1 vertically

              // Create a connection with vertical and horizontal segments
              return (
                <GsrsmConnection
                  points={[
                    vX, vY, // Start at V bottom center
                    vX, d1CenterY, // Vertical line down to D1's center height
                    d1RightX, d1CenterY // Horizontal line to D1's right edge
                  ]}
                  dash={[5, 5]}
                  pointerLength={10}
                  pointerWidth={8}
                />
              );
            })()}
          </Group>

          {/* Render all Gsrsm modes using the consolidated component - placed AFTER production block so modes appear on top */}
          <GsrsmModes
            x={horizontalOffset - 10}
            y={Gsrsm_CANVAS_PADDING - 30}
            width={totalWidthUsed + 20}
            height={totalHeight + 40}
            sectionPositions={sectionPositions}
          />
        </Layer>
      </Stage>

      {/* Zoom controls */}
      <GsrsmZoomControls />

      {/* Context menu */}
      {contextMenuPosition && (
        <GsrsmContextMenu
          position={contextMenuPosition}
          options={contextMenuOptions}
          onClose={hideContextMenu}
        />
      )}
    </CanvasContainer>
  );
};

export default GsrsmCanvas;
