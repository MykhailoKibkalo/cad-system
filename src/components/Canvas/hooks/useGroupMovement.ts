// src/components/Canvas/hooks/useGroupMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useFloorStore } from '@/state/floorStore';

export default function useGroupMovement(canvas: Canvas | null) {
  const updateGroup = useFloorStore(s => s.updateGroup);

  useEffect(() => {
    if (!canvas) return;

    const handler = (opt: any) => {
      const obj = opt.target as any;
      
      // Check if it's a group
      if (obj.type === 'group' && obj.isElementGroup && obj.groupId) {
        const groupId = obj.groupId;
        
        // Update group position in store
        updateGroup(groupId, {
          x: Math.round(obj.left || 0),
          y: Math.round(obj.top || 0),
        });
        
        console.log('🔧 Group position updated:', {
          groupId,
          x: Math.round(obj.left || 0),
          y: Math.round(obj.top || 0)
        });
      }
    };

    canvas.on('object:moving', handler);
    canvas.on('object:modified', handler);

    return () => {
      canvas.off('object:moving', handler);
      canvas.off('object:modified', handler);
    };
  }, [canvas, updateGroup]);
}