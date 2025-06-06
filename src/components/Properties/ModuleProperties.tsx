'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import type { Canvas } from 'fabric';
import { Module } from '@/types/geometry';
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

export default function ModuleProperties({ canvas }: { canvas: Canvas }) {
  const moduleId = useSelectionStore(s => s.selectedModuleId)!;
  const modules = useObjectStore(s => s.modules);
  const openingsAll = useObjectStore(s => s.openings);
  const updateModule = useObjectStore(s => s.updateModule);
  const deleteModule = useObjectStore(s => s.deleteModule);
  const deleteOpening = useObjectStore(s => s.deleteOpening);
  const scale = useCanvasStore(s => s.scaleFactor);
  const setSelModule = useSelectionStore(s => s.setSelectedModuleId);
  const setSelOpening = useSelectionStore(s => s.setSelectedOpeningId);

  const module: Module = useMemo(() => modules.find(m => m.id === moduleId)!, [modules, moduleId]);
  const openings = useMemo(() => openingsAll.filter(o => o.moduleId === moduleId), [openingsAll, moduleId]);

  const [form, setForm] = useState({
    name: module.name,
    width: Math.round(module.width).toString(),
    length: Math.round(module.length).toString(),
    showBorder: !!module.showBorder,
  });

  useEffect(() => {
    setForm({
      name: module.name,
      width: Math.round(module.width).toString(),
      length: Math.round(module.length).toString(),
      showBorder: !!module.showBorder,
    });
  }, [module]);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val: any = e.target.value;

    if (field === 'showBorder') {
      val = e.target.checked;
      setForm(prev => ({ ...prev, [field]: val }));
      updateModule(module.id, { showBorder: val as boolean });
      const obj = canvas.getObjects().find(o => (o as any).isModule === module.id);
      obj?.set({ strokeWidth: val ? 2 : 0 });
      canvas.requestRenderAll();
      return;
    }

    if (field === 'name') {
      setForm(prev => ({ ...prev, [field]: val }));
      updateModule(module.id, { name: val as string });
      return;
    }

    // For numeric fields, ensure integer-only values
    val = val.replace(/[^\d]/g, ''); // Remove any decimal points and non-numeric characters
    setForm(prev => ({ ...prev, [field]: val }));

    const num = Math.round(parseInt(val) || 0);
    if (num > 0) {
      updateModule(module.id, { [field]: num } as any);
      const obj = canvas.getObjects().find(o => (o as any).isModule === module.id);
      if (obj) {
        if (field === 'width') obj.set({ width: Math.round(num * scale) });
        if (field === 'length') obj.set({ height: Math.round(num * scale) });
        obj.setCoords();
        canvas.requestRenderAll();
      }
    }
  };

  const onDeleteModule = () => {
    canvas.getObjects().forEach(o => {
      const anyO = o as any;
      if (anyO.isModule === module.id || (anyO.isOpening && anyO.moduleId === module.id)) {
        canvas.remove(o);
      }
    });
    canvas.requestRenderAll();
    deleteModule(module.id);
    setSelModule(null);
  };

  return (
    <Panel>
      <h3>Module Properties</h3>

      <Field>
        <Label>Name</Label>
        <Input value={form.name} onChange={onChange('name')} />
      </Field>

      <Field>
        <label>
          <input type="checkbox" checked={form.showBorder} onChange={onChange('showBorder')} /> Show Border
        </label>
      </Field>

      <Field>
        <Label>Width (mm)</Label>
        <Input
          type="number"
          step="1"
          min="1"
          value={form.width}
          onChange={onChange('width')}
          onBlur={e => {
            const val = Math.max(1, Math.round(parseInt(e.target.value) || 1));
            setForm(prev => ({ ...prev, width: val.toString() }));
            onChange('width')({ target: { value: val.toString() } } as any);
          }}
        />
      </Field>

      <Field>
        <Label>Length (mm)</Label>
        <Input
          type="number"
          step="1"
          min="1"
          value={form.length}
          onChange={onChange('length')}
          onBlur={e => {
            const val = Math.max(1, Math.round(parseInt(e.target.value) || 1));
            setForm(prev => ({ ...prev, length: val.toString() }));
            onChange('length')({ target: { value: val.toString() } } as any);
          }}
        />
      </Field>

      <h4>Openings</h4>
      {openings.map(o => (
        <div key={o.id} style={{ marginBottom: 8 }}>
          Side {o.wallSide}, dist {Math.round(o.distanceAlongWall)} mm, y {Math.round(o.yOffset)} mm
          <button style={{ marginLeft: 12 }} onClick={() => setSelOpening(o.id)}>
            Edit
          </button>
          <button
            style={{
              marginLeft: 6,
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 4,
            }}
            onClick={() => {
              deleteOpening(o.id);
              canvas.requestRenderAll();
            }}
          >
            Delete
          </button>
        </div>
      ))}
      <button onClick={() => setSelOpening('new')}>Add Opening</button>

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
    </Panel>
  );
}
