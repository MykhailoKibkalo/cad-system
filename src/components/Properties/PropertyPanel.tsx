// src/components/Properties/PropertyPanel.tsx
'use client';

import CorridorProperties from './CorridorProperties';
import OpeningEditor      from './OpeningEditor';
import ModuleProperties   from './ModuleProperties';
import { useSelectionStore } from '@/state/selectionStore';
import type { Canvas }      from 'fabric';

export default function PropertyPanel({ canvas }: { canvas: Canvas | null }) {
  const selMod      = useSelectionStore(s => s.selectedModuleId);
  const selOpen     = useSelectionStore(s => s.selectedOpeningId);
  const selCorridor = useSelectionStore(s => s.selectedCorridorId);

  if (selCorridor && canvas) {
    return <CorridorProperties canvas={canvas} />;
  }

  if (selOpen && selMod && canvas) {
    return (
        <OpeningEditor
            moduleId={selMod}
            openingId={selOpen}
            onClose={() => useSelectionStore.getState().setSelectedOpeningId(null)}
        />
    );
  }

  if (selMod && canvas) {
    return <ModuleProperties canvas={canvas} />;
  }

  return null;
}
