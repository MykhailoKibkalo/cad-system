// components/Divider.tsx
import React from 'react';
import styled from '@emotion/styled';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: DividerOrientation;
  length?: number | string;
}

const StyledDivider = styled.div<Required<Pick<DividerProps, 'orientation'>> & Pick<DividerProps, 'length'>>`
  background-color: #E7E7E7;
  flex-shrink: 1;

  ${p =>
    p.orientation === 'horizontal'
      ? `
    height: 1px;
    width: ${typeof p.length === 'number' ? `${p.length}px` : p.length || '100%'};
  `
      : `
    width: 1px;
    height: ${typeof p.length === 'number' ? `${p.length}px` : p.length || '100%'};
  `}
`;

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', length, style, ...rest }) => (
  <StyledDivider orientation={orientation} length={length} style={style} {...rest} />
);
