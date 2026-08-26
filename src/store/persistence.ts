import { ABILITY_KEYS } from '@/data/abilities';
import { isItemId } from '@/data/items';
import { isJobId } from '@/data/jobs';
import { isMbtiType } from '@/data/mbti';
import { TRUST_MAX, TRUST_MIN, isRelationshipKind } from '@/data/relationships';
import { STAT_KEYS } from '@/data/stats';
import { isTraitId } from '@/data/traits';
import type {
  Gender,
  InventoryEntry,
  LogEntry,
  LogSeverity,
  Relationship,
  SimPhase,
  SimState,
  Survivor,
  SurvivorAbilities,
  SurvivorStats,
  SurvivorStatus,
} from '@/types';

const STORAGE_KEY = 'outbreak-log:v1';
/**
 * Bumped whenever the saved shape changes. A mismatch is discarded rather than
 * migrated: this is a toy, and a clean start beats a half-read save.
 */
export const SCHEMA_VERSION = 11;

/** Returns the saved payload only when it is a version this build understands. */
const readPayload = (): Record<string, unknown> | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    // Unversioned saves predate the field and are v1, which is no longer read.
    const version = parsed.version === undefined ? 1 : parsed.version;
    if (version !== SCHEMA_VERSION) return null;

    return parsed;
  } catch {
    // Corrupt JSON, or storage blocked entirely. Start clean.
    return null;
  }
};

const GENDERS: readonly Gender[] = ['남성', '여성', '비공개'];
const STATUSES: readonly SurvivorStatus[] = [
  '생존',
  '부상',
  '감염',
  '좀비',
  '사망',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStats = (value: unknown): value is SurvivorStats =>
  isRecord(value) &&
  STAT_KEYS.every((key) => {
    const stat = value[key];
    return typeof stat === 'number' && Number.isFinite(stat);
  });

const isAbilities = (value: unknown): value is SurvivorAbilities =>
  isRecord(value) &&
  ABILITY_KEYS.every((key) => {
    const score = value[key];
    return typeof score === 'number' && Number.isFinite(score);
  });

/**
 * Storage is user-editable and survives across builds, so every field is
 * checked. Anything that fails is dropped rather than crashing the app.
 */
const isSurvivor = (value: unknown): value is Survivor => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (typeof value.name !== 'string' || value.name.length === 0) return false;
  if (!GENDERS.some((gender) => gender === value.gender)) return false;
  // A newborn is 0. The old `> 0` check silently dropped every baby on load.
  if (typeof value.age !== 'number' || value.age < 0) return false;
  if (!isJobId(value.job)) return false;
  if (!isMbtiType(value.mbti)) return false;
  if (!Array.isArray(value.traits) || value.traits.length !== 3) return false;
  if (!value.traits.every(isTraitId)) return false;
  if (!isStats(value.stats)) return false;
  if (!isAbilities(value.abilities)) return false;
  if (!STATUSES.some((status) => status === value.status)) return false;
  if (typeof value.joinedDay !== 'number') return false;
  if (typeof value.alive !== 'boolean') return false;
  if ('diedDay' in value && typeof value.diedDay !== 'number') return false;
  if ('turnedDay' in value && typeof value.turnedDay !== 'number') return false;
  if ('contained' in value && typeof value.contained !== 'boolean') return false;
  if ('pregnantSince' in value && typeof value.pregnantSince !== 'number') {
    return false;
  }
  if ('pregnantBy' in value && typeof value.pregnantBy !== 'string') return false;
  if (
    'pregnancyEndedDay' in value &&
    typeof value.pregnancyEndedDay !== 'number'
  ) {
    return false;
  }
  if ('parentIds' in value) {
    if (!Array.isArray(value.parentIds)) return false;
    if (!value.parentIds.every((id) => typeof id === 'string')) return false;
  }
  return true;
};

const isRelationship = (value: unknown): value is Relationship => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (typeof value.fromId !== 'string' || value.fromId.length === 0) {
    return false;
  }
  if (typeof value.toId !== 'string' || value.toId.length === 0) return false;
  if (value.fromId === value.toId) return false;
  if (!isRelationshipKind(value.kind)) return false;
  if (
    typeof value.trust !== 'number' ||
    !Number.isFinite(value.trust) ||
    value.trust < TRUST_MIN ||
    value.trust > TRUST_MAX
  ) {
    return false;
  }
  if ('note' in value && typeof value.note !== 'string') return false;
  if ('peakTrust' in value && typeof value.peakTrust !== 'number') return false;
  if ('floorTrust' in value && typeof value.floorTrust !== 'number') {
    return false;
  }
  return true;
};

