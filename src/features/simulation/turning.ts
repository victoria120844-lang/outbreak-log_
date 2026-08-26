import {
  BREAKOUT_DIALOGUE,
  BREAKOUT_LINE,
  BREAKOUT_ODDS,
  CONTAINED_LINE_ODDS,
  CONTAINED_LINES,
  CONTAINED_MORALE,
  TURN_DIALOGUE,
  TURN_LINES,
  TURN_MORALE,
} from '@/data/turning';
import { soften } from '@/data/difficulty';
import type { Survivor } from '@/types';
import { runMemorial } from './memorial';
import { pick, type Rng } from './rng';
import {
  addDialogue,
  addEntry,
  adjustStats,
  livingSurvivors,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/**
 * What happens when the infection finishes its work.
 *
 * Turning is not dying. The survivor leaves the roster and stops acting, but
 * the group still has them, and has to decide — which is the whole point. Only
 * that decision, or a door that stops holding, actually ends them.
 */

/** Everyone the building still contains who is no longer a person. */
export const turnedSurvivors = (draft: Draft): Survivor[] =>
  draft.survivors.filter((survivor) => survivor.status === '좀비');

export const containedSurvivors = (draft: Draft): Survivor[] =>
  turnedSurvivors(draft).filter((survivor) => survivor.contained === true);

/** Turned, and nobody has said what to do about it yet. */
export const unresolvedTurn = (draft: Draft): Survivor | undefined =>
  turnedSurvivors(draft).find((survivor) => survivor.contained !== true);

/** Takes a survivor off the roster without killing them. */
export const turnSurvivor = (draft: Draft, survivorId: string, rng: Rng): void => {
  const survivor = draft.survivors.find((entry) => entry.id === survivorId);
  if (!survivor || !survivor.alive) return;

  survivor.alive = false;
  survivor.status = '좀비';
  survivor.turnedDay = draft.day;

  const line = pick(rng, TURN_LINES);
  if (line !== undefined) {
    addEntry(
      draft,
      'death',
      applyTemplate(line, { 생존자: survivor.name }),
      [survivor.id],
    );
  }

  // Everyone watched it happen.
  livingSurvivors(draft).forEach((other) => {
    adjustStats(draft, other.id, { morale: TURN_MORALE });
  });

  const said = pick(rng, TURN_DIALOGUE);
  const witness = pick(rng, livingSurvivors(draft));
  if (said !== undefined && witness) addDialogue(draft, witness.id, said);
};

/** Ends a turned survivor for good, and lets the group say goodbye properly. */
export const layToRest = (draft: Draft, survivorId: string, rng: Rng): void => {
  const survivor = draft.survivors.find((entry) => entry.id === survivorId);
  if (!survivor || survivor.status !== '좀비') return;

  survivor.status = '사망';
  survivor.alive = false;
  survivor.contained = false;
  survivor.diedDay = draft.day;

  runMemorial(draft, [survivor.id], rng);
};

/**
 * The days after a group chose to lock the door instead of opening it. The
 * cost is steady and the risk is small, which is exactly what makes it the
 * tempting option.
 */
export const runContained = (draft: Draft, rng: Rng): void => {
  containedSurvivors(draft).forEach((zombie) => {
    const living = livingSurvivors(draft);
    if (living.length === 0) return;

    const drain = soften({ morale: CONTAINED_MORALE }) ?? {};
    living.forEach((survivor) => {
      adjustStats(draft, survivor.id, drain);
    });

    if (rng() < BREAKOUT_ODDS) {
      const victim = pick(rng, living);
      if (!victim) return;

      addEntry(
        draft,
        'critical',
        applyTemplate(BREAKOUT_LINE, {
          상대: zombie.name,
          생존자: victim.name,
        }),
        [zombie.id, victim.id],
      );

      const said = pick(rng, BREAKOUT_DIALOGUE);
      if (said !== undefined) addDialogue(draft, victim.id, said);

      adjustStats(
        draft,
        victim.id,
        soften({ hp: -18, stamina: -14, infection: 30 }) ?? {},
      );
      layToRest(draft, zombie.id, rng);
      return;
    }

    if (rng() < CONTAINED_LINE_ODDS) {
      const line = pick(rng, CONTAINED_LINES);
      if (line !== undefined) addEntry(draft, 'notable', line, [zombie.id]);
    }
  });
};
