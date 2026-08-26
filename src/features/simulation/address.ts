import type { Survivor } from '@/types';

/**
 * What one survivor calls another. Korean has no neutral way to address
 * someone — you pick a term and it states the relationship — so age is not a
 * decorative field here. It changes every line one person says to another.
 */

/** Under this many years apart, people use plain names. */
const PEER_GAP = 2;
/** Past this, the younger one stops using sibling terms entirely. */
const ELDER_GAP = 20;

const siblingTerm = (speaker: Survivor, elder: Survivor): string | null => {
  if (speaker.gender === '남성') {
    if (elder.gender === '남성') return '형';
    if (elder.gender === '여성') return '누나';
  }
  if (speaker.gender === '여성') {
    if (elder.gender === '남성') return '오빠';
    if (elder.gender === '여성') return '언니';
  }
  // Someone declined to say, so the group falls back on something neutral.
  return null;
};

export const addressOf = (speaker: Survivor, target: Survivor): string => {
  if (speaker.id === target.id) return target.name;

  /*
   * A parent has one word for their own child and it is not the age gap's to
   * decide. Read off the record rather than off a 가족 relationship row, which
   * the player can also set on two grown adults.
   */
  if (target.parentIds?.includes(speaker.id) === true) {
    if (target.gender === '남성') return '아들';
    if (target.gender === '여성') return '딸';
    return target.name;
  }

  const gap = target.age - speaker.age;

  // Far older: the group settles on deference rather than familiarity.
  if (gap >= ELDER_GAP) return `${target.name} 선생님`;

  if (gap >= PEER_GAP) {
    const term = siblingTerm(speaker, target);
    return term ?? `${target.name} 선배`;
  }

  // Peers and juniors go by name.
  return target.name;
};

/** How the group as a whole refers to someone, with no speaker in mind. */
export const formalName = (survivor: Survivor): string =>
  survivor.age >= 60 ? `${survivor.name} 어르신` : survivor.name;
