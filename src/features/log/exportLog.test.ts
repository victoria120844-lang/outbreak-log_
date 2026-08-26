import { describe, expect, it } from 'vitest';
import type { LogEntry, Survivor } from '@/types';
import { buildSummary } from './exportLog';

const survivor = (id: string, alive: boolean): Survivor => ({
  id,
  name: id,
  gender: '비공개',
  age: 30,
  job: 'officeWorker',
  mbti: 'INTP',
  traits: [],
  stats: { hp: 100, stamina: 80, hunger: 30, morale: 70, infection: 0 },
  abilities: { intellect: 5, endurance: 5, agility: 5, strength: 5, luck: 5 },
  status: alive ? '생존' : '사망',
  joinedDay: 0,
  alive,
});

const entry = (message: string): LogEntry => ({
  id: message,
  day: 7,
  severity: 'routine',
  message,
  actorIds: [],
});

describe('buildSummary', () => {
  it('leads with the seed so a run can be replayed', () => {
    const text = buildSummary({
      runSeed: 4242,
      day: 12,
      survivors: [survivor('a', true)],
      log: [entry('아무 일도 없었다.')],
    });

    expect(text).toContain('시드 4242');
    expect(text).toContain('OUTBREAK LOG');
  });

  it('counts the living against the whole roster', () => {
    const text = buildSummary({
      runSeed: 1,
      day: 9,
      survivors: [survivor('a', true), survivor('b', false)],
      log: [entry('끝')],
    });

    expect(text).toContain('9일 생존');
    expect(text).toContain('1명 / 2명');
  });

  it('quotes the final line of the log', () => {
    const text = buildSummary({
      runSeed: 1,
      day: 2,
      survivors: [survivor('a', true)],
      log: [entry('첫째 날'), entry('마지막 줄')],
    });

    expect(text).toContain('"마지막 줄"');
    expect(text).not.toContain('첫째 날');
  });

  it('stays readable with an empty log', () => {
    const text = buildSummary({
      runSeed: 1,
      day: 0,
      survivors: [],
      log: [],
    });

    expect(text).toContain('기록 없음');
    expect(text).toContain('0명 / 0명');
  });

  it('fits in four short lines', () => {
    const text = buildSummary({
      runSeed: 777,
      day: 30,
      survivors: [survivor('a', true)],
      log: [entry('끝')],
    });

    expect(text.split('\n')).toHaveLength(4);
  });
});
