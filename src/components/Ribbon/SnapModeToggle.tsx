'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '../../state/canvasStore';

const Group = styled.div`
  display: flex;
  margin-left: 8px;

  button {
    padding: 6px 12px;
    border: none;
    background: #ddd;
    cursor: pointer;

    &.active {
      background: #2563eb;
      color: white;
    }

    &:not(:last-child) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    &:not(:first-child) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
`;

export default function SnapModeToggle() {
  const { snapMode, setSnapMode } = useCanvasStore();
  return (
    <Group>
      {(['off', 'grid', 'element'] as const).map(mode => (
        <button key={mode} className={snapMode === mode ? 'active' : undefined} onClick={() => setSnapMode(mode)}>
          {mode === 'off' ? 'No Snap' : mode === 'grid' ? 'Snap to Grid' : 'Snap to Elmnt'}
        </button>
      ))}
    </Group>
  );
}
