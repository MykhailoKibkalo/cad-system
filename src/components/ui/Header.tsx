// src/components/ui/Header.tsx
'use client';

import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useCanvasStore } from '@/state/canvasStore';
import { useToolStore } from '@/state/toolStore';
import { useFloorStore } from '@/state/floorStore';
import Image from 'next/image';
import logo from '../../assets/images/logo.png';
import { Button } from '@/components/ui/Button';
import { LuDownload, LuGroup, LuLayers, LuSettings2, LuTable, LuInfo } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';
import { RiHomeLine } from 'react-icons/ri';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { PdfSettingsMenu } from '@/components/ui/PdfSettingsMenu';
import React, { useState } from 'react';
import { BsGrid3X3 } from 'react-icons/bs';
import { TbBoxAlignLeft, TbBoxAlignTopLeft } from 'react-icons/tb';
import { CgArrowAlignH } from 'react-icons/cg';
import { InputWithAffix } from '@/components/ui/InputWithAffix';
import { useHasFloorElements } from '@/components/Canvas/hooks/useFloorElements';
import FloorElementsTable from '@/components/ui/FloorElementsTable';
import { useObjectStore } from '@/state/objectStore';
import GroupsSidebar from '@/components/Groups/GroupsSidebar';
import { useCanvasRefStore } from '@/state/canvasRefStore';
import BuildingModuleTable from '@/components/BuildingModuleTable';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${colors.white};
  position: relative;
`;

const CalibrationHint = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #2196f3;
  color: white;
  padding: 8px 24px;
  border-radius: 0 0 8px 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
  
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-100%);
    }
    to {
      transform: translateX(-50%) translateY(0);
    }
  }
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
  min-width: 440px;
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

const GridSizeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GridSizeInputWrap = styled.div`
  width: 112px;
`;

const GridSizeSeparator = styled.span`
  color: ${colors.gray};
  font-size: 16px;
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

