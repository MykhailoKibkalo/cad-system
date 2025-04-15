// src/components/ui/WallPropertyEditor.tsx
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {WallEdge, WallPlacement, WallProperties, WallType} from '@/types/wall';

const EditorContainer = styled.div`
  margin-bottom: 16px;
`;

const WallSection = styled.div`
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f8f8f8;
`;

const WallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const WallTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const PropertyLabel = styled.label`
  width: 80px;
  font-size: 12px;
  margin-right: 8px;
`;

const CheckboxInput = styled.input`
  margin-right: 4px;
`;

const SelectInput = styled.select`
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
`;

const NumberInput = styled.input`
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
`;

interface WallPropertyEditorProps {
  walls: Record<WallEdge, WallProperties>;
  onChange: (edge: WallEdge, properties: WallProperties) => void;
}

const WallPropertyEditor: React.FC<WallPropertyEditorProps> = ({ walls, onChange }) => {
  const [wallProperties, setWallProperties] = useState(walls);

  // Update local state when props change
  useEffect(() => {
    setWallProperties(walls);
  }, [walls]);

  const handlePropertyChange = (edge: WallEdge, key: keyof WallProperties, value: any) => {
    // Create a copy of the wall properties for this edge
    const updatedProperties = { ...wallProperties[edge], [key]: value };

    // If changing the type, update thickness to default for that type
    if (key === 'type') {
      const newType = value as WallType;
      updatedProperties.thickness = newType === WallType.EXTERNAL ? 10 : 5;
    }

    // Call the parent component's onChange handler
    onChange(edge, updatedProperties);
  };

  const renderWallEditor = (edge: WallEdge, properties: WallProperties) => {
    return (
      <WallSection key={edge}>
        <WallHeader>
          <WallTitle>{capitalizeFirstLetter(edge)} Wall</WallTitle>
          <CheckboxInput
            type="checkbox"
            checked={properties.enabled}
            onChange={e => handlePropertyChange(edge, 'enabled', e.target.checked)}
            id={`wall-${edge}-enabled`}
          />
          <label htmlFor={`wall-${edge}-enabled`}>Enabled</label>
        </WallHeader>

        {properties.enabled && (
          <>
            <PropertyRow>
              <PropertyLabel>Type:</PropertyLabel>
              <SelectInput
                  value={properties.type}
                  onChange={(e) => handlePropertyChange(edge, 'type', e.target.value as WallType)}
              >
                <option value={WallType.EXTERNAL}>External (Thick)</option>
                <option value={WallType.INTERNAL}>Internal (Thin)</option>
              </SelectInput>
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>Placement:</PropertyLabel>
              <SelectInput
                  value={properties.placement}
                  onChange={(e) => handlePropertyChange(edge, 'placement', e.target.value as WallPlacement)}
              >
                {/*<option value={WallPlacement.CENTER}>Centered</option>*/}
                <option value={WallPlacement.INSIDE}>Inside</option>
                <option value={WallPlacement.OUTSIDE}>Outside</option>
              </SelectInput>
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>Thickness:</PropertyLabel>
              <NumberInput
                  type="number"
                  value={properties.thickness}
                  onChange={(e) => handlePropertyChange(edge, 'thickness', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
              />
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>Start Offset:</PropertyLabel>
              <NumberInput
                  type="number"
                  value={properties.partialStart || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handlePropertyChange(edge, 'partialStart', Math.max(0, Math.min(1, value)));
                  }}
                  min="0"
                  max="1"
                  step="0.1"
              />
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>End Offset:</PropertyLabel>
              <NumberInput
                  type="number"
                  value={properties.partialEnd || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handlePropertyChange(edge, 'partialEnd', Math.max(0, Math.min(1, value)));
                  }}
                  min="0"
                  max="1"
                  step="0.1"
              />
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>Extend Start:</PropertyLabel>
              <CheckboxInput
                  type="checkbox"
                  checked={properties.extendStart || false}
                  onChange={(e) => handlePropertyChange(edge, 'extendStart', e.target.checked)}
                  id={`wall-${edge}-extend-start`}
              />
              <PropertyLabel htmlFor={`wall-${edge}-extend-start`} style={{ width: 'auto' }}>
                Fill corner at start
              </PropertyLabel>
            </PropertyRow>

            <PropertyRow>
              <PropertyLabel>Extend End:</PropertyLabel>
              <CheckboxInput
                  type="checkbox"
                  checked={properties.extendEnd || false}
                  onChange={(e) => handlePropertyChange(edge, 'extendEnd', e.target.checked)}
                  id={`wall-${edge}-extend-end`}
              />
              <PropertyLabel htmlFor={`wall-${edge}-extend-end`} style={{ width: 'auto' }}>
                Fill corner at end
              </PropertyLabel>
            </PropertyRow>
          </>
        )}
      </WallSection>
    );
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <EditorContainer>
      {Object.entries(wallProperties).map(([edge, properties]) => renderWallEditor(edge as WallEdge, properties))}
    </EditorContainer>
  );
};

export default WallPropertyEditor;
