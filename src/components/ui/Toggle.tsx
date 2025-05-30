// components/Toggle.tsx
import React from 'react';
import styled from '@emotion/styled';

interface ToggleProps {
  /** Поточний стан */
  checked: boolean;
  /** Обробник перемикання */
  onChange: (newState: boolean) => void;
  width?: number;
  height?: number;
}

const SwitchLabel = styled.label<{ width: number; height: number }>`
  position: relative;
  display: inline-block;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  margin: 0;
  cursor: pointer;
  z-index: 2;
`;

const Slider = styled.span<{ checked: boolean; width: number; height: number }>`
  position: absolute;
  inset: 0;
  border-radius: ${p => p.height / 2}px;
  background-color: ${p => (p.checked ? '#636DF8' : '#2C2C2C')};
  transition: background-color 0.3s ease;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: ${p => (p.checked ? `calc(100% - ${p.height - 2}px)` : '2px')};
    transform: translateY(-50%);
    width: ${p => p.height - 4}px;
    height: ${p => p.height - 4}px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: left 0.3s ease;
  }
`;

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, width = 51, height = 31 }) => {
  return (
    <SwitchLabel width={width} height={height}>
      <HiddenCheckbox type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <Slider checked={checked} width={width} height={height} />
    </SwitchLabel>
  );
};
