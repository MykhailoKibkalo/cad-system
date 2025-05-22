// src/components/Properties/BalconyEditor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Module, Balcony } from '@/types/geometry';
import { useObjectStore } from '@/state/objectStore';

interface Props {
    module: Module;
    onSave: (newBalcony: Balcony) => void;
    onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalBox = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const Field = styled.div`
  margin-bottom: 12px;
`;
const Label = styled.label`
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
`;
const Input = styled.input`
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;
const Select = styled.select`
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;
const BtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;
const Btn = styled.button<{ variant?: 'primary' | 'danger' }>`
  margin-left: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: ${({ variant }) => (variant === 'danger' ? '#ef4444' : '#3b82f6')};
  color: white;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export default function BalconyEditor({ module, onSave, onCancel }: Props) {
    const addBalcony = useObjectStore(s => s.addBalcony);

    // стан форми
    const [side, setSide]         = useState<1|2|3|4>(1);
    const [width, setWidth]       = useState<number>(0);
    const [length, setLength]     = useState<number>(0);
    const [distance, setDistance] = useState<number>(0);
    const [errors, setErrors]     = useState<string[]>([]);

    // обчислення максимумів
    const maxAlong = (side === 1 || side === 3) ? module.width : module.length;
    const maxDepth = (side === 1 || side === 3) ? module.length : module.width;

    // скинути значення при зміні модуля або сторони
    useEffect(() => {
        setWidth(0);
        setLength(0);
        setDistance(0);
        setErrors([]);
    }, [module.id, side]);

    // валідація
    const validate = () => {
        const errs: string[] = [];
        if (width <= 0 || width > maxAlong) {
            errs.push(`Width must be >0 and ≤${maxAlong} mm`);
        }
        if (length <= 0 || length > maxDepth) {
            errs.push(`Length must be >0 and ≤${maxDepth} mm`);
        }
        if (distance < 0 || distance + width > maxAlong) {
            errs.push(`Distance must be ≥0 and distance+width ≤${maxAlong} mm`);
        }
        setErrors(errs);
        return errs.length === 0;
    };

    const handleAdd = () => {
        if (!validate()) return;
        const id = `BC${Date.now()}`;
        const newBalcony: Balcony = {
            id,
            moduleId: module.id,
            name: id,
            wallSide: side,
            distanceAlongWall: distance,
            width,
            length,
        };
        addBalcony(newBalcony);
        onSave(newBalcony);
    };

    return (
        <Overlay>
            <ModalBox>
                <h3>Add Balcony</h3>
                <Field>
                    <Label>Side</Label>
                    <Select value={side} onChange={e => setSide(+e.target.value as 1|2|3|4)}>
                        <option value={1}>Top</option>
                        <option value={2}>Right</option>
                        <option value={3}>Bottom</option>
                        <option value={4}>Left</option>
                    </Select>
                </Field>
                <Field>
                    <Label>Width along wall (мм)</Label>
                    <Input
                        type="number"
                        value={width}
                        min={0}
                        max={maxAlong}
                        onChange={e => setWidth(Number(e.target.value))}
                    />
                </Field>
                <Field>
                    <Label>Length (depth) (мм)</Label>
                    <Input
                        type="number"
                        value={length}
                        min={0}
                        max={maxDepth}
                        onChange={e => setLength(Number(e.target.value))}
                    />
                </Field>
                <Field>
                    <Label>Distance along wall (мм)</Label>
                    <Input
                        type="number"
                        value={distance}
                        min={0}
                        max={maxAlong - width}
                        onChange={e => setDistance(Number(e.target.value))}
                    />
                </Field>
                {errors.length > 0 && (
                    <ul style={{ color: 'red', marginTop: 8 }}>
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                )}
                <BtnRow>
                    <Btn variant="danger" onClick={onCancel}>
                        Cancel
                    </Btn>
                    <Btn
                        variant="primary"
                        onClick={handleAdd}
                        disabled={!validate()}
                    >
                        Add
                    </Btn>
                </BtnRow>
            </ModalBox>
        </Overlay>
    );
}
