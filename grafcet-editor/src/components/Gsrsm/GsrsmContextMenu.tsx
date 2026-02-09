import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Point, ContextMenuOption } from '../../models/types';

interface GsrsmContextMenuProps {
  position: Point;
  options: ContextMenuOption[];
  onClose: () => void;
}

const ContextMenuContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  background-color: ${props => props.theme.surfaceRaised};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  box-shadow: 0 2px 10px ${props => props.theme.shadow};
  z-index: 1000;
  min-width: 150px;
  max-width: 250px;
  overflow: hidden;
`;

const MenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const MenuItem = styled.li`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${props => props.theme.text};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.surfaceHover};
  }
`;

const MenuItemIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

const MenuItemLabel = styled.span`
  flex: 1;
`;

const GsrsmContextMenu: React.FC<GsrsmContextMenuProps> = ({ position, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle option click
  const handleOptionClick = (option: ContextMenuOption) => {
    option.action();
    onClose();
  };
  
  // Adjust position to ensure menu stays within viewport
  const adjustPosition = () => {
    if (!menuRef.current) return position;
    
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedX = position.x;
    let adjustedY = position.y;
    
    // Adjust horizontal position if menu would go off-screen
    if (position.x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }
    
    // Adjust vertical position if menu would go off-screen
    if (position.y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10;
    }
    
    return { x: adjustedX, y: adjustedY };
  };
  
  const adjustedPosition = adjustPosition();
  
  return (
    <ContextMenuContainer ref={menuRef} x={adjustedPosition.x} y={adjustedPosition.y}>
      <MenuList>
        {options.map((option, index) => (
          <MenuItem key={index} onClick={() => handleOptionClick(option)}>
            {option.icon && <MenuItemIcon>{option.icon}</MenuItemIcon>}
            <MenuItemLabel>{option.label}</MenuItemLabel>
          </MenuItem>
        ))}
      </MenuList>
    </ContextMenuContainer>
  );
};

export default GsrsmContextMenu;
