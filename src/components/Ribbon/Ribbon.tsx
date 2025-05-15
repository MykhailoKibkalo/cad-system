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
import AddCorridorButton from "@/components/Ribbon/AddCorridorButton";

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
      <ZoomPanControls />
      <CenterViewButton />
      <PdfLockToggle />
      <CalibrateScaleButton />
      <GridSizeControl />
      <AddModuleButton />
        <AddCorridorButton/>
      {/*<AddOpeningButton />*/}
      <FloorSettingsButton />
      <SnapModeToggle />
      <ElementGapControl />
    </Container>
  );
}
