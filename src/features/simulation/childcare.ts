import {
  CARE_DIALOGUE,
  CARE_LINES,
  CARE_ODDS,
  CHILD_BOND,
  HOUSEHOLD_DIALOGUE,
  HOUSEHOLD_MORALE,
  MILESTONES,
  PARENT_BOND,
  PARENT_MORALE,
} from '@/data/childcare';
import type { Survivor } from '@/types';
import { addressOf } from './address';
import { pick, type Rng } from './rng';
import {
  ACTING_AGE,
  addDialogue,
  addEntry,
  adjustStats,
  adjustTrust,
  livingSurvivors,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/**
 * The house with a baby in it.
 *
 * A birth put a name on the roster and then the run forgot about it: the child
 * ate a ration a day and was never mentioned again. This is the part that makes
 * the group behave like people who have a child to look after — the bond climbs
 * on its own, somebody is always holding them, and the parents call them 아들 or
 * 딸 while everybody else uses their name.
 */

/** Everyone too young to be handed a job. They are the ones being raised. */
export const childrenOf = (draft: Draft): Survivor[] =>
  livingSurvivors(draft).filter((survivor) => survivor.age < ACTING_AGE);

const isParentOf = (adult: Survivor, child: Survivor): boolean =>
  child.parentIds?.includes(adult.id) === true;

export const runChildcare = (draft: Draft, rng: Rng): void => {
  const children = childrenOf(draft);
  if (children.length === 0) return;

  const adults = livingSurvivors(draft).filter(
    (survivor) => survivor.age >= ACTING_AGE,
  );
  if (adults.length === 0) return;

  children.forEach((child) => {
    adults.forEach((adult) => {
      // Looking after somebody every day is what the bond is made of, so it
      // climbs faster than the ordinary daily drift between two adults.
      const bond = CHILD_BOND + (isParentOf(adult, child) ? PARENT_BOND : 0);
      adjustTrust(draft, adult.id, child.id, bond);

      adjustStats(draft, adult.id, {
        morale: isParentOf(adult, child) ? PARENT_MORALE : HOUSEHOLD_MORALE,
      });
    });

    const elapsed = draft.day - child.joinedDay;

    /*
     * Firsts. Matched on the exact day rather than a range, so each one lands
     * once without anything to remember between days.
     */
    const milestone = MILESTONES.find((entry) => entry.after === elapsed);
    if (milestone) {
      const witness = pick(rng, adults);
      const slots = {
        생존자: witness?.name,
        상대: child.name,
        호칭: witness ? addressOf(witness, child) : child.name,
      };
      addEntry(
        draft,
        'notable',
        applyTemplate(milestone.line, slots),
        witness ? [witness.id, child.id] : [child.id],
      );

      const said = pick(rng, milestone.dialogue ?? []);
      if (said !== undefined && witness) {
        addDialogue(draft, witness.id, applyTemplate(said, slots));
      }
      return;
    }

    // An ordinary day: somebody has the baby.
    if (rng() > CARE_ODDS) return;

    const carer = pick(rng, adults);
    const line = pick(rng, CARE_LINES);
    if (!carer || line === undefined) return;

    const slots = {
      생존자: carer.name,
      상대: child.name,
      호칭: addressOf(carer, child),
    };
    addEntry(draft, 'routine', applyTemplate(line, slots), [
      carer.id,
      child.id,
    ]);

    // Parents have their own word for the child; the rest of the house has its
    // own way of saying the same thing.
    const pool = isParentOf(carer, child) ? CARE_DIALOGUE : HOUSEHOLD_DIALOGUE;
    const said = pick(rng, pool);
    if (said !== undefined) {
      addDialogue(draft, carer.id, applyTemplate(said, slots));
    }
  });
};
