import { TRUST_MAX, TRUST_MIN } from '@/data/relationships';
import { clampStat } from '@/data/stats';
import type {
  PendingChoice,
  InventoryEntry,
  LogEntry,
  LogSeverity,
  Relationship,
  RelationshipKind,
  StatChange,
  StatKey,
  Survivor,
  SurvivorStats,
} from '@/types';
import { buildProfile, type ActionProfile } from './profile';

export interface Deprivation {
  /** Consecutive days without a food unit. */
  food: number;
  /** Consecutive days without a water unit. */
  water: number;
}

export interface WorldState {
  day: number;
  /** Replay key. The whole run is reproducible from this plus the day. */
  runSeed: number;
  status: 'running' | 'ended';
  survivors: Survivor[];
  relationships: Relationship[];
  inventory: InventoryEntry[];
  deprivation: Record<string, Deprivation>;
  /** A decision the day stopped on. Nothing advances until it is answered. */
  pendingChoice: PendingChoice | null;
  /**
   * 순애 모드. Nobody carries two romances at once: once a pair is committed,
   * every other bond either of them has stops one rung short. Off, the ladder
   * behaves as it always did and people fall for whoever the day throws at them.
   */
  pureLove: boolean;
  /**
   * Template ids drawn on the last few days, so the draw can steer away from
   * them. Without this the heaviest templates repeated for a week straight.
   */
  recentEvents: string[];
  /** Decision templates drawn recently, for the same reason. */
  recentChoices: string[];
}

export interface CreateWorldInput {
  runSeed: number;
  survivors?: readonly Survivor[];
  relationships?: readonly Relationship[];
  inventory?: readonly InventoryEntry[];
  day?: number;
  pureLove?: boolean;
  recentEvents?: readonly string[];
  recentChoices?: readonly string[];
}

export const createWorld = (input: CreateWorldInput): WorldState => ({
  day: input.day ?? 0,
  runSeed: input.runSeed,
  status: 'running',
  pureLove: input.pureLove ?? true,
  recentEvents: [...(input.recentEvents ?? [])],
  recentChoices: [...(input.recentChoices ?? [])],
  survivors: (input.survivors ?? []).map((survivor) => ({
    ...survivor,
    stats: { ...survivor.stats },
    traits: [...survivor.traits],
  })),
  relationships: (input.relationships ?? []).map((relationship) => ({
    ...relationship,
  })),
  inventory: (input.inventory ?? []).map((entry) => ({ ...entry })),
  pendingChoice: null,
  deprivation: {},
});

/** Working copy for one day. `advanceDay` never mutates the state it is given. */
export interface Draft extends WorldState {
  entries: LogEntry[];
  profiles: Map<string, ActionProfile>;
  /**
   * Namespaces entry ids. A choice is answered on a day that already wrote
   * entries, so without this the two id sequences collide.
   */
  entryPrefix: string;
}

export const createDraft = (state: WorldState): Draft => {
  const survivors = state.survivors.map((survivor) => ({
    ...survivor,
    stats: { ...survivor.stats },
    traits: [...survivor.traits],
  }));

  return {
    ...state,
    survivors,
    relationships: state.relationships.map((relationship) => ({
      ...relationship,
    })),
    inventory: state.inventory.map((entry) => ({ ...entry })),
    recentEvents: [...state.recentEvents],
    recentChoices: [...state.recentChoices],
    deprivation: Object.fromEntries(
      Object.entries(state.deprivation).map(([id, value]) => [id, { ...value }]),
    ),
    entries: [],
    entryPrefix: 'd',
    profiles: new Map(
      survivors.map((survivor) => [survivor.id, buildProfile(survivor)]),
    ),
  };
};

/* ------------------------------------------------------------------ reads */

export const livingSurvivors = (draft: Draft): Survivor[] =>
  draft.survivors.filter((survivor) => survivor.alive);

/**
 * Youngest age the day will hand a job to. Births put actual infants on the
 * roster, and without a floor the log cheerfully reported a newborn prying a
 * shutter open — but the gate is not only for them: registration accepts a
 * one-year-old, and that survivor was fighting hordes too.
 */
