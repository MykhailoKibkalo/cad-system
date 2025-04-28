// FILE: src/components/elements/Roof.tsx
import React from 'react';
import { fabric } from 'fabric';
import { Roof as RoofType } from '@/types';

interface RoofProps {
    roof: RoofType;
    canvas: fabric.Canvas;
}

export const createRoof = (props: RoofProps): fabric.Object => {
    const { roof, canvas } = props;

    // Calculate width and height
    const width = Math.abs(roof.position.x2 - roof.position.x1);
    const height = Math.abs(roof.position.y2 - roof.position.y1);

    // Calculate position (always use top-left point)
    const left = Math.min(roof.position.x1, roof.position.x2);
    const top = Math.min(roof.position.y1, roof.position.y2);

    let roofObject: fabric.Object;

    // Create different roof types
    switch (roof.type) {
        case 'Flat':
            // Flat roof is just a rectangle
            roofObject = new fabric.Rect({
                left,
                top,
                width,
                height,
                fill: '#A9A9A9', // Dark gray color for flat roofs
                stroke: '#696969',
                strokeWidth: 1,
            });
            break;

        case 'Mono-pitched':
            // Mono-pitched roof is a polygon
            // The ridge is higher on one side
            const points = roof.direction === 'horizontal'
                ? [
                    { x: 0, y: height },         // Bottom left
                    { x: width, y: height },     // Bottom right
                    { x: width, y: height/4 },   // Top right (higher)
                    { x: 0, y: height/2 },       // Top left (lower)
                ]
                : [
                    { x: 0, y: height },         // Bottom left
                    { x: width, y: height },     // Bottom right
                    { x: width, y: height/2 },   // Top right (lower)
                    { x: 0, y: height/4 },       // Top left (higher)
                ];

            roofObject = new fabric.Polygon(points, {
                left,
                top,
                fill: '#A9A9A9',
                stroke: '#696969',
                strokeWidth: 1,
            });
            break;

        case 'Gable':
            // Gable roof is a polygon with a peak in the middle
            const gablePoints = roof.direction === 'horizontal'
                ? [
                    { x: 0, y: height },         // Bottom left
                    { x: width, y: height },     // Bottom right
                    { x: width, y: height/3 },   // Middle right
                    { x: width/2, y: 0 },        // Peak (center top)
                    { x: 0, y: height/3 },       // Middle left
                ]
                : [
                    { x: 0, y: height },         // Bottom left
                    { x: width, y: height },     // Bottom right
                    { x: width, y: 0 },          // Top right
                    { x: width/2, y: height/4 }, // Peak (center)
                    { x: 0, y: 0 },              // Top left
                ];

            roofObject = new fabric.Polygon(gablePoints, {
                left,
                top,
                fill: '#A9A9A9',
                stroke: '#696969',
                strokeWidth: 1,
            });
            break;

        default:
            // Default to flat roof
            roofObject = new fabric.Rect({
                left,
                top,
                width,
                height,
                fill: '#A9A9A9',
                stroke: '#696969',
                strokeWidth: 1,
            });
    }

    // Make roof selectable and adjustable
    roofObject.set({
        selectable: true,
        hasControls: true,
        transparentCorners: false,
        cornerColor: '#696969',
        cornerSize: 8,
        cornerStyle: 'circle',
    });

    // Add roof name text
    const text = new fabric.Text(roof.name, {
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

    // Store data with roof
    roofObject.data = {
        type: 'roof',
        id: roof.id,
        roofType: roof.type,
        level: roof.level,
    };

    // Add to canvas
    canvas.add(roofObject);
    canvas.add(text);

    // Roofs should be above modules
    canvas.bringToFront(roofObject);
    canvas.bringToFront(text);

    return roofObject;
};

export const updateRoof = (
    canvas: fabric.Canvas,
    roof: RoofType
): void => {
    // Find existing roof objects
    const roofObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'roof' && obj.data?.id === roof.id
    );

    // Remove existing roof objects
    roofObjects.forEach(obj => canvas.remove(obj));

    // Create new roof with updated properties
    createRoof({
        roof,
        canvas,
    });

    canvas.renderAll();
};

export const removeRoof = (
    canvas: fabric.Canvas,
    roofId: string
): void => {
    // Find existing roof objects
    const roofObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'roof' && obj.data?.id === roofId
    );

    // Remove roof objects
    roofObjects.forEach(obj => canvas.remove(obj));

    canvas.renderAll();
};
