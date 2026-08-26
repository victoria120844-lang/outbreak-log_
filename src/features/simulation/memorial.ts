import {
  GRIEF_DAYS,
  GRIEF_LINES,
  GRIEF_THRESHOLD,
  memorialLinesFor,
} from '@/data/memorial';
import type { Survivor } from '@/types';
import { addressOf } from './address';
import { pick, type Rng } from './rng';
import {
  addDialogue,
  livingSurvivors,
  trustBetween,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/** At most this many people speak at one funeral; the rest are silent. */
const MAX_SPEAKERS = 3;
const GRIEF_ODDS = 0.5;

const addMemorial = (
  draft: Draft,
  speaker: Survivor,
  dead: Survivor,
  line: string,
): void => {
  const message = applyTemplate(line, {
    호칭: addressOf(speaker, dead),
    상대: dead.name,
  });

  draft.entries.push({
    id: `${draft.entryPrefix}${draft.day}-${draft.entries.length}`,
    day: draft.day,
    severity: 'death',
    message,
    actorIds: [speaker.id, dead.id],
    speakerId: speaker.id,
    memorialFor: dead.id,
  });
};

/**
 * Called once for each survivor lost today. The closest people speak first,
 * because a death should land differently depending on who is left.
 */
export const runMemorial = (
  draft: Draft,
  deadIds: readonly string[],
  rng: Rng,
): void => {
  deadIds.forEach((deadId) => {
    const dead = draft.survivors.find((entry) => entry.id === deadId);
    if (!dead) return;

    const mourners = livingSurvivors(draft)
      .map((survivor) => ({
        survivor,
        trust: trustBetween(draft, survivor.id, deadId) ?? 0,
      }))
      .sort((left, right) => right.trust - left.trust)
      .slice(0, MAX_SPEAKERS);

    mourners.forEach(({ survivor, trust }) => {
      const line = pick(rng, memorialLinesFor(trust));
      if (line !== undefined) addMemorial(draft, survivor, dead, line);
    });
  });
};

/**
 * The days after. Someone who loved the person they lost keeps saying so, and
 * the saying costs them.
 */
export const runGrief = (draft: Draft, rng: Rng): void => {
  const recentlyLost = draft.survivors.filter(
    (survivor) =>
      !survivor.alive &&
      survivor.diedDay !== undefined &&
      draft.day > survivor.diedDay &&
      draft.day - survivor.diedDay <= GRIEF_DAYS,
  );
  if (recentlyLost.length === 0) return;

  livingSurvivors(draft).forEach((survivor) => {
    recentlyLost.forEach((dead) => {
      const trust = trustBetween(draft, survivor.id, dead.id);
      if (trust === null || trust < GRIEF_THRESHOLD) return;
      if (rng() > GRIEF_ODDS) return;

      const line = pick(rng, GRIEF_LINES);
      if (line === undefined) return;

      addDialogue(
        draft,
        survivor.id,
        applyTemplate(line, {
          호칭: addressOf(survivor, dead),
          상대: dead.name,
        }),
      );
      // Grief is not free.
      const target = draft.survivors.find((e) => e.id === survivor.id);
      if (target) target.stats.morale -= 4;
    });
  });
};
