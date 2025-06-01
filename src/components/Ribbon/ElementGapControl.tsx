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

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any decimal points and non-numeric characters
        value = value.replace(/[^\d]/g, '');

        const numValue = Math.max(0, Math.round(parseInt(value) || 0));
        setElementGapMm(numValue);
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const v = Math.max(0, Math.round(parseInt(e.target.value) || 0));
        setElementGapMm(v);
    };

    return (
        <Container>
            <label>
                Gap (mm):
                <input
                    type="number"
                    step="1"
                    min="0"
                    value={Math.round(elementGapMm)}
                    onChange={onChange}
                    onBlur={onBlur}
                />
            </label>
        </Container>
    );
}
