import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { BsCursor } from 'react-icons/bs';
import { PiHandLight } from 'react-icons/pi';
import { Divider } from '@/components/ui/Divider';
import { LiaRoadSolid } from 'react-icons/lia';
import { BiRectangle } from 'react-icons/bi';
import { TbRulerMeasure } from 'react-icons/tb';
import { useToolStore } from '@/state/toolStore';
import { useCanvasStore } from '@/state/canvasStore';
import {Tool} from "@/types/tool";
import { ControlItem } from './ControlItem';

const ControlWrap = styled.div`
  position: absolute;
  display: flex;
  gap: 4px;
  flex-direction: row;
  padding: 8px;
  left: 0;
  right: 0;
  margin-inline: auto;
  width: fit-content;
  bottom: 24px;
  border: 1px solid ${colors.gray};
  box-shadow: -4px 0 4px rgba(0, 0, 0, 0.1);
  background-color: ${colors.white};
  border-radius: 16px;
  z-index: 1000;
  align-items: center;
  height: 60px;
`;

const ControlPanel = () => {
  const { tool, setTool } = useToolStore();
  const handMode = useCanvasStore(s => s.handMode);
  const setHand = useCanvasStore(s => s.setHandMode);

  const changeTool = (newTool: Tool) => {
      setTool(newTool);
      setHand(false)
  }

  return (
    <ControlWrap>

        <ControlItem
            label="Select"
            icon={<BsCursor size={24} />}
            isActive={tool === 'select'}
            onClick={() => changeTool('select')}
        />
        <ControlItem
            label="Hand"
            icon={<PiHandLight size={24} />}
            isActive={handMode}
            onClick={() => setHand(!handMode)}
        />
        <Divider orientation="vertical" style={{ marginLeft: 4, marginRight: 4 }} />

        <ControlItem
            label="Module"
            icon={<BiRectangle size={24} />}
            isActive={tool === 'module'}
            onClick={() => changeTool('module')}
        />
        <ControlItem
            label="Corridor"
            icon={<LiaRoadSolid size={24} />}
            isActive={tool === 'corridor'}
            onClick={() => changeTool('corridor')}
        />
        <ControlItem
            label="Calibrate"
            icon={<TbRulerMeasure size={24} />}
            isActive={tool === 'calibrate'}
            onClick={() => changeTool('calibrate')}
        />
    </ControlWrap>
  );
};

export default ControlPanel;
