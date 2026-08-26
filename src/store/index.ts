import { create } from 'zustand';
import {
  pruneRelationships,
  stagePairsFor,
} from '@/features/relationships/pairs';
import { createInventorySlice } from './inventorySlice';
import { createLogSlice } from './logSlice';
import { createRelationshipsSlice } from './relationshipsSlice';
import { savePersistedState } from './persistence';
import { createSimSlice } from './simSlice';
import { createSurvivorsSlice } from './survivorsSlice';
import type { StoreState } from './types';

/**
 * One store for the whole app, assembled from domain slices.
 * Components subscribe with a selector: `useStore((s) => s.survivors)`.
 */
export const useStore = create<StoreState>()((...args) => ({
  ...createSurvivorsSlice(...args),
  ...createRelationshipsSlice(...args),
  ...createInventorySlice(...args),
  ...createLogSlice(...args),
  ...createSimSlice(...args),
}));

/**
 * Registering a survivor stages a relationship row against everyone already in
 * the group; removing one drops the rows that referenced them. Kept here rather
 * than in the survivor form so registration stays a single concern.
 */
useStore.subscribe((state, prevState) => {
  if (state.survivors === prevState.survivors) return;

  const ids = state.survivors.map((survivor) => survivor.id);
  const previousIds = new Set(prevState.survivors.map((survivor) => survivor.id));
  const addedIds = ids.filter((id) => !previousIds.has(id));

  const pruned = pruneRelationships(state.relationships, ids);
  const staged = stagePairsFor(addedIds, ids, pruned);

  if (staged.length > 0 || pruned.length !== state.relationships.length) {
    state.setRelationships([...pruned, ...staged]);
  }

  // Items assigned to someone who is no longer here return to the shared pool.
  const remaining = new Set(ids);
  state.inventory.forEach((entry) => {
    if (entry.assignedTo !== undefined && !remaining.has(entry.assignedTo)) {
      state.assignItem(entry.itemId, null);
    }
  });
});

// Every persisted slice shares one storage key, so they save together.
useStore.subscribe((state, prevState) => {
  if (
    state.survivors !== prevState.survivors ||
    state.relationships !== prevState.relationships ||
    state.inventory !== prevState.inventory ||
    state.log !== prevState.log ||
    state.sim !== prevState.sim
  ) {
    savePersistedState({
      survivors: state.survivors,
      relationships: state.relationships,
      inventory: state.inventory,
      log: state.log,
      sim: state.sim,
    });
  }
});

/** Wipes every slice back to its initial state. */
export const resetStore = (): void => {
  const state = useStore.getState();
  state.resetSurvivors();
  state.resetRelationships();
  state.resetInventory();
  state.resetLog();
  state.resetSim();
};

export type { StoreState } from './types';
export type { SurvivorsSlice } from './survivorsSlice';
export type { RelationshipsSlice } from './relationshipsSlice';
export type { InventorySlice } from './inventorySlice';
export type { LogSlice } from './logSlice';
export type { SimSlice } from './simSlice';
