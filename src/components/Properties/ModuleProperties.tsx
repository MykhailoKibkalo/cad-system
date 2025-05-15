// src/components/Properties/ModuleProperties.tsx
'use client';

import { useMemo } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import type { Canvas } from 'fabric';

const Panel = styled.div`
  padding: 16px;
  background: #f9fafb;
  height: 100%;
  overflow-y: auto;
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

  const module = useMemo(() => modules.find(m => m.id === moduleId)!, [modules, moduleId]);
  const openings = useMemo(() => openingsAll.filter(o => o.moduleId === moduleId), [openingsAll, moduleId]);

  // ... тут форми і логіка exactly як раніше,
  // з useState/useEffect для синхронізації полів, кнопками Save/Delete,
  // + можливістю “Add Opening” через setSelOpening('new').

  // При завершенні видалення модулю — не забуваємо setSelModule(null).
}
