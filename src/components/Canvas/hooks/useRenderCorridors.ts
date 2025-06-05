// src/components/Canvas/hooks/useRenderCorridors.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorCorridors } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';

export default function useRenderCorridors(canvas: Canvas | null) {
  const corridors = useCurrentFloorCorridors();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;
    // Remove only individual corridor objects (not those inside groups)
    canvas.getObjects().forEach(o => {
      if ((o as any).isCorridor && !(o as any).group) {
        canvas.remove(o);
      }
    });

    corridors.forEach(c => {
      // Skip corridors that are part of a group
      if (c.isGrouped) {
        return;
      }
      // No need to filter by floor since corridors are already floor-specific

      // Ensure all calculations result in integers
      const left = Math.round(c.x1 * scaleFactor);
      const top = Math.round(c.y1 * scaleFactor);
      const width = Math.round((c.x2 - c.x1) * scaleFactor);
      const height = Math.round((c.y2 - c.y1) * scaleFactor);

      const rect = new fabric.Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
        fill: 'rgba(128,128,128,0.3)',
        stroke: '#666',
        strokeDashArray: [4, 4],
        selectable: true,
        evented: true,
        hasControls: true,
        lockUniScaling: false,
      });

      // ← store the corridor's ID, so movement‐hook can pick it up
      (rect as any).isCorridor = c.id;

      canvas.add(rect);
      // send it behind modules but above backgroundImage
      canvas.sendObjectToBack(rect);
    });

    canvas.requestRenderAll();
  }, [canvas, corridors, scaleFactor]);
}
