// src/components/ui/ConfirmImportModal.tsx
'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { ImportOptions, ProjectExport } from '@/types/floor';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuTriangleAlert, LuDownload } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';

interface ConfirmImportModalProps {
  data: ProjectExport;
  onConfirm: (options: ImportOptions) => void;
  onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
`;

const Footer = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const HalfButton = styled(Button)`
  flex: 1;
`;

const WarningBox = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fef3cd;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoLabel = styled(Text)`
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled(Text)`
  font-weight: 600;
`;

const CheckboxSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #636df8;
  cursor: pointer;
  margin-top: 2px;
`;

const CheckboxContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const CheckboxLabel = styled(Text)`
  font-weight: 500;
  line-height: 1.4;
`;

const CheckboxDescription = styled(Text)`
  color: #64748b;
  font-size: 14px;
  line-height: 1.4;
`;

export default function ConfirmImportModal({ data, onConfirm, onCancel }: ConfirmImportModalProps) {
  const [options, setOptions] = useState<ImportOptions>({
    importFloors: true,
    importPDFs: true,
    importElements: true,
    importSettings: true,
  });

  const handleCheckboxChange = (key: keyof ImportOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({ ...prev, [key]: e.target.checked }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const hasAtLeastOneOption = Object.values(options).some(Boolean);

  // Calculate project statistics
  const totalFloors = data.floors.length;
  const totalModules = data.floors.reduce((sum, floor) => sum + floor.elements.modules.length, 0);
  const totalOpenings = data.floors.reduce((sum, floor) => sum + floor.elements.openings.length, 0);
  const totalPDFs = data.floors.filter(floor => floor.pdfData).length;
  const exportDate = new Date(data.meta.exportedAt).toLocaleString();

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LuDownload size={24} />
            <Text size={24} weight={700}>
              Import Project
            </Text>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            <HiMiniXMark size={24} />
          </Button>
        </Header>

        <Content>
          {/* Warning */}
          <WarningBox>
            <LuTriangleAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <Text size={14} weight={600} color="inherit">
                Importing will replace existing data
              </Text>
              <Text size={14} color="inherit" style={{ marginTop: '4px' }}>
                Selected data in your current project will be overwritten. This action cannot be undone.
              </Text>
            </div>
          </WarningBox>

          {/* Project Information */}
          <div>
            <Text size={18} weight={600} style={{ marginBottom: '12px' }}>
              Project Information
            </Text>
            <ProjectInfo>
              <InfoRow>
                <InfoLabel>Building Name</InfoLabel>
                <InfoValue>{data.building?.name || 'Untitled Building'}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Exported</InfoLabel>
                <InfoValue>{exportDate}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Floors</InfoLabel>
                <InfoValue>{totalFloors}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Modules</InfoLabel>
                <InfoValue>{totalModules}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Openings</InfoLabel>
                <InfoValue>{totalOpenings}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>PDFs</InfoLabel>
                <InfoValue>{totalPDFs}</InfoValue>
              </InfoRow>
            </ProjectInfo>
          </div>

          <Divider orientation="horizontal" />

          {/* Import Options */}
          <div>
            <Text size={18} weight={600} style={{ marginBottom: '12px' }}>
              Import Options
            </Text>
            <CheckboxSection>
              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={options.importFloors}
                  onChange={handleCheckboxChange('importFloors')}
                />
                <CheckboxContent>
                  <CheckboxLabel>Import Floors</CheckboxLabel>
                  <CheckboxDescription>
                    Import all floor definitions including names, heights, and grid settings ({totalFloors} floors)
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>

              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={options.importPDFs}
                  onChange={handleCheckboxChange('importPDFs')}
                  disabled={!options.importFloors}
                />
                <CheckboxContent>
                  <CheckboxLabel>Import PDFs</CheckboxLabel>
                  <CheckboxDescription>
                    Import and decode PDF floor plans for each floor ({totalPDFs} PDFs available)
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>

              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={options.importElements}
                  onChange={handleCheckboxChange('importElements')}
                  disabled={!options.importFloors}
                />
                <CheckboxContent>
                  <CheckboxLabel>Import Elements</CheckboxLabel>
                  <CheckboxDescription>
                    Import all CAD elements including modules, openings, balconies, and bathroom pods
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>

              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={options.importSettings}
                  onChange={handleCheckboxChange('importSettings')}
                />
                <CheckboxContent>
                  <CheckboxLabel>Import Settings</CheckboxLabel>
                  <CheckboxDescription>Import global application settings and preferences</CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>
            </CheckboxSection>
          </div>
        </Content>

        <Footer>
          <ButtonRow>
            <HalfButton variant="secondary" onClick={onCancel}>
              Cancel
            </HalfButton>
            <HalfButton
              variant="primary"
              icon={<LuDownload size={18} />}
              onClick={() => onConfirm(options)}
              disabled={!hasAtLeastOneOption}
            >
              Import Project
            </HalfButton>
          </ButtonRow>
        </Footer>
      </Modal>
    </Overlay>
  );
}
