import type { InventorySlice } from './inventorySlice';
import type { LogSlice } from './logSlice';
import type { RelationshipsSlice } from './relationshipsSlice';
import type { SimSlice } from './simSlice';
import type { SurvivorsSlice } from './survivorsSlice';

/** The single store: one object composed from per-domain slices. */
export type StoreState = SurvivorsSlice &
  RelationshipsSlice &
  InventorySlice &
  LogSlice &
  SimSlice;
