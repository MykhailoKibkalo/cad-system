// src/components/Floors/EditFloorModal.tsx
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useFloorStore } from '@/state/floorStore';
import { LuX, LuUpload } from 'react-icons/lu';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContainer = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  width: 480px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid ${colors.gray};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${colors.black};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
  
  &:hover {
    background: ${colors.lightGray};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.black};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${colors.gray};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
  
  &.error {
    border-color: #f44336;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  font-size: 12px;
  color: #f44336;
  margin-top: 4px;
`;

const FileUpload = styled.div`
  border: 2px dashed ${colors.gray};
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #2196f3;
    background: #f5f5f5;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadIcon = styled.div`
  color: #666;
  margin-bottom: 8px;
`;

const UploadText = styled.div`
  font-size: 14px;
  color: #666;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #2196f3;
  margin-top: 8px;
`;

const CurrentPdfNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${colors.gray};
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  &.primary {
    background: #2196f3;
    color: white;
    
    &:hover {
      background: #1976d2;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background: ${colors.lightGray};
    color: ${colors.black};
    
    &:hover {
      background: #e0e0e0;
    }
  }
`;

interface EditFloorModalProps {
  floorId: string;
  onClose: () => void;
}

const EditFloorModal: React.FC<EditFloorModalProps> = ({ floorId, onClose }) => {
  const { floors, updateFloor } = useFloorStore();
  const floor = floors.find(f => f.id === floorId);
  
  const [name, setName] = useState(floor?.name || '');
  const [height, setHeight] = useState(floor?.height.toString() || '3100');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ name?: string; height?: string }>({});

  useEffect(() => {
    if (floor) {
      setName(floor.name);
      setHeight(floor.height.toString());
    }
  }, [floor]);

  if (!floor) {
    onClose();
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

  const validate = () => {
    const newErrors: { name?: string; height?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Floor name is required';
    }
    
    const heightNum = parseInt(height);
    if (isNaN(heightNum)) {
      newErrors.height = 'Height must be a number';
    } else if (heightNum < 1000 || heightNum > 5000) {
      newErrors.height = 'Height must be between 1000 and 5000 mm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    const updates: Partial<typeof floor> = {
      name: name.trim(),
      height: parseInt(height),
    };
    
    if (pdfFile) {
      // In a real app, you'd upload to a server or convert to base64
      // For now, we'll create a local URL
      updates.pdfUrl = URL.createObjectURL(pdfFile);
    }
    
    updateFloor(floorId, updates);
    onClose();
  };

  const handleRemovePdf = () => {
    if (floor && window.confirm('Remove the current PDF from this floor?')) {
      updateFloor(floorId, { pdfUrl: undefined });
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit Floor</ModalTitle>
          <CloseButton onClick={onClose}>
            <LuX size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <FormGroup>
            <Label>Floor Name *</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter floor name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label>Floor Height (mm) *</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="1000"
              max="5000"
              placeholder="Enter height in millimeters"
              className={errors.height ? 'error' : ''}
            />
            {errors.height && <ErrorMessage>{errors.height}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label>Floor Plan PDF</Label>
            <FileUpload onClick={() => document.getElementById('pdf-upload-edit')?.click()}>
              <FileInput
                id="pdf-upload-edit"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <UploadIcon>
                <LuUpload size={24} />
              </UploadIcon>
              <UploadText>
                Click to upload new PDF or drag and drop
              </UploadText>
              {pdfFile && <FileName>New: {pdfFile.name}</FileName>}
              {floor.pdfUrl && !pdfFile && (
                <CurrentPdfNote>
                  Current PDF is attached
                  <button 
                    type="button"
                    onClick={handleRemovePdf}
                    style={{ 
                      marginLeft: '8px', 
                      background: 'none', 
                      border: 'none', 
                      color: '#f44336', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    (Remove)
                  </button>
                </CurrentPdfNote>
              )}
            </FileUpload>
          </FormGroup>
        </ModalBody>
        
        <ModalFooter>
          <Button className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="primary" onClick={handleSave}>
            Apply Changes
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default EditFloorModal;