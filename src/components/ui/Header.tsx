// src/components/ui/Header.tsx
'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useToolStore } from '@/state/toolStore';
import Image from 'next/image';
import logo from '../../assets/images/logo.png';
import { Button } from '@/components/ui/Button';
import { LuDownload, LuLayers, LuSettings2, LuTable, LuUpload } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';
import { RiHomeLine } from 'react-icons/ri';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { BsGrid3X3 } from 'react-icons/bs';
import { TbBoxAlignLeft, TbBoxAlignTopLeft } from 'react-icons/tb';
import { CgArrowAlignH } from 'react-icons/cg';
import { InputWithAffix } from '@/components/ui/InputWithAffix';
import FloorElementsTable from '@/components/ui/FloorElementsTable';
import FloorDropdown from '@/components/ui/FloorDropdown';
import EditFloorModal from '@/components/ui/EditFloorModal';
import ConfirmImportModal from '@/components/ui/ConfirmImportModal';
import { downloadJSON, exportProject, importProject, readJSONFile } from '@/utils/exportImport';
import { printPDF } from '@/utils/pdfUtils';
import { useFloorStore } from '@/state/floorStore';
import { useHasFloorElements } from '@/components/Canvas/hooks/useFloorElements';
import { PDFSettingsPanel } from '@/components/ui/PdfSettingsMenu';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${colors.white};
`;

const MainWrap = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 72px;
  padding: 12px 24px;
`;

const SecondaryWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  border-top: 1px solid ${colors.gray};
  border-bottom: 1px solid ${colors.gray};
  padding: 8px 24px;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MenuWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Label = styled.label`
  cursor: pointer;
  color: white;
`;

const Input = styled.input`
  display: none;
`;

const SettingsContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div {
    visibility: visible;
    opacity: 1;
  }
`;

const SettingsPopup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: absolute;
  top: calc(100% - 10px);
  right: 0;
  min-width: 400px;
  background: ${colors.white};
  border: 1px solid ${colors.gray};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 24px;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10000;
`;

const SettingsItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
`;

const InputWrap = styled.div`
  max-width: 132px;
`;

const AnimatedSettingsItem = styled(SettingsItem)<{ visible: boolean }>`
  overflow: hidden;
  transition:
    max-height 0.25s ease,
    opacity 0.25s ease,
    margin-top 0.25s ease;
  max-height: ${p => (p.visible ? '80px' : '0')};
  opacity: ${p => (p.visible ? 1 : 0)};
  margin: ${p => (p.visible ? '0' : '0')};
  margin-top: ${p => (p.visible ? '0' : '-20px')};
`;

const FloorElementsButton = styled.div<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  border-radius: 6px;
  transition: all 0.2s;
  opacity: ${props => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${props => (props.disabled ? 'transparent' : '#f8fafc')};
  }

  svg {
    color: ${props => (props.disabled ? '#9ca3af' : '#374151')};
  }
`;

const FileMenuContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div {
    visibility: visible;
    opacity: 1;
  }
`;

const FileMenuButton = styled.div`
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

const FileMenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: ${colors.white};
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10000;
`;

const FileMenuOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

export default function Header() {
  const { getCurrentFloor, currentFloorId } = useFloorStore();
  const { setTool } = useToolStore();

  const currentFloor = getCurrentFloor();
  const hasElements = useHasFloorElements(currentFloorId || undefined);

  const [showFloorElementsTable, setShowFloorElementsTable] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<string | undefined>(undefined);
  const [showEditFloorModal, setShowEditFloorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  // Get grid settings from current floor, fallback to defaults
  const gridSizeMm = currentFloor?.gridSettings.gridSize || 100;
  const snapMode = currentFloor?.gridSettings.snapMode || 'off';
  const elementGapMm = currentFloor?.gridSettings.elementGap || 50;

  const setGridSize = (size: number) => {
    if (currentFloor) {
      useFloorStore.getState().updateFloorGridSettings(currentFloor.id, { gridSize: Math.round(size) });
    }
  };

  const setSnapMode = (mode: 'off' | 'grid' | 'element') => {
    if (currentFloor) {
      useFloorStore.getState().updateFloorGridSettings(currentFloor.id, { snapMode: mode });
    }
  };

  const setElementGapMm = (gap: number) => {
    if (currentFloor) {
      useFloorStore.getState().updateFloorGridSettings(currentFloor.id, { elementGap: Math.round(gap) });
    }
  };

  const onChangeGrid = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d]/g, '');
    const v = parseInt(value, 10);
    if (!isNaN(v) && v > 0) {
      setGridSize(Math.round(v));
    }
  };

  const onGridBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(1, Math.round(parseInt(e.target.value) || 1));
    setGridSize(v);
  };

  const onChangeGap = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d]/g, '');
    const numValue = Math.max(0, Math.round(parseInt(value) || 0));
    setElementGapMm(numValue);
  };

  const onGapBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.round(parseInt(e.target.value) || 0));
    setElementGapMm(v);
  };

  const handleDeletePdf = () => {
    if (currentFloor) {
      useFloorStore.getState().removeFloorPDF(currentFloor.id);
    }
  };

  const handleRecalibrate = () => {
    setTool('calibrate');
  };

  const openFloorElementsPanel = () => {
    if (hasElements) {
      setShowFloorElementsTable(true);
    }
  };

  const handleEditFloor = (floorId?: string) => {
    setEditingFloorId(floorId);
    setShowEditFloorModal(true);
  };

  const handlePDFImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentFloor) return;

    try {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.');
        return;
      }

      const canvases = await printPDF(file);
      if (canvases.length === 0) {
        alert('The PDF file appears to be empty or corrupted.');
        return;
      }

      const url = URL.createObjectURL(file);
      const canvas = canvases[0];
      const widthPx = Math.round(canvas.width / window.devicePixelRatio);
      const heightPx = Math.round(canvas.height / window.devicePixelRatio);
      const widthGrid = Math.round(widthPx / gridSizeMm);
      const heightGrid = Math.round(heightPx / gridSizeMm);

      useFloorStore.getState().setFloorPDF(currentFloor.id, {
        url,
        widthGrid,
        heightGrid,
        calibrated: false,
        opacity: 1,
      });

      event.target.value = '';
    } catch (error) {
      console.error('Failed to load PDF:', error);
      alert('Failed to load PDF. Please try again with a different file.');
      event.target.value = '';
    }
  };

  const handleExportProject = async () => {
    try {
      const data = await exportProject();
      const filename = `project-export-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJSON(data, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    readJSONFile(file)
      .then(data => {
        setImportData(data);
        setShowImportModal(true);
        event.target.value = '';
      })
      .catch(error => {
        console.error('Import failed:', error);
        alert('Failed to read import file. Please check the file format.');
      });
  };

  const handleConfirmImport = async (options: any) => {
    if (!importData) return;

    try {
      await importProject(importData, options);
      setShowImportModal(false);
      setImportData(null);
      alert('Project imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    }
  };

  return (
    <>
      <Container>
        <MainWrap>
          <Image width={153} height={40} src={logo} alt={'verida'} />

          <FileMenuContainer>
            <FileMenuButton>
              <Text size={16}>File</Text>
            </FileMenuButton>
            <FileMenuDropdown>
              <FileMenuOption onClick={handleExportProject}>
                <LuDownload size={16} />
                <Text size={14}>Export Project</Text>
              </FileMenuOption>
              <FileMenuOption>
                <LuUpload size={16} />
                <Label htmlFor="importInput">
                  <Text size={14}>Import Project</Text>
                </Label>
                <Input id="importInput" type="file" accept=".json" onChange={handleImportProject} />
              </FileMenuOption>
            </FileMenuDropdown>
          </FileMenuContainer>
        </MainWrap>

        <SecondaryWrap>
          <MenuWrap>
            <MenuItem>
              <RiHomeLine size={24} />
              <Text size={16}>Home</Text>
            </MenuItem>
            <Divider orientation="vertical" length={'40px'} />
            <MenuItem>
              <LuLayers size={24} />
              <FloorDropdown onEditFloor={handleEditFloor} />
            </MenuItem>
          </MenuWrap>

          <MenuWrap>
            {currentFloor && !currentFloor.pdf && (
              <>
                <Button icon={<LuDownload size={20} />}>
                  <Label htmlFor="pdfInput">Import PDF</Label>
                  <Input id="pdfInput" type="file" accept="application/pdf" onChange={handlePDFImport} />
                </Button>
                <Divider orientation="vertical" length={'40px'} />
              </>
            )}

            {currentFloor?.pdf && (
              <>
                <PDFSettingsPanel onDeletePdf={handleDeletePdf} onRecalibrate={handleRecalibrate} />
                <Divider orientation="vertical" length={'40px'} />
              </>
            )}

            <FloorElementsButton
              disabled={!hasElements}
              onClick={openFloorElementsPanel}
              title={
                hasElements
                  ? `View all elements on ${currentFloor?.name || 'current floor'}`
                  : 'No elements on current floor'
              }
            >
              <LuTable size={24} />
              <Text size={16}>View Floor Elements</Text>
            </FloorElementsButton>

            <Divider orientation="vertical" length={'40px'} />

            {currentFloor && (
              <SettingsContainer>
                <MenuItem>
                  <LuSettings2 size={24} />
                </MenuItem>
                <SettingsPopup>
                  <SettingsItem>
                    <MenuItem>
                      <BsGrid3X3 size={24} />
                      <Text size={16}>Grid (mm)</Text>
                    </MenuItem>
                    <InputWrap>
                      <InputWithAffix
                        min="1"
                        step="1"
                        value={Math.round(gridSizeMm)}
                        onChange={onChangeGrid}
                        onBlur={onGridBlur}
                        type="number"
                        suffix={'mm'}
                      />
                    </InputWrap>
                  </SettingsItem>

                  <SettingsItem>
                    <MenuItem>
                      <TbBoxAlignTopLeft size={24} />
                      <Text size={16}>Snap to grid</Text>
                    </MenuItem>
                    <Toggle checked={snapMode === 'grid'} onChange={value => setSnapMode(value ? 'grid' : 'off')} />
                  </SettingsItem>

                  <SettingsItem>
                    <MenuItem>
                      <TbBoxAlignLeft size={24} />
                      <Text size={16}>Snap to element</Text>
                    </MenuItem>
                    <Toggle
                      checked={snapMode === 'element'}
                      onChange={value => setSnapMode(value ? 'element' : 'off')}
                    />
                  </SettingsItem>

                  <AnimatedSettingsItem visible={snapMode === 'element'}>
                    <MenuItem>
                      <CgArrowAlignH size={24} />
                      <Text size={16}>Gap between elements</Text>
                    </MenuItem>
                    <InputWrap>
                      <InputWithAffix
                        min="0"
                        step="1"
                        value={Math.round(elementGapMm)}
                        onChange={onChangeGap}
                        onBlur={onGapBlur}
                        type="number"
                        suffix={'mm'}
                      />
                    </InputWrap>
                  </AnimatedSettingsItem>
                </SettingsPopup>
              </SettingsContainer>
            )}
          </MenuWrap>
        </SecondaryWrap>
      </Container>

      {showFloorElementsTable && <FloorElementsTable onClose={() => setShowFloorElementsTable(false)} />}

      {showEditFloorModal && (
        <EditFloorModal
          floorId={editingFloorId}
          onClose={() => {
            setShowEditFloorModal(false);
            setEditingFloorId(undefined);
          }}
          onSuccess={() => {
            setShowEditFloorModal(false);
            setEditingFloorId(undefined);
          }}
        />
      )}

      {showImportModal && importData && (
        <ConfirmImportModal
          data={importData}
          onConfirm={handleConfirmImport}
          onCancel={() => {
            setShowImportModal(false);
            setImportData(null);
          }}
        />
      )}
    </>
  );
}
