// src/components/Properties/BathroomPodProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCurrentFloorElements } from '../Canvas/hooks/useFloorElements';
import type { Canvas } from 'fabric';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/InputWithAffix';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuSave, LuTrash2 } from 'react-icons/lu';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';

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

export default function BathroomPodProperties({ canvas }: { canvas: Canvas }) {
  const podId = useSelectionStore(s => s.selectedBathroomPodId)!;
  const { bathroomPods: pods, modules } = useCurrentFloorElements();
  const updatePod = useObjectStore(s => s.updateBathroomPod);
  const deletePod = useObjectStore(s => s.deleteBathroomPod);
  const setSelPod = useSelectionStore(s => s.setSelectedBathroomPodId);

  const pod = useMemo(() => pods.find(p => p.id === podId), [pods, podId]);
  const module = useMemo(() => modules.find(m => m.id === pod?.moduleId), [modules, pod]);

  if (!pod) {
    return null;
  }

  const [form, setForm] = useState({
    name: pod?.name || '',
    width: pod ? Math.round(pod.width).toString() : '0',
    length: pod ? Math.round(pod.length).toString() : '0',
    x_offset: pod ? Math.round(pod.x_offset).toString() : '0',
    y_offset: pod ? Math.round(pod.y_offset).toString() : '0',
    type: pod?.type ?? 'F',
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    width?: string;
    length?: string;
    x_offset?: string;
    y_offset?: string;
  }>({});

  useEffect(() => {
    if (pod) {
      setForm({
        name: pod.name,
        width: Math.round(pod.width).toString(),
        length: Math.round(pod.length).toString(),
        x_offset: Math.round(pod.x_offset).toString(),
        y_offset: Math.round(pod.y_offset).toString(),
        type: pod.type ?? 'F',
      });
    }
  }, [pod]);

  // Real-time validation
  useEffect(() => {
    if (!module) return;

    const errors: typeof validationErrors = {};

    const widthValue = Math.round(parseInt(form.width) || 0);
    const lengthValue = Math.round(parseInt(form.length) || 0);
    const xOffsetValue = Math.round(parseInt(form.x_offset) || 0);
    const yOffsetValue = Math.round(parseInt(form.y_offset) || 0);

    // Validate width
    if (isNaN(widthValue) || widthValue <= 0) {
      errors.width = 'Width must be greater than 0';
    } else if (widthValue > Math.round(module.width)) {
      errors.width = `Width must be ≤${Math.round(module.width)} mm`;
    }

    // Validate length
    if (isNaN(lengthValue) || lengthValue <= 0) {
      errors.length = 'Length must be greater than 0';
    } else if (lengthValue > Math.round(module.length)) {
      errors.length = `Length must be ≤${Math.round(module.length)} mm`;
    }

    // Validate x_offset
    if (isNaN(xOffsetValue) || xOffsetValue < 0) {
      errors.x_offset = 'X-offset cannot be negative';
    } else if (xOffsetValue + widthValue > Math.round(module.width)) {
      errors.x_offset = `X-offset + width must be ≤${Math.round(module.width)} mm`;
    }

    // Validate y_offset
    if (isNaN(yOffsetValue) || yOffsetValue < 0) {
      errors.y_offset = 'Y-offset cannot be negative';
    } else if (yOffsetValue + lengthValue > Math.round(module.length)) {
      errors.y_offset = `Y-offset + length must be ≤${Math.round(module.length)} mm`;
    }

    setValidationErrors(errors);
  }, [form.width, form.length, form.x_offset, form.y_offset, module]);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // For numeric fields, ensure integer-only values
    if (field !== 'name' && field !== 'type') {
      // Remove any decimal points and non-numeric characters except for empty string
      value = value.replace(/[^\d]/g, '');
    }

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onTypeChange = (value: string | number) => {
    setForm(prev => ({ ...prev, type: String(value) }));
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const onSave = () => {
    if (hasValidationErrors) return;

    updatePod(pod.id, {
      name: form.name,
      width: Math.round(parseInt(form.width)),
      length: Math.round(parseInt(form.length)),
      x_offset: Math.round(parseInt(form.x_offset)),
      y_offset: Math.round(parseInt(form.y_offset)),
      type: form.type,
    });
    canvas.requestRenderAll();
  };

  const onDelete = () => {
    canvas.getObjects().forEach(o => {
      if ((o as any).isBathroomPod === pod.id) {
        canvas.remove(o);
      }
    });
    canvas.requestRenderAll();
    deletePod(pod.id);
    setSelPod(null);
  };

  const onClose = () => {
    setSelPod(null);
  };

  const typeOptions: DropdownOption[] = [
    { value: 'F', label: 'Full Bathroom' },
    { value: 'H', label: 'Half Bathroom' },
    { value: 'S', label: 'Shower Only' },
    { value: 'T', label: 'Toilet Only' },
  ];

  if (!module) {
    return (
      <Panel>
        <MenuHeader>
          <Text weight={700} size={24}>
            Error
          </Text>
          <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onClose} size={24} />
        </MenuHeader>
        <MenuItem>
          <Text>Module not found for this bathroom pod.</Text>
        </MenuItem>
      </Panel>
    );
  }

  return (
    <Panel>
      {/* Fixed Header */}
      <MenuHeader>
        <Text weight={700} size={24}>
          Bathroom Pod Properties
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
          <Dropdown options={typeOptions} value={form.type} onChange={onTypeChange} placeholder="Select type" />
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
              {!validationErrors.width && <SuccessMessage>Maximum: {Math.round(module.width)} mm</SuccessMessage>}
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
              {!validationErrors.length && <SuccessMessage>Maximum: {Math.round(module.length)} mm</SuccessMessage>}
            </div>
          </Row>
          <Text size={14} color="#64748b">
            Module dimensions: {Math.round(module.width)} × {Math.round(module.length)} mm
          </Text>
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            Position
          </Text>
          <Row>
            <div style={{ flex: 1 }}>
              <Input
                label="X-offset"
                suffix="mm"
                type="number"
                step="1"
                min="0"
                value={form.x_offset}
                onChange={onChange('x_offset')}
                onBlur={e => {
                  const val = Math.max(0, Math.round(parseInt(e.target.value) || 0));
                  setForm(prev => ({ ...prev, x_offset: val.toString() }));
                }}
                error={validationErrors.x_offset}
              />
              {!validationErrors.x_offset && (
                <SuccessMessage>
                  Available: {Math.max(0, Math.round(module.width) - Math.round(parseInt(form.width) || 0))} mm
                </SuccessMessage>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Y-offset"
                suffix="mm"
                type="number"
                step="1"
                min="0"
                value={form.y_offset}
                onChange={onChange('y_offset')}
                onBlur={e => {
                  const val = Math.max(0, Math.round(parseInt(e.target.value) || 0));
                  setForm(prev => ({ ...prev, y_offset: val.toString() }));
                }}
                error={validationErrors.y_offset}
              />
              {!validationErrors.y_offset && (
                <SuccessMessage>
                  Available: {Math.max(0, Math.round(module.length) - Math.round(parseInt(form.length) || 0))} mm
                </SuccessMessage>
              )}
            </div>
          </Row>
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
