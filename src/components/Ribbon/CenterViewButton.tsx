// src/components/Ribbon/CenterViewButton.tsx
'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '@/state/canvasStore';

const Btn = styled.button`
  margin-left: 8px;
  padding: 6px 10px;
  background: #e5e7eb;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default function CenterViewButton() {
    const { setZoomLevel } = useCanvasStore();
    const centerCanvas = useCanvasStore(s => s.centerCanvas!);

    return (
        <Btn onClick={() => {
            setZoomLevel(1);
            centerCanvas();  // функція, що ви реалізуєте нижче
        }}>
            🔄 Center
        </Btn>
    );
}
