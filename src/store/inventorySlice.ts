import type { StateCreator } from 'zustand';
import { STARTER_SUPPLIES, getItem } from '@/data/items';
import { clampStat } from '@/data/stats';
import { chooseParticle } from '@/features/simulation';
import type { InventoryEntry, LogEntry, StatKey } from '@/types';
import { MAX_LOG_ENTRIES } from './logSlice';
import {
  hasPersistedRun,
  loadDevMode,
  loadInventory,
  saveDevMode,
} from './persistence';
import type { StoreState } from './types';

export interface InventorySlice {
  inventory: InventoryEntry[];
  /** Unlocks hand-editing the shelf. Off, supplies only come from the world. */
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  /** Negative amounts consume; entries hitting zero are dropped. */
  changeQuantity: (itemId: string, amount: number) => void;
  /** Merges a batch, used by manual add and random supply alike. */
  addItems: (additions: ReadonlyArray<{ itemId: string; quantity: number }>) => void;
  /** `null` returns the item to the shared pool. */
  assignItem: (itemId: string, survivorId: string | null) => void;
  /** Spends one unit on a named survivor and writes it to the log. */
  useItemOn: (itemId: string, survivorId: string) => void;
  resetInventory: () => void;
}

const mergeInto = (
  entries: readonly InventoryEntry[],
  itemId: string,
  amount: number,
): InventoryEntry[] => {
  const existing = entries.find((entry) => entry.itemId === itemId);
  if (!existing) {
    return amount > 0 ? [...entries, { itemId, quantity: amount }] : [...entries];
  }

  const next = Math.max(0, existing.quantity + amount);
  if (next === 0) {
    return entries.filter((entry) => entry.itemId !== itemId);
  }
  return entries.map((entry) =>
    entry.itemId === itemId ? { ...entry, quantity: next } : entry,
  );
};

export const createInventorySlice: StateCreator<
  StoreState,
  [],
  [],
  InventorySlice
> = (set, get) => ({
  // No save at all means a brand-new run, which starts stocked.
  inventory: hasPersistedRun()
    ? loadInventory()
    : STARTER_SUPPLIES.map((supply) => ({ ...supply })),
  devMode: loadDevMode(),

  setDevMode: (enabled) => {
    saveDevMode(enabled);
    set({ devMode: enabled });
  },

  changeQuantity: (itemId, amount) =>
    set((state) => ({ inventory: mergeInto(state.inventory, itemId, amount) })),

  addItems: (additions) =>
    set((state) => ({
      inventory: additions.reduce(
        (entries, addition) =>
          mergeInto(entries, addition.itemId, addition.quantity),
        state.inventory,
      ),
    })),

  assignItem: (itemId, survivorId) =>
    set((state) => ({
      inventory: state.inventory.map((entry) => {
        if (entry.itemId !== itemId) return entry;
        if (survivorId === null) {
          // Rebuilt without the key: `assignedTo: undefined` is not the same
          // thing under exactOptionalPropertyTypes.
          return { itemId: entry.itemId, quantity: entry.quantity };
        }
        return { ...entry, assignedTo: survivorId };
      }),
    })),

  useItemOn: (itemId, survivorId) => {
    const state = get();
    const item = getItem(itemId);
    const deltas = item?.payload.stats;
    if (!item || !deltas) return;

    const survivor = state.survivors.find((entry) => entry.id === survivorId);
    if (!survivor || !survivor.alive) return;
    if (
      (state.inventory.find((entry) => entry.itemId === itemId)?.quantity ??
        0) <= 0
    ) {
      return;
    }

    const stats = { ...survivor.stats };
    (Object.keys(deltas) as StatKey[]).forEach((key) => {
      stats[key] = clampStat(stats[key] + (deltas[key] ?? 0));
    });

    const name = survivor.name;
    const message =
      `${name}${chooseParticle(name, '가')} ${item.name}${chooseParticle(item.name, '를')} 썼다. ` +
      `${item.effect}.`;

    set({
      inventory: mergeInto(state.inventory, itemId, -1),
      survivors: state.survivors.map((entry) =>
        entry.id === survivorId ? { ...entry, stats } : entry,
      ),
      log: [
        ...state.log,
        {
          // `u` keeps player actions from colliding with the day's own ids.
          id: `u${state.sim.day}-${state.log.length}`,
          day: state.sim.day,
          severity: 'notable',
          message,
          actorIds: [survivorId],
        } satisfies LogEntry,
      ].slice(-MAX_LOG_ENTRIES),
    });
  },

  // A fresh run starts stocked; an emptied one stays empty.
  resetInventory: () => set({ inventory: STARTER_SUPPLIES.map((s) => ({ ...s })) }),
});
