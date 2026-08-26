import { ITEMS, getItem } from '@/data/items';
import type { Rng } from './rng';
import {
  ACTING_AGE,
  actingSurvivors,
  addEntry,
  attachChanges,
  adjustStats,
  changeItem,
  livingSurvivors,
  profileOf,
  quantityOf,
  type Draft,
} from './state';
import { traitStatDeltas } from './profile';

export const BASE_STAMINA_LOSS = 10;
export const BASE_HUNGER_GAIN = 8;
/** Extra hunger on top of the base when a ration is missed. */
export const SHORTAGE_HUNGER_GAIN = 12;
export const SHORTAGE_MORALE_LOSS = 5;
export const STARVATION_HP_LOSS = 3;
/**
 * Days of going without before the body starts failing. Raised twice now: 2 to
 * 3, then 3 to 5, 5 to 7, and 7 to 10, because playtesting kept reporting
 * that people die too fast and starvation was the thing actually killing them.
 */
export const STARVATION_GRACE_DAYS = 10;

const FOOD_IDS = ITEMS.filter((item) => (item.payload.foodDays ?? 0) > 0).map(
  (item) => item.id,
);
const WATER_IDS = ITEMS.filter((item) => (item.payload.waterDays ?? 0) > 0).map(
  (item) => item.id,
);

/**
 * Odds that one survivor brings back a day's food and water.
 *
 * Without this the run was arithmetic: a group of five eats five units a day,
 * the shelf held ten, and the scattered supply events replaced maybe two units
 * every three days — so every run ended in starvation on roughly the same day
 * no matter what the player did. Foraging is the standing income that makes the
 * shelf a buffer rather than a countdown.
 *
 * It is deliberately short of break-even at full strength, and it collapses as
 * the group weakens, so a bad week still spirals.
 */
export const FORAGE_BASE_ODDS = 0.95;
/** Chance a successful trip comes back with a spare tin on top. */
export const FORAGE_BONUS_ODDS = 0.3;

const forageOdds = (scavenge: number, stamina: number): number => {
  // Exhausted people come back with less. The floor is deliberately high:
  // an earlier version let the coupling run all the way down, which turned
  // every single run into the same slow starvation regardless of play.
  const condition = 0.8 + 0.2 * Math.min(1, Math.max(0, stamina / 70));
  return Math.min(0.98, FORAGE_BASE_ODDS * condition * Math.min(1.3, scavenge));
};

/**
 * The day's income, run before anything is spent. Each survivor who is still
 * on their feet has a good chance of bringing back a day's food and water.
 */
export const runForaging = (draft: Draft, rng: Rng): number => {
  // Children do not bring anything back. They still eat, which is the whole
  // reason a birth is a cost as well as the best day the log ever has.
  const living = actingSurvivors(draft).filter(
    (survivor) => survivor.age >= ACTING_AGE,
  );
  let foraged = 0;

  living.forEach((survivor) => {
    const profile = profileOf(draft, survivor.id);
    if (rng() > forageOdds(profile.scavenge, survivor.stats.stamina)) return;

    // A healthy group builds a buffer; an exhausted one only treads water.
    // That difference is the whole point of the stat, and it is what lets a
    // run be won or lost rather than merely counted down.
    const bonus = rng() < FORAGE_BONUS_ODDS ? 1 : 0;
    changeItem(draft, 'cannedFood', 1 + bonus);
    changeItem(draft, 'bottledWater', 1);
    foraged += 1;
  });

  /*
   * Deliberately silent. A first pass logged the day's take at 18% odds, which
   * over a 200-day run meant one sentence appearing thirty-four times — by far
   * the most repeated line in the log, and repetition is the thing playtesting
   * keeps flagging. Foraging is what everybody does every day; the shelf count
   * already says how it went.
   */
  return foraged;
};

/**
 * hp a fed, watered, uninfected survivor gets back overnight.
 *
 * Nothing restored hp before this. Events chipped away at it and the only way
 * up was an item the engine never reached for on its own, so hp was a one-way
 * ratchet and every measured run ended with the whole group at zero somewhere
 * around day 100 — even with the shelves full. Bodies mend when they are fed.
 */
export const RECOVERY_HP = 12;
/** Above this hunger, the body has nothing spare to mend with. */
export const RECOVERY_MAX_HUNGER = 85;

/** hp below which the group spends a dressing rather than saving it. */
export const FIRST_AID_THRESHOLD = 70;

const DRESSINGS: readonly string[] = ['bandage', 'tourniquet'];

/** Rationing turns a J profile into the occasional saved unit. */
const rationSaveChance = (rationing: number): number =>
  Math.min(0.35, Math.max(0, (rationing - 1) * 0.5));

