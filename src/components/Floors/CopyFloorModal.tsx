// src/components/Floors/CopyFloorModal.tsx
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useFloorStore } from '@/state/floorStore';
import { LuX, LuCopy } from 'react-icons/lu';
import { Button } from "@/components/ui/Button";

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
    background: ${colors.gray};
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

const InfoMessage = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #1976d2;
  margin-bottom: 20px;
`;

const SourceFloorInfo = styled.div`
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
`;

const SourceFloorLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
`;

const SourceFloorName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.black};
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${colors.gray};
`;

interface CopyFloorModalProps {
  sourceFloorId: string;
  onClose: () => void;
}

const CopyFloorModal: React.FC<CopyFloorModalProps> = ({ sourceFloorId, onClose }) => {
  const { floors, copyFloorMultiple } = useFloorStore();
  const sourceFloor = floors.find(f => f.id === sourceFloorId);
  
  const [name, setName] = useState(sourceFloor ? `${sourceFloor.name} (Copy)` : 'Copy');
  const [copyCount, setCopyCount] = useState('1');
  const [errors, setErrors] = useState<{ name?: string; copyCount?: string }>({});

  if (!sourceFloor) return null;

  const validate = () => {
    const newErrors: { name?: string; copyCount?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Floor name is required';
    }

    const count = parseInt(copyCount);
    if (isNaN(count)) {
      newErrors.copyCount = 'Copy count must be a number';
    } else if (count < 1 || count > 20) {
      newErrors.copyCount = 'Copy count must be between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCopy = () => {
    if (!validate()) return;

    const count = parseInt(copyCount);
    copyFloorMultiple(sourceFloorId, name.trim(), count);
    onClose();
  };

  const totalFloors = parseInt(copyCount) || 1;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Copy Floor</ModalTitle>
          <CloseButton onClick={onClose}>
            <LuX size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <SourceFloorInfo>
            <SourceFloorLabel>Source Floor</SourceFloorLabel>
            <SourceFloorName>{sourceFloor.name}</SourceFloorName>
          </SourceFloorInfo>

          <FormGroup>
            <Label>New Floor Name *</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new floor name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label>Number of Copies *</Label>
            <Input
              type="number"
              value={copyCount}
              onChange={(e) => setCopyCount(e.target.value)}
              min="1"
              max="20"
              placeholder="Enter number of copies"
              className={errors.copyCount ? 'error' : ''}
            />
            {errors.copyCount && <ErrorMessage>{errors.copyCount}</ErrorMessage>}
          </FormGroup>

          {totalFloors > 1 && (
            <InfoMessage>
              This will create {totalFloors} identical floors that will be grouped together in the floors list.
            </InfoMessage>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant='danger' onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCopy}>
            <LuCopy size={16} style={{ marginRight: '8px' }} />
            Copy Floor{totalFloors > 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CopyFloorModal;