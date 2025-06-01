'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '@/state/canvasStore';

const Container = styled.div`
    display: flex;
    align-items: center;
    margin-left: 12px;
    color: white;
    font-size: 14px;
`;

const Label = styled.label`
    margin-right: 6px;
`;

const Input = styled.input`
    width: 60px;
    padding: 4px;
    border: none;
    border-radius: 4px;
    text-align: right;
`;

export default function GridSizeControl() {
    const gridSizeMm = useCanvasStore(s => s.gridSizeMm);
    const setGridSize = useCanvasStore(s => s.setGridSize);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any decimal points and non-numeric characters
        value = value.replace(/[^\d]/g, '');

        const v = parseInt(value, 10);
        if (!isNaN(v) && v > 0) {
            setGridSize(Math.round(v));
        }
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const v = Math.max(1, Math.round(parseInt(e.target.value) || 1));
        setGridSize(v);
    };

    return (
        <Container>
            <Label htmlFor="grid-size">Grid:</Label>
            <Input
                id="grid-size"
                type="number"
                step="1"
                min="1"
                value={Math.round(gridSizeMm)}
                onChange={onChange}
                onBlur={onBlur}
            />
            <span>mm</span>
        </Container>
    );
}
