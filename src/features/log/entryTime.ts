import type { LogEntry } from '@/types';

const DAY_START_MINUTES = 6 * 60 + 12;
const DAY_END_MINUTES = 23 * 60 + 55;

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Entries carry no clock, but a day reads better with one. Times are spread
 * across the waking hours in order, so they are stable for a given day and a
 * long day visibly fills up.
 */
export const timesForDay = (count: number): string[] => {
  if (count <= 0) return [];

  const span = DAY_END_MINUTES - DAY_START_MINUTES;
  return Array.from({ length: count }, (_, index) => {
    const position = count === 1 ? 0.35 : index / (count - 1);
    const minutes = Math.round(DAY_START_MINUTES + span * position);
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  });
};

export interface DayGroup {
  day: number;
  entries: LogEntry[];
  times: string[];
}

export const groupByDay = (entries: readonly LogEntry[]): DayGroup[] => {
  const groups: DayGroup[] = [];

  entries.forEach((entry) => {
    const last = groups[groups.length - 1];
    if (last && last.day === entry.day) {
      last.entries.push(entry);
      return;
    }
    groups.push({ day: entry.day, entries: [entry], times: [] });
  });

  groups.forEach((group) => {
    group.times = timesForDay(group.entries.length);
  });

  return groups;
};
