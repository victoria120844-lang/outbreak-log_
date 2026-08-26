import { rollAbilities } from '@/data/abilities';
import { applyJobAbilityBonus } from '@/data/jobs';
import { BASE_STATS } from '@/data/stats';
import type {
  Gender,
  JobId,
  MbtiType,
  Survivor,
  SurvivorAbilities,
  TraitId,
} from '@/types';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export interface SurvivorDraft {
  name: string;
  gender: Gender;
  age: number;
  job: JobId;
  mbti: MbtiType;
  traits: TraitId[];
  joinedDay: number;
  /** Pre-rolled so the form can show the numbers before committing. */
  abilities?: SurvivorAbilities;
}

/**
 * Every survivor starts on the same baseline. Trait stat modifiers are not
 * applied here — Section 6 folds them in during the daily tick.
 */
export const createSurvivor = (draft: SurvivorDraft): Survivor => ({
  id: createId(),
  name: draft.name,
  gender: draft.gender,
  age: draft.age,
  job: draft.job,
  mbti: draft.mbti,
  traits: [...draft.traits],
  stats: { ...BASE_STATS },
  // The job's training lands on top of whatever the player distributed.
  abilities: applyJobAbilityBonus(draft.abilities ?? rollAbilities(), draft.job),
  status: '생존',
  joinedDay: draft.joinedDay,
  alive: true,
});
