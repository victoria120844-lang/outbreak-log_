import { rollAbilities } from '@/data/abilities';
import { JOBS } from '@/data/jobs';
import { MBTI_TYPES } from '@/data/mbti';
import { TRAITS } from '@/data/traits';
import type {
  Gender,
  JobId,
  MbtiAxisState,
  SurvivorAbilities,
  TraitId,
} from '@/types';

/** Common Korean given names, so a rolled survivor sounds like a person. */
const GIVEN_NAMES: readonly string[] = [
  '민수', '지연', '현우', '서윤', '준호', '은지', '태민', '수아',
  '동현', '하은', '재희', '유진', '성민', '다연', '건우', '예린',
  '우진', '소희', '지훈', '나경', '승현', '가온', '도윤', '세아',
  '한별', '정우', '미르', '주원', '연서', '태오',
];

const GENDERS: readonly Gender[] = ['남성', '여성', '비공개'];

const takeOne = <T,>(items: readonly T[], random: () => number): T | undefined =>
  items[Math.floor(random() * items.length)];

export interface RandomDraft {
  name: string;
  gender: Gender;
  age: number;
  job: JobId;
  axes: MbtiAxisState;
  traits: TraitId[];
  abilities: SurvivorAbilities;
}

/**
 * Rolls a whole survivor. `taken` keeps the name unique against the roster so
 * the form never hands back something it will immediately reject.
 */
export const rollSurvivorDraft = (
  taken: readonly string[],
  random: () => number = Math.random,
): RandomDraft => {
  const available = GIVEN_NAMES.filter((name) => !taken.includes(name));
  const pool = available.length > 0 ? available : GIVEN_NAMES;
  const name = takeOne(pool, random) ?? '생존자';

  const traits: TraitId[] = [];
  while (traits.length < 3) {
    const trait = takeOne(TRAITS, random);
    if (trait && !traits.includes(trait.id)) traits.push(trait.id);
  }

  const mbti = takeOne(MBTI_TYPES, random) ?? 'INTP';
  const letters = Array.from(mbti);

  return {
    name,
    gender: takeOne(GENDERS, random) ?? '비공개',
    // A spread wide enough that honorifics actually differ between people.
    age: 17 + Math.floor(random() * 45),
    job: takeOne(JOBS, random)?.id ?? 'officeWorker',
    axes: {
      ei: letters[0] === 'E' ? 'E' : 'I',
      ns: letters[1] === 'N' ? 'N' : 'S',
      tf: letters[2] === 'T' ? 'T' : 'F',
      jp: letters[3] === 'J' ? 'J' : 'P',
    },
    traits,
    abilities: rollAbilities(random),
  };
};
