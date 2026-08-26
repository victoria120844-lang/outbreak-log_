import type { JobId, MbtiType, Relationship, Survivor, TraitId } from '@/types';

/** Fixed ids so a test can assert on the log without chasing UUIDs. */
export const makeSurvivor = (
  id: string,
  name: string,
  overrides: Partial<Survivor> = {},
): Survivor => ({
  id,
  name,
  gender: '비공개',
  age: 30,
  job: 'officeWorker' as JobId,
  mbti: 'INTP' as MbtiType,
  traits: [] as TraitId[],
  stats: { hp: 100, stamina: 80, hunger: 30, morale: 70, infection: 0 },
  abilities: { intellect: 5, endurance: 5, agility: 5, strength: 5, luck: 5 },
  status: '생존',
  joinedDay: 0,
  alive: true,
  ...overrides,
});

export const makePair = (
  aId: string,
  bId: string,
  trust: number,
): Relationship[] => [
  { id: `${aId}-${bId}`, fromId: aId, toId: bId, kind: '동료', trust },
  { id: `${bId}-${aId}`, fromId: bId, toId: aId, kind: '동료', trust },
];
