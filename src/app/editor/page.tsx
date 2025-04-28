'use client';

import styled from '@emotion/styled';
import Ribbon from '@/components/Ribbon/Ribbon';
import Sidebar from '@/components/Sidebar/Sidebar';
import CanvasWrapper from '@/components/CanvasWrapper';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
`;

export default function EditorPage() {
  return (
    <EditorContainer>
      <Ribbon />
      <ContentContainer>
        <MainContent>
          <CanvasWrapper />
        </MainContent>
        <Sidebar />
      </ContentContainer>
    </EditorContainer>
  );
}
