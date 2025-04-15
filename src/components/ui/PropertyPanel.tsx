// src/components/ui/PropertyPanel.tsx
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import {
  ActionType,
  createDefaultWalls,
  ModuleCategory,
  WallEdge,
  WallPlacement,
  WallProperties,
  WallType
} from '@/types';
import {fabric} from "fabric";
import WallPropertyEditor from './WallPropertyEditor';
import {calculateWallPosition} from "@/utils/wallUtils";

const PanelContainer = styled.div`
  width: 300px;
  background-color: #f5f5f5;
  border-left: 1px solid #ccc;
  padding: 16px;
  overflow-y: auto;
`;

const PanelTitle = styled.h3`
  font-size: 16px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ccc;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;

  &:hover {
    background-color: #3a80d2;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color: #e74c3c;

  &:hover {
    background-color: #c0392b;
  }
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${props => props.color};
  border: 1px solid #ccc;
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
`;

const DimensionsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const DimensionInput = styled(Input)`
  width: 50%;
`;

const NoSelectionMessage = styled.p`
  margin-top: 32px;
  text-align: center;
  color: #666;
`;

const PropertyPanel: React.FC = () => {
  const {
    toolState,
    getModuleById,
    getBalconyById,
    updateModule,
    deleteModule,
    updateBalcony,
    deleteBalcony,
    moduleColors,
    fabricCanvasRef,
  } = useCad();

  const { addAction } = useHistory();

  const [moduleState, setModuleState] = useState<{
    name: string;
    category: ModuleCategory;
    width: number;
    height: number;
    posX: number;
    posY: number;
    rotation: number;
  }>({
    name: '',
    category: ModuleCategory.A1,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    rotation: 0,
  });

  const [balconyState, setBalconyState] = useState<{
    width: number;
    height: number;
    posX: number;
    posY: number;
    rotation: number;
  }>({
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    rotation: 0,
  });

  // Type of the selected object
  const [selectedType, setSelectedType] = useState<'module' | 'balcony' | null>(null);

  // Original state for history tracking
  const [originalState, setOriginalState] = useState<any>(null);

  const [wallState, setWallState] = useState<Record<WallEdge, WallProperties>>(createDefaultWalls());


  // Update state when selection changes
  useEffect(() => {
    if (!toolState.selectedObjectId) {
      setSelectedType(null);
      return;
    }

    const module = getModuleById(toolState.selectedObjectId);
    if (module) {
      setSelectedType('module');
      setModuleState({
        name: module.name || '',
        category: module.category,
        width: module.width,
        height: module.height,
        posX: module.position.x,
        posY: module.position.y,
        rotation: module.rotation,
      });
      setOriginalState(module);
      return;
    }

    const balcony = getBalconyById(toolState.selectedObjectId);
    if (balcony) {
      setSelectedType('balcony');
      setBalconyState({
        width: balcony.width,
        height: balcony.height,
        posX: balcony.position.x,
        posY: balcony.position.y,
        rotation: balcony.rotation,
      });
      setOriginalState(balcony);
      return;
    }

    // If we reach here, no valid object was found
    setSelectedType(null);
  }, [toolState.selectedObjectId]);

  useEffect(() => {
    if (!toolState.selectedObjectId) {
      setSelectedType(null);
      return;
    }

    const module = getModuleById(toolState.selectedObjectId);
    if (module) {
      setSelectedType('module');
      setModuleState({
        name: module.name || '',
        category: module.category,
        width: module.width,
        height: module.height,
        posX: module.position.x,
        posY: module.position.y,
        rotation: module.rotation,
      });

      // Initialize wall state if module has walls, otherwise use defaults
      setWallState(module.walls || createDefaultWalls());

      setOriginalState(module);
      return;
    }

    // Rest of the function stays the same...
  }, [toolState.selectedObjectId]);

  // Handle module property changes
  const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setModuleState(prev => ({
      ...prev,
      [name]: name === 'category' ? value : parseFloat(value) || value,
    }));
  };

  // Handle balcony property changes
  const handleBalconyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setBalconyState(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleWallChange = (edge: WallEdge, properties: WallProperties) => {
    setWallState(prevState => ({
      ...prevState,
      [edge]: properties
    }));
  };

  // Apply module changes
  const applyModuleChanges = () => {
    if (!toolState.selectedObjectId) return;

    // Store original state for comparison
    const originalModule = getModuleById(toolState.selectedObjectId);
    if (!originalModule) return;

    const updatedModule = {
      name: moduleState.name,
      category: moduleState.category,
      width: moduleState.width,
      height: moduleState.height,
      position: {
        x: moduleState.posX,
        y: moduleState.posY,
      },
      rotation: moduleState.rotation,
      // Add walls property
      walls: wallState,
      // Preserve other properties
      openings: originalModule.openings,
    };

    // Check if category changed
    const categoryChanged = originalModule.category !== updatedModule.category;

    // Update the module
    updateModule(toolState.selectedObjectId, updatedModule);

    // Add to history
    addAction({
      type: ActionType.UPDATE_MODULE,
      payload: {
        before: { module: originalModule },
        after: { module: { ...originalModule, ...updatedModule } },
        id: toolState.selectedObjectId,
      },
    });

    // If the category changed or we're updating properties that affect the canvas,
    // update the visual representation on the canvas
    if (categoryChanged || true) {
      // Find the canvas object and update its properties
      if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;

        // First, remove any existing walls for this module
        const existingWalls = canvas.getObjects().filter(
            obj => obj.data?.type === 'wall' && obj.data?.moduleId === toolState.selectedObjectId
        );
        existingWalls.forEach(wall => canvas.remove(wall));

        // Update the module properties
        const moduleObject = canvas
            .getObjects()
            .find(obj => obj.data?.id === toolState.selectedObjectId) as fabric.Rect;

        if (moduleObject) {
          // Update the visual properties
          moduleObject.set({
            left: updatedModule.position.x,
            top: updatedModule.position.y,
            width: updatedModule.width,
            height: updatedModule.height,
            angle: updatedModule.rotation,
            fill: moduleColors[updatedModule.category], // Update color based on category
          });

          // Also update the data
          moduleObject.data = {
            ...moduleObject.data,
            category: updatedModule.category,
          };

          // Re-render the module to show walls
          // First find the module from the context
          const updatedModuleData = getModuleById(toolState.selectedObjectId);
          if (updatedModuleData) {
            // Then render walls based on the updated module
            // For simplicity in this implementation, we'll only handle non-rotated modules for walls
            if (updatedModuleData.rotation === 0 && updatedModuleData.walls) {
              const walls = updatedModuleData.walls;

              // Top wall
              if (walls.top && walls.top.enabled) {
                const wallThickness = walls.top.thickness;
                const wallColor = walls.top.type === WallType.EXTERNAL ? '#333333' : '#666666';
                const startOffset = walls.top.partialStart || 0;
                const endOffset = walls.top.partialEnd || 0;

                const wallLeft = updatedModuleData.position.x + (updatedModuleData.width * startOffset);
                const wallWidth = updatedModuleData.width * (1 - startOffset - endOffset);

                // Calculate wall position using utility function
                const wallPosition = calculateWallPosition(
                    updatedModuleData.position,
                    { width: updatedModuleData.width, height: updatedModuleData.height },
                    'top',
                    wallThickness,
                    walls.top.placement,
                    startOffset,
                    endOffset,
                    walls.top.extendStart || false,
                    walls.top.extendEnd || false,
                    walls // Pass all walls to check adjacency
                );

                // For inside walls, use a different style to make them visible through the module
                const visualProperties = wallPosition.isInside ? {
                  fill: wallColor,
                  opacity: 0.5,
                } : {
                  fill: wallColor,
                  stroke: undefined,
                  strokeWidth: 0,
                  opacity: 1
                };

                const topWall = new fabric.Rect({
                  left: wallPosition.left,
                  top: wallPosition.top,
                  width: wallPosition.width,
                  height: wallPosition.height,
                  ...visualProperties,
                  selectable: false,
                  evented: false,
                });

                topWall.data = {
                  type: 'wall',
                  moduleId: updatedModuleData.id,
                  edge: 'top',
                };

                canvas.add(topWall);

                // For inside walls, bring to front instead of sending to back
                if (wallPosition.isInside) {
                  canvas.bringToFront(topWall);
                } else {
                  canvas.sendToBack(topWall);
                }
              }

              // Right wall
              if (walls.right && walls.right.enabled) {
                const wallThickness = walls.right.thickness;
                const wallColor = walls.right.type === WallType.EXTERNAL ? '#333333' : '#666666';
                const startOffset = walls.right.partialStart || 0;
                const endOffset = walls.right.partialEnd || 0;

                const wallTop = updatedModuleData.position.y + (updatedModuleData.height * startOffset);
                const wallHeight = updatedModuleData.height * (1 - startOffset - endOffset);

                // Calculate wall position using utility function
                // Calculate wall position using utility function
                const wallPosition = calculateWallPosition(
                    updatedModuleData.position,
                    { width: updatedModuleData.width, height: updatedModuleData.height },
                    'right',
                    wallThickness,
                    walls.right.placement,
                    startOffset,
                    endOffset,
                    walls.right.extendStart || false,
                    walls.right.extendEnd || false,
                    walls // Pass all walls to check adjacency
                );

                // For inside walls, use a different style to make them visible through the module
                const visualProperties = wallPosition.isInside ? {
                  fill: wallColor,
                  opacity: 0.5,
                } : {
                  fill: wallColor,
                  stroke: undefined,
                  strokeWidth: 0,
                  opacity: 1
                };

                const rightWall = new fabric.Rect({
                  left: wallPosition.left,
                  top: wallPosition.top,
                  width: wallPosition.width,
                  height: wallPosition.height,
                  ...visualProperties,
                  selectable: false,
                  evented: false,
                });

                rightWall.data = {
                  type: 'wall',
                  moduleId: updatedModuleData.id,
                  edge: 'right',
                };

                canvas.add(rightWall);

                // For inside walls, bring to front instead of sending to back
                if (wallPosition.isInside) {
                  canvas.bringToFront(rightWall);
                } else {
                  canvas.sendToBack(rightWall);
                }
              }

              // Bottom wall
              if (walls.bottom && walls.bottom.enabled) {
                const wallThickness = walls.bottom.thickness;
                const wallColor = walls.bottom.type === WallType.EXTERNAL ? '#333333' : '#666666';
                const startOffset = walls.bottom.partialStart || 0;
                const endOffset = walls.bottom.partialEnd || 0;

                const wallLeft = updatedModuleData.position.x + (updatedModuleData.width * startOffset);
                const wallWidth = updatedModuleData.width * (1 - startOffset - endOffset);

                // Calculate wall position using utility function
                const wallPosition = calculateWallPosition(
                    updatedModuleData.position,
                    { width: updatedModuleData.width, height: updatedModuleData.height },
                    'bottom',
                    wallThickness,
                    walls.bottom.placement,
                    startOffset,
                    endOffset,
                    walls.bottom.extendStart || false,
                    walls.bottom.extendEnd || false,
                    walls // Pass all walls to check adjacency
                );

                // For inside walls, use a different style to make them visible through the module
                const visualProperties = wallPosition.isInside ? {
                  fill: wallColor,
                  opacity: 0.5,
                } : {
                  fill: wallColor,
                  stroke: undefined,
                  strokeWidth: 0,
                  opacity: 1
                };

                const bottomWall = new fabric.Rect({
                  left: wallPosition.left,
                  top: wallPosition.top,
                  width: wallPosition.width,
                  height: wallPosition.height,
                  ...visualProperties,
                  selectable: false,
                  evented: false,
                });

                bottomWall.data = {
                  type: 'wall',
                  moduleId: updatedModuleData.id,
                  edge: 'bottom',
                };

                canvas.add(bottomWall);

                // For inside walls, bring to front instead of sending to back
                if (wallPosition.isInside) {
                  canvas.bringToFront(bottomWall);
                } else {
                  canvas.sendToBack(bottomWall);
                }
              }

              // Left wall
              if (walls.left && walls.left.enabled) {
                const wallThickness = walls.left.thickness;
                const wallColor = walls.left.type === WallType.EXTERNAL ? '#333333' : '#666666';
                const startOffset = walls.left.partialStart || 0;
                const endOffset = walls.left.partialEnd || 0;

                const wallTop = updatedModuleData.position.y + (updatedModuleData.height * startOffset);
                const wallHeight = updatedModuleData.height * (1 - startOffset - endOffset);

                // Calculate wall position using utility function
                const wallPosition = calculateWallPosition(
                    updatedModuleData.position,
                    { width: updatedModuleData.width, height: updatedModuleData.height },
                    'left',
                    wallThickness,
                    walls.left.placement,
                    startOffset,
                    endOffset,
                    walls.left.extendStart || false,
                    walls.left.extendEnd || false,
                    walls // Pass all walls to check adjacency
                );

                // For inside walls, use a different style to make them visible through the module
                const visualProperties = wallPosition.isInside ? {
                  fill: wallColor,
                  opacity: 0.5,
                } : {
                  fill: wallColor,
                  stroke: undefined,
                  strokeWidth: 0,
                  opacity: 1
                };

                const leftWall = new fabric.Rect({
                  left: wallPosition.left,
                  top: wallPosition.top,
                  width: wallPosition.width,
                  height: wallPosition.height,
                  ...visualProperties,
                  selectable: false,
                  evented: false,
                });

                leftWall.data = {
                  type: 'wall',
                  moduleId: updatedModuleData.id,
                  edge: 'left',
                };

                canvas.add(leftWall);

                // For inside walls, bring to front instead of sending to back
                if (wallPosition.isInside) {
                  canvas.bringToFront(leftWall);
                } else {
                  canvas.sendToBack(leftWall);
                }
              }
            }
          }

          canvas.renderAll();
        }
      }
    }
  };

  // Apply balcony changes
  const applyBalconyChanges = () => {
    if (!toolState.selectedObjectId) return;

    const updatedBalcony = {
      width: balconyState.width,
      height: balconyState.height,
      position: {
        x: balconyState.posX,
        y: balconyState.posY,
      },
      rotation: balconyState.rotation,
    };

    // Update the balcony
    updateBalcony(toolState.selectedObjectId, updatedBalcony);

    // Add to history
    addAction({
      type: ActionType.UPDATE_BALCONY,
      payload: {
        before: { balcony: originalState },
        after: { balcony: { ...originalState, ...updatedBalcony } },
        id: toolState.selectedObjectId,
      },
    });

    // Update the visual representation on the canvas
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const balconyObject = canvas.getObjects().find(obj => obj.data?.id === toolState.selectedObjectId) as fabric.Rect;

      if (balconyObject) {
        balconyObject.set({
          left: updatedBalcony.position.x,
          top: updatedBalcony.position.y,
          width: updatedBalcony.width,
          height: updatedBalcony.height,
          angle: updatedBalcony.rotation,
        });

        canvas.renderAll();
      }
    }
  };

  // Delete module
  const deleteSelectedModule = () => {
    if (!toolState.selectedObjectId || selectedType !== 'module') return;

    // Add to history before deleting
    addAction({
      type: ActionType.DELETE_MODULE,
      payload: {
        before: { module: originalState },
        after: { module: null },
        id: toolState.selectedObjectId,
      },
    });

    // Delete the module
    deleteModule(toolState.selectedObjectId);

    // Also remove from canvas if it exists
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const moduleObject = canvas.getObjects().find(obj => obj.data?.id === toolState.selectedObjectId);

      if (moduleObject) {
        canvas.remove(moduleObject);
        canvas.renderAll();
      }
    }
  };

  // Delete balcony
  const deleteSelectedBalcony = () => {
    if (!toolState.selectedObjectId || selectedType !== 'balcony') return;

    // Add to history before deleting
    addAction({
      type: ActionType.DELETE_BALCONY,
      payload: {
        before: { balcony: originalState },
        after: { balcony: null },
        id: toolState.selectedObjectId,
      },
    });

    // Delete the balcony
    deleteBalcony(toolState.selectedObjectId);

    // Also remove from canvas if it exists
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const balconyObject = canvas.getObjects().find(obj => obj.data?.id === toolState.selectedObjectId);

      if (balconyObject) {
        canvas.remove(balconyObject);
        canvas.renderAll();
      }
    }
  };

  if (!selectedType) {
    return (
      <PanelContainer>
        <PanelTitle>Properties</PanelTitle>
        <NoSelectionMessage>Select an object to view its properties</NoSelectionMessage>
      </PanelContainer>
    );
  }

  if (selectedType === 'module') {
    return (
      <PanelContainer>
        <PanelTitle>Module Properties</PanelTitle>

        <FormGroup>
          <Label>Name</Label>
          <Input type="text" name="name" value={moduleState.name} onChange={handleModuleChange} />
        </FormGroup>

        <FormGroup>
          <Label>Wall Properties</Label>
          <WallPropertyEditor walls={wallState} onChange={handleWallChange} />
        </FormGroup>

        <FormGroup>
          <Label>Category</Label>
          <Select name="category" value={moduleState.category} onChange={handleModuleChange}>
            {Object.values(ModuleCategory).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <ColorPreview color={moduleColors[moduleState.category]} />
        </FormGroup>

        <FormGroup>
          <Label>Dimensions</Label>
          <DimensionsContainer>
            <div>
              <Label>Width</Label>
              <DimensionInput
                type="number"
                name="width"
                value={moduleState.width}
                onChange={handleModuleChange}
                min="1"
              />
            </div>
            <div>
              <Label>Height</Label>
              <DimensionInput
                type="number"
                name="height"
                value={moduleState.height}
                onChange={handleModuleChange}
                min="1"
              />
            </div>
          </DimensionsContainer>
        </FormGroup>

        <FormGroup>
          <Label>Position</Label>
          <DimensionsContainer>
            <div>
              <Label>X</Label>
              <DimensionInput type="number" name="posX" value={moduleState.posX} onChange={handleModuleChange} />
            </div>
            <div>
              <Label>Y</Label>
              <DimensionInput type="number" name="posY" value={moduleState.posY} onChange={handleModuleChange} />
            </div>
          </DimensionsContainer>
        </FormGroup>

        <FormGroup>
          <Label>Rotation (degrees)</Label>
          <Input
            type="number"
            name="rotation"
            value={moduleState.rotation}
            onChange={handleModuleChange}
            min="0"
            max="360"
          />
        </FormGroup>

        <FormGroup>
          <Button onClick={applyModuleChanges}>Apply Changes</Button>
          <DangerButton onClick={deleteSelectedModule}>Delete</DangerButton>
        </FormGroup>
      </PanelContainer>
    );
  }

  // Balcony properties panel
  return (
    <PanelContainer>
      <PanelTitle>Balcony Properties</PanelTitle>

      <FormGroup>
        <Label>Dimensions</Label>
        <DimensionsContainer>
          <div>
            <Label>Width</Label>
            <DimensionInput
              type="number"
              name="width"
              value={balconyState.width}
              onChange={handleBalconyChange}
              min="1"
            />
          </div>
          <div>
            <Label>Height</Label>
            <DimensionInput
              type="number"
              name="height"
              value={balconyState.height}
              onChange={handleBalconyChange}
              min="1"
            />
          </div>
        </DimensionsContainer>
      </FormGroup>

      <FormGroup>
        <Label>Position</Label>
        <DimensionsContainer>
          <div>
            <Label>X</Label>
            <DimensionInput type="number" name="posX" value={balconyState.posX} onChange={handleBalconyChange} />
          </div>
          <div>
            <Label>Y</Label>
            <DimensionInput type="number" name="posY" value={balconyState.posY} onChange={handleBalconyChange} />
          </div>
        </DimensionsContainer>
      </FormGroup>

      <FormGroup>
        <Label>Rotation (degrees)</Label>
        <Input
          type="number"
          name="rotation"
          value={balconyState.rotation}
          onChange={handleBalconyChange}
          min="0"
          max="360"
        />
      </FormGroup>

      <FormGroup>
        <Button onClick={applyBalconyChanges}>Apply Changes</Button>
        <DangerButton onClick={deleteSelectedBalcony}>Delete</DangerButton>
      </FormGroup>
    </PanelContainer>
  );
};

export default PropertyPanel;
