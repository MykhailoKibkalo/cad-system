// src/utils/dimensionUtils.ts
import { fabric } from 'fabric';

/**
 * Interface for dimension annotation options
 */
export interface DimensionOptions {
    showDimensions: boolean;
    unit?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: number;
    fadeIn?: boolean;
    margin?: number;
}

/**
 * Creates dimension annotations for a Fabric.js object
 */
export const createDimensionAnnotations = (
    canvas: fabric.Canvas,
    object: fabric.Object,
    options: DimensionOptions
): fabric.Group | null => {
    // If dimensions are disabled or object doesn't have dimensions, return null
    if (!options.showDimensions || !object.width || !object.height) {
        return null;
    }

    // Default options
    const unit = options.unit || 'px';
    const fontSize = options.fontSize || 12;
    const fontFamily = options.fontFamily || 'Arial';
    const color = options.color || '#333333';
    const backgroundColor = options.backgroundColor || 'rgba(255, 255, 255, 0.7)';
    const padding = options.padding || 5;
    const fadeIn = options.fadeIn !== undefined ? options.fadeIn : true;
    const margin = options.margin || 10;

    // Remove any existing dimension annotations for this object
    removeDimensionAnnotations(canvas, object.data?.id || '');

    // Get object dimensions
    const width = Math.round(object.getScaledWidth ? object.getScaledWidth() : object.width * (object.scaleX || 1));
    const height = Math.round(object.getScaledHeight ? object.getScaledHeight() : object.height * (object.scaleY || 1));

    // Get object position and boundaries
    const left = object.left || 0;
    const top = object.top || 0;
    const right = left + width;
    const bottom = top + height;

    // Check for nearby objects to avoid overlap
    const nearbyObjects = findNearbyObjects(canvas, object, margin);

    // Create elements array for the dimension group
    const elements: fabric.Object[] = [];

    // Width dimension - placed at the bottom by default
    const widthLabelText = `${width}${unit}`;
    const widthLabelLeft = left + width / 2 - 15; // Center label under the object
    let widthLabelTop = bottom + 5;
    let widthLineStart = left + width / 2;
    let widthLineEnd = left + width / 2;
    let widthLineY1 = bottom;
    let widthLineY2 = bottom + 15;

    if (nearbyObjects.bottom) {
        // If there's an object below, place label on top
        widthLabelTop = top - 25;
        widthLineY1 = top;
        widthLineY2 = top - 15;
    }

    // Create width dimension line (vertical line)
    const widthLine = new fabric.Line([widthLineStart, widthLineY1, widthLineEnd, widthLineY2], {
        stroke: color,
        strokeWidth: 1,
        selectable: false,
        evented: false,
    });

    // Create width label
    const widthLabel = new fabric.Text(widthLabelText, {
        left: widthLabelLeft,
        top: widthLabelTop,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: color,
        backgroundColor: backgroundColor,
        padding: padding,
        selectable: false,
        evented: false,
    });

    elements.push(widthLine, widthLabel);

    // Height dimension - placed on the right by default
    const heightLabelText = `${height}${unit}`;
    let heightLabelLeft = right + 5;
    const heightLabelTop = top + height / 2 - fontSize / 2; // Center label beside the object
    let heightLineStart = right;
    let heightLineEnd = right + 15;

    if (nearbyObjects.right) {
        // If there's an object on the right, place label on left
        heightLabelLeft = left - 40;
        heightLineStart = left;
        heightLineEnd = left - 15;
    }

    // Create height dimension line (horizontal line)
    const heightLine = new fabric.Line([heightLineStart, top + height / 2, heightLineEnd, top + height / 2], {
        stroke: color,
        strokeWidth: 1,
        selectable: false,
        evented: false,
    });

    // Create height label
    const heightLabel = new fabric.Text(heightLabelText, {
        left: heightLabelLeft,
        top: heightLabelTop,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: color,
        backgroundColor: backgroundColor,
        padding: padding,
        selectable: false,
        evented: false,
    });

    elements.push(heightLine, heightLabel);

    // Add extension lines connecting to the object
    // Width extension lines (bottom)
    if (!nearbyObjects.bottom) {
        const leftWidthExtLine = new fabric.Line([left, bottom, left, bottom + 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        const rightWidthExtLine = new fabric.Line([right, bottom, right, bottom + 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        elements.push(leftWidthExtLine, rightWidthExtLine);
    } else {
        // Width extension lines (top)
        const leftWidthExtLine = new fabric.Line([left, top, left, top - 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        const rightWidthExtLine = new fabric.Line([right, top, right, top - 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        elements.push(leftWidthExtLine, rightWidthExtLine);
    }

    // Height extension lines (right)
    if (!nearbyObjects.right) {
        const topHeightExtLine = new fabric.Line([right, top, right + 5, top], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        const bottomHeightExtLine = new fabric.Line([right, bottom, right + 5, bottom], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        elements.push(topHeightExtLine, bottomHeightExtLine);
    } else {
        // Height extension lines (left)
        const topHeightExtLine = new fabric.Line([left, top, left - 5, top], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        const bottomHeightExtLine = new fabric.Line([left, bottom, left - 5, bottom], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        elements.push(topHeightExtLine, bottomHeightExtLine);
    }

    // Add dimension lines connecting the extension lines
    // Width dimension line (horizontal line at bottom or top)
    const widthDimLine = !nearbyObjects.bottom
        ? new fabric.Line([left, bottom + 5, right, bottom + 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        })
        : new fabric.Line([left, top - 5, right, top - 5], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

    // Height dimension line (vertical line at right or left)
    const heightDimLine = !nearbyObjects.right
        ? new fabric.Line([right + 5, top, right + 5, bottom], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        })
        : new fabric.Line([left - 5, top, left - 5, bottom], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

    elements.push(widthDimLine, heightDimLine);

    // Create a group for all dimension elements
    const dimensionGroup = new fabric.Group(elements, {
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        originX: 'left',
        originY: 'top',
    });

    // Store reference to the object ID in the dimension group
    dimensionGroup.data = {
        type: 'dimensionAnnotation',
        objectId: object.data?.id || '',
    };

    // Apply fade-in effect if requested
    if (fadeIn) {
        dimensionGroup.opacity = 0;
        canvas.add(dimensionGroup);
        animateFadeIn(dimensionGroup, canvas);
    } else {
        canvas.add(dimensionGroup);
    }

    canvas.renderAll();
    return dimensionGroup;
};

/**
 * Animate fade-in effect for dimension annotations
 */
const animateFadeIn = (object: fabric.Object, canvas: fabric.Canvas) => {
    let opacity = 0;
    const fadeStep = 0.1;

    const animate = () => {
        opacity += fadeStep;
        object.opacity = opacity;
        canvas.renderAll();

        if (opacity < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
};

/**
 * Animate fade-out effect for dimension annotations
 */
export const animateFadeOut = (object: fabric.Object, canvas: fabric.Canvas, callback?: () => void) => {
    let opacity = object.opacity || 1;
    const fadeStep = 0.1;

    const animate = () => {
        opacity -= fadeStep;
        object.opacity = opacity;
        canvas.renderAll();

        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    };

    requestAnimationFrame(animate);
};

/**
 * Removes dimension annotations for a specific object
 */
export const removeDimensionAnnotations = (
    canvas: fabric.Canvas,
    objectId: string
): void => {
    if (!canvas) return;

    // Find dimension annotations for this object
    const dimensionObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'dimensionAnnotation' && obj.data?.objectId === objectId
    );

    // Remove them
    dimensionObjects.forEach(obj => {
        canvas.remove(obj);
    });

    canvas.renderAll();
};

/**
 * Removes all dimension annotations from canvas
 */
export const removeAllDimensionAnnotations = (
    canvas: fabric.Canvas,
    withFadeOut: boolean = false
): void => {
    if (!canvas) return;

    // Find all dimension annotations
    const dimensionObjects = canvas.getObjects().filter(
        obj => obj.data?.type === 'dimensionAnnotation'
    );

    if (withFadeOut) {
        // Remove with fade-out animation
        dimensionObjects.forEach(obj => {
            animateFadeOut(obj, canvas, () => {
                canvas.remove(obj);
                canvas.renderAll();
            });
        });
    } else {
        // Remove immediately
        dimensionObjects.forEach(obj => {
            canvas.remove(obj);
        });
        canvas.renderAll();
    }
};

/**
 * Updates the position of dimension annotations for an object
 */
export const updateDimensionAnnotations = (
    canvas: fabric.Canvas,
    object: fabric.Object,
    options: DimensionOptions
): void => {
    if (!canvas || !object) return;

    // Remove existing annotations and create new ones
    removeDimensionAnnotations(canvas, object.data?.id || '');

    if (options.showDimensions) {
        createDimensionAnnotations(canvas, object, {
            ...options,
            fadeIn: false, // Don't fade in for updates to avoid flicker
        });
    }
};

/**
 * Checks for nearby objects that might cause overlap with dimension annotations
 */
export const findNearbyObjects = (
    canvas: fabric.Canvas,
    object: fabric.Object,
    margin: number = 10
): {
    right: boolean;
    left: boolean;
    top: boolean;
    bottom: boolean;
} => {
    const result = {
        right: false,
        left: false,
        top: false,
        bottom: false
    };

    if (!canvas || !object || !object.width || !object.height) {
        return result;
    }

    // Get object boundaries
    const targetWidth = object.getScaledWidth ? object.getScaledWidth() : (object.width || 0) * (object.scaleX || 1);
    const targetHeight = object.getScaledHeight ? object.getScaledHeight() : (object.height || 0) * (object.scaleY || 1);
    const targetLeft = object.left || 0;
    const targetTop = object.top || 0;
    const targetRight = targetLeft + targetWidth;
    const targetBottom = targetTop + targetHeight;

    // Get all other objects
    const otherObjects = canvas.getObjects().filter(obj =>
        obj !== object &&
        obj.data?.type !== 'dimensionAnnotation' &&
        obj.data?.type !== 'grid' &&
        obj.data?.type !== 'alignmentLine' &&
        obj.data?.type !== 'wall'
    );

    // Check each object for proximity
    otherObjects.forEach(obj => {
        if (!obj.visible || !obj.width || !obj.height) return;

        const objWidth = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0) * (obj.scaleX || 1);
        const objHeight = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0) * (obj.scaleY || 1);
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        const objRight = objLeft + objWidth;
        const objBottom = objTop + objHeight;

        // Check if object is nearby to the right
        if (objLeft - targetRight < margin && objLeft > targetRight &&
            objTop < targetBottom && objBottom > targetTop) {
            result.right = true;
        }

        // Check if object is nearby to the left
        if (targetLeft - objRight < margin && objRight < targetLeft &&
            objTop < targetBottom && objBottom > targetTop) {
            result.left = true;
        }

        // Check if object is nearby below
        if (objTop - targetBottom < margin && objTop > targetBottom &&
            objLeft < targetRight && objRight > targetLeft) {
            result.bottom = true;
        }

        // Check if object is nearby above
        if (targetTop - objBottom < margin && objBottom < targetTop &&
            objLeft < targetRight && objRight > targetLeft) {
            result.top = true;
        }
    });

    return result;
};
