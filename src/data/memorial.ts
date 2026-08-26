/**
 * What the living say when someone does not come back. Which set gets used
 * depends on how close the two of them actually were, so the same death reads
 * differently to different people.
 */

export interface MemorialSet {
  /** Lowest pair trust that unlocks these words. */
  threshold: number;
  lines: readonly string[];
}

/** `{호칭}` is how the speaker addressed the dead — age decides the term. */
export const MEMORIAL_LINES: readonly MemorialSet[] = [
  {
    threshold: 100,
    lines: [
      '{호칭} 몫까지 살겠다는 말은 못 하겠어. 그냥… 보고 싶어.',
      '{호칭}이 없는 아침은 아직도 낯설어.',
      '같이 살자고 했잖아. 그 말은 지켜야지.',
      '{호칭}, 나 아직 여기 있어.',
    ],
  },
  {
    threshold: 60,
    lines: [
      '{호칭}은 늘 먼저 앞에 섰어. 그게 문제였지.',
      '{호칭}한테 고맙다는 말을 못 했다.',
      '이제 누구한테 등을 맡기지.',
    ],
  },
  {
    threshold: 30,
    lines: [
      '{호칭}은 농담을 잘했어. 그게 기억난다.',
      '어제까지 같이 밥을 먹었는데.',
      '{호칭} 이름은 적어두자. 잊지 않게.',
    ],
  },
  {
    threshold: 0,
    lines: [
      '잘 알지도 못하는 사람이었는데, 이상하게 허전하네.',
      '이름이 뭐였더라. 아니, 알아. 알고 있어.',
      '한 명 줄었다. 그게 다야.',
    ],
  },
  {
    threshold: -1000,
    lines: [
      '슬프지 않아. 그게 제일 무섭다.',
      '나는 아무 말도 안 할래.',
      '이렇게 될 줄 알았어.',
    ],
  },
];

export const memorialLinesFor = (trust: number): readonly string[] => {
  const set = MEMORIAL_LINES.find((candidate) => trust >= candidate.threshold);
  return set?.lines ?? [];
};

/**
 * Grief does not end with the funeral. For a few days after losing someone
 * they loved, a survivor keeps saying so.
 */
export const GRIEF_LINES: readonly string[] = [
  '{호칭} 자리에 아무도 안 앉았으면 좋겠어.',
  '자꾸 두 사람 몫을 덜게 된다.',
  '{호칭} 목소리가 기억이 안 나기 시작했어.',
  '오늘은 좀 괜찮았어. 그게 미안해.',
  '아직 {호칭} 담요를 못 치웠다.',
];

/** How long the grief keeps surfacing in the log. */
export const GRIEF_DAYS = 6;
/** Trust that counts as having loved them. */
export const GRIEF_THRESHOLD = 100;
