/**
 * Shared domain types for OUTBREAK LOG.
 * UI copy is Korean; every identifier here stays English.
 */

/* ---------------------------------------------------------------- survivors */

export type MbtiType =
  | 'ISTJ'
  | 'ISFJ'
  | 'INFJ'
  | 'INTJ'
  | 'ISTP'
  | 'ISFP'
  | 'INFP'
  | 'INTP'
  | 'ESTP'
  | 'ESFP'
  | 'ENFP'
  | 'ENTP'
  | 'ESTJ'
  | 'ESFJ'
  | 'ENFJ'
  | 'ENTJ';

/** The four MBTI axes, in the order they compose into a type string. */
export type MbtiAxis = 'ei' | 'ns' | 'tf' | 'jp';

export type MbtiAxisState = {
  ei: 'E' | 'I' | null;
  ns: 'N' | 'S' | null;
  tf: 'T' | 'F' | null;
  jp: 'J' | 'P' | null;
};

export type TraitId =
  | 'coolHeaded'
  | 'hotBlooded'
  | 'altruistic'
  | 'selfish'
  | 'optimistic'
  | 'pessimistic'
  | 'timid'
  | 'reckless'
  | 'cautious'
  | 'impulsive'
  | 'leadership'
  | 'handy'
  | 'suspicious'
  | 'humorous'
  | 'cleanFreak'
  | 'gluttonous'
  | 'insomniac'
  | 'strongBody'
  | 'marksman'
  | 'medicalKnowledge'
  | 'liar';

export type StatKey = 'hp' | 'stamina' | 'hunger' | 'morale' | 'infection';

/** Categories the simulation draws events from. Section 6 consumes these. */
export type EventTag =
  | 'combat'
  | 'scavenge'
  | 'conflict'
  | 'cooperation'
  | 'infection'
  | 'medical'
  | 'morale'
  | 'accident';

/** Behaviors a trait unlocks that are not expressible as a draw weight. */
export interface TraitBehavior {
  /** Multiplier on surviving a flight from combat. */
  fleeSurvival?: number;
  /** Multiplier on giving up medicine or a life for someone else. */
  sacrifice?: number;
  /** Multiplier on sharing medicine before using it. */
  shareMedicine?: number;
  /** Extra days an infection can be concealed from the group. */
  hideInfectionDays?: number;
}

export interface TraitModifiers {
  /** Flat stat deltas applied during the daily tick. */
  stats?: Partial<Record<StatKey, number>>;
  /** Multipliers on event draw weight; 1 is neutral. */
  eventWeights?: Partial<Record<EventTag, number>>;
  behavior?: TraitBehavior;
}

export interface Trait {
  id: TraitId;
  /** Korean display name shown on chips. */
  label: string;
  /** Korean one-line flavor shown under the chip grid. */
  flavor: string;
  modifiers: TraitModifiers;
}

/** Every stat is an integer 0-100. */
export type SurvivorStats = Record<StatKey, number>;

/**
 * Fixed at registration and never changed by the day. Distinct from the
 * condition bars: these say what someone is capable of, not how they are doing.
 */
export type AbilityKey =
  | 'intellect'
  | 'endurance'
  | 'agility'
  | 'strength'
  | 'luck';

export type SurvivorAbilities = Record<AbilityKey, number>;

export type JobCategory =
  | '경영·사무·근무직'
  | '연구·공학 기술직'
  | '교육·법률·사회복지직'
  | '보건·의료직'
  | '예술·디자인·방송직'
  | '설치·정비·생산직'
  | '치안·군사직';

/** Ids stay English; only the labels are Korean. */
export type JobId = string;

export interface Job {
  id: JobId;
  category: JobCategory;
  /** Korean display name. */
  label: string;
  /** Korean one-line flavor, in the same voice as the traits. */
  flavor: string;
  /** Same shape as a trait's, so the profile applies both the same way. */
  modifiers: TraitModifiers;
  /** Added to the ability scores the player set, then clamped to 1-10. */
  abilityBonus?: Partial<SurvivorAbilities>;
}

export type Gender = '남성' | '여성' | '비공개';

/**
 * 좀비 is not 사망. Someone who turns is off the roster and out of the day, but
 * still in the building — what happens to them is a decision the rest of the
 * group has to make, and until they make it the person is neither.
 */
