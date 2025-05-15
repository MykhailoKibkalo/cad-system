'use client';

import styled from '@emotion/styled';
import { useCanvasStore } from '../../state/canvasStore';

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-left: 12px;
  color: white;
  font-size: 14px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Checkbox = styled.input`
  margin-right: 4px;
`;

export default function PdfLockToggle() {
    const pdfLocked = useCanvasStore(s => s.pdfLocked);
    const setPdfLocked = useCanvasStore(s => s.setPdfLocked);

    return (
        <Container>
            <Label>
                <Checkbox
                    type="checkbox"
                    checked={pdfLocked}
                    onChange={e => setPdfLocked(e.target.checked)}
                />
                Lock PDF
            </Label>
        </Container>
    );
}
