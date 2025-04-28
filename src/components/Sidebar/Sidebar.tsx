'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import useCadStore from '@/store/cadStore';
import { FloorBeamDirection } from '@/types/cad';

const SidebarContainer = styled.div<{ isCollapsed: boolean }>`
  width: ${({ isCollapsed }) => (isCollapsed ? '40px' : '250px')};
  background-color: #f8f8f8;
  border-left: 1px solid #ddd;
  transition: width 0.3s ease;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border: none;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: #e5e5e5;
  }
`;

const SidebarContent = styled.div`
  padding: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
`;

const ControlGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  margin: 4px 0;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Slider = styled.input`
  width: 100%;
  margin: 4px 0;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const Select = styled.select`
  width: 100%;
  margin: 4px 0;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button`
  flex: 1;
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #e5e5e5;
  }

  &.active {
    background-color: #1e90ff;
    color: white;
  }
`;

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    floors,
    activeFloorIndex,
    backdropOpacity,
    backdropLocked,
    selectedModuleId,
    setBackdropOpacity,
    setBackdropLocked,
    updateModule,
  } = useCadStore();
  const activeFloor = floors[activeFloorIndex];

  // Local state for module properties
  const [moduleName, setModuleName] = useState('');
  const [moduleWidth, setModuleWidth] = useState(0);
  const [moduleLength, setModuleLength] = useState(0);
  const [moduleHeight, setModuleHeight] = useState(0);
  const [moduleRotation, setModuleRotation] = useState(0);
  const [moduleBeamsDir, setModuleBeamsDir] = useState<FloorBeamDirection>('X');

  // Get selected module from store
  const selectedModule = selectedModuleId ? activeFloor.modules.find(m => m.id === selectedModuleId) : null;

  // Update local state when selected module changes
  useEffect(() => {
    if (selectedModule) {
      setModuleName(selectedModule.name);
      setModuleWidth(selectedModule.width);
      setModuleLength(selectedModule.length);
      setModuleHeight(selectedModule.height);
      setModuleRotation(selectedModule.rotation);
      setModuleBeamsDir(selectedModule.floorBeamsDir);
    } else {
      // Reset values if no module is selected
      setModuleName('');
      setModuleWidth(0);
      setModuleLength(0);
      setModuleHeight(0);
      setModuleRotation(0);
      setModuleBeamsDir('X');
    }
  }, [selectedModule]);

  // Handle backdrop controls
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBackdropOpacity(value);

    // Update backdrop opacity if it exists
    if (activeFloor.backdrop && activeFloor.backdrop.canvas) {
      activeFloor.backdrop.set('opacity', value / 100);
      activeFloor.backdrop.canvas.renderAll();
    }
  };

  const handleLockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const locked = e.target.checked;
    setBackdropLocked(locked);

    // Update backdrop lock status if it exists
    if (activeFloor.backdrop && activeFloor.backdrop.canvas) {
      activeFloor.backdrop.set({
        selectable: !locked,
        evented: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      });
      activeFloor.backdrop.canvas.renderAll();
    }
  };

  // Handle module property changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setModuleName(newName);

    if (selectedModuleId) {
      updateModule(activeFloor.id, selectedModuleId, { name: newName });
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setModuleWidth(value);

      if (selectedModuleId) {
        updateModule(activeFloor.id, selectedModuleId, { width: value });
      }
    }
  };

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setModuleLength(value);

      if (selectedModuleId) {
        updateModule(activeFloor.id, selectedModuleId, { length: value });
      }
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setModuleHeight(value);

      if (selectedModuleId) {
        updateModule(activeFloor.id, selectedModuleId, { height: value });
      }
    }
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setModuleRotation(value);

    if (selectedModuleId) {
      updateModule(activeFloor.id, selectedModuleId, { rotation: value });
    }
  };

  const handleBeamsDirChange = (dir: FloorBeamDirection) => {
    setModuleBeamsDir(dir);

    if (selectedModuleId) {
      updateModule(activeFloor.id, selectedModuleId, { floorBeamsDir: dir });
    }
  };

  return (
    <SidebarContainer isCollapsed={isCollapsed}>
      <ToggleButton onClick={() => setIsCollapsed(!isCollapsed)}>{isCollapsed ? '>' : '<'}</ToggleButton>

      {!isCollapsed && (
        <SidebarContent>
          {/* Backdrop Settings */}
          <SectionTitle>Backdrop</SectionTitle>
          <ControlGroup>
            <Label>Opacity: {backdropOpacity}%</Label>
            <Slider type="range" min="0" max="100" value={backdropOpacity} onChange={handleOpacityChange} />
          </ControlGroup>
          <ControlGroup>
            <Label>
              <Checkbox type="checkbox" checked={backdropLocked} onChange={handleLockToggle} />
              Lock backdrop
            </Label>
          </ControlGroup>

          {/* Module Properties */}
          {selectedModule && (
            <>
              <SectionTitle>Module Properties</SectionTitle>
              <ControlGroup>
                <Label>Name</Label>
                <Input type="text" value={moduleName} onChange={handleNameChange} />
              </ControlGroup>
              <ControlGroup>
                <Label>Width (mm)</Label>
                <Input type="number" min="100" step="10" value={moduleWidth} onChange={handleWidthChange} />
              </ControlGroup>
              <ControlGroup>
                <Label>Length (mm)</Label>
                <Input type="number" min="100" step="10" value={moduleLength} onChange={handleLengthChange} />
              </ControlGroup>
              <ControlGroup>
                <Label>Height (mm)</Label>
                <Input type="number" min="100" step="10" value={moduleHeight} onChange={handleHeightChange} />
              </ControlGroup>
              <ControlGroup>
                <Label>Rotation (deg)</Label>
                <Select value={moduleRotation} onChange={handleRotationChange}>
                  <option value="0">0°</option>
                  <option value="90">90°</option>
                  <option value="180">180°</option>
                  <option value="270">270°</option>
                </Select>
              </ControlGroup>
              <ControlGroup>
                <Label>Floor Beam Direction</Label>
                <ButtonGroup>
                  <Button className={moduleBeamsDir === 'X' ? 'active' : ''} onClick={() => handleBeamsDirChange('X')}>
                    X
                  </Button>
                  <Button className={moduleBeamsDir === 'Y' ? 'active' : ''} onClick={() => handleBeamsDirChange('Y')}>
                    Y
                  </Button>
                </ButtonGroup>
              </ControlGroup>
            </>
          )}

          {/* Floor Info */}
          <SectionTitle>Floor: {activeFloor.name}</SectionTitle>
          <ControlGroup>
            <Label>Modules: {activeFloor.modules.length}</Label>
          </ControlGroup>
        </SidebarContent>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;
