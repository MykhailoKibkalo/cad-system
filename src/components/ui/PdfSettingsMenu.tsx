// src/components/ui/PdfSettingsMenu.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { InputWithAffix } from '@/components/ui/InputWithAffix';
import { LuFileX, LuLock, LuLockOpen, LuSettings } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';

const Container = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div {
    visibility: visible;
    opacity: 1;
  }
`;

const TriggerButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const Popup = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 350px;
  background: ${colors.white};
  border: 1px solid ${colors.gray};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10000;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled(Text)`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled(Text)`
  font-size: 14px;
  font-weight: 600;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Slider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${colors.primary};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${colors.primary};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

interface PdfSettingsMenuProps {
  onDeletePdf: () => void;
  onRecalibrate?: () => void;
}

export const PdfSettingsMenu: React.FC<PdfSettingsMenuProps> = ({ onDeletePdf, onRecalibrate }) => {
  const { pdfLocked, pdfWidthGrid, pdfHeightGrid, pdfCalibrated, pdfOpacity, setPdfLocked, setPdfOpacity, gridSizeMm } =
    useCanvasStore();

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) / 100;
    setPdfOpacity(value);
  };

  const handleOpacityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setPdfOpacity(numValue / 100);
  };

  return (
    <Container>
      <TriggerButton>
        <LuSettings size={20} />
        <Text size={14}>PDF Settings</Text>
      </TriggerButton>

      <Popup onClick={e => e.stopPropagation()}>
        {/* Lock/Unlock Section */}
        <Section>
          <Row>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pdfLocked ? <LuLock size={18} /> : <LuLockOpen size={18} />}
              <Text size={16} weight={600}>
                Lock PDF
              </Text>
            </div>
            <Toggle checked={pdfLocked} onChange={setPdfLocked} />
          </Row>
          <Text size={12} color="#64748b">
            When locked, PDF cannot be selected or moved
          </Text>
        </Section>

        <Divider orientation="horizontal" />

        {/* PDF Properties Section */}
        <Section>
          <Text size={16} weight={600}>
            Properties
          </Text>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Width (grid units)</InfoLabel>
              <InfoValue>{pdfWidthGrid}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Height (grid units)</InfoLabel>
              <InfoValue>{pdfHeightGrid}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Grid size</InfoLabel>
              <InfoValue>{Math.round(gridSizeMm)} mm</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Calibrated</InfoLabel>
              <InfoValue style={{ color: pdfCalibrated ? '#059669' : '#dc2626' }}>
                {pdfCalibrated ? 'Yes' : 'No'}
              </InfoValue>
            </InfoItem>
          </InfoGrid>
        </Section>

        <Divider orientation="horizontal" />

        {/* Opacity Control Section */}
        <Section>
          <Text size={16} weight={600}>
            Opacity
          </Text>
          <SliderContainer>
            <SliderRow>
              <Slider
                type="range"
                min="0"
                max="100"
                value={Math.round(pdfOpacity * 100)}
                onChange={handleOpacityChange}
              />
              <div style={{ minWidth: '60px' }}>
                <InputWithAffix
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(pdfOpacity * 100)}
                  onChange={handleOpacityInputChange}
                  suffix="%"
                  inputWidth="50px"
                />
              </div>
            </SliderRow>
          </SliderContainer>
        </Section>

        <Divider orientation="horizontal" />

        {/* Action Buttons Section */}
        <Section>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="danger" icon={<LuFileX size={16} />} onClick={onDeletePdf} style={{ flex: 1 }}>
              Delete PDF
            </Button>
            {!pdfCalibrated && onRecalibrate && (
              <Button variant="secondary" onClick={onRecalibrate} style={{ flex: 1 }}>
                Recalibrate
              </Button>
            )}
          </div>
        </Section>
      </Popup>
    </Container>
  );
};
