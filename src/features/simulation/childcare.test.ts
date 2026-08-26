import { describe, expect, it } from 'vitest';
import { CHILD_BOND, MILESTONES, PARENT_BOND } from '@/data/childcare';
import type { Relationship, Survivor } from '@/types';
import { addressOf } from './address';
import { childrenOf, runChildcare } from './childcare';
import { mulberry32 } from './rng';
import { createDraft, createWorld, trustBetween, type Draft } from './state';
import { makeSurvivor } from './testUtils';

const child = (overrides: Partial<Survivor> = {}): Survivor =>
  makeSurvivor('kid', '해든', {
    age: 0,
    gender: '남성',
    joinedDay: 0,
    parentIds: ['mum', 'dad'],
    ...overrides,
  });

const pair = (aId: string, bId: string): Relationship[] => [
  { id: `${aId}${bId}`, fromId: aId, toId: bId, kind: '초면', trust: 0 },
  { id: `${bId}${aId}`, fromId: bId, toId: aId, kind: '초면', trust: 0 },
];

const household = (kid: Survivor = child()): Draft =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [
        makeSurvivor('mum', '지연', { age: 28, gender: '여성' }),
        makeSurvivor('dad', '민수', { age: 30, gender: '남성' }),
        makeSurvivor('other', '현우', { age: 41, gender: '남성' }),
        kid,
      ],
      relationships: [
        ...pair('mum', 'kid'),
        ...pair('dad', 'kid'),
        ...pair('other', 'kid'),
      ],
    }),
  );

/** Never rolls a care line, so only the steady daily part is measured. */
const quiet = () => 0.999;

describe('a parent’s word for their own child', () => {
  it('is 아들 or 딸, whatever the age gap would have said', () => {
    const draft = household();
    const mum = draft.survivors[0];
    const dad = draft.survivors[1];
    const kid = draft.survivors[3];
    if (!mum || !dad || !kid) throw new Error('bad fixture');

    expect(addressOf(mum, kid)).toBe('아들');
    expect(addressOf(dad, kid)).toBe('아들');
  });

  it('follows the child, not the parent', () => {
    const draft = household(child({ gender: '여성' }));
    const mum = draft.survivors[0];
    const kid = draft.survivors[3];
    if (!mum || !kid) throw new Error('bad fixture');

    expect(addressOf(mum, kid)).toBe('딸');
  });

  it('is the plain name to everybody else in the house', () => {
    const draft = household();
    const other = draft.survivors[2];
    const kid = draft.survivors[3];
    if (!other || !kid) throw new Error('bad fixture');

    expect(addressOf(other, kid)).toBe('해든');
  });

  /*
   * The player can set 가족 on two grown adults, so parenthood is read off the
   * record rather than off a relationship row.
   */
  it('does not leak onto a 가족 row the player set up', () => {
    const draft = household();
    const mum = draft.survivors[0];
    const dad = draft.survivors[1];
    if (!mum || !dad) throw new Error('bad fixture');

    expect(addressOf(dad, mum)).not.toBe('딸');
  });
});

describe('runChildcare', () => {
  it('finds the children and nobody else', () => {
    const draft = household();
    expect(childrenOf(draft).map((one) => one.id)).toEqual(['kid']);
  });

  it('pulls the whole house toward the child every day', () => {
    const draft = household();
    runChildcare(draft, quiet);

    expect(trustBetween(draft, 'other', 'kid')).toBe(CHILD_BOND);
    // The two raising them gain faster than the rest of the house.
    expect(trustBetween(draft, 'mum', 'kid')).toBe(CHILD_BOND + PARENT_BOND);
  });

  it('lifts a parent more than a housemate', () => {
    const draft = household();
    runChildcare(draft, quiet);

    const mum = draft.survivors[0]?.stats.morale ?? 0;
    const other = draft.survivors[2]?.stats.morale ?? 0;
    expect(mum).toBeGreaterThan(other);
    expect(other).toBeGreaterThan(70);
  });

  it('says nothing when there is no child in the house', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [makeSurvivor('a', '지연'), makeSurvivor('b', '민수')],
      }),
    );
    runChildcare(draft, () => 0.01);
    expect(draft.entries).toHaveLength(0);
  });

  it('writes somebody looking after them on an ordinary day', () => {
    const draft = household();
    // Under CARE_ODDS, so the day includes it.
    runChildcare(draft, () => 0.1);

    const named = draft.entries.filter((entry) =>
      entry.actorIds.includes('kid'),
    );
    expect(named.length).toBeGreaterThan(0);
  });

  it('marks each first exactly once, on the day it happens', () => {
    const first = MILESTONES[0];
    if (!first) throw new Error('no milestones');

    const draft = household();
    draft.day = first.after;
    runChildcare(draft, quiet);
    const onTheDay = draft.entries.length;

    draft.entries = [];
    draft.day = first.after + 1;
    runChildcare(draft, quiet);

    expect(onTheDay).toBeGreaterThan(0);
    expect(draft.entries).toHaveLength(0);
  });

  it('leaves no slot unfilled in anything it writes', () => {
    const draft = household();

    MILESTONES.forEach((milestone) => {
      draft.entries = [];
      draft.day = milestone.after;
      runChildcare(draft, mulberry32(milestone.after));
      draft.entries.forEach((entry) => {
        expect(entry.message).not.toContain('{');
      });
    });
  });
});
