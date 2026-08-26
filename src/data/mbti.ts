import type { MbtiType } from '@/types';

export const MBTI_TYPES: readonly MbtiType[] = [
  'ISTJ',
  'ISFJ',
  'INFJ',
  'INTJ',
  'ISTP',
  'ISFP',
  'INFP',
  'INTP',
  'ESTP',
  'ESFP',
  'ENFP',
  'ENTP',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
];

export const isMbtiType = (value: unknown): value is MbtiType =>
  MBTI_TYPES.some((type) => type === value);

/** One survival-flavored line per type, shown as the code is composed. */
export const MBTI_DESCRIPTIONS: Record<MbtiType, string> = {
  ISTJ: '규칙이 무너져도 규칙을 지킨다. 배급 장부는 그가 쓴다.',
  ISFJ: '남을 먼저 챙기다 자기 몫을 잊는다.',
  INFJ: '모두를 구하려 한다. 그래서 아무도 버리지 못한다.',
  INTJ: '최악을 미리 계산해 둔다. 그 계산에 당신도 들어 있다.',
  ISTP: '말없이 고치고 말없이 사라진다.',
  ISFP: '지금 이 순간만 본다. 내일 계획은 세우지 않는다.',
  INFP: '마지막까지 사람을 믿는다. 그게 문제다.',
  INTP: '감염 경로를 분석하는 동안 문이 열린다.',
  ESTP: '생각보다 몸이 먼저 나간다. 대개는 그게 통한다.',
  ESFP: '무너진 세상에서도 웃긴 이야기를 찾아낸다.',
  ENFP: '위험한 낙관. 밖으로 나가고 싶어 한다.',
  ENTP: '안 될 이유를 뒤집는 걸 즐긴다. 가끔 크게 잃는다.',
  ESTJ: '명령을 내린다. 따르지 않으면 명단에서 지운다.',
  ESFJ: '분위기를 붙든다. 무리가 갈라지면 가장 먼저 무너진다.',
  ENFJ: '사람을 모은다. 모은 만큼 짐도 진다.',
  ENTJ: '지휘봉을 놓지 않는다. 희생도 계획의 일부다.',
};
