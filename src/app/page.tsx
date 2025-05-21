'use client';

import styled from '@emotion/styled';
import Ribbon from '../components/Ribbon/Ribbon';
import CanvasArea from '../components/Canvas/CanvasArea';
import FloorInfoPanel from '@/components/ui/FloorInfoPanel';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

export default function Page() {
  return (
    <PageContainer>
      <Ribbon />
      <CanvasArea />
      <FloorInfoPanel />
    </PageContainer>
  );
}
