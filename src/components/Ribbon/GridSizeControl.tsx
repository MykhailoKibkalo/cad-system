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
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v > 0) {
            setGridSize(v);
        }
    };

    return (
        <Container>
            <Label htmlFor="grid-size">Grid:</Label>
            <Input
                id="grid-size"
                type="number"
                min="1"
                value={gridSizeMm}
                onChange={onChange}
            />
            <span>mm</span>
        </Container>
    );
}
