// src/state/toolStore.ts
import { create } from 'zustand';
import { Tool } from '@/types/tool';

interface ToolState {
  tool: Tool;
  setTool: (t: Tool) => void;
}

export const useToolStore = create<ToolState>(set => ({
  tool: 'select',
  setTool: t => set({ tool: t }),
}));