export const ACTING_AGE = 10;

/**
 * Everyone old enough to be given something to do. Falls back to the whole
 * group when nobody clears the bar, so a household of small children still has
 * days rather than an empty log.
 */
export const actingSurvivors = (draft: Draft): Survivor[] => {
  const living = livingSurvivors(draft);
  const able = living.filter((survivor) => survivor.age >= ACTING_AGE);
  return able.length > 0 ? able : living;
};

export const profileOf = (draft: Draft, id: string): ActionProfile => {
  const profile = draft.profiles.get(id);
  if (profile) return profile;
  // Only reachable if a survivor is added mid-day, which nothing does.
  return buildProfile({
    id,
    name: '',
    gender: '비공개',
    age: 30,
    job: 'officeWorker',
    mbti: 'ISTJ',
    traits: [],
    stats: { hp: 0, stamina: 0, hunger: 0, morale: 0, infection: 0 },
    abilities: {
      intellect: 5,
      endurance: 5,
      agility: 5,
      strength: 5,
      luck: 5,
    },
    status: '생존',
    joinedDay: 0,
    alive: true,
  });
};

export const quantityOf = (draft: Draft, itemId: string): number =>
  draft.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;

export const trustBetween = (
  draft: Draft,
  fromId: string,
  toId: string,
): number | null =>
  draft.relationships.find(
    (relationship) =>
      relationship.fromId === fromId && relationship.toId === toId,
  )?.trust ?? null;

export const kindBetween = (
  draft: Draft,
  aId: string,
  bId: string,
): RelationshipKind | null =>
  draft.relationships.find(
    (relationship) => relationship.fromId === aId && relationship.toId === bId,
  )?.kind ?? null;

/** Stable key for an unordered pair, so a pair reads the same either way round. */
export const pairKey = (aId: string, bId: string): string =>
  aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;

/* ----------------------------------------------------------------- writes */

export const adjustStats = (
  draft: Draft,
  survivorId: string,
  deltas: Partial<Record<StatKey, number>>,
): void => {
  const survivor = draft.survivors.find((entry) => entry.id === survivorId);
  if (!survivor) return;

  (Object.keys(deltas) as StatKey[]).forEach((key) => {
    survivor.stats[key] += deltas[key] ?? 0;
  });
};

export const changeItem = (
  draft: Draft,
  itemId: string,
  amount: number,
): void => {
  const existing = draft.inventory.find((entry) => entry.itemId === itemId);
  if (!existing) {
    if (amount > 0) draft.inventory.push({ itemId, quantity: amount });
    return;
  }

  const next = Math.max(0, existing.quantity + amount);
  if (next === 0) {
    draft.inventory = draft.inventory.filter((entry) => entry.itemId !== itemId);
    return;
  }
  existing.quantity = next;
};

export const adjustTrust = (
  draft: Draft,
  aId: string,
  bId: string,
  delta: number,
): void => {
  draft.relationships.forEach((relationship) => {
    const matches =
      (relationship.fromId === aId && relationship.toId === bId) ||
      (relationship.fromId === bId && relationship.toId === aId);
    if (!matches) return;
    relationship.trust = Math.min(
      TRUST_MAX,
      Math.max(TRUST_MIN, relationship.trust + delta),
    );
  });
};

/** Forces both directions of a pair to one value. */
export const setTrust = (
  draft: Draft,
  aId: string,
  bId: string,
  value: number,
): void => {
  const settled = Math.min(TRUST_MAX, Math.max(TRUST_MIN, Math.round(value)));
  draft.relationships.forEach((relationship) => {
    const matches =
      (relationship.fromId === aId && relationship.toId === bId) ||
      (relationship.fromId === bId && relationship.toId === aId);
    if (matches) relationship.trust = settled;
  });
};

/** Holds both directions at or below a ceiling without moving them otherwise. */
export const capTrust = (
  draft: Draft,
  aId: string,
  bId: string,
  ceiling: number,
): void => {
  draft.relationships.forEach((relationship) => {
    const matches =
      (relationship.fromId === aId && relationship.toId === bId) ||
      (relationship.fromId === bId && relationship.toId === aId);
    if (matches && relationship.trust > ceiling) relationship.trust = ceiling;
  });
};

