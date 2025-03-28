// src/components/ui/PropertyPanel.tsx
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, ModuleCategory } from '@/types';

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
