// src/components/Canvas/hooks/useSelection.ts
import { useEffect } from 'react';
import type { Canvas, Object as FabricObject } from 'fabric';
import { useSelectionStore } from '@/state/selectionStore';

export default function useSelection(canvas: Canvas | null) {
  const setSelModule = useSelectionStore(s => s.setSelectedModuleId);
  const setSelOpening = useSelectionStore(s => s.setSelectedOpeningId);
  const setSelCorridor = useSelectionStore(s => s.setSelectedCorridorId);
  const setSelBathroomPod = useSelectionStore(s => s.setSelectedBathroomPodId);
  const setSelBalcony = useSelectionStore(s => s.setSelectedBalconyId);
  const setSelectedObjectIds = useSelectionStore(s => s.setSelectedObjectIds);
  const setSelectedElements = useSelectionStore(s => s.setSelectedElements);

  useEffect(() => {
    if (!canvas) return;

    const onSelected = (opt: any) => {
      // Handle both single and multi-selection
      const objs: FabricObject[] = opt.selected ?? (opt.target ? [opt.target] : []);
      
      console.log('🎯 Selection event triggered with objects:', objs.length);
      
      if (objs.length === 0) {
        // Clear all selections
        setSelModule(null);
        setSelOpening(null);
        setSelCorridor(null);
        setSelBathroomPod(null);
        setSelBalcony(null);
        setSelectedObjectIds([]);
        setSelectedElements([]);
        return;
      }

      // Collect all object IDs and types for grouping functionality
      const selectedElements: Array<{id: string, type: 'module' | 'corridor' | 'balcony' | 'bathroomPod'}> = [];
      
      objs.forEach((obj: any, index: number) => {
        console.log(`🎯 Object ${index}:`, {
          type: obj.type,
          isModule: obj.isModule,
          isOpening: obj.isOpening,
          isCorridor: obj.isCorridor,
          isBathroomPod: obj.isBathroomPod,
          isBalcony: obj.isBalcony
        });
        
        if (obj.isModule) {
          selectedElements.push({ id: obj.isModule, type: 'module' });
        } else if (obj.isCorridor) {
          selectedElements.push({ id: obj.isCorridor, type: 'corridor' });
        } else if (obj.isBathroomPod) {
          selectedElements.push({ id: obj.isBathroomPod, type: 'bathroomPod' });
        } else if (obj.isBalcony) {
          selectedElements.push({ id: obj.isBalcony, type: 'balcony' });
        }
        // Note: We don't include openings in grouping
      });
      
      console.log('🎯 Collected elements:', selectedElements);
      
      // Update the multi-selection array for grouping
      setSelectedElements(selectedElements);

      // Handle single selection for property panels (existing behavior)
      if (objs.length === 1) {
        const obj = objs[0] as any;
        
        if (obj.isOpening) {
          setSelOpening(obj.isOpening as string);
        } else if (obj.isModule) {
          setSelModule(obj.isModule as string);
        } else if (obj.isCorridor) {
          setSelCorridor(obj.isCorridor as string);
        } else if (obj.isBathroomPod) {
          setSelBathroomPod(obj.isBathroomPod as string);
        } else if (obj.isBalcony) {
          setSelBalcony(obj.isBalcony as string);
        } else {
          // Clear single selections for unknown objects
          setSelModule(null);
          setSelOpening(null);
          setSelCorridor(null);
          setSelBathroomPod(null);
          setSelBalcony(null);
        }
      } else {
        // Multi-selection: clear single selections
        setSelModule(null);
        setSelOpening(null);
        setSelCorridor(null);
        setSelBathroomPod(null);
        setSelBalcony(null);
      }
    };

    const onCleared = () => {
      setSelModule(null);
      setSelOpening(null);
      setSelCorridor(null);
      setSelBathroomPod(null);
      setSelBalcony(null);
      setSelectedObjectIds([]);
      setSelectedElements([]);
    };

    console.log('🎯 Attaching selection listeners to canvas');
    
    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('selection:cleared', onCleared);

    return () => {
      console.log('🎯 Removing selection listeners from canvas');
      canvas.off('selection:created', onSelected);
      canvas.off('selection:updated', onSelected);
      canvas.off('selection:cleared', onCleared);
    };
  }, [canvas, setSelModule, setSelOpening, setSelCorridor, setSelBathroomPod, setSelBalcony, setSelectedObjectIds, setSelectedElements]);
}
