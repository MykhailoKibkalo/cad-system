'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import useCadStore from '@/store/cadStore';
import { loadPdfAsImage } from '@/lib/pdf/loadPdf';
import { exportCad } from '@/lib/export';

const RibbonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
  padding: 4px;
  min-height: 60px;
`;

const RibbonGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 10px;
  min-width: 120px;
`;

const GroupTitle = styled.div`
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2px;
  color: #666;
`;

const GroupContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const RibbonButton = styled.button`
  padding: 4px 8px;
  font-size: 14px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const GridInput = styled.input`
  width: 60px;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const FileInput = styled.input`
  display: none;
`;

const Ribbon = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { floors, activeFloorIndex, snappingEnabled, updateGridResolution, setBackdrop, toggleSnapping } =
    useCadStore();
  const activeFloor = floors[activeFloorIndex];

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const image = await loadPdfAsImage(file);
      setBackdrop(activeFloor.id, image);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing PDF:', error);
      alert('Failed to import PDF. Please try again with a different file.');
    }
  };

  const handleExport = () => {
    const jsonData = exportCad();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cad-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGridResolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 10 && value <= 1000) {
      updateGridResolution(activeFloor.id, value);
    }
  };

  const handleShowLowerFloorToggle = () => {
    useCadStore.getState().toggleLowerFloorBackdrop(activeFloor.id);
  };

  return (
    <RibbonContainer>
      <RibbonGroup>
        <GroupTitle>File</GroupTitle>
        <GroupContent>
          <RibbonButton onClick={() => fileInputRef.current?.click()}>Import PDF</RibbonButton>
          <FileInput ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfImport} />
          <RibbonButton onClick={handleExport}>Export JSON</RibbonButton>
          <RibbonButton>Import JSON</RibbonButton>
        </GroupContent>
      </RibbonGroup>

      <RibbonGroup>
        <GroupTitle>Grid</GroupTitle>
        <GroupContent>
          <GridInput
            type="number"
            min="10"
            max="1000"
            step="10"
            value={activeFloor.gridResolution}
            onChange={handleGridResolutionChange}
          />
          <RibbonButton onClick={toggleSnapping}>{snappingEnabled ? 'Snap: On' : 'Snap: Off'}</RibbonButton>
          <RibbonButton onClick={handleShowLowerFloorToggle}>
            {activeFloor.showLowerFloor ? 'Lower Floor: On' : 'Lower Floor: Off'}
          </RibbonButton>
        </GroupContent>
      </RibbonGroup>

      <RibbonGroup>
        <GroupTitle>Modules</GroupTitle>
        <GroupContent>
          <RibbonButton>Create</RibbonButton>
          <RibbonButton>Import</RibbonButton>
        </GroupContent>
      </RibbonGroup>

      <RibbonGroup>
        <GroupTitle>Components</GroupTitle>
        <GroupContent>
          <RibbonButton>Door</RibbonButton>
          <RibbonButton>Window</RibbonButton>
          <RibbonButton>Furniture</RibbonButton>
        </GroupContent>
      </RibbonGroup>

      <RibbonGroup>
        <GroupTitle>Tools</GroupTitle>
        <GroupContent>
          <RibbonButton>Measure</RibbonButton>
          <RibbonButton>Align</RibbonButton>
          <RibbonButton>Zoom</RibbonButton>
        </GroupContent>
      </RibbonGroup>
    </RibbonContainer>
  );
};

export default Ribbon;
