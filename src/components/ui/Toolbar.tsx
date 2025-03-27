// src/components/ui/Toolbar.tsx
import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ModuleCategory, ToolType } from '@/types';

const ToolbarContainer = styled.div`
  display: flex;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 8px;
  height: 50px;
  align-items: center;
`;

const ToolGroup = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 8px;
  border-right: 1px solid #ccc;
  height: 100%;
  align-items: center;

  &:last-of-type {
    border-right: none;
  }
`;

const ToolButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid ${props => (props.active ? '#333' : '#ccc')};
  background-color: ${props => (props.active ? '#e0e0e0' : 'white')};
  cursor: pointer;
  font-size: 14px;
  position: relative;

  &:hover {
    background-color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 1000;
    font-size: 12px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Select = styled.select`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 14px;
`;

const GridSizeInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  text-align: center;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
`;

// Simple SVG icons for toolbar buttons
const SelectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 9l4 4 9-9" />
  </svg>
);

const ModuleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" />
  </svg>
);

const DoorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" />
    <path d="M12 4v16" />
    <path d="M16 12h-4" />
  </svg>
);

const WindowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" />
    <path d="M4 12h16" />
  </svg>
);

const BalconyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="8" width="16" height="8" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 14l-4-4 4-4" />
    <path d="M5 10h11c4 0 4 4 4 4" />
  </svg>
);

const RedoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 14l4-4-4-4" />
    <path d="M19 10H8c-4 0-4 4-4 4" />
  </svg>
);

const Toolbar: React.FC = () => {
  const { toolState, setToolState, gridSettings, setGridSettings, moduleColors } = useCad();

  const { canUndo, canRedo, undo, redo } = useHistory();

  // Add an effect to log when toolbar state changes
  useEffect(() => {
    console.log('Toolbar - Current tool state:', toolState);
  }, [toolState]);

  const handleToolClick = (tool: ToolType) => {
    console.log(`Toolbar - Changing tool to: ${tool}`);
    // Reset the selection when switching tools
    if (tool !== ToolType.SELECT) {
      setToolState({
        activeTool: tool,
        selectedObjectId: null,
      });
    } else {
      setToolState({ activeTool: tool });
    }
  };

  const handleGridSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (size > 0) {
      setGridSettings({ size });
    }
  };

  const handleGridVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridSettings({ visible: e.target.checked });
  };

  const handleSnapToGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridSettings({ snapToGrid: e.target.checked });
  };

  const handleUndoClick = () => {
    const action = undo();
    console.log('Undo action:', action);
  };

  const handleRedoClick = () => {
    const action = redo();
    console.log('Redo action:', action);
  };

  return (
    <ToolbarContainer>
      <ToolGroup>
        <ToolButton
          active={toolState.activeTool === ToolType.SELECT}
          onClick={() => handleToolClick(ToolType.SELECT)}
          title="Select Tool (V)"
          data-tooltip="Select (V)"
        >
          <SelectIcon />
        </ToolButton>
        <ToolButton
          active={toolState.activeTool === ToolType.MODULE}
          onClick={() => handleToolClick(ToolType.MODULE)}
          title="Module Tool (M)"
          data-tooltip="Module (M)"
        >
          <ModuleIcon />
        </ToolButton>
        <ToolButton
          active={toolState.activeTool === ToolType.OPENING_DOOR}
          onClick={() => handleToolClick(ToolType.OPENING_DOOR)}
          title="Door Tool (D)"
          data-tooltip="Door (D)"
        >
          <DoorIcon />
        </ToolButton>
        <ToolButton
          active={toolState.activeTool === ToolType.OPENING_WINDOW}
          onClick={() => handleToolClick(ToolType.OPENING_WINDOW)}
          title="Window Tool (W)"
          data-tooltip="Window (W)"
        >
          <WindowIcon />
        </ToolButton>
        <ToolButton
          active={toolState.activeTool === ToolType.BALCONY}
          onClick={() => handleToolClick(ToolType.BALCONY)}
          title="Balcony Tool (B)"
          data-tooltip="Balcony (B)"
        >
          <BalconyIcon />
        </ToolButton>
      </ToolGroup>

      <ToolGroup>
        <ToolButton onClick={handleUndoClick} disabled={!canUndo} title="Undo (Ctrl+Z)" data-tooltip="Undo (Ctrl+Z)">
          <UndoIcon />
        </ToolButton>
        <ToolButton onClick={handleRedoClick} disabled={!canRedo} title="Redo (Ctrl+Y)" data-tooltip="Redo (Ctrl+Y)">
          <RedoIcon />
        </ToolButton>
      </ToolGroup>

      <ToolGroup>
        <label>Category:</label>
        <Select>
          {Object.values(ModuleCategory).map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </ToolGroup>

      <ToolGroup>
        <label>Grid Size:</label>
        <GridSizeInput type="number" value={gridSettings.size} onChange={handleGridSizeChange} min="1" max="100" />
        <Checkbox>
          <input
            type="checkbox"
            checked={gridSettings.visible}
            onChange={handleGridVisibilityChange}
            id="grid-visible"
          />
          <label htmlFor="grid-visible">Visible</label>
        </Checkbox>
        <Checkbox>
          <input
            type="checkbox"
            checked={gridSettings.snapToGrid}
            onChange={handleSnapToGridChange}
            id="snap-to-grid"
          />
          <label htmlFor="snap-to-grid">Snap</label>
        </Checkbox>
      </ToolGroup>
    </ToolbarContainer>
  );
};

export default Toolbar;
