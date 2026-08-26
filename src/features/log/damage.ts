import type { LogEntry, Survivor } from '@/types';

/** What a single entry adds to the panel's accumulated damage. */
const DEATH_WEIGHT = 0.18;
const DANGER_WEIGHT = 0.04;

/**
 * 0 at the start of a run, 1 once the panel is thoroughly ruined. Derived from
 * the log rather than stored, so it survives a reload for free.
 */
export const runDamage = (entries: readonly LogEntry[]): number => {
  const total = entries.reduce((sum, entry) => {
    if (entry.severity === 'death') return sum + DEATH_WEIGHT;
    if (entry.severity === 'critical') return sum + DANGER_WEIGHT;
    return sum;
  }, 0);
  return Math.min(1, total);
};

export type EntryAccent = '정적' | '일반' | '위험' | '사망' | '감염';

/**
 * The engine does not tag entries by category, and it is not ours to change,
 * so infection is read off the people the entry names.
 */
export const accentOf = (
  entry: LogEntry,
  survivors: readonly Survivor[],
): EntryAccent => {
  if (entry.severity === 'death') return '사망';

  const touchesInfected = entry.actorIds.some((id) => {
    const survivor = survivors.find((candidate) => candidate.id === id);
    return survivor !== undefined && survivor.stats.infection > 0;
  });
  if (touchesInfected) return '감염';

  if (entry.severity === 'critical') return '위험';
  if (entry.severity === 'notable') return '일반';
  return '정적';
};

export const ACCENT_BORDER: Record<EntryAccent, string> = {
  정적: 'transparent',
  일반: 'var(--fog)',
  위험: 'var(--blood)',
  사망: 'var(--blood-hot)',
  감염: 'var(--bile)',
};

/** Border creeps from dried blood toward fresh as the run goes wrong. */
export const damagedBorder = (damage: number): string =>
  `color-mix(in srgb, var(--blood) ${Math.round(damage * 70)}%, var(--oxblood))`;
