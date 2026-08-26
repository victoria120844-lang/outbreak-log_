import { soften, softenInfect } from '@/data/difficulty';
import { EVENT_TEMPLATES } from '@/data/events';
import { ITEMS, getItem } from '@/data/items';
import type { EventCategory, EventTemplate, Survivor } from '@/types';
import { addressOf } from './address';
import type { ActionProfile } from './profile';
import { pick, pickWeighted, randomInt, type Rng, type Weighted } from './rng';
import {
  ACTING_AGE,
  actingSurvivors,
  addDialogue,
  addEntry,
  adjustStats,
  adjustTrust,
  attachChanges,
  changeItem,
  diffStats,
  livingSurvivors,
  profileOf,
  quantityOf,
  snapshotStats,
  trustBetween,
  type Draft,
} from './state';
import { applyTemplate } from './text';

export const MIN_EVENTS_PER_DAY = 1;
export const MAX_EVENTS_PER_DAY = 3;
/** How often an event is followed by something said out loud. */
export const DIALOGUE_ODDS = 0.55;

/**
 * How many days a template is remembered after it fires. Long enough that a
 * week does not read as the same week twice; short enough that the catalogue
 * still cycles.
 */
export const RECENT_MEMORY = 30;

export interface AppliedEvent {
  template: EventTemplate;
  actorId: string;
  targetId: string | null;
}

/** Which part of a profile decides how likely a category is to come up. */
const categoryWeight = (
  profile: ActionProfile,
  category: EventCategory,
): number => {
  switch (category) {
    case '탐색':
      return profile.scavenge;
    case '전투':
      return profile.combat;
    case '감염':
      return profile.infectionRisk;
    case '내부갈등':
      return profile.conflict;
    case '보급':
      return profile.efficiency;
    case '외부생존자':
      return profile.chanceEncounter * profile.social;
    case '환경':
      return 1;
    case '정적':
      return profile.defense;
  }
};

interface Candidate {
  template: EventTemplate;
  actor: Survivor;
  target: Survivor | null;
  weight: number;
}

const meetsPairTrust = (
  draft: Draft,
  actorId: string,
  targetId: string,
  template: EventTemplate,
): boolean => {
  const requirements = template.requirements;
  if (!requirements) return true;

  const trust = trustBetween(draft, actorId, targetId);
  if (requirements.maxTrust !== undefined) {
    if (trust === null || trust > requirements.maxTrust) return false;
  }
  if (requirements.minTrust !== undefined) {
    if (trust === null || trust < requirements.minTrust) return false;
  }
  return true;
};

const eligibleActors = (draft: Draft, template: EventTemplate): Survivor[] => {
  // Infants and small children are on the roster but are not sent out. Births
  // put actual newborns in the group, and the first pass had one of them
  // prying a shutter open.
  const living = actingSurvivors(draft);
  const requirements = template.requirements;
  if (!requirements) return living;

  if (living.length < (requirements.minSurvivors ?? 1)) return [];
  if (
    requirements.requiredItem !== undefined &&
    quantityOf(draft, requirements.requiredItem) <= 0
  ) {
    return [];
  }

  return living.filter((survivor) => {
    if (
      requirements.requiredTrait !== undefined &&
      !survivor.traits.includes(requirements.requiredTrait)
    ) {
      return false;
    }
    if (requirements.infected === true && survivor.stats.infection <= 0) {
      return false;
    }
    return true;
  });
};

const buildCandidate = (
  draft: Draft,
  template: EventTemplate,
  rng: Rng,
): Candidate | null => {
  const actors = eligibleActors(draft, template);
  if (actors.length === 0) return null;

  const actor = pickWeighted(
    rng,
    actors.map((survivor) => ({
      value: survivor,
      weight: categoryWeight(profileOf(draft, survivor.id), template.category),
    })),
  );
  if (!actor) return null;

  let target: Survivor | null = null;
  if (template.cast === 2) {
    const others = actingSurvivors(draft).filter(
      (survivor) =>
        survivor.id !== actor.id &&
        meetsPairTrust(draft, actor.id, survivor.id, template),
    );
    const chosen = pickWeighted(
      rng,
      others.map((survivor) => ({ value: survivor, weight: 1 })),
    );
    if (!chosen) return null;
    target = chosen;
  } else if (
    template.requirements?.maxTrust !== undefined ||
    template.requirements?.minTrust !== undefined
  ) {
    // A one-actor template can still be gated on how the group feels.
    const someone = actingSurvivors(draft).some(
      (survivor) =>
        survivor.id !== actor.id &&
        meetsPairTrust(draft, actor.id, survivor.id, template),
    );
    if (!someone) return null;
  }

  return {
    template,
    actor,
    target,
    weight: Math.max(
      0.01,
      template.weight * categoryWeight(profileOf(draft, actor.id), template.category),
    ),
  };
};

/** The item named in the text, rolled before effects so loot can be announced. */
const resolveItem = (
  draft: Draft,
  template: EventTemplate,
  rng: Rng,
): string | null => {
  const loot = template.effects?.loot;
  if (loot !== undefined) {
    const pool = ITEMS.filter((item) => item.category === loot);
    const chosen = pickWeighted(
      rng,
      pool.map((item): Weighted<string> => ({
        value: item.id,
        weight: item.rarity,
      })),
    );
    return chosen ?? null;
  }

  const required = template.requirements?.requiredItem;
  if (required !== undefined) return required;

  const first = template.effects?.items?.[0]?.itemId;
  if (first !== undefined) return first;

  const held = draft.inventory.find((entry) => entry.quantity > 0);
  return held?.itemId ?? null;
};

