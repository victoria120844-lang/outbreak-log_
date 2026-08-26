import type { LogEntry, PendingChoice } from '@/types';
import { maybeDrawChoice, resolveChoice } from './choices';
import { runPregnancy } from './birth';
import { runChildcare } from './childcare';
import { runDrift } from './drift';
import { runEvents } from './events';
import { runInfection } from './infection';
import { runGrief, runMemorial } from './memorial';
import { recordExtremes, runProgression, snapshotPairs } from './progression';
import {
  labelRomances,
  runBreakups,
  runExLovers,
  runReconciliation,
  runRomanceGuard,
} from './romance';
import { createDayRng, type Rng } from './rng';
import {
  addEntry,
  clampAllStats,
  createDraft,
  killSurvivor,
  livingSurvivors,
  type Draft,
  type WorldState,
} from './state';
import { runContained, unresolvedTurn } from './turning';
import { runForaging, runUpkeep } from './upkeep';

/**
 * A run ends when the last survivor does, and not before. There used to be a
 * 100-day cap; it stopped runs that were still going somewhere.
 */

export interface AdvanceResult {
  state: WorldState;
  entries: LogEntry[];
}

/**
 * Four ways to say it, picked deterministically. One fixed sentence read as a
 * template the third time a run lost somebody.
 */
const DEATH_LINES: readonly string[] = [
  '아침에 일어나지 않았다.',
  '밤사이 조용해졌다.',
  '더는 버티지 못했다.',
  '마지막까지 아무 말도 없었다.',
];

const deathLineFor = (survivorId: string, day: number): string => {
  let hash = day;
  for (let index = 0; index < survivorId.length; index += 1) {
    hash = (hash * 31 + survivorId.charCodeAt(index)) >>> 0;
  }
  return DEATH_LINES[hash % DEATH_LINES.length] ?? DEATH_LINES[0] ?? '';
};

/** hp at zero is death by whatever the day did, not by infection. */
const resolveDeaths = (draft: Draft): void => {
  livingSurvivors(draft).forEach((survivor) => {
    if (survivor.stats.hp > 0) return;
    killSurvivor(draft, survivor.id);
    addEntry(
      draft,
      'death',
      `${survivor.name}. ${deathLineFor(survivor.id, draft.day)}`,
      [survivor.id],
    );
  });
};

const toState = (draft: Draft): WorldState => ({
  day: draft.day,
  runSeed: draft.runSeed,
  status: draft.status,
  survivors: draft.survivors,
  relationships: draft.relationships,
  inventory: draft.inventory,
  deprivation: draft.deprivation,
  pendingChoice: draft.pendingChoice,
  pureLove: draft.pureLove,
  recentEvents: draft.recentEvents,
  recentChoices: draft.recentChoices,
});

/** Choice rolls take their own stream so they never disturb the day's. */
const choiceRng = (runSeed: number, day: number): Rng =>
  createDayRng(runSeed ^ 0x5bf03635, day);

/**
 * One day: upkeep, infection, events, relationship drift, then resolution.
 * Pure — the state passed in is never touched.
 */
