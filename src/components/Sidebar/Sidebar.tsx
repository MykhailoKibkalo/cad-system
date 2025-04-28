'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import useCadStore from '@/store/cadStore';

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

const Slider = styled.input`
  width: 100%;
  margin: 4px 0;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [backdropOpacity, setBackdropOpacity] = useState(100);
    const [isBackdropLocked, setIsBackdropLocked] = useState(true);

    const { floors, activeFloorIndex } = useCadStore();
    const activeFloor = floors[activeFloorIndex];

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setBackdropOpacity(value);

        // Update backdrop opacity if it exists
        if (activeFloor.backdrop) {
            activeFloor.backdrop.set('opacity', value / 100);
            activeFloor.backdrop.canvas?.renderAll();
        }
    };

    const handleLockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const locked = e.target.checked;
        setIsBackdropLocked(locked);

        // Update backdrop lock status if it exists
        if (activeFloor.backdrop) {
            activeFloor.backdrop.set({
                selectable: !locked,
                evented: !locked,
                lockMovementX: locked,
                lockMovementY: locked,
                lockRotation: locked,
                lockScalingX: locked,
                lockScalingY: locked,
            });
            activeFloor.backdrop.canvas?.renderAll();
        }
    };

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <ToggleButton onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? '>' : '<'}
            </ToggleButton>

            {!isCollapsed && (
                <SidebarContent>
                    <SectionTitle>Backdrop</SectionTitle>
                    <ControlGroup>
                        <Label>Opacity: {backdropOpacity}%</Label>
                        <Slider
                            type="range"
                            min="0"
                            max="100"
                            value={backdropOpacity}
                            onChange={handleOpacityChange}
                        />
                    </ControlGroup>
                    <ControlGroup>
                        <Label>
                            <Checkbox
                                type="checkbox"
                                checked={isBackdropLocked}
                                onChange={handleLockToggle}
                            />
                            Lock backdrop
                        </Label>
                    </ControlGroup>

                    <SectionTitle>Floor: {activeFloor.name}</SectionTitle>
                    <ControlGroup>
                        {/* Floor controls will be added in future iterations */}
                    </ControlGroup>
                </SidebarContent>
            )}
        </SidebarContainer>
    );
};

export default Sidebar;
