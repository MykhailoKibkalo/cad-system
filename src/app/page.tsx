// src/app/page.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import { CadProvider } from '@/context/CadContext';
import { HistoryProvider } from '@/context/HistoryContext';
import FabricCanvas from '../components/canvas/FabricCanvas';
import PropertyPanel from '../components/ui/PropertyPanel';
import FloorSelector from '../components/ui/FloorSelector';
import PdfBackdropControls from '../components/pdf/PdfBackdrop';
import DebugHelper from '@/components/debug/DebugHelper';

// Import our new components
import ImprovedToolbar from '@/components/ui/ImprovedToolbar';
import ZoomControls from '@/components/ui/ZoomControls';
import ResizablePanel from '@/components/ui/ResizablePanel';

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
  position: relative; /* For absolute positioning of the zoom controls */
`;

const MainContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

export default function Home() {
  return (
    <CadProvider>
      <HistoryProvider>
        <AppContainer>
          {/* Replace the old toolbar with the improved one */}
          <ImprovedToolbar />

          <ContentContainer>
            <MainContent>
              <FabricCanvas />
              {/* Add zoom controls */}
              <ZoomControls />
            </MainContent>

            {/* Use ResizablePanel for the side panel */}
            <ResizablePanel defaultWidth={320} minWidth={250} maxWidth={500} title="Properties">
              <PropertyPanel />
              <PdfBackdropControls />
              <FloorSelector />
            </ResizablePanel>
          </ContentContainer>

          {/* Keep debug helper */}
          <DebugHelper />
        </AppContainer>
      </HistoryProvider>
    </CadProvider>
  );
}
