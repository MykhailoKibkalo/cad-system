// src/context/HistoryContext.tsx
import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { HistoryAction, HistoryState } from '@/types';

interface HistoryContextType {
  history: HistoryState;
  addAction: (action: Omit<HistoryAction, 'id'>) => void;
  undo: () => HistoryAction | undefined;
  redo: () => HistoryAction | undefined;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY_SIZE = 20;

const initialHistoryState: HistoryState = {
  past: [],
  future: [],
};

type HistoryReducerAction = { type: 'ADD_ACTION'; payload: HistoryAction } | { type: 'UNDO' } | { type: 'REDO' };

const historyReducer = (state: HistoryState, action: HistoryReducerAction): HistoryState => {
  switch (action.type) {
    case 'ADD_ACTION': {
      const newPast = [...state.past, action.payload];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift(); // Remove oldest action if we exceed the limit
      }
      return {
        past: newPast,
        future: [], // Clear the future when a new action is added
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const lastAction = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      return {
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, dispatch] = useReducer(historyReducer, initialHistoryState);

  const addAction = (action: Omit<HistoryAction, 'id'>) => {
    dispatch({
      type: 'ADD_ACTION',
      payload: { ...action, id: Date.now().toString() },
    });
  };

  const undo = () => {
    if (history.past.length === 0) return undefined;
    const lastAction = history.past[history.past.length - 1];
    dispatch({ type: 'UNDO' });
    return lastAction;
  };

  const redo = () => {
    if (history.future.length === 0) return undefined;
    const nextAction = history.future[0];
    dispatch({ type: 'REDO' });
    return nextAction;
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addAction,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
