// src/components/FloorManager.enhanced.tsx
// Enhanced version with validation and user feedback

import React, { useState } from 'react';
import { useFloorStore } from '../store/floorStore';
import { IFloor } from '../types/floor';

interface FloorManagerProps {
  existingFloors: number[];
}

const FloorManagerEnhanced: React.FC<FloorManagerProps> = ({ existingFloors }) => {
  const [sourceFloorNumber, setSourceFloorNumber] = useState<number | ''>('');
  const [targetFloorNumber, setTargetFloorNumber] = useState<number | ''>('');
  const [newPdfUrl, setNewPdfUrl] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const floors = useFloorStore(state => state.floors);
  const cloneFloor = useFloorStore(state => state.cloneFloor);
  const updatePDF = useFloorStore(state => state.updatePDF);

  const handleCloneAndReplace = () => {
    // Clear previous message
    setMessage(null);

    // Validation
    if (sourceFloorNumber === '') {
      setMessage({ type: 'error', text: 'Please select a source floor' });
      return;
    }
    
    if (targetFloorNumber === '') {
      setMessage({ type: 'error', text: 'Please enter a target floor number' });
      return;
    }
    
    if (!newPdfUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a PDF URL' });
      return;
    }

    const targetNum = targetFloorNumber as number;
    
    // Check if source floor exists
    if (!floors[sourceFloorNumber]) {
      setMessage({ type: 'error', text: `Source floor ${sourceFloorNumber} does not exist` });
      return;
    }

    // Warn if target floor will be overwritten
    const willOverwrite = !!floors[targetNum];
    if (willOverwrite && !confirm(`Floor ${targetNum} already exists. This will overwrite it. Continue?`)) {
      return;
    }

    try {
      // Perform the clone and PDF update
      cloneFloor(sourceFloorNumber, targetNum);
      updatePDF(targetNum, newPdfUrl.trim());
      
      // Success message
      setMessage({ 
        type: 'success', 
        text: `Successfully cloned Floor ${sourceFloorNumber} to Floor ${targetNum} with new PDF` 
      });
      
      // Reset form
      setSourceFloorNumber('');
      setTargetFloorNumber('');
      setNewPdfUrl('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}` 
      });
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Floor Manager - Clone & Replace PDF</h3>
      
      {message && (
        <div style={{
          ...messageStyle,
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          borderColor: message.type === 'success' ? '#c3e6cb' : '#f5c6cb'
        }}>
          {message.text}
        </div>
      )}
      
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          Source Floor:
          <select
            style={selectStyle}
            value={sourceFloorNumber}
            onChange={e => setSourceFloorNumber(Number(e.target.value) || '')}
          >
            <option value="">Select a floor to clone</option>
            {existingFloors.map(floorNum => (
              <option key={floorNum} value={floorNum}>
                Floor {floorNum}
                {floors[floorNum] && ` (${floors[floorNum].modules.length} modules)`}
              </option>
            ))}
          </select>
        </label>
        {sourceFloorNumber !== '' && floors[sourceFloorNumber] && (
          <div style={infoStyle}>
            Contains {floors[sourceFloorNumber].modules.length} modules
          </div>
        )}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle}>
          New Floor Number:
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={targetFloorNumber}
            onChange={e => setTargetFloorNumber(Number(e.target.value) || '')}
            placeholder="Enter new floor number (e.g., 3)"
          />
        </label>
        {targetFloorNumber !== '' && floors[targetFloorNumber as number] && (
          <div style={warningStyle}>
            ⚠️ Floor {targetFloorNumber} already exists and will be replaced
          </div>
        )}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle}>
          New PDF URL:
          <input
            style={inputStyle}
            type="text"
            value={newPdfUrl}
            onChange={e => setNewPdfUrl(e.target.value)}
            placeholder="e.g., /pdfs/floor3.pdf or https://example.com/floor.pdf"
          />
        </label>
        <div style={helpStyle}>
          Enter the URL or path to the new floor plan PDF
        </div>
      </div>

      <button
        style={{
          ...buttonStyle,
          opacity: (sourceFloorNumber === '' || targetFloorNumber === '' || !newPdfUrl) ? 0.6 : 1,
          cursor: (sourceFloorNumber === '' || targetFloorNumber === '' || !newPdfUrl) ? 'not-allowed' : 'pointer'
        }}
        onClick={handleCloneAndReplace}
        disabled={sourceFloorNumber === '' || targetFloorNumber === '' || !newPdfUrl}
      >
        Clone & Replace PDF
      </button>

      <div style={summaryStyle}>
        <h4>How it works:</h4>
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Select an existing floor to use as a template</li>
          <li>Choose a new floor number (can be a new floor or replace existing)</li>
          <li>Provide the URL for the new floor's PDF</li>
          <li>All modules and their positions will be copied exactly</li>
          <li>Only the PDF URL will be different in the new floor</li>
        </ol>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '24px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9',
  maxWidth: '600px',
  margin: '20px auto'
};

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '20px',
  color: '#333',
  fontSize: '20px'
};

const messageStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '4px',
  marginBottom: '20px',
  border: '1px solid',
  fontSize: '14px'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: '#555',
  fontSize: '14px'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const infoStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginTop: '4px',
  fontStyle: 'italic'
};

const warningStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#856404',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '4px',
  padding: '8px',
  marginTop: '4px'
};

const helpStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginTop: '4px'
};

const summaryStyle: React.CSSProperties = {
  marginTop: '24px',
  paddingTop: '20px',
  borderTop: '1px solid #ddd',
  fontSize: '13px',
  color: '#666'
};

export default FloorManagerEnhanced;