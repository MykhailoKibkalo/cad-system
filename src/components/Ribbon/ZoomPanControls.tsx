// src/components/Ribbon/ZoomPanControls.tsx
'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '../../state/canvasStore';

const Group = styled.div`
    display: flex;
    align-items: center;
    margin-left: 8px;

    button {
        background: #e5e7eb;
        border: none;
        padding: 6px 10px;
        margin-right: 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        &.active {
            background: #2563eb;
            color: white;
        }
    }
`;

export default function ZoomPanControls() {
    const zoomLevel = useCanvasStore(s => s.zoomLevel);
    const setZoom   = useCanvasStore(s => s.setZoomLevel);
    const handMode  = useCanvasStore(s => s.handMode);
    const setHand   = useCanvasStore(s => s.setHandMode);

    console.log(zoomLevel);

    return (
        <Group>
            <button onClick={() => setZoom(Math.max(0.25, zoomLevel / 1.2))}>–</button>
            <button onClick={() => setZoom(1)}>{Math.round(zoomLevel * 100)}%</button>
            <button onClick={() => setZoom(Math.min(4, zoomLevel * 1.2))}>+</button>
            <button
                className={handMode ? 'active' : undefined}
                onClick={() => setHand(!handMode)}
            >
                {handMode ? '🤚' : '✋'}
            </button>
        </Group>
    );
}
