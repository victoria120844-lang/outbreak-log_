import { describe, expect, it } from 'vitest';
import {
  BIRTH_COOLDOWN_DAYS,
  CARRY_MAX_AGE,
  GESTATION_DAYS,
} from '@/data/birth';
import { MARRIAGE_THRESHOLD, ROMANCE_MIN_AGE } from '@/data/relationships';
import type { Relationship, Survivor } from '@/types';
import { runPregnancy } from './birth';
import { mulberry32 } from './rng';
import { ACTING_AGE, createDraft, createWorld, type Draft } from './state';
import { makeSurvivor } from './testUtils';

const married = (aId: string, bId: string, trust = MARRIAGE_THRESHOLD): Relationship[] => [
  { id: `${aId}-${bId}`, fromId: aId, toId: bId, kind: '연인', trust },
  { id: `${bId}-${aId}`, fromId: bId, toId: aId, kind: '연인', trust },
];

const couple = (
  overrides: { wife?: Partial<Survivor>; husband?: Partial<Survivor> } = {},
  relationships = married('w', 'h'),
): Draft =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [
        makeSurvivor('w', '지연', { gender: '여성', age: 28, ...overrides.wife }),
        makeSurvivor('h', '민수', { gender: '남성', age: 30, ...overrides.husband }),
      ],
      relationships,
    }),
  );

/** Always conceives: every roll comes back under the 10% threshold. */
const certain = () => 0.01;
/** Never conceives, and never fires any other flavour roll either. */
const never = () => 0.999;

describe('conception', () => {
  it('starts one for a married pair', () => {
    const draft = couple();
    draft.day = 12;
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBe(12);
    expect(draft.survivors[0]?.pregnantBy).toBe('h');
    expect(draft.entries.length).toBeGreaterThan(0);
  });

  it('leaves a pair short of the 부부 rung alone', () => {
    const draft = couple({}, married('w', 'h', MARRIAGE_THRESHOLD - 1));
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBeUndefined();
  });

  /*
   * A blood 가족 row the player set up also sits at trust 150, because that is
   * where family starts on the ladder. Reading trust alone would have had
   * siblings conceiving.
   */
  it('never starts one from a blood family row', () => {
    const draft = couple({}, [
      { id: 'a', fromId: 'w', toId: 'h', kind: '가족', trust: MARRIAGE_THRESHOLD },
      { id: 'b', fromId: 'h', toId: 'w', kind: '가족', trust: MARRIAGE_THRESHOLD },
    ]);
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBeUndefined();
  });

  /*
   * Gender is not a gate. Any married pair can have a child, and one of the
   * two carries it — which one is a roll, not a rule about who they are.
   */
  it('works for any married pair, whatever the pair looks like', () => {
    const shapes: Array<[string, Partial<Survivor>, Partial<Survivor>]> = [
      ['여성 + 남성', { gender: '여성' }, { gender: '남성' }],
      ['여성 + 여성', { gender: '여성' }, { gender: '여성' }],
      ['남성 + 남성', { gender: '남성' }, { gender: '남성' }],
      ['비공개 + 비공개', { gender: '비공개' }, { gender: '비공개' }],
      ['여성 + 비공개', { gender: '여성' }, { gender: '비공개' }],
    ];

    shapes.forEach(([label, wife, husband]) => {
      const draft = couple({ wife, husband });
      draft.day = 3;
      runPregnancy(draft, certain);

      const carrying = draft.survivors.filter(
        (survivor) => survivor.pregnantSince !== undefined,
      );
      if (carrying.length !== 1) {
        throw new Error(`${label}: ${carrying.length} carrying, wanted 1`);
      }
      expect(carrying[0]?.pregnantSince).toBe(3);
    });
  });

  it('names the other one as the second parent', () => {
    const draft = couple({ wife: { gender: '남성' }, husband: { gender: '남성' } });
    runPregnancy(draft, certain);

    const carrying = draft.survivors.find(
      (survivor) => survivor.pregnantSince !== undefined,
    );
    const partnerId = carrying?.id === 'w' ? 'h' : 'w';
    expect(carrying?.pregnantBy).toBe(partnerId);
  });

  it('respects the age window at both ends', () => {
    const tooYoung = couple({
      wife: { age: ROMANCE_MIN_AGE - 1 },
      husband: { age: ROMANCE_MIN_AGE - 1 },
    });
    runPregnancy(tooYoung, certain);
    expect(
      tooYoung.survivors.some((s) => s.pregnantSince !== undefined),
    ).toBe(false);

    const tooOld = couple({
      wife: { age: CARRY_MAX_AGE + 1 },
      husband: { age: CARRY_MAX_AGE + 1 },
    });
    runPregnancy(tooOld, certain);
    expect(tooOld.survivors.some((s) => s.pregnantSince !== undefined)).toBe(
      false,
    );
  });

  /*
   * One partner past the window does not stop the pair — the other one carries.
   * The couple only misses out when neither of them can.
   */
  it('falls to whichever of the two still can', () => {
    const draft = couple({ wife: { age: CARRY_MAX_AGE + 1 } });
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBeUndefined();
    expect(draft.survivors[1]?.pregnantSince).toBe(draft.day);
  });

  /*
   * Set on both: either of them may carry, so a cooldown on one alone does not
   * stop the couple — the other one simply steps in, which is the point.
   */
  it('holds off until the cooldown after the last pregnancy has passed', () => {
    const draft = couple({
      wife: { pregnancyEndedDay: 4 },
      husband: { pregnancyEndedDay: 4 },
    });

    const carrying = () =>
      draft.survivors.filter((s) => s.pregnantSince !== undefined);

    draft.day = 4 + BIRTH_COOLDOWN_DAYS - 1;
    runPregnancy(draft, certain);
    expect(carrying()).toHaveLength(0);

    draft.day = 4 + BIRTH_COOLDOWN_DAYS;
    runPregnancy(draft, certain);
    expect(carrying()).toHaveLength(1);
  });

  it('does not start a second one on top of the first', () => {
    const draft = couple();
    draft.day = 5;
    runPregnancy(draft, certain);
    draft.day = 9;
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBe(5);
  });

  /*
   * One at a time per couple. Either partner may carry, so without an explicit
   * guard the pair simply conceived twice — a playtest log had both halves of
   * the same marriage pregnant a week apart.
   */
  it('never has both halves of a couple carrying at once', () => {
    const draft = couple();
    draft.day = 5;
    runPregnancy(draft, certain);
    draft.day = 12;
    runPregnancy(draft, certain);

    const carrying = draft.survivors.filter(
      (survivor) => survivor.pregnantSince !== undefined,
    );
    expect(carrying).toHaveLength(1);
  });

  it('does not fire on most days', () => {
    const draft = couple();
    runPregnancy(draft, never);
    expect(draft.survivors[0]?.pregnantSince).toBeUndefined();
  });
});

