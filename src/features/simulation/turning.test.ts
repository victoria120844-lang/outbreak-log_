import { describe, expect, it } from 'vitest';
import { BREAKOUT_ODDS } from '@/data/turning';
import { TURNED_TEMPLATE_ID, maybeDrawChoice, resolveChoice } from './choices';
import { mulberry32 } from './rng';
import { createDraft, createWorld } from './state';
import { makePair, makeSurvivor } from './testUtils';
import {
  containedSurvivors,
  layToRest,
  runContained,
  turnSurvivor,
  unresolvedTurn,
} from './turning';

const group = () =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [
        makeSurvivor('s1', '민수'),
        makeSurvivor('s2', '지연'),
        makeSurvivor('s3', '현우'),
      ],
      relationships: [
        ...makePair('s1', 's2', 80),
        ...makePair('s1', 's3', 10),
        ...makePair('s2', 's3', 10),
      ],
    }),
  );

describe('turnSurvivor', () => {
  it('takes them off the roster without killing them', () => {
    const draft = group();
    draft.day = 12;
    turnSurvivor(draft, 's1', mulberry32(4));

    const turned = draft.survivors[0];
    expect(turned?.alive).toBe(false);
    expect(turned?.status).toBe('좀비');
    expect(turned?.turnedDay).toBe(12);
    // Not dead. Nobody has decided anything yet.
    expect(turned?.diedDay).toBeUndefined();
  });

  it('costs everyone still standing', () => {
    const draft = group();
    turnSurvivor(draft, 's1', mulberry32(4));

    expect(draft.survivors[1]?.stats.morale).toBeLessThan(70);
    expect(draft.survivors[2]?.stats.morale).toBeLessThan(70);
  });

  it('writes it as a loss and lets somebody react', () => {
    const draft = group();
    turnSurvivor(draft, 's1', mulberry32(4));

    expect(draft.entries.some((entry) => entry.severity === 'death')).toBe(true);
    expect(draft.entries.some((entry) => entry.speakerId !== undefined)).toBe(
      true,
    );
  });
});

describe('the decision a turning forces', () => {
  const withTurn = () => {
    const draft = group();
    turnSurvivor(draft, 's3', mulberry32(4));
    draft.entries = [];
    return draft;
  };

  it('stops the day whether or not the dice agree', () => {
    const draft = withTurn();
    // An rng that would refuse every ordinary draw still has to yield this.
    const pending = maybeDrawChoice(draft, () => 0.999);

    expect(pending?.templateId).toBe(TURNED_TEMPLATE_ID);
    expect(pending?.targetId).toBe('s3');
    expect(pending?.options).toHaveLength(3);
  });

  it('hands the door to whoever was closest to them', () => {
    const draft = group();
    turnSurvivor(draft, 's2', mulberry32(4));
    const pending = maybeDrawChoice(draft, () => 0.999);

    // 민수 trusts 지연 at 80; 현우 only at 10.
    expect(pending?.actorId).toBe('s1');
  });

  it('ends them when the group puts them down', () => {
    const draft = withTurn();
    const pending = maybeDrawChoice(draft, () => 0.999);
    if (!pending) throw new Error('no decision was drawn');

    resolveChoice(draft, pending, 'putDown', mulberry32(2));

    const zombie = draft.survivors[2];
    expect(zombie?.status).toBe('사망');
    expect(zombie?.diedDay).toBe(draft.day);
    // Now that they are gone, the people left say something about them.
    expect(draft.entries.some((entry) => entry.memorialFor === 's3')).toBe(true);
  });

  it('ends them when the group opens the door', () => {
    const draft = withTurn();
    const pending = maybeDrawChoice(draft, () => 0.999);
    if (!pending) throw new Error('no decision was drawn');

    resolveChoice(draft, pending, 'release', mulberry32(2));
    expect(draft.survivors[2]?.status).toBe('사망');
  });

  it('keeps them when the group locks the door instead', () => {
    const draft = withTurn();
    const pending = maybeDrawChoice(draft, () => 0.999);
    if (!pending) throw new Error('no decision was drawn');

    resolveChoice(draft, pending, 'contain', mulberry32(2));

    expect(draft.survivors[2]?.status).toBe('좀비');
    expect(draft.survivors[2]?.contained).toBe(true);
    expect(containedSurvivors(draft)).toHaveLength(1);
    // Answered, so it no longer blocks the run.
    expect(unresolvedTurn(draft)).toBeUndefined();
  });

  it('costs the person who does it more than the person who watches', () => {
    const putDown = withTurn();
    const putDownPending = maybeDrawChoice(putDown, () => 0.999);
    if (!putDownPending) throw new Error('no decision was drawn');
    resolveChoice(putDown, putDownPending, 'putDown', mulberry32(2));

    const released = withTurn();
    const releasedPending = maybeDrawChoice(released, () => 0.999);
    if (!releasedPending) throw new Error('no decision was drawn');
    resolveChoice(released, releasedPending, 'release', mulberry32(2));

    const actorId = putDownPending.actorId;
    const moraleOf = (draft: ReturnType<typeof group>) =>
      draft.survivors.find((entry) => entry.id === actorId)?.stats.morale ?? 0;

    expect(moraleOf(putDown)).toBeLessThan(moraleOf(released));
  });
});

describe('runContained', () => {
  const locked = () => {
    const draft = group();
    turnSurvivor(draft, 's3', mulberry32(4));
    const zombie = draft.survivors[2];
    if (zombie) zombie.contained = true;
    draft.entries = [];
    return draft;
  };

  it('drains the room every day the door is still there', () => {
    const draft = locked();
    const before = draft.survivors[0]?.stats.morale ?? 0;
    // Above the breakout roll and above the flavor roll: a quiet day.
    runContained(draft, () => 0.99);

    expect(draft.survivors[0]?.stats.morale).toBeLessThan(before);
    expect(draft.survivors[2]?.status).toBe('좀비');
  });

  it('lets the door fail, and somebody pays for it', () => {
    const draft = locked();
    // Under the breakout threshold, so it gives way.
    runContained(draft, () => BREAKOUT_ODDS / 2);

    expect(draft.survivors[2]?.status).toBe('사망');
    const bitten = draft.survivors.filter(
      (survivor) => survivor.alive && survivor.stats.infection > 0,
    );
    expect(bitten.length).toBe(1);
  });

  it('does nothing while nobody is locked up', () => {
    const draft = group();
    runContained(draft, () => 0.01);
    expect(draft.entries).toHaveLength(0);
  });
});

describe('layToRest', () => {
  it('refuses anyone who has not turned', () => {
    const draft = group();
    layToRest(draft, 's1', mulberry32(1));
    expect(draft.survivors[0]?.status).toBe('생존');
  });
});
