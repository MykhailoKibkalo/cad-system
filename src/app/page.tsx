// src/app/page.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import { CadProvider } from '@/context/CadContext';
import { HistoryProvider } from '@/context/HistoryContext';
import FabricCanvas from '../components/canvas/FabricCanvas';
import Toolbar from '../components/ui/Toolbar';
import PropertyPanel from '../components/ui/PropertyPanel';
import FloorSelector from '../components/ui/FloorSelector';
import PdfBackdropControls from '../components/pdf/PdfBackdrop';
import DebugHelper from '@/components/debug/DebugHelper';
import ForceToolSelection from '@/components/ui/ForceToolSelection';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  border-left: 1px solid #ccc;
  overflow: hidden;
`;

const PropertyPanelContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

export default function Home() {
  return (
    <CadProvider>
      <HistoryProvider>
        <AppContainer>
          <Toolbar />
          <ContentContainer>
            <FabricCanvas />
            <SidePanel>
              <PropertyPanelContainer>
                <PropertyPanel />
              </PropertyPanelContainer>
              <PdfBackdropControls />
              <FloorSelector />
            </SidePanel>
          </ContentContainer>
          <ForceToolSelection />
          <DebugHelper />
        </AppContainer>
      </HistoryProvider>
    </CadProvider>
  );
}
