import {
  BREAKUP_DIALOGUE,
  BREAKUP_LINES,
  BREAKUP_MORALE,
  BREAKUP_TRUST,
  EX_LOVER_DIALOGUE,
  EX_LOVER_ODDS,
  LOVER_THRESHOLD,
  RECONCILE_LINES,
  RECONCILE_TRUST,
  ROMANCE_MIN_AGE,
} from '@/data/relationships';
import type { Survivor } from '@/types';
import { resetExtremes, type PairSnapshot } from './progression';
import { pick, type Rng } from './rng';
import {
  addDialogue,
  addEntry,
  adjustStats,
  capTrust,
  kindBetween,
  livingSurvivors,
  pairKey,
  setKind,
  setTrust,
  trustBetween,
  type Draft,
} from './state';
import { applyTemplate } from './text';

/**
 * Who is allowed to fall for whom, and what happens when it ends.
 *
 * Runs between drift and progression: by the time progression looks for rungs
 * that were crossed, this has already decided which crossings were allowed, so
 * a blocked romance is never announced and then retracted.
 */

const ROMANCE_CEILING = LOVER_THRESHOLD - 1;

/** Blood family is not a romance and never blocks or gets blocked as one. */
const isRomantic = (draft: Draft, aId: string, bId: string): boolean =>
  kindBetween(draft, aId, bId) !== '가족';

const bothAdult = (a: Survivor, b: Survivor): boolean =>
  a.age >= ROMANCE_MIN_AGE && b.age >= ROMANCE_MIN_AGE;

/**
 * Already a couple as of this morning. Read off the label, never off the trust
 * value: a pair the guard is holding sits at exactly one below the line, and
 * the daily bond pushes it back over every morning, so a numeric test made
 * held pairs look committed and then "break up" without ever having been
 * announced as together.
 */
const isCommitted = (snapshot: PairSnapshot): boolean => snapshot.kind === '연인';

/**
 * Keeps a pair one rung short of 연인. Only ever applied to pairs that were
 * below the line this morning — an established couple is never quietly
 * demoted, which would read to the player as a breakup nobody caused.
 */
const hold = (draft: Draft, aId: string, bId: string): void => {
  capTrust(draft, aId, bId, ROMANCE_CEILING);
};

/**
 * 순애 모드 and the age gate, applied to today's movement.
 *
 * Partners are read from this morning's snapshot, so somebody who was already
 * committed keeps their claim; pairs that cross the line today are settled in
 * descending order of trust, and the ones that lose the race are held back.
 */
export const runRomanceGuard = (
  draft: Draft,
  before: readonly PairSnapshot[],
): Set<string> => {
  /*
   * Every pair the guard held back today. Progression has to skip these: a
   * bond the guard pins at one below the line climbs back over it the next
   * morning and gets pinned again, and without this the log narrated that as
   * a pair falling out of 연인 — every single day. A 200-day run with a child
   * in it produced the same sentence 125 times, because childcare pushes a
   * bond up faster than anything else and the age gate keeps catching it.
   */
  const held = new Set<string>();
  const byId = new Map(draft.survivors.map((survivor) => [survivor.id, survivor]));

  // The age gate is not a mode. It applies whether 순애 모드 is on or off.
  before.forEach((snapshot) => {
    if (isCommitted(snapshot)) return;
    const a = byId.get(snapshot.aId);
    const b = byId.get(snapshot.bId);
    if (!a || !b || bothAdult(a, b)) return;
    hold(draft, a.id, b.id);
    held.add(pairKey(a.id, b.id));
  });

  if (!draft.pureLove) return held;

  /*
   * Every pair that is committed tonight, ranked, then walked once. Standing
   * couples outrank today's crossings — being together yesterday beats a good
   * day today — and everything that loses is held back.
   *
   * The ranking deliberately includes pairs that were already committed this
   * morning. An earlier version only capped today's crossings, which meant a
   * survivor who somehow ended up in two standing romances stayed in both
   * forever; a 70-day playtest found exactly that. Capping a standing pair
   * here drops it below the line, which is what `runBreakups` reads as an
   * ending — so the situation resolves itself, in the log, with words.
   */
  const committed = before
    .filter((snapshot) => isRomantic(draft, snapshot.aId, snapshot.bId))
    .map((snapshot) => ({
      aId: snapshot.aId,
      bId: snapshot.bId,
      now: trustBetween(draft, snapshot.aId, snapshot.bId) ?? 0,
      standing: isCommitted(snapshot),
    }))
    .filter((entry) => entry.standing || entry.now >= LOVER_THRESHOLD)
    .sort(
      (left, right) =>
        Number(right.standing) - Number(left.standing) ||
        right.now - left.now ||
        pairKey(left.aId, left.bId).localeCompare(pairKey(right.aId, right.bId)),
    );

  const partnerOf = new Map<string, string>();

  committed.forEach((entry) => {
    const taken = partnerOf.has(entry.aId) || partnerOf.has(entry.bId);
    if (taken) {
      hold(draft, entry.aId, entry.bId);
      // A standing couple broken up by the cap is a story, and `runBreakups`
      // tells it. Only a pair that never got there is silenced here.
      if (!entry.standing) held.add(pairKey(entry.aId, entry.bId));
      return;
    }
    partnerOf.set(entry.aId, entry.bId);
    partnerOf.set(entry.bId, entry.aId);
  });

  return held;
};

