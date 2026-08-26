/**
 * One place for how hard the run is, so a tuning pass is a diff a person can
 * read rather than a hunt through a hundred event templates.
 *
 * Playtesting kept coming back with the same note — too hard — and the honest
 * reason was that damage was authored per-template and never rebalanced as a
 * whole. These scales sit on top of whatever a template says, and they have
 * been turned down twice: hp damage now lands at under a third of what the
 * templates ask for.
 *
 * Everything that can hurt somebody goes through here. Nothing in the game
 * sets hp directly any more, which is what makes the rule "a survivor only
 * dies when their stats run out" true rather than nearly true.
 */

/**
 * Multiplier on hp damage from events and decisions. hp is the only cause of
 * death now, so this is the single biggest dial in the game.
 */
export const HARM_SCALE = 0.3;

/** Multiplier on stamina and morale losses from the same sources. */
export const DRAIN_SCALE = 0.5;

/**
 * Multiplier on infection picked up from events and decisions.
 *
 * Left at full strength on purpose. Wounds now heal and starvation barely
 * bites, so if this were softened too there would be nothing left that could
 * take anybody — a measured pass at 0.55 produced zero turnings across ten
 * two-hundred-day runs. Infection is the one clock still running, and it is
 * still a stat running out rather than a sudden draw. Softened only slightly:
 * at full strength it swung the other way and became the dominant killer.
 */
export const INFECT_SCALE = 0.75;

const scaled = (value: number, scale: number): number =>
  value >= 0 ? value : -Math.max(1, Math.round(Math.abs(value) * scale));

/**
 * Softens the negative half of a stat payload and leaves gains alone. A one
 * point loss stays one point rather than rounding away to nothing, so nothing
 * silently stops mattering.
 */
export const soften = <T extends Partial<Record<string, number>>>(
  deltas: T | undefined,
): T | undefined => {
  if (!deltas) return deltas;

  const result: Record<string, number> = {};
  Object.entries(deltas).forEach(([key, value]) => {
    if (typeof value !== 'number') return;
    if (key === 'hp') result[key] = scaled(value, HARM_SCALE);
    else if (key === 'stamina' || key === 'morale') {
      result[key] = scaled(value, DRAIN_SCALE);
    } else if (key === 'infection') {
      // Infection is a gain when it hurts, so this scale runs the other way.
      result[key] = value > 0 ? Math.round(value * INFECT_SCALE) : value;
    } else result[key] = value;
  });

  return result as T;
};

/** Same treatment for the bare infection number events carry separately. */
export const softenInfect = (value: number): number =>
  Math.round(value * INFECT_SCALE);
