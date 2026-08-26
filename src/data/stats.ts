import type { StatKey, SurvivorStats } from '@/types';

export const STAT_KEYS: readonly StatKey[] = [
  'hp',
  'stamina',
  'hunger',
  'morale',
  'infection',
];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: '체력',
  stamina: '기력',
  hunger: '허기',
  morale: '정신력',
  infection: '감염',
};

/** Bars every card shows. Infection is drawn separately, only above zero. */
export const CARD_STAT_KEYS: readonly StatKey[] = [
  'hp',
  'stamina',
  'hunger',
  'morale',
];

/** Starting values for a freshly registered survivor. */
export const BASE_STATS: SurvivorStats = {
  hp: 100,
  stamina: 80,
  hunger: 30,
  morale: 70,
  infection: 0,
};

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export const clampStat = (value: number): number =>
  Math.round(Math.min(STAT_MAX, Math.max(STAT_MIN, value)));
