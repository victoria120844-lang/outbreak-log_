import type { RelationshipKind } from '@/types';

export const RELATIONSHIP_KINDS: readonly RelationshipKind[] = [
  '가족',
  '연인',
  '친구',
  '동료',
  '라이벌',
  '원한',
  '은인',
  '초면',
];

/** Picking a kind seeds the trust value; the slider can override it. */
export const KIND_DEFAULT_TRUST: Record<RelationshipKind, number> = {
  // Family starts at the top of the scale — past the wedding, not before it.
  가족: 150,
  연인: 100,
  친구: 50,
  동료: 25,
  라이벌: -10,
  원한: -70,
  은인: 60,
  초면: 0,
};

export const DEFAULT_KIND: RelationshipKind = '초면';

export const TRUST_MIN = -100;
export const TRUST_MAX = 150;
export const TRUST_STEP = 5;

/**
 * Trust is a ladder, not just a number. Crossing a rung upward is an event in
 * the log, which is where the relationship actually becomes a story.
 */
export interface RelationshipStage {
  /** Lowest trust that still counts as this stage. */
  threshold: number;
  label: string;
  /** Narration when a pair climbs onto this rung. */
  lines: readonly string[];
  /**
   * Headline written above the flavor line when a pair climbs onto this rung.
   * Only the rungs that change what the two people ARE get one — the flavor
   * lines are evocative but they never say the word, and playtesting showed
   * people could not tell who had actually paired off.
   */
  announce?: string;
  /** Something one of them says as it happens. */
  dialogue?: readonly string[];
  /** Narration when a pair falls back down onto this rung. */
  fallLines?: readonly string[];
  /** Something said on the way down. */
  fallDialogue?: readonly string[];
}

export const RELATIONSHIP_STAGES: readonly RelationshipStage[] = [
  {
    threshold: 150,
    label: '부부',
    announce: '{생존자}와 {상대}가 부부가 되었다.',
    dialogue: ['살아서 나가면, 같이 살자.', '증인은 여기 있는 사람들 전부야.'],
    lines: [
      '{생존자}와 {상대}가 서로를 가족이라고 부르기로 했다. 증인은 남은 사람 전부였다.',
      '반지는 없었다. {생존자}와 {상대}는 그래도 손을 맞잡았다.',
    ],
  },
  {
    threshold: 100,
    label: '연인',
    announce: '{생존자}와 {상대}가 연인이 되었다.',
    dialogue: ['오늘은 옆에 있어요.', '이 밤만 넘기면, 그때 얘기해요.'],
    fallLines: ['{생존자}와 {상대}가 따로 잤다. 이유는 묻지 않았다.'],
    fallDialogue: ['조금만 떨어져 있자.'],
    lines: [
      '{생존자}와 {상대}가 같은 담요를 덮고 잤다. 아무도 놀리지 않았다.',
      '{생존자}가 {상대}의 몫을 따로 남겨두기 시작했다.',
    ],
  },
  {
    threshold: 60,
    label: '베스트 프렌드',
    dialogue: ['뒤는 안 봐도 되지?', '너 없었으면 벌써 죽었어.'],
    fallLines: ['{생존자}가 {상대}와 같은 조를 피했다.'],
    fallDialogue: ['오늘은 따로 가자.'],
    lines: [
      '{생존자}와 {상대}는 이제 말 없이도 순서를 안다.',
      '{생존자}가 {상대}에게 등을 맡겼다. 두 번 생각하지 않았다.',
    ],
  },
  {
    threshold: 50,
    label: '친구',
    dialogue: ['먼저 자. 내가 볼게.', '농담이라도 좀 하자.'],
    fallLines: ['{생존자}와 {상대} 사이에 존댓말이 돌아왔다.'],
    fallDialogue: ['그쪽이 알아서 하세요.'],
    lines: [
      '{생존자}와 {상대}가 처음으로 농담을 주고받았다.',
      '{생존자}가 {상대}의 이름을 줄여 부르기 시작했다.',
    ],
  },
  {
    threshold: 30,
    label: '지인',
    dialogue: ['그쪽은 어디서 왔어요?', '이거 반만 가져가요.'],
    fallLines: ['{생존자}가 {상대}의 이름을 다시 성으로 불렀다.'],
    fallDialogue: ['김 씨, 그거 두고 가요.'],
    lines: [
      '{생존자}와 {상대}가 서로의 사정을 조금 알게 됐다.',
      '{생존자}가 {상대}에게 담배를 나눠 줬다. 마지막 한 개비는 아니었다.',
    ],
  },
  {
    threshold: 10,
    label: '낯선 사람',
    dialogue: ['이름, 뭐라고 했죠?', '아까는 고마웠어요.'],
    fallLines: ['{생존자}와 {상대}가 서로를 지나쳤다. 눈은 마주치지 않았다.'],
    fallDialogue: ['할 말 없는데요.'],
    lines: [
      '{생존자}와 {상대}가 처음으로 이름을 물었다.',
      '{생존자}가 {상대} 쪽을 한 번 더 봤다.',
    ],
  },
  {
    threshold: 0,
    label: '모르는 사람',
    lines: [],
    fallLines: [
      '{생존자}와 {상대}는 다시 남이 됐다.',
      '{생존자}가 {상대}의 이름을 부르지 않게 됐다.',
    ],
    fallDialogue: ['그 사람 얘기는 하지 말자.', '이제 남이야.'],
  },
  {
    threshold: -60,
    label: '불신',
    lines: [],
    fallLines: [
      '{생존자}가 {상대}의 배급을 세기 시작했다.',
      '{생존자}가 {상대}와 같은 방에서 자지 않겠다고 했다.',
    ],
    fallDialogue: ['저 사람 몫이 왜 저래.', '나는 저쪽 방에서 잘게.'],
  },
  {
    threshold: TRUST_MIN,
    label: '적대',
    lines: [],
    fallLines: [
      '{생존자}는 {상대} 쪽으로 등을 보이지 않는다.',
      '{생존자}가 칼을 베개 밑에 두고 잤다. {상대} 때문이다.',
    ],
    fallDialogue: ['등 뒤에 두지 마.', '언젠가 저 사람이 먼저 할 거야.'],
  },
];

