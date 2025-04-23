"use client";

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';
import { drawGrid } from './grid';

const FabricCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setCanvas, gridStep } = useCadStore();

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1600,
            height: 900,
            preserveObjectStacking: true,
            selection: true,
        });

        // Save canvas to store
        setCanvas(canvas);

        // Draw initial grid
        drawGrid(canvas, gridStep);

        // Cleanup on unmount
        return () => {
            canvas.dispose();
        };
    }, [setCanvas, gridStep]);

    // Update grid when gridStep changes
    useEffect(() => {
        const canvas = useCadStore.getState().canvas;
        if (canvas) {
            drawGrid(canvas, gridStep);
        }
    }, [gridStep]);

    return <canvas ref={canvasRef} id="fabric-canvas" />;
};

export default FabricCanvas;
