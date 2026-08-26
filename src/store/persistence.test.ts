import { beforeEach, describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  clearPersistedState,
  loadInventory,
  loadLog,
  loadSim,
  loadSurvivors,
  savePersistedState,
} from './persistence';

const KEY = 'outbreak-log:v1';

const write = (payload: unknown): void => {
  window.localStorage.setItem(KEY, JSON.stringify(payload));
};

const survivor = {
  id: 'a',
  name: '민수',
  gender: '비공개',
  age: 30,
  job: 'officeWorker',
  mbti: 'INTP',
  traits: ['cautious', 'marksman', 'liar'],
  stats: { hp: 100, stamina: 80, hunger: 30, morale: 70, infection: 0 },
  abilities: { intellect: 5, endurance: 5, agility: 5, strength: 5, luck: 5 },
  status: '생존',
  joinedDay: 0,
  alive: true,
};

const sim = {
  day: 3,
  phase: 'paused',
  tickMs: 2500,
  runSeed: 42,
  deprivation: {},
  pendingChoice: null,
  pureLove: true,
  recentEvents: ['quietNothing'],
  recentChoices: ['lockedPharmacy'],
};

describe('schema version guard', () => {
  beforeEach(() => {
    clearPersistedState();
  });

  it('reads a save written by this build', () => {
    write({ version: SCHEMA_VERSION, survivors: [survivor], sim });
    expect(loadSurvivors()).toHaveLength(1);
    expect(loadSim()?.day).toBe(3);
  });

  it('discards a save from a future schema', () => {
    write({ version: SCHEMA_VERSION + 1, survivors: [survivor], sim });
    expect(loadSurvivors()).toHaveLength(0);
    expect(loadSim()).toBeNull();
  });

  it('discards a save from an older schema', () => {
    write({ version: 0, survivors: [survivor], sim });
    expect(loadSurvivors()).toHaveLength(0);
  });

  it('discards an unversioned save, which predates the version field', () => {
    write({ survivors: [survivor] });
    expect(loadSurvivors()).toHaveLength(0);
  });

  it('discards a v4 roster, whose survivors have no 능력치', () => {
    const { abilities: _abilities, ...withoutAbilities } = survivor;
    write({ version: 4, survivors: [withoutAbilities] });
    expect(loadSurvivors()).toHaveLength(0);
  });

  it('rejects a survivor with an unknown 직업', () => {
    write({
      version: SCHEMA_VERSION,
      survivors: [{ ...survivor, job: 'astronaut' }],
    });
    expect(loadSurvivors()).toHaveLength(0);
  });

  it('survives malformed JSON', () => {
    window.localStorage.setItem(KEY, '{ not json');
    expect(loadSurvivors()).toHaveLength(0);
    expect(loadLog()).toHaveLength(0);
    expect(loadInventory()).toHaveLength(0);
    expect(loadSim()).toBeNull();
  });

  it('survives a payload that is not an object', () => {
    write(['nope']);
    expect(loadSurvivors()).toHaveLength(0);
    expect(loadSim()).toBeNull();
  });

  it('writes the current version back out', () => {
    savePersistedState({
      survivors: [],
      relationships: [],
      inventory: [],
      log: [],
      sim,
    });

    const raw = window.localStorage.getItem(KEY) ?? '{}';
    expect(JSON.parse(raw).version).toBe(SCHEMA_VERSION);
  });

  it('clears everything on demand', () => {
    write({ version: SCHEMA_VERSION, survivors: [survivor] });
    clearPersistedState();
    expect(loadSurvivors()).toHaveLength(0);
  });
});
