import styled from '@emotion/styled';

export interface TextProps {
  size?: number | string;
  color?: string;
  weight?: number;
}

export const Text = styled.span<TextProps>`
  font-family: 'Atkinson Hyperlegible', sans-serif;
  font-size: ${props => (typeof props.size === 'number' ? `${props.size}px` : props.size || '16px')};
  color: ${props => props.color || 'inherit'};
  font-weight: ${props => (props.weight ? props.weight : '400')};
`;
