// src/state/toolStore.ts
import { create } from 'zustand';

export type Tool =
    | 'select'
    | 'module'
    | 'opening'
    | 'corridor'
    | 'balcony'
    | 'bathroomPod'
    | 'calibrate';


interface ToolState {
  tool: Tool;
  setTool: (t: Tool) => void;
}

export const useToolStore = create<ToolState>(set => ({
  tool: 'select',
  setTool: t => set({ tool: t }),
}));
