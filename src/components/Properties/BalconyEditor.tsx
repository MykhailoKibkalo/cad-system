// src/components/Properties/BalconyEditor.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Balcony, Module } from '@/types/geometry';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useCurrentFloorElements } from '../Canvas/hooks/useFloorElements';
import { Text } from '@/components/ui/Text';
import { HiMiniXMark } from 'react-icons/hi2';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/InputWithAffix';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { LuPlus, LuSave } from 'react-icons/lu';

interface Props {
  module: Module;
  balconyId?: string;
  onSave: (newBalcony: Balcony) => void;
  onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Box = styled.div`
  background: white;
  border-radius: 8px;
  width: 520px;
  max-width: 90%;
  max-height: 80vh;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  flex-shrink: 0;
`;

const MenuWrap = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 16px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const ScrollContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-height: 0;
  padding: 0 24px;
`;

const Footer = styled.div`
  padding: 24px;
  flex-shrink: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
`;

const HalfWidthButton = styled(Button)`
  flex: 1;
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export default function BalconyEditor({ module, balconyId, onSave, onCancel }: Props) {
  const addBalcony = useObjectStore(s => s.addBalcony);
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const { balconies } = useCurrentFloorElements();
  const { snapMode, gridSizeMm } = useCanvasStore();

  const existing = useMemo(() => {
    return balconyId ? balconies.find(b => b.id === balconyId) : null;
  }, [balconies, balconyId]);

  const [form, setForm] = useState({
    wallSide: existing?.wallSide ?? (1 as 1 | 2 | 3 | 4),
    width: (existing?.width ?? 500).toString(),
    length: (existing?.length ?? 500).toString(),
    distanceAlongWall: (existing?.distanceAlongWall ?? 0).toString(),
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    width?: string;
    length?: string;
    distanceAlongWall?: string;
  }>({});

  // Reset form when existing balcony changes
  useEffect(() => {
    if (existing) {
      setForm({
        wallSide: existing.wallSide,
        width: existing.width.toString(),
        length: existing.length.toString(),
        distanceAlongWall: existing.distanceAlongWall.toString(),
      });
    }
  }, [existing]);

  // Calculate constraints based on wall side and module dimensions
  const constraints = useMemo(() => {
    const isHorizontalWall = form.wallSide === 1 || form.wallSide === 3;
    const maxWidthAlongWall = isHorizontalWall ? module.width : module.length;
    const maxLengthDepth = 3000; // Maximum reasonable balcony depth

    return {
      maxWidth: Math.round(maxWidthAlongWall),
      maxLength: Math.round(maxLengthDepth),
      maxDistance: Math.round(maxWidthAlongWall),
    };
  }, [module, form.wallSide]);

  // Helper function to validate grid snapping
  const validateGridSnap = (value: number, fieldName: string): string | null => {
    if (snapMode === 'grid' && gridSizeMm > 0) {
      if (value % gridSizeMm !== 0) {
        return `${fieldName} must be a multiple of ${gridSizeMm} mm (grid size)`;
      }
    }
    return null;
  };

  // Real-time validation
  useEffect(() => {
    const errors: typeof validationErrors = {};

    const widthValue = Math.round(parseInt(form.width) || 0);
    const lengthValue = Math.round(parseInt(form.length) || 0);
    const distanceValue = Math.round(parseInt(form.distanceAlongWall) || 0);

    // Validate width
    if (!form.width.trim() || isNaN(widthValue)) {
      errors.width = 'Width is required';
    } else if (widthValue <= 0) {
      errors.width = 'Width must be greater than 0';
    } else if (widthValue > constraints.maxWidth) {
      errors.width = `Width must be ≤${constraints.maxWidth} mm (module limit)`;
    } else {
      const gridError = validateGridSnap(widthValue, 'Width');
      if (gridError) {
        errors.width = gridError;
      }
    }

    // Validate length (depth)
    if (!form.length.trim() || isNaN(lengthValue)) {
      errors.length = 'Length is required';
    } else if (lengthValue <= 0) {
      errors.length = 'Length must be greater than 0';
    } else if (lengthValue > constraints.maxLength) {
      errors.length = `Length must be ≤${constraints.maxLength} mm`;
    } else {
      const gridError = validateGridSnap(lengthValue, 'Length');
      if (gridError) {
        errors.length = gridError;
      }
    }

    // Validate distance
    if (!form.distanceAlongWall.trim() || isNaN(distanceValue)) {
      errors.distanceAlongWall = 'Distance is required';
    } else if (distanceValue < 0) {
      errors.distanceAlongWall = 'Distance cannot be negative';
    } else if (distanceValue > constraints.maxDistance) {
      errors.distanceAlongWall = `Distance must be ≤${constraints.maxDistance} mm (module limit)`;
    } else if (!isNaN(widthValue) && distanceValue + widthValue > constraints.maxWidth) {
      errors.distanceAlongWall = `Distance + width (${distanceValue + widthValue} mm) exceeds module width (${constraints.maxWidth} mm)`;
    } else {
      const gridError = validateGridSnap(distanceValue, 'Distance');
      if (gridError) {
        errors.distanceAlongWall = gridError;
      }
    }

    setValidationErrors(errors);
  }, [form.width, form.length, form.distanceAlongWall, constraints, snapMode, gridSizeMm]);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // For numeric fields, ensure integer-only values
    if (field !== 'wallSide') {
      // Remove any decimal points and non-numeric characters except for empty string
      value = value.replace(/[^\d]/g, '');
    }

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onWallSideChange = (value: string | number) => {
    setForm(prev => ({ ...prev, wallSide: Number(value) as 1 | 2 | 3 | 4 }));
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleSubmit = () => {
    if (hasValidationErrors) return;

    const balconyData: Balcony = {
      id: existing?.id ?? `BC${Date.now()}`,
      moduleId: module.id,
      name: existing?.name ?? `BC${Date.now()}`,
      wallSide: form.wallSide,
      distanceAlongWall: Math.round(parseInt(form.distanceAlongWall)),
      width: Math.round(parseInt(form.width)),
      length: Math.round(parseInt(form.length)),
    };

    if (existing) {
      updateBalcony(balconyData.id, {
        wallSide: balconyData.wallSide,
        distanceAlongWall: Math.round(balconyData.distanceAlongWall),
        width: Math.round(balconyData.width),
        length: Math.round(balconyData.length),
        name: balconyData.name,
      });
    } else {
      addBalcony(balconyData);
    }

    onSave(balconyData);
  };

  // Wall side dropdown options
  const wallSideOptions: DropdownOption[] = [
    { value: 1, label: 'Top' },
    { value: 2, label: 'Right' },
    { value: 3, label: 'Bottom' },
    { value: 4, label: 'Left' },
  ];

  return (
    <Overlay>
      <Box>
        <MenuWrap>
          <MenuHeader>
            <Text weight={700} size={32}>
              {existing ? 'Edit balcony' : 'Add balcony'}
            </Text>
            <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onCancel} size={24} />
          </MenuHeader>
          <Divider orientation={'horizontal'} />
        </MenuWrap>

        <ContentWrapper>
          <ScrollContent>
            {/* Wall side */}
            <MenuItem>
              <Text weight={700} size={20}>
                Wall side
              </Text>
              <Text size={16} color="#64748b">
                Select wall side for balcony attachment
              </Text>
              <Dropdown
                options={wallSideOptions}
                value={form.wallSide}
                onChange={onWallSideChange}
                placeholder="Select wall side"
              />
              <Text size={14} color="#64748b">
                Module dimensions: {Math.round(module.width)} × {Math.round(module.length)} mm
              </Text>
            </MenuItem>

            {/* Divider */}
            <Divider orientation={'horizontal'} />

            {/* Dimensions */}
            <MenuItem>
              <Text weight={700} size={20}>
                Dimensions
              </Text>
              <Row>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Width along wall"
                    suffix="mm"
                    type="number"
                    step="1"
                    min="1"
                    value={form.width}
                    onChange={onChange('width')}
                    onBlur={e => {
                      const val = Math.max(1, Math.round(parseInt(e.target.value) || 1));
                      setForm(prev => ({ ...prev, width: val.toString() }));
                    }}
                    error={validationErrors.width}
                  />
                  {!validationErrors.width && <SuccessMessage>Maximum: {constraints.maxWidth} mm</SuccessMessage>}
                </div>
              </Row>
              <Row>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Length (depth)"
                    suffix="mm"
                    type="number"
                    step="1"
                    min="1"
                    value={form.length}
                    onChange={onChange('length')}
                    onBlur={e => {
                      const val = Math.max(1, Math.round(parseInt(e.target.value) || 1));
                      setForm(prev => ({ ...prev, length: val.toString() }));
                    }}
                    error={validationErrors.length}
                  />
                  {!validationErrors.length && <SuccessMessage>Maximum: {constraints.maxLength} mm</SuccessMessage>}
                </div>
              </Row>

              <Row>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Distance Along Wall"
                    suffix="mm"
                    type="number"
                    step="1"
                    min="0"
                    value={form.distanceAlongWall}
                    onChange={onChange('distanceAlongWall')}
                    onBlur={e => {
                      const val = Math.max(0, Math.round(parseInt(e.target.value) || 0));
                      setForm(prev => ({ ...prev, distanceAlongWall: val.toString() }));
                    }}
                    error={validationErrors.distanceAlongWall}
                  />
                  {!validationErrors.distanceAlongWall && (
                    <SuccessMessage>
                      Available space: {Math.max(0, constraints.maxDistance - Math.round(parseInt(form.width) || 0))} mm
                    </SuccessMessage>
                  )}
                </div>
              </Row>

              {/* Grid snapping notice */}
              {snapMode === 'grid' && (
                <Text size={14} color="#64748b">
                  Grid snapping is enabled. All dimensions must be multiples of {gridSizeMm} mm.
                </Text>
              )}
            </MenuItem>
          </ScrollContent>

          <Footer>
            <ButtonRow>
              <HalfWidthButton variant="danger" onClick={onCancel}>
                Cancel
              </HalfWidthButton>
              <HalfWidthButton
                variant="primary"
                icon={existing ? <LuSave size={20} /> : <LuPlus size={20} />}
                onClick={handleSubmit}
                disabled={hasValidationErrors}
              >
                {existing ? 'Save' : 'Add'}
              </HalfWidthButton>
            </ButtonRow>
          </Footer>
        </ContentWrapper>
      </Box>
    </Overlay>
  );
}
