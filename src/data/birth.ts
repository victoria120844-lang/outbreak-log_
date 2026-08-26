/**
 * Copy and constants for the one thing in this world that goes the other way.
 *
 * Only a married pair — the 부부 rung, and only a romance, never a blood 가족
 * row the player set up — can start one. Which pair is not a question the run
 * asks: gender is not a gate, and either of the two carries it.
 */

/** Chance per day that a married couple conceives. */
export const CONCEPTION_ODDS = 0.1;

/** Days from conception to birth. Compressed: a run is rarely 280 days long. */
export const GESTATION_DAYS = 30;

/** Days after a birth before the same person can conceive again. */
export const BIRTH_COOLDOWN_DAYS = 45;

/** Oldest a survivor can be and still be the one carrying. */
export const CARRY_MAX_AGE = 45;

/**
 * hp below which the pregnancy is at risk, and the daily odds it is lost while
 * the carrier is that badly off. A pregnancy nobody has to protect is just a
 * timer.
 */
export const AT_RISK_HP = 30;
export const MISCARRIAGE_ODDS = 0.12;

/** What the day costs the carrier, every day. */
export const CARRY_STAMINA = -3;
/** And what it costs the group to keep them fed. */
export const CARRY_HUNGER = 3;

/** hp the birth itself takes, and the odds it goes badly on top of that. */
export const BIRTH_HP_COST = -18;
export const HARD_BIRTH_ODDS = 0.15;
export const HARD_BIRTH_HP_COST = -22;

/** What the group gets out of it. */
export const BIRTH_MORALE = 22;

/**
 * Said plainly, above the flavour line. The flavour lines are evocative and
 * none of them uses the word, so a playtester read the whole arc without ever
 * being told anybody was pregnant.
 */
/*
 * Phrased around 와/과 rather than a copula. A first pass ended on `{상대}다`,
 * which the particle corrector does not touch — it handles 이/가, not 이다 —
 * so the log printed 「아이의 다른 부모는 지연다」.
 */
export const CONCEPTION_ANNOUNCE =
  '{생존자}가 임신했다. {상대}와 사이에서 생긴 아이다.';

export const CONCEPTION_LINES: readonly string[] = [
  '{생존자}가 {상대}에게만 먼저 말했다. 그날 저녁은 아무도 배급 얘기를 하지 않았다.',
  '{생존자}가 아이를 가졌다. {상대}는 한참 아무 말도 못 했다.',
  '{생존자}가 달을 세어봤다고 했다. 두 번 세었다고 했다.',
];

export const CONCEPTION_DIALOGUE: readonly string[] = [
  '지금 이런 세상에 말이야.',
  '그래도 좋은 소식은 좋은 소식이야.',
  '아무한테도 아직 말하지 마.',
  '이름부터 생각해 두자.',
];

/** Said as the weeks pass. Keyed loosely to how far along it is. */
export const EARLY_LINES: readonly string[] = [
  '{생존자}가 아침마다 속을 게워냈다. 아무도 이유를 묻지 않았다.',
  '{생존자}의 몫이 조금씩 늘었다. 반대하는 사람은 없었다.',
  '{생존자}가 무거운 것은 들지 않기로 했다. 아무도 토를 달지 않았다.',
];

export const LATE_LINES: readonly string[] = [
  '{생존자}가 이제 담을 넘지 않는다. 그 일은 다른 사람이 맡았다.',
  '{생존자}가 밤에 잠을 설쳤다. 발로 찬다고 했다.',
  '누군가 창고에서 상자를 하나 꺼내 요람 모양으로 잘랐다.',
];

export const LATE_DIALOGUE: readonly string[] = [
  '이제 곧이야. 준비해 둬.',
  '뜨거운 물하고 깨끗한 천. 그거면 돼.',
  '내가 옆에 있을게.',
];

export const BIRTH_LINE =
  '{생존자}가 아이를 낳았다. 새벽 세 시였고, 우는 소리에 전부 깼다.';

export const HARD_BIRTH_LINE =
  '{생존자}의 출산은 길었다. 아침이 되어서야 울음소리가 났다.';

export const BIRTH_NAMING =
  '아이의 이름은 {상대}로 정해졌다. {생존자}가 골랐다.';

export const BIRTH_DIALOGUE: readonly string[] = [
  '손가락 열 개, 발가락 열 개.',
  '이 애는 이 세상밖에 모르겠구나.',
  '우리 여기까지 왔어. 이만큼 왔어.',
  '오늘은 아무도 밖에 안 나가.',
];

export const MISCARRIAGE_LINE =
  '{생존자}가 아이를 잃었다. 그날 일지에는 다른 것이 적히지 않았다.';

export const MISCARRIAGE_DIALOGUE: readonly string[] = [
  '아무 말도 하지 마. 아무 말도.',
  '내가 더 잘 먹었어야 했는데.',
];

/** Given names for someone who has never known anything else. */
export const BABY_NAMES: readonly string[] = [
  '해든', '이든', '라온', '나래', '아라', '늘품', '시온',
  '온유', '하람', '보름', '가람', '슬기', '여름', '새벽',
  '푸른', '도담', '별하', '한결', '초록', '미르',
];
