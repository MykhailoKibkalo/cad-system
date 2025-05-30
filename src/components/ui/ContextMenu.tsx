'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import {CgMoreAlt} from "react-icons/cg";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerClassName?: string;
}

const Container = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const MenuDropdown = styled.div<{ show: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
  opacity: ${props => (props.show ? 1 : 0)};
  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.show ? '0' : '-4px')});
  transition: all 0.2s ease;
`;

const MenuItem = styled.button<{ danger?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 14px;
  color: ${props => {
    if (props.disabled) return '#9ca3af';
    if (props.danger) return '#dc2626';
    return '#374151';
  }};
  transition: background 0.2s ease;
  opacity: ${props => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${props => {
      if (props.disabled) return 'transparent';
      if (props.danger) return '#fef2f2';
      return '#f8fafc';
    }};
  }

  &:first-of-type {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-of-type {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, triggerClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;

    setIsOpen(false);
    item.onClick();
  };

  return (
    <Container ref={containerRef} className={triggerClassName}>
      <MenuButton onClick={handleToggle}>
          <CgMoreAlt size={24} />
      </MenuButton>
      <MenuDropdown show={isOpen}>
        {items.map((item, index) => (
          <MenuItem key={index} danger={item.danger} disabled={item.disabled} onClick={() => handleItemClick(item)}>
            {item.icon}
            {item.label}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Container>
  );
};