export type SurvivorStatus = '생존' | '부상' | '감염' | '좀비' | '사망';

export interface Survivor {
  id: string;
  /** Korean display name, 1-8 characters, unique across the group. */
  name: string;
  gender: Gender;
  /** Years. Decides what other survivors call this person. */
  age: number;
  job: JobId;
  mbti: MbtiType;
  /** Exactly three trait ids. */
  traits: TraitId[];
  stats: SurvivorStats;
  abilities: SurvivorAbilities;
  status: SurvivorStatus;
  /** Sim day the survivor was registered. */
  joinedDay: number;
  /** Mirrors `status !== '사망'`; kept on the record for cheap filtering. */
  alive: boolean;
  /** Sim day of death. Absent while the survivor lives. */
  diedDay?: number;
  /** Sim day the infection took them. Set when `status` becomes 좀비. */
  turnedDay?: number;
  /** A turned survivor the group chose to lock up rather than deal with. */
  contained?: boolean;
  /** Sim day this survivor conceived. Absent unless currently carrying. */
  pregnantSince?: number;
  /** The other parent. */
  pregnantBy?: string;
  /**
    * Sim day the last pregnancy ended, however it ended. Both a birth and a
    * loss start the same cooldown — without that, losing one and conceiving
    * again on the very same evening was reachable.
    */
  pregnancyEndedDay?: number;
  /**
   * Who this survivor was born to. Present only on someone the run produced,
   * and the reason a parent says 아들 or 딸 where anybody else says the name.
   */
  parentIds?: string[];
}

/* ------------------------------------------------------------ relationships */

export type RelationshipKind =
  | '가족'
  | '연인'
  | '친구'
  | '동료'
  | '라이벌'
  | '원한'
  | '은인'
  | '초면';

/**
 * Directional: how `fromId` feels about `toId`. The reverse feeling is a
 * separate record, so a pair is two rows that the UI edits as one.
 */
export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  kind: RelationshipKind;
  /** -100 (would kill them) to +100 (would die for them), step 5. */
  trust: number;
  /**
   * Highest and lowest trust this pair has ever reached. The log announces new
   * ground only: without these, a pair sitting on a threshold re-announced its
   * own wedding every time a bad day knocked it down and a good day put it
   * back. Absent on a pair that has not been simulated yet.
   */
  peakTrust?: number;
  floorTrust?: number;
  note?: string;
}

/* ---------------------------------------------------------------- inventory */

export type ItemCategory = '식량' | '의료' | '무기' | '도구' | '특수';

/**
 * The numeric payload Section 6 consumes. Nothing here is applied while items
 * only sit on a shelf.
 */
export interface ItemEffect {
  /** Stat deltas applied when a unit is consumed. */
  stats?: Partial<Record<StatKey, number>>;
  /** Person-days of food one unit covers. */
  foodDays?: number;
  /** Person-days of drinking water one unit covers. */
  waterDays?: number;
  /** Added combat weight while assigned to a survivor. */
  combat?: number;
  /** Added scavenging weight for the group. */
  scavenge?: number;
  /** Strength against infection, 0-100. */
  infectionCure?: number;
  /** Spent alongside another item rather than on its own. */
  supports?: 'ammo' | 'power';
}

export interface Item {
  id: string;
  /** Korean display name. */
  name: string;
  category: ItemCategory;
  /** Kilograms per unit. */
  weight: number;
  /** Korean one-line summary of what a unit does. */
  effect: string;
  /** Korean flavor text. This carries the tone of the world. */
  flavor: string;
  /** Draw weight for random supply rolls; higher is more common. */
  rarity: number;
  payload: ItemEffect;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  /** Survivor id, or absent for the shared pool (공용). */
  assignedTo?: string;
}

/* -------------------------------------------------------------------- log */

export type LogSeverity = 'routine' | 'notable' | 'critical' | 'death';

/**
 * One stat moving, as reported in the log. Playtesting kept asking why hp had
 * fallen; the answer was always in the entry above it, but never in numbers.
 */
export interface StatChange {
  survivorId: string;
  key: StatKey;
  /** Signed, and already clamped — damage past 0 is not reported. */
  delta: number;
}

