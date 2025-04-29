'use client';
import styled from '@emotion/styled';
import { useToolStore } from '@/state/toolStore';

const Btn = styled.button`
  margin-left: 8px;
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border-radius: 4px;
`;

export default function CalibrateScaleButton() {
    const { tool, setTool } = useToolStore();
    const active = tool === 'calibrate';
    return (
        <Btn
            onClick={() => setTool(active ? 'select' : 'calibrate')}
            style={{ opacity: active ? 1 : 0.7 }}
        >
            Calibrate Scale
        </Btn>
    );
}
