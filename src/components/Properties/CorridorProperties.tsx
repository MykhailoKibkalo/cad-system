// src/components/Properties/CorridorProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import type { Canvas } from 'fabric';
import { Corridor } from '@/types/geometry';
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

export default function CorridorProperties({ canvas }: { canvas: Canvas }) {
  const corridorId = useSelectionStore(s => s.selectedCorridorId)!;
  const corridors = useObjectStore(s => s.corridors);
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const deleteCorridor = useObjectStore(s => s.deleteCorridor);
  const scale = useCanvasStore(s => s.scaleFactor);
  const setSelCorridor = useSelectionStore(s => s.setSelectedCorridorId);

  const corridor: Corridor = useMemo(() => corridors.find(c => c.id === corridorId)!, [corridors, corridorId]);

  const [x1, setX1] = useState(corridor.x1);
  const [y1, setY1] = useState(corridor.y1);
  const [x2, setX2] = useState(corridor.x2);
  const [y2, setY2] = useState(corridor.y2);
  const [floor, setFloor] = useState(corridor.floor);

  useEffect(() => {
    setX1(corridor.x1);
    setY1(corridor.y1);
    setX2(corridor.x2);
    setY2(corridor.y2);
    setFloor(corridor.floor);
  }, [corridor]);

  const onSave = () => {
    updateCorridor(corridor.id, { x1, y1, x2, y2, floor });
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

  return (
    <Panel>
      <h3>Corridor Properties</h3>

      <Field>
        <Label>X1 (mm)</Label>
        <Input type="number" value={x1} onChange={e => setX1(+e.target.value)} />
      </Field>
      <Field>
        <Label>Y1 (mm)</Label>
        <Input type="number" value={y1} onChange={e => setY1(+e.target.value)} />
      </Field>
      <Field>
        <Label>X2 (mm)</Label>
        <Input type="number" value={x2} onChange={e => setX2(+e.target.value)} />
      </Field>
      <Field>
        <Label>Y2 (mm)</Label>
        <Input type="number" value={y2} onChange={e => setY2(+e.target.value)} />
      </Field>
      <Field>
        <Label>Floor</Label>
        <Input type="number" min={1} value={floor} onChange={e => setFloor(+e.target.value)} />
      </Field>

      <button onClick={onSave}>Save</button>
      <button
        style={{
          marginLeft: 8,
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: 4,
        }}
        onClick={onDelete}
      >
        Delete
      </button>
    </Panel>
  );
}
