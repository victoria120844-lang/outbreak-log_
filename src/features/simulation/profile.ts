import { getJob } from '@/data/jobs';
import { getTrait } from '@/data/traits';
import type { StatKey, Survivor } from '@/types';

/**
 * How a survivor behaves, composed from the four MBTI axes and then modified by
 * traits. There are deliberately no per-type behavior blocks: ENFP is just
 * E + N + F + P.
 */
export interface ActionProfile {
  scavenge: number;
  combat: number;
  defense: number;
  solo: number;
  social: number;
  risk: number;
  variance: number;
  efficiency: number;
  rationing: number;
  rational: number;
  conflict: number;
  cooperation: number;
  medical: number;
  infectionRisk: number;
  accidentRisk: number;
  moraleSwing: number;
  deathMoralePenalty: number;
  chanceEncounter: number;
  fleeSurvival: number;
  shareMedicine: number;
  sacrifice: number;
  /** Days an infection can be concealed before the group notices. */
  hideInfectionDays: number;
}

const BASE_PROFILE: ActionProfile = {
  scavenge: 1,
  combat: 1,
  defense: 1,
  solo: 1,
  social: 1,
  risk: 1,
  variance: 1,
  efficiency: 1,
  rationing: 1,
  rational: 1,
  conflict: 1,
  cooperation: 1,
  medical: 1,
  infectionRisk: 1,
  accidentRisk: 1,
  moraleSwing: 1,
  deathMoralePenalty: 1,
  chanceEncounter: 1,
  fleeSurvival: 1,
  shareMedicine: 1,
  sacrifice: 1,
  hideInfectionDays: 0,
};

type AxisLetter = 'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P';

const AXIS_CONTRIBUTION: Record<AxisLetter, Partial<ActionProfile>> = {
  E: { scavenge: 0.25, social: 0.3, chanceEncounter: 0.1 },
  I: { defense: 0.3, solo: 0.3, social: -0.15 },
  N: { risk: 0.3, variance: 0.35 },
  S: { efficiency: 0.3, defense: 0.2, variance: -0.15 },
  T: { rational: 0.25, deathMoralePenalty: -0.3 },
  F: { social: 0.25, cooperation: 0.25, moraleSwing: 0.4 },
  J: { rationing: 0.3, efficiency: 0.2 },
  P: { chanceEncounter: 0.35, variance: 0.15, rationing: -0.15 },
};

const isAxisLetter = (letter: string): letter is AxisLetter =>
  Object.prototype.hasOwnProperty.call(AXIS_CONTRIBUTION, letter);

const PROFILE_KEYS = Object.keys(BASE_PROFILE) as Array<keyof ActionProfile>;

export const buildProfile = (survivor: Survivor): ActionProfile => {
  const profile: ActionProfile = { ...BASE_PROFILE };

  Array.from(survivor.mbti).forEach((letter) => {
    if (!isAxisLetter(letter)) return;
    const contribution = AXIS_CONTRIBUTION[letter];
    PROFILE_KEYS.forEach((key) => {
      profile[key] += contribution[key] ?? 0;
    });
  });

  // The job is folded in exactly like a trait; it is just a fourth modifier.
  const sources = [getJob(survivor.job)?.modifiers, ...survivor.traits.map(
    (traitId) => getTrait(traitId)?.modifiers,
  )];

  sources.forEach((modifiers) => {
    if (!modifiers) return;

    const weights = modifiers.eventWeights;
    if (weights) {
      profile.combat *= weights.combat ?? 1;
      profile.scavenge *= weights.scavenge ?? 1;
      profile.conflict *= weights.conflict ?? 1;
      profile.cooperation *= weights.cooperation ?? 1;
      profile.infectionRisk *= weights.infection ?? 1;
      profile.medical *= weights.medical ?? 1;
      profile.moraleSwing *= weights.morale ?? 1;
      profile.accidentRisk *= weights.accident ?? 1;
    }

    const behavior = modifiers.behavior;
    if (behavior) {
      profile.fleeSurvival *= behavior.fleeSurvival ?? 1;
      profile.sacrifice *= behavior.sacrifice ?? 1;
      profile.shareMedicine *= behavior.shareMedicine ?? 1;
      profile.hideInfectionDays += behavior.hideInfectionDays ?? 0;
    }
  });

  // Abilities nudge the same weights. 5 is average, so each point off centre
  // moves a weight by 6% — noticeable across a run, decisive in none.
  const swing = (score: number, per = 0.06): number => 1 + (score - 5) * per;
  const { intellect, endurance, agility, strength, luck } = survivor.abilities;

  profile.combat *= swing(strength);
  profile.defense *= swing(strength, 0.04);
  profile.fleeSurvival *= swing(agility, 0.08);
  profile.accidentRisk *= swing(11 - agility, 0.05);
  profile.medical *= swing(intellect);
  profile.scavenge *= swing(intellect, 0.04);
  profile.efficiency *= swing(endurance, 0.04);
  profile.rationing *= swing(intellect, 0.03);
  profile.variance *= swing(luck, 0.05);
  profile.chanceEncounter *= swing(luck, 0.07);

  PROFILE_KEYS.forEach((key) => {
    profile[key] = Math.max(0, profile[key]);
  });

  return profile;
};

/** Flat per-day stat deltas contributed by a survivor's job and traits. */
export const traitStatDeltas = (
  survivor: Survivor,
): Partial<Record<StatKey, number>> => {
  const deltas: Partial<Record<StatKey, number>> = {};

  const sources = [
    getJob(survivor.job)?.modifiers.stats,
    ...survivor.traits.map((traitId) => getTrait(traitId)?.modifiers.stats),
  ];

  sources.forEach((stats) => {
    if (!stats) return;
    (Object.keys(stats) as StatKey[]).forEach((key) => {
      deltas[key] = (deltas[key] ?? 0) + (stats[key] ?? 0);
    });
  });

  return deltas;
};