const applyEvent = (
  draft: Draft,
  candidate: Candidate,
  rng: Rng,
): AppliedEvent => {
  const { template, actor, target } = candidate;
  const effects = template.effects ?? {};

  // Read before anything moves, so the entry can report what the day cost.
  const before = snapshotStats(draft);

  const itemId = resolveItem(draft, template, rng);
  const itemName = itemId === null ? null : (getItem(itemId)?.name ?? null);

  if (effects.loot !== undefined && itemId !== null) {
    changeItem(draft, itemId, 1);
  }
  effects.items?.forEach((change) => {
    changeItem(draft, change.itemId, change.quantity);
  });

  // Every negative number an event carries goes through the difficulty scale.
  const softenedEveryone = soften(effects.everyone);
  if (effects.actor) adjustStats(draft, actor.id, soften(effects.actor) ?? {});
  if (effects.target && target) {
    adjustStats(draft, target.id, soften(effects.target) ?? {});
  }
  if (softenedEveryone) {
    // Whatever came over the wall did not come for the baby. Children are
    // carried, hidden, and handed round; an `everyone` payload is the day
    // happening to the people who went out to meet it.
    livingSurvivors(draft)
      .filter((survivor) => survivor.age >= ACTING_AGE)
      .forEach((survivor) => {
        adjustStats(draft, survivor.id, softenedEveryone);
      });
  }
  if (effects.infect !== undefined) {
    adjustStats(draft, actor.id, { infection: softenInfect(effects.infect) });
  }
  if (effects.trust !== undefined && target) {
    adjustTrust(draft, actor.id, target.id, effects.trust);
  }

  const message = applyTemplate(template.text, {
    생존자: actor.name,
    상대: target?.name,
    아이템: itemName ?? undefined,
  });

  const actorIds = target ? [actor.id, target.id] : [actor.id];
  const entryIndex = draft.entries.length;
  addEntry(draft, template.severity, message, actorIds);
  attachChanges(draft, entryIndex, diffStats(draft, before));

  // Not every line gets spoken. A log where someone talks after every single
  // event stops reading as a journal and starts reading as a script.
  if (template.dialogue && rng() < DIALOGUE_ODDS) {
    // The second party speaks the reply lines, when there is one.
    const speaker = target && rng() < 0.4 ? target : actor;
    const addressee = speaker.id === actor.id ? target : actor;

    // A line that addresses somebody needs somebody to address.
    const sayable = addressee
      ? template.dialogue
      : template.dialogue.filter((entry) => !entry.includes('{호칭}'));
    const line = pick(rng, sayable);

    if (line !== undefined) {
      /*
       * `{호칭}` is how age actually reaches the log. Korean has no neutral
       * second person, so a line that never uses a form of address quietly
       * throws the age field away — which is exactly what a playtester
       * reported: two years older and still being called 너.
       */
      addDialogue(
        draft,
        speaker.id,
        applyTemplate(line, {
          호칭: addressee ? addressOf(speaker, addressee) : undefined,
        }),
      );
    }
  }

  /*
   * Nothing here can end a run on its own any more. There used to be a `fatal`
   * flag that drove hp straight to zero; a survivor could be taken by a single
   * draw with nothing the player could have read beforehand. Events wound, and
   * only a survivor who was already low dies of the wound.
   */

  return {
    template,
    actorId: actor.id,
    targetId: target?.id ?? null,
  };
};

/**
 * Draws 1-3 events, never the same template twice in one day, and steering
 * away from whatever has already been drawn in the last few weeks.
 */
export const runEvents = (draft: Draft, rng: Rng): AppliedEvent[] => {
  const count = randomInt(rng, MIN_EVENTS_PER_DAY, MAX_EVENTS_PER_DAY);
  const recent = new Set(draft.recentEvents);
  const used = new Set<string>();
  // One category per day: two 탐색 events produced days where somebody found
  // an item and came back empty-handed in the same entry list.
  const usedCategories = new Set<string>();
  const applied: AppliedEvent[] = [];

  for (let index = 0; index < count; index += 1) {
    if (livingSurvivors(draft).length === 0) break;

    const open = EVENT_TEMPLATES.filter(
      (template) =>
        !used.has(template.id) && !usedCategories.has(template.category),
    );

    /*
     * Recent templates are excluded outright, not merely deweighted. A weight
     * penalty was tried first and did almost nothing: after two weeks most of
     * the eligible pool is recent, so scaling every candidate by the same
     * factor cancels out and the heaviest template wins again. A 70-day
     * playtest still had one line firing ten times.
     *
     * The fallback matters. A group with no items, no infection and two people
     * left has a small eligible pool, and refusing to repeat inside it would
     * end the run early — so if excluding the recent ones empties the list,
     * the full list comes back.
     */
    const fresh = open.filter((template) => !recent.has(template.id));

    const build = (pool: readonly EventTemplate[]): Candidate[] =>
      pool
        .map((template) => buildCandidate(draft, template, rng))
        .filter((candidate): candidate is Candidate => candidate !== null);

    const freshCandidates = build(fresh);
    const candidates =
      freshCandidates.length > 0 ? freshCandidates : build(open);

    const chosen = pickWeighted(
      rng,
      candidates.map((candidate) => ({
        value: candidate,
        weight: candidate.weight,
      })),
    );
    if (!chosen) break;

    used.add(chosen.template.id);
    usedCategories.add(chosen.template.category);
    applied.push(applyEvent(draft, chosen, rng));
  }

  draft.recentEvents = [...draft.recentEvents, ...used].slice(-RECENT_MEMORY);

  return applied;
};
