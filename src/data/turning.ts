/**
 * Copy for the moment the infection finishes, and for what the group does
 * about it. Kept out of the engine so the writing can be read on its own.
 */

export const TURN_LINES: readonly string[] = [
  '{생존자}의 숨이 멎었다가 다시 이어졌다. 눈은 더 이상 아무것도 보지 않는다.',
  '{생존자}가 일어섰다. 이름을 세 번 불렀지만 돌아보지 않았다.',
  '{생존자}가 벽을 향해 걸어갔다. 벽인 줄도 모르는 것 같았다.',
  '{생존자}의 손이 문고리를 더듬었다. 여는 법은 잊은 뒤였다.',
];

export const TURN_DIALOGUE: readonly string[] = [
  '아직 안에 있을지도 몰라. 그렇지?',
  '아무도 문 열지 마. 아무도.',
  '어제까지 같이 밥 먹던 사람이야.',
  '나 저 얼굴 못 봐. 못 보겠어.',
];

/** The prompt that stops the run when somebody turns. */
export const TURNED_PROMPT =
  '{상대}가 돌아섰다. 이름을 불러도 반응하지 않는다. {생존자}가 문 앞에 섰다.';

export const TURNED_PUT_DOWN_SUCCESS =
  '{생존자}가 {상대}를 보냈다. 한 번에 끝냈고, 그 뒤로 한 마디도 하지 않았다.';
export const TURNED_PUT_DOWN_FAILURE =
  '{생존자}가 손이 떨려 두 번을 더 해야 했다. 팔뚝이 긁혔다.';
export const TURNED_RELEASE_SUCCESS =
  '{생존자}가 문을 열고 물러섰다. {상대}는 걸어 나갔고, 돌아보지 않았다.';
export const TURNED_RELEASE_FAILURE =
  '{상대}가 문틀을 붙잡았다. {생존자}가 뿌리치는 데 오래 걸렸다.';
export const TURNED_CONTAIN =
  '{생존자}가 {상대}를 창고에 넣고 밖에서 잠갔다. 아무도 그 앞을 지나지 않는다.';

export const TURNED_DIALOGUE: Record<string, readonly string[]> = {
  putDown: ['미안하다는 말은 안 할게.', '내가 해야 하는 일이었어.'],
  release: ['멀리 가. 제발 멀리 가.', '문은 내가 닫을게.'],
  contain: ['아직은 못 해. 아직은.', '나중에. 나중에 하자.'],
};

/** Days the locked door keeps reminding everyone it is there. */
export const CONTAINED_LINES: readonly string[] = [
  '창고 문이 밤새 덜컹거렸다.',
  '창고 쪽에서 긁는 소리가 났다. 아무도 그 얘기를 꺼내지 않았다.',
  '누군가 창고 문에 의자를 하나 더 받쳤다.',
];

export const BREAKOUT_LINE =
  '창고 문이 열렸다. {상대}가 {생존자}를 덮쳤다.';

export const BREAKOUT_DIALOGUE: readonly string[] = [
  '문 받쳐놓은 게 저거였어?',
  '떼어내! 떼어내라고!',
];

/** Morale the whole group loses on the day somebody turns. */
export const TURN_MORALE = -12;
/** Morale drained each day a turned survivor is still locked in the building. */
export const CONTAINED_MORALE = -2;
/** Odds per day that a locked door stops holding. */
export const BREAKOUT_ODDS = 0.07;
/** Odds per day that the locked door is merely mentioned. */
export const CONTAINED_LINE_ODDS = 0.3;
