import { describe, expect, it } from 'vitest';
import {
  BREAKUP_TRUST,
  LOVER_THRESHOLD,
  ROMANCE_MIN_AGE,
} from '@/data/relationships';
import type { Relationship } from '@/types';
import { snapshotPairs } from './progression';
import { mulberry32 } from './rng';
import { labelRomances, runBreakups, runRomanceGuard } from './romance';
import {
  adjustTrust,
  createDraft,
  createWorld,
  setKind,
  trustBetween,
} from './state';
import { makePair, makeSurvivor } from './testUtils';

const adult = (id: string, name: string, age = 30) =>
  makeSurvivor(id, name, { age });

/** Three adults, every pair staged at the same starting trust. */
const trio = (trust: number, pureLove = true) => {
  const relationships: Relationship[] = [
    ...makePair('s1', 's2', trust),
    ...makePair('s1', 's3', trust),
    ...makePair('s2', 's3', trust),
  ];
  return createDraft(
    createWorld({
      runSeed: 1,
      survivors: [adult('s1', '민수'), adult('s2', '지연'), adult('s3', '현우')],
      relationships,
      pureLove,
    }),
  );
};

describe('runRomanceGuard — 순애 모드', () => {
  it('lets one pair cross into 연인', () => {
    const draft = trio(90);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 20);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
  });

  it('holds the second romance one rung short', () => {
    const draft = trio(90);
    const before = snapshotPairs(draft);
    // 민수 climbs with both 지연 and 현우 on the same day.
    adjustTrust(draft, 's1', 's2', 25);
    adjustTrust(draft, 's1', 's3', 20);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
    expect(trustBetween(draft, 's1', 's3')).toBe(LOVER_THRESHOLD - 1);
  });

  it('gives the stronger bond the claim, not the earlier one', () => {
    const draft = trio(90);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 12);
    adjustTrust(draft, 's1', 's3', 40);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's3')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
    expect(trustBetween(draft, 's1', 's2')).toBe(LOVER_THRESHOLD - 1);
  });

  it('keeps a standing couple together against a newcomer', () => {
    const draft = trio(90);
    // 민수 and 지연 were already a couple this morning, and the label — not the
    // number — is what says so.
    adjustTrust(draft, 's1', 's2', 30);
    setKind(draft, 's1', 's2', '연인');
    const before = snapshotPairs(draft);
    // 현우 climbs harder today and still does not get to cut in.
    adjustTrust(draft, 's1', 's3', 45);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
    expect(trustBetween(draft, 's1', 's3')).toBe(LOVER_THRESHOLD - 1);
  });

  it('never demotes a couple that did not move', () => {
    const draft = trio(90);
    adjustTrust(draft, 's1', 's2', 30);
    setKind(draft, 's1', 's2', '연인');
    const before = snapshotPairs(draft);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBe(120);
  });

  /*
   * The guard holds a losing pair at one below the line, and the daily bond
   * pushes it back over the next morning. Reading commitment off the number
   * made that pair look like a couple, so it "broke up" on a day it had never
   * been announced as together. A 70-day playtest produced exactly that entry.
   */
  it('does not mistake a held pair for a couple', () => {
    const draft = trio(90);
    adjustTrust(draft, 's1', 's2', 30);
    setKind(draft, 's1', 's2', '연인');

    // Yesterday the guard held s1-s3 at 99; today's bond nudges it to 100.
    adjustTrust(draft, 's1', 's3', 9);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's3', 1);

    runRomanceGuard(draft, before);
    const broken = runBreakups(draft, before, mulberry32(3));

    expect(broken.size).toBe(0);
    expect(trustBetween(draft, 's1', 's3')).toBe(LOVER_THRESHOLD - 1);
  });

  it('allows the two-timing it was built to stop, once turned off', () => {
    const draft = trio(90, false);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 25);
    adjustTrust(draft, 's1', 's3', 20);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
    expect(trustBetween(draft, 's1', 's3')).toBeGreaterThanOrEqual(
      LOVER_THRESHOLD,
    );
  });
});

