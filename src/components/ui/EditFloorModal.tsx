// src/components/ui/EditFloorModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/InputWithAffix';
import { Button } from '@/components/ui/Button';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuPlus, LuSave } from 'react-icons/lu';
import { Divider } from '@/components/ui/Divider';
import { useFloorStore } from '@/state/floorStore';

interface EditFloorModalProps {
  floorId?: string; // undefined means create new floor
  onClose: () => void;
  onSuccess?: (floorId: string) => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Footer = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const HalfButton = styled(Button)`
  flex: 1;
`;

const ValidationError = styled(Text)`
  color: #dc2626;
  font-size: 14px;
`;

export default function EditFloorModal({ floorId, onClose, onSuccess }: EditFloorModalProps) {
  const { getFloorById, addFloor, editFloor, floors } = useFloorStore();

  const existingFloor = floorId ? getFloorById(floorId) : null;
  const isEditing = !!existingFloor;

  const [form, setForm] = useState({
    name: '',
    height: '3000',
  });

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    height?: string;
  }>({});

  // Initialize form
  useEffect(() => {
    if (existingFloor) {
      setForm({
        name: existingFloor.name,
        height: Math.round(existingFloor.height).toString(),
      });
    } else {
      // Generate default name for new floor
      const existingNumbers = floors
        .map(f => {
          const match = f.name.match(/Level\s+(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      setForm({
        name: `Level ${nextNumber}`,
        height: '3000',
      });
    }
  }, [existingFloor, floors]);

  // Real-time validation
  useEffect(() => {
    const errors: typeof validationErrors = {};

    // Validate name
    if (!form.name.trim()) {
      errors.name = 'Floor name is required';
    } else if (form.name.trim().length > 50) {
      errors.name = 'Floor name must be 50 characters or less';
    } else if (floors.some(f => f.name.trim() === form.name.trim() && f.id !== floorId)) {
      errors.name = 'A floor with this name already exists';
    }

    // Validate height
    const heightValue = parseInt(form.height);
    if (!form.height.trim() || isNaN(heightValue)) {
      errors.height = 'Height is required and must be a number';
    } else if (heightValue <= 0) {
      errors.height = 'Height must be greater than 0';
    } else if (heightValue > 10000) {
      errors.height = 'Height must be 10,000 mm or less';
    }

    setValidationErrors(errors);
  }, [form.name, form.height, floors, floorId]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // For height field, ensure integer-only values
    if (field === 'height') {
      value = value.replace(/[^\d]/g, '');
    }

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) return;

    const heightValue = Math.round(parseInt(form.height));
    const nameValue = form.name.trim();

    try {
      if (isEditing && existingFloor) {
        editFloor(existingFloor.id, {
          name: nameValue,
          height: heightValue,
        });
        onSuccess?.(existingFloor.id);
      } else {
        const newFloorId = addFloor(nameValue, heightValue);
        onSuccess?.(newFloorId);
      }
      onClose();
    } catch (error) {
      console.error('Error saving floor:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Text size={24} weight={700}>
            {isEditing ? 'Edit Floor' : 'Create New Floor'}
          </Text>
          <Button variant="ghost" onClick={onClose}>
            <HiMiniXMark size={24} />
          </Button>
        </Header>

        <Content>
          <FormField>
            <Text size={16} weight={600}>
              Floor Name
            </Text>
            <Input
              value={form.name}
              onChange={handleChange('name')}
              placeholder="e.g., Level 1, Ground Floor"
              error={validationErrors.name}
            />
            {!validationErrors.name && (
              <Text size={12} color="#64748b">
                Enter a descriptive name for this floor level
              </Text>
            )}
          </FormField>

          <Divider orientation="horizontal" />

          <FormField>
            <Text size={16} weight={600}>
              Floor Height
            </Text>
            <Input
              type="number"
              step="1"
              min="1"
              max="10000"
              value={form.height}
              onChange={handleChange('height')}
              onBlur={e => {
                const val = Math.max(1, Math.min(10000, Math.round(parseInt(e.target.value) || 3000)));
                setForm(prev => ({ ...prev, height: val.toString() }));
              }}
              suffix="mm"
              error={validationErrors.height}
            />
            {!validationErrors.height && (
              <Text size={12} color="#64748b">
                Typical residential floor height is 2,700-3,100 mm
              </Text>
            )}
          </FormField>
        </Content>

        <Footer>
          <ButtonRow>
            <HalfButton variant="secondary" onClick={onClose}>
              Cancel
            </HalfButton>
            <HalfButton
              variant="primary"
              icon={isEditing ? <LuSave size={18} /> : <LuPlus size={18} />}
              onClick={handleSubmit}
              disabled={hasValidationErrors}
            >
              {isEditing ? 'Save Changes' : 'Create Floor'}
            </HalfButton>
          </ButtonRow>
        </Footer>
      </Modal>
    </Overlay>
  );
}
