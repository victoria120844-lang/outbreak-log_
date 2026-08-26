import { ITEMS, getItem } from '@/data/items';
import type { InventoryEntry, ItemCategory } from '@/types';

export interface SupplyRoll {
  itemId: string;
  quantity: number;
}

const MIN_PICKS = 3;
const MAX_PICKS = 6;
const MAX_UNITS_PER_PICK = 3;

/** Injectable RNG so a roll can be reproduced in tests. */
export type Random = () => number;

const pickWeighted = (random: Random): string => {
  const total = ITEMS.reduce((sum, item) => sum + item.rarity, 0);
  let cursor = random() * total;
  for (const item of ITEMS) {
    cursor -= item.rarity;
    if (cursor < 0) return item.id;
  }
  // Only reachable through floating point drift on the last item.
  return ITEMS[ITEMS.length - 1]?.id ?? '';
};

/** 3-6 draws, merged so one item never appears as two cards. */
export const rollSupply = (random: Random = Math.random): SupplyRoll[] => {
  const picks =
    MIN_PICKS + Math.floor(random() * (MAX_PICKS - MIN_PICKS + 1));
  const merged = new Map<string, number>();

  for (let index = 0; index < picks; index += 1) {
    const itemId = pickWeighted(random);
    if (itemId === '') continue;
    const quantity = 1 + Math.floor(random() * MAX_UNITS_PER_PICK);
    merged.set(itemId, (merged.get(itemId) ?? 0) + quantity);
  }

  return Array.from(merged, ([itemId, quantity]) => ({ itemId, quantity }));
};

/* ------------------------------------------------------------------ summary */

export interface InventorySummary {
  totalWeight: number;
  /** null when nobody is alive to feed. */
  foodDays: number | null;
  waterDays: number | null;
  isCritical: boolean;
}

const CRITICAL_DAYS = 2;

const sumUnits = (
  entries: readonly InventoryEntry[],
  read: (itemId: string) => number,
): number =>
  entries.reduce((sum, entry) => sum + entry.quantity * read(entry.itemId), 0);

export const summarize = (
  entries: readonly InventoryEntry[],
  livingCount: number,
): InventorySummary => {
  const totalWeight = sumUnits(entries, (id) => getItem(id)?.weight ?? 0);
  const foodUnits = sumUnits(entries, (id) => getItem(id)?.payload.foodDays ?? 0);
  const waterUnits = sumUnits(
    entries,
    (id) => getItem(id)?.payload.waterDays ?? 0,
  );

  if (livingCount <= 0) {
    return { totalWeight, foodDays: null, waterDays: null, isCritical: false };
  }

  const foodDays = Math.floor(foodUnits / livingCount);
  const waterDays = Math.floor(waterUnits / livingCount);

  return {
    totalWeight,
    foodDays,
    waterDays,
    isCritical: foodDays < CRITICAL_DAYS || waterDays < CRITICAL_DAYS,
  };
};

/* ------------------------------------------------------------------ filters */

export const quantityOf = (
  entries: readonly InventoryEntry[],
  itemId: string,
): number =>
  entries.find((entry) => entry.itemId === itemId)?.quantity ?? 0;

export const assignmentOf = (
  entries: readonly InventoryEntry[],
  itemId: string,
): string | null =>
  entries.find((entry) => entry.itemId === itemId)?.assignedTo ?? null;

/** Held units per category, plus a 전체 total, for the filter badges. */
export const countByCategory = (
  entries: readonly InventoryEntry[],
): Record<ItemCategory | '전체', number> => {
  const counts: Record<ItemCategory | '전체', number> = {
    전체: 0,
    식량: 0,
    의료: 0,
    무기: 0,
    도구: 0,
    특수: 0,
  };

  entries.forEach((entry) => {
    const item = getItem(entry.itemId);
    if (!item) return;
    counts[item.category] += entry.quantity;
    counts['전체'] += entry.quantity;
  });

  return counts;
};

export const formatWeight = (weight: number): string =>
  `${weight.toFixed(1)}kg`;
