// src/components/Canvas/hooks/useRenderCorridors.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useRenderCorridors(canvas: Canvas | null) {
  const corridors = useObjectStore(s => s.corridors);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const floor = useCanvasStore(s => s.currentFloor);


  useEffect(() => {
    if (!canvas) return;
    // remove any old corridor objects
    canvas.getObjects().forEach(o => {
      if ((o as any).isCorridor) canvas.remove(o);
    });

    corridors.forEach(c => {
      if (c.floor !== floor) return;
      const left = c.x1 * scaleFactor;
      const top = c.y1 * scaleFactor;
      const width = (c.x2 - c.x1) * scaleFactor;
      const height = (c.y2 - c.y1) * scaleFactor;

      const rect = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: 'rgba(128,128,128,0.3)',
        stroke: '#666',
        strokeDashArray: [4, 4],

        // ← allow selection & dragging
        selectable: true,
        evented: true,

        // controls if you want to allow resizing too:
        hasControls: true,
        lockUniScaling: false,
      });

      // ← store the corridor’s ID, so movement‐hook can pick it up
      (rect as any).isCorridor = c.id;

      canvas.add(rect);
      // send it behind modules but above backgroundImage
      canvas.sendObjectToBack(rect);
    });

    canvas.requestRenderAll();
  }, [canvas, corridors, scaleFactor, floor]);
}
