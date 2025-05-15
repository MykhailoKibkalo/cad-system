'use client';

import styled from '@emotion/styled';
import { useToolStore } from '../../state/toolStore';

const Btn = styled.button<{ active: boolean }>`
  margin-left: 8px;
  padding: 8px 16px;
  background: ${({ active }) => (active ? '#f59e0b' : '#fbbf24')};
  color: white;
  border-radius: 4px;
  opacity: ${({ active }) => (active ? 1 : 0.8)};
`;

export default function AddOpeningButton() {
    const { tool, setTool } = useToolStore();
    const active = tool === 'opening';
    return (
        <Btn active={active} onClick={() => setTool(active ? 'select' : 'opening')}>
            Add Opening
        </Btn>
    );
}
