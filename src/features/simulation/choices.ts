import { ABILITY_LABELS } from '@/data/abilities';
import { CHOICE_TEMPLATES, successChance } from '@/data/choices';
import { soften, softenInfect } from '@/data/difficulty';
import {
  TURNED_CONTAIN,
  TURNED_DIALOGUE,
  TURNED_PROMPT,
  TURNED_PUT_DOWN_FAILURE,
  TURNED_PUT_DOWN_SUCCESS,
  TURNED_RELEASE_FAILURE,
  TURNED_RELEASE_SUCCESS,
} from '@/data/turning';
import type {
  ChoiceOutcome,
  ChoiceTemplate,
  PendingChoice,
  Survivor,
} from '@/types';
import { pick, type Rng } from './rng';
import {
  actingSurvivors,
  addDialogue,
  addEntry,
  adjustStats,
  adjustTrust,
  attachChanges,
  changeItem,
  diffStats,
  livingSurvivors,
  snapshotStats,
  trustBetween,
  type Draft,
} from './state';
import { applyTemplate } from './text';
import { layToRest, unresolvedTurn } from './turning';

/** Roughly one day in four stops on a decision. */
export const CHOICE_ODDS = 0.26;

/**
 * How many recently-drawn decisions are remembered. Playtesting reported the
 * same handful of prompts over and over; the catalogue was drawn from
 * uniformly with no memory at all.
 */
export const RECENT_CHOICE_MEMORY = 8;

/** Not a template — the run manufactures this one when somebody turns. */
export const TURNED_TEMPLATE_ID = 'turnedSurvivor';

const needsTarget = (template: ChoiceTemplate): boolean =>
  template.prompt.includes('{상대}') ||
  template.options.some(
    (option) =>
      option.label.includes('{상대}') ||
      option.success.text.includes('{상대}') ||
      option.success.target !== undefined,
  );

/**
 * Draws a decision for the day, or returns null. The engine stays pure: this
 * only describes the question, and `resolveChoice` applies whatever is picked.
 */
export const maybeDrawChoice = (
  draft: Draft,
  rng: Rng,
): PendingChoice | null => {
  // Somebody turning is not a die roll. It stops the day on its own.
  const turned = drawTurnedChoice(draft);
  if (turned !== null) return turned;

  if (rng() > CHOICE_ODDS) return null;

  const living = actingSurvivors(draft);
  if (living.length === 0) return null;

  // Same reasoning as the event draw: recent prompts are excluded outright,
  // and the whole catalogue comes back only if that would leave nothing.
  const fresh = CHOICE_TEMPLATES.filter(
    (candidate) => !draft.recentChoices.includes(candidate.id),
  );
  const template = pick(rng, fresh.length > 0 ? fresh : CHOICE_TEMPLATES);
  if (!template) return null;

  draft.recentChoices = [...draft.recentChoices, template.id].slice(
    -RECENT_CHOICE_MEMORY,
  );

  const actor = pick(rng, living);
  if (!actor) return null;

  let target: Survivor | null = null;
  if (needsTarget(template)) {
    const others = living.filter((survivor) => survivor.id !== actor.id);
    const chosen = pick(rng, others);
    if (!chosen) return null;
    target = chosen;
  }

  const slots = { 생존자: actor.name, 상대: target?.name };

  return {
    templateId: template.id,
    day: draft.day,
    actorId: actor.id,
    targetId: target?.id ?? null,
    prompt: applyTemplate(template.prompt, slots),
    options: template.options.map((option) => ({
      id: option.id,
      label: applyTemplate(option.label, slots),
      chance: successChance(
        option.ability,
        option.ability === null ? 0 : actor.abilities[option.ability],
        option.difficulty,
      ),
      abilityLabel:
        option.ability === null ? null : ABILITY_LABELS[option.ability],
    })),
  };
};

/**
 * The decision a turned survivor forces. Not drawn from the catalogue: it
 * names a specific person, and its outcomes change the roster rather than a
 * stat, so it is built here and resolved by hand.
 *
 * The person holding the door is whoever was closest to them. That is the
 * cruelty of it, and it is deliberate.
 */
const drawTurnedChoice = (draft: Draft): PendingChoice | null => {
  const zombie = unresolvedTurn(draft);
  if (!zombie) return null;

  const living = actingSurvivors(draft);
  if (living.length === 0) return null;

  const actor = [...living].sort(
    (left, right) =>
      (trustBetween(draft, right.id, zombie.id) ?? 0) -
      (trustBetween(draft, left.id, zombie.id) ?? 0),
  )[0];
  if (!actor) return null;

  const slots = { 생존자: actor.name, 상대: zombie.name };

  return {
    templateId: TURNED_TEMPLATE_ID,
    day: draft.day,
    actorId: actor.id,
    targetId: zombie.id,
    prompt: applyTemplate(TURNED_PROMPT, slots),
    options: [
      {
        id: 'putDown',
        label: `${actor.name}가 직접 보낸다`,
        chance: successChance('strength', actor.abilities.strength, 5),
        abilityLabel: ABILITY_LABELS.strength,
      },
      {
        id: 'release',
        label: '문을 열고 내보낸다',
        chance: successChance('agility', actor.abilities.agility, 4),
        abilityLabel: ABILITY_LABELS.agility,
      },
      {
        id: 'contain',
        label: '창고에 가두고 미룬다',
        chance: 1,
        abilityLabel: null,
      },
    ],
  };
};

/** Applies the answer to a turning. Every branch removes the person or keeps
    them locked in the building; none of them is free. */
