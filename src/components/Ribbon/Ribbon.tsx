// src/components/Ribbon/Ribbon.tsx
'use client';

import styled from '@emotion/styled';
import ImportPdfButton from './ImportPdfButton';
import { colors } from '@/styles/theme';
import CalibrateScaleButton from '@/components/Ribbon/CalibrateScaleButton';
import GridSizeControl from '@/components/Ribbon/GridSizeControl';
import PdfLockToggle from '@/components/Ribbon/PdfLockToggle';
import AddModuleButton from '@/components/Ribbon/AddModuleButton';
import FloorSettingsButton from '@/components/Ribbon/FloorSettingsButton';
import SnapModeToggle from '@/components/Ribbon/SnapModeToggle';
import ElementGapControl from '@/components/Ribbon/ElementGapControl';
import ZoomPanControls from '@/components/Ribbon/ZoomPanControls';
import CenterViewButton from '@/components/Ribbon/CenterViewButton';
import AddCorridorButton from '@/components/Ribbon/AddCorridorButton';
import { useCanvasStore } from '@/state/canvasStore';

const Container = styled.div`
  display: flex;
  align-items: center;
  height: 56px;
  background: ${colors.primary};
  padding: 0 16px;
  color: white;
`;

const Button = styled.button`
  margin-left: 8px;
  padding: 4px 12px;
  background: #0070f3;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default function Ribbon() {
  const toggleInfo = useCanvasStore(s => s.toggleInfo);

  return (
    <Container>
      <ImportPdfButton />
      <ZoomPanControls />
      <CenterViewButton />
      <PdfLockToggle />
      <CalibrateScaleButton />
      <GridSizeControl />
      <AddModuleButton />
      <AddCorridorButton />
      {/*<AddOpeningButton />*/}
      <FloorSettingsButton />
      <SnapModeToggle />
      <ElementGapControl />
      <Button onClick={toggleInfo}>Show Floor Info</Button>
    </Container>
  );
}
