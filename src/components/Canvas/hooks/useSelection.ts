// src/components/Canvas/hooks/useSelection.ts
import { useEffect } from 'react';
import type { Canvas, Object as FabricObject } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';

export default function useSelection(canvas: Canvas | null) {
  const setSelModule = useSelectionStore(s => s.setSelectedModuleId);
  const setSelOpening = useSelectionStore(s => s.setSelectedOpeningId);
  const setSelCorridor = useSelectionStore(s => s.setSelectedCorridorId);

  useEffect(() => {
    if (!canvas) return;

    const onSelected = (opt: any) => {
      // якщо масив виділених об'єктів
      const objs: FabricObject[] = opt.selected ?? (opt.target ? [opt.target] : []);
      if (objs.length === 0) {
        setSelModule(null);
        setSelOpening(null);
        return;
      }
      const obj = objs[0] as any;


      if (obj.isOpening) {
        setSelOpening(obj.isOpening as string);
      } else if (obj.isModule) {
        console.log('set Module',obj.isModule);
        setSelModule(obj.isModule as string);
      } else if (obj.isCorridor) {
        setSelCorridor(obj.isCorridor as string);
      } else {
        setSelModule(null);
        setSelOpening(null);
        setSelCorridor(null);
      }
    };

    const onCleared = () => {
      setSelModule(null);
      setSelOpening(null);
    };

    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('selection:cleared', onCleared);

    return () => {
      canvas.off('selection:created', onSelected);
      canvas.off('selection:updated', onSelected);
      canvas.off('selection:cleared', onCleared);
    };
  }, [canvas, setSelModule, setSelOpening]);
}
