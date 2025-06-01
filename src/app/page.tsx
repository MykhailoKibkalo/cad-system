'use client';

import styled from '@emotion/styled';
import CanvasArea from '../components/Canvas/CanvasArea';
import FloorInfoPanel from '@/components/ui/FloorInfoPanel';
import Header from '@/components/ui/Header';

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Atkinson Hyperlegible', sans-serif;
    padding: 0;
    margin: 0;
`;

export default function Page() {
  return (
    <PageContainer>
      <Header />
      {/*<Ribbon />*/}
      <CanvasArea />
      <FloorInfoPanel />
    </PageContainer>
  );
}
