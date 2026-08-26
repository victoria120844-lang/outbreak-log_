import { DEFAULT_KIND, KIND_DEFAULT_TRUST } from '@/data/relationships';
import type { Relationship, Survivor } from '@/types';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/** Both directions of a new pair, prefilled 초면 / 신뢰 0. */
export const createPair = (aId: string, bId: string): Relationship[] => [
  {
    id: createId(),
    fromId: aId,
    toId: bId,
    kind: DEFAULT_KIND,
    trust: KIND_DEFAULT_TRUST[DEFAULT_KIND],
  },
  {
    id: createId(),
    fromId: bId,
    toId: aId,
    kind: DEFAULT_KIND,
    trust: KIND_DEFAULT_TRUST[DEFAULT_KIND],
  },
];

const pairKey = (aId: string, bId: string): string =>
  aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;

export const hasPair = (
  relationships: readonly Relationship[],
  aId: string,
  bId: string,
): boolean => {
  const key = pairKey(aId, bId);
  return relationships.some(
    (relationship) => pairKey(relationship.fromId, relationship.toId) === key,
  );
};

/**
 * Staging for newly registered survivors: one row against every survivor that
 * was already in the group. Existing pairs are left untouched.
 */
export const stagePairsFor = (
  addedIds: readonly string[],
  allIds: readonly string[],
  current: readonly Relationship[],
): Relationship[] => {
  const staged: Relationship[] = [];
  const added = new Set(addedIds);

  addedIds.forEach((newId) => {
    allIds.forEach((otherId) => {
      if (otherId === newId) return;
      // Two new survivors in one batch would otherwise be paired twice.
      if (added.has(otherId) && otherId < newId) return;
      if (hasPair(current, newId, otherId)) return;
      if (hasPair(staged, newId, otherId)) return;
      staged.push(...createPair(otherId, newId));
    });
  });

  return staged;
};

export const pruneRelationships = (
  relationships: readonly Relationship[],
  survivorIds: readonly string[],
): Relationship[] => {
  const alive = new Set(survivorIds);
  return relationships.filter(
    (relationship) =>
      alive.has(relationship.fromId) && alive.has(relationship.toId),
  );
};

export interface RelationshipPair {
  key: string;
  a: Survivor;
  b: Survivor;
  /** a -> b */
  forward: Relationship;
  /** b -> a */
  backward: Relationship;
  /** The two directions disagree, so the row is no longer mirrored. */
  isAsymmetric: boolean;
  /** One of the two is dead: the row is read-only. */
  isClosed: boolean;
}

/**
 * Groups the directional rows into pairs. `a` is always the survivor
 * registered first, so a pair reads the same way every render.
 */
export const buildPairs = (
  survivors: readonly Survivor[],
  relationships: readonly Relationship[],
): RelationshipPair[] => {
  const order = new Map<string, number>();
  const byId = new Map<string, Survivor>();
  survivors.forEach((survivor, index) => {
    order.set(survivor.id, index);
    byId.set(survivor.id, survivor);
  });

  const directed = new Map<string, Relationship>();
  relationships.forEach((relationship) => {
    directed.set(`${relationship.fromId}->${relationship.toId}`, relationship);
  });

  const pairs: RelationshipPair[] = [];
  const seen = new Set<string>();

  relationships.forEach((relationship) => {
    const fromOrder = order.get(relationship.fromId);
    const toOrder = order.get(relationship.toId);
    if (fromOrder === undefined || toOrder === undefined) return;

    const aId = fromOrder <= toOrder ? relationship.fromId : relationship.toId;
    const bId = fromOrder <= toOrder ? relationship.toId : relationship.fromId;
    const key = `${aId}|${bId}`;
    if (seen.has(key)) return;

    const a = byId.get(aId);
    const b = byId.get(bId);
    const forward = directed.get(`${aId}->${bId}`);
    const backward = directed.get(`${bId}->${aId}`);
    if (!a || !b || !forward || !backward) return;

    seen.add(key);
    pairs.push({
      key,
      a,
      b,
      forward,
      backward,
      isAsymmetric:
        forward.kind !== backward.kind || forward.trust !== backward.trust,
      isClosed: !a.alive || !b.alive,
    });
  });

  return pairs.sort((left, right) => {
    const leftA = order.get(left.a.id) ?? 0;
    const rightA = order.get(right.a.id) ?? 0;
    if (leftA !== rightA) return leftA - rightA;
    return (order.get(left.b.id) ?? 0) - (order.get(right.b.id) ?? 0);
  });
};