const GroupsButton = styled.div<{ disabled: boolean }>`
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

export default function Header() {
  const {
    floorName,
    floorHeightMm,
    snapMode,
    setSnapMode,
    elementGapMm,
    setElementGapMm,
    pdfImported,
    resetPdfState,
    currentFloor,
  } = useCanvasStore();

  const { setTool, tool } = useToolStore();
  const [showFloorElementsTable, setShowFloorElementsTable] = useState(false);
  const [showGroupsSidebar, setShowGroupsSidebar] = useState(false);
  const [showBuildingTable, setShowBuildingTable] = useState(false);
  const hasElements = useHasFloorElements();
  const groups = useObjectStore(s => s.groups);
  const hasGroups = groups && groups.length > 0;
  const canvas = useCanvasRefStore(s => s.canvas);

  // Add floor store
  const { getSelectedFloor, setSidebarOpen, hasActivePdf, getActiveGridState, updateActiveGridState } = useFloorStore();

  const gridSizeMm = useCanvasStore(s => s.gridSizeMm);
  const setGridSize = useCanvasStore(s => s.setGridSize);

  // Get grid dimensions from active floor or fallback to canvas store
  const activeGridState = getActiveGridState();
  const gridWidthM = activeGridState?.gridWidthM || useCanvasStore(s => s.gridWidthM);
  const gridHeightM = activeGridState?.gridHeightM || useCanvasStore(s => s.gridHeightM);

  const setGridDimensions = (width: number, height: number) => {
    // Update both floor store and canvas store
    updateActiveGridState({ gridWidthM: width, gridHeightM: height });
    useCanvasStore.getState().setGridDimensions(width, height);
  };

  const onChangeGrid = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove any decimal points and non-numeric characters
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
    // Remove any decimal points and non-numeric characters
    value = value.replace(/[^\d]/g, '');

    const numValue = Math.max(0, Math.round(parseInt(value) || 0));
    setElementGapMm(numValue);
  };

  const onGapBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.round(parseInt(e.target.value) || 0));
    setElementGapMm(v);
  };

  const onChangeGridWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove any decimal points and non-numeric characters
    value = value.replace(/[^\d]/g, '');

    const v = parseInt(value, 10);
    if (!isNaN(v) && v >= 1 && v <= 1000) {
      setGridDimensions(v, gridHeightM);
    }
  };

  const onGridWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(1, Math.min(1000, parseInt(e.target.value) || 100));
    setGridDimensions(v, gridHeightM);
  };

  const onChangeGridHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove any decimal points and non-numeric characters
    value = value.replace(/[^\d]/g, '');

    const v = parseInt(value, 10);
    if (!isNaN(v) && v >= 1 && v <= 1000) {
      setGridDimensions(gridWidthM, v);
    }
  };

  const onGridHeightBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(1, Math.min(1000, parseInt(e.target.value) || 100));
    setGridDimensions(gridWidthM, v);
  };

  const handleDeletePdf = () => {
    // Remove PDF from active floor
    useFloorStore.getState().setActivePdfData(null);
    // Reset global PDF state
    resetPdfState();
  };

  const handleRecalibrate = () => {
    // Switch to calibrate tool
    setTool('calibrate');
  };

  const openFloorElementsPanel = () => {
    if (hasElements) {
      setShowFloorElementsTable(true);
    }
  };

  const openGroupsPanel = () => {
    if (groups && groups.length > 0) {
      setShowGroupsSidebar(true);
    }
  };

  const handlePdfImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The actual PDF loading is handled by PdfLoader component
    // We don't need to do anything here except let the file input trigger
    // the PdfLoader will handle the import and save to floor store
  };

  return (
    <>
      <Container>
        {tool === 'calibrate' && (
          <CalibrationHint>
            <LuInfo size={16} />
            Find a scale reference on your PDF and draw a line along it to calibrate
          </CalibrationHint>
        )}
        <MainWrap>
          <Image width={153} height={40} src={logo} alt={'verida'} />
          <Button icon={<LuDownload size={20} />}>
            <Label htmlFor="pdfInput">Import PDF</Label>
            <Input id="pdfInput" type="file" accept="application/pdf" onChange={handlePdfImport} />
          </Button>
        </MainWrap>
        <SecondaryWrap>
          <MenuWrap>
            <MenuItem>
              <RiHomeLine size={24} />
              <Text size={16}>Home</Text>
            </MenuItem>
            <Divider orientation="vertical" length={'40px'} />
            <MenuItem onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer' }}>
              <LuLayers size={24} />
              <Text size={16}>
                Floor: {getSelectedFloor()?.name || floorName} (
                {Math.round(getSelectedFloor()?.height || floorHeightMm)} mm)
              </Text>
            </MenuItem>
          </MenuWrap>

          <MenuWrap>
            {/* PDF Settings Menu - Only show when active floor has PDF */}
            {hasActivePdf() && (
              <>
                <PdfSettingsMenu onDeletePdf={handleDeletePdf} onRecalibrate={handleRecalibrate} />
                <Divider orientation="vertical" length={'40px'} />
              </>
            )}

            {/* Floor Elements Button */}
            {/*<FloorElementsButton*/}
            {/*  disabled={!hasElements}*/}
            {/*  onClick={openFloorElementsPanel}*/}
            {/*  title={hasElements ? `View all elements on ${floorName}` : 'No elements on current floor'}*/}
            {/*>*/}
            {/*  <LuTable size={24} />*/}
            {/*  <Text size={16}>View Floor Elements</Text>*/}
            {/*</FloorElementsButton>*/}

            {/* Building Table Button */}
            {/*<Divider orientation="vertical" length={'40px'} />*/}
            <FloorElementsButton
              disabled={false}
              onClick={() => setShowBuildingTable(true)}
              title="View building-wide module summary"
            >
              <LuTable size={24} />
              <Text size={16}>Building Table</Text>
            </FloorElementsButton>

            {/* Groups Button - Only show when groups exist */}
            {hasGroups && (
              <>
                <Divider orientation="vertical" length={'40px'} />
                <GroupsButton disabled={false} onClick={openGroupsPanel} title={`View ${groups.length} group(s)`}>
                  <LuGroup size={24} />
                  <Text size={16}>Groups ({groups.length})</Text>
                </GroupsButton>
              </>
            )}

            <Divider orientation="vertical" length={'40px'} />

            {/* Grid Settings */}
            <SettingsContainer>
              <MenuItem>
                <LuSettings2 size={24} />
              </MenuItem>

              <SettingsPopup>
                <SettingsItem>
                  <MenuItem>
                    <BsGrid3X3 size={24} />
                    <Text size={16}>Grid Size</Text>
                  </MenuItem>
                  <GridSizeRow>
                    <GridSizeInputWrap>
                      <InputWithAffix
                          min="1"
                          max="1000"
                          step="1"
                          value={gridWidthM}
                          onChange={onChangeGridWidth}
                          onBlur={onGridWidthBlur}
                          type="number"
                          suffix={'m'}
                      />
                    </GridSizeInputWrap>
                    <GridSizeSeparator>×</GridSizeSeparator>
                    <GridSizeInputWrap>
                      <InputWithAffix
                          min="1"
                          max="1000"
                          step="1"
                          value={gridHeightM}
                          onChange={onChangeGridHeight}
                          onBlur={onGridHeightBlur}
                          type="number"
                          suffix={'m'}
                      />
                    </GridSizeInputWrap>
                  </GridSizeRow>
                </SettingsItem>
                <SettingsItem>
                  <MenuItem>
                    <BsGrid3X3 size={24} />
                    <Text size={16}>Grid Cell Size</Text>
                  </MenuItem>
                  <GridSizeInputWrap>
                    <InputWithAffix
                      min="1"
                      step="1"
                      value={Math.round(gridSizeMm)}
                      onChange={onChangeGrid}
                      onBlur={onGridBlur}
                      type="number"
                      suffix={'mm'}
                    />
                  </GridSizeInputWrap>
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
                  <Toggle checked={snapMode === 'element'} onChange={value => setSnapMode(value ? 'element' : 'off')} />
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
          </MenuWrap>
        </SecondaryWrap>
      </Container>

      {/* Floor Elements Table Modal */}
      {showFloorElementsTable && <FloorElementsTable onClose={() => setShowFloorElementsTable(false)} />}

      {/* Building Module Table Modal */}
      {showBuildingTable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1003,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #ddd',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1
            }}>
              <h2 style={{ margin: 0 }}>Building-Wide Module Summary</h2>
              <button
                onClick={() => setShowBuildingTable(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                ×
              </button>
            </div>
            <BuildingModuleTable />
          </div>
        </div>
      )}
    </>
  );
}
