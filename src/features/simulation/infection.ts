import { getItem } from '@/data/items';
import { randomInt, type Rng } from './rng';
import {
  addEntry,
  adjustStats,
  changeItem,
  livingSurvivors,
  quantityOf,
  trustBetween,
  type Draft,
} from './state';
import { turnSurvivor } from './turning';

export const INFECTION_MIN_GAIN = 4;
export const INFECTION_MAX_GAIN = 8;
export const INFECTION_FATAL = 100;
const ANTIBIOTICS = 'antibiotics';
/**
 * Infection the group will spend a dose on. Below this they wait and watch.
 *
 * A first pass spent one dose per infected person per day at any level, which
 * emptied the shelf on scratches and meant nobody ever actually turned — the
 * whole 좀비 branch was unreachable in ten out of ten measured runs.
 */
export const ANTIBIOTIC_THRESHOLD = 28;

/**
 * Below this, it is a wound the body is winning against; at or above it, the
 * infection has taken hold and climbs on its own.
 *
 * Without the distinction every scratch was terminal: a 4-point cut from a
 * window frame gained 6-12 a day like a bite did, so anybody who so much as
 * caught themselves on glass was on a countdown. Measured runs lost about two
 * of five survivors to infection every time.
 */
export const INFECTION_TAKES_HOLD = 25;
/** How fast a wound below that line closes on its own. */
export const INFECTION_RECOVERY = 6;

const ANTISEPTIC = 'antiseptic';
/** Average trust below this and the group stops calling it an accident. */
export const HOSTILE_TRUST = -20;

/** Mean trust the rest of the group holds toward one survivor. */
export const trustToward = (draft: Draft, survivorId: string): number | null => {
  const values = livingSurvivors(draft)
    .filter((other) => other.id !== survivorId)
    .map((other) => trustBetween(draft, other.id, survivorId))
    .filter((trust): trust is number => trust !== null);

  if (values.length === 0) return null;
  return values.reduce((sum, trust) => sum + trust, 0) / values.length;
};

/**
 * Infection only ever climbs. 항생제 knocks it back and is spent doing so; at
 * 100 the survivor turns.
 *
 * Turning is not death. It used to be — the survivor was simply removed with a
 * line about not coming back — but that made infection a second, invisible way
 * to lose somebody, and the group never had to look at it. Now the day stops
 * and somebody has to decide.
 *
 * Returns the ids of everyone who turned today.
 */
export const runInfection = (draft: Draft, rng: Rng): string[] => {
  const turned: string[] = [];

  livingSurvivors(draft).forEach((survivor) => {
    if (survivor.stats.infection <= 0) return;

    if (survivor.stats.infection < INFECTION_TAKES_HOLD) {
      // A wound, not a spread. Antiseptic closes it faster if there is any.
      let relief = INFECTION_RECOVERY;
      if (quantityOf(draft, ANTISEPTIC) > 0) {
        changeItem(draft, ANTISEPTIC, -1);
        relief += 15;
      }
      adjustStats(draft, survivor.id, { infection: -relief });
      return;
    }

    const gain = randomInt(rng, INFECTION_MIN_GAIN, INFECTION_MAX_GAIN);
    adjustStats(draft, survivor.id, { infection: gain });

    if (
      survivor.stats.infection >= ANTIBIOTIC_THRESHOLD &&
      quantityOf(draft, ANTIBIOTICS) > 0
    ) {
      changeItem(draft, ANTIBIOTICS, -1);
      const relief = getItem(ANTIBIOTICS)?.payload.stats?.infection ?? -35;
      adjustStats(draft, survivor.id, { infection: relief });
      addEntry(
        draft,
        'notable',
        `${survivor.name}에게 항생제를 썼다. 남은 것은 ${quantityOf(draft, ANTIBIOTICS)}개다.`,
        [survivor.id],
      );
    }

    if (survivor.stats.infection < INFECTION_FATAL) return;

    turnSurvivor(draft, survivor.id, rng);
    turned.push(survivor.id);
  });

  return turned;
};
