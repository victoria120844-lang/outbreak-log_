import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@/types';
import { groupByDay, timesForDay } from './entryTime';

const entry = (id: string, day: number): LogEntry => ({
  id,
  day,
  severity: 'routine',
  message: '테스트',
  actorIds: [],
});

describe('timesForDay', () => {
  it('returns nothing for an empty day', () => {
    expect(timesForDay(0)).toEqual([]);
  });

  it('formats as HH:MM', () => {
    timesForDay(5).forEach((time) => {
      expect(/^\d{2}:\d{2}$/.test(time)).toBe(true);
    });
  });

  it('runs in order across the waking hours', () => {
    const times = timesForDay(6);
    expect(times[0]).toBe('06:12');
    expect(times[times.length - 1]).toBe('23:55');
    for (let index = 1; index < times.length; index += 1) {
      expect((times[index] ?? '') > (times[index - 1] ?? '')).toBe(true);
    }
  });

  it('places a lone entry inside the day rather than at dawn', () => {
    const [only] = timesForDay(1);
    expect(only).not.toBe('06:12');
    expect(only).not.toBe('23:55');
  });

  it('is stable for the same count', () => {
    expect(timesForDay(4)).toEqual(timesForDay(4));
  });
});

describe('groupByDay', () => {
  it('groups consecutive entries under one day', () => {
    const groups = groupByDay([
      entry('a', 1),
      entry('b', 1),
      entry('c', 2),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.day).toBe(1);
    expect(groups[0]?.entries).toHaveLength(2);
    expect(groups[1]?.entries).toHaveLength(1);
  });

  it('gives each group a time per entry', () => {
    const groups = groupByDay([entry('a', 1), entry('b', 1)]);
    expect(groups[0]?.times).toHaveLength(2);
  });

  it('handles an empty log', () => {
    expect(groupByDay([])).toEqual([]);
  });
});
