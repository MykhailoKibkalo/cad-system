// FILE: src/components/elements/Corridor.tsx
import React from 'react';
import { fabric } from 'fabric';
import { Corridor as CorridorType } from '@/types';

interface CorridorProps {
    corridor: CorridorType;
    canvas: fabric.Canvas;
}

export const createCorridor = (props: CorridorProps): fabric.Rect => {
    const { corridor, canvas } = props;

    // Calculate width and height
    const width = Math.abs(corridor.position.x2 - corridor.position.x1);
    const height = Math.abs(corridor.position.y2 - corridor.position.y1);

    // Calculate position (always use top-left point)
    const left = Math.min(corridor.position.x1, corridor.position.x2);
    const top = Math.min(corridor.position.y1, corridor.position.y2);

    // Create the corridor rectangle
    const rect = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: '#E6E6FA', // Light lavender color for corridors
        stroke: '#9370DB',
        strokeWidth: 1,
        selectable: true,
        hasControls: true,
        transparentCorners: false,
        cornerColor: '#9370DB',
        cornerSize: 8,
        cornerStyle: 'circle',
    });

    // Add corridor name text
    const text = new fabric.Text(corridor.name, {
        left: left + width / 2,
        top: top + height / 2,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
    });

    // Store data with corridor
    rect.data = {
        type: 'corridor',
        id: corridor.id,
        floorId: corridor.floor.toString(),
    };

    // Add to canvas
    canvas.add(rect);
    canvas.add(text);

    // Corridors should be below modules, so send to back
    canvas.sendToBack(rect);

    // But the text should be visible
    canvas.bringForward(text);

    return rect;
};

export const updateCorridor = (
    canvas: fabric.Canvas,
    corridor: CorridorType
): void => {
    // Find existing corridor objects
    const corridorObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'corridor' && obj.data?.id === corridor.id
    );

    // Remove existing corridor objects
    corridorObjects.forEach(obj => canvas.remove(obj));

    // Create new corridor with updated properties
    createCorridor({
        corridor,
        canvas,
    });

    canvas.renderAll();
};

export const removeCorridor = (
    canvas: fabric.Canvas,
    corridorId: string
): void => {
    // Find existing corridor objects
    const corridorObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'corridor' && obj.data?.id === corridorId
    );

    // Remove corridor objects
    corridorObjects.forEach(obj => canvas.remove(obj));

    canvas.renderAll();
};
