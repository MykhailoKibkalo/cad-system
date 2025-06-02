// src/app/page.tsx (Updated)
'use client';

import { useEffect } from 'react';
import styled from '@emotion/styled';
import CanvasArea from '../components/Canvas/CanvasArea';
import FloorInfoPanel from '@/components/ui/FloorInfoPanel';
import Header from '@/components/ui/Header';
import { useFloorStore } from '@/state/floorStore';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Atkinson Hyperlegible', sans-serif;
  padding: 0;
  margin: 0;
`;

export default function Page() {
  const { floors, addFloor, setCurrentFloor } = useFloorStore();

  // Initialize with a default floor if none exist
  useEffect(() => {
    if (floors.length === 0) {
      const defaultFloorId = addFloor('Level 1', 3100);
      setCurrentFloor(defaultFloorId);
    }
  }, [floors.length, addFloor, setCurrentFloor]);

  return (
    <PageContainer>
      <Header />
      <CanvasArea />
      <FloorInfoPanel />
    </PageContainer>
  );
}
