import {
  AT_RISK_HP,
  BABY_NAMES,
  BIRTH_COOLDOWN_DAYS,
  BIRTH_DIALOGUE,
  BIRTH_HP_COST,
  BIRTH_LINE,
  BIRTH_MORALE,
  BIRTH_NAMING,
  CARRY_HUNGER,
  CARRY_MAX_AGE,
  CARRY_STAMINA,
  CONCEPTION_ANNOUNCE,
  CONCEPTION_DIALOGUE,
  CONCEPTION_LINES,
  CONCEPTION_ODDS,
  EARLY_LINES,
  GESTATION_DAYS,
  HARD_BIRTH_HP_COST,
  HARD_BIRTH_LINE,
  HARD_BIRTH_ODDS,
  LATE_DIALOGUE,
  LATE_LINES,
  MISCARRIAGE_DIALOGUE,
  MISCARRIAGE_LINE,
  MISCARRIAGE_ODDS,
} from '@/data/birth';
import { soften } from '@/data/difficulty';
import { MARRIAGE_THRESHOLD, ROMANCE_MIN_AGE } from '@/data/relationships';
import type { Relationship, Survivor } from '@/types';
import { buildProfile } from './profile';
import { pick, type Rng } from './rng';
import {
  addDialogue,
  addEntry,
  adjustStats,
  attachChanges,
  diffStats,
  kindBetween,
  livingSurvivors,
  snapshotStats,
  trustBetween,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/**
 * The only thing in this world that adds to the roster.
 *
 * Gated on the 부부 rung and on the pair being a romance the run actually
 * produced — a blood 가족 row the player set up also sits at trust 150, and
 * that must never qualify. Gender is not a gate: any married pair can have a
 * child, and one of the two carries it.
 */

/**
 * Whether this person can carry one right now. Gender is deliberately not part
 * of it: a married pair is a married pair, and the run does not tell anybody
 * which marriages are allowed to have children.
 */
const canCarry = (person: Survivor, day: number): boolean => {
  if (person.pregnantSince !== undefined) return false;
  if (person.age < ROMANCE_MIN_AGE || person.age > CARRY_MAX_AGE) return false;
  if (
    person.pregnancyEndedDay !== undefined &&
    day - person.pregnancyEndedDay < BIRTH_COOLDOWN_DAYS
  ) {
    return false;
  }
  return true;
};

/** A name nobody in the group is already using. */
const chooseName = (draft: Draft, rng: Rng): string => {
  const taken = new Set(draft.survivors.map((survivor) => survivor.name));
  const free = BABY_NAMES.filter((name) => !taken.has(name));
  const chosen = pick(rng, free.length > 0 ? free : BABY_NAMES);
  if (chosen === undefined) return '아이';
  return taken.has(chosen) ? `${chosen}이` : chosen;
};

/**
 * Both directions of every pair the newcomer needs. Ids are derived rather
 * than random so a replayed run produces an identical relationship table.
 */
const stagePairs = (
  draft: Draft,
  child: Survivor,
  parentIds: readonly string[],
): void => {
  draft.survivors.forEach((other) => {
    if (other.id === child.id) return;

    const isParent = parentIds.includes(other.id);
    const kind = isParent ? '가족' : '초면';
    const trust = isParent ? MARRIAGE_THRESHOLD : 0;

    const rows: Relationship[] = [
      {
        id: `b-${child.id}-${other.id}`,
        fromId: child.id,
        toId: other.id,
        kind,
        trust,
      },
      {
        id: `b-${other.id}-${child.id}`,
        fromId: other.id,
        toId: child.id,
        kind,
        trust,
      },
    ];
    draft.relationships.push(...rows);
  });
};

const deliver = (draft: Draft, carrier: Survivor, rng: Rng): void => {
  const partner = draft.survivors.find(
    (entry) => entry.id === carrier.pregnantBy,
  );

  const before = snapshotStats(draft);
  const isHard = rng() < HARD_BIRTH_ODDS;
  const entryIndex = draft.entries.length;
  addEntry(
    draft,
    'notable',
    applyTemplate(isHard ? HARD_BIRTH_LINE : BIRTH_LINE, {
      생존자: carrier.name,
    }),
    partner ? [carrier.id, partner.id] : [carrier.id],
  );

  // Softened like everything else, so a delivery is never the thing that
  // takes somebody who was otherwise fine.
  adjustStats(
    draft,
    carrier.id,
    soften({
      hp: BIRTH_HP_COST + (isHard ? HARD_BIRTH_HP_COST : 0),
      stamina: -25,
    }) ?? {},
  );

  const name = chooseName(draft, rng);
  const child: Survivor = {
    id: `child-${draft.day}-${draft.survivors.length}`,
    name,
    gender: rng() < 0.5 ? '남성' : '여성',
    age: 0,
    job: 'officeWorker',
    mbti: 'INFP',
    traits: ['optimistic', 'timid', 'cautious'],
    stats: { hp: 100, stamina: 30, hunger: 20, morale: 100, infection: 0 },
    abilities: { intellect: 1, endurance: 1, agility: 1, strength: 1, luck: 5 },
    status: '생존',
    joinedDay: draft.day,
    alive: true,
    parentIds: partner ? [carrier.id, partner.id] : [carrier.id],
  };

  draft.survivors.push(child);
  // The draft's profile map is built once per day from the roster it started
  // with, so a newcomer has to be added to it by hand.
  draft.profiles.set(child.id, buildProfile(child));
  stagePairs(draft, child, partner ? [carrier.id, partner.id] : [carrier.id]);

  addEntry(
    draft,
    'notable',
    applyTemplate(BIRTH_NAMING, { 상대: name, 생존자: carrier.name }),
    [carrier.id, child.id],
  );

  const said = pick(rng, BIRTH_DIALOGUE);
  if (said !== undefined) addDialogue(draft, carrier.id, said);

  // The one unambiguously good day this log ever gets.
  livingSurvivors(draft).forEach((survivor) => {
    if (survivor.id === child.id) return;
    adjustStats(draft, survivor.id, { morale: BIRTH_MORALE });
  });

  attachChanges(draft, entryIndex, diffStats(draft, before));

   delete carrier.pregnantSince;
   delete carrier.pregnantBy;
  carrier.pregnancyEndedDay = draft.day;
};

const lose = (draft: Draft, carrier: Survivor, rng: Rng): void => {
  addEntry(
    draft,
    'death',
    applyTemplate(MISCARRIAGE_LINE, { 생존자: carrier.name }),
    [carrier.id],
  );

  const said = pick(rng, MISCARRIAGE_DIALOGUE);
  if (said !== undefined) addDialogue(draft, carrier.id, said);

  adjustStats(draft, carrier.id, soften({ morale: -20 }) ?? {});
  const shared = soften({ morale: -8 }) ?? {};
  livingSurvivors(draft).forEach((survivor) => {
    if (survivor.id === carrier.id) return;
    adjustStats(draft, survivor.id, shared);
  });

  delete carrier.pregnantSince;
  delete carrier.pregnantBy;
  // Same cooldown as a birth. Conceiving again the same evening a pregnancy
  // was lost is not a sentence this log should ever be able to write.
  carrier.pregnancyEndedDay = draft.day;
};

/**
 * Conception, the weeks in between, and the delivery. Runs after the day's
 * damage is settled, so a pregnancy is judged on the condition the person
 * carrying it is actually in tonight, not the one they woke up in.
 */
export const runPregnancy = (draft: Draft, rng: Rng): void => {
  // ---------------------------------------------------------------- carrying
  livingSurvivors(draft)
    .filter((survivor) => survivor.pregnantSince !== undefined)
    .forEach((carrier) => {
      const since = carrier.pregnantSince ?? draft.day;
      const elapsed = draft.day - since;

      adjustStats(draft, carrier.id, {
        stamina: CARRY_STAMINA,
        hunger: CARRY_HUNGER,
      });

      if (carrier.stats.hp < AT_RISK_HP && rng() < MISCARRIAGE_ODDS) {
        lose(draft, carrier, rng);
        return;
      }

      if (elapsed >= GESTATION_DAYS) {
        deliver(draft, carrier, rng);
        return;
      }

      // Two milestones, each spoken about once in a while rather than daily.
      const isLate = elapsed > GESTATION_DAYS * 0.6;
      if (rng() < 0.12) {
        const line = pick(rng, isLate ? LATE_LINES : EARLY_LINES);
        if (line !== undefined) {
          addEntry(
            draft,
            'routine',
            applyTemplate(line, { 생존자: carrier.name }),
            [carrier.id],
          );
        }
        if (isLate) {
          const said = pick(rng, LATE_DIALOGUE);
          const witness = pick(
            rng,
            livingSurvivors(draft).filter((other) => other.id !== carrier.id),
          );
          if (said !== undefined && witness) addDialogue(draft, witness.id, said);
        }
      }
    });

  // -------------------------------------------------------------- conceiving
  const living = livingSurvivors(draft);

  living.forEach((left, index) => {
    living.slice(index + 1).forEach((right) => {
      // The 부부 rung, and a romance rather than a blood family row.
      if (kindBetween(draft, left.id, right.id) !== '연인') return;
      const trust = trustBetween(draft, left.id, right.id);
      if (trust === null || trust < MARRIAGE_THRESHOLD) return;
      if (left.age < ROMANCE_MIN_AGE || right.age < ROMANCE_MIN_AGE) return;

      // One at a time per couple. Without this both partners could conceive
      // within a week of each other, which a playtest log duly produced.
      if (
        left.pregnantSince !== undefined ||
        right.pregnantSince !== undefined
      ) {
        return;
      }

      // Either of them may be the one carrying, whatever the pair looks like.
      const eligible = [left, right].filter((person) =>
        canCarry(person, draft.day),
      );
      if (eligible.length === 0) return;
      if (rng() > CONCEPTION_ODDS) return;

      // Rolled unconditionally so the stream does not depend on how many of
      // the two happened to qualify.
      const carrier = pick(rng, eligible) ?? eligible[0];
      if (!carrier) return;
      const partner = carrier.id === left.id ? right : left;

      carrier.pregnantSince = draft.day;
      carrier.pregnantBy = partner.id;

      const slots = { 생존자: carrier.name, 상대: partner.name };
      addEntry(
        draft,
        'notable',
        applyTemplate(CONCEPTION_ANNOUNCE, slots),
        [carrier.id, partner.id],
      );

      const line = pick(rng, CONCEPTION_LINES);
      if (line !== undefined) {
        addEntry(draft, 'routine', applyTemplate(line, slots), [
          carrier.id,
          partner.id,
        ]);
      }

      const said = pick(rng, CONCEPTION_DIALOGUE);
      if (said !== undefined) addDialogue(draft, partner.id, said);
    });
  });
};
