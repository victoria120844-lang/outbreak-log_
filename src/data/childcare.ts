/**
 * What the group does with a child in the house.
 *
 * A birth used to add a name to the roster and then nothing: the newborn ate,
 * took up a card, and was never mentioned again. Everything here exists so the
 * people around them behave like people around a baby.
 */

/** Trust every adult gains toward a child each day, just by being there. */
export const CHILD_BOND = 3;
/** Extra on top of that for the two who are raising them. */
export const PARENT_BOND = 2;

/** Morale a parent gets back each day the child is still here. */
export const PARENT_MORALE = 3;
/** And what everyone else gets, at a lower rate. */
export const HOUSEHOLD_MORALE = 1;

/** How often a day includes somebody looking after the child. */
export const CARE_ODDS = 0.35;

/**
 * Everyday care. `{생존자}` is whoever is holding the baby, `{상대}` is the
 * child, and `{호칭}` is what that person actually calls them — 아들 or 딸 from
 * a parent, the child's name from anybody else.
 */
export const CARE_LINES: readonly string[] = [
  '{생존자}가 {상대}를 업고 창고를 정리했다. 내려놓으면 울었다.',
  '{생존자}가 {상대}의 이불을 한 겹 더 덮어줬다.',
  '{생존자}가 통조림 국물을 미지근하게 식혀 {상대}에게 먹였다.',
  '{생존자}가 {상대}를 안고 복도를 몇 바퀴 돌았다. 새벽 두 시였다.',
  '{생존자}가 {상대}의 기저귀 대신 쓸 천을 잘라 두었다.',
  '{생존자}가 {상대} 옆에 앉아 한참을 들여다봤다.',
  '{생존자}가 {상대}에게 자기 몫을 한 숟갈 덜어줬다.',
  '{상대}가 울자 {생존자}가 먼저 일어났다. 아무도 말리지 않았다.',
  '{생존자}가 {상대}를 재우려고 같은 노래를 여덟 번 불렀다.',
  '{생존자}가 문틈을 천으로 막았다. {상대}의 자리 쪽이었다.',
];

export const CARE_DIALOGUE: readonly string[] = [
  '{호칭}, 오늘은 조용하네.',
  '{호칭}, 이거 먹어보자.',
  '{호칭}, 아빠 엄마 여기 있어.',
  '{호칭} 자는 거 보면 하루가 괜찮아져.',
  '{호칭}, 밖은 아직 안 돼. 조금만 더.',
  '손 좀 봐. 이렇게 작은데.',
  '오늘은 내가 볼게. 자러 가.',
  '{호칭}이 웃었어. 방금 웃었다고.',
];

/** Said by somebody who is not a parent. The group raises them too. */
export const HOUSEHOLD_DIALOGUE: readonly string[] = [
  '우리 애야. 누구 하나만의 애가 아니라.',
  '내가 이 애 삼촌쯤은 되지.',
  '이 애 몫은 내 몫에서 떼.',
  '커서 이 얘기 다 해줄 거야.',
];

/**
 * Things a child does for the first time. Fired on the exact day the elapsed
 * count matches, so each one happens once without any state to track.
 */
export interface Milestone {
  /** Days since birth. */
  after: number;
  line: string;
  dialogue?: readonly string[];
}

export const MILESTONES: readonly Milestone[] = [
  {
    after: 12,
    line: '{상대}가 처음으로 소리 내어 웃었다. 그날은 아무도 밖에 나가지 않았다.',
    dialogue: ['들었어? 방금 웃었어.', '이런 소리를 다시 들을 줄은 몰랐네.'],
  },
  {
    after: 30,
    line: '{상대}가 처음으로 뒤집었다. 다들 하던 일을 멈추고 봤다.',
    dialogue: ['다시 해봐. 한 번만 더.', '적어둬. 오늘 날짜 적어둬.'],
  },
  {
    after: 60,
    line: '{상대}가 이가 났다. {생존자}가 밤새 안고 있었다.',
    dialogue: ['{호칭}, 조금만 참자.', '아픈 거야. 아픈 게 크는 거야.'],
  },
  {
    after: 100,
    line: '{상대}가 벽을 짚고 일어섰다. 두 걸음 걷고 앉았다.',
    dialogue: ['걸었어! 방금 걸었어!', '{호칭}, 이리 와. 이쪽으로.'],
  },
  {
    after: 150,
    line: '{상대}가 처음으로 이름을 불렀다. {생존자}는 대답하는 데 시간이 걸렸다.',
    dialogue: ['다시 불러줘. 한 번만 더.', '나를 부른 거 맞지?'],
  },
];