/**
 * Marks a pair as what it now is. The kind is what the relationships panel
 * shows, so it is the only place the player sees a romance outside the log.
 */
export const labelRomances = (
  draft: Draft,
  before: readonly PairSnapshot[],
): void => {
  before.forEach((snapshot) => {
    if (isCommitted(snapshot)) return;
    const now = trustBetween(draft, snapshot.aId, snapshot.bId);
    if (now === null || now < LOVER_THRESHOLD) return;
    if (kindBetween(draft, snapshot.aId, snapshot.bId) === '가족') return;
    setKind(draft, snapshot.aId, snapshot.bId, '연인');
  });
};

/**
 * A pair that was committed this morning and is not by tonight does not simply
 * cool off. It ends, loudly, and the two of them land deep in hostile territory
 * — far enough that the conflict templates start picking them out.
 *
 * Returns the pair keys it handled, so progression does not also narrate the
 * long slide down through every rung on the way.
 */
export const runBreakups = (
  draft: Draft,
  before: readonly PairSnapshot[],
  rng: Rng,
): Set<string> => {
  const broken = new Set<string>();

  before.forEach((snapshot) => {
    // Only a couple the log actually announced, and one that was still above
    // the line this morning, can be ended by it.
    if (!isCommitted(snapshot)) return;
    if (snapshot.trust < LOVER_THRESHOLD) return;

    const now = trustBetween(draft, snapshot.aId, snapshot.bId);
    if (now === null || now >= LOVER_THRESHOLD) return;

    const a = draft.survivors.find((entry) => entry.id === snapshot.aId);
    const b = draft.survivors.find((entry) => entry.id === snapshot.bId);
    if (!a || !b || !a.alive || !b.alive) return;

    const line = pick(rng, BREAKUP_LINES);
    if (line === undefined) return;

    const slots = { 생존자: a.name, 상대: b.name };
    addEntry(draft, 'notable', applyTemplate(line, slots), [a.id, b.id]);

    const said = pick(rng, BREAKUP_DIALOGUE);
    if (said !== undefined) {
      addDialogue(draft, rng() < 0.5 ? a.id : b.id, said);
    }

    setTrust(draft, a.id, b.id, BREAKUP_TRUST);
    setKind(draft, a.id, b.id, '원한');
    // Wiped so that if these two ever climb back, the log treats it as news
    // rather than as a threshold they have already been past.
    resetExtremes(draft, a.id, b.id);
    adjustStats(draft, a.id, { morale: BREAKUP_MORALE });
    adjustStats(draft, b.id, { morale: BREAKUP_MORALE });

    broken.add(pairKey(a.id, b.id));
  });

  return broken;
};

/**
 * Ex-lovers who have climbed back out of hostility stop being ex-lovers.
 *
 * Without this the 원한 label was permanent: a 200-day playtest ended with a
 * pair sitting at +63 trust and still filed under 원한, which the relationship
 * panel reported as a feud neither of them was having any more.
 */
export const runReconciliation = (draft: Draft, rng: Rng): void => {
  const seen = new Set<string>();

  livingSurvivors(draft).forEach((left) => {
    livingSurvivors(draft).forEach((right) => {
      if (left.id === right.id) return;
      const key = pairKey(left.id, right.id);
      if (seen.has(key)) return;
      if (kindBetween(draft, left.id, right.id) !== '원한') return;

      const trust = trustBetween(draft, left.id, right.id);
      if (trust === null || trust < RECONCILE_TRUST) return;

      seen.add(key);
      setKind(draft, left.id, right.id, '동료');

      const line = pick(rng, RECONCILE_LINES);
      if (line !== undefined) {
        addEntry(
          draft,
          'routine',
          applyTemplate(line, { 생존자: left.name, 상대: right.name }),
          [left.id, right.id],
        );
      }
    });
  });
};

/**
 * The days after. Two people who used to share a blanket now share a room they
 * both want to leave, and the log should hear it.
 */
export const runExLovers = (draft: Draft, rng: Rng): void => {
  const living = livingSurvivors(draft);
  if (living.length < 2) return;

  const spoken = new Set<string>();

  living.forEach((left) => {
    living.forEach((right) => {
      if (left.id === right.id) return;
      const key = pairKey(left.id, right.id);
      if (spoken.has(key)) return;
      if (kindBetween(draft, left.id, right.id) !== '원한') return;

      const trust = trustBetween(draft, left.id, right.id);
      if (trust === null || trust > BREAKUP_TRUST + 20) return;
      if (rng() > EX_LOVER_ODDS) return;

      const said = pick(rng, EX_LOVER_DIALOGUE);
      if (said === undefined) return;

      spoken.add(key);
      addDialogue(draft, rng() < 0.5 ? left.id : right.id, said);
    });
  });
};
