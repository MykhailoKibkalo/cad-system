// src/components/Properties/OpeningEditor.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useTemplateStore } from '@/state/templateStore';
import { Module } from '@/types/geometry';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Box = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: sans-serif;
`;

const Field = styled.div`
  margin-bottom: 12px;

  label {
    display: block;
    font-weight: 500;
    margin-bottom: 4px;
  }

  input,
  select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const Preview = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  margin: 16px 0;
`;

const OpeningMark = styled.div<{
  left: number;
  width: number;
  bottom: number;
  height: number;
}>`
  position: absolute;
  left: ${p => p.left}px;
  bottom: ${p => p.bottom}px;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  background: rgba(245, 158, 11, 0.6);
  border: 1px solid #d97706;
  pointer-events: none;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
  }

  .cancel {
    background: #e5e7eb;
    color: #374151;
  }

  .saveTpl {
    background: #10b981;
    color: white;
  }

  .add {
    background: #f59e0b;
    color: white;
  }
`;

interface OpeningEditorProps {
  moduleId: string;
  onClose: () => void;
  openingId?: string;
}

export default function OpeningEditor({ moduleId, onClose, openingId }: OpeningEditorProps) {
  const modules = useObjectStore(s => s.modules);
  const addOpening = useObjectStore(s => s.addOpening);
  const { floorHeightMm } = useCanvasStore();
  const { openingTemplates, addOpeningTemplate } = useTemplateStore();

  const updateOpening = useObjectStore(s => s.updateOpening);
  const deleteOpening = useObjectStore(s => s.deleteOpening);

  const module = useMemo<Module>(() => {
    const m = modules.find(m => m.id === moduleId);
    if (!m) throw new Error(`Module ${moduleId} not found`);
    return m;
  }, [modules, moduleId]);

  // local state
  const [tplIndex, setTplIndex] = useState<number | ''>('');
  const [wallSide, setWallSide] = useState<1 | 2 | 3 | 4>(1);
  const [distance, setDistance] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [width, setWidth] = useState(module.width / 2);
  const [height, setHeight] = useState(floorHeightMm / 2);

  // apply template
  useEffect(() => {
    if (tplIndex === '') return;
    const tpl = openingTemplates[tplIndex];
    if (!tpl) return;
    setWallSide(tpl.wallSide);
    setDistance(tpl.distanceAlongWall);
    setYOffset(tpl.yOffset);
    setWidth(tpl.width);
    setHeight(tpl.height);
  }, [tplIndex, openingTemplates]);

  // compute wall-length for horizontal vs vertical
  const isHorizontal = wallSide === 1 || wallSide === 3;
  const realLengthMm = isHorizontal ? module.width : module.length;

  // constraints
  const maxDistance = realLengthMm;
  const maxYOffset = floorHeightMm;
  const maxWidth = Math.max(0, realLengthMm - distance);
  const maxHeight = Math.max(0, floorHeightMm - yOffset);

  // preview measurements
  const previewRef = useRef<HTMLDivElement>(null);
  const [pw, setPw] = useState(0);
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    setPw(el.clientWidth);
    setPh(el.clientHeight);
    const ro = new ResizeObserver(es => {
      for (let e of es) {
        setPw(e.contentRect.width);
        setPh(e.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // scale: px per mm along wall, and vertical scale
  const pxPerMmX = pw / realLengthMm;
  const pxPerMmY = ph / floorHeightMm;

  const previewLeft = distance * pxPerMmX;
  const previewWidth = width * pxPerMmX;
  const previewBottom = yOffset * pxPerMmY;
  const previewHeight = height * pxPerMmY;

  const opening = openingId ? useObjectStore.getState().openings.find(o => o.id === openingId) : undefined;

  const onSubmit = () => {
    if (opening) {
      // режим редагування
      updateOpening(opening.id, {
        wallSide,
        distanceAlongWall: distance,
        yOffset,
        width,
        height,
      });
    } else {
      // режим створення
      const id = Date.now().toString();
      addOpening({ id, moduleId, wallSide, distanceAlongWall: distance, yOffset, width, height });
    }
    onClose();
  };

  const onSaveTpl = () => {
    addOpeningTemplate({
      wallSide,
      distanceAlongWall: distance,
      yOffset,
      width,
      height,
    });
  };

  return (
    <Overlay>
      <Box>
        <h3>New Opening</h3>

        <Field>
          <label>Template</label>
          <select value={tplIndex} onChange={e => setTplIndex(e.target.value === '' ? '' : +e.target.value)}>
            <option value="">— choose —</option>
            {openingTemplates.map((t, i) => (
              <option key={i} value={i}>
                tpl {i + 1}: w{t.width}×h{t.height}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <label>Wall side</label>
          <select value={wallSide} onChange={e => setWallSide(+e.target.value as 1 | 2 | 3 | 4)}>
            <option value={1}>Bottom</option>
            <option value={2}>Left</option>
            <option value={3}>Top</option>
            <option value={4}>Right</option>
          </select>
        </Field>

        <Preview ref={previewRef}>
          <OpeningMark left={previewLeft} width={previewWidth} bottom={previewBottom} height={previewHeight} />
        </Preview>

        <Field>
          <label>Distance along wall (mm)</label>
          <input
            type="number"
            min={0}
            max={maxDistance}
            value={distance}
            onChange={e => setDistance(Math.min(maxDistance, Math.max(0, +e.target.value)))}
          />
        </Field>

        <Field>
          <label>Y-offset (mm)</label>
          <input
            type="number"
            min={0}
            max={maxYOffset}
            value={yOffset}
            onChange={e => setYOffset(Math.min(maxYOffset, Math.max(0, +e.target.value)))}
          />
        </Field>

        <Field>
          <label>Width (mm)</label>
          <input
            type="number"
            min={1}
            max={maxWidth}
            value={width}
            onChange={e => setWidth(Math.min(maxWidth, Math.max(1, +e.target.value)))}
          />
        </Field>

        <Field>
          <label>Height (mm)</label>
          <input
            type="number"
            min={1}
            max={maxHeight}
            value={height}
            onChange={e => setHeight(Math.min(maxHeight, Math.max(1, +e.target.value)))}
          />
        </Field>

        <ButtonRow>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="saveTpl" onClick={onSaveTpl}>
            Save template
          </button>
          {opening && (
            <button
              className="delete"
              onClick={() => {
                deleteOpening(opening.id);
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button className={opening ? 'save' : 'add'} onClick={onSubmit}>
            {opening ? 'Save' : 'Add'}
          </button>
        </ButtonRow>
      </Box>
    </Overlay>
  );
}
