import { describe, expect, it } from 'vitest';
import {
  MARRIAGE_THRESHOLD,
  RELATIONSHIP_STAGES,
  stageOf,
} from '@/data/relationships';
import { runProgression, snapshotPairs } from './progression';
import { mulberry32 } from './rng';
import { adjustTrust, createDraft, createWorld } from './state';
import { makePair, makeSurvivor } from './testUtils';

const draftAt = (trust: number) =>
  createDraft(
    createWorld({
      runSeed: 1,
      survivors: [makeSurvivor('s1', '민수'), makeSurvivor('s2', '지연')],
      relationships: makePair('s1', 's2', trust),
    }),
  );

const climb = (from: number, to: number) => {
  const draft = draftAt(from);
  const before = snapshotPairs(draft);
  adjustTrust(draft, 's1', 's2', to - from);
  runProgression(draft, before, mulberry32(7));
  return draft;
};

describe('stageOf', () => {
  it('walks the ladder the brief describes', () => {
    expect(stageOf(0).label).toBe('모르는 사람');
    expect(stageOf(10).label).toBe('낯선 사람');
    expect(stageOf(30).label).toBe('지인');
    expect(stageOf(50).label).toBe('친구');
    expect(stageOf(60).label).toBe('베스트 프렌드');
    expect(stageOf(100).label).toBe('연인');
    expect(stageOf(150).label).toBe('부부');
  });

  it('holds a rung until the next threshold', () => {
    expect(stageOf(29).label).toBe('낯선 사람');
    expect(stageOf(49).label).toBe('지인');
    expect(stageOf(59).label).toBe('친구');
    expect(stageOf(99).label).toBe('베스트 프렌드');
    expect(stageOf(149).label).toBe('연인');
  });

  it('still describes hostility below zero', () => {
    expect(stageOf(-70).label).toBe('적대');
    expect(stageOf(-30).label).toBe('불신');
  });
});

/** Narration only — the spoken follow-up is counted separately. */
const narrations = (draft: ReturnType<typeof draftAt>) =>
  draft.entries.filter((entry) => entry.speakerId === undefined);
const spoken = (draft: ReturnType<typeof draftAt>) =>
  draft.entries.filter((entry) => entry.speakerId !== undefined);

describe('runProgression', () => {
  it('announces crossing into 낯선 사람', () => {
    const draft = climb(0, 10);
    expect(narrations(draft)).toHaveLength(1);
    expect(narrations(draft)[0]?.message).toContain('민수');
    expect(narrations(draft)[0]?.message).toContain('지연');
  });

  it('announces each further rung', () => {
    expect(narrations(climb(10, 30))).toHaveLength(1);
    expect(narrations(climb(30, 50))).toHaveLength(1);
    expect(narrations(climb(50, 60))).toHaveLength(1);
  });

  // The two rungs that change what the pair IS get a plain headline on top of
  // the flavor line, because the flavor lines never say the word and players
  // could not tell who had actually paired off.
  it('says out loud who became a couple', () => {
    const lines = narrations(climb(60, 100));
    expect(lines).toHaveLength(2);
    expect(lines[0]?.message).toContain('연인이 되었다');
    expect(lines[0]?.message).toContain('민수');
    expect(lines[0]?.message).toContain('지연');
    expect(lines[0]?.severity).toBe('notable');
  });

  it('leaves the quieter rungs unannounced', () => {
    [climb(10, 30), climb(30, 50), climb(50, 60)].forEach((draft) => {
      expect(narrations(draft)[0]?.message).not.toContain('되었다');
    });
  });

  it('gives the moment a spoken line as well as narration', () => {
    const draft = climb(30, 50);
    expect(spoken(draft)).toHaveLength(1);
    expect(spoken(draft)[0]?.speakerId).toBe('s1');
    expect(spoken(draft)[0]?.message.length).toBeGreaterThan(2);
  });

  it('marks the wedding as a milestone, not a routine day', () => {
    const draft = climb(100, MARRIAGE_THRESHOLD);
    const lines = narrations(draft);
    expect(lines).toHaveLength(2);
    expect(lines[0]?.message).toContain('부부가 되었다');
    expect(lines[0]?.severity).toBe('notable');
    expect(lines[1]?.severity).toBe('notable');
  });

  it('skips a pair whose story was already told today', () => {
    const draft = draftAt(60);
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 40);
    runProgression(draft, before, mulberry32(7), new Set(['s1|s2']));
    expect(draft.entries).toHaveLength(0);
  });

  it('says nothing when trust moves inside a rung', () => {
    expect(climb(30, 45).entries).toHaveLength(0);
  });

  it('narrates the fall too, in its own words', () => {
    const draft = climb(60, 20);
    expect(narrations(draft)).toHaveLength(1);
    // A cooling bond is not described with the language of a warming one.
    expect(narrations(draft)[0]?.message).not.toContain('농담');
  });

  it('lets the other side speak on the way down', () => {
    const draft = climb(60, 20);
    expect(spoken(draft)[0]?.speakerId).toBe('s2');
  });

  it('announces only once even if two rungs are cleared at once', () => {
    const draft = climb(0, 60);
    expect(narrations(draft)).toHaveLength(1);
    expect(narrations(draft)[0]?.message.length).toBeGreaterThan(4);
  });

  it('needs both directions to agree before it advances', () => {
    const draft = draftAt(45);
    const before = snapshotPairs(draft);
    // Only one side warms up; the pair has not moved.
    const forward = draft.relationships.find(
      (entry) => entry.fromId === 's1' && entry.toId === 's2',
    );
    if (forward) forward.trust = 80;
    runProgression(draft, before, mulberry32(3));

    expect(draft.entries).toHaveLength(0);
  });

  it('leaves the dead out of it', () => {
    const draft = createDraft(
      createWorld({
        runSeed: 1,
        survivors: [
          makeSurvivor('s1', '민수'),
          makeSurvivor('s2', '지연', { alive: false, status: '사망' }),
        ],
        relationships: makePair('s1', 's2', 0),
      }),
    );
    const before = snapshotPairs(draft);
    adjustTrust(draft, 's1', 's2', 60);
    runProgression(draft, before, mulberry32(1));

    expect(draft.entries).toHaveLength(0);
  });
});

describe('stage dialogue', () => {
  it('gives every stage that narrates a rise something to say', () => {
    RELATIONSHIP_STAGES.filter((stage) => stage.lines.length > 0).forEach(
      (stage) => {
        expect(stage.dialogue?.length ?? 0).toBeGreaterThanOrEqual(1);
      },
    );
  });

  it('gives every stage that narrates a fall something to say', () => {
    RELATIONSHIP_STAGES.filter(
      (stage) => (stage.fallLines?.length ?? 0) > 0,
    ).forEach((stage) => {
      expect(stage.fallDialogue?.length ?? 0).toBeGreaterThanOrEqual(1);
    });
  });

  it('covers the whole ladder in both directions', () => {
    const rising = RELATIONSHIP_STAGES.filter((s) => s.lines.length > 0);
    const falling = RELATIONSHIP_STAGES.filter(
      (s) => (s.fallLines?.length ?? 0) > 0,
    );
    expect(rising.length).toBeGreaterThanOrEqual(6);
    expect(falling.length).toBeGreaterThanOrEqual(6);
  });

  it('never puts a template slot in a spoken line', () => {
    RELATIONSHIP_STAGES.forEach((stage) => {
      [...(stage.dialogue ?? []), ...(stage.fallDialogue ?? [])].forEach(
        (line) => {
          expect(line).not.toContain('{생존자}');
          expect(line).not.toContain('{상대}');
        },
      );
    });
  });
});
