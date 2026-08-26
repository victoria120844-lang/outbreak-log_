import type { AppliedEvent } from './events';
import {
  adjustTrust,
  livingSurvivors,
  profileOf,
  type Draft,
} from './state';

/**
 * Trust everyone gains simply for making it through another day side by side.
 * Playtesting showed bonds effectively never moved without this: single events
 * were the only source, and conflicts cancelled them out, so the relationship
 * ladder was unreachable in a normal run.
 */
export const DAILY_BOND = 1;
/** Trust gained by everyone who came through a bad day together. */
export const SHARED_DANGER_TRUST = 5;
/** Trust lost by whoever ran, hoarded, or was blamed. */
export const BLAME_TRUST = -4;

const DANGEROUS_CATEGORIES = new Set(['전투', '감염', '환경']);
const BLAMING_TEMPLATES = new Set([
  'combatFlee',
  'conflictTheft',
  'conflictBlame',
  'supplyRecount',
]);

/**
 * Surviving something dangerous together pulls a group closer; running or
 * being blamed pushes one person out of it.
 */
export const runDrift = (draft: Draft, applied: readonly AppliedEvent[]): void => {
  const living = livingSurvivors(draft);

  const sharedDanger = applied.some(
    (event) =>
      DANGEROUS_CATEGORIES.has(event.template.category) &&
      (event.template.severity === 'critical' ||
        event.template.severity === 'death'),
  );

  if (living.length >= 2) {
    living.forEach((left, index) => {
      living.slice(index + 1).forEach((right) => {
        // F profiles feel the day more strongly in both directions.
        const amplitude =
          (profileOf(draft, left.id).moraleSwing +
            profileOf(draft, right.id).moraleSwing) /
          2;
        const gained =
          DAILY_BOND + (sharedDanger ? SHARED_DANGER_TRUST * amplitude : 0);
        adjustTrust(draft, left.id, right.id, Math.round(gained));
      });
    });
  }

  applied.forEach((event) => {
    if (!BLAMING_TEMPLATES.has(event.template.id)) return;
    living.forEach((other) => {
      if (other.id === event.actorId) return;
      adjustTrust(draft, event.actorId, other.id, BLAME_TRUST);
    });
  });
};
