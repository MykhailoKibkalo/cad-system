// src/components/Ribbon/ElementGapControl.tsx
'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '../../state/canvasStore';

const Container = styled.div`
  margin-left: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;

  label {
    display: flex;
    align-items: center;
  }

  input {
    width: 60px;
    margin-left: 4px;
    padding: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;

export default function ElementGapControl() {
  const { snapMode, elementGapMm, setElementGapMm } = useCanvasStore();
  if (snapMode !== 'element') return null;

  return (
    <Container>
      <label>
        Gap (mm):
        <input
          type="number"
          min={0}
          value={elementGapMm}
          onChange={e => setElementGapMm(Math.max(0, +e.target.value))}
        />
      </label>
    </Container>
  );
}
