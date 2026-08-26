import { describe, expect, it } from 'vitest';
import type { LogEntry, LogSeverity, Survivor } from '@/types';
import { ACCENT_BORDER, accentOf, damagedBorder, runDamage } from './damage';

const entry = (
  severity: LogSeverity,
  actorIds: string[] = [],
  id = Math.random().toString(36),
): LogEntry => ({ id, day: 1, severity, message: '테스트', actorIds });

const survivor = (id: string, infection: number): Survivor => ({
  id,
  name: '민수',
  gender: '비공개',
  age: 30,
  job: 'officeWorker',
  mbti: 'INTP',
  traits: [],
  stats: { hp: 100, stamina: 80, hunger: 30, morale: 70, infection },
  abilities: { intellect: 5, endurance: 5, agility: 5, strength: 5, luck: 5 },
  status: '생존',
  joinedDay: 0,
  alive: true,
});

describe('runDamage', () => {
  it('starts clean', () => {
    expect(runDamage([])).toBe(0);
  });

  it('ignores quiet days', () => {
    expect(runDamage([entry('routine'), entry('notable')])).toBe(0);
  });

  it('rises with danger and further with death', () => {
    const danger = runDamage([entry('critical')]);
    const death = runDamage([entry('death')]);
    expect(danger).toBeGreaterThan(0);
    expect(death).toBeGreaterThan(danger);
  });

  it('accumulates across the run', () => {
    const one = runDamage([entry('death')]);
    const three = runDamage([entry('death'), entry('death'), entry('death')]);
    expect(three).toBeGreaterThan(one);
  });

  it('never exceeds 1', () => {
    const many = Array.from({ length: 60 }, () => entry('death'));
    expect(runDamage(many)).toBe(1);
  });
});

describe('accentOf', () => {
  it('marks death above everything else', () => {
    expect(accentOf(entry('death', ['a']), [survivor('a', 100)])).toBe('사망');
  });

  it('marks entries naming an infected survivor', () => {
    expect(accentOf(entry('notable', ['a']), [survivor('a', 20)])).toBe('감염');
  });

  it('falls back to severity when nobody is infected', () => {
    const clean = [survivor('a', 0)];
    expect(accentOf(entry('critical', ['a']), clean)).toBe('위험');
    expect(accentOf(entry('notable', ['a']), clean)).toBe('일반');
    expect(accentOf(entry('routine', ['a']), clean)).toBe('정적');
  });

  it('leaves quiet entries without an accent color', () => {
    expect(ACCENT_BORDER['정적']).toBe('transparent');
  });

  it('uses bile for infection and blood-hot for death only', () => {
    expect(ACCENT_BORDER['감염']).toContain('bile');
    expect(ACCENT_BORDER['사망']).toContain('blood-hot');
  });

  it('tolerates an entry naming someone no longer in the roster', () => {
    expect(accentOf(entry('notable', ['ghost']), [])).toBe('일반');
  });
});

describe('damagedBorder', () => {
  it('is pure oxblood at zero damage', () => {
    expect(damagedBorder(0)).toContain('0%');
  });

  it('shifts toward blood as damage rises', () => {
    expect(damagedBorder(1)).toContain('70%');
  });
});
