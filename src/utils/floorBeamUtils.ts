// FILE: src/utils/floorBeamUtils.ts
import { fabric } from 'fabric';
import { Module } from '@/types';

/**
 * Creates floor beam lines for a module with CC 600mm
 * Floor beams run along the short side by default (spec p.2, line 25)
 */
export const createFloorBeams = (
    canvas: fabric.Canvas,
    module: Module
): fabric.Line[] => {
    const beams: fabric.Line[] = [];

    // CC distance (center-to-center) is 600mm
    const ccDistance = 600; // 600mm (spec p.2, line 26)

    // Convert module dimensions to canvas scale
    const width = module.width;
    const height = module.height;
    const left = module.position.x;
    const top = module.position.y;

    // Determine which dimension is shorter for beam direction
    const isWidthShorter = width < height;
    const beamDirection = module.floorBeamDirection || (isWidthShorter ? 'short' : 'long');

    if (beamDirection === 'short' || (beamDirection === 'long' && isWidthShorter)) {
        // Beams run along width (vertical beams)
        const numBeams = Math.floor(width / ccDistance) + 1;

        for (let i = 0; i < numBeams; i++) {
            // Skip the first and last beams as they would be part of the module frame
            if (i === 0 || i === numBeams - 1) continue;

            const x = left + i * ccDistance;

            const beam = new fabric.Line([x, top, x, top + height], {
                stroke: '#999999',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
            });

            beam.data = {
                type: 'floorBeam',
                moduleId: module.id,
            };

            canvas.add(beam);
            beams.push(beam);
        }
    } else {
        // Beams run along height (horizontal beams)
        const numBeams = Math.floor(height / ccDistance) + 1;

        for (let i = 0; i < numBeams; i++) {
            // Skip the first and last beams as they would be part of the module frame
            if (i === 0 || i === numBeams - 1) continue;

            const y = top + i * ccDistance;

            const beam = new fabric.Line([left, y, left + width, y], {
                stroke: '#999999',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
            });

            beam.data = {
                type: 'floorBeam',
                moduleId: module.id,
            };

            canvas.add(beam);
            beams.push(beam);
        }
    }

    return beams;
};

/**
 * Updates floor beam positions when a module is moved or resized
 */
export const updateFloorBeams = (
    canvas: fabric.Canvas,
    module: Module
): void => {
    // Remove existing floor beams for this module
    removeFloorBeams(canvas, module.id);

    // Create new floor beams
    createFloorBeams(canvas, module);
};

/**
 * Removes floor beams for a specific module
 */
export const removeFloorBeams = (
    canvas: fabric.Canvas,
    moduleId: string
): void => {
    const beams = canvas.getObjects().filter(
        obj => obj.data?.type === 'floorBeam' && obj.data?.moduleId === moduleId
    );

    beams.forEach(beam => canvas.remove(beam));
};

/**
 * Shows or hides floor beams for all modules
 */
export const toggleFloorBeamsVisibility = (
    canvas: fabric.Canvas,
    visible: boolean
): void => {
    const beams = canvas.getObjects().filter(
        obj => obj.data?.type === 'floorBeam'
    );

    beams.forEach(beam => {
        beam.set({ visible });
    });

    canvas.renderAll();
};