const consumeFrom = (
  draft: Draft,
  candidates: readonly string[],
  survivorId: string,
  rng: Rng,
  rationing: number,
): boolean => {
  const available = candidates.find((itemId) => quantityOf(draft, itemId) > 0);
  if (available === undefined) return false;

  if (rng() < rationSaveChance(rationing)) {
    // Stretched: fed today without spending a unit.
    return true;
  }

  changeItem(draft, available, -1);
  const payload = getItem(available)?.payload.stats;
  if (payload) adjustStats(draft, survivorId, payload);
  return true;
};

/**
 * Every living survivor burns stamina and gains hunger, then eats and drinks
 * if anything is left on the shelf. Missing either ration two days running
 * starts costing hp.
 */
export const runUpkeep = (draft: Draft, rng: Rng): void => {
  const living = livingSurvivors(draft);
  const wentHungry: string[] = [];
  const starving: Array<{ name: string; id: string }> = [];

  living.forEach((survivor) => {
    const profile = profileOf(draft, survivor.id);

    adjustStats(draft, survivor.id, {
      stamina: -Math.round(BASE_STAMINA_LOSS / Math.max(0.5, profile.efficiency)),
      hunger: BASE_HUNGER_GAIN,
    });
    adjustStats(draft, survivor.id, traitStatDeltas(survivor));

    const deprivation = draft.deprivation[survivor.id] ?? { food: 0, water: 0 };

    const ate = consumeFrom(draft, FOOD_IDS, survivor.id, rng, profile.rationing);
    const drank = consumeFrom(
      draft,
      WATER_IDS,
      survivor.id,
      rng,
      profile.rationing,
    );

    deprivation.food = ate ? 0 : deprivation.food + 1;
    deprivation.water = drank ? 0 : deprivation.water + 1;

    if (!ate || !drank) {
      // Only a *new* miss is news. Repeating the same sentence for twelve
      // days running buries the log and stops meaning anything.
      if (deprivation.food === 1 || deprivation.water === 1) {
        wentHungry.push(survivor.name);
      }
      adjustStats(draft, survivor.id, {
        hunger: SHORTAGE_HUNGER_GAIN,
        morale: -SHORTAGE_MORALE_LOSS,
      });
    }

    if (
      ate &&
      drank &&
      survivor.stats.infection <= 0 &&
      survivor.stats.hunger < RECOVERY_MAX_HUNGER
    ) {
      adjustStats(draft, survivor.id, { hp: RECOVERY_HP });
    }

    // Badly hurt and there is something on the shelf: it gets used. Saving
    // dressings for a rainy day is not a decision anybody in this story makes.
    if (survivor.stats.hp < FIRST_AID_THRESHOLD) {
      const dressing = DRESSINGS.find((itemId) => quantityOf(draft, itemId) > 0);
      if (dressing !== undefined) {
        changeItem(draft, dressing, -1);
        const payload = getItem(dressing)?.payload.stats;
        if (payload) adjustStats(draft, survivor.id, payload);
        addEntry(
          draft,
          'notable',
          `${survivor.name}의 상처를 다시 감았다. ${getItem(dressing)?.name}을 썼다.`,
          [survivor.id],
        );
      }
    }

    if (
      deprivation.food >= STARVATION_GRACE_DAYS ||
      deprivation.water >= STARVATION_GRACE_DAYS
    ) {
      adjustStats(draft, survivor.id, { hp: -STARVATION_HP_LOSS });

      // Only the day it crosses the line. Repeating it daily buries the log
      // and makes a slow death read as background noise.
      const justCrossed =
        deprivation.food === STARVATION_GRACE_DAYS ||
        deprivation.water === STARVATION_GRACE_DAYS;
      if (justCrossed) starving.push({ name: survivor.name, id: survivor.id });
    }

    draft.deprivation[survivor.id] = deprivation;
  });

  if (wentHungry.length > 0) {
    addEntry(
      draft,
      'notable',
      `배급이 끊겼다. ${wentHungry.length}명이 오늘 몫을 받지 못했다.`,
      living
        .filter((survivor) => wentHungry.includes(survivor.name))
        .map((survivor) => survivor.id),
    );
  }

  starving.forEach(({ name, id }) => {
    const index = draft.entries.length;
    addEntry(
      draft,
      'critical',
      `${name}, ${STARVATION_GRACE_DAYS}일째 굶었다. 몸이 버티지 못한다.`,
      [id],
    );
    // Named outright rather than left to the bars: this is the one drain that
    // kills, and it should say so in the same sentence.
    attachChanges(draft, index, [
      { survivorId: id, key: 'hp', delta: -STARVATION_HP_LOSS },
    ]);
  });
};
