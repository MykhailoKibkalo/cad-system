// src/components/Ribbon/AddBathroomPodButton.tsx
'use client';

import styled from '@emotion/styled';
import { useToolStore } from '@/state/toolStore';

const Btn = styled.button<{ active: boolean }>`
  margin-left: 8px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  opacity: ${({ active }) => (active ? 1 : 0.7)};
`;

export default function AddBathroomPodButton() {
    const { tool, setTool } = useToolStore();
    const active = tool === 'bathroomPod';
    return (
        <Btn active={active} onClick={() => setTool(active ? 'select' : 'bathroomPod')}>
            Add Bathroom Pod
        </Btn>
    );
}
