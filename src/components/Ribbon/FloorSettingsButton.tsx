// src/components/Ribbon/FloorSettingsButton.tsx
'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { useCanvasStore } from '../../state/canvasStore';

const Btn = styled.button`
  margin-left: 8px;
  padding: 8px 16px;
  background: #6b7280;
  color: white;
  border-radius: 4px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const Modal = styled.div`
  position: absolute;
  top: 80px;
  right: 16px;
  background: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  min-width: 200px;
  font-family: sans-serif;
`;

export default function FloorSettingsButton() {
  const [open, setOpen] = useState(false);
  const { floorName, floorHeightMm, setFloorName, setFloorHeight } = useCanvasStore();

  return (
    <>
      <Btn onClick={() => setOpen(v => !v)}>
        Floor: {floorName} ({floorHeightMm} mm)
      </Btn>
      {open && (
        <Overlay onClick={() => setOpen(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 8 }}>
              <label>
                Name:&nbsp;
                <input type="text" value={floorName} onChange={e => setFloorName(e.target.value)} />
              </label>
            </div>
            <div>
              <label>
                Height (mm):&nbsp;
                <input
                  type="number"
                  min={1}
                  value={floorHeightMm}
                  onChange={e => setFloorHeight(Math.max(1, +e.target.value))}
                />
              </label>
            </div>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </Modal>
        </Overlay>
      )}
    </>
  );
}
