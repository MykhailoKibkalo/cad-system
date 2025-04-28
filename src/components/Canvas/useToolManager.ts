'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';
import { snap } from '@/utils/snap';
import { createModule, createCorridor } from '@/utils/ModuleHelpers';
import { attachChild } from '@/utils/attachChild';
import { wallHit } from '@/utils/wallHit';
import { clampPodInside, placeOpening, snap10 } from '@/utils/geometry';

interface Point {
  x: number;
  y: number;
}

const useToolManager = (canvas: fabric.Canvas | null) => {
  const startPoint = useRef<Point | null>(null);
  const rubberBand = useRef<fabric.Rect | null>(null);
  const selectedWall = useRef<number>(0);

  const currentTool = useCadStore(state => state.currentTool);

  useEffect(() => {
    if (!canvas || !canvas.getObjects) return;

    // Clean up previous event listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('object:moving');
    canvas.off('object:rotating');
    canvas.off('object:scaling');
    canvas.off('object:scaled');

    // Get store actions
    const { setTool, incModuleCounter, incBalcony, incBathroom, incCorridor, setSelectedModule } = useCadStore.getState();

    // Add click-to-select handler
    canvas.on('mouse:down', e => {
      const tgt = canvas.findTarget(e.e as any,true);
      canvas.discardActiveObject(); // prevent accidental move

      if (tgt && tgt.data?.type === 'module' && tgt instanceof fabric.Group) {
        setSelectedModule(tgt.id);
        canvas.setActiveObject(tgt); // orange outline
        tgt.set({ stroke:'#ff8800', strokeWidth:3, strokeUniform:true, objectCaching:false });
      } else {
        setSelectedModule(null);
        canvas.getObjects().forEach(o => {
          if (o.data?.type === 'module') o.set({ stroke:'#333', strokeWidth:1 });
        });
      }
      canvas.requestRenderAll();
    });

    // Add ESC key handler to clear selection
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        setSelectedModule(null);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    });

    // Handle mouse down event
    const onMouseDown = (opt: fabric.IEvent<Event>) => {
      const pointer = canvas.getPointer(opt.e as any);
      const x = snap(pointer.x);
      const y = snap(pointer.y);

      switch (currentTool) {
        case 'draw-module':
          startPoint.current = { x, y };

          // Create rubber band
          rubberBand.current = new fabric.Rect({
            left: x,
            top: y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: '#333',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });

          canvas.add(rubberBand.current);
          break;

        case 'draw-corridor': // Handle corridor drawing
          startPoint.current = { x, y };

          // Create rubber band for corridor
          rubberBand.current = new fabric.Rect({
            left: x,
            top: y,
            width: 0,
            height: 0,
            fill: '#e0e0ff',
            stroke: '#0000ee',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });

          canvas.add(rubberBand.current);
          break;

        case 'draw-opening':
        case 'draw-balcony':
          // Get the selected module
          const parent = canvas.getObjects().find(o => (o as any).id === useCadStore.getState().selectedModuleId) as fabric.Group | undefined;
          if (!parent) {
            alert('Select a module first');
            return;
          }

          // Get the module rectangle (first object in group)
          const targetRect = parent._objects[0] as fabric.Rect;

          // Use wallHit to detect which wall was clicked
          const wall = wallHit(targetRect, { x, y });
          if (!wall) return; // require edge click

          selectedWall.current = wall;

          // Create rubber band for opening/balcony
          rubberBand.current = new fabric.Rect({
            left: x,
            top: y,
            width: 0,
            height: 0,
            fill: currentTool === 'draw-opening' ? '#cfe' : '#def',
            stroke: currentTool === 'draw-opening' ? '#333' : '#08f',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });

          canvas.add(rubberBand.current);
          startPoint.current = { x, y };
          break;

        case 'draw-bathroom':
          // Get the selected module
          const bathParent = canvas.getObjects().find(o => (o as any).id === useCadStore.getState().selectedModuleId) as fabric.Group | undefined;
          if (!bathParent) {
            alert('Select a module first');
            return;
          }

          // Get the module rectangle (first object in group)
          const bathTargetRect = bathParent._objects[0] as fabric.Rect;

          // Start point must be inside the module
          const moduleLeft = bathTargetRect.left! + bathParent.left!;
          const moduleTop = bathTargetRect.top! + bathParent.top!;
          const moduleWidth = bathTargetRect.width!;
          const moduleHeight = bathTargetRect.height!;

          if (x >= moduleLeft && x <= moduleLeft + moduleWidth && y >= moduleTop && y <= moduleTop + moduleHeight) {
            // Create rubber band for bathroom pod
            rubberBand.current = new fabric.Rect({
              left: x,
              top: y,
              width: 0,
              height: 0,
              fill: '#fff6cc',
              stroke: '#333',
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            });

            canvas.add(rubberBand.current);
            startPoint.current = { x, y };
          }
          break;
      }
    };

    // Handle mouse move event
    const onMouseMove = (opt: fabric.IEvent<Event>) => {
      if (!startPoint.current || !rubberBand.current) return;

      const pointer = canvas.getPointer(opt.e as any);
      let x = snap(pointer.x);
      let y = snap(pointer.y);

      switch (currentTool) {
        case 'draw-module':
        case 'draw-corridor': // Handle corridor similar to module
          // Update rubber band for module/corridor
          const width = Math.abs(x - startPoint.current.x);
          const height = Math.abs(y - startPoint.current.y);

          rubberBand.current.set({
            left: Math.min(startPoint.current.x, x),
            top: Math.min(startPoint.current.y, y),
            width: width,
            height: height,
          });
          break;

        case 'draw-opening':
        case 'draw-balcony':
        case 'draw-bathroom':
          // Shared rubber band sizing for all child components
          const dx = snap(pointer.x) - startPoint.current.x;
          const dy = snap(pointer.y) - startPoint.current.y;

          rubberBand.current.set({
            width: Math.abs(dx),
            height: Math.abs(dy),
            left: dx < 0 ? snap(pointer.x) : startPoint.current.x,
            top: dy < 0 ? snap(pointer.y) : startPoint.current.y,
          });
          break;
      }

      canvas.requestRenderAll();
    };

    // Handle mouse up event
    const onMouseUp = (opt: fabric.IEvent<Event>) => {
      if (!startPoint.current || !rubberBand.current) return;

      const pointer = canvas.getPointer(opt.e as any);
      const x = snap(pointer.x);
      const y = snap(pointer.y);

      switch (currentTool) {
        case 'draw-module':
          const width = Math.abs(x - startPoint.current.x);
          const height = Math.abs(y - startPoint.current.y);

          // Remove rubber band
          canvas.remove(rubberBand.current);

          // Create new module if dimensions are valid
          if (width >= 10 && height >= 10) {
            const moduleNumber = incModuleCounter();
            const moduleName = `M${moduleNumber}`;

            createModule(
                canvas,
                Math.min(startPoint.current.x, x),
                Math.min(startPoint.current.y, y),
                width,
                height,
                moduleName
            );
          }
          break;

        case 'draw-corridor':
          const corridorWidth = Math.abs(x - startPoint.current.x);
          const corridorHeight = Math.abs(y - startPoint.current.y);

          // Remove rubber band
          canvas.remove(rubberBand.current);

          // Create new corridor if dimensions are valid
          if (corridorWidth >= 10 && corridorHeight >= 10) {
            const corridorName = incCorridor();

            createCorridor(
                canvas,
                Math.min(startPoint.current.x, x),
                Math.min(startPoint.current.y, y),
                corridorWidth,
                corridorHeight,
                corridorName
            );
          }
          break;

        case 'draw-opening':
          // Get the selected module
          const openingParent = canvas.getObjects().find(o => (o as any).id === useCadStore.getState().selectedModuleId) as fabric.Group | undefined;
          if (!openingParent) {
            canvas.remove(rubberBand.current);
            break;
          }

          // Get module rectangle
          const targetRectOpening = openingParent._objects[0] as fabric.Rect;

          // Snap size & position
          rubberBand.current.set({
            width: snap10(rubberBand.current.width!),
            height: snap10(rubberBand.current.height!),
          });

          placeOpening(selectedWall.current as 1 | 2 | 3 | 4, targetRectOpening, rubberBand.current);

          // Now attach it to the module
          if (rubberBand.current.width! >= 10 && rubberBand.current.height! >= 10) {
            // Set opening data
            rubberBand.current.data = {
              type: 'opening',
              moduleId: openingParent.data.name,
              wallSide: selectedWall.current,
              width: rubberBand.current.width,
              height: rubberBand.current.height,
              distance: rubberBand.current.left! - targetRectOpening.left!,
              y_offset: selectedWall.current === 3 ? rubberBand.current.height : 0,
            };

            // Ensure it's on the root canvas before attaching
            canvas.add(rubberBand.current);
            attachChild(openingParent, rubberBand.current);

            // Don't remove the rubber band since it's now our opening
            rubberBand.current = null;
          } else {
            canvas.remove(rubberBand.current);
          }
          break;

        case 'draw-balcony':
          // Get the selected module
          const balconyParent = canvas.getObjects().find(o => (o as any).id === useCadStore.getState().selectedModuleId) as fabric.Group | undefined;
          if (!balconyParent) {
            canvas.remove(rubberBand.current);
            break;
          }

          // Get module rectangle
          const targetRectBalcony = balconyParent._objects[0] as fabric.Rect;

          // Snap size & position
          rubberBand.current.set({
            width: snap10(rubberBand.current.width!),
            height: snap10(rubberBand.current.height!),
          });

          placeOpening(selectedWall.current as 1 | 2 | 3 | 4, targetRectBalcony, rubberBand.current);

          // Now attach it to the module
          if (rubberBand.current.width! >= 10 && rubberBand.current.height! >= 10) {
            const balconyName = incBalcony();

            // Set balcony data
            rubberBand.current.data = {
              type: 'balcony',
              moduleId: balconyParent.data.name,
              wallSide: selectedWall.current,
              width: rubberBand.current.width,
              length: rubberBand.current.height,
              distance: rubberBand.current.left! - targetRectBalcony.left!,
              name: balconyName,
            };

            // Ensure it's on the root canvas before attaching
            canvas.add(rubberBand.current);
            attachChild(balconyParent, rubberBand.current);

            // Don't remove the rubber band since it's now our balcony
            rubberBand.current = null;
          } else {
            canvas.remove(rubberBand.current);
          }
          break;

        case 'draw-bathroom':
          // Get the selected module
          const bathroomParent = canvas.getObjects().find(o => (o as any).id === useCadStore.getState().selectedModuleId) as fabric.Group | undefined;
          if (!bathroomParent) {
            canvas.remove(rubberBand.current);
            break;
          }

          // Get module rectangle
          const targetRectBathroom = bathroomParent._objects[0] as fabric.Rect;

          // Snap size & position
          rubberBand.current.set({
            width: snap10(rubberBand.current.width!),
            height: snap10(rubberBand.current.height!),
          });

          clampPodInside(rubberBand.current, targetRectBathroom);

          // Now attach it to the module
          if (rubberBand.current.width! >= 10 && rubberBand.current.height! >= 10) {
            const bathroomId = incBathroom();

            // Set bathroom data
            rubberBand.current.data = {
              type: 'bathroom',
              moduleId: bathroomParent.data.name,
              width: rubberBand.current.width,
              length: rubberBand.current.height,
              x_offset: rubberBand.current.left! - targetRectBathroom.left!,
              y_offset: rubberBand.current.top! - targetRectBathroom.top!,
              id: bathroomId,
            };

            // Ensure it's on the root canvas before attaching
            canvas.add(rubberBand.current);
            attachChild(bathroomParent, rubberBand.current);

            // Don't remove the rubber band since it's now our bathroom pod
            rubberBand.current = null;
          } else {
            canvas.remove(rubberBand.current);
          }
          break;
      }

      // Reset state and switch to select tool
      startPoint.current = null;
      selectedWall.current = 0;
      canvas.requestRenderAll();
      setTool('select');
    };

    // Handle object moving for snapping
    const onObjectMoving = (opt: fabric.IEvent<Event>) => {
      if (!opt.target) return;

      const target = opt.target;

      // Snap all objects to grid
      if (target.left !== undefined) {
        target.set('left', snap(target.left));
      }
      if (target.top !== undefined) {
        target.set('top', snap(target.top));
      }

      // Special handling for components
      if (target.data) {
        switch (target.data.type) {
          case 'opening':
          case 'balcony':
            // Restrict movement to parent module wall
            const moduleId = target.data.moduleId;
            const wallSide = target.data.wallSide;

            const parentModule = canvas
                .getObjects()
                .find(obj => obj.data?.type === 'module' && obj.data?.name === moduleId);

            if (parentModule) {
              const moduleLeft = parentModule.left!;
              const moduleTop = parentModule.top!;
              const moduleWidth = parentModule.width!;
              const moduleHeight = parentModule.height!;

              switch (wallSide) {
                case 1: // Bottom wall
                  target.set({
                    left: snap(Math.max(moduleLeft, Math.min(moduleLeft + moduleWidth - target.width!, target.left!))),
                    top: moduleTop + moduleHeight - (target.data.type === 'opening' ? target.height! : 0),
                  });
                  break;
                case 2: // Right wall
                  target.set({
                    left: moduleLeft + moduleWidth - (target.data.type === 'opening' ? target.width! : 0),
                    top: snap(Math.max(moduleTop, Math.min(moduleTop + moduleHeight - target.height!, target.top!))),
                  });
                  break;
                case 3: // Top wall
                  target.set({
                    left: snap(Math.max(moduleLeft, Math.min(moduleLeft + moduleWidth - target.width!, target.left!))),
                    top: moduleTop - (target.data.type === 'balcony' ? target.height! : 0),
                  });
                  break;
                case 4: // Left wall
                  target.set({
                    left: moduleLeft - (target.data.type === 'balcony' ? target.width! : 0),
                    top: snap(Math.max(moduleTop, Math.min(moduleTop + moduleHeight - target.height!, target.top!))),
                  });
                  break;
              }

              // Update distance in data
              if (wallSide === 1 || wallSide === 3) {
                target.data.distance = target.left! - moduleLeft;
              } else {
                target.data.distance = target.top! - moduleTop;
              }

              // For balconies check intersection with other modules
              if (target.data.type === 'balcony') {
                // Check if this balcony intersects with any module (except its parent)
                const modules = canvas.getObjects().filter(
                    o => o.data?.type === 'module' && o.data?.name !== moduleId
                );

                // Store original position
                const originalLeft = target.left;
                const originalTop = target.top;

                // Check for intersection with any other module
                const intersects = modules.some(mod => {
                  const mLeft = mod.left!;
                  const mTop = mod.top!;
                  const mWidth = mod.width!;
                  const mHeight = mod.height!;

                  // Check for rectangle intersection
                  return (
                      target.left! < mLeft + mWidth &&
                      target.left! + target.width! > mLeft &&
                      target.top! < mTop + mHeight &&
                      target.top! + target.height! > mTop
                  );
                });

                // If intersecting, revert to previous valid position
                if (intersects) {
                  target.set({
                    left: originalLeft,
                    top: originalTop
                  });
                }
              }
            }
            break;

          case 'bathroom':
            // Restrict movement to inside parent module
            const bathModuleId = target.data.moduleId;

            const bathParentModule = canvas
                .getObjects()
                .find(obj => obj.data?.type === 'module' && obj.data?.name === bathModuleId);

            if (bathParentModule) {
              const bathModuleLeft = bathParentModule.left!;
              const bathModuleTop = bathParentModule.top!;
              const bathModuleWidth = bathParentModule.width!;
              const bathModuleHeight = bathParentModule.height!;

              // Constrain to module boundaries
              target.set({
                left: snap(
                    Math.max(bathModuleLeft, Math.min(bathModuleLeft + bathModuleWidth - target.width!, target.left!))
                ),
                top: snap(
                    Math.max(bathModuleTop, Math.min(bathModuleTop + bathModuleHeight - target.height!, target.top!))
                ),
              });

              // Update offsets in data
              target.data.x_offset = target.left! - bathModuleLeft;
              target.data.y_offset = target.top! - bathModuleTop;
            }
            break;

          case 'corridor':
            // Update data on movement
            target.data.x1 = target.left!;
            target.data.y1 = target.top!;
            target.data.x2 = target.left! + target.width!;
            target.data.y2 = target.top! + target.height!;
            target.data.direction = target.width! > target.height! ? 'horizontal' : 'vertical';
            break;
        }
      }
    };

    // Handle object rotating to ensure origin at bottom-left
    const onObjectRotating = (opt: fabric.IEvent<Event>) => {
      if (opt.target && opt.target.data?.type === 'module') {
        const target = opt.target;

        // Ensure rotation origin is bottom-left
        target.set({
          originX: 'left',
          originY: 'bottom',
        });

        // Update rotation in data
        target.data.rotation = target.angle;

        // Get the module's components (openings, bathrooms, balconies)
        const moduleId = target.data.name;
        const components = canvas.getObjects().filter(
            obj => obj.data &&
                ['opening', 'bathroom', 'balcony'].includes(obj.data.type) &&
                obj.data.moduleId === moduleId
        );

        // For each component, update its position based on the module's rotation
        components.forEach(comp => {
          if (comp.parentId === target.id) {
            // Update position based on parent's rotation
            // This will use the attachChild relationship to maintain proper positioning
            const parentMatrix = target.calcTransformMatrix();
            const localPoint = comp.getCenterPoint();
            const globalPoint = fabric.util.transformPoint(localPoint, parentMatrix);

            comp.set({
              left: globalPoint.x - comp.width!/2,
              top: globalPoint.y - comp.height!/2,
              angle: target.angle + (comp.data?.angle || 0)
            });
          }
        });
      }
    };

    // Handle object scaling to prevent label distortion
    const onObjectScaling = (opt: fabric.IEvent<Event>) => {
      if (opt.target && opt.target.data?.type === 'module' && opt.target instanceof fabric.Group) {
        const target = opt.target;
        const objects = target._objects;

        if (objects && objects.length >= 2) {
          const rect = objects[0] as fabric.Rect;
          const text = objects[1] as fabric.Text;

          if (rect && text) {
            // Maintain text scale inverse to rect scale to keep it undeformed
            text.set({
              scaleX: 1 / rect.scaleX!,
              scaleY: 1 / rect.scaleY!,
              fontSize: rect.width! < 60 || rect.height! < 60 ? 10 : 14,
            });
          }
        }
      }
    };

    // Handle when scaling is finished to snap size to grid
    const onObjectScaled = (opt: fabric.IEvent<Event>) => {
      if (opt.target && opt.target.data?.type === 'module' && opt.target instanceof fabric.Group) {
        const target = opt.target;
        const objects = target._objects;

        if (objects && objects.length >= 2) {
          const rect = objects[0] as fabric.Rect;

          if (rect) {
            // Snap dimensions to grid
            const newWidth = snap(rect.width! * rect.scaleX!);
            const newHeight = snap(rect.height! * rect.scaleY!);

            // Reset scale to 1 and set new dimensions
            rect.set({
              width: newWidth,
              height: newHeight,
              scaleX: 1,
              scaleY: 1,
            });

            // Update module metadata
            target.data.width = newWidth;
            target.data.length = newHeight;

            // Update text position
            const text = objects[1] as fabric.Text;
            if (text) {
              text.set({
                left: newWidth / 2,
                top: newHeight / 2,
                scaleX: 1,
                scaleY: 1,
                fontSize: newWidth < 60 || newHeight < 60 ? 10 : 14,
              });
            }

            target.setCoords();
          }
        }
      } else if (opt.target && opt.target.data?.type === 'corridor') {
        // Handle scaling of corridors
        const target = opt.target;
        const newWidth = snap(target.width! * target.scaleX!);
        const newHeight = snap(target.height! * target.scaleY!);

        // Reset scale to 1 and set new dimensions
        target.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1
        });

        // Update corridor metadata
        target.data.width = newWidth;
        target.data.height = newHeight;
        target.data.x1 = target.left!;
        target.data.y1 = target.top!;
        target.data.x2 = target.left! + newWidth;
        target.data.y2 = target.top! + newHeight;
        target.data.direction = newWidth > newHeight ? 'horizontal' : 'vertical';

        target.setCoords();
      } else if (opt.target && ['opening', 'bathroom', 'balcony'].includes(opt.target.data?.type)) {
        // Handle scaling of components
        const target = opt.target;
        const newWidth = snap10(target.width! * target.scaleX!);
        const newHeight = snap10(target.height! * target.scaleY!);

        // Reset scale to 1 and set new dimensions
        target.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1
        });

        // Update metadata
        if (target.data.type === 'opening') {
          target.data.width = newWidth;
          target.data.height = newHeight;
        } else if (target.data.type === 'bathroom') {
          target.data.width = newWidth;
          target.data.length = newHeight;
        } else if (target.data.type === 'balcony') {
          target.data.width = newWidth;
          target.data.length = newHeight;
        }

        target.setCoords();
      }
    };

    // Copy the selected object
    const copySelectedObject = () => {
      const activeObject = canvas.getActiveObject();

      if (activeObject) {
        // Clone the object
        activeObject.clone((cloned: fabric.Object) => {
          // Offset the cloned object
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
          });

          // Update metadata based on object type
          if (cloned.data) {
            switch (cloned.data.type) {
              case 'module':
                const moduleNumber = incModuleCounter();
                const moduleName = `M${moduleNumber}`;

                cloned.data.name = moduleName;

                // Update text if it's a group
                if (cloned instanceof fabric.Group) {
                  const textObject = cloned.getObjects().find(obj => obj instanceof fabric.Text) as fabric.Text;

                  if (textObject) {
                    textObject.set('text', moduleName);
                  }
                }
                break;

              case 'opening':
                // Nothing special for openings
                break;

              case 'balcony':
                const balconyName = incBalcony();
                cloned.data.name = balconyName;
                break;

              case 'bathroom':
                const bathroomId = incBathroom();
                cloned.data.id = bathroomId;
                break;

              case 'corridor':
                const corridorName = incCorridor();
                cloned.data.name = corridorName;

                // Update corridor coordinates
                cloned.data.x1 = cloned.left!;
                cloned.data.y1 = cloned.top!;
                cloned.data.x2 = cloned.left! + cloned.width!;
                cloned.data.y2 = cloned.top! + cloned.height!;
                break;
            }
          }

          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();
        });
      }

      // Reset to select tool
      setTool('select');
    };

    // Remove selected objects
    const removeSelectedObjects = () => {
      const activeObjects = canvas.getActiveObjects();

      if (activeObjects.length > 0) {
        canvas.remove(...activeObjects);
        canvas.requestRenderAll();
      }

      // Reset to select tool
      setTool('select');
    };

    // Set up tool handlers
    const setupToolHandlers = () => {
      // Handle copy tool
      if (currentTool === 'copy') {
        copySelectedObject();
      }

      // Handle remove tool
      if (currentTool === 'remove') {
        removeSelectedObjects();
      }
    };

    // Set up keyboard event handler for delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && document.activeElement === document.body) {
        // Only handle delete key if the canvas has focus
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          canvas.remove(...activeObjects);
          canvas.requestRenderAll();
        }
      }
    };

    // Register all event listeners
    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:moving', onObjectMoving);
    canvas.on('object:rotating', onObjectRotating);
    canvas.on('object:scaling', onObjectScaling);
    canvas.on('object:scaled', onObjectScaled);
    window.addEventListener('keydown', handleKeyDown);

    // Set up the tool handlers when the tool changes
    setupToolHandlers();

    // Initialize counters from existing objects when loading JSON
    const initializeCounters = () => {
      const objects = canvas.getObjects();
      let maxModule = 0;
      let maxOpening = 0;
      let maxBalcony = 0;
      let maxBathroom = 0;
      let maxCorridor = 0; // Added for corridor tracking

      objects.forEach(obj => {
        if (obj.data) {
          switch (obj.data.type) {
            case 'module':
              const moduleMatch = obj.data.name.match(/M\s*(\d+)/);
              if (moduleMatch && moduleMatch[1]) {
                const num = parseInt(moduleMatch[1], 10);
                if (num > maxModule) maxModule = num;
              }
              break;

            case 'opening':
              const openingMatch = obj.data.id?.match(/OP(\d+)/);
              if (openingMatch && openingMatch[1]) {
                const num = parseInt(openingMatch[1], 10);
                if (num > maxOpening) maxOpening = num;
              }
              break;

            case 'balcony':
              const balconyMatch = obj.data.name?.match(/BC(\d+)/);
              if (balconyMatch && balconyMatch[1]) {
                const num = parseInt(balconyMatch[1], 10);
                if (num > maxBalcony) maxBalcony = num;
              }
              break;

            case 'bathroom':
              // Bathrooms use letter IDs, no need to track
              break;

            case 'corridor':
              const corridorMatch = obj.data.name?.match(/C(\d+)/);
              if (corridorMatch && corridorMatch[1]) {
                const num = parseInt(corridorMatch[1], 10);
                if (num > maxCorridor) maxCorridor = num;
              }
              break;
          }
        }
      });

      // Update store with max counters
      const store = useCadStore.getState();
      if (maxModule > store.moduleCounter) {
        store.moduleCounter = maxModule;
      }
      if (maxOpening > store.openingCounter) {
        store.openingCounter = maxOpening;
      }
      if (maxBalcony > store.balconyCounter) {
        store.balconyCounter = maxBalcony;
      }
      if (maxCorridor > store.corridorCounter) {
        store.corridorCounter = maxCorridor;
      }
    };

    // Initialize counters when canvas is loaded
    canvas.on('after:render', initializeCounters);

    // Cleanup function
    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      canvas.off('object:moving', onObjectMoving);
      canvas.off('object:rotating', onObjectRotating);
      canvas.off('object:scaling', onObjectScaling);
      canvas.off('object:scaled', onObjectScaled);
      canvas.off('after:render', initializeCounters);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, currentTool]);

  return {};
};

export default useToolManager;