export const stageOf = (trust: number): RelationshipStage => {
  const stage = RELATIONSHIP_STAGES.find(
    (candidate) => trust >= candidate.threshold,
  );
  return stage ?? RELATIONSHIP_STAGES[RELATIONSHIP_STAGES.length - 1]!;
};

/** The wedding is the only rung that is announced as a milestone. */
export const MARRIAGE_THRESHOLD = 150;

/** Trust at which a pair is romantically committed, not merely close. */
export const LOVER_THRESHOLD = 100;

/**
 * Nobody under this age is paired off by the simulation. Registration now
 * accepts children, and a survival toy that quietly marries them off is not a
 * toy anyone wants. Their bonds top out one rung below.
 */
export const ROMANCE_MIN_AGE = 19;

/**
 * Where a broken pair lands. Deep enough that the conflict templates gated on
 * `maxTrust: -60` become eligible — a breakup that only lowered a number read
 * as nothing at all, so the two of them now actually fight about it.
 */
export const BREAKUP_TRUST = -65;

/** Morale cost of the day it ends, to both of them. */
export const BREAKUP_MORALE = -10;

export const BREAKUP_LINES: readonly string[] = [
  '{생존자}와 {상대}가 끝냈다. 담요 한 장이 남았고, 아무도 가져가지 않았다.',
  '{생존자}가 {상대}의 몫을 따로 챙기는 일을 그만뒀다.',
  '{생존자}와 {상대}가 소리를 질렀다. 무슨 말이었는지는 아무도 옮기지 않았다.',
  '{생존자}와 {상대}는 이제 같은 방에서 자지 않는다. 그 이유를 모르는 사람은 없다.',
  '{생존자}가 {상대}에게 받은 것을 전부 돌려줬다. 두 개뿐이었다.',
];

export const BREAKUP_DIALOGUE: readonly string[] = [
  '다시는 내 이름 부르지 마.',
  '너 아니었어도 나 여기까지 왔어.',
  '그때 왜 그랬는지 평생 안 물어볼게.',
  '얼굴 보기 싫으니까 저쪽으로 가.',
  '나한테 뭘 해줬다고 생각하는 건데.',
];

/** What the two of them say to each other in the days after. */
export const EX_LOVER_DIALOGUE: readonly string[] = [
  '저 사람 몫은 내가 안 세.',
  '같은 조로는 안 나가. 그건 못 해.',
  '숨 쉬는 소리까지 거슬려.',
  '내 물건에 손대지 말라고 했지.',
  '한때 저 사람 때문에 살았다는 게 제일 짜증나.',
];

/** How often a broken pair snaps at each other on a later day. */
export const EX_LOVER_ODDS = 0.35;

/** Trust at which two people stop being ex-lovers and go back to being people. */
export const RECONCILE_TRUST = 30;

export const RECONCILE_LINES: readonly string[] = [
  '{생존자}와 {상대}가 오랜만에 같은 조로 나갔다. 아무도 그 얘기를 꺼내지 않았다.',
  '{생존자}가 {상대}에게 먼저 물을 건넸다. 받는 데 잠깐 걸렸다.',
  '{생존자}와 {상대}가 같은 자리에 앉았다. 그게 전부였고, 그거면 됐다.',
];

export const isRelationshipKind = (
  value: unknown,
): value is RelationshipKind =>
  RELATIONSHIP_KINDS.some((kind) => kind === value);

export const clampTrust = (value: number): number =>
  Math.min(TRUST_MAX, Math.max(TRUST_MIN, Math.round(value)));

/** Reads back as the survivor would describe it, not as a number. */
export const describeTrust = (trust: number): string => {
  if (trust <= -61) return '언젠가 등에 칼을 꽂을 것이다.';
  if (trust <= -21) return '말을 섞지 않는다.';
  if (trust <= 20) return '서로를 잘 모른다.';
  if (trust <= 60) return '믿을 만하다.';
  if (trust <= 99) return '대신 죽을 수 있다.';
  if (trust <= 149) return '이 사람이 없으면 버틸 이유가 없다.';
  return '남은 평생을 함께하기로 했다.';
};

/** Trust always carries its sign so +0 never reads as a rating. */
export const formatTrust = (trust: number): string =>
  trust > 0 ? `+${trust}` : String(trust);
