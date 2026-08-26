export {
  advanceDay,
  applyChoice,
  runDays,

  takeFirstOption,
  type ChoiceResolver,
  type AdvanceResult,
} from './world';
export {
  createWorld,
  type WorldState,
  type CreateWorldInput,
  type Deprivation,
} from './state';
export { buildProfile, traitStatDeltas, type ActionProfile } from './profile';
export { runPregnancy } from './birth';
export { childrenOf, runChildcare } from './childcare';
export {
  labelRomances,
  runBreakups,
  runExLovers,
  runRomanceGuard,
} from './romance';
export {
  mulberry32,
  createDayRng,
  createRunSeed,
  randomInt,
  pickWeighted,
  type Rng,
} from './rng';
export { applyTemplate, chooseParticle } from './text';
export {
  maybeDrawChoice,
  resolveChoice,
  CHOICE_ODDS,
  TURNED_TEMPLATE_ID,
} from './choices';
export {
  containedSurvivors,
  layToRest,
  runContained,
  turnSurvivor,
  turnedSurvivors,
  unresolvedTurn,
} from './turning';
export { formatDay } from './formatDay';
export {
  INFECTION_FATAL,
  INFECTION_MAX_GAIN,
  INFECTION_MIN_GAIN,
  trustToward,
} from './infection';
export {
  BASE_HUNGER_GAIN,
  BASE_STAMINA_LOSS,
  STARVATION_GRACE_DAYS,
  STARVATION_HP_LOSS,
} from './upkeep';
