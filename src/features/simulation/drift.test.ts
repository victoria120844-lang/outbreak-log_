import { describe, expect, it } from 'vitest';
import { EVENT_TEMPLATES } from '@/data/events';
import { TRUST_MAX } from '@/data/relationships';
import type { EventTemplate } from '@/types';
import { BLAME_TRUST, DAILY_BOND, runDrift } from './drift';
import type { AppliedEvent } from './events';
import { createDraft, createWorld, trustBetween } from './state';
import { makePair, makeSurvivor } from './testUtils';

const templateById = (id: string): EventTemplate => {
  const template = EVENT_TEMPLATES.find((entry) => entry.id === id);
  if (!template) throw new Error(`missing template: ${id}`);
  return template;
};

const twoSurvivors = (trust: number) =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [makeSurvivor('s1', '민수'), makeSurvivor('s2', '지연')],
      relationships: makePair('s1', 's2', trust),
    }),
  );

const applied = (id: string, actorId: string): AppliedEvent => ({
  template: templateById(id),
  actorId,
  targetId: null,
});

describe('runDrift', () => {
  it('raises mutual trust after surviving something dangerous together', () => {
    const draft = twoSurvivors(0);
    runDrift(draft, [applied('combatHorde', 's1')]);

    expect(trustBetween(draft, 's1', 's2') ?? 0).toBeGreaterThan(0);
    expect(trustBetween(draft, 's2', 's1') ?? 0).toBeGreaterThan(0);
  });

  it('still bonds a little on a quiet day', () => {
    // Surviving another day beside someone counts for something. Without
    // this the ladder was unreachable in a normal run.
    const draft = twoSurvivors(10);
    runDrift(draft, [applied('quietCount', 's1')]);
    expect(trustBetween(draft, 's1', 's2')).toBe(10 + DAILY_BOND);
  });

  it('costs the survivor who ran', () => {
    const draft = twoSurvivors(20);
    runDrift(draft, [applied('combatFlee', 's1')]);
    expect(trustBetween(draft, 's1', 's2')).toBe(20 + BLAME_TRUST + DAILY_BOND);
  });

  it('costs the survivor who was blamed for a missing item', () => {
    const draft = twoSurvivors(0);
    runDrift(draft, [applied('conflictTheft', 's2')]);
    expect(trustBetween(draft, 's1', 's2') ?? 0).toBeLessThan(0);
  });

  it('needs two living survivors to drift at all', () => {
    const draft = createDraft(
      createWorld({ runSeed: 1, survivors: [makeSurvivor('s1', '민수')] }),
    );
    runDrift(draft, [applied('combatHorde', 's1')]);
    expect(draft.relationships).toHaveLength(0);
  });

  it('never pushes trust past the ceiling', () => {
    const draft = twoSurvivors(TRUST_MAX - 1);
    runDrift(draft, [applied('combatHorde', 's1')]);
    expect(trustBetween(draft, 's1', 's2')).toBeLessThanOrEqual(TRUST_MAX);
  });

  it('lets an F profile feel a shared danger more than a T profile', () => {
    const feelers = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          makeSurvivor('s1', '민수', { mbti: 'INFP' }),
          makeSurvivor('s2', '지연', { mbti: 'INFP' }),
        ],
        relationships: makePair('s1', 's2', 0),
      }),
    );
    const thinkers = twoSurvivors(0);

    runDrift(feelers, [applied('combatHorde', 's1')]);
    runDrift(thinkers, [applied('combatHorde', 's1')]);

    expect(trustBetween(feelers, 's1', 's2') ?? 0).toBeGreaterThan(
      trustBetween(thinkers, 's1', 's2') ?? 0,
    );
  });
});
