// src/components/ui/ModuleWallsEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, ModuleWalls, WallProperties, WallType } from '@/types';
import { fabric } from 'fabric';

const EditorContainer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ccc;
`;

const WallSection = styled.div`
  margin-bottom: 16px;
`;

const WallHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer; /* Make the entire header clickable */
`;

const WallTitle = styled.h4`
  margin: 0 0 0 8px;
  font-size: 14px;
  font-weight: 600;
`;

const WallCheckbox = styled.input`
  margin: 0;
  cursor: pointer;
`;

const WallTypeSelect = styled.select`
  width: 100%;
  padding: 6px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.label`
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
`;

const NumberInput = styled.input`
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

// Wall icon components
const TopWallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4h12" />
  </svg>
);

const RightWallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v12" />
  </svg>
);

const BottomWallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12h12" />
  </svg>
);

const LeftWallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 2v12" />
  </svg>
);

interface ModuleWallsEditorProps {
  moduleId: string;
}

// Type for the edge keys of the walls
type WallEdge = 'top' | 'right' | 'bottom' | 'left';

// Type for the wall properties that can be edited
type EditableWallProperty = 'thickness' | 'startOffset' | 'endOffset';

const ModuleWallsEditor: React.FC<ModuleWallsEditorProps> = ({ moduleId }) => {
  const { getModuleById, updateModule, fabricCanvasRef } = useCad();
  const { addAction } = useHistory();

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Reference to store timeouts for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default wall properties
  const defaultWallProps: WallProperties = {
    enabled: false,
    type: WallType.EXTERNAL,
    thickness: 10,
    startOffset: 0,
    endOffset: 0,
  };

  // Get the current module
  const module = getModuleById(moduleId);

  // Initialize wall state from module
  const [walls, setWalls] = useState<ModuleWalls>(() => {
    if (module?.walls) {
      return {
        top: { ...defaultWallProps, ...module.walls.top },
        right: { ...defaultWallProps, ...module.walls.right },
        bottom: { ...defaultWallProps, ...module.walls.bottom },
        left: { ...defaultWallProps, ...module.walls.left },
      };
    }
    return {
      top: { ...defaultWallProps },
      right: { ...defaultWallProps },
      bottom: { ...defaultWallProps },
      left: { ...defaultWallProps },
    };
  });

  // Reset wall state when module changes
  useEffect(() => {
    if (module?.walls) {
      setWalls({
        top: { ...defaultWallProps, ...module.walls.top },
        right: { ...defaultWallProps, ...module.walls.right },
        bottom: { ...defaultWallProps, ...module.walls.bottom },
        left: { ...defaultWallProps, ...module.walls.left },
      });
    } else if (module) {
      setWalls({
        top: { ...defaultWallProps },
        right: { ...defaultWallProps },
        bottom: { ...defaultWallProps },
        left: { ...defaultWallProps },
      });
    }
  }, [moduleId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Apply wall changes to the module and canvas
  const applyWallChanges = (newWalls: ModuleWalls): void => {
    if (!module) return;

    // Store original state for history
    const originalModule = { ...module };

    // Create updated module
    const updatedModule = {
      ...module,
      walls: newWalls,
    };

    // Update the module in the data model
    updateModule(moduleId, { walls: newWalls });

    // Add to history
    addAction({
      type: ActionType.UPDATE_MODULE,
      payload: {
        before: { module: originalModule },
        after: { module: updatedModule },
        id: moduleId,
      },
    });

    // Update canvas
    renderWallsOnCanvas(newWalls);
  };

  // Render walls on canvas
  const renderWallsOnCanvas = (wallsToRender: ModuleWalls): void => {
    if (!fabricCanvasRef.current || !module) return;

    const canvas = fabricCanvasRef.current;

    // Remove existing walls for this module
    const existingWalls = canvas
      .getObjects()
      .filter(obj => obj.data?.type === 'wall' && obj.data?.moduleId === moduleId);

    existingWalls.forEach(wall => {
      canvas.remove(wall);
    });

    // Extract module properties
    const { position, width, height, rotation } = module;

    // Render each enabled wall
    (Object.entries(wallsToRender) as [WallEdge, WallProperties][]).forEach(([edge, wall]) => {
      if (!wall.enabled) return;

      const { thickness, startOffset, endOffset, type } = wall;
      const isExternal = type === WallType.EXTERNAL;

      let left = position.x;
      let top = position.y;
      let wallWidth = thickness;
      let wallHeight = thickness;

      // Position the wall based on edge (center internal walls, external walls outside)
      switch (edge) {
        case 'top':
          left += startOffset;
          top += isExternal ? -thickness / 2 : 0;
          wallWidth = width - startOffset - endOffset;
          wallHeight = thickness;
          break;
        case 'right':
          left += isExternal ? width - thickness / 2 : width;
          top += startOffset;
          wallWidth = thickness;
          wallHeight = height - startOffset - endOffset;
          break;
        case 'bottom':
          left += startOffset;
          top += isExternal ? height - thickness / 2 : height;
          wallWidth = width - startOffset - endOffset;
          wallHeight = thickness;
          break;
        case 'left':
          left += isExternal ? -thickness / 2 : 0;
          top += startOffset;
          wallWidth = thickness;
          wallHeight = height - startOffset - endOffset;
          break;
      }

      // Create the wall object
      const wallObject = new fabric.Rect({
        left,
        top,
        width: wallWidth,
        height: wallHeight,
        fill: isExternal ? '#333333' : '#888888',
        stroke: '#000000',
        strokeWidth: 0.5,
        angle: rotation,
        selectable: false,
        evented: false,
      });

      // Add metadata
      wallObject.data = {
        type: 'wall',
        edge,
        moduleId,
      };

      // Add to canvas and send to back
      canvas.add(wallObject);
      canvas.sendToBack(wallObject);
    });

    canvas.renderAll();
  };

  // Event handlers for wall properties

  // Toggle wall enabled state
  const handleWallToggle = (edge: WallEdge): void => {
    // Create a new wall state with toggled enabled property
    const newWalls: ModuleWalls = {
      ...walls,
      [edge]: {
        ...walls[edge],
        enabled: !walls[edge].enabled,
      },
    };

    // Update local state
    setWalls(newWalls);

    // Update module and canvas with a small delay to prevent update loops
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        applyWallChanges(newWalls);
      }
    }, 50);
  };

  // Change wall type
  const handleWallTypeChange = (edge: WallEdge, value: string): void => {
    const newWalls: ModuleWalls = {
      ...walls,
      [edge]: {
        ...walls[edge],
        type: value as WallType,
      },
    };

    setWalls(newWalls);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        applyWallChanges(newWalls);
      }
    }, 50);
  };

  // Change numeric wall property
  const handleNumericChange = (edge: WallEdge, property: EditableWallProperty, value: string): void => {
    const numericValue = parseInt(value, 10) || 0;

    const newWalls: ModuleWalls = {
      ...walls,
      [edge]: {
        ...walls[edge],
        [property]: numericValue,
      },
    };

    setWalls(newWalls);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        applyWallChanges(newWalls);
      }
    }, 50);
  };

  if (!module) return null;

  return (
    <EditorContainer>
      <h3>Wall Properties</h3>

      {/* Top Wall */}
      <WallSection>
        <WallHeader onClick={() => handleWallToggle('top')}>
          <WallCheckbox
            type="checkbox"
            checked={walls.top.enabled}
            onChange={e => {
              // Stop event propagation to prevent double-toggle
              e.stopPropagation();
              handleWallToggle('top');
            }}
            id="wall-top-enabled"
          />
          <TopWallIcon />
          <WallTitle>Top Wall</WallTitle>
        </WallHeader>

        {walls.top.enabled && (
          <>
            <WallTypeSelect value={walls.top.type} onChange={e => handleWallTypeChange('top', e.target.value)}>
              <option value={WallType.EXTERNAL}>External (Outside)</option>
              <option value={WallType.INTERNAL}>Internal (Centered)</option>
            </WallTypeSelect>

            <InputGrid>
              <InputGroup>
                <InputLabel>Thickness (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.top.thickness}
                  onChange={e => handleNumericChange('top', 'thickness', e.target.value)}
                  min="1"
                  max="50"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>Start Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.top.startOffset}
                  onChange={e => handleNumericChange('top', 'startOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>End Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.top.endOffset}
                  onChange={e => handleNumericChange('top', 'endOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>
            </InputGrid>
          </>
        )}
      </WallSection>

      {/* Right Wall */}
      <WallSection>
        <WallHeader onClick={() => handleWallToggle('right')}>
          <WallCheckbox
            type="checkbox"
            checked={walls.right.enabled}
            onChange={e => {
              e.stopPropagation();
              handleWallToggle('right');
            }}
            id="wall-right-enabled"
          />
          <RightWallIcon />
          <WallTitle>Right Wall</WallTitle>
        </WallHeader>

        {walls.right.enabled && (
          <>
            <WallTypeSelect value={walls.right.type} onChange={e => handleWallTypeChange('right', e.target.value)}>
              <option value={WallType.EXTERNAL}>External (Outside)</option>
              <option value={WallType.INTERNAL}>Internal (Centered)</option>
            </WallTypeSelect>

            <InputGrid>
              <InputGroup>
                <InputLabel>Thickness (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.right.thickness}
                  onChange={e => handleNumericChange('right', 'thickness', e.target.value)}
                  min="1"
                  max="50"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>Start Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.right.startOffset}
                  onChange={e => handleNumericChange('right', 'startOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>End Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.right.endOffset}
                  onChange={e => handleNumericChange('right', 'endOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>
            </InputGrid>
          </>
        )}
      </WallSection>

      {/* Bottom Wall */}
      <WallSection>
        <WallHeader onClick={() => handleWallToggle('bottom')}>
          <WallCheckbox
            type="checkbox"
            checked={walls.bottom.enabled}
            onChange={e => {
              e.stopPropagation();
              handleWallToggle('bottom');
            }}
            id="wall-bottom-enabled"
          />
          <BottomWallIcon />
          <WallTitle>Bottom Wall</WallTitle>
        </WallHeader>

        {walls.bottom.enabled && (
          <>
            <WallTypeSelect value={walls.bottom.type} onChange={e => handleWallTypeChange('bottom', e.target.value)}>
              <option value={WallType.EXTERNAL}>External (Outside)</option>
              <option value={WallType.INTERNAL}>Internal (Centered)</option>
            </WallTypeSelect>

            <InputGrid>
              <InputGroup>
                <InputLabel>Thickness (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.bottom.thickness}
                  onChange={e => handleNumericChange('bottom', 'thickness', e.target.value)}
                  min="1"
                  max="50"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>Start Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.bottom.startOffset}
                  onChange={e => handleNumericChange('bottom', 'startOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>End Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.bottom.endOffset}
                  onChange={e => handleNumericChange('bottom', 'endOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>
            </InputGrid>
          </>
        )}
      </WallSection>

      {/* Left Wall */}
      <WallSection>
        <WallHeader onClick={() => handleWallToggle('left')}>
          <WallCheckbox
            type="checkbox"
            checked={walls.left.enabled}
            onChange={e => {
              e.stopPropagation();
              handleWallToggle('left');
            }}
            id="wall-left-enabled"
          />
          <LeftWallIcon />
          <WallTitle>Left Wall</WallTitle>
        </WallHeader>

        {walls.left.enabled && (
          <>
            <WallTypeSelect value={walls.left.type} onChange={e => handleWallTypeChange('left', e.target.value)}>
              <option value={WallType.EXTERNAL}>External (Outside)</option>
              <option value={WallType.INTERNAL}>Internal (Centered)</option>
            </WallTypeSelect>

            <InputGrid>
              <InputGroup>
                <InputLabel>Thickness (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.left.thickness}
                  onChange={e => handleNumericChange('left', 'thickness', e.target.value)}
                  min="1"
                  max="50"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>Start Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.left.startOffset}
                  onChange={e => handleNumericChange('left', 'startOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>End Offset (px)</InputLabel>
                <NumberInput
                  type="number"
                  value={walls.left.endOffset}
                  onChange={e => handleNumericChange('left', 'endOffset', e.target.value)}
                  min="0"
                />
              </InputGroup>
            </InputGrid>
          </>
        )}
      </WallSection>
    </EditorContainer>
  );
};

export default ModuleWallsEditor;
