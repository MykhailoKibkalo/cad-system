// src/components/ui/Dropdown.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { LuCheck, LuChevronDown } from 'react-icons/lu';

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  className?: string;
}

const Wrapper = styled.div<{ width?: string }>`
  position: relative;
  width: ${props => props.width || '100%'};
`;

const Trigger = styled.div<{ isOpen: boolean; disabled?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  font-size: 16px;
  font-weight: 400;
  color: ${props => (props.disabled ? colors.gray : colors.black)};
  background-color: ${props => (props.disabled ? '#f9fafb' : colors.white)};
  border: 1px solid ${props => (props.isOpen ? '#8b5cf6' : '#d1d5db')};
  border-radius: 8px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  user-select: none;
  min-height: 48px;

  &:hover {
    border-color: ${props => (props.disabled ? '#DADADA' : '#636DF8')};
  }

  &:focus {
    outline: none;
    border-color: #636DF8;
  }
`;

const Arrow = styled(LuChevronDown)<{ isOpen: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%) rotate(${props => (props.isOpen ? '180deg' : '0deg')});
  pointer-events: none;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const DropdownList = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${colors.white};
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 4px 6px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;

  /* Custom scrollbar */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;

const DropdownOption = styled.div<{ isSelected: boolean; disabled?: boolean }>`
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 400;
  color: ${props => {
    if (props.disabled) return '#9ca3af';
    return colors.black;
  }};
  background-color: ${props => (props.isSelected ? '#EFF0FE' : 'transparent')};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;

  &:hover {
    background-color: ${props => {
      if (props.disabled) return 'transparent';
      if (props.isSelected) return '#ddd6fe';
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

const OptionLabel = styled.span`
  flex: 1;
`;

const CheckIcon = styled(LuCheck)<{ isVisible: boolean }>`
  color: #636DF8;
  opacity: ${props => (props.isVisible ? 1 : 0)};
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-left: 8px;
`;

const Placeholder = styled.span`
  color: #9ca3af;
`;

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  width,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Could add keyboard navigation logic here
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Could add keyboard navigation logic here
          break;
        case 'Enter':
          event.preventDefault();
          // Could add selection logic here
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === value);

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string | number) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  return (
    <Wrapper ref={wrapperRef} width={width} className={className}>
      <Trigger
        ref={triggerRef}
        isOpen={isOpen}
        disabled={disabled}
        onClick={handleTriggerClick}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOption ? selectedOption.label : <Placeholder>{placeholder}</Placeholder>}
        <Arrow isOpen={isOpen} size={20} />
      </Trigger>

      <DropdownList isOpen={isOpen} role="listbox">
        {options.map(option => (
          <DropdownOption
            key={option.value}
            isSelected={option.value === value}
            disabled={option.disabled}
            onClick={() => !option.disabled && handleOptionClick(option.value)}
            role="option"
            aria-selected={option.value === value}
          >
            <OptionLabel>{option.label}</OptionLabel>
            <CheckIcon isVisible={option.value === value} size={18} />
          </DropdownOption>
        ))}
      </DropdownList>
    </Wrapper>
  );
};
