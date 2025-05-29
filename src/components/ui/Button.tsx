// components/Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styled from '@emotion/styled';
import { Text } from '@/components/ui/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const StyledButton = styled.button<{ variant: ButtonVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Atkinson Hyperlegible', sans-serif;
  border: none;
  min-height: 44px;

  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: #636DF8;
          color: white;
          border: none;

          &:hover:not(:disabled) {
            background-color: #464DB0;
          }

          &:active:not(:disabled) {
            background-color: #5A63E2;
          }

          &:disabled {
            background-color: #AAAAAA;
            cursor: not-allowed;
          }
        `;

      case 'secondary':
        return `
          background-color: transparent;
          color: #636DF8;
          border: 1px solid #636DF8;

          &:hover:not(:disabled) {
            background-color: #636DF8;
            color: white;
          }

          &:active:not(:disabled) {
            background-color: #5A63E2;
            border-color: #5A63E2;
            color: white;
          }

          &:disabled {
            background-color: transparent;
            color: #AAAAAA;
            border-color: #AAAAAA;
            cursor: not-allowed;
          }
        `;

      case 'danger':
        return `
          background-color: #FFE7E7;
          color: #EF4444;
          border: none;

          &:hover:not(:disabled) {
            background-color: #EF4444;
            color: white;
          }

          &:active:not(:disabled) {
            background-color: #D83C3C;
            color: white;
          }

          &:disabled {
            background-color: #F5F5F5;
            color: #AAAAAA;
            cursor: not-allowed;
          }
        `;

      case 'ghost':
      default:
        return `
          background-color: transparent;
          color: #636DF8;
          border: none;

          &:hover:not(:disabled) {
            background-color: #EFF0FE;
          }

          &:active:not(:disabled) {
            background-color: #636DF8;
            color: white;
          }

          &:disabled {
            background-color: transparent;
            color: #AAAAAA;
            cursor: not-allowed;
          }
        `;
    }
  }}
  /* Icon styling - uses currentColor to inherit button text color */
    svg {
    color: currentColor;
    transition: color 0.2s ease;
  }

  /* Remove default button focus outline and add custom */

  &:focus-visible {
    outline: 2px solid #636df8;
    outline-offset: 2px;
  }
`;

const ButtonText = styled(Text)<{ variant: ButtonVariant; disabled?: boolean }>`
  transition: color 0.2s ease;
`;

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon, children, disabled, ...rest }) => (
  <StyledButton variant={variant} disabled={disabled} {...rest}>
    {icon}
    <ButtonText variant={variant} disabled={disabled} weight={600}>
      {children}
    </ButtonText>
  </StyledButton>
);
