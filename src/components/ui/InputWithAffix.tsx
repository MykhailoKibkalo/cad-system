'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  inputWidth?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Label = styled.label<{ disabled?: boolean; required?: boolean }>`
  font-size: 16px;
  font-weight: 400;
  color: ${props => (props.disabled ? '#9ca3af' : colors.black)};
  margin-bottom: 8px;

  ${props =>
    props.required &&
    `
    &::after {
      content: ' *';
      color: #ef4444;
    }
  `}
`;

const InputWrapper = styled.div<{
  isFocused: boolean;
  disabled?: boolean;
  hasError?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  border: 1px solid
    ${props => {
      if (props.hasError) return '#ef4444';
      if (props.disabled) return '#e5e7eb';
      if (props.isFocused) return '#8b5cf6';
      return '#d1d5db';
    }};
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => (props.disabled ? '#f9fafb' : colors.white)};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => {
      if (props.hasError) return '#dc2626';
      if (props.disabled) return '#e5e7eb';
      return '#8b5cf6';
    }};
  }

  ${props =>
    props.isFocused &&
    !props.disabled &&
    `
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  `}

  ${props =>
    props.hasError &&
    `
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  `}
`;

const Affix = styled.span<{ disabled?: boolean }>`
  padding: 0 12px;
  font-size: 16px;
  color: ${props => (props.disabled ? '#9ca3af' : '#6b7280')};
  white-space: nowrap;
  user-select: none;
`;

const StyledInput = styled.input<{
  inputWidth?: string;
  hasPrefix?: boolean;
  hasSuffix?: boolean;
}>`
  width: ${props => props.inputWidth ?? '100%'};
  padding: 12px;
  padding-left: ${props => (props.hasPrefix ? '8px' : '12px')};
  padding-right: ${props => (props.hasSuffix ? '8px' : '12px')};
  font-size: 16px;
  font-weight: 400;
  color: ${colors.black};
  background: transparent;
  border: none;
  outline: none;
  min-height: 20px;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }

  /* Remove number input arrows */
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const HelperText = styled.span<{ isError?: boolean }>`
  font-size: 14px;
  color: ${props => (props.isError ? '#ef4444' : '#6b7280')};
  margin-top: 6px;
`;

export const Input: React.FC<InputProps> = ({
  label,
  prefix,
  suffix,
  inputWidth,
  error,
  helperText,
  required,
  disabled,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <Container>
      {label && (
        <Label disabled={disabled} required={required}>
          {label}
        </Label>
      )}

      <InputWrapper isFocused={isFocused} disabled={disabled} hasError={!!error}>
        {prefix && <Affix disabled={disabled}>{prefix}</Affix>}
        <StyledInput
          {...inputProps}
          inputWidth={inputWidth}
          hasPrefix={!!prefix}
          hasSuffix={!!suffix}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {suffix && <Affix disabled={disabled}>{suffix}</Affix>}
      </InputWrapper>

      {(error || helperText) && <HelperText isError={!!error}>{error || helperText}</HelperText>}
    </Container>
  );
};

// Legacy component for backward compatibility
export const InputWithAffix: React.FC<InputProps> = Input;
