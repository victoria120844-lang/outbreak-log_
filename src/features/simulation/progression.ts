import { MARRIAGE_THRESHOLD, stageOf } from '@/data/relationships';
import type { Relationship, RelationshipKind } from '@/types';
import { pick, type Rng } from './rng';
import {
  addDialogue,
  addEntry,
  livingSurvivors,
  pairKey,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/** The lower of the two directions: a pair only advances if both sides do. */
const pairTrust = (
  relationships: readonly Relationship[],
  aId: string,
  bId: string,
): number | null => {
  const forward = relationships.find(
    (entry) => entry.fromId === aId && entry.toId === bId,
  );
  const backward = relationships.find(
    (entry) => entry.fromId === bId && entry.toId === aId,
  );
  if (!forward || !backward) return null;
  return Math.min(forward.trust, backward.trust);
};

export interface PairSnapshot {
  aId: string;
  bId: string;
  trust: number;
  /**
   * What the pair was called at the start of the day. Commitment is a label,
   * not a number: a pair the guard is holding below the line sits at 99 and is
   * nudged back to 100 by the daily bond every single morning, so reading
   * commitment off the trust value alone made pairs that were never announced
   * as a couple break up out of nowhere.
   */
  kind: RelationshipKind;
  /** How far this pair had ever climbed / fallen before today. */
  peak: number;
  floor: number;
}

const relationshipsFor = (draft: Draft, aId: string, bId: string) =>
  draft.relationships.filter(
    (entry) =>
      (entry.fromId === aId && entry.toId === bId) ||
      (entry.fromId === bId && entry.toId === aId),
  );

/**
 * Widens each pair's recorded range to include where it stands now. Called
 * once at the end of the relationship phase, after everything that moves trust.
 */
export const recordExtremes = (draft: Draft): void => {
  draft.relationships.forEach((entry) => {
    entry.peakTrust = Math.max(entry.peakTrust ?? entry.trust, entry.trust);
    entry.floorTrust = Math.min(entry.floorTrust ?? entry.trust, entry.trust);
  });
};

/** Forgets the range, so a reconciliation is allowed to be news again. */
export const resetExtremes = (draft: Draft, aId: string, bId: string): void => {
  relationshipsFor(draft, aId, bId).forEach((entry) => {
    entry.peakTrust = entry.trust;
    entry.floorTrust = entry.trust;
  });
};

/** Taken before the day runs, so the day's total movement can be compared. */
export const snapshotPairs = (draft: Draft): PairSnapshot[] => {
  const living = livingSurvivors(draft);
  const snapshots: PairSnapshot[] = [];

  living.forEach((left, index) => {
    living.slice(index + 1).forEach((right) => {
      const trust = pairTrust(draft.relationships, left.id, right.id);
      if (trust === null) return;

      const rows = relationshipsFor(draft, left.id, right.id);
      const peak = Math.max(
        ...rows.map((entry) => entry.peakTrust ?? entry.trust),
      );
      const floor = Math.min(
        ...rows.map((entry) => entry.floorTrust ?? entry.trust),
      );
      const kind = rows[0]?.kind ?? '초면';

      snapshots.push({ aId: left.id, bId: right.id, trust, kind, peak, floor });
    });
  });

  return snapshots;
};

/**
 * Writes an entry whenever a pair climbs onto a higher rung. Only upward
 * moves are announced — drifting back down is its own quiet tragedy, and the
 * conflict templates already cover it.
 */
export const runProgression = (
  draft: Draft,
  before: readonly PairSnapshot[],
  rng: Rng,
  /** Pairs already narrated elsewhere today — a breakup tells its own story. */
  skip: ReadonlySet<string> = new Set(),
): void => {
  before.forEach((snapshot) => {
    if (skip.has(pairKey(snapshot.aId, snapshot.bId))) return;

    const after = pairTrust(draft.relationships, snapshot.aId, snapshot.bId);
    if (after === null || after === snapshot.trust) return;

    const fromStage = stageOf(snapshot.trust);
    const toStage = stageOf(after);
    if (toStage.threshold === fromStage.threshold) return;

    const a = draft.survivors.find((entry) => entry.id === snapshot.aId);
    const b = draft.survivors.find((entry) => entry.id === snapshot.bId);
    if (!a || !b || !a.alive || !b.alive) return;

    // Climbing is one story; sliding back is a different one, and it needs
    // its own words. A bond that quietly cools is worth a line too.
    const rising = toStage.threshold > fromStage.threshold;

    // New ground only. A pair parked on a threshold crosses it every other day
    // as ordinary events push trust back and forth; a 70-day playtest had one
    // couple marry four separate times. The log records the first climb to a
    // rung and the first fall from it, and stays quiet about the pacing.
    if (rising && after <= snapshot.peak) return;
    if (!rising && after >= snapshot.floor) return;

    const lines = rising ? toStage.lines : (toStage.fallLines ?? []);
    const spoken = rising ? toStage.dialogue : toStage.fallDialogue;
    if (lines.length === 0) return;

    const line = pick(rng, lines);
    if (line === undefined) return;

    const slots = { 생존자: a.name, 상대: b.name };

    // Said plainly first, so the player can tell at a glance who paired off.
    // The flavor line that follows never names the relationship out loud.
    if (rising && toStage.announce !== undefined) {
      addEntry(draft, 'notable', applyTemplate(toStage.announce, slots), [
        a.id,
        b.id,
      ]);
    }

    addEntry(
      draft,
      rising && toStage.threshold >= MARRIAGE_THRESHOLD ? 'notable' : 'routine',
      applyTemplate(line, slots),
      [a.id, b.id],
    );

    if (spoken && spoken.length > 0) {
      const said = pick(rng, spoken);
      // The one whose feeling moved further is the one who says it.
      const speaker = rising ? a : b;
      if (said !== undefined) {
        addDialogue(draft, speaker.id, applyTemplate(said, slots));
      }
    }
  });
};
