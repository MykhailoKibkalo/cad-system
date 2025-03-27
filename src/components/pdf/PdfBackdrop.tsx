// src/components/pdf/PdfBackdrop.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, PdfBackdrop as PdfBackdropType } from '../../types';
import { adjustPdfBackdrop, loadPdfToCanvas, removePdfBackdrop } from './PdfHandler';
import { v4 as uuidv4 } from 'uuid';

const PdfControlContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #ccc;
  background-color: #f5f5f5;
`;

const ControlGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;

  &:hover {
    background-color: #3a80d2;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Slider = styled.input`
  width: 100%;
`;

const PdfBackdropControls: React.FC = () => {
  const { activeFloorId, floors, updateFloor, fabricCanvasRef } = useCad();

  const { addAction } = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFloor = floors.find(floor => floor.id === activeFloorId);
  const [opacity, setOpacity] = useState(activeFloor?.backdrop?.opacity || 0.5);
  const [scale, setScale] = useState(activeFloor?.backdrop?.scale || 1);
  const [movable, setMovable] = useState(true);

  // Update state when active floor changes
  useEffect(() => {
    if (activeFloor) {
      setOpacity(activeFloor.backdrop?.opacity || 0.5);
      setScale(activeFloor.backdrop?.scale || 1);
    }
  }, [activeFloor]);

  // Render PDF on canvas when it changes
  useEffect(() => {
    const canvas = fabricCanvasRef?.current;
    if (!canvas || !activeFloor || !activeFloor.backdrop) return;

    loadPdfToCanvas(canvas, activeFloor.backdrop.url, {
      scale: activeFloor.backdrop.scale,
      opacity: activeFloor.backdrop.opacity,
      x: activeFloor.backdrop.position.x,
      y: activeFloor.backdrop.position.y,
    });
  }, [activeFloorId, fabricCanvasRef]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const canvas = fabricCanvasRef?.current;

    if (!files || files.length === 0 || !activeFloorId || !canvas) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      // Create a URL for the uploaded file
      const fileUrl = URL.createObjectURL(file);

      // Store the original backdrop for history
      const before = {
        backdrop: activeFloor?.backdrop || null,
        floorId: activeFloorId,
      };

      // Create a new backdrop
      const newBackdrop: PdfBackdropType = {
        id: uuidv4(),
        url: fileUrl,
        scale: scale,
        opacity: opacity,
        position: {
          x: 0,
          y: 0,
        },
      };

      // Load the PDF onto the canvas
      await loadPdfToCanvas(canvas, fileUrl, {
        scale: scale,
        opacity: opacity,
        x: 0,
        y: 0,
        selectable: movable,
      });

      // Update the floor with the new backdrop
      updateFloor(activeFloorId, { backdrop: newBackdrop });

      // Add to history
      addAction({
        type: ActionType.UPDATE_PDF,
        payload: {
          before,
          after: {
            backdrop: newBackdrop,
            floorId: activeFloorId,
          },
          id: activeFloorId,
        },
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF');
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);

    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Update the backdrop with new opacity
    const updatedBackdrop = {
      ...activeFloor.backdrop,
      opacity: newOpacity,
    };

    // Update the canvas
    adjustPdfBackdrop(fabricCanvasRef.current, { opacity: newOpacity });

    // Update the floor with the modified backdrop
    updateFloor(activeFloorId, { backdrop: updatedBackdrop });

    // Add to history
    addAction({
      type: ActionType.UPDATE_PDF,
      payload: {
        before,
        after: {
          backdrop: updatedBackdrop,
          floorId: activeFloorId,
        },
        id: activeFloorId,
      },
    });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);

    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Update the backdrop with new scale
    const updatedBackdrop = {
      ...activeFloor.backdrop,
      scale: newScale,
    };

    // Update the canvas
    adjustPdfBackdrop(fabricCanvasRef.current, { scale: newScale });

    // Update the floor with the modified backdrop
    updateFloor(activeFloorId, { backdrop: updatedBackdrop });

    // Add to history
    addAction({
      type: ActionType.UPDATE_PDF,
      payload: {
        before,
        after: {
          backdrop: updatedBackdrop,
          floorId: activeFloorId,
        },
        id: activeFloorId,
      },
    });
  };

  const handleRemoveBackdrop = () => {
    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Remove the backdrop from the canvas
    removePdfBackdrop(fabricCanvasRef.current);

    // Remove the backdrop from the floor data
    updateFloor(activeFloorId, { backdrop: undefined });

    // Add to history
    addAction({
      type: ActionType.UPDATE_PDF,
      payload: {
        before,
        after: {
          backdrop: null,
          floorId: activeFloorId,
        },
        id: activeFloorId,
      },
    });
  };

  return (
    <PdfControlContainer>
      <h3>PDF Backdrop</h3>

      <ControlGroup>
        <UploadButton onClick={handleUploadClick}>{activeFloor?.backdrop ? 'Change PDF' : 'Upload PDF'}</UploadButton>
        {activeFloor?.backdrop && <UploadButton onClick={handleRemoveBackdrop}>Remove PDF</UploadButton>}
        <FileInput type="file" ref={fileInputRef} accept="application/pdf" onChange={handleFileChange} />
      </ControlGroup>

      {activeFloor?.backdrop && (
        <>
          <ControlGroup>
            <Label>Opacity: {opacity.toFixed(2)}</Label>
            <Slider type="range" min="0" max="1" step="0.05" value={opacity} onChange={handleOpacityChange} />
          </ControlGroup>

          <ControlGroup>
            <Label>Scale: {scale.toFixed(2)}x</Label>
            <Slider type="range" min="0.1" max="5" step="0.1" value={scale} onChange={handleScaleChange} />
          </ControlGroup>
        </>
      )}
    </PdfControlContainer>
  );
};

export default PdfBackdropControls;
