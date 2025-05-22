// src/components/Canvas/CanvasContextMenu.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import styled from '@emotion/styled';

const Menu = styled.ul`
  position: absolute;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  padding: 4px 0;
  margin: 0;
  list-style: none;
  border-radius: 4px;
  z-index: 2000;
`;
const Item = styled.li`
  padding: 6px 16px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

interface Props {
  canvas: FabricCanvas | null;
}

export default function CanvasContextMenu({ canvas }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  }, []);

  const handleClickOutside = useCallback(() => {
    if (visible) setVisible(false);
  }, [visible]);

  useEffect(() => {
    if (!canvas) return;
    const el = canvas.upperCanvasEl as HTMLCanvasElement;
    const onMouseDownCapture = (e: MouseEvent) => {
      if (e.button === 2) {
        e.stopPropagation();
      }
    };
    el.addEventListener('mousedown', onMouseDownCapture, { capture: true });
    el.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('click', handleClickOutside);
    return () => {
      el.removeEventListener('mousedown', onMouseDownCapture, { capture: true });
      el.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('click', handleClickOutside);
    };
  }, [canvas, handleContextMenu, handleClickOutside]);

  const doGroup = () => {
    if (!canvas) return;
    const sel = canvas.getActiveObject() as any;
    if (sel?.type === 'activeSelection') {
      const grp = sel.toGroup();
      canvas.requestRenderAll();
      canvas.setActiveObject(grp);
    }
    setVisible(false);
  };

  const doUngroup = () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as any;
    if (obj?.type === 'group') {
      const sel = obj.toActiveSelection();
      canvas.requestRenderAll();
      canvas.setActiveObject(sel);
    }
    setVisible(false);
  };

  return visible ? (
    <Menu style={{ top: pos.y, left: pos.x }}>
      <Item onClick={doGroup}>Group</Item>
      <Item onClick={doUngroup}>Ungroup</Item>
    </Menu>
  ) : null;
}
