import { fabric } from 'fabric';
import { Module } from '@/types/cad';
import { mmToPx } from './units';

/**
 * Creates a Fabric rectangle representing a module with floor beams
 */
export const createModuleRect = (
    canvas: fabric.Canvas,
    module: Module,
    pixelsPerMm: number,
    selected: boolean = false
): fabric.Object => {
    // Convert mm to pixels
    const x = mmToPx(module.x0, pixelsPerMm);
    const y = mmToPx(module.y0, pixelsPerMm);
    const width = mmToPx(module.width, pixelsPerMm);
    const length = mmToPx(module.length, pixelsPerMm);

    // Create module container group
    const moduleGroup = new fabric.Group([], {
        left: x,
        top: y,
        width: width,
        height: length,
        originX: 'left',
        originY: 'bottom',
        angle: module.rotation,
        moduleId: module.id,
        id: module.fabricId,
        data: { type: 'module' },
        selectable: true,
        hasControls: true,
        hasBorders: true,
        transparentCorners: false,
        cornerColor: '#1e90ff',
        borderColor: '#1e90ff',
        cornerSize: 8,
        borderDashArray: selected ? [] : [5, 5],
        strokeWidth: selected ? 2 : 1,
    });

    // Create module outline
    const rect = new fabric.Rect({
        width: width,
        height: length,
        left: -width / 2,
        top: -length / 2,
        fill: 'rgba(30, 144, 255, 0.1)',
        stroke: '#1e90ff',
        strokeWidth: selected ? 2 : 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
    });

    // Create module name text
    const text = new fabric.Text(module.name, {
        left: 0,
        top: 0,
        fontSize: 14,
        fill: '#1e90ff',
        originX: 'center',
        originY: 'center',
        selectable: false,
    });

    // Add rect and text to group
    moduleGroup.addWithUpdate(rect);
    moduleGroup.addWithUpdate(text);

    // Create and add floor beams
    addFloorBeams(moduleGroup, module, width, length);

    return moduleGroup;
};

/**
 * Adds floor beam lines to a module group
 */
export const addFloorBeams = (
    moduleGroup: fabric.Group,
    module: Module,
    widthPx: number,
    lengthPx: number
): void => {
    // Remove existing beams
    const objects = moduleGroup.getObjects();
    const beams = objects.filter(obj => obj.data?.type === 'floorBeam');
    beams.forEach(beam => moduleGroup.remove(beam));

    // Determine beam direction and spacing
    const beamSpacing = 600; // 600mm beam spacing
    const isVertical = module.floorBeamsDir === 'Y';
    const beamLength = isVertical ? lengthPx : widthPx;
    const containerDimension = isVertical ? widthPx : lengthPx;

    // Calculate beam count
    const beamCount = Math.floor(containerDimension / mmToPx(beamSpacing, 3.78)) + 1;
    const spacing = containerDimension / (beamCount > 1 ? beamCount - 1 : 1);

    // Create beams
    for (let i = 0; i < beamCount; i++) {
        let beam;

        if (isVertical) {
            // Vertical beams (X direction)
            const x = (i * spacing) - (widthPx / 2);
            beam = new fabric.Line([
                x, -lengthPx / 2,
                x, lengthPx / 2
            ], {
                stroke: '#444',
                strokeWidth: 1,
                strokeDashArray: [3, 3],
                selectable: false,
                data: { type: 'floorBeam' }
            });
        } else {
            // Horizontal beams (Y direction)
            const y = (i * spacing) - (lengthPx / 2);
            beam = new fabric.Line([
                -widthPx / 2, y,
                widthPx / 2, y
            ], {
                stroke: '#444',
                strokeWidth: 1,
                strokeDashArray: [3, 3],
                selectable: false,
                data: { type: 'floorBeam' }
            });
        }

        moduleGroup.addWithUpdate(beam);
    }
};

/**
 * Updates an existing module's visual representation
 */
export const updateModuleVisual = (
    canvas: fabric.Canvas,
    module: Module,
    pixelsPerMm: number,
    selected: boolean = false
): void => {
    // Find existing module group
    const existingObject = canvas.getObjects().find(obj => obj.moduleId === module.id);

    if (existingObject) {
        canvas.remove(existingObject);
    }

    // Create new module visual
    const moduleObject = createModuleRect(canvas, module, pixelsPerMm, selected);
    canvas.add(moduleObject);
    canvas.renderAll();
};

/**
 * Checks if a module would collide with other modules
 * (with optional gap between modules)
 */
export const checkModuleCollision = (
    module: Module,
    allModules: Module[],
    gap: number = 0
): boolean => {
    // Skip collision check with itself
    const otherModules = allModules.filter(m => m.id !== module.id);

    // No other modules, no collision
    if (otherModules.length === 0) return false;

    // Simple bounding box check with gap
    for (const other of otherModules) {
        // Module 1 boundaries (with gap)
        const m1Left = module.x0 - gap;
        const m1Right = module.x0 + module.width + gap;
        const m1Top = module.y0 - module.length - gap;
        const m1Bottom = module.y0 + gap;

        // Module 2 boundaries
        const m2Left = other.x0;
        const m2Right = other.x0 + other.width;
        const m2Top = other.y0 - other.length;
        const m2Bottom = other.y0;

        // Simple AABB collision check
        // Note: This doesn't account for rotation yet!
        if (
            m1Left < m2Right &&
            m1Right > m2Left &&
            m1Top < m2Bottom &&
            m1Bottom > m2Top
        ) {
            return true; // Collision detected
        }
    }

    return false; // No collision
};
