'use client';

import styled from '@emotion/styled';
import { useToolStore } from '../../state/toolStore';

const Btn = styled.button`
  margin-left: 8px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  opacity: ${({ active }: { active: boolean }) => (active ? 1 : 0.7)};
`;

export default function AddModuleButton() {
  const { tool, setTool } = useToolStore();
  const active = tool === 'module';
  return (
    <Btn active={active} onClick={() => setTool(active ? 'select' : 'module')}>
      Add Module
    </Btn>
  );
}
