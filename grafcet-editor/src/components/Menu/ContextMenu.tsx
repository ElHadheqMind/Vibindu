import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Point, ContextMenuOption } from '../../models/types';

interface ContextMenuProps {
  position: Point;
  options: ContextMenuOption[];
  onClose: () => void;
}

const ContextMenuContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  gap: 8px;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const MenuItemIcon = styled.span`
  font-size: 14px;
  color: #555;
`;

const MenuItemLabel = styled.span`
  font-size: 14px;
`;

const ContextMenu: React.FC<ContextMenuProps> = ({ position, options, onClose }) => {
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
  
  // Adjust position to keep menu in viewport
  const adjustPosition = () => {
    if (!menuRef.current) return position;
    
    const { width, height } = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = position.x;
    let y = position.y;
    
    if (x + width > viewportWidth) {
      x = viewportWidth - width - 10;
    }
    
    if (y + height > viewportHeight) {
      y = viewportHeight - height - 10;
    }
    
    return { x, y };
  };
  
  const adjustedPosition = adjustPosition();
  
  return (
    <ContextMenuContainer ref={menuRef} x={adjustedPosition.x} y={adjustedPosition.y}>
      <MenuList>
        {options.map((option, index) => (
          <MenuItem key={index} onClick={() => handleOptionClick(option)}>
            {option.icon && <MenuItemIcon className={`icon-${option.icon}`}>{option.icon}</MenuItemIcon>}
            <MenuItemLabel>{option.label}</MenuItemLabel>
          </MenuItem>
        ))}
      </MenuList>
    </ContextMenuContainer>
  );
};

export default ContextMenu;
