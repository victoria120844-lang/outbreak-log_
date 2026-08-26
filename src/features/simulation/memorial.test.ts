import { describe, expect, it } from 'vitest';
import { GRIEF_LINES, memorialLinesFor } from '@/data/memorial';
import { addressOf } from './address';
import { runGrief, runMemorial } from './memorial';
import { mulberry32 } from './rng';
import { createDraft, createWorld, killSurvivor } from './state';
import { makePair, makeSurvivor } from './testUtils';

describe('addressOf', () => {
  const younger = makeSurvivor('a', '민수', { age: 24, gender: '남성' });

  it('uses sibling terms for someone older', () => {
    expect(
      addressOf(younger, makeSurvivor('b', '현우', { age: 31, gender: '남성' })),
    ).toBe('형');
    expect(
      addressOf(younger, makeSurvivor('b', '지연', { age: 31, gender: '여성' })),
    ).toBe('누나');

    const she = makeSurvivor('a', '서윤', { age: 24, gender: '여성' });
    expect(
      addressOf(she, makeSurvivor('b', '현우', { age: 31, gender: '남성' })),
    ).toBe('오빠');
    expect(
      addressOf(she, makeSurvivor('b', '지연', { age: 31, gender: '여성' })),
    ).toBe('언니');
  });

  it('uses plain names between peers', () => {
    expect(
      addressOf(younger, makeSurvivor('b', '현우', { age: 25 })),
    ).toBe('현우');
  });

  it('uses plain names for someone younger', () => {
    expect(
      addressOf(younger, makeSurvivor('b', '현우', { age: 18 })),
    ).toBe('현우');
  });

  it('defers to someone a generation older', () => {
    expect(
      addressOf(younger, makeSurvivor('b', '현우', { age: 60 })),
    ).toContain('선생님');
  });

  it('falls back to something neutral when gender is withheld', () => {
    expect(
      addressOf(younger, makeSurvivor('b', '현우', { age: 33, gender: '비공개' })),
    ).toContain('선배');
  });
});

describe('memorialLinesFor', () => {
  it('says something different depending on how close they were', () => {
    const loved = memorialLinesFor(120);
    const stranger = memorialLinesFor(5);
    const enemy = memorialLinesFor(-80);

    expect(loved).not.toEqual(stranger);
    expect(stranger).not.toEqual(enemy);
    expect(loved.length).toBeGreaterThan(0);
    expect(enemy.length).toBeGreaterThan(0);
  });
});

const draftWithLoss = (trust: number) => {
  const draft = createDraft(
    createWorld({
      runSeed: 1,
      survivors: [
        makeSurvivor('a', '민수', { age: 24 }),
        makeSurvivor('b', '지연', { age: 31 }),
      ],
      relationships: makePair('a', 'b', trust),
    }),
  );
  draft.day = 5;
  killSurvivor(draft, 'b');
  return draft;
};

describe('runMemorial', () => {
  it('has the living speak about the one who was lost', () => {
    const draft = draftWithLoss(70);
    runMemorial(draft, ['b'], mulberry32(2));

    expect(draft.entries).toHaveLength(1);
    expect(draft.entries[0]?.memorialFor).toBe('b');
    expect(draft.entries[0]?.speakerId).toBe('a');
    expect(draft.entries[0]?.severity).toBe('death');
  });

  it('leaves no template slots in what is said', () => {
    const draft = draftWithLoss(120);
    runMemorial(draft, ['b'], mulberry32(4));
    expect(draft.entries[0]?.message).not.toContain('{');
  });

  it('says nothing when nobody is left', () => {
    const draft = draftWithLoss(70);
    killSurvivor(draft, 'a');
    draft.entries.length = 0;
    runMemorial(draft, ['b'], mulberry32(2));
    expect(draft.entries).toHaveLength(0);
  });
});

describe('runGrief', () => {
  it('keeps a lover talking about them for days afterward', () => {
    const draft = draftWithLoss(140);
    draft.day = 7;
    runGrief(draft, () => 0.1);

    expect(draft.entries.length).toBeGreaterThan(0);
    expect(draft.entries[0]?.speakerId).toBe('a');
    expect(draft.entries[0]?.message).not.toContain('{');
  });

  it('costs the mourner morale', () => {
    const draft = draftWithLoss(140);
    draft.day = 7;
    const before = draft.survivors[0]?.stats.morale ?? 0;
    runGrief(draft, () => 0.1);
    expect(draft.survivors[0]?.stats.morale).toBeLessThan(before);
  });

  it('leaves the merely friendly alone', () => {
    const draft = draftWithLoss(70);
    draft.day = 7;
    runGrief(draft, () => 0.1);
    expect(draft.entries).toHaveLength(0);
  });

  it('lets the grief fade once enough days have passed', () => {
    const draft = draftWithLoss(140);
    draft.day = 40;
    runGrief(draft, () => 0.1);
    expect(draft.entries).toHaveLength(0);
  });

  it('writes grief lines that name nobody in the template', () => {
    GRIEF_LINES.forEach((line) => {
      expect(line).not.toContain('{생존자}');
    });
  });
});
