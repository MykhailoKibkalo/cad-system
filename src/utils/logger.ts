// src/utils/logger.ts
// Simple utility to make console logs more visible during debugging

const DEBUG_ENABLED = true;

export const logDebug = (message: string, ...data: any[]) => {
  if (!DEBUG_ENABLED) return;

  console.log(`%c${message}`, 'background: #333; color: #bada55; padding: 2px 4px; border-radius: 2px;', ...data);
};

export const logError = (message: string, ...data: any[]) => {
  if (!DEBUG_ENABLED) return;

  console.log(`%c${message}`, 'background: #cc0000; color: white; padding: 2px 4px; border-radius: 2px;', ...data);
};

export const logInfo = (message: string, ...data: any[]) => {
  if (!DEBUG_ENABLED) return;

  console.log(`%c${message}`, 'background: #0066cc; color: white; padding: 2px 4px; border-radius: 2px;', ...data);
};
