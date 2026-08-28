import { describe, expect, it } from 'vitest';
import { buildProfile, traitStatDeltas } from './profile';
import { makeSurvivor } from './testUtils';

describe('buildProfile', () => {
  it('composes from the axes rather than per-type blocks', () => {
    const extrovert = buildProfile(makeSurvivor('a', 'A', { mbti: 'ENTP' }));
    const introvert = buildProfile(makeSurvivor('b', 'B', { mbti: 'INTP' }));

    expect(extrovert.scavenge).toBeGreaterThan(introvert.scavenge);
    expect(extrovert.social).toBeGreaterThan(introvert.social);
    expect(introvert.defense).toBeGreaterThan(extrovert.defense);
    expect(introvert.solo).toBeGreaterThan(extrovert.solo);
  });

  it('gives N variance and S efficiency', () => {
    const intuitive = buildProfile(makeSurvivor('a', 'A', { mbti: 'INTP' }));
    const sensor = buildProfile(makeSurvivor('b', 'B', { mbti: 'ISTP' }));

    expect(intuitive.risk).toBeGreaterThan(sensor.risk);
    expect(intuitive.variance).toBeGreaterThan(sensor.variance);
    expect(sensor.efficiency).toBeGreaterThan(intuitive.efficiency);
  });

  it('gives T a smaller morale penalty and F a bigger swing', () => {
    const thinker = buildProfile(makeSurvivor('a', 'A', { mbti: 'INTJ' }));
    const feeler = buildProfile(makeSurvivor('b', 'B', { mbti: 'INFJ' }));

    expect(thinker.deathMoralePenalty).toBeLessThan(feeler.deathMoralePenalty);
    expect(feeler.moraleSwing).toBeGreaterThan(thinker.moraleSwing);
  });

  it('gives J rationing and P chance encounters', () => {
    const judger = buildProfile(makeSurvivor('a', 'A', { mbti: 'INTJ' }));
    const perceiver = buildProfile(makeSurvivor('b', 'B', { mbti: 'INTP' }));

    expect(judger.rationing).toBeGreaterThan(perceiver.rationing);
    expect(perceiver.chanceEncounter).toBeGreaterThan(judger.chanceEncounter);
  });

  it('shares the same axis contribution across types', () => {
    const enfp = buildProfile(makeSurvivor('a', 'A', { mbti: 'ENFP' }));
    const entp = buildProfile(makeSurvivor('b', 'B', { mbti: 'ENTP' }));
    // Both are E and P, so those parts must land identically.
    expect(enfp.scavenge).toBe(entp.scavenge);
    expect(enfp.chanceEncounter).toBe(entp.chanceEncounter);
  });

  it('applies trait weights on top of the axes', () => {
    const plain = buildProfile(makeSurvivor('a', 'A', { mbti: 'INTP' }));
    const timid = buildProfile(
      makeSurvivor('b', 'B', { mbti: 'INTP', traits: ['timid'] }),
    );

    expect(timid.combat).toBeLessThan(plain.combat);
    expect(timid.fleeSurvival).toBeGreaterThan(plain.fleeSurvival);
  });

  it('lets 이타적 raise sharing and sacrifice', () => {
    const altruist = buildProfile(
      makeSurvivor('a', 'A', { traits: ['altruistic'] }),
    );
    expect(altruist.shareMedicine).toBeGreaterThan(1);
    expect(altruist.sacrifice).toBeGreaterThan(1);
  });

  it('lets 거짓말쟁이 hide an infection for two extra days', () => {
    const liar = buildProfile(makeSurvivor('a', 'A', { traits: ['liar'] }));
    const honest = buildProfile(makeSurvivor('b', 'B'));
    expect(liar.hideInfectionDays - honest.hideInfectionDays).toBe(2);
  });

  it('never returns a negative weight', () => {
    const profile = buildProfile(
      makeSurvivor('a', 'A', { traits: ['timid', 'insomniac', 'pessimistic'] }),
    );
    Object.values(profile).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('traitStatDeltas', () => {
  it('sums the per-day deltas from every trait', () => {
    const deltas = traitStatDeltas(
      makeSurvivor('a', 'A', { traits: ['strongBody', 'optimistic'] }),
    );
    expect(deltas.hp).toBe(10);
    expect(deltas.stamina).toBe(10);
    expect(deltas.morale).toBe(10);
  });

  it('is empty for a survivor with no traits', () => {
    expect(traitStatDeltas(makeSurvivor('a', 'A'))).toEqual({});
  });
});
