import React from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { LuMinus, LuPlus } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useCanvasStore } from '@/state/canvasStore';

const ZoomControlWrap = styled.div`
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-shadow: -4px 0 4px rgba(0, 0, 0, 0.1);
  background-color: ${colors.white};
  border-radius: 16px;
  z-index: 1000;
  align-items: center;
  width: 60px;
`;

const IconWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  cursor: pointer;
`;

const ZoomControl = () => {
  const zoomLevel = useCanvasStore(s => s.zoomLevel);
  const setZoom = useCanvasStore(s => s.setZoomLevel);
  return (
    <ZoomControlWrap>
      <IconWrap onClick={() => setZoom(Math.min(5, zoomLevel * 1.2))}>
        <LuPlus size={18} />
      </IconWrap>
      <Divider orientation="horizontal" />
      <Text onClick={() => setZoom(1)} style={{ marginTop: 14, marginBottom: 14, cursor: 'pointer' }} size={12}>
        {Math.round(zoomLevel * 100)}%
      </Text>
      <Divider orientation="horizontal" />
      <IconWrap onClick={() => setZoom(Math.max(0.05, zoomLevel / 1.2))}>
        <LuMinus size={18} />
      </IconWrap>
    </ZoomControlWrap>
  );
};

export default ZoomControl;
