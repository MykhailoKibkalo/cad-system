// FILE: src/components/elements/BathroomPod.tsx
import { fabric } from 'fabric';
import { BathroomPod as BathroomPodType } from '@/types';

interface BathroomPodProps {
    pod: BathroomPodType;
    modulePosition: { x: number; y: number };
    moduleSize: { width: number; height: number };
    moduleRotation: number;
    canvas: fabric.Canvas;
}

export const createBathroomPod = (props: BathroomPodProps): fabric.Rect => {
    const { pod, modulePosition, moduleSize, moduleRotation, canvas } = props;

    // Calculate position based on module position and offsets
    // For unrotated module (0 degrees)
    let left = modulePosition.x + pod.xOffset;
    let top = modulePosition.y + pod.yOffset;

    // Handle rotation if module is rotated
    if (moduleRotation !== 0) {
        // Calculate the center of the module
        const moduleCenterX = modulePosition.x + moduleSize.width / 2;
        const moduleCenterY = modulePosition.y + moduleSize.height / 2;

        // Calculate the relative position of the pod from the module center
        const relativeX = pod.xOffset + pod.width / 2 - moduleSize.width / 2;
        const relativeY = pod.yOffset + pod.length / 2 - moduleSize.height / 2;

        // Apply rotation to relative position
        const rotationRad = (moduleRotation * Math.PI) / 180;
        const rotatedX = relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
        const rotatedY = relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);

        // Calculate final position
        left = moduleCenterX + rotatedX - pod.width / 2;
        top = moduleCenterY + rotatedY - pod.length / 2;
    }

    // Create the bathroom pod rectangle
    const rect = new fabric.Rect({
        left,
        top,
        width: pod.width,
        height: pod.length,
        fill: '#B0E0E6', // Light blue color for bathroom pods
        stroke: '#4682B4',
        strokeWidth: 1,
        angle: moduleRotation, // Same rotation as the module
        selectable: false, // Not directly selectable
        evented: false, // Doesn't receive events
    });

    // Add a text label for the pod type
    const text = new fabric.Text(pod.type, {
        left: left + pod.width / 2,
        top: top + pod.length / 2,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#000000',
        originX: 'center',
        originY: 'center',
        angle: moduleRotation,
        selectable: false,
        evented: false,
    });

    // Store data with bathroom pod
    rect.data = {
        type: 'bathroomPod',
        id: pod.id,
        moduleId: props.pod.id, // Reference to parent module
    };

    // Add to canvas
    canvas.add(rect);
    canvas.add(text);

    // Bathroom pods are inside modules, so bring to front
    canvas.bringToFront(rect);
    canvas.bringToFront(text);

    return rect;
};

export const updateBathroomPod = (
    canvas: fabric.Canvas,
    pod: BathroomPodType,
    modulePosition: { x: number; y: number },
    moduleSize: { width: number; height: number },
    moduleRotation: number
): void => {
    // Find existing bathroom pod objects
    const podObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'bathroomPod' && obj.data?.id === pod.id
    );

    // Remove existing pod objects
    podObjects.forEach(obj => canvas.remove(obj));

    // Create new bathroom pod with updated properties
    createBathroomPod({
        pod,
        modulePosition,
        moduleSize,
        moduleRotation,
        canvas,
    });

    canvas.renderAll();
};

export const removeBathroomPod = (
    canvas: fabric.Canvas,
    podId: string
): void => {
    // Find existing bathroom pod objects
    const podObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'bathroomPod' && obj.data?.id === podId
    );

    // Remove pod objects
    podObjects.forEach(obj => canvas.remove(obj));

    canvas.renderAll();
};
