// src/components/Properties/BalconyProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Canvas } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { Panel } from '@/components/ui/Panel';

const Field = styled.div`
  margin-bottom: 12px;
`;
const Label = styled.label`
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
`;
const Input = styled.input`
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;
const Select = styled.select`
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;
const Btn = styled.button`
  margin-top: 8px;
  margin-right: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default function BalconyProperties({ canvas }: { canvas: Canvas }) {
  const balconyId = useSelectionStore(s => s.selectedBalconyId)!;
  const balconies = useObjectStore(s => s.balconies);
  const modules = useObjectStore(s => s.modules);
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const deleteBalcony = useObjectStore(s => s.deleteBalcony);
  const setSelectedBalconyId = useSelectionStore(s => s.setSelectedBalconyId);

  const bc = useMemo(() => balconies.find(b => b.id === balconyId)!, [balconies, balconyId]);
  const module = useMemo(() => modules.find(m => m.id === bc?.moduleId), [modules, bc]);

  const [name, setName] = useState(bc.name);
  const [width, setWidth] = useState(bc.width);
  const [length, setLength] = useState(bc.length);
  const [distanceAlongWall, setDistance] = useState(bc.distanceAlongWall);
  const [wallSide, setWallSide] = useState<1 | 2 | 3 | 4>(bc.wallSide);

  useEffect(() => {
    setName(bc.name);
    setWidth(bc.width);
    setLength(bc.length);
    setDistance(bc.distanceAlongWall);
    setWallSide(bc.wallSide);
  }, [bc]);

  const onSave = () => {
    updateBalcony(bc.id, { name, width, length, distanceAlongWall, wallSide });
    canvas.requestRenderAll();
  };

  const onDelete = () => {
    canvas.getObjects().forEach(o => {
      if ((o as any).isBalcony === bc.id) canvas.remove(o);
    });
    canvas.requestRenderAll();
    deleteBalcony(bc.id);
    setSelectedBalconyId(null);
  };

  // Calculate constraints
  const maxDistanceAlongWall = module
    ? wallSide === 1 || wallSide === 3
      ? module.width - width
      : module.length - width
    : 0;

  return (
    <Panel>
      <h3>Balcony Properties</h3>

      <Field>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field>
        <Label>Width (mm)</Label>
        <Input type="number" value={width} min={10} onChange={e => setWidth(Math.max(10, +e.target.value))} />
      </Field>
      <Field>
        <Label>Length (mm)</Label>
        <Input type="number" value={length} min={10} onChange={e => setLength(Math.max(10, +e.target.value))} />
      </Field>
      <Field>
        <Label>Distance Along Wall (mm)</Label>
        <Input
          type="number"
          value={distanceAlongWall}
          min={0}
          max={maxDistanceAlongWall}
          onChange={e => setDistance(Math.max(0, Math.min(maxDistanceAlongWall, +e.target.value)))}
        />
      </Field>
      <Field>
        <Label>Wall Side</Label>
        <Select value={wallSide} onChange={e => setWallSide(+e.target.value as 1 | 2 | 3 | 4)}>
          <option value={1}>Top</option>
          <option value={2}>Right</option>
          <option value={3}>Bottom</option>
          <option value={4}>Left</option>
        </Select>
      </Field>

      <Btn style={{ background: '#3b82f6', color: '#fff' }} onClick={onSave}>
        Save
      </Btn>
      <Btn style={{ background: '#ef4444', color: '#fff' }} onClick={onDelete}>
        Delete
      </Btn>
    </Panel>
  );
}
