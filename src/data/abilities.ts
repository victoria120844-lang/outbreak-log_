import type { AbilityKey, SurvivorAbilities } from '@/types';

export const ABILITY_KEYS: readonly AbilityKey[] = [
  'intellect',
  'endurance',
  'agility',
  'strength',
  'luck',
];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  intellect: '지력',
  endurance: '체력',
  agility: '민첩',
  strength: '힘',
  luck: '운',
};

export const ABILITY_MIN = 1;
export const ABILITY_MAX = 10;

export const clampAbility = (value: number): number =>
  Math.round(Math.min(ABILITY_MAX, Math.max(ABILITY_MIN, value)));

/** 3-8 keeps everyone plausible; the tails are what a lucky roll is for. */
export const rollAbilities = (random: () => number = Math.random): SurvivorAbilities => {
  const roll = (): number => 3 + Math.floor(random() * 6);
  return {
    intellect: roll(),
    endurance: roll(),
    agility: roll(),
    strength: roll(),
    luck: roll(),
  };
};

export const abilityTotal = (abilities: SurvivorAbilities): number =>
  ABILITY_KEYS.reduce((sum, key) => sum + abilities[key], 0);