const isInventoryEntry = (value: unknown): value is InventoryEntry => {
  if (!isRecord(value)) return false;
  if (!isItemId(value.itemId)) return false;
  if (
    typeof value.quantity !== 'number' ||
    !Number.isInteger(value.quantity) ||
    value.quantity <= 0
  ) {
    return false;
  }
  if ('assignedTo' in value && typeof value.assignedTo !== 'string') {
    return false;
  }
  return true;
};

const SEVERITIES: readonly LogSeverity[] = [
  'routine',
  'notable',
  'critical',
  'death',
];
const PHASES: readonly SimPhase[] = ['setup', 'running', 'paused', 'ended'];

const isLogEntry = (value: unknown): value is LogEntry => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (typeof value.day !== 'number' || !Number.isFinite(value.day)) return false;
  if (!SEVERITIES.some((severity) => severity === value.severity)) return false;
  if (typeof value.message !== 'string') return false;
  if (!Array.isArray(value.actorIds)) return false;
  if ('speakerId' in value && typeof value.speakerId !== 'string') return false;
  if ('memorialFor' in value && typeof value.memorialFor !== 'string') {
    return false;
  }
  if ('changes' in value) {
    if (!Array.isArray(value.changes)) return false;
    const ok = value.changes.every(
      (change) =>
        isRecord(change) &&
        typeof change.survivorId === 'string' &&
        STAT_KEYS.some((key) => key === change.key) &&
        typeof change.delta === 'number' &&
        Number.isFinite(change.delta),
    );
    if (!ok) return false;
  }
  return value.actorIds.every((id) => typeof id === 'string');
};

const isDeprivation = (
  value: unknown,
): value is Record<string, { food: number; water: number }> => {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.food === 'number' &&
      typeof entry.water === 'number',
  );
};

const isSimState = (value: unknown): value is SimState => {
  if (!isRecord(value)) return false;
  if (typeof value.day !== 'number' || value.day < 0) return false;
  if (!PHASES.some((phase) => phase === value.phase)) return false;
  if (typeof value.tickMs !== 'number' || value.tickMs <= 0) return false;
  if (typeof value.runSeed !== 'number' || !Number.isFinite(value.runSeed)) {
    return false;
  }
  if (typeof value.pureLove !== 'boolean') return false;
  if (!Array.isArray(value.recentEvents)) return false;
  if (!value.recentEvents.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(value.recentChoices)) return false;
  if (!value.recentChoices.every((id) => typeof id === 'string')) return false;
  if (!isDeprivation(value.deprivation)) return false;
  // Anything but null is rebuilt by the next day rather than trusted.
  return value.pendingChoice === null || value.pendingChoice === undefined;
};

const readSection = (
  key: 'survivors' | 'relationships' | 'inventory' | 'log',
): unknown[] => {
  const payload = readPayload();
  if (payload === null) return [];

  const section = payload[key];
  return Array.isArray(section) ? section : [];
};

export const loadSurvivors = (): Survivor[] =>
  readSection('survivors').filter(isSurvivor);

export const loadRelationships = (): Relationship[] =>
  readSection('relationships').filter(isRelationship);

export const loadInventory = (): InventoryEntry[] =>
  readSection('inventory').filter(isInventoryEntry);

export const loadLog = (): LogEntry[] => readSection('log').filter(isLogEntry);

/** null when there is no usable saved run, so the caller seeds a fresh one. */
export const loadSim = (): SimState | null => {
  const payload = readPayload();
  if (payload === null) return null;
  return isSimState(payload.sim) ? payload.sim : null;
};

/**
 * Kept out of the run save on purpose: it is a workshop switch, not part of a
 * playthrough, so it survives a reset and never rides along in an export.
 */
const DEV_KEY = 'outbreak-log:dev';

export const loadDevMode = (): boolean => {
  try {
    return window.localStorage.getItem(DEV_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveDevMode = (enabled: boolean): void => {
  try {
    if (enabled) window.localStorage.setItem(DEV_KEY, '1');
    else window.localStorage.removeItem(DEV_KEY);
  } catch {
    // Dev mode simply will not stick.
  }
};

/** Wipes the saved run. Used by the error boundary's reset. */
export const clearPersistedState = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
};

export interface PersistedState {
  survivors: readonly Survivor[];
  relationships: readonly Relationship[];
  inventory: readonly InventoryEntry[];
  log: readonly LogEntry[];
  sim: SimState;
}

/** Every persisted slice shares one key, so they are always written together. */
export const savePersistedState = (state: PersistedState): void => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        survivors: state.survivors,
        relationships: state.relationships,
        inventory: state.inventory,
        log: state.log,
        sim: state.sim,
      }),
    );
  } catch {
    // Quota exceeded or storage disabled — the run continues in memory.
  }
};

/** True when a readable run is already saved, so a fresh start can be seeded. */
export const hasPersistedRun = (): boolean => readPayload() !== null;
