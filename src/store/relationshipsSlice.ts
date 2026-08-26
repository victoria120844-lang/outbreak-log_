import type { StateCreator } from 'zustand';
import { clampTrust } from '@/data/relationships';
import { createPair, hasPair } from '@/features/relationships/pairs';
import type { Relationship } from '@/types';
import { loadRelationships } from './persistence';
import type { StoreState } from './types';

export type RelationshipPatch = Partial<
  Pick<Relationship, 'kind' | 'trust' | 'note'>
>;

export interface RelationshipsSlice {
  relationships: Relationship[];
  setRelationships: (next: Relationship[]) => void;
  updateRelationship: (id: string, patch: RelationshipPatch) => void;
  /** Applies the same patch to both directions of a pair. */
  updatePair: (forwardId: string, backwardId: string, patch: RelationshipPatch) => void;
  addRelationshipPair: (aId: string, bId: string) => void;
  resetRelationships: () => void;
}

const patchOne = (
  relationship: Relationship,
  patch: RelationshipPatch,
): Relationship => {
  const next = { ...relationship, ...patch };
  return patch.trust === undefined
    ? next
    : { ...next, trust: clampTrust(patch.trust) };
};

export const createRelationshipsSlice: StateCreator<
  StoreState,
  [],
  [],
  RelationshipsSlice
> = (set) => ({
  relationships: loadRelationships(),

  setRelationships: (next) => set({ relationships: next }),

  updateRelationship: (id, patch) =>
    set((state) => ({
      relationships: state.relationships.map((relationship) =>
        relationship.id === id ? patchOne(relationship, patch) : relationship,
      ),
    })),

  updatePair: (forwardId, backwardId, patch) =>
    set((state) => ({
      relationships: state.relationships.map((relationship) =>
        relationship.id === forwardId || relationship.id === backwardId
          ? patchOne(relationship, patch)
          : relationship,
      ),
    })),

  addRelationshipPair: (aId, bId) =>
    set((state) => {
      if (aId === bId || hasPair(state.relationships, aId, bId)) {
        return { relationships: state.relationships };
      }
      return {
        relationships: [...state.relationships, ...createPair(aId, bId)],
      };
    }),

  resetRelationships: () => set({ relationships: [] }),
});
