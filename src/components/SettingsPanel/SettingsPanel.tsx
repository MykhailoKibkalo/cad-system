'use client';

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import useCadStore from '@/store/cadStore';
import { fabric } from 'fabric';
import { snap, snap10 } from '@/utils/snap';

const Panel = styled.div`
  position: fixed;
  top: 100px;
  right: 20px;
  width: 300px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
`;

const FieldGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 8px 16px;
  margin-left: 8px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }

  &.primary {
    background: #4a6;
    color: white;
    border-color: #4a6;

    &:hover {
      background: #395;
    }
  }
`;

interface SettingsPanelProps {
  object: fabric.Object;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ object, onClose }) => {
  const canvas = useCadStore(state => state.canvas);
  const [formData, setFormData] = useState<any>({});
  const [objectType, setObjectType] = useState<string>('');

  useEffect(() => {
    if (!object || !object.data) return;

    setObjectType(object.data.type);

    // Extract different fields based on object type
    switch (object.data.type) {
      case 'opening':
        setFormData({
          width: object.data.width || object.width,
          height: object.data.height || object.height,
          wallSide: object.data.wallSide || 1,
          distance: object.data.distance || 0,
          y_offset: object.data.y_offset || 0,
        });
        break;

      case 'balcony':
        setFormData({
          width: object.data.width || object.width,
          length: object.data.length || object.height,
          wallSide: object.data.wallSide || 1,
          distance: object.data.distance || 0,
          name: object.data.name || '',
        });
        break;

      case 'bathroom':
        setFormData({
          width: object.data.width || object.width,
          length: object.data.length || object.height,
          x_offset: object.data.x_offset || 0,
          y_offset: object.data.y_offset || 0,
          id: object.data.id || '',
        });
        break;

      case 'corridor':
        setFormData({
          name: object.data.name || '',
          direction: object.data.direction || 'horizontal',
          floor: object.data.floor || 1,
          width: object.width,
          height: object.height,
        });
        break;

      case 'module':
        setFormData({
          name: object.data.name || '',
          width: object.data.width || object.width,
          length: object.data.length || object.height,
          rotation: object.data.rotation || 0,
          x0: object.data.x0 || object.left,
          y0: object.data.y0 || object.top,
        });
        break;

      default:
        setFormData({});
    }
  }, [object]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleApply = () => {
    if (!canvas || !object || !object.data) return;

    // Apply changes based on object type
    switch (objectType) {
      case 'opening':
        applyOpeningChanges();
        break;

      case 'balcony':
        applyBalconyChanges();
        break;

      case 'bathroom':
        applyBathroomChanges();
        break;

      case 'corridor':
        applyCorridorChanges();
        break;

      case 'module':
        applyModuleChanges();
        break;
    }

    canvas.requestRenderAll();
    onClose();
  };

  const applyOpeningChanges = () => {
    if (!canvas || !object || !object.data) return;

    // Update object dimensions
    object.set({
      width: snap10(formData.width),
      height: snap10(formData.height),
    });

    // Update object metadata
    object.data.width = snap10(formData.width);
    object.data.height = snap10(formData.height);

    // If wall side changed, we need to reposition
    if (formData.wallSide !== object.data.wallSide) {
      object.data.wallSide = formData.wallSide;

      // Find parent module
      const parentModule = canvas
        .getObjects()
        .find(o => o.data?.type === 'module' && o.data?.name === object.data.moduleId);

      if (parentModule) {
        const moduleLeft = parentModule.left!;
        const moduleTop = parentModule.top!;
        const moduleWidth = parentModule.width!;
        const moduleHeight = parentModule.height!;

        // Position based on new wall side
        switch (formData.wallSide) {
          case 1: // Bottom wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop + moduleHeight - formData.height,
            });
            break;
          case 2: // Right wall
            object.set({
              left: moduleLeft + moduleWidth - formData.width,
              top: moduleTop + formData.distance,
            });
            break;
          case 3: // Top wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop,
            });
            break;
          case 4: // Left wall
            object.set({
              left: moduleLeft,
              top: moduleTop + formData.distance,
            });
            break;
        }
      }
    } else {
      // Update distance and y_offset
      object.data.distance = formData.distance;
      object.data.y_offset = formData.y_offset;

      // Find parent module
      const parentModule = canvas
        .getObjects()
        .find(o => o.data?.type === 'module' && o.data?.name === object.data.moduleId);

      if (parentModule) {
        const moduleLeft = parentModule.left!;
        const moduleTop = parentModule.top!;
        const moduleWidth = parentModule.width!;
        const moduleHeight = parentModule.height!;

        // Position based on existing wall side with new distance/offset
        switch (object.data.wallSide) {
          case 1: // Bottom wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop + moduleHeight - formData.height,
            });
            break;
          case 2: // Right wall
            object.set({
              left: moduleLeft + moduleWidth - formData.width,
              top: moduleTop + formData.distance,
            });
            break;
          case 3: // Top wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop + formData.y_offset,
            });
            break;
          case 4: // Left wall
            object.set({
              left: moduleLeft + formData.y_offset,
              top: moduleTop + formData.distance,
            });
            break;
        }
      }
    }

    object.setCoords();
  };

  const applyBalconyChanges = () => {
    if (!canvas || !object || !object.data) return;

    // Update object dimensions and metadata
    if (object.data.wallSide === 1 || object.data.wallSide === 3) {
      // For horizontal walls (top/bottom), width is along the wall, height is depth
      object.set({
        width: snap10(formData.width),
        height: snap10(formData.length),
      });
    } else {
      // For vertical walls (left/right), width is depth, height is along the wall
      object.set({
        width: snap10(formData.length),
        height: snap10(formData.width),
      });
    }

    // Update object metadata
    object.data.width = snap10(formData.width);
    object.data.length = snap10(formData.length);
    object.data.name = formData.name;

    // If wall side changed, we need to reposition
    if (formData.wallSide !== object.data.wallSide) {
      object.data.wallSide = formData.wallSide;

      // Find parent module
      const parentModule = canvas
        .getObjects()
        .find(o => o.data?.type === 'module' && o.data?.name === object.data.moduleId);

      if (parentModule) {
        const moduleLeft = parentModule.left!;
        const moduleTop = parentModule.top!;
        const moduleWidth = parentModule.width!;
        const moduleHeight = parentModule.height!;

        // Position based on new wall side
        switch (formData.wallSide) {
          case 1: // Bottom wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop + moduleHeight,
              width: formData.width,
              height: formData.length,
            });
            break;
          case 2: // Right wall
            object.set({
              left: moduleLeft + moduleWidth,
              top: moduleTop + formData.distance,
              width: formData.length,
              height: formData.width,
            });
            break;
          case 3: // Top wall
            object.set({
              left: moduleLeft + formData.distance,
              top: moduleTop - formData.length,
              width: formData.width,
              height: formData.length,
            });
            break;
          case 4: // Left wall
            object.set({
              left: moduleLeft - formData.length,
              top: moduleTop + formData.distance,
              width: formData.length,
              height: formData.width,
            });
            break;
        }
      }
    } else {
      // Update distance
      object.data.distance = formData.distance;

      // Find parent module
      const parentModule = canvas
        .getObjects()
        .find(o => o.data?.type === 'module' && o.data?.name === object.data.moduleId);

      if (parentModule) {
        const moduleLeft = parentModule.left!;
        const moduleTop = parentModule.top!;
        const moduleWidth = parentModule.width!;
        const moduleHeight = parentModule.height!;

        // Position based on existing wall side with new distance
        switch (object.data.wallSide) {
          case 1: // Bottom wall
            object.set({
              left: moduleLeft + formData.distance,
            });
            break;
          case 2: // Right wall
            object.set({
              top: moduleTop + formData.distance,
            });
            break;
          case 3: // Top wall
            object.set({
              left: moduleLeft + formData.distance,
            });
            break;
          case 4: // Left wall
            object.set({
              top: moduleTop + formData.distance,
            });
            break;
        }
      }
    }

    object.setCoords();
  };

  const applyBathroomChanges = () => {
    if (!canvas || !object || !object.data) return;

    // Update object dimensions
    object.set({
      width: snap10(formData.width),
      height: snap10(formData.length),
    });

    // Update object metadata
    object.data.width = snap10(formData.width);
    object.data.length = snap10(formData.length);
    object.data.x_offset = formData.x_offset;
    object.data.y_offset = formData.y_offset;

    // Find parent module
    const parentModule = canvas
      .getObjects()
      .find(o => o.data?.type === 'module' && o.data?.name === object.data.moduleId);

    if (parentModule) {
      const moduleLeft = parentModule.left!;
      const moduleTop = parentModule.top!;

      // Position based on new offsets
      object.set({
        left: moduleLeft + formData.x_offset,
        top: moduleTop + formData.y_offset,
      });

      // Make sure it stays inside the module
      const moduleWidth = parentModule.width!;
      const moduleHeight = parentModule.height!;

      if (object.left! + object.width! > moduleLeft + moduleWidth) {
        object.set({ left: moduleLeft + moduleWidth - object.width! });
        object.data.x_offset = object.left! - moduleLeft;
      }

      if (object.top! + object.height! > moduleTop + moduleHeight) {
        object.set({ top: moduleTop + moduleHeight - object.height! });
        object.data.y_offset = object.top! - moduleTop;
      }
    }

    object.setCoords();
  };

  const applyCorridorChanges = () => {
    if (!canvas || !object || !object.data) return;

    // Update name
    object.data.name = formData.name;

    // Update floor
    object.data.floor = parseInt(formData.floor);

    // Direction is determined by width/height
    const newWidth = snap(formData.width);
    const newHeight = snap(formData.height);

    object.set({
      width: newWidth,
      height: newHeight,
    });

    // Update coordinates
    object.data.x1 = object.left!;
    object.data.y1 = object.top!;
    object.data.x2 = object.left! + newWidth;
    object.data.y2 = object.top! + newHeight;
    object.data.direction = newWidth > newHeight ? 'horizontal' : 'vertical';

    object.setCoords();
  };

  const applyModuleChanges = () => {
    if (!canvas || !object || !object.data || !(object instanceof fabric.Group)) return;

    // Update name
    const oldName = object.data.name;
    object.data.name = formData.name;

    // Update module text label
    const textObject = (object as fabric.Group).getObjects().find(obj => obj instanceof fabric.Text) as fabric.Text;
    if (textObject) {
      textObject.set('text', formData.name);
    }

    // Update dimensions
    const rectObject = (object as fabric.Group).getObjects()[0] as fabric.Rect;
    if (rectObject) {
      rectObject.set({
        width: snap(formData.width),
        height: snap(formData.length),
      });

      // Update label position
      if (textObject) {
        textObject.set({
          left: rectObject.width! / 2,
          top: rectObject.height! / 2,
        });
      }
    }

    // Update position
    object.set({
      left: snap(formData.x0),
      top: snap(formData.y0),
    });

    // Update metadata
    object.data.width = snap(formData.width);
    object.data.length = snap(formData.length);
    object.data.x0 = snap(formData.x0);
    object.data.y0 = snap(formData.y0);

    // Update related components if name changed
    if (oldName !== formData.name) {
      canvas.getObjects().forEach(o => {
        if (o.data && o.data.moduleId === oldName) {
          o.data.moduleId = formData.name;
        }
      });
    }

    object.setCoords();
  };

  const renderFields = () => {
    switch (objectType) {
      case 'opening':
        return (
          <>
            <FieldGroup>
              <Label>Width (mm)</Label>
              <Input type="number" name="width" value={formData.width} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Height (mm)</Label>
              <Input type="number" name="height" value={formData.height} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Wall Side</Label>
              <Select name="wallSide" value={formData.wallSide} onChange={handleChange}>
                <option value="1">Bottom (1)</option>
                <option value="2">Right (2)</option>
                <option value="3">Top (3)</option>
                <option value="4">Left (4)</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Distance along wall (mm)</Label>
              <Input type="number" name="distance" value={formData.distance} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Y-offset (mm)</Label>
              <Input type="number" name="y_offset" value={formData.y_offset} onChange={handleChange} step="10" />
            </FieldGroup>
          </>
        );

      case 'balcony':
        return (
          <>
            <FieldGroup>
              <Label>Name</Label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <Label>Width (along wall) (mm)</Label>
              <Input type="number" name="width" value={formData.width} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Length (protruding) (mm)</Label>
              <Input type="number" name="length" value={formData.length} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Wall Side</Label>
              <Select name="wallSide" value={formData.wallSide} onChange={handleChange}>
                <option value="1">Bottom (1)</option>
                <option value="2">Right (2)</option>
                <option value="3">Top (3)</option>
                <option value="4">Left (4)</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Distance along wall (mm)</Label>
              <Input type="number" name="distance" value={formData.distance} onChange={handleChange} step="10" />
            </FieldGroup>
          </>
        );

      case 'bathroom':
        return (
          <>
            <FieldGroup>
              <Label>ID</Label>
              <Input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                disabled={true} // ID should not be editable
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Width (mm)</Label>
              <Input type="number" name="width" value={formData.width} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Length (mm)</Label>
              <Input type="number" name="length" value={formData.length} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>X-offset (mm)</Label>
              <Input type="number" name="x_offset" value={formData.x_offset} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Y-offset (mm)</Label>
              <Input type="number" name="y_offset" value={formData.y_offset} onChange={handleChange} step="10" />
            </FieldGroup>
          </>
        );

      case 'corridor':
        return (
          <>
            <FieldGroup>
              <Label>Name</Label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <Label>Floor</Label>
              <Input type="number" name="floor" value={formData.floor} onChange={handleChange} min="1" step="1" />
            </FieldGroup>
            <FieldGroup>
              <Label>Width (mm)</Label>
              <Input type="number" name="width" value={formData.width} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Height (mm)</Label>
              <Input type="number" name="height" value={formData.height} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Direction</Label>
              <Input type="text" value={formData.width > formData.height ? 'Horizontal' : 'Vertical'} disabled={true} />
            </FieldGroup>
          </>
        );

      case 'module':
        return (
          <>
            <FieldGroup>
              <Label>Name</Label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <Label>Width (mm)</Label>
              <Input type="number" name="width" value={formData.width} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Length (mm)</Label>
              <Input type="number" name="length" value={formData.length} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>X Position (mm)</Label>
              <Input type="number" name="x0" value={formData.x0} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Y Position (mm)</Label>
              <Input type="number" name="y0" value={formData.y0} onChange={handleChange} step="10" />
            </FieldGroup>
            <FieldGroup>
              <Label>Rotation (degrees)</Label>
              <Input
                type="number"
                name="rotation"
                value={formData.rotation || 0}
                onChange={handleChange}
                step="90"
                min="0"
                max="270"
              />
            </FieldGroup>
          </>
        );

      default:
        return <p>No editable properties available.</p>;
    }
  };

  return (
    <Panel>
      <Title>{objectType.charAt(0).toUpperCase() + objectType.slice(1)} Properties</Title>
      {renderFields()}
      <ButtonGroup>
        <Button onClick={onClose}>Cancel</Button>
        <Button className="primary" onClick={handleApply}>
          Apply
        </Button>
      </ButtonGroup>
    </Panel>
  );
};

export default SettingsPanel;
