// src/components/Ribbon/ImportPdfButton.tsx
'use client';

import styled from '@emotion/styled';
import { colors } from '@/styles/theme';

const Label = styled.label`
  padding: 8px 16px;
  background: ${colors.secondary};
  border-radius: 4px;
  cursor: pointer;
  color: white;
`;

const Input = styled.input`
  display: none;
`;

export default function ImportPdfButton() {
  return (
    <>
      <Label htmlFor="pdfInput">Import PDF</Label>
      <Input id="pdfInput" type="file" accept="application/pdf" />
    </>
  );
}