export const advanceDay = (state: WorldState): AdvanceResult => {
  // A day cannot start while the last one is still waiting on an answer.
  if (state.status === 'ended' || state.pendingChoice !== null) {
    return { state, entries: [] };
  }

  const draft = createDraft(state);
  draft.day = state.day + 1;

  const rng = createDayRng(state.runSeed, draft.day);

  // Taken first so progression sees the whole day's movement, wherever it
  // came from — events, drift, or both.
  const pairsBefore = snapshotPairs(draft);

  const aliveBefore = new Set(livingSurvivors(draft).map((s) => s.id));

  runForaging(draft, rng);
  runUpkeep(draft, rng);
  // Turning takes people off the roster without killing them, so the day has
  // to know who left by that door and not mourn them yet.
  const turnedToday = new Set(runInfection(draft, rng));
  runContained(draft, rng);
  const applied = runEvents(draft, rng);
  runDrift(draft, applied);

  // Romance is settled before progression narrates anything, so a bond that
  // 순애 모드 refuses to allow is never announced and then walked back.
  const held = runRomanceGuard(draft, pairsBefore);
  const broken = runBreakups(draft, pairsBefore, rng);
  labelRomances(draft, pairsBefore);
  // A pair the guard pinned did not fall out of anything; it was never let in.
  runProgression(draft, pairsBefore, rng, new Set([...broken, ...held]));
  runExLovers(draft, rng);
  runReconciliation(draft, rng);
  // After the day's damage, so a pregnancy is judged on tonight's condition.
  runPregnancy(draft, rng);
  // And after that, so a child born tonight is not also looked after tonight.
  runChildcare(draft, rng);
  recordExtremes(draft);

  clampAllStats(draft);
  resolveDeaths(draft);
  clampAllStats(draft);

  // Whoever the day took, the people left standing say something about it.
  const lostToday = [...aliveBefore].filter(
    (id) =>
      !turnedToday.has(id) &&
      !draft.survivors.some((s) => s.id === id && s.alive),
  );
  if (lostToday.length > 0) runMemorial(draft, lostToday, rng);
  runGrief(draft, rng);
  clampAllStats(draft);

  // Drawn last so the decision reads as the thing that closes the day.
  draft.pendingChoice = maybeDrawChoice(
    draft,
    choiceRng(state.runSeed, draft.day),
  );

  const survivingCount = livingSurvivors(draft).length;
  const startedWithSurvivors = state.survivors.some(
    (survivor) => survivor.alive,
  );

  if (startedWithSurvivors && survivingCount === 0) {
    draft.status = 'ended';
    addEntry(draft, 'death', '기록은 여기서 끊긴다. 남은 사람은 없다.');
  }

  return { state: toState(draft), entries: draft.entries };
};

/**
 * Answers the decision the run stopped on. The roll is seeded from the run and
 * the option, so the same pick on the same seed always lands the same way.
 */
export const applyChoice = (
  state: WorldState,
  optionId: string,
): AdvanceResult => {
  const pending = state.pendingChoice;
  if (pending === null) return { state, entries: [] };

  const draft = createDraft(state);
  draft.entryPrefix = 'c';
  const rng = choiceRng(state.runSeed + optionId.length, pending.day + 1);

  resolveChoice(draft, pending, optionId, rng);
  draft.pendingChoice = null;

  clampAllStats(draft);
  resolveDeaths(draft);
  clampAllStats(draft);

  // Two people can turn on the same day. Answering the first has to surface
  // the second rather than letting the run walk past it.
  if (unresolvedTurn(draft) !== undefined && livingSurvivors(draft).length > 0) {
    draft.pendingChoice = maybeDrawChoice(draft, rng);
  }

  if (livingSurvivors(draft).length === 0) {
    draft.status = 'ended';
    addEntry(draft, 'death', '기록은 여기서 끊긴다. 남은 사람은 없다.');
  }

  return { state: toState(draft), entries: draft.entries };
};

/** Picks an answer when a headless run hits a decision. */
export type ChoiceResolver = (pending: PendingChoice) => string | null;

/** Always takes the first option. Enough to replay a run without a player. */
export const takeFirstOption: ChoiceResolver = (pending) =>
  pending.options[0]?.id ?? null;

/**
 * Replays a run from its seed. Same seed and inputs, same log.
 *
 * Without a resolver the run stops at the first decision, because that is what
 * the product does — the player is the resolver.
 */
export const runDays = (
  state: WorldState,
  days: number,
  resolve?: ChoiceResolver,
): AdvanceResult => {
  let current = state;
  const entries: LogEntry[] = [];

  for (let index = 0; index < days; index += 1) {
    if (current.pendingChoice !== null) {
      if (!resolve) break;
      const optionId = resolve(current.pendingChoice);
      if (optionId === null) break;

      const answered = applyChoice(current, optionId);
      current = answered.state;
      entries.push(...answered.entries);
      if (current.status === 'ended') break;
    }

    const result = advanceDay(current);
    current = result.state;
    entries.push(...result.entries);
    if (current.status === 'ended') break;
  }

  return { state: current, entries };
};
