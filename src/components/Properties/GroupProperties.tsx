// src/components/Properties/GroupProperties.tsx
'use client';

import React from 'react';
import styled from '@emotion/styled';
import type { Canvas } from 'fabric';

// Сторінка лівої панелі
const Panel = styled.div`
  padding: 16px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  height: 100%;
  overflow-y: auto;
`;
const Title = styled.h3`
  margin-top: 0;
`;
const Member = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;
const RemoveBtn = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
`;

interface Props {
  canvas: Canvas;
}

export default function GroupProperties({ canvas }: Props) {
  // Переконаємося, що зараз виділено групу
  const active = canvas.getActiveObject() as any;
  if (!active || active.type !== 'group') return null;

  // Масив об'єктів у групі
  const members = (active as any)._objects as any[];

  // Видаляємо один елемент із групи
  const removeFromGroup = (toRemove: any) => {
    // Перетворюємо групу у selection
    const selection = active.toActiveSelection() as any;
    canvas.requestRenderAll();

    // Фільтруємо з масиву _objects
    const remaining = selection._objects.filter((o: any) => o !== toRemove);

    // Видаляємо стару групу та знімаємо виділення
    active.destroy();
    canvas.discardActiveObject();

    // Якщо залишилось більше одного — створюємо нову групу
    if (remaining.length > 1) {
      const newGroup = new (canvas as any).fabric.Group(remaining, {
        left: active.left,
        top: active.top,
        angle: active.angle,
        originX: 'left',
        originY: 'top',
      });
      (newGroup as any).type = 'group';
      canvas.add(newGroup);
      canvas.setActiveObject(newGroup);
    } else if (remaining.length === 1) {
      // Якщо тільки один — просто виділяємо його
      canvas.add(remaining[0]);
      canvas.setActiveObject(remaining[0]);
    }

    canvas.requestRenderAll();
  };

  // Функція для побудови назви об’єкта
  const getLabel = (obj: any) => {
    if (obj.isModule) return `Module ${obj.isModule}`;
    if (obj.isCorridor) return `Corridor ${obj.isCorridor}`;
    if (obj.isBathroomPod) return `BathroomPod ${obj.isBathroomPod}`;
    if (obj.isOpening) return `Opening ${obj.isOpening}`;
    return 'Unknown';
  };

  return (
    <Panel>
      <Title>Group Members</Title>
      {members.map((obj, i) => (
        <Member key={i}>
          <span>{getLabel(obj)}</span>
          <RemoveBtn onClick={() => removeFromGroup(obj)}>Remove</RemoveBtn>
        </Member>
      ))}
    </Panel>
  );
}
