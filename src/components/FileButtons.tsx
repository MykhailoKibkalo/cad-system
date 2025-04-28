'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import useCadStore from '@/store/cadStore';
import { addPdfToCanvas } from '@/utils/pdfLoader';
import { exportCanvasToJSON, exportComponentsData, loadJSONToCanvas } from '@/utils/exportJSON';
import { applyBackdropLock } from '@/utils/backdrop';

const Button = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileButtons: React.FC = () => {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const { canvas, setBackdropId } = useCadStore();

  const handleUploadPdf = () => {
    pdfInputRef.current?.click();
  };

  const handlePdfSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    try {
      const image = await addPdfToCanvas(file, canvas);
      setBackdropId(image.data.id);
    } catch (error) {
      console.error('Error adding PDF to canvas:', error);
      alert('Failed to load PDF. Please try another file.');
    }

    // Reset input value so the same file can be selected again
    event.target.value = '';
  };

  const handleLoadJson = () => {
    jsonInputRef.current?.click();
  };

  const handleJsonSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = e => {
      if (e.target?.result) {
        loadJSONToCanvas(canvas, e.target.result as string);
      }
    };

    reader.readAsText(file);

    // Reset input value
    event.target.value = '';
  };

  const handleSaveJson = () => {
    if (!canvas) return;
    exportCanvasToJSON(canvas);
  };

  const handleExportComponents = () => {
    if (!canvas) return;
    exportComponentsData(canvas);
  };

  return (
    <div>
      <Button onClick={handleUploadPdf}>Upload PDF</Button>
      <HiddenInput ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfSelected} />

      <Button onClick={handleLoadJson}>Load JSON</Button>
      <HiddenInput ref={jsonInputRef} type="file" accept="application/json" onChange={handleJsonSelected} />

      <Button onClick={handleSaveJson}>Save JSON</Button>

      <Button onClick={handleExportComponents}>Export Components</Button>

      {/* ─── Backdrop controls ─── */}
      <span style={{ marginLeft: 12, borderLeft: '1px solid #ccc', paddingLeft: 12 }}>
        <label style={{ marginRight: 8 }}>
          Opacity&nbsp;
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={useCadStore.getState().backdropOpacity}
            onChange={e => {
              const v = +e.target.value;
              useCadStore.getState().setBackdropOpacity(v);
              const { canvas, backdropId } = useCadStore.getState();
              if (canvas && backdropId) {
                canvas.getObjects().forEach(o => {
                  if (o.data?.id === backdropId) o.set('opacity', v);
                });
                canvas.requestRenderAll();
              }
            }}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={useCadStore.getState().backdropLocked}
            onChange={e => {
              const locked = e.target.checked;
              useCadStore.getState().setBackdropLocked(locked);
              const { canvas } = useCadStore.getState();
              if (canvas) {
                applyBackdropLock(canvas);
              }
            }}
          />
          &nbsp;Lock&nbsp;PDF
        </label>
      </span>
    </div>
  );
};

export default FileButtons;
