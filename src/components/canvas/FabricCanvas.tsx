'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';
import { clearGrid, drawGrid } from './grid';
import { pxToMm, snapToGrid } from './units';
import { createModuleRect } from './module';

interface FabricCanvasProps {
  width: number;
  height: number;
  gridResolution: number;
  pixelsPerMm: number;
  showLowerFloor: boolean;
  floorIndex: number;
}

const FabricCanvas = ({
  width,
  height,
  gridResolution,
  pixelsPerMm,
  showLowerFloor,
  floorIndex,
}: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const activeFloorRef = useRef<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Get store values
  const {
    floors,
    activeFloorIndex,
    selectedModuleId,
    drawMode,
    snappingEnabled,
    setSelectedModuleId,
    addModule,
    updateModule,
    removeModule,
  } = useCadStore();

  const activeFloor = floors[activeFloorIndex];

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        selection: true,
        backgroundColor: '#ffffff',
      });

      fabricCanvasRef.current = canvas;

      // Center the canvas origin
      canvas.setViewportTransform([1, 0, 0, 1, width / 2, height / 2]);

      // Draw initial grid
      drawGrid(canvas, gridResolution, pixelsPerMm);

      // Get the active floor ID
      activeFloorRef.current = activeFloor.id;

      // Add the active floor's backdrop if it exists
      if (activeFloor.backdrop) {
        canvas.add(activeFloor.backdrop);
        activeFloor.backdrop.sendToBack();
      }

      // Initialize modules on canvas
      activeFloor.modules.forEach(module => {
        const moduleObj = createModuleRect(canvas, module, pixelsPerMm, module.id === selectedModuleId);
        canvas.add(moduleObj);
      });

      canvas.renderAll();

      // Set up event handlers
      setupCanvasEventHandlers(canvas);

      // Cleanup
      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [width, height, gridResolution, pixelsPerMm]);

  // Update the canvas when dimensions change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.setDimensions({ width, height });
      canvas.setViewportTransform([1, 0, 0, 1, width / 2, height / 2]);
      canvas.renderAll();
    }
  }, [width, height]);

  // Update grid when resolution changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      // Store references to the current objects (including backdrop)
      const objects = [...canvas.getObjects()];
      const nonGridObjects = objects.filter(obj => !obj.data?.type?.includes('grid'));

      // Clear grid
      clearGrid(canvas);

      // Draw new grid
      drawGrid(canvas, gridResolution, pixelsPerMm);

      // Make sure other objects stay on top of grid lines
      nonGridObjects.forEach(obj => {
        obj.bringToFront();
      });

      canvas.renderAll();
    }
  }, [gridResolution, pixelsPerMm]);

  // Update canvas when active floor or modules change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      // Remove all module objects
      const moduleObjects = canvas.getObjects().filter(obj => obj.data?.type === 'module');
      moduleObjects.forEach(obj => canvas.remove(obj));

      // Add modules for the active floor
      activeFloor.modules.forEach(module => {
        const moduleObj = createModuleRect(canvas, module, pixelsPerMm, module.id === selectedModuleId);
        canvas.add(moduleObj);
      });

      canvas.renderAll();
    }
  }, [activeFloor.modules, activeFloorIndex, selectedModuleId]);

  // Handle backdrop changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const { floors, activeFloorIndex } = useCadStore.getState();
    const activeFloor = floors[activeFloorIndex];

    if (canvas && activeFloor.backdrop) {
      // Remove any existing backdrops
      const existingBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'backdrop');
      existingBackdrops.forEach(obj => canvas.remove(obj));

      // Add the new backdrop
      canvas.add(activeFloor.backdrop);
      activeFloor.backdrop.sendToBack();
      canvas.renderAll();
    }
  }, [floorIndex]);

  // Handle showing lower floor backdrop
  useEffect(() => {
    const { floors } = useCadStore.getState();
    const canvas = fabricCanvasRef.current;

    if (canvas && floorIndex > 0 && showLowerFloor) {
      const lowerFloor = floors[floorIndex - 1];
      if (lowerFloor.backdrop) {
        // Remove any existing lower floor backdrops first
        const existingLowerBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'lowerFloorBackdrop');
        existingLowerBackdrops.forEach(obj => canvas.remove(obj));

        // Clone the backdrop using the callback pattern
        lowerFloor.backdrop.clone((clonedObj: fabric.Image) => {
          clonedObj.set({
            opacity: 0.3,
            selectable: false,
            evented: false,
          });

          // Add metadata
          clonedObj.data = { type: 'lowerFloorBackdrop' };

          // Add to canvas
          canvas.add(clonedObj);
          canvas.sendToBack(clonedObj);
          canvas.renderAll();
        });
      }
    } else if (canvas) {
      // Remove any existing lower floor backdrops
      const existingLowerBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'lowerFloorBackdrop');
      existingLowerBackdrops.forEach(obj => canvas.remove(obj));
      canvas.renderAll();
    }
  }, [floorIndex, showLowerFloor]);

  // Update draw mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      // Set cursor based on mode
      canvas.defaultCursor = drawMode ? 'crosshair' : 'default';

      // If exiting draw mode, cancel any in-progress drawing
      if (!drawMode && isDrawing) {
        setIsDrawing(false);
        setDrawStartPoint(null);

        // Remove any temporary drawing rectangle
        const tempRect = canvas.getObjects().find(obj => obj.data?.type === 'drawingRect');
        if (tempRect) {
          canvas.remove(tempRect);
          canvas.renderAll();
        }
      }
    }
  }, [drawMode, isDrawing]);

  // Add keyboard event listener for module deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedModuleId) {
        e.preventDefault();
        removeModule(activeFloor.id, selectedModuleId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFloor.id, selectedModuleId, removeModule]);

  // Set up canvas event handlers
  const setupCanvasEventHandlers = (canvas: fabric.Canvas) => {
    // Mouse down - start drawing or select module
    canvas.on('mouse:down', options => {
      if (drawMode) {
        setIsDrawing(true);

        // Get viewport point and convert to canvas coordinates
        const pointer = canvas.getPointer(options.e);
        setDrawStartPoint({ x: pointer.x, y: pointer.y });

        // Create a temporary rectangle for visual feedback during drawing
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(30, 144, 255, 0.1)',
          stroke: '#1e90ff',
          strokeWidth: 1,
          data: { type: 'drawingRect' },
          selectable: false,
        });

        canvas.add(rect);
        canvas.renderAll();
      } else {
        // Handle selection
        const target = options.target;
        if (target && target.data?.type === 'module') {
          setSelectedModuleId(target.moduleId || null);
        } else if (!target || target.data?.type !== 'module') {
          // Clicked on empty space or non-module object
          setSelectedModuleId(null);
        }
      }
    });

    // Mouse move - update drawing rectangle
    canvas.on('mouse:move', options => {
      if (drawMode && isDrawing && drawStartPoint) {
        const pointer = canvas.getPointer(options.e);

        // Find the temporary rectangle
        const rect = canvas.getObjects().find(obj => obj.data?.type === 'drawingRect') as fabric.Rect;

        if (rect) {
          // Calculate width and height
          const width = pointer.x - drawStartPoint.x;
          const height = pointer.y - drawStartPoint.y;

          // Update rectangle
          rect.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? drawStartPoint.x : pointer.x,
            top: height > 0 ? drawStartPoint.y : pointer.y,
          });

          canvas.renderAll();
        }
      }
    });

    // Mouse up - finish drawing module
    canvas.on('mouse:up', options => {
      if (drawMode && isDrawing && drawStartPoint) {
        const pointer = canvas.getPointer(options.e);

        // Find and remove the temporary rectangle
        const tempRect = canvas.getObjects().find(obj => obj.data?.type === 'drawingRect');
        if (tempRect) {
          canvas.remove(tempRect);
        }

        // Calculate dimensions
        const width = Math.abs(pointer.x - drawStartPoint.x);
        const height = Math.abs(pointer.y - drawStartPoint.y);

        // Minimum size check
        if (width < 10 || height < 10) {
          setIsDrawing(false);
          setDrawStartPoint(null);
          canvas.renderAll();
          return;
        }

        // Determine coordinates (always use bottom-left as origin)
        const x0 = pointer.x < drawStartPoint.x ? pointer.x : drawStartPoint.x;
        const y0 = pointer.y > drawStartPoint.y ? pointer.y : drawStartPoint.y;

        // Convert to mm with optional snapping
        const x0Mm = snappingEnabled ? snapToGrid(pxToMm(x0, pixelsPerMm)) : pxToMm(x0, pixelsPerMm);

        const y0Mm = snappingEnabled ? snapToGrid(pxToMm(y0, pixelsPerMm)) : pxToMm(y0, pixelsPerMm);

        const widthMm = snappingEnabled ? snapToGrid(pxToMm(width, pixelsPerMm)) : pxToMm(width, pixelsPerMm);

        const heightMm = snappingEnabled ? snapToGrid(pxToMm(height, pixelsPerMm)) : pxToMm(height, pixelsPerMm);

        // Determine if module is horizontal or vertical
        const isHorizontal = widthMm > heightMm;
        const rotation = isHorizontal ? 90 : 0;

        // Create module
        const fabricId = uuid();

        // Determine which dimension is length and which is width
        // Spec says floor beams run along short side
        const moduleWidth = Math.min(widthMm, heightMm);
        const moduleLength = Math.max(widthMm, heightMm);

        // Add module to store
        addModule(activeFloor.id, {
          width: moduleWidth,
          length: moduleLength,
          height: 2400, // Default height 2.4m
          x0: x0Mm,
          y0: y0Mm,
          rotation,
          floorBeamsDir: 'X', // Default beam direction
          fabricId,
        });

        // Reset drawing state
        setIsDrawing(false);
        setDrawStartPoint(null);

        // Keep draw mode active for multiple module creation
      }
    });

    // Object modified - update store with new position/size
    canvas.on('object:modified', options => {
      const modifiedObj = options.target;
      if (modifiedObj?.data?.type === 'module' && modifiedObj.moduleId) {
        const moduleId = modifiedObj.moduleId;

        // Get module dimensions
        const left = modifiedObj.left ?? 0;
        const top = modifiedObj.top ?? 0;
        const width = modifiedObj.width ?? 0;
        const height = modifiedObj.height ?? 0;
        const angle = modifiedObj.angle ?? 0;

        // Convert to mm with optional snapping
        const x0Mm = snappingEnabled ? snapToGrid(pxToMm(left, pixelsPerMm)) : pxToMm(left, pixelsPerMm);

        const y0Mm = snappingEnabled ? snapToGrid(pxToMm(top, pixelsPerMm)) : pxToMm(top, pixelsPerMm);

        const widthMm = snappingEnabled ? snapToGrid(pxToMm(width, pixelsPerMm)) : pxToMm(width, pixelsPerMm);

        const heightMm = snappingEnabled ? snapToGrid(pxToMm(height, pixelsPerMm)) : pxToMm(height, pixelsPerMm);

        // Update module in store
        updateModule(activeFloor.id, moduleId, {
          x0: x0Mm,
          y0: y0Mm,
          width: widthMm,
          length: heightMm,
          rotation: angle,
        });
      }
    });

    // Object moving - apply snapping
    canvas.on('object:moving', options => {
      if (!snappingEnabled) return;

      const movingObj = options.target;
      if (movingObj?.data?.type === 'module') {
        // Snap to grid
        const grid = 10 * pixelsPerMm; // 10mm grid in pixels

        movingObj.set({
          left: Math.round(movingObj.left! / grid) * grid,
          top: Math.round(movingObj.top! / grid) * grid,
        });

        // Snap to element with gap will be implemented here
        // (requires converting all modules to boundaries and checking distances)
      }
    });

    // Object scaling - apply snapping and update floor beams
    canvas.on('object:scaling', options => {
      if (!snappingEnabled) return;

      const scalingObj = options.target;
      if (scalingObj?.data?.type === 'module') {
        // Snap to grid
        const grid = 10 * pixelsPerMm; // 10mm grid in pixels

        const width = scalingObj.getScaledWidth();
        const height = scalingObj.getScaledHeight();

        const newWidth = Math.round(width / grid) * grid;
        const newHeight = Math.round(height / grid) * grid;

        // Directly apply scaled size to avoid compounding scale factors
        scalingObj.set({
          scaleX: newWidth / scalingObj.width!,
          scaleY: newHeight / scalingObj.height!,
        });
      }
    });
  };

  return <canvas ref={canvasRef} />;
};

export default FabricCanvas;
