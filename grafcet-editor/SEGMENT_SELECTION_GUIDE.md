# GRAFCET Editor - Segment Selection and Movement Guide

## Overview
The GRAFCET editor now supports granular segment selection and movement for transition lines, allowing precise control over connection routing while maintaining proper GRAFCET constraints.

## Features

### Segment Selection
- **Individual Segment Selection**: Click on any intermediate segment handle to select it
- **Visual Feedback**: Selected segments are highlighted in green with enhanced handles
- **Constraint Compliance**: Only intermediate segments can be selected (first and last segments connecting to steps are protected)

### Movement Methods

#### Mouse Interaction
1. **Hover**: Hover over selectable segments to see visual feedback
2. **Click**: Click on a segment handle to select it
3. **Drag**: Drag selected segments while respecting perpendicularity constraints
   - Horizontal segments can only move vertically (up/down)
   - Vertical segments can only move horizontally (left/right)

#### Keyboard Interaction
1. **Select a segment** by clicking on its handle
2. **Use arrow keys** to move the selected segment:
   - `↑` / `↓`: Move segment up/down (for horizontal segments)
   - `←` / `→`: Move segment left/right (for vertical segments)
   - `Shift + Arrow`: Fine movement (1px increments)
   - `Arrow`: Normal movement (10px increments, snapped to grid)

### Keyboard Shortcuts
- `Escape`: Clear segment selection
- `Arrow Keys`: Move selected segment (if any) or selected elements
- Movement respects segment orientation constraints automatically

## Visual Indicators

### Segment States
- **Normal**: Default line color
- **Hovered**: Darker color with visible handle
- **Selected**: Green color with enhanced handle and shadow
- **Dragged**: Primary theme color with dashed line
- **Non-selectable**: Dimmed when connection is selected (first/last segments)

### Handle Appearance
- **Size**: Varies based on state (6px normal → 8px hovered → 9px selected → 10px dragged)
- **Color**: Matches segment state
- **Shadow**: Enhanced for selected and dragged states
- **Direction Indicator**: Small rectangle showing movement constraint direction

## Constraints and Validation

### Movement Constraints
- **Perpendicularity**: All movements maintain right angles
- **Grid Snapping**: Keyboard movements snap to the editor grid
- **Magnetic Snapping**: Mouse movements snap to nearby elements (15px threshold)
- **Connection Integrity**: Automatic constraint enforcement after movement

### Selection Constraints
- **Protected Segments**: First and last segments cannot be selected or moved
- **Minimum Segments**: Connections with fewer than 3 segments have no selectable segments
- **Tool Requirement**: Segment selection only works in 'select' tool mode

## Usage Workflow

### Basic Segment Movement
1. Switch to the select tool (`V` key or click select tool)
2. Click on a connection to select it
3. Click on an intermediate segment handle to select the segment
4. Use arrow keys or drag to move the segment
5. Press `Escape` to clear segment selection

### Precise Positioning
1. Select a segment as above
2. Use `Shift + Arrow Keys` for 1-pixel precision movement
3. Use regular `Arrow Keys` for 10-pixel grid-snapped movement
4. Visual feedback shows real-time preview during drag operations

## Technical Details

### State Management
- Global segment selection state managed in `useEditorStore`
- Local hover and drag states managed per connection
- Automatic cleanup when connections are deselected

### Constraint Enforcement
- Real-time constraint validation during movement
- Automatic path regeneration if constraints are violated
- Integration with existing connection routing algorithms

### Performance
- Optimized rendering with change detection
- Throttled updates during drag operations (120fps max)
- Efficient event handling with proper cleanup

## Troubleshooting

### Segment Not Selectable
- Ensure you're using the select tool
- Check that the segment is not the first or last in the connection
- Verify the connection has at least 3 segments

### Movement Not Working
- Confirm the segment is selected (green highlight)
- Check that you're using the correct arrow keys for the segment orientation
- Ensure the editor has focus (click on the canvas if needed)

### Visual Issues
- Refresh the browser if handles don't appear correctly
- Check that the connection is selected before trying to select segments
- Verify that manual mode is enabled for enhanced controls
