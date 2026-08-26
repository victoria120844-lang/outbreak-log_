import type { Item, ItemCategory } from '@/types';

export const ITEM_CATEGORIES: readonly ItemCategory[] = [
  '식량',
  '의료',
  '무기',
  '도구',
  '특수',
];

export const ITEMS: readonly Item[] = [
  /* ------------------------------------------------------------ 식량 */
  {
    id: 'cannedFood',
    name: '통조림',
    category: '식량',
    weight: 0.4,
    effect: '허기 -25',
    flavor: '라벨이 벗겨져 뭐가 들었는지 모른다.',
    rarity: 10,
    payload: { stats: { hunger: -25 }, foodDays: 1 },
  },
  {
    id: 'hardtack',
    name: '건빵',
    category: '식량',
    weight: 0.3,
    effect: '허기 -15',
    flavor: '씹으면 턱이 아프지만 배는 찬다.',
    rarity: 10,
    payload: { stats: { hunger: -15 }, foodDays: 1 },
  },
  {
    id: 'bottledWater',
    name: '생수',
    category: '식량',
    weight: 1,
    effect: '허기 -5, 기력 +10',
    flavor: '유통기한은 작년이었다.',
    rarity: 10,
    payload: { stats: { hunger: -5, stamina: 10 }, waterDays: 1 },
  },
  {
    id: 'waterFilter',
    name: '정수 필터',
    category: '식량',
    weight: 0.6,
    effect: '식수 5일분 확보',
    flavor: '빗물도 마실 수 있게 해준다. 맛은 보장 못 한다.',
    rarity: 3,
    payload: { waterDays: 5 },
  },
  {
    id: 'salt',
    name: '소금',
    category: '식량',
    weight: 0.2,
    effect: '식량 보존, 정신력 +3',
    flavor: '고기를 오래 버티게 한다. 무슨 고기인지는 묻지 않는다.',
    rarity: 4,
    payload: { stats: { morale: 3 } },
  },

  /* ------------------------------------------------------------ 의료 */
  {
    id: 'bandage',
    name: '붕대',
    category: '의료',
    weight: 0.1,
    effect: '체력 +10',
    flavor: '빨아 쓴 자국이 남아 있다.',
    rarity: 8,
    payload: { stats: { hp: 10 } },
  },
  {
    id: 'antiseptic',
    name: '소독약',
    category: '의료',
    weight: 0.3,
    effect: '감염 -15',
    flavor: '상처보다 그 냄새가 더 오래 남는다.',
    rarity: 6,
    payload: { stats: { infection: -15 }, infectionCure: 15 },
  },
  {
    id: 'antibiotics',
    name: '항생제',
    category: '의료',
    weight: 0.05,
    effect: '감염 -35',
    flavor: '여섯 알. 누구에게 쓸지 정해야 한다.',
    rarity: 2,
    payload: { stats: { infection: -35 }, infectionCure: 35 },
  },
  {
    id: 'painkiller',
    name: '진통제',
    category: '의료',
    weight: 0.05,
    effect: '정신력 +12',
    flavor: '아픔을 지우지 상처를 지우지 않는다.',
    rarity: 5,
    payload: { stats: { morale: 12 } },
  },
  {
    id: 'tourniquet',
    name: '지혈대',
    category: '의료',
    weight: 0.2,
    effect: '체력 +20',
    flavor: '묶는 순간부터 시간을 센다.',
    rarity: 3,
    payload: { stats: { hp: 20 } },
  },

  /* ------------------------------------------------------------ 무기 */
  {
    id: 'bat',
    name: '야구방망이',
    category: '무기',
    weight: 1.2,
    effect: '전투 +12',
    flavor: '손잡이에 누군가의 이름이 새겨져 있다.',
    rarity: 4,
    payload: { combat: 12 },
  },
  {
    id: 'hatchet',
    name: '손도끼',
    category: '무기',
    weight: 1,
    effect: '전투 +16',
    flavor: '장작을 팬 적은 없어 보인다.',
    rarity: 3,
    payload: { combat: 16 },
  },
  {
    id: 'kitchenKnife',
    name: '식칼',
    category: '무기',
    weight: 0.3,
    effect: '전투 +8',
    flavor: '가까이 붙어야 한다. 너무 가까이.',
    rarity: 5,
    payload: { combat: 8 },
  },
  {
    id: 'pistol',
    name: '권총',
    category: '무기',
    weight: 0.9,
    effect: '전투 +30, 탄약 필요',
    flavor: '총알보다 총이 흔한 법은 없다.',
    rarity: 1,
    payload: { combat: 30 },
  },
  {
    id: 'pistolAmmo',
    name: '권총탄',
    category: '무기',
    weight: 0.02,
    effect: '권총 사격에 소모',
    flavor: '세어보면 늘 생각보다 적다.',
    rarity: 2,
    payload: { supports: 'ammo' },
  },
  {
    id: 'crossbow',
    name: '사냥용 석궁',
    category: '무기',
    weight: 2.5,
    effect: '전투 +22',
    flavor: '조용하다. 다시 장전하는 동안만 빼고.',
    rarity: 1,
    payload: { combat: 22 },
  },

  /* ------------------------------------------------------------ 도구 */
  {
    id: 'flashlight',
    name: '손전등',
    category: '도구',
    weight: 0.3,
    effect: '탐색 +8',
    flavor: '빛은 길을 보여주고 위치도 알려준다.',
    rarity: 4,
    payload: { scavenge: 8 },
  },
  {
    id: 'battery',
    name: '건전지',
    category: '도구',
    weight: 0.05,
    effect: '손전등·무전기 가동',
    flavor: '흔들면 아직 소리가 난다.',
    rarity: 5,
    payload: { supports: 'power' },
  },
  {
    id: 'lighter',
    name: '라이터',
    category: '도구',
    weight: 0.02,
    effect: '정신력 +5, 탐색 +3',
    flavor: '불을 붙이면 연기가 올라간다. 누군가 본다.',
    rarity: 6,
    payload: { stats: { morale: 5 }, scavenge: 3 },
  },
  {
    id: 'rope',
    name: '밧줄',
    category: '도구',
    weight: 1.5,
    effect: '탐색 +6',
    flavor: '내려갈 때보다 올라올 때가 문제다.',
    rarity: 3,
    payload: { scavenge: 6 },
  },
  {
    id: 'toolbox',
    name: '공구함',
    category: '도구',
    weight: 3,
    effect: '탐색 +10',
    flavor: '부서진 것을 고치거나, 고칠 수 있다고 믿게 한다.',
    rarity: 2,
    payload: { scavenge: 10 },
  },
  {
    id: 'radio',
    name: '무전기',
    category: '도구',
    weight: 0.8,
    effect: '탐색 +5',
    flavor: '잡음뿐이다. 가끔은 잡음이 아니다.',
    rarity: 2,
    payload: { scavenge: 5 },
  },

  /* ------------------------------------------------------------ 특수 */
  {
    id: 'gasMask',
    name: '방독면',
    category: '특수',
    weight: 1,
    effect: '감염 위험 감소',
    flavor: '필터가 얼마나 남았는지 알 수 없다.',
    rarity: 2,
    payload: { infectionCure: 8 },
  },
  {
    id: 'stabVest',
    name: '방검복',
    category: '특수',
    weight: 3.5,
    effect: '방어 +10',
    flavor: '물리는 건 막아도 부러지는 건 못 막는다.',
    rarity: 1,
    payload: { combat: 10 },
  },
  {
    id: 'map',
    name: '지도',
    category: '특수',
    weight: 0.1,
    effect: '탐색 +12',
    flavor: '빨간 X 표시가 세 군데. 누가 그렸는지는 모른다.',
    rarity: 2,
    payload: { scavenge: 12 },
  },
  {
    id: 'antidepressant',
    name: '항우울제',
    category: '특수',
    weight: 0.05,
    effect: '정신력 +20',
    flavor: '무너지는 속도를 늦춘다.',
    rarity: 2,
    payload: { stats: { morale: 20 } },
  },
  {
    id: 'dogFood',
    name: '개 사료',
    category: '특수',
    weight: 2,
    effect: '허기 -10, 정신력 -5',
    flavor: '개는 없다. 아직은.',
    rarity: 3,
    payload: { stats: { hunger: -10, morale: -5 }, foodDays: 1 },
  },
];

const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export const getItem = (id: string): Item | undefined => ITEM_BY_ID.get(id);

export const isItemId = (value: unknown): value is string =>
  typeof value === 'string' && ITEM_BY_ID.has(value);

export const isItemCategory = (value: unknown): value is ItemCategory =>
  ITEM_CATEGORIES.some((category) => category === value);

/**
 * What the group starts with. Playtesting a cold start showed the run was
 * decided before the player had made a single decision — everyone starved
 * while the log was still introducing them.
 */
export const STARTER_SUPPLIES: ReadonlyArray<{
  itemId: string;
  quantity: number;
}> = [
  // Raised from 10 each. Food and water are spent one unit per person per day,
  // so ten cans was a single day's meals for a group of five — the run was
  // already lost before the log had finished introducing anybody.
  { itemId: 'cannedFood', quantity: 30 },
  { itemId: 'bottledWater', quantity: 30 },
  { itemId: 'antibiotics', quantity: 10 },
];

/** Items that can be spent on a specific person, rather than just carried. */
export const isUsableOnSurvivor = (item: Item): boolean =>
  item.payload.stats !== undefined;
