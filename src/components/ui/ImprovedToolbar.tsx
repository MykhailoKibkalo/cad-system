// FILE: src/components/ui/ImprovedToolbar.tsx
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, ModuleCategory, ToolType } from '@/types';
import { fabric } from 'fabric';

// Styled components for the improved toolbar
const ToolbarContainer = styled.div`
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  user-select: none;
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  margin-right: 20px;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 20%;
    height: 60%;
    width: 1px;
    background-color: #dee2e6;
  }
`;

const SectionTitle = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-right: 8px;
  text-transform: uppercase;
  font-weight: 500;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 3px;
  border-radius: 4px;
  border: 1px solid ${props => (props.active ? '#2c7be5' : 'transparent')};
  background-color: ${props => (props.active ? 'rgba(44, 123, 229, 0.1)' : 'transparent')};
  color: ${props => (props.active ? '#2c7be5' : '#495057')};
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: ${props => (props.active ? 'rgba(44, 123, 229, 0.15)' : 'rgba(0, 0, 0, 0.05)')};
    color: ${props => (props.active ? '#2c7be5' : '#212529')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: transparent;
    color: #adb5bd;
  }

  &:hover::after {
    content: attr(title);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #343a40;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  margin: 0 3px;
`;

const DropdownButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  background-color: white;
  cursor: pointer;
  color: #495057;
  min-width: 120px;
  font-size: 14px;

  &:hover {
    background-color: #f8f9fa;
  }

  &::after {
    content: '';
    display: inline-block;
    margin-left: auto;
    border-top: 4px solid #6c757d;
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }
`;

const DropdownContent = styled.div<{ isOpen: boolean }>`
  display: ${props => (props.isOpen ? 'block' : 'none')};
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 160px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.div<{ selected?: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f8f9fa;
  }

  ${props =>
      props.selected &&
      `
    background-color: rgba(44, 123, 229, 0.1);
    color: #2c7be5;
  `}
`;

const ColorSwatch = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: ${props => props.color};
  margin-right: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const GridControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GridSizeInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-left: 10px;

  input {
    margin-right: 5px;
  }

  label {
    font-size: 14px;
    color: #495057;
    cursor: pointer;
  }
`;

const KeyboardHintsDiv = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  color: #6c757d;
  font-size: 12px;
`;

const ShortcutHintSpan = styled.span`
  font-size: 10px;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 3px;
  padding: 1px 3px;
  margin-left: 4px;
  margin-right: 8px;
  border: 1px solid #dee2e6;
`;

const Select = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  background-color: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  margin: 0 3px;
  height: 40px;
  min-width: 80px;

  &:hover {
    background-color: #f8f9fa;
  }

  &:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
`;

// SVG Icons
const SelectIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5C12.88 5 14 6.12 14 7.5v3.74c0 1.1.62 2.1 1.61 2.59l4.39 2.2c.77.39.76 1.48-.01 1.87l-5.39 2.69c-.99.5-1.61 1.5-1.61 2.59V21.5c0 1.38-1.12 2.5-2.5 2.5A2.5 2.5 0 0 1 9 21.5v-2.76c0-1.11-.63-2.11-1.61-2.59l-5.39-2.69c-.77-.39-.77-1.48 0-1.87l4.39-2.2C7.38 8.84 9 10.24 9 11.24z"></path>
    </svg>
);

const ModuleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
    </svg>
);

const DoorIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18V3H3v18z"></path>
      <path d="M14 3v18M7 15h2"></path>
    </svg>
);

const WindowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3V3z"></path>
      <path d="M3 12h18"></path>
    </svg>
);

const BalconyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8h12M6 8v8M18 8v8M6 16h12"></path>
      <path d="M3 21h18M9 16v5M15 16v5"></path>
    </svg>
);

const HandIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
    </svg>
);

const UndoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 14l-4-4 4-4"></path>
      <path d="M5 10h10c4 0 6 2 6 6"></path>
    </svg>
);

const RedoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 14l4-4-4-4"></path>
      <path d="M19 10H9c-4 0-6 2-6 6"></path>
    </svg>
);

const RulerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20" />
      <path d="M6 8v8" />
      <path d="M10 7v10" />
      <path d="M14 8v8" />
      <path d="M18 7v10" />
    </svg>
);

// New icons for the additional tools
const CorridorIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3z"></path>
      <path d="M9 3v18"></path>
      <path d="M15 3v18"></path>
    </svg>
);

const RoofIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"></path>
      <path d="M12 3l9 9"></path>
      <path d="M12 3l-9 9"></path>
      <path d="M19 15v6"></path>
      <path d="M5 15v6"></path>
    </svg>
);

const BathroomIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18H4z"></path>
      <path d="M4 12h16"></path>
      <path d="M11 12v10"></path>
      <circle cx="8" cy="8" r="2"></circle>
    </svg>
);

const ScaleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20"></path>
      <path d="M5 5v14"></path>
      <path d="M19 5v14"></path>
      <path d="M5 8l14 8"></path>
    </svg>
);

// Main component
const ImprovedToolbar: React.FC = () => {
  const {
    toolState,
    setToolState,
    gridSettings,
    setGridSettings,
    moduleColors,
    ensureActiveFloor,
    fabricCanvasRef,
    getModuleById,
    updateModule,
    getActiveFloor,
    displaySettings,
    setDisplaySettings,
    moduleNamePrefix,
    setModuleNamePrefix,
  } = useCad();

  const { canUndo, canRedo, undo, redo, addAction } = useHistory();
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>(ModuleCategory.A1);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [modulePrefixInput, setModulePrefixInput] = useState(moduleNamePrefix);

  // Detect OS for shortcut display
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  // Ensure we have an active floor on component mount
  useEffect(() => {
    ensureActiveFloor();
  }, []);

  // Initialize selectedCategory from the selected object's category if available
  useEffect(() => {
    if (toolState.selectedObjectId) {
      const module = getModuleById(toolState.selectedObjectId);
      if (module) {
        setSelectedCategory(module.category);
      }
    }
  }, [toolState.selectedObjectId]);

  // New tool types for corridor, roof, bathroom pod, scale
  enum ExtendedToolType {
    CORRIDOR = 'corridor',
    ROOF = 'roof',
    BATHROOM_POD = 'bathroom_pod',
    SCALE = 'scale',
  }

  // Extend the base ToolType with our new tools
  type CombinedToolType = ToolType | ExtendedToolType;

  const handleToolClick = (tool: CombinedToolType) => {
    // Ensure we have an active floor
    ensureActiveFloor();

    // For our new tools, we need to handle them differently
    if (Object.values(ExtendedToolType).includes(tool as ExtendedToolType)) {
// These are custom tools not in the ToolType enum
// We'll still use SELECT as the actual tool type but store the custom tool in the context
      setToolState({
        activeTool: ToolType.SELECT,
        selectedObjectId: null,
        customTool: tool as string, // Store the custom tool type
      });
    } else {
      // For standard tools
      if (tool !== ToolType.SELECT) {
        // Reset the selection when switching tools
        setToolState({
          activeTool: tool as ToolType,
          selectedObjectId: null,
          customTool: undefined, // Clear any custom tool
        });
      } else {
        setToolState({
          activeTool: tool as ToolType,
          customTool: undefined, // Clear any custom tool
        });
      }
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

  const handleSnapToElementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridSettings({ snapToElement: e.target.checked });
  };

  const handleGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gap = parseInt(e.target.value, 10);
    if (!isNaN(gap) && gap >= 0) {
      setGridSettings({ elementGap: gap });
    }
  };

  const handleCategoryChange = (category: ModuleCategory) => {
    setSelectedCategory(category);
    setIsCategoryOpen(false);

    // If an object is selected, update its category
    if (toolState.selectedObjectId) {
      const module = getModuleById(toolState.selectedObjectId);
      if (module) {
        // Store original for history
        const originalModule = { ...module };

        // Create a copy of the module with the new category
        const updatedModule = {
          ...module,
          category,
        };

        // Update the module
        updateModule(toolState.selectedObjectId, updatedModule);

        // Add to history
        addAction({
          type: ActionType.UPDATE_MODULE,
          payload: {
            before: { module: originalModule },
            after: { module: updatedModule },
            id: toolState.selectedObjectId,
          },
        });

        // Update the canvas
        if (fabricCanvasRef.current) {
          const canvas = fabricCanvasRef.current;
          const moduleObject = canvas
              .getObjects()
              .find(obj => obj.data?.id === toolState.selectedObjectId) as fabric.Rect;

          if (moduleObject) {
            moduleObject.set('fill', moduleColors[category]);
            moduleObject.data.category = category;
            canvas.renderAll();
          }
        }
      }
    }
  };

  const handleUndoClick = () => {
    undo();
  };

  const handleRedoClick = () => {
    redo();
  };

  const handleToggleDimensions = () => {
    const newShowDimensions = !displaySettings.showDimensions;
    setDisplaySettings({ showDimensions: newShowDimensions });

    // If turning off dimensions, remove all dimension annotations from canvas
    if (!newShowDimensions && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const dimensionObjects = canvas.getObjects().filter(
          obj => obj.data?.type === 'dimensionAnnotation'
      );
      dimensionObjects.forEach(obj => {
        canvas.remove(obj);
      });
      canvas.renderAll();
    }

    // If turning on dimensions and there's a selected object, show its dimensions
    if (newShowDimensions && fabricCanvasRef.current && toolState.selectedObjectId) {
      const canvas = fabricCanvasRef.current;
      const selectedObject = canvas.getActiveObject();

      if (selectedObject) {
        // We'll need to import and use the createDimensionAnnotations function here
        // This is just a placeholder reference
        // createDimensionAnnotations(canvas, selectedObject, {
        //   showDimensions: true,
        //   unit: displaySettings.dimensionUnit,
        //   fadeIn: true,
        // });
      }
    }
  };

  const handleToggleFloorBeams = () => {
    const newShowFloorBeams = !displaySettings.showFloorBeams;
    setDisplaySettings({ showFloorBeams: newShowFloorBeams });

    // Force canvas refresh to show/hide floor beams
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleModulePrefixChange = () => {
    if (modulePrefixInput.trim()) {
      setModuleNamePrefix(modulePrefixInput.trim());
    }
  };

  return (
      <ToolbarContainer>
        <ToolbarRow>
          <ToolbarSection>
            <SectionTitle>Tools</SectionTitle>
            <ToolButton
                active={toolState.activeTool === ToolType.SELECT && !toolState.customTool}
                onClick={() => handleToolClick(ToolType.SELECT)}
                title="Select (V)"
            >
              <SelectIcon />
            </ToolButton>
            <ToolButton
                active={toolState.activeTool === ToolType.HAND}
                onClick={() => handleToolClick(ToolType.HAND)}
                title="Hand Tool (H) - Hold Space"
            >
              <HandIcon />
            </ToolButton>
            <ToolButton
                active={toolState.activeTool === ToolType.MODULE}
                onClick={() => handleToolClick(ToolType.MODULE)}
                title="Module (M)"
            >
              <ModuleIcon />
            </ToolButton>
            <ToolButton
                active={toolState.activeTool === ToolType.BALCONY}
                onClick={() => handleToolClick(ToolType.BALCONY)}
                title="Balcony (B)"
            >
              <BalconyIcon />
            </ToolButton>
            <ToolButton
                active={toolState.activeTool === ToolType.OPENING_DOOR}
                onClick={() => handleToolClick(ToolType.OPENING_DOOR)}
                title="Door (D)"
            >
              <DoorIcon />
            </ToolButton>
            <ToolButton
                active={toolState.activeTool === ToolType.OPENING_WINDOW}
                onClick={() => handleToolClick(ToolType.OPENING_WINDOW)}
                title="Window (W)"
            >
              <WindowIcon />
            </ToolButton>
            {/* New tool buttons */}
            <ToolButton
                active={toolState.customTool === ExtendedToolType.CORRIDOR}
                onClick={() => handleToolClick(ExtendedToolType.CORRIDOR)}
                title="Corridor (C)"
            >
              <CorridorIcon />
            </ToolButton>
            <ToolButton
                active={toolState.customTool === ExtendedToolType.BATHROOM_POD}
                onClick={() => handleToolClick(ExtendedToolType.BATHROOM_POD)}
                title="Bathroom Pod (P)"
            >
              <BathroomIcon />
            </ToolButton>
            <ToolButton
                active={toolState.customTool === ExtendedToolType.ROOF}
                onClick={() => handleToolClick(ExtendedToolType.ROOF)}
                title="Roof (R)"
            >
              <RoofIcon />
            </ToolButton>
            <ToolButton
                active={toolState.customTool === ExtendedToolType.SCALE}
                onClick={() => handleToolClick(ExtendedToolType.SCALE)}
                title="Scale Tool (S)"
            >
              <ScaleIcon />
            </ToolButton>
          </ToolbarSection>

        <ToolbarSection>
          <SectionTitle>Edit</SectionTitle>
          <ToolButton onClick={handleUndoClick} disabled={!canUndo} title={`Undo (${isMac ? '⌘Z' : 'Ctrl+Z'})`}>
            <UndoIcon />
          </ToolButton>
          <ToolButton onClick={handleRedoClick} disabled={!canRedo} title={`Redo (${isMac ? '⌘⇧Z' : 'Ctrl+Y'})`}>
            <RedoIcon />
          </ToolButton>
        </ToolbarSection>

        <ToolbarSection>
          <SectionTitle>Module Category</SectionTitle>
          <Dropdown
            onClick={e => {
              e.stopPropagation(); // Prevent click from closing the dropdown
              setIsCategoryOpen(!isCategoryOpen);
            }}
          >
            <DropdownButton>
              <ColorSwatch color={moduleColors[selectedCategory]} />
              {selectedCategory}
            </DropdownButton>
            <DropdownContent isOpen={isCategoryOpen}>
              {Object.values(ModuleCategory).map(category => (
                <DropdownItem
                  key={category}
                  selected={category === selectedCategory}
                  onClick={() => handleCategoryChange(category)}
                >
                  <ColorSwatch color={moduleColors[category]} />
                  {category}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </ToolbarSection>

          {/* Grid Settings Section */}
          <ToolbarSection>
            <SectionTitle>Grid</SectionTitle>
            <GridControls>
              <span>Size:</span>
              <GridSizeInput
                  type="number"
                  value={gridSettings.size}
                  onChange={handleGridSizeChange}
                  min="10" // Maximum resolution: 1 grid = 10 mm (spec p.2, line 4)
                  max="1000"
                  title="Grid size in mm (minimum 10mm)"
              />
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

              <Checkbox>
                <input
                    type="checkbox"
                    checked={gridSettings.snapToElement}
                    onChange={handleSnapToElementChange}
                    id="snap-to-element"
                />
                <label htmlFor="snap-to-element">Snap Elements</label>
              </Checkbox>

              {gridSettings.snapToElement && (
                  <>
                    <span>Gap:</span>
                    <GridSizeInput
                        type="number"
                        value={gridSettings.elementGap || 50} // Default gap 50mm (spec p.2, line 10)
                        onChange={handleGapChange}
                        min="0"
                        max="1000"
                        title="Element gap in mm"
                    />
                  </>
              )}
            </GridControls>
          </ToolbarSection>

          {/* Module Naming Section */}
          <ToolbarSection>
            <SectionTitle>Module Naming</SectionTitle>
            <GridSizeInput
                type="text"
                value={modulePrefixInput}
                onChange={(e) => setModulePrefixInput(e.target.value)}
                maxLength={4}
                title="Module name prefix (1-4 characters)"
            />
            <ToolButton
                onClick={handleModulePrefixChange}
                title="Apply Prefix"
            >
              ✓
            </ToolButton>
          </ToolbarSection>

          {/* Display Settings */}
          <ToolbarSection>
            <SectionTitle>Display</SectionTitle>
            <ToolButton
                active={displaySettings.showDimensions}
                onClick={handleToggleDimensions}
                title="Show Dimensions"
            >
              <RulerIcon />
            </ToolButton>

            <Checkbox>
              <input
                  type="checkbox"
                  checked={displaySettings.showFloorBeams}
                  onChange={handleToggleFloorBeams}
                  id="show-floor-beams"
              />
              <label htmlFor="show-floor-beams">Floor Beams</label>
            </Checkbox>

            {displaySettings.showDimensions && (
                <Select
                    value={displaySettings.dimensionUnit}
                    onChange={(e) => setDisplaySettings({ dimensionUnit: e.target.value })}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="in">in</option>
                </Select>
            )}
          </ToolbarSection>

          {/* Keyboard Hints */}
          <KeyboardHintsDiv>
            <ShortcutHintSpan>V</ShortcutHintSpan> Select
            <ShortcutHintSpan>H</ShortcutHintSpan> Hand
            <ShortcutHintSpan>M</ShortcutHintSpan> Module
            <ShortcutHintSpan>B</ShortcutHintSpan> Balcony
            <ShortcutHintSpan>C</ShortcutHintSpan> Corridor
            <ShortcutHintSpan>R</ShortcutHintSpan> Roof
            <ShortcutHintSpan>Space</ShortcutHintSpan> Pan
          </KeyboardHintsDiv>
        </ToolbarRow>
      </ToolbarContainer>
  );
};

export default ImprovedToolbar;
