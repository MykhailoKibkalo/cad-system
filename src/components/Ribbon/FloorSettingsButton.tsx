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

    const onHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any decimal points and non-numeric characters
        value = value.replace(/[^\d]/g, '');

        const numValue = Math.max(1, Math.round(parseInt(value) || 1));
        setFloorHeight(numValue);
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const v = Math.max(1, Math.round(parseInt(e.target.value) || 1));
        setFloorHeight(v);
    };

    return (
        <>
            <Btn onClick={() => setOpen(v => !v)}>
                Floor: {floorName} ({Math.round(floorHeightMm)} mm)
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
                                    step="1"
                                    min="1"
                                    value={Math.round(floorHeightMm)}
                                    onChange={onHeightChange}
                                    onBlur={onBlur}
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
