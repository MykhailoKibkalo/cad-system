'use client';

import {saveAs} from 'file-saver';
import {fabric} from 'fabric';

/**
 * Exports the canvas as a JSON file and initiates download
 * @param canvas The fabric canvas to export
 * @param filename The name of the file to download
 */
export function exportCanvasToJSON(canvas: fabric.Canvas, filename: string = 'cad-project.json'): void {
  if (!canvas) return;

  const json = JSON.stringify(canvas.toJSON(['data']), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, filename);
}

/**
 * Loads a JSON file into the canvas
 * @param canvas The fabric canvas to load into
 * @param jsonData The JSON data to load
 */
export function loadJSONToCanvas(canvas: fabric.Canvas, jsonData: string): void {
  if (!canvas) return;

  try {
    canvas.loadFromJSON(jsonData, () => {
      canvas.requestRenderAll();
    });
  } catch (error) {
    console.error('Error loading JSON:', error);
    alert('Failed to load project file. The file might be corrupted or in an incompatible format.');
  }
}