const resolveTurned = (
  draft: Draft,
  pending: PendingChoice,
  optionId: string,
  rng: Rng,
): ChoiceResult | null => {
  const actor = draft.survivors.find((entry) => entry.id === pending.actorId);
  const zombie = draft.survivors.find((entry) => entry.id === pending.targetId);
  if (!actor || !zombie) return null;

  const slots = { 생존자: actor.name, 상대: zombie.name };
  const both = [actor.id, zombie.id];
  const before = snapshotStats(draft);

  const speak = (key: string): void => {
    const line = pick(rng, TURNED_DIALOGUE[key] ?? []);
    if (line !== undefined) addDialogue(draft, actor.id, line);
  };

  if (optionId === 'contain') {
    const containIndex = draft.entries.length;
    zombie.contained = true;
    addEntry(draft, 'notable', applyTemplate(TURNED_CONTAIN, slots), both);
    speak('contain');
    const cost = soften({ morale: -4 }) ?? {};
    livingSurvivors(draft).forEach((survivor) => {
      adjustStats(draft, survivor.id, cost);
    });
    attachChanges(draft, containIndex, diffStats(draft, before));
    return { succeeded: true, message: TURNED_CONTAIN };
  }

  const isPutDown = optionId === 'putDown';
  const ability = isPutDown ? 'strength' : 'agility';
  const chance = successChance(
    ability,
    actor.abilities[ability],
    isPutDown ? 5 : 4,
  );
  const succeeded = rng() < chance;

  const text = isPutDown
    ? succeeded
      ? TURNED_PUT_DOWN_SUCCESS
      : TURNED_PUT_DOWN_FAILURE
    : succeeded
      ? TURNED_RELEASE_SUCCESS
      : TURNED_RELEASE_FAILURE;

  const entryIndex = draft.entries.length;
  addEntry(
    draft,
    succeeded ? 'notable' : 'critical',
    applyTemplate(text, slots),
    both,
  );
  speak(isPutDown ? 'putDown' : 'release');

  // Through the same scale as everything else — this used to be the one place
  // that could take twenty-two hp off somebody at full authored strength.
  adjustStats(
    draft,
    actor.id,
    soften({ morale: isPutDown ? -18 : -8 }) ?? {},
  );
  if (!succeeded) {
    adjustStats(
      draft,
      actor.id,
      soften({
        hp: isPutDown ? -22 : -12,
        infection: isPutDown ? 25 : 15,
      }) ?? {},
    );
  }
  const bystander = soften({ morale: isPutDown ? -10 : -6 }) ?? {};
  livingSurvivors(draft).forEach((survivor) => {
    if (survivor.id === actor.id) return;
    adjustStats(draft, survivor.id, bystander);
  });

  attachChanges(draft, entryIndex, diffStats(draft, before));
  layToRest(draft, zombie.id, rng);

  return { succeeded, message: text };
};

const applyOutcome = (
  draft: Draft,
  outcome: ChoiceOutcome,
  actorId: string,
  targetId: string | null,
): void => {
  outcome.items?.forEach((change) => {
    changeItem(draft, change.itemId, change.quantity);
  });

  // A decision's downside runs through the same difficulty scale an event does.
  const everyone = soften(outcome.everyone);
  if (outcome.actor) adjustStats(draft, actorId, soften(outcome.actor) ?? {});
  if (outcome.target && targetId) {
    adjustStats(draft, targetId, soften(outcome.target) ?? {});
  }
  if (everyone) {
    livingSurvivors(draft).forEach((survivor) => {
      adjustStats(draft, survivor.id, everyone);
    });
  }
  if (outcome.infect !== undefined) {
    adjustStats(draft, actorId, { infection: softenInfect(outcome.infect) });
  }
  if (outcome.trust !== undefined && targetId) {
    adjustTrust(draft, actorId, targetId, outcome.trust);
  }
};

export interface ChoiceResult {
  succeeded: boolean;
  message: string;
}

/**
 * Applies the option the player picked. The roll uses the run's own stream, so
 * the same seed and the same picks replay identically.
 */
export const resolveChoice = (
  draft: Draft,
  pending: PendingChoice,
  optionId: string,
  rng: Rng,
): ChoiceResult | null => {
  if (pending.templateId === TURNED_TEMPLATE_ID) {
    return resolveTurned(draft, pending, optionId, rng);
  }

  const template = CHOICE_TEMPLATES.find(
    (candidate) => candidate.id === pending.templateId,
  );
  const option = template?.options.find(
    (candidate) => candidate.id === optionId,
  );
  if (!template || !option) return null;

  const actor = draft.survivors.find((entry) => entry.id === pending.actorId);
  if (!actor) return null;
  const target =
    pending.targetId === null
      ? null
      : (draft.survivors.find((entry) => entry.id === pending.targetId) ?? null);

  const score =
    option.ability === null ? 0 : actor.abilities[option.ability];
  const chance = successChance(option.ability, score, option.difficulty);
  const succeeded = option.ability === null || rng() < chance;
  const outcome = succeeded ? option.success : option.failure;

  const before = snapshotStats(draft);
  applyOutcome(draft, outcome, actor.id, target?.id ?? null);

  const message = applyTemplate(outcome.text, {
    생존자: actor.name,
    상대: target?.name,
  });
  if (message.length > 0) {
    const entryIndex = draft.entries.length;
    addEntry(
      draft,
      succeeded ? 'notable' : 'critical',
      message,
      target ? [actor.id, target.id] : [actor.id],
    );
    attachChanges(draft, entryIndex, diffStats(draft, before));
  }

  return { succeeded, message };
};
