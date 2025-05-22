// src/components/Canvas/hooks/useIgnoreModulesFindTarget.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric'; // твій імпорт
import { useToolStore } from '@/state/toolStore';

export default function useIgnoreModulesFindTarget(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const origFindRef = useRef<any>(null);

  useEffect(() => {
    if (!canvas) return;

    // приведемо до any, щоб звертатися до findTarget
    const anyCanvas = canvas as any;

    // зберігаємо оригінальний метод один раз
    if (!origFindRef.current) {
      origFindRef.current = anyCanvas.findTarget;
    }
    const origFind = origFindRef.current;

    // створюємо оверрайд з будь-яким списком аргументів
    const override = (...args: any[]) => {
      const target = origFind.apply(anyCanvas, args);
      if (tool === 'bathroomPod' && (target as any)?.isModule) {
        return undefined;
      }
      return target;
    };

    anyCanvas.findTarget = override;

    return () => {
      // відновлюємо початковий метод
      anyCanvas.findTarget = origFind;
    };
  }, [canvas, tool]);
}
