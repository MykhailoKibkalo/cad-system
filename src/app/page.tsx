'use client';

import styled from '@emotion/styled';
import CanvasArea from '../components/Canvas/CanvasArea';
import FloorInfoPanel from '@/components/ui/FloorInfoPanel';
import Header from '@/components/ui/Header';
import FloorsSidebar from '@/components/Floors/FloorsSidebar';
import { useFloorStore } from '@/state/floorStore';

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Atkinson Hyperlegible', sans-serif;
    padding: 0;
    margin: 0;
    overflow: hidden;
`;

const MainContent = styled.div<{ sidebarOpen: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: ${props => props.sidebarOpen ? '320px' : '0'};
    transition: margin-left 0.3s ease;
    position: relative;
    
    @media (max-width: 768px) {
        margin-left: 0;
    }
`;

export default function Page() {
  const isSidebarOpen = useFloorStore(state => state.isSidebarOpen);

  return (
    <PageContainer>
      <FloorsSidebar />
      <MainContent sidebarOpen={isSidebarOpen}>
        <Header />
        <CanvasArea />
        <FloorInfoPanel />
      </MainContent>
    </PageContainer>
  );
}
