import type { StateCreator } from 'zustand';
import type { Survivor } from '@/types';
import { loadSurvivors } from './persistence';
import type { StoreState } from './types';

export interface SurvivorsSlice {
  survivors: Survivor[];
  addSurvivor: (survivor: Survivor) => void;
  removeSurvivor: (id: string) => void;
  updateSurvivor: (id: string, patch: Partial<Omit<Survivor, 'id'>>) => void;
  resetSurvivors: () => void;
}

export const createSurvivorsSlice: StateCreator<
  StoreState,
  [],
  [],
  SurvivorsSlice
> = (set) => ({
  survivors: loadSurvivors(),
  addSurvivor: (survivor) =>
    set((state) => ({ survivors: [...state.survivors, survivor] })),
  removeSurvivor: (id) =>
    set((state) => ({
      survivors: state.survivors.filter((survivor) => survivor.id !== id),
    })),
  updateSurvivor: (id, patch) =>
    set((state) => ({
      survivors: state.survivors.map((survivor) =>
        survivor.id === id ? { ...survivor, ...patch } : survivor,
      ),
    })),
  resetSurvivors: () => set({ survivors: [] }),
});
