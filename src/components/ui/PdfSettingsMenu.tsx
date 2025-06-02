// src/components/ui/PDFSettingsPanel.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { InputWithAffix } from '@/components/ui/InputWithAffix';
import { LuFileX, LuLock, LuLockOpen, LuRuler, LuSettings } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';
import { colors } from '@/styles/theme';
import { useFloorStore } from '@/state/floorStore';

interface PDFSettingsPanelProps {
  onDeletePdf: () => void;
  onRecalibrate: () => void;
}

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
  min-width: 380px;
  background: ${colors.white};
  border: 1px solid #e2e8f0;
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

const StatusIndicator = styled.div<{ calibrated: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => (props.calibrated ? '#dcfce7' : '#fef2f2')};
  color: ${props => (props.calibrated ? '#166534' : '#dc2626')};
`;

const StatusDot = styled.div<{ calibrated: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => (props.calibrated ? '#22c55e' : '#ef4444')};
`;

export const PDFSettingsPanel: React.FC<PDFSettingsPanelProps> = ({ onDeletePdf, onRecalibrate }) => {
  const { getCurrentFloor, setFloorPDFLocked, setFloorPDF } = useFloorStore();

  const currentFloor = getCurrentFloor();
  const pdf = currentFloor?.pdf;
  const pdfLocked = currentFloor?.pdfLocked || false;

  if (!currentFloor || !pdf) return null;

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) / 100;
    setFloorPDF(currentFloor.id, { ...pdf, opacity: value });
  };

  const handleOpacityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setFloorPDF(currentFloor.id, { ...pdf, opacity: numValue / 100 });
  };

  const handleLockToggle = (locked: boolean) => {
    setFloorPDFLocked(currentFloor.id, locked);
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
            <Toggle checked={pdfLocked} onChange={handleLockToggle} />
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
              <InfoValue>{Math.round(pdf.widthGrid)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Height (grid units)</InfoLabel>
              <InfoValue>{Math.round(pdf.heightGrid)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Grid size</InfoLabel>
              <InfoValue>{Math.round(currentFloor.gridSettings.gridSize)} mm</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Calibrated</InfoLabel>
              <InfoValue>
                <StatusIndicator calibrated={pdf.calibrated}>
                  <StatusDot calibrated={pdf.calibrated} />
                  {pdf.calibrated ? 'Yes' : 'No'}
                </StatusIndicator>
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
                value={Math.round(pdf.opacity * 100)}
                onChange={handleOpacityChange}
              />
              <div style={{ minWidth: '60px' }}>
                <InputWithAffix
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(pdf.opacity * 100)}
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
            {!pdf.calibrated && (
              <Button variant="secondary" icon={<LuRuler size={16} />} onClick={onRecalibrate} style={{ flex: 1 }}>
                Calibrate
              </Button>
            )}
          </div>
        </Section>
      </Popup>
    </Container>
  );
};
