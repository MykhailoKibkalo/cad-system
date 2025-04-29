// src/components/Ribbon/Ribbon.tsx
'use client';

import styled from '@emotion/styled';
import ImportPdfButton from './ImportPdfButton';
import { colors } from '@/styles/theme';
import CalibrateScaleButton from '@/components/Ribbon/CalibrateScaleButton';

const Container = styled.div`
  display: flex;
  align-items: center;
  height: 56px;
  background: ${colors.primary};
  padding: 0 16px;
  color: white;
`;

export default function Ribbon() {
  return (
    <Container>
      <ImportPdfButton />
      <CalibrateScaleButton />
      {/* Тут згодом будуть інші кнопки інструментів */}
    </Container>
  );
}