export interface LogEntry {
  id: string;
  day: number;
  severity: LogSeverity;
  /** Korean sentence rendered in the survival log. */
  message: string;
  /** Survivors involved, for highlighting. */
  actorIds: string[];
  /** What this entry cost, shown under the sentence. */
  changes?: StatChange[];
  /** Set when the line is spoken aloud. Rendered as dialogue, not narration. */
  speakerId?: string;
  /** Set when the line is something said about someone who died. */
  memorialFor?: string;
}

/* ------------------------------------------------------------------- events */

export type EventCategory =
  | '탐색'
  | '전투'
  | '감염'
  | '내부갈등'
  | '보급'
  | '외부생존자'
  | '환경'
  | '정적';

export interface EventRequirements {
  /** Living survivors needed for the template to be eligible. */
  minSurvivors?: number;
  requiredTrait?: TraitId;
  /** Item id that must be held in quantity. */
  requiredItem?: string;
  /** Needs a pair whose trust is at or below this. */
  maxTrust?: number;
  /** Needs a pair whose trust is at or above this. */
  minTrust?: number;
  /** The actor must already be carrying an infection. */
  infected?: boolean;
}

export interface EventEffects {
  actor?: Partial<Record<StatKey, number>>;
  target?: Partial<Record<StatKey, number>>;
  /** Applied to every living survivor. */
  everyone?: Partial<Record<StatKey, number>>;
  /** Mutual trust delta between actor and target. */
  trust?: number;
  /** Item stacks gained (positive) or lost (negative). */
  items?: ReadonlyArray<{ itemId: string; quantity: number }>;
  /** Grants one random item from a category. */
  loot?: ItemCategory;
  /** Infection added to the actor. */
  infect?: number;
}

export interface EventTemplate {
  id: string;
  category: EventCategory;
  /** Relative draw weight before profile weighting. */
  weight: number;
  severity: LogSeverity;
  /** How many survivors the text names: 1 or 2. */
  cast: 1 | 2;
  /** Korean text with `{생존자}`, `{상대}`, `{아이템}` slots. */
  text: string;
  /** Optional spoken follow-up. One is picked, and not every time. */
  dialogue?: readonly string[];
  requirements?: EventRequirements;
  effects?: EventEffects;
}

/* ---------------------------------------------------------------------- sim */

/* ------------------------------------------------------------------ choices */

export interface ChoiceOutcome {
  /** Korean line written to the log. Empty means the option cannot fail. */
  text: string;
  actor?: Partial<Record<StatKey, number>>;
  target?: Partial<Record<StatKey, number>>;
  everyone?: Partial<Record<StatKey, number>>;
  items?: ReadonlyArray<{ itemId: string; quantity: number }>;
  trust?: number;
  infect?: number;
}

export interface ChoiceOption {
  id: string;
  /** Korean button label; may carry `{생존자}` / `{상대}` slots. */
  label: string;
  /** null means the option always resolves as written. */
  ability: AbilityKey | null;
  /** Ability score that gives even odds. */
  difficulty: number;
  success: ChoiceOutcome;
  failure: ChoiceOutcome;
}

export interface ChoiceTemplate {
  id: string;
  /** Korean setup line, shown above the options. */
  prompt: string;
  options: readonly ChoiceOption[];
}

/** A drawn choice waiting on the player. The run cannot advance until resolved. */
export interface PendingChoice {
  templateId: string;
  day: number;
  actorId: string;
  targetId: string | null;
  /** Resolved prompt with the names already filled in. */
  prompt: string;
  options: ReadonlyArray<{
    id: string;
    label: string;
    /** 0-1, shown so the pick is informed rather than blind. */
    chance: number;
    abilityLabel: string | null;
  }>;
}

export type SimPhase = 'setup' | 'running' | 'paused' | 'ended';

export interface SimState {
  day: number;
  phase: SimPhase;
  /** Milliseconds per simulated day while auto-running. */
  tickMs: number;
  /** Deterministic RNG seed. This is what gets shared. */
  runSeed: number;
  /** Consecutive days each survivor went without food or water. */
  deprivation: Record<string, { food: number; water: number }>;
  /** Set when the day stopped on a decision. Blocks further days. */
  pendingChoice: PendingChoice | null;
  /** 순애 모드: nobody carries two romances at once. */
  pureLove: boolean;
  /** Event template ids drawn recently, so the draw can avoid repeating them. */
  recentEvents: string[];
  /** Decision template ids drawn recently, for the same reason. */
  recentChoices: string[];
}
