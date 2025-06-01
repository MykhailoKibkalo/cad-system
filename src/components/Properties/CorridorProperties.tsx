// src/components/Properties/CorridorProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import type { Canvas } from 'fabric';
import { Corridor } from '@/types/geometry';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuSave, LuTrash2 } from 'react-icons/lu';
import { Input } from '@/components/ui/InputWithAffix';

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

export default function CorridorProperties({ canvas }: { canvas: Canvas }) {
  const corridorId = useSelectionStore(s => s.selectedCorridorId)!;
  const corridors = useObjectStore(s => s.corridors);
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const deleteCorridor = useObjectStore(s => s.deleteCorridor);
  const scale = useCanvasStore(s => s.scaleFactor);
  const setSelCorridor = useSelectionStore(s => s.setSelectedCorridorId);

  const corridor: Corridor = useMemo(() => corridors.find(c => c.id === corridorId)!, [corridors, corridorId]);

  const [form, setForm] = useState({
    x1: Math.round(corridor.x1).toString(),
    y1: Math.round(corridor.y1).toString(),
    x2: Math.round(corridor.x2).toString(),
    y2: Math.round(corridor.y2).toString(),
    floor: corridor.floor.toString(),
  });

  useEffect(() => {
    setForm({
      x1: Math.round(corridor.x1).toString(),
      y1: Math.round(corridor.y1).toString(),
      x2: Math.round(corridor.x2).toString(),
      y2: Math.round(corridor.y2).toString(),
      floor: corridor.floor.toString(),
    });
  }, [corridor]);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove any decimal points and non-numeric characters except for empty string
    value = value.replace(/[^\d-]/g, ''); // Allow negative numbers for coordinates

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onSave = () => {
    const updates = {
      x1: Math.round(parseInt(form.x1) || 0),
      y1: Math.round(parseInt(form.y1) || 0),
      x2: Math.round(parseInt(form.x2) || 0),
      y2: Math.round(parseInt(form.y2) || 0),
      floor: Math.round(parseInt(form.floor) || 1),
    };

    updateCorridor(corridor.id, updates);
    canvas.requestRenderAll();
  };

  const onDelete = () => {
    canvas.getObjects().forEach(o => {
      if ((o as any).isCorridor === corridor.id) {
        canvas.remove(o);
      }
    });
    canvas.requestRenderAll();
    deleteCorridor(corridor.id);
    setSelCorridor(null);
  };

  const onClose = () => {
    setSelCorridor(null);
  };

  return (
    <Panel>
      {/* Fixed Header */}
      <MenuHeader>
        <Text weight={700} size={24}>
          Corridor Properties
        </Text>
        <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onClose} size={24} />
      </MenuHeader>

      {/* Scrollable Content */}
      <ScrollContent>
        <MenuItem>
          <Text weight={700} size={20}>
            Start Point
          </Text>
          <Row>
            <Input
              label="X1"
              suffix="mm"
              type="number"
              step="1"
              value={form.x1}
              onChange={onChange('x1')}
              onBlur={e => {
                const val = Math.round(parseInt(e.target.value) || 0);
                setForm(prev => ({ ...prev, x1: val.toString() }));
              }}
            />
            <Input
              label="Y1"
              suffix="mm"
              type="number"
              step="1"
              value={form.y1}
              onChange={onChange('y1')}
              onBlur={e => {
                const val = Math.round(parseInt(e.target.value) || 0);
                setForm(prev => ({ ...prev, y1: val.toString() }));
              }}
            />
          </Row>
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            End Point
          </Text>
          <Row>
            <Input
              label="X2"
              suffix="mm"
              type="number"
              step="1"
              value={form.x2}
              onChange={onChange('x2')}
              onBlur={e => {
                const val = Math.round(parseInt(e.target.value) || 0);
                setForm(prev => ({ ...prev, x2: val.toString() }));
              }}
            />
            <Input
              label="Y2"
              suffix="mm"
              type="number"
              step="1"
              value={form.y2}
              onChange={onChange('y2')}
              onBlur={e => {
                const val = Math.round(parseInt(e.target.value) || 0);
                setForm(prev => ({ ...prev, y2: val.toString() }));
              }}
            />
          </Row>
        </MenuItem>

        <Divider orientation="horizontal" />

        <MenuItem>
          <Text weight={700} size={20}>
            Details
          </Text>
          <Input
            label="Floor"
            type="number"
            step="1"
            min="1"
            value={form.floor}
            onChange={onChange('floor')}
            onBlur={e => {
              const val = Math.max(1, Math.round(parseInt(e.target.value) || 1));
              setForm(prev => ({ ...prev, floor: val.toString() }));
            }}
            inputWidth="120px"
          />
        </MenuItem>
      </ScrollContent>

      {/* Fixed Footer */}
      <Footer>
        <MenuItem>
          <ButtonRow>
            <HalfButton variant="danger" icon={<LuTrash2 size={18} />} onClick={onDelete}>
              Delete
            </HalfButton>
            <HalfButton variant="primary" icon={<LuSave size={18} />} onClick={onSave}>
              Save
            </HalfButton>
          </ButtonRow>
        </MenuItem>
      </Footer>
    </Panel>
  );
}
