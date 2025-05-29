// src/components/ui/ControlItem.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';

interface ControlItemProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const Wrapper = styled.div<{ isActive?: boolean }>`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;


  &:hover > div.tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
`;

const Button = styled.button<{ isActive?: boolean }>`
  width: 48px;
  height: 48px;
  border: none; 
  border-radius: 12px;
  background: ${p => (p.isActive ? colors.primary : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  svg {
    color: ${p => (p.isActive ? colors.white : colors.black)};
    transition: color 0.2s;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 120%; 
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  padding: 6px 12px;
  background: ${colors.primary};
  color: ${colors.white};
  font-size: 14px;
  line-height: 1;
  border-radius: 8px;
  white-space: nowrap;

  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    transform 0.2s;

  &.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: ${colors.primary} transparent transparent transparent;
  }
`;

export const ControlItem: React.FC<ControlItemProps> = ({ label, icon, isActive = false, onClick }) => (
  <Wrapper isActive={isActive} onClick={onClick}>
    <Button isActive={isActive}>{icon}</Button>
    <Tooltip className="tooltip">{label}</Tooltip>
  </Wrapper>
);
