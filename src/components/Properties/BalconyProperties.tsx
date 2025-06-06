'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Canvas } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useCurrentFloorElements } from '../Canvas/hooks/useFloorElements';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/InputWithAffix';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuSave, LuTrash2 } from 'react-icons/lu';

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid #f1f5f9;
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
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

const ScrollContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
`;

const Footer = styled.div`
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #f1f5f9;
`;

const ButtonRow = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
`;

const HalfButton = styled(Button)`
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

export default function BalconyProperties({ canvas }: { canvas: Canvas }) {
  const balconyId = useSelectionStore(s => s.selectedBalconyId)!;
  const { balconies, modules } = useCurrentFloorElements();
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const deleteBalcony = useObjectStore(s => s.deleteBalcony);
  const setSelectedBalconyId = useSelectionStore(s => s.setSelectedBalconyId);
  const { snapMode, gridSizeMm } = useCanvasStore();

  const balcony = useMemo(() => balconies.find(b => b.id === balconyId), [balconies, balconyId]);
  const module = useMemo(() => modules.find(m => m.id === balcony?.moduleId), [modules, balcony]);



  const [form, setForm] = useState({
    name: balcony?.name || '',
    width: balcony ? Math.round(balcony.width).toString() : '0',
    length: balcony ? Math.round(balcony.length).toString() : '0',
    distanceAlongWall: balcony ? Math.round(balcony.distanceAlongWall).toString() : '0',
    wallSide: (balcony?.wallSide as 1 | 2 | 3 | 4) || 1,
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    width?: string;
    length?: string;
    distanceAlongWall?: string;
  }>({});

  useEffect(() => {
    if (balcony) {
      setForm({
        name: balcony.name,
        width: Math.round(balcony.width).toString(),
        length: Math.round(balcony.length).toString(),
        distanceAlongWall: Math.round(balcony.distanceAlongWall).toString(),
        wallSide: balcony.wallSide,
      });
    }
  }, [balcony]);



  // Calculate constraints based on wall side and module dimensions
  const constraints = useMemo(() => {
    if (!module) return { maxWidth: 0, maxLength: 0, maxDistance: 0 };

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

    // Validate length
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

  if (!balcony) {
    return null;
  }

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // For numeric fields, ensure integer-only values
    if (field !== 'name') {
      // Remove any decimal points and non-numeric characters except for empty string
      value = value.replace(/[^\d]/g, '');
    }

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onWallSideChange = (value: string | number) => {
    setForm(prev => ({ ...prev, wallSide: Number(value) as 1 | 2 | 3 | 4 }));
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const onSave = () => {
    if (hasValidationErrors) return;

    updateBalcony(balcony.id, {
      name: form.name,
      width: Math.round(parseInt(form.width)),
      length: Math.round(parseInt(form.length)),
      distanceAlongWall: Math.round(parseInt(form.distanceAlongWall)),
      wallSide: form.wallSide,
    });
    canvas.requestRenderAll();
  };

  const onDelete = () => {
    canvas.getObjects().forEach(o => {
      if ((o as any).isBalcony === balcony.id) canvas.remove(o);
    });
    canvas.requestRenderAll();
    deleteBalcony(balcony.id);
    setSelectedBalconyId(null);
  };

  const onClose = () => {
    setSelectedBalconyId(null);
  };

  const wallSideOptions: DropdownOption[] = [
    { value: 1, label: 'Top' },
    { value: 2, label: 'Right' },
    { value: 3, label: 'Bottom' },
    { value: 4, label: 'Left' },
  ];

  return (
    <Panel>
      {/* Fixed Header */}
      <MenuHeader>
        <Text weight={700} size={24}>
          Balcony Properties
        </Text>
        <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onClose} size={24} />
      </MenuHeader>

      {/* Scrollable Content */}
      <ScrollContent>
        <MenuItem>
          <Text weight={700} size={20}>
            Information
          </Text>
          <Input label="Name" value={form.name} onChange={onChange('name')} />
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            Wall Side
          </Text>
          <Dropdown
            options={wallSideOptions}
            value={form.wallSide}
            onChange={onWallSideChange}
            placeholder="Select wall side"
          />
          <Text size={14} color="#64748b">
            Module dimensions: {Math.round(module?.width || 0)} × {Math.round(module?.length || 0)} mm
          </Text>
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            Dimensions
          </Text>
          <Row>
            <div style={{ flex: 1 }}>
              <Input
                label="Width"
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
            <div style={{ flex: 1 }}>
              <Input
                label="Length"
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

          {/* Grid snapping notice */}
          {snapMode === 'grid' && (
            <Text size={14} color="#64748b">
              Grid snapping is enabled. All dimensions must be multiples of {gridSizeMm} mm.
            </Text>
          )}
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            Position
          </Text>
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
        </MenuItem>
      </ScrollContent>

      {/* Fixed Footer */}
      <Footer>
        <MenuItem>
          <ButtonRow>
            <HalfButton variant="danger" icon={<LuTrash2 size={18} />} onClick={onDelete}>
              Delete
            </HalfButton>
            <HalfButton variant="primary" icon={<LuSave size={18} />} onClick={onSave} disabled={hasValidationErrors}>
              Save
            </HalfButton>
          </ButtonRow>
        </MenuItem>
      </Footer>
    </Panel>
  );
}