describe('runRomanceGuard — age', () => {
  const withChild = (pureLove: boolean) =>
    createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          adult('s1', '민수', 34),
          makeSurvivor('s2', '지연', { age: ROMANCE_MIN_AGE - 5 }),
        ],
        relationships: makePair('s1', 's2', 90),
        pureLove,
      }),
    );

  it('will not pair a minor, mode on', () => {
    const draft = withChild(true);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 40);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBe(LOVER_THRESHOLD - 1);
  });

  it('will not pair a minor with the mode off either', () => {
    const draft = withChild(false);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 40);
    runRomanceGuard(draft, before);

    expect(trustBetween(draft, 's1', 's2')).toBe(LOVER_THRESHOLD - 1);
  });
});

describe('labelRomances', () => {
  it('renames the pair so the roster can show it', () => {
    const draft = trio(90);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 20);
    labelRomances(draft, before);

    const row = draft.relationships.find(
      (entry) => entry.fromId === 's1' && entry.toId === 's2',
    );
    expect(row?.kind).toBe('연인');
  });

  it('leaves blood family alone', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [adult('s1', '민수', 50), adult('s2', '지연', 24)],
        relationships: makePair('s1', 's2', 90).map((entry) => ({
          ...entry,
          kind: '가족' as const,
        })),
      }),
    );
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 20);
    labelRomances(draft, before);

    expect(draft.relationships[0]?.kind).toBe('가족');
  });
});

describe('runBreakups', () => {
  const fallFrom = (from: number, to: number) => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [adult('s1', '민수'), adult('s2', '지연')],
        relationships: makePair('s1', 's2', from).map((entry) => ({
          ...entry,
          kind: '연인' as const,
        })),
      }),
    );
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', to - from);
    const broken = runBreakups(draft, before, mulberry32(9));
    return { draft, broken };
  };

  it('ends it when a couple drops below the line', () => {
    const { draft, broken } = fallFrom(110, 95);
    expect(broken.has('s1|s2')).toBe(true);
    expect(draft.entries.length).toBeGreaterThan(0);
  });

  it('drops them into open hostility, not mild distance', () => {
    const { draft } = fallFrom(110, 95);
    expect(trustBetween(draft, 's1', 's2')).toBe(BREAKUP_TRUST);
    // Deep enough that the conflict templates gated on -60 can find them.
    expect(BREAKUP_TRUST).toBeLessThanOrEqual(-60);
  });

  it('relabels the pair as 원한', () => {
    const { draft } = fallFrom(110, 95);
    expect(draft.relationships[0]?.kind).toBe('원한');
  });

  it('costs them both something', () => {
    const { draft } = fallFrom(110, 95);
    draft.survivors.forEach((survivor) => {
      expect(survivor.stats.morale).toBeLessThan(70);
    });
  });

  it('says it plainly and lets one of them speak', () => {
    const { draft } = fallFrom(110, 95);
    const narration = draft.entries.filter(
      (entry) => entry.speakerId === undefined,
    );
    const spoken = draft.entries.filter((entry) => entry.speakerId !== undefined);
    expect(narration).toHaveLength(1);
    expect(narration[0]?.severity).toBe('notable');
    expect(spoken).toHaveLength(1);
  });

  it('ignores a pair that never reached the line', () => {
    const { draft, broken } = fallFrom(80, 40);
    expect(broken.size).toBe(0);
    expect(draft.entries).toHaveLength(0);
  });

  it('ignores a close pair that was never labelled a couple', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [adult('s1', '민수'), adult('s2', '지연')],
        relationships: makePair('s1', 's2', 110),
      }),
    );
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', -20);

    expect(runBreakups(draft, before, mulberry32(9)).size).toBe(0);
  });

  it('ignores a couple that merely cooled without falling out', () => {
    const { broken } = fallFrom(140, 105);
    expect(broken.size).toBe(0);
  });
});
