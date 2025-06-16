import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { LuX, LuRuler } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';

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
  width: 420px;
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
  display: flex;
  align-items: center;
  gap: 8px;
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

const InfoText = styled.p`
  font-size: 14px;
  color: ${colors.darkGray};
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.black};
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 50px 10px 12px;
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

const Unit = styled.span`
  position: absolute;
  right: 12px;
  font-size: 14px;
  color: ${colors.darkGray};
  pointer-events: none;
`;

const ErrorMessage = styled.span`
  display: block;
  font-size: 12px;
  color: #f44336;
  margin-top: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const HelpText = styled.div`
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 13px;
  color: ${colors.darkGray};
  line-height: 1.5;
`;

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (distance: number) => void;
  defaultValue?: number;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultValue = 1000
}) => {
  const [distance, setDistance] = useState(defaultValue.toString());
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const value = parseFloat(distance);
    
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    
    onConfirm(value);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <LuRuler size={20} />
            Set Calibration Distance
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <LuX size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <HelpText>
            You've drawn a line on the PDF. Now enter the real-world distance 
            that this line represents. This will help us calculate the correct 
            scale for your floor plan.
          </HelpText>
          
          <InputGroup>
            <Label>Real-world distance</Label>
            <InputWrapper>
              <Input
                ref={inputRef}
                type="number"
                value={distance}
                onChange={(e) => {
                  setDistance(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter distance"
                className={error ? 'error' : ''}
                step="any"
                min="0"
              />
              <Unit>mm</Unit>
            </InputWrapper>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </InputGroup>
          
          <InfoText>
            Tip: Find a scale reference on your PDF (like a ruler or dimension) 
            and draw the calibration line along it for best accuracy.
          </InfoText>
          
          <ButtonGroup>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Set Scale
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};