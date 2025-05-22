// src/components/Properties/BathroomPodProperties.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import type { Canvas } from 'fabric';
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

export default function BathroomPodProperties({ canvas }: { canvas: Canvas }) {
  const podId = useSelectionStore(s => s.selectedBathroomPodId)!;
  const pods = useObjectStore(s => s.bathroomPods);
  const updatePod = useObjectStore(s => s.updateBathroomPod);
  const deletePod = useObjectStore(s => s.deleteBathroomPod);
  const setSelPod = useSelectionStore(s => s.setSelectedBathroomPodId);

  const pod = useMemo(() => pods.find(p => p.id === podId)!, [pods, podId]);

  const [name, setName] = useState(pod.name);
  const [width, setWidth] = useState(pod.width);
  const [length, setLength] = useState(pod.length);
  const [xOffset, setXOffset] = useState(pod.x_offset);
  const [yOffset, setYOffset] = useState(pod.y_offset);
  const [type, setType] = useState(pod.type ?? 'F');

  // При зміні selectedPod оновлюємо форму
  useEffect(() => {
    setName(pod.name);
    setWidth(pod.width);
    setLength(pod.length);
    setXOffset(pod.x_offset);
    setYOffset(pod.y_offset);
    setType(pod.type ?? 'F');
  }, [pod]);

  const onSave = () => {
    updatePod(pod.id, {
      name,
      width,
      length,
      x_offset: xOffset,
      y_offset: yOffset,
      type,
    });
    canvas.requestRenderAll();
  };

  const onDelete = () => {
    // Видаляємо прямокутник із canvas
    canvas.getObjects().forEach(o => {
      if ((o as any).isBathroomPod === pod.id) {
        canvas.remove(o);
      }
    });
    canvas.requestRenderAll();
    deletePod(pod.id);
    setSelPod(null);
  };

  return (
    <Panel>
      <h3>Bathroom Pod Properties</h3>

      <Field>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </Field>

      <Field>
        <Label>Width (mm)</Label>
        <Input type="number" value={width} onChange={e => setWidth(parseFloat(e.target.value))} />
      </Field>

      <Field>
        <Label>Length (mm)</Label>
        <Input type="number" value={length} onChange={e => setLength(parseFloat(e.target.value))} />
      </Field>

      <Field>
        <Label>X-offset (mm)</Label>
        <Input type="number" value={xOffset} onChange={e => setXOffset(parseFloat(e.target.value))} />
      </Field>

      <Field>
        <Label>Y-offset (mm)</Label>
        <Input type="number" value={yOffset} onChange={e => setYOffset(parseFloat(e.target.value))} />
      </Field>

      <Field>
        <Label>Type</Label>
        <Input value={type} onChange={e => setType(e.target.value)} />
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
