// src/components/pdf/PdfBackdrop.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, PdfBackdrop as PdfBackdropType } from '../../types';
import { adjustPdfBackdrop, loadPdfToCanvas, removePdfBackdrop, togglePdfBackdropLock } from './PdfHandler';
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

const Button = styled.button`
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

  &:disabled {
    background-color: #a9c7eb;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled(Button)<{ isActive: boolean }>`
  background-color: ${props => (props.isActive ? '#4CAF50' : '#F44336')};

  &:hover {
    background-color: ${props => (props.isActive ? '#3e8e41' : '#d32f2f')};
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

  // Current position of the PDF - maintained separately to preserve it
  const pdfPositionRef = useRef({ x: 0, y: 0 });

  const activeFloor = floors.find(floor => floor.id === activeFloorId);
  const [opacity, setOpacity] = useState(activeFloor?.backdrop?.opacity || 0.5);
  const [scale, setScale] = useState(activeFloor?.backdrop?.scale || 1);
  const [isLocked, setIsLocked] = useState(activeFloor?.backdrop?.locked || false);

  // Update state when active floor changes
  useEffect(() => {
    if (activeFloor?.backdrop) {
      setOpacity(activeFloor.backdrop.opacity || 0.5);
      setScale(activeFloor.backdrop.scale || 1);
      setIsLocked(activeFloor.backdrop.locked || false);

      // Store current position
      if (activeFloor.backdrop.position) {
        pdfPositionRef.current = {
          x: activeFloor.backdrop.position.x,
          y: activeFloor.backdrop.position.y,
        };
      }
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
      selectable: !activeFloor.backdrop.locked,
      preservePosition: true, // ALWAYS preserve position
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
        locked: false, // Initially unlocked
        fileName: file.name,
        preservePosition: true, // Always preserve position
      };

      // Load the PDF onto the canvas
      await loadPdfToCanvas(canvas, fileUrl, {
        scale: scale,
        opacity: opacity,
        x: 0,
        y: 0,
        selectable: true, // Initially selectable
        preservePosition: true, // Always preserve
      });

      // Update the floor with the new backdrop
      updateFloor(activeFloorId, { backdrop: newBackdrop });

      // Update local state
      setIsLocked(false);
      pdfPositionRef.current = { x: 0, y: 0 };

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
    if (isLocked) return; // Prevent changes if locked

    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);

    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    // Get current PDF position
    const canvas = fabricCanvasRef.current;
    const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop');
    if (backdrop) {
      pdfPositionRef.current = { x: backdrop.left || 0, y: backdrop.top || 0 };
    }

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Update the backdrop with new opacity
    const updatedBackdrop = {
      ...activeFloor.backdrop,
      opacity: newOpacity,
      position: pdfPositionRef.current, // Preserve position
    };

    // Update the canvas
    adjustPdfBackdrop(fabricCanvasRef.current, {
      opacity: newOpacity,
      x: pdfPositionRef.current.x,
      y: pdfPositionRef.current.y,
      preservePosition: true,
    });

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
    if (isLocked) return; // Prevent changes if locked

    const newScale = parseFloat(e.target.value);
    setScale(newScale);

    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    // Get current PDF position
    const canvas = fabricCanvasRef.current;
    const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop');
    if (backdrop) {
      pdfPositionRef.current = { x: backdrop.left || 0, y: backdrop.top || 0 };
    }

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Update the backdrop with new scale
    const updatedBackdrop = {
      ...activeFloor.backdrop,
      scale: newScale,
      position: pdfPositionRef.current, // Preserve position
    };

    // Update the canvas
    adjustPdfBackdrop(fabricCanvasRef.current, {
      scale: newScale,
      x: pdfPositionRef.current.x,
      y: pdfPositionRef.current.y,
      preservePosition: true,
    });

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

  const handleToggleLock = () => {
    if (!activeFloorId || !activeFloor?.backdrop || !fabricCanvasRef?.current) return;

    const newLockState = !isLocked;
    setIsLocked(newLockState);

    // Get current PDF position before locking/unlocking
    const canvas = fabricCanvasRef.current;
    const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop');
    if (backdrop) {
      pdfPositionRef.current = { x: backdrop.left || 0, y: backdrop.top || 0 };
    }

    // Store the original backdrop for history
    const before = {
      backdrop: activeFloor.backdrop,
      floorId: activeFloorId,
    };

    // Update the backdrop with new lock state
    const updatedBackdrop = {
      ...activeFloor.backdrop,
      locked: newLockState,
      position: pdfPositionRef.current, // Store the exact current position
      preservePosition: true,
    };

    // Toggle lock state on the canvas object
    togglePdfBackdropLock(canvas, newLockState);

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

    // Reset local state
    setIsLocked(false);
    pdfPositionRef.current = { x: 0, y: 0 };

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
        <Button onClick={handleUploadClick} disabled={isLocked}>
          {activeFloor?.backdrop ? 'Change PDF' : 'Upload PDF'}
        </Button>

        {activeFloor?.backdrop && (
          <>
            <Button onClick={handleRemoveBackdrop} disabled={isLocked}>
              Remove PDF
            </Button>

            <ToggleButton onClick={handleToggleLock} isActive={isLocked}>
              {isLocked ? 'Unlock PDF' : 'Lock PDF'}
            </ToggleButton>
          </>
        )}

        <FileInput type="file" ref={fileInputRef} accept="application/pdf" onChange={handleFileChange} />
      </ControlGroup>

      {activeFloor?.backdrop && (
        <>
          <ControlGroup>
            <Label>File: {activeFloor.backdrop.fileName || 'PDF Document'}</Label>
          </ControlGroup>

          <ControlGroup>
            <Label>Opacity: {opacity.toFixed(2)}</Label>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={handleOpacityChange}
              disabled={isLocked}
            />
          </ControlGroup>

          <ControlGroup>
            <Label>Scale: {scale.toFixed(2)}x</Label>
            <Slider
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={scale}
              onChange={handleScaleChange}
              disabled={isLocked}
            />
          </ControlGroup>
        </>
      )}
    </PdfControlContainer>
  );
};

export default PdfBackdropControls;
