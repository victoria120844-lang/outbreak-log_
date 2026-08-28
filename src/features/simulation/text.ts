/**
 * Korean particles agree with the final consonant of the preceding word, so a
 * template cannot hard-code them: "민수가" but "지연이". Slots are filled with
 * the particle chosen from the substituted name.
 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JONGSEONG_COUNT = 28;
/** Index of the final consonant ㄹ, which 으로/로 treats as a vowel. */
const RIEUL = 8;

interface Ending {
  hasFinal: boolean;
  isRieul: boolean;
}

const endingOf = (word: string): Ending => {
  const characters = Array.from(word);
  const last = characters[characters.length - 1];
  if (last === undefined) return { hasFinal: false, isRieul: false };

  const code = last.codePointAt(0) ?? 0;
  if (code < HANGUL_START || code > HANGUL_END) {
    // Latin and digits: treat as open so the reading stays natural.
    return { hasFinal: false, isRieul: false };
  }

  const jongseong = (code - HANGUL_START) % JONGSEONG_COUNT;
  return { hasFinal: jongseong !== 0, isRieul: jongseong === RIEUL };
};

const PARTICLE_PAIRS: ReadonlyArray<{ withFinal: string; withoutFinal: string }> =
  [
    { withFinal: '이', withoutFinal: '가' },
    { withFinal: '을', withoutFinal: '를' },
    { withFinal: '은', withoutFinal: '는' },
    { withFinal: '과', withoutFinal: '와' },
    { withFinal: '으로', withoutFinal: '로' },
  ];

export const chooseParticle = (word: string, particle: string): string => {
  const pair = PARTICLE_PAIRS.find(
    (candidate) =>
      candidate.withFinal === particle || candidate.withoutFinal === particle,
  );
  if (!pair) return particle;

  const ending = endingOf(word);
  if (pair.withoutFinal === '로') {
    return ending.hasFinal && !ending.isRieul ? '으로' : '로';
  }
  return ending.hasFinal ? pair.withFinal : pair.withoutFinal;
};

export type TemplateSlots = Partial<
  Record<'생존자' | '상대' | '아이템' | '호칭', string | undefined>
>;

const SLOT_PATTERN =
  /\{(생존자|상대|아이템|호칭)\}(으로|이|가|을|를|은|는|과|와|로)?/g;

/** Fills `{생존자}` / `{상대}` / `{아이템}` and fixes the particle after each. */
export const applyTemplate = (text: string, slots: TemplateSlots): string =>
  text.replace(SLOT_PATTERN, (match, slotName: string, particle?: string) => {
    const value =
      slotName === '생존자'
        ? slots['생존자']
        : slotName === '상대'
          ? slots['상대']
          : slotName === '호칭'
            ? slots['호칭']
            : slots['아이템'];

    if (value === undefined) return match;
    if (particle === undefined) return value;
    return value + chooseParticle(value, particle);
  });
