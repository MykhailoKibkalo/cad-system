// src/components/Properties/PropertyPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import OpeningEditor from './OpeningEditor';
import { Canvas } from 'fabric';
import CorridorProperties from "@/components/Properties/CorridorProperties";

const Panel = styled.div`
  position: absolute;
  right: 0;
  top: 56px;
  width: 540px;
  bottom: 0;
  background: #f9fafb;
  padding: 16px;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 1100;
`;
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

export default function PropertyPanel({ canvas }: { canvas: Canvas | null }) {
  const selectedModuleId = useSelectionStore(s => s.selectedModuleId);
  const selectedCorridorId = useSelectionStore(s => s.selectedCorridorId);
  const [adding, setAdding] = useState(false);
  const [editingOpeningId, setEditingOpeningId] = useState<string | null>(null);

  // Беремо тільки сирі масиви з боку
  const modules = useObjectStore(s => s.modules);
  const deleteModule = useObjectStore(s => s.deleteModule);
  const openingsAll = useObjectStore(s => s.openings);
  const deleteOpening = useObjectStore(s => s.deleteOpening);
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  console.log('modules: ',modules);
  console.log('selectedModuleId: ',selectedModuleId);

  // Мемоізовано вибраний модуль
  const module = useMemo(() => modules.find(m => m.id === selectedModuleId) ?? null, [modules, selectedModuleId]);
  // відкриття, що належать модулю
  const openings = useMemo(
    () => openingsAll.filter(o => o.moduleId === selectedModuleId),
    [openingsAll, selectedModuleId]
  );

  console.log('module: ',module);


  const [form, setForm] = useState({ name: '', width: '', length: '' });

  // Синхронізуємо форму при зміні module
  useEffect(() => {
    if (module) {
      setForm({
        name: module.name,
        width: module.width.toString(),
        length: module.length.toString(),
      });
    } else {
      setForm({ name: '', width: '', length: '' });
    }
  }, [module]);

  const onChange = (field: 'name' | 'width' | 'length' | 'showBorder') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm(f => ({ ...f, [field]: v }));
    if (!module) return;

    const updates: Partial<typeof module> = {};
    if (field === 'showBorder') {
      const show = e.target.checked;
      updateModule(module.id, { showBorder: show });
      // знайти rect і оновити
      const obj = canvas?.getObjects().find(o => (o as any).isModule === module.id);
      obj?.set({ strokeWidth: show ? 2 : 0 });
      canvas?.requestRenderAll();
      return;
    }
    if (field === 'name') {
      updates.name = v;
    } else {
      const num = parseFloat(v);
      if (isNaN(num)) return;
      updates[field] = num;
      // Знайти об’єкт на канвасі
      const obj = canvas?.getObjects().find(o => (o as any).isModule === module.id);
      if (obj) {
        if (field === 'width') obj.set({ width: num * scaleFactor });
        if (field === 'length') obj.set({ height: num * scaleFactor });
        obj.setCoords();
        canvas!.requestRenderAll();
      }
    }
    updateModule(module.id, updates);
  };

  const onDeleteModule = () => {
    if (module && module.id) {
      // 1) Видаляємо з canvas всі об’єкти, що належать модулю:
      canvas?.getObjects().forEach(o => {
        const anyO = o as any;
        if (anyO.isModule === module.id) {
          canvas.remove(o);
        }
        if (anyO.isOpening && anyO.moduleId === module.id) {
          canvas.remove(o);
        }
      });

      canvas?.requestRenderAll();

      // 2) Видаляємо зі стору модуль + каскадно — всі його openings
      deleteModule(module.id);
      // 3) Скидаємо selection
      useSelectionStore.getState().setSelectedModuleId(null);
    }
  };
  console.log(selectedCorridorId);
  if (selectedCorridorId && canvas) {
    return (
        <CorridorProperties canvas={canvas}/>
    )
  }

  if (editingOpeningId && selectedModuleId) {
    return (
      <OpeningEditor
        moduleId={selectedModuleId}
        openingId={editingOpeningId}
        onClose={() => setEditingOpeningId(null)}
      />
    );
  }


  if (!module) return null;

  return (
    <Panel>
      <h3>Module Properties</h3>
      <Field>
        <Label htmlFor="prop-name">Name</Label>
        <Input id="prop-name" value={form.name} onChange={onChange('name')} />
      </Field>

      <Field>
        <Label htmlFor="prop-showBorder">
          <input id="prop-showBorder" type="checkbox" checked={!!module.showBorder} onChange={onChange('showBorder')} />
          Show Border
        </Label>
      </Field>

      <Field>
        <Label htmlFor="prop-width">Width (mm)</Label>
        <Input id="prop-width" type="number" value={form.width} onChange={onChange('width')} />
      </Field>
      <Field>
        <Label htmlFor="prop-length">Length (mm)</Label>
        <Input id="prop-length" type="number" value={form.length} onChange={onChange('length')} />
      </Field>

      <h4>Openings</h4>
      <ul>
        {openings.map(o => (
          <li key={o.id} style={{ marginBottom: 8 }}>
            <span>
              Side {o.wallSide}, dist {o.distanceAlongWall} mm, y {o.yOffset} mm
            </span>
            <button
              style={{ marginLeft: 12 }}
              onClick={() => {
                setEditingOpeningId(o.id);
              }}
            >
              Edit
            </button>
            <button
              style={{
                marginLeft: 6,
                color: 'white',
                background: '#ef4444',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              onClick={() => {
                deleteOpening(o.id);
                // після видалення перемалювати полотно:
                canvas?.requestRenderAll();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setAdding(true)}>Add Opening</button>

      <div style={{ marginTop: 16, borderTop: '1px solid #ddd', paddingTop: 12 }}>
        <button
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '6px 12px',
            border: 'none',
            borderRadius: 4,
          }}
          onClick={onDeleteModule}
        >
          Delete Module
        </button>
      </div>
      {adding && <OpeningEditor moduleId={module.id} onClose={() => setAdding(false)} />}
    </Panel>
  );
}
