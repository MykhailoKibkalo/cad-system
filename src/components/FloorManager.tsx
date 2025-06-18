import React, { useState } from 'react';
import { useFloorStore } from '../store/floorStore';

interface FloorManagerProps {
  // Optional: an array of existing floor numbers to populate a dropdown
  existingFloors: number[];
}

const FloorManager: React.FC<FloorManagerProps> = ({ existingFloors }) => {
  const [sourceFloorNumber, setSourceFloorNumber] = useState<number | ''>('');
  const [targetFloorNumber, setTargetFloorNumber] = useState<number | ''>('');
  const [newPdfUrl, setNewPdfUrl] = useState<string>('');

  const cloneFloor = useFloorStore(state => state.cloneFloor);
  const updatePDF = useFloorStore(state => state.updatePDF);

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Floor Manager - Clone & Replace PDF</h3>

      <div style={formGroupStyle}>
        <label style={labelStyle}>
          Source Floor:
          <select
            style={selectStyle}
            value={sourceFloorNumber}
            onChange={e => setSourceFloorNumber(Number(e.target.value) || '')}
          >
            <option value="">Select</option>
            {existingFloors.map(floorNum => (
              <option key={floorNum} value={floorNum}>Floor {floorNum}</option>
            ))}
          </select>
        </label>
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
            placeholder="Enter new floor number"
          />
        </label>
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle}>
          New PDF URL:
          <input
            style={inputStyle}
            type="text"
            value={newPdfUrl}
            onChange={e => setNewPdfUrl(e.target.value)}
            placeholder="e.g. /pdfs/floor5.pdf"
          />
        </label>
      </div>

      <button
        style={buttonStyle}
        onClick={() => {
          if (sourceFloorNumber === '' || targetFloorNumber === '' || !newPdfUrl) return;
          cloneFloor(sourceFloorNumber, targetFloorNumber as number);
          updatePDF(targetFloorNumber as number, newPdfUrl);
          // Optionally reset local state or show success notification
          setSourceFloorNumber('');
          setTargetFloorNumber('');
          setNewPdfUrl('');
        }}
      >
        Clone & Replace PDF
      </button>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '20px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9',
  maxWidth: '500px',
  margin: '20px auto'
};

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '20px',
  color: '#333'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '15px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: '#555'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export default FloorManager;
