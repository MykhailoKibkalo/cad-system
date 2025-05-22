// src/components/Properties/BalconyProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Canvas } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import {Panel} from "@/components/ui/Panel";


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
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const deleteBalcony = useObjectStore(s => s.deleteBalcony);
  const setSelectedBalconyId = useSelectionStore(s => s.setSelectedBalconyId);

  const bc = useMemo(() => balconies.find(b => b.id === balconyId)!, [balconies, balconyId]);

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

  return (
    <Panel>
      <h3>Balcony Properties</h3>

      <Field>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field>
        <Label>Width (мм)</Label>
        <Input type="number" value={width} onChange={e => setWidth(+e.target.value)} />
      </Field>
      <Field>
        <Label>Length (мм)</Label>
        <Input type="number" value={length} onChange={e => setLength(+e.target.value)} />
      </Field>
      <Field>
        <Label>Distance Along Wall (мм)</Label>
        <Input type="number" value={distanceAlongWall} onChange={e => setDistance(+e.target.value)} />
      </Field>
      <Field>
        <Label>Wall Side</Label>
        <select value={wallSide} onChange={e => setWallSide(+e.target.value as 1 | 2 | 3 | 4)}>
          <option value={1}>Top (1)</option>
          <option value={2}>Right (2)</option>
          <option value={3}>Bottom (3)</option>
          <option value={4}>Left (4)</option>
        </select>
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
