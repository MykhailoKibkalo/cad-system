// src/components/Properties/CorridorProperties.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Canvas } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

const Panel = styled.div`
  padding: 16px;
  background: white;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
`;

const Field = styled.div`
  margin-bottom: 8px;

  label {
    display: block;
    font-size: 12px;
    color: #555;
  }

  input {
    width: 100%;
    padding: 4px;
  }
`;

export default function CorridorProperties({ canvas }: { canvas: Canvas }) {
  // 1) read the selected corridor ID
  const selectedCorridorId = useSelectionStore(s => s.selectedCorridorId);
  const setSelectedCorridorId = useSelectionStore(s => s.setSelectedCorridorId);

  // 2) access corridors from your store
  const corridors = useObjectStore(s => s.corridors);
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const deleteCorridor = useObjectStore(s => s.deleteCorridor);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  // 3) find the current corridor object
  const corridor = useMemo(
    () => corridors.find(c => c.id === selectedCorridorId) ?? null,
    [corridors, selectedCorridorId]
  );

  // 4) local state for each field, sync when selection changes
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(0);
  const [x2, setX2] = useState(0);
  const [y2, setY2] = useState(0);
  const [floor, setFloor] = useState(1);

  useEffect(() => {
    if (corridor) {
      setX1(corridor.x1);
      setY1(corridor.y1);
      setX2(corridor.x2);
      setY2(corridor.y2);
      setFloor(corridor.floor);
    }
  }, [corridor]);

  if (!corridor) return null;

  // 5) save updates back to store
  const onSave = () => {
    updateCorridor(corridor.id, { x1, y1, x2, y2, floor });
    canvas.requestRenderAll();
  };

  // 6) delete corridor + clear selection
  const onDelete = () => {
    // remove from canvas
    canvas.getObjects().forEach(o => {
      if ((o as any).isCorridor === corridor.id) {
        canvas.remove(o);
      }
    });
    canvas.requestRenderAll();

    // delete in state & clear selection
    deleteCorridor(corridor.id);
    setSelectedCorridorId(null);
  };

  return (
    <Panel>
      <h4>Corridor Properties</h4>
      <Field>
        <label>X1 (mm)</label>
        <input type="number" value={x1} onChange={e => setX1(+e.target.value)} />
      </Field>
      <Field>
        <label>Y1 (mm)</label>
        <input type="number" value={y1} onChange={e => setY1(+e.target.value)} />
      </Field>
      <Field>
        <label>X2 (mm)</label>
        <input type="number" value={x2} onChange={e => setX2(+e.target.value)} />
      </Field>
      <Field>
        <label>Y2 (mm)</label>
        <input type="number" value={y2} onChange={e => setY2(+e.target.value)} />
      </Field>
      <Field>
        <label>Floor</label>
        <input type="number" min={1} value={floor} onChange={e => setFloor(+e.target.value)} />
      </Field>
      <button onClick={onSave}>Save</button>
      <button style={{ marginLeft: 8, background: '#ef4444', color: 'white' }} onClick={onDelete}>
        Delete
      </button>
    </Panel>
  );
}
