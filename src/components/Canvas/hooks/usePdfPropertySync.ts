// src/components/Canvas/hooks/usePdfPropertySync.ts
import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { useCurrentFloorPdfData } from './useFloorElements';

/**
 * Syncs PDF properties (opacity, lock state) to floor store
 * Avoids infinite loops by tracking previous values
 */
export default function usePdfPropertySync() {
  const pdfData = useCurrentFloorPdfData();
  const setActivePdfData = useFloorStore(s => s.setActivePdfData);
  const pdfImported = useCanvasStore(s => s.pdfImported);
  
  // Get current values from canvas store
  const canvasOpacity = useCanvasStore(s => s.pdfOpacity);
  const canvasLocked = useCanvasStore(s => s.pdfLocked);
  
  // Track previous values to avoid unnecessary updates
  const prevOpacityRef = useRef(canvasOpacity);
  const prevLockedRef = useRef(canvasLocked);
  
  useEffect(() => {
    // Only sync if we have a PDF imported and the data exists
    if (!pdfImported || !pdfData?.url) return;
    
    // Check if opacity changed
    const opacityChanged = Math.abs(prevOpacityRef.current - canvasOpacity) > 0.001;
    const lockedChanged = prevLockedRef.current !== canvasLocked;
    
    if (opacityChanged || lockedChanged) {
      // Update floor store with new properties
      setActivePdfData({
        ...pdfData,
        opacity: canvasOpacity,
        isLocked: canvasLocked,
      });
      
      // Update refs
      prevOpacityRef.current = canvasOpacity;
      prevLockedRef.current = canvasLocked;
    }
  }, [canvasOpacity, canvasLocked, pdfData, pdfImported, setActivePdfData]);
}