describe('birth', () => {
  const carryToTerm = (draft: Draft): void => {
    draft.day = 1;
    runPregnancy(draft, certain);
    draft.entries = [];
    draft.day = 1 + GESTATION_DAYS;
    runPregnancy(draft, mulberry32(9));
  };

  it('puts a newborn on the roster', () => {
    const draft = couple();
    carryToTerm(draft);

    expect(draft.survivors).toHaveLength(3);
    const child = draft.survivors[2];
    expect(child?.age).toBe(0);
    expect(child?.alive).toBe(true);
    expect(child?.joinedDay).toBe(draft.day);
    expect(child?.name.length).toBeGreaterThan(0);
  });

  it('clears the pregnancy and starts the cooldown', () => {
    const draft = couple();
    carryToTerm(draft);

    const mother = draft.survivors[0];
    expect(mother?.pregnantSince).toBeUndefined();
    expect(mother?.pregnantBy).toBeUndefined();
    expect(mother?.pregnancyEndedDay).toBe(draft.day);
  });

  it('costs the mother and lifts everybody else', () => {
    const draft = couple();
    carryToTerm(draft);

    expect(draft.survivors[0]?.stats.hp).toBeLessThan(100);
    expect(draft.survivors[1]?.stats.morale).toBeGreaterThan(70);
  });

  it('wires the newcomer into every relationship, both ways', () => {
    const draft = couple();
    carryToTerm(draft);
    const child = draft.survivors[2];
    if (!child) throw new Error('no child was born');

    ['w', 'h'].forEach((parentId) => {
      const toParent = draft.relationships.find(
        (row) => row.fromId === child.id && row.toId === parentId,
      );
      const fromParent = draft.relationships.find(
        (row) => row.fromId === parentId && row.toId === child.id,
      );
      expect(toParent?.kind).toBe('가족');
      expect(fromParent?.kind).toBe('가족');
      expect(toParent?.trust).toBe(MARRIAGE_THRESHOLD);
    });
  });

  it('gives the child a name nobody is already using', () => {
    const draft = couple();
    carryToTerm(draft);

    const names = draft.survivors.map((survivor) => survivor.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('is old enough to be born and too young to be sent out', () => {
    const draft = couple();
    carryToTerm(draft);
    expect(draft.survivors[2]?.age).toBeLessThan(ACTING_AGE);
  });

  it('says something about it', () => {
    const draft = couple();
    carryToTerm(draft);

    expect(draft.entries.some((entry) => entry.speakerId === 'w')).toBe(true);
    expect(
      draft.entries.some((entry) => entry.message.includes('아이를 낳았다') ||
        entry.message.includes('울음소리')),
    ).toBe(true);
  });
});

describe('a pregnancy that does not make it', () => {
  it('is lost when she is badly hurt', () => {
    const draft = couple();
    draft.day = 1;
    runPregnancy(draft, certain);

    const mother = draft.survivors[0];
    if (!mother) throw new Error('no mother');
    mother.stats.hp = 10;
    draft.entries = [];

    draft.day = 4;
    runPregnancy(draft, certain);

    expect(mother.pregnantSince).toBeUndefined();
    expect(draft.survivors).toHaveLength(2);
    expect(draft.entries.some((entry) => entry.severity === 'death')).toBe(true);
  });

  it('holds while she is in one piece', () => {
    const draft = couple();
    draft.day = 1;
    runPregnancy(draft, certain);

    draft.day = 4;
    runPregnancy(draft, certain);

    expect(draft.survivors[0]?.pregnantSince).toBe(1);
  });
});
