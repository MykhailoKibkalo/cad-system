// src/state/templateStore.ts
import { create } from 'zustand';
import { Opening } from '../types/geometry';

type OpeningTemplate = Omit<Opening, 'id' | 'moduleId'>;

interface TemplateState {
    openingTemplates: OpeningTemplate[];
    addOpeningTemplate: (tpl: OpeningTemplate) => void;
}

export const useTemplateStore = create<TemplateState>(set => ({
    openingTemplates: [],
    addOpeningTemplate: tpl =>
        set(s => ({ openingTemplates: [...s.openingTemplates, tpl] })),
}));
