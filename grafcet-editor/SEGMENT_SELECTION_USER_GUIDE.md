# GRAFCET Editor - Segment Selection User Guide

## 🎯 Overview

The GRAFCET editor now supports granular segment selection and movement for transition lines, allowing you to precisely control connection routing while maintaining proper GRAFCET constraints.

## 🚀 Getting Started

### Prerequisites
- Ensure you're in **Select Tool** mode (press `V` key or click the select tool)
- Have a GRAFCET diagram with connections between elements

### Basic Workflow
1. **Select a Connection** - Click on any connection line
2. **Identify Selectable Segments** - Look for circular handles on intermediate segments
3. **Select a Segment** - Click on a segment handle (it will turn green)
4. **Move the Segment** - Use arrow keys or drag to reposition
5. **Clear Selection** - Press `Escape` or select a different element

## 🎮 Interaction Methods

### Mouse Interaction

#### Selecting Segments
- **Click** on circular handles that appear on connection segments
- Only intermediate segments can be selected (first and last segments are protected)
- Selected segments turn **green** with enhanced visual feedback

#### Moving Segments
- **Drag** selected segments to reposition them
- Movement is constrained to maintain perpendicularity:
  - **Horizontal segments**: Can only move up/down (vertically)
  - **Vertical segments**: Can only move left/right (horizontally)

#### Visual Feedback
- **Hover**: Segments show handles and appropriate resize cursors
- **Selected**: Green highlighting with enhanced handles and shadows
- **Non-selectable**: "Not allowed" cursor and dimmed appearance
- **Dragging**: Dashed lines with real-time preview

### Keyboard Interaction

#### Movement Controls
- **Arrow Keys**: Move selected segments in 10px increments (grid-snapped)
- **Shift + Arrow Keys**: Fine movement in 1px increments for precision
- **Movement Direction**: Automatically constrained based on segment orientation
  - `↑/↓` for horizontal segments (vertical movement)
  - `←/→` for vertical segments (horizontal movement)

#### Selection Controls
- **Escape**: Clear segment selection
- **V**: Switch to select tool (required for segment selection)

## 🔒 Constraints and Rules

### Selection Constraints
- **Protected Segments**: First and last segments cannot be selected or moved
- **Minimum Segments**: Connections need at least 3 segments to have selectable ones
- **Tool Requirement**: Only works when the Select tool is active
- **Connection Selection**: The connection must be selected first

### Movement Constraints
- **Perpendicularity**: All movements maintain right angles
- **Orientation Lock**: Segments can only move perpendicular to their direction
- **Grid Snapping**: Keyboard movements snap to the editor grid
- **Magnetic Snapping**: Mouse movements snap to nearby elements (15px threshold)
- **Connection Integrity**: Automatic validation ensures proper connections

## 🎨 Visual Indicators

### Segment States
| State | Visual Appearance |
|-------|------------------|
| **Normal** | Default line color |
| **Hovered** | Darker color with visible handle |
| **Selected** | Green color (#4CAF50) with enhanced handle |
| **Dragged** | Primary theme color with dashed line |
| **Non-selectable** | Dimmed (60% opacity) when connection is selected |

### Handle Appearance
- **Size**: 6px (normal) → 8px (hovered) → 9px (selected) → 10px (dragged)
- **Color**: Matches the segment state
- **Shadow**: Enhanced shadows for selected and dragged states
- **Direction Indicator**: Small rectangle showing movement constraint

### Cursor Feedback
- **Horizontal segments**: `ns-resize` cursor (up/down arrows)
- **Vertical segments**: `ew-resize` cursor (left/right arrows)
- **Non-selectable segments**: `not-allowed` cursor

## 📋 Step-by-Step Tutorial

### Tutorial 1: Basic Segment Selection
1. Create a GRAFCET diagram with at least two elements connected
2. Press `V` to activate the Select tool
3. Click on the connection line to select it
4. Look for circular handles on the connection segments
5. Click on a handle in the middle of the connection
6. Observe the green highlighting indicating selection

### Tutorial 2: Keyboard Movement
1. Follow Tutorial 1 to select a segment
2. Use arrow keys to move the segment:
   - If it's a horizontal segment, use `↑/↓` keys
   - If it's a vertical segment, use `←/→` keys
3. Hold `Shift` while pressing arrows for fine movement
4. Press `Escape` to clear the selection

### Tutorial 3: Mouse Movement
1. Select a segment as in Tutorial 1
2. Click and drag the green handle to move the segment
3. Notice how movement is constrained to the perpendicular direction
4. Release the mouse to complete the movement

### Tutorial 4: Complex Connections
1. Create elements that require complex connection paths
2. Select connections with multiple segments
3. Practice selecting different intermediate segments
4. Try to select first/last segments (should be blocked)
5. Move segments to create custom routing paths

## ⚠️ Troubleshooting

### Segment Not Selectable
- **Check Tool**: Ensure you're using the Select tool (`V` key)
- **Check Position**: Only intermediate segments can be selected
- **Check Segments**: Connection needs at least 3 segments
- **Check Selection**: Connection must be selected first

### Movement Not Working
- **Check Selection**: Ensure segment is selected (green highlight)
- **Check Direction**: Use correct arrow keys for segment orientation
- **Check Focus**: Click on canvas to ensure editor has keyboard focus
- **Check Tool**: Verify you're in Select tool mode

### Visual Issues
- **Refresh**: Reload the page if handles don't appear
- **Selection**: Ensure connection is selected before trying segments
- **Mode**: Check that you're in manual mode for enhanced controls

## 🎯 Best Practices

### Efficient Workflow
1. **Plan First**: Visualize the desired connection path before editing
2. **Select Wisely**: Choose the most appropriate segment for your adjustment
3. **Use Grid**: Leverage grid snapping for aligned layouts
4. **Fine-tune**: Use Shift+Arrow for precise positioning
5. **Validate**: Check that connections maintain proper flow

### Design Guidelines
- **Maintain Clarity**: Keep connection paths simple and readable
- **Avoid Overlaps**: Use segment movement to prevent line crossings
- **Follow Standards**: Respect GRAFCET conventions for flow direction
- **Test Thoroughly**: Verify connections work correctly after modifications

## 🔧 Advanced Tips

### Precision Editing
- Use `Shift + Arrow` keys for pixel-perfect positioning
- Leverage magnetic snapping to align with other elements
- Combine mouse and keyboard for optimal control

### Complex Routing
- Break complex paths into multiple segments for better control
- Use intermediate segments to create clean, organized layouts
- Consider element placement to minimize connection complexity

### Performance
- The system is optimized for smooth interaction
- Large diagrams maintain responsive segment manipulation
- Real-time preview provides immediate feedback

## 📞 Support

If you encounter issues or need assistance:
1. Check this guide for common solutions
2. Verify your GRAFCET diagram follows standard conventions
3. Ensure all elements are properly connected
4. Test with simpler diagrams to isolate issues

The segment selection feature enhances your ability to create professional, well-organized GRAFCET diagrams with precise control over connection routing!
