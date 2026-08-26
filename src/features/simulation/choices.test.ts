import { describe, expect, it } from 'vitest';
import { CHOICE_TEMPLATES, successChance } from '@/data/choices';
import { getItem } from '@/data/items';
import { maybeDrawChoice, resolveChoice } from './choices';
import { mulberry32 } from './rng';
import { createDraft, createWorld, quantityOf } from './state';
import { makePair, makeSurvivor } from './testUtils';
import { advanceDay, applyChoice } from './world';

const strong = (score: number) =>
  makeSurvivor('s1', '민수', {
    abilities: {
      intellect: score,
      endurance: score,
      agility: score,
      strength: score,
      luck: score,
    },
  });

const draftWith = (score: number) =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [strong(score), makeSurvivor('s2', '지연')],
      relationships: makePair('s1', 's2', 20),
      inventory: [{ itemId: 'antibiotics', quantity: 1 }],
    }),
  );

describe('choice catalogue', () => {
  it('offers several decisions', () => {
    expect(CHOICE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('uses unique ids', () => {
    const ids = CHOICE_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every decision at least two ways out', () => {
    CHOICE_TEMPLATES.forEach((template) => {
      expect(template.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(template.options.map((o) => o.id)).size).toBe(
        template.options.length,
      );
    });
  });

  it('writes a line for every outcome that can happen', () => {
    CHOICE_TEMPLATES.forEach((template) => {
      template.options.forEach((option) => {
        expect(option.success.text.length).toBeGreaterThan(0);
        // A guaranteed option is allowed to have no failure branch.
        if (option.ability !== null) {
          expect(option.failure.text.length).toBeGreaterThan(0);
        }
      });
    });
  });

  it('only references items that exist', () => {
    CHOICE_TEMPLATES.forEach((template) => {
      template.options.forEach((option) => {
        [...(option.success.items ?? []), ...(option.failure.items ?? [])].forEach(
          (change) => expect(getItem(change.itemId)).toBeDefined(),
        );
      });
    });
  });
});

describe('successChance', () => {
  it('is certain when no ability is tested', () => {
    expect(successChance(null, 0, 0)).toBe(1);
  });

  it('rises with the ability score', () => {
    expect(successChance('strength', 9, 5)).toBeGreaterThan(
      successChance('strength', 3, 5),
    );
  });

  it('is even money at the difficulty', () => {
    expect(successChance('strength', 5, 5)).toBeCloseTo(0.5, 5);
  });

  it('never reaches certainty or hopelessness', () => {
    expect(successChance('strength', 10, 1)).toBeLessThanOrEqual(0.95);
    expect(successChance('strength', 1, 10)).toBeGreaterThanOrEqual(0.1);
  });
});

describe('maybeDrawChoice', () => {
  it('stays out of the way most days', () => {
    expect(maybeDrawChoice(draftWith(5), () => 0.99)).toBeNull();
  });

  it('describes the question with names already filled in', () => {
    const pending = maybeDrawChoice(draftWith(5), () => 0.1);
    expect(pending).not.toBeNull();
    expect(pending?.prompt.includes('{')).toBe(false);
    pending?.options.forEach((option) => {
      expect(option.label.includes('{')).toBe(false);
    });
  });

  it('shows better odds to a more capable survivor', () => {
    const weak = maybeDrawChoice(draftWith(2), () => 0.1);
    const able = maybeDrawChoice(draftWith(9), () => 0.1);

    // Only the options that actually test an ability move with the score;
    // a guaranteed option reads 100% for everyone.
    const tested = (pending: typeof weak) =>
      (pending?.options ?? []).filter((option) => option.abilityLabel !== null);

    expect(tested(weak).length).toBeGreaterThan(0);
    tested(able).forEach((option, index) => {
      expect(option.chance).toBeGreaterThan(tested(weak)[index]?.chance ?? 1);
    });
  });
});

describe('resolveChoice', () => {
  it('writes an entry for the option that was picked', () => {
    const draft = draftWith(9);
    const pending = maybeDrawChoice(draft, () => 0.1);
    if (!pending) throw new Error('expected a choice');

    const first = pending.options[0];
    if (!first) throw new Error('expected an option');
    resolveChoice(draft, pending, first.id, mulberry32(1));

    expect(draft.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores an option that is not on the card', () => {
    const draft = draftWith(5);
    const pending = maybeDrawChoice(draft, () => 0.1);
    if (!pending) throw new Error('expected a choice');

    expect(resolveChoice(draft, pending, 'nonsense', mulberry32(1))).toBeNull();
    expect(draft.entries).toHaveLength(0);
  });

  it('spends the item the outcome says it spends', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [strong(9), makeSurvivor('s2', '지연')],
        relationships: makePair('s1', 's2', 20),
        inventory: [{ itemId: 'antibiotics', quantity: 1 }],
      }),
    );
    const template = CHOICE_TEMPLATES.find((t) => t.id === 'lastAntibiotic');
    if (!template) throw new Error('missing template');

    resolveChoice(
      draft,
      {
        templateId: 'lastAntibiotic',
        day: 1,
        actorId: 's1',
        targetId: 's2',
        prompt: '',
        options: [],
      },
      'giveOther',
      mulberry32(1),
    );

    expect(quantityOf(draft, 'antibiotics')).toBe(0);
  });
});

describe('the run waits on the player', () => {
  const world = () =>
    createWorld({
      runSeed: 4242,
      survivors: [makeSurvivor('s1', '민수'), makeSurvivor('s2', '지연')],
      relationships: makePair('s1', 's2', 20),
      inventory: [
        { itemId: 'cannedFood', quantity: 60 },
        { itemId: 'bottledWater', quantity: 60 },
      ],
    });

  const untilChoice = () => {
    let state = world();
    for (let index = 0; index < 60; index += 1) {
      const result = advanceDay(state);
      state = result.state;
      if (state.pendingChoice !== null) return state;
      if (state.status === 'ended') break;
    }
    return state;
  };

  it('eventually stops on a decision', () => {
    expect(untilChoice().pendingChoice).not.toBeNull();
  });

  it('refuses to advance while one is open', () => {
    const stopped = untilChoice();
    if (stopped.pendingChoice === null) return;

    const after = advanceDay(stopped);
    expect(after.entries).toHaveLength(0);
    expect(after.state.day).toBe(stopped.day);
  });

  it('clears the decision once answered and lets the run continue', () => {
    const stopped = untilChoice();
    const pending = stopped.pendingChoice;
    if (pending === null) return;

    const firstOption = pending.options[0];
    if (!firstOption) throw new Error('expected an option');

    const answered = applyChoice(stopped, firstOption.id);
    expect(answered.state.pendingChoice).toBeNull();
    expect(advanceDay(answered.state).state.day).toBe(stopped.day + 1);
  });

  it('resolves the same way for the same seed and pick', () => {
    const stopped = untilChoice();
    const pending = stopped.pendingChoice;
    if (pending === null) return;
    const option = pending.options[0];
    if (!option) throw new Error('expected an option');

    const left = applyChoice(stopped, option.id);
    const right = applyChoice(stopped, option.id);
    expect(left.entries).toEqual(right.entries);
  });
});