/** Relabels both directions of a pair — what they are, not how much they trust. */
export const setKind = (
  draft: Draft,
  aId: string,
  bId: string,
  kind: RelationshipKind,
): void => {
  draft.relationships.forEach((relationship) => {
    const matches =
      (relationship.fromId === aId && relationship.toId === bId) ||
      (relationship.fromId === bId && relationship.toId === aId);
    if (matches) relationship.kind = kind;
  });
};

/* ------------------------------------------------------ reporting the cost */

/**
 * Keys the log reports on. Hunger and infection are left out on purpose: both
 * already have their own sentences and their own bars, and adding them here
 * turned every line into a spreadsheet row.
 */
const REPORTED_KEYS: readonly StatKey[] = ['hp', 'stamina', 'morale'];

/** At most this many deltas hang off one entry; the rest are dropped. */
const MAX_REPORTED = 6;

export type StatSnapshot = Map<string, SurvivorStats>;

export const snapshotStats = (draft: Draft): StatSnapshot =>
  new Map(draft.survivors.map((survivor) => [survivor.id, { ...survivor.stats }]));

/**
 * What actually moved. Read against a snapshot taken before the effects ran,
 * so it reports the real number after every modifier — which is the point: a
 * player watching hp fall with no explanation is the complaint this answers.
 */
export const diffStats = (
  draft: Draft,
  before: StatSnapshot,
): StatChange[] => {
  const changes: StatChange[] = [];

  draft.survivors.forEach((survivor) => {
    const previous = before.get(survivor.id);
    if (!previous) return;

    REPORTED_KEYS.forEach((key) => {
      // Stats are clamped to 0-100 later, so read the clamped value here too
      // or the log reports damage that never landed.
      const from = clampStat(previous[key]);
      const to = clampStat(survivor.stats[key]);
      const delta = to - from;
      if (delta === 0) return;
      changes.push({ survivorId: survivor.id, key, delta });
    });
  });

  return changes.slice(0, MAX_REPORTED);
};

/** Hangs the deltas off the entry that was written for them. */
export const attachChanges = (
  draft: Draft,
  entryIndex: number,
  changes: readonly StatChange[],
): void => {
  const entry = draft.entries[entryIndex];
  if (!entry || changes.length === 0) return;
  entry.changes = [...changes];
};

/**
 * Applies something and writes down what it cost, in one move. Every caller
 * that used to apply-then-narrate now goes through here.
 */
export const reportingChanges = (draft: Draft, apply: () => void): void => {
  const before = snapshotStats(draft);
  const firstEntry = draft.entries.length;
  apply();
  attachChanges(draft, firstEntry, diffStats(draft, before));
};

export const addEntry = (
  draft: Draft,
  severity: LogSeverity,
  message: string,
  actorIds: readonly string[] = [],
): void => {
  draft.entries.push({
    // Deterministic so a replayed run produces identical ids.
    id: `${draft.entryPrefix}${draft.day}-${draft.entries.length}`,
    day: draft.day,
    severity,
    message,
    actorIds: [...actorIds],
  });
};

/**
 * A line someone actually says. Kept separate from narration so the log can
 * render it as speech and so a run reads as people, not as a report.
 */
export const addDialogue = (
  draft: Draft,
  speakerId: string,
  message: string,
): void => {
  draft.entries.push({
    id: `${draft.entryPrefix}${draft.day}-${draft.entries.length}`,
    day: draft.day,
    severity: 'routine',
    message,
    actorIds: [speakerId],
    speakerId,
  });
};

export const killSurvivor = (draft: Draft, survivorId: string): void => {
  const survivor = draft.survivors.find((entry) => entry.id === survivorId);
  if (!survivor || !survivor.alive) return;
  survivor.alive = false;
  survivor.status = '사망';
  survivor.diedDay = draft.day;
};

export const clampAllStats = (draft: Draft): void => {
  draft.survivors.forEach((survivor) => {
    (Object.keys(survivor.stats) as StatKey[]).forEach((key) => {
      survivor.stats[key] = clampStat(survivor.stats[key]);
    });
  });
};
