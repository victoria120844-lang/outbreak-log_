import type { StateCreator } from 'zustand';
import type { LogEntry } from '@/types';
import { loadLog } from './persistence';
import type { StoreState } from './types';

/** Hard cap on retained history; older entries fall off the front. */
export const MAX_LOG_ENTRIES = 2000;

/**
 * Only the tail is mounted. 2000 entries of DOM would stall a long run, and
 * nobody scrolls back 200 days — the export carries the full record instead.
 */
export const LOG_WINDOW = 300;

export interface LogSlice {
  log: LogEntry[];
  /** Survivor hovered in the log, highlighted in the roster. */
  hoveredSurvivorId: string | null;
  appendLog: (entry: LogEntry) => void;
  setHoveredSurvivor: (survivorId: string | null) => void;
  resetLog: () => void;
}

export const createLogSlice: StateCreator<StoreState, [], [], LogSlice> = (
  set,
) => ({
  log: loadLog(),
  hoveredSurvivorId: null,

  appendLog: (entry) =>
    set((state) => ({ log: [...state.log, entry].slice(-MAX_LOG_ENTRIES) })),

  setHoveredSurvivor: (survivorId) => set({ hoveredSurvivorId: survivorId }),

  resetLog: () => set({ log: [], hoveredSurvivorId: null }),
});
