// src/types/history.ts
export enum ActionType {
  ADD_MODULE = 'add_module',
  UPDATE_MODULE = 'update_module',
  DELETE_MODULE = 'delete_module',
  ADD_OPENING = 'add_opening',
  UPDATE_OPENING = 'update_opening',
  DELETE_OPENING = 'delete_opening',
  ADD_BALCONY = 'add_balcony',
  UPDATE_BALCONY = 'update_balcony',
  DELETE_BALCONY = 'delete_balcony',
  ADD_FLOOR = 'add_floor',
  UPDATE_FLOOR = 'update_floor',
  DELETE_FLOOR = 'delete_floor',
  UPDATE_PDF = 'update_pdf',
}

export interface HistoryAction {
  type: ActionType;
  payload: {
    before: any;
    after: any;
    id: string;
    floorId?: string;
  };
}

export interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
}
