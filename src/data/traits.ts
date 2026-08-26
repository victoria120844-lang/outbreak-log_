import type { Trait, TraitId } from '@/types';

/**
 * The full trait pool. A survivor carries exactly three.
 *
 * `modifiers` is declared here but not applied at registration — Section 6
 * consumes both the stat deltas and the event weights. Weights are
 * multipliers where 1 is neutral.
 */
export const TRAITS: readonly Trait[] = [
  {
    id: 'coolHeaded',
    label: '냉정함',
    flavor: '감정보다 계산이 앞선다.',
    modifiers: {
      stats: { morale: 5 },
      eventWeights: { conflict: 0.7, combat: 1.1 },
    },
  },
  {
    id: 'hotBlooded',
    label: '다혈질',
    flavor: '먼저 소리치고 나중에 후회한다.',
    modifiers: {
      stats: { morale: -5 },
      eventWeights: { conflict: 1.5, combat: 1.2 },
    },
  },
  {
    id: 'altruistic',
    label: '이타적',
    flavor: '자기 몫을 남에게 넘긴다.',
    modifiers: {
      stats: { hunger: 5 },
      eventWeights: { cooperation: 1.4, conflict: 0.8 },
      behavior: { shareMedicine: 1.8, sacrifice: 1.7 },
    },
  },
  {
    id: 'selfish',
    label: '이기적',
    flavor: '먼저 챙기는 쪽이 살아남는다고 믿는다.',
    modifiers: {
      stats: { hunger: -5 },
      eventWeights: { cooperation: 0.6, conflict: 1.3 },
    },
  },
  {
    id: 'optimistic',
    label: '낙천적',
    flavor: '내일은 나아질 거라고 말한다.',
    modifiers: {
      stats: { morale: 10 },
      eventWeights: { morale: 1.3 },
    },
  },
  {
    id: 'pessimistic',
    label: '비관적',
    flavor: '최악을 먼저 입에 올린다.',
    modifiers: {
      stats: { morale: -10 },
      eventWeights: { morale: 0.7 },
    },
  },
  {
    id: 'timid',
    label: '겁많음',
    flavor: '문 여는 일은 늘 남의 차지.',
    modifiers: {
      stats: { stamina: -5 },
      eventWeights: { combat: 0.6, scavenge: 0.8 },
      // Poor in a fight, but the first one out of the room.
      behavior: { fleeSurvival: 1.6 },
    },
  },
  {
    id: 'reckless',
    label: '저돌적',
    flavor: '물러서는 법을 배우지 못했다.',
    modifiers: {
      stats: { hp: -5 },
      eventWeights: { combat: 1.5, accident: 1.3 },
    },
  },
  {
    id: 'cautious',
    label: '신중함',
    flavor: '두 번 확인하고 한 번 움직인다.',
    modifiers: {
      stats: { stamina: 5 },
      eventWeights: { accident: 0.6, scavenge: 0.9 },
    },
  },
  {
    id: 'impulsive',
    label: '충동적',
    flavor: '생각이 끝나기 전에 몸이 움직인다.',
    modifiers: {
      eventWeights: { accident: 1.4, scavenge: 1.2 },
    },
  },
  {
    id: 'leadership',
    label: '리더십',
    flavor: '혼란 속에서 목소리가 남는다.',
    modifiers: {
      stats: { morale: 8 },
      eventWeights: { cooperation: 1.4, conflict: 0.8 },
    },
  },
  {
    id: 'handy',
    label: '손재주',
    flavor: '부서진 것을 되살린다.',
    modifiers: {
      eventWeights: { scavenge: 1.3, accident: 0.8 },
    },
  },
  {
    id: 'suspicious',
    label: '의심많음',
    flavor: '새로 온 사람을 오래 지켜본다.',
    modifiers: {
      eventWeights: { cooperation: 0.7, conflict: 1.2, infection: 0.9 },
    },
  },
  {
    id: 'humorous',
    label: '유머러스',
    flavor: '최악의 순간에 농담을 한다.',
    modifiers: {
      stats: { morale: 6 },
      eventWeights: { morale: 1.2, conflict: 0.8 },
    },
  },
  {
    id: 'cleanFreak',
    label: '결벽증',
    flavor: '피 묻은 손으로는 아무것도 먹지 않는다.',
    modifiers: {
      stats: { morale: -3 },
      eventWeights: { infection: 0.7, conflict: 1.1 },
    },
  },
  {
    id: 'gluttonous',
    label: '식탐',
    flavor: '배급을 늘 초과한다.',
    modifiers: {
      stats: { hunger: 10 },
      eventWeights: { conflict: 1.2 },
    },
  },
  {
    id: 'insomniac',
    label: '불면증',
    flavor: '밤을 뜬눈으로 넘긴다.',
    modifiers: {
      stats: { stamina: -10 },
      eventWeights: { morale: 0.9, accident: 1.2 },
    },
  },
  {
    id: 'strongBody',
    label: '강한 체력',
    flavor: '오래 걷고 늦게 지친다.',
    modifiers: {
      stats: { hp: 10, stamina: 10 },
      eventWeights: { combat: 1.2 },
    },
  },
    {
    id: 'marksman',
    label: '사격 경험',
    flavor: '총구가 흔들리지 않는다.',
    modifiers: {
      eventWeights: { combat: 1.5 },
    },
  },
  {
    id: 'medicalKnowledge',
    label: '의학 지식',
    flavor: '상처를 보면 순서를 안다.',
    modifiers: {
      eventWeights: { medical: 1.6, infection: 0.8 },
    },
  },
  {
    id: 'liar',
    label: '거짓말쟁이',
    flavor: '필요하면 이야기를 지어낸다.',
    modifiers: {
      eventWeights: { conflict: 1.2, cooperation: 0.9 },
      // Can keep a bite quiet for two more days than anyone else.
      behavior: { hideInfectionDays: 2 },
    },
  },
];

const TRAIT_BY_ID = new Map<TraitId, Trait>(
  TRAITS.map((trait) => [trait.id, trait]),
);

export const getTrait = (id: TraitId): Trait | undefined => TRAIT_BY_ID.get(id);

/** Korean labels for a list of ids, skipping anything unrecognized. */
export const getTraitLabels = (ids: readonly TraitId[]): string[] =>
  ids.flatMap((id) => {
    const trait = TRAIT_BY_ID.get(id);
    return trait ? [trait.label] : [];
  });

export const isTraitId = (value: unknown): value is TraitId =>
  TRAITS.some((trait) => trait.id === value);
