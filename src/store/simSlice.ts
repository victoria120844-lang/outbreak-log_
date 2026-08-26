import type { StateCreator } from 'zustand';
import {
  advanceDay,
  applyChoice,
  createRunSeed,
  type WorldState,
} from '@/features/simulation';
import type { SimPhase, SimState } from '@/types';
import { MAX_LOG_ENTRIES } from './logSlice';
import { loadSim } from './persistence';
import type { StoreState } from './types';

export const DEFAULT_TICK_MS = 2500;

export const createInitialSim = (): SimState => ({
  day: 0,
  phase: 'setup',
  tickMs: DEFAULT_TICK_MS,
  runSeed: createRunSeed(),
  deprivation: {},
  pendingChoice: null,
  // On by default: the complaint that started this was two-timing, not the
  // absence of it. Turning it off puts the old free-for-all back.
  pureLove: true,
  recentEvents: [],
  recentChoices: [],
});

export interface SimSlice {
  sim: SimState;
  setPhase: (phase: SimPhase) => void;
  setPureLove: (pureLove: boolean) => void;
  /** Answers the decision the run stopped on. */
  chooseOption: (optionId: string) => void;
  /** Runs one engine day and folds the result back into every slice. */
  advanceOneDay: () => void;
  resetSim: () => void;
}

export const createSimSlice: StateCreator<StoreState, [], [], SimSlice> = (
  set,
  get,
) => ({
  sim: loadSim() ?? createInitialSim(),

  setPhase: (phase) => set((state) => ({ sim: { ...state.sim, phase } })),

  setPureLove: (pureLove) =>
    set((state) => ({ sim: { ...state.sim, pureLove } })),

  chooseOption: (optionId) => {
    const state = get();
    const pending = state.sim.pendingChoice;
    if (pending === null) return;

    const result = applyChoice(
      {
        day: state.sim.day,
        runSeed: state.sim.runSeed,
        status: 'running',
        survivors: state.survivors,
        relationships: state.relationships,
        inventory: state.inventory,
        deprivation: state.sim.deprivation,
        pendingChoice: pending,
        pureLove: state.sim.pureLove,
        recentEvents: state.sim.recentEvents,
        recentChoices: state.sim.recentChoices,
      },
      optionId,
    );

    set({
      survivors: result.state.survivors,
      relationships: result.state.relationships,
      inventory: result.state.inventory,
      log: [...state.log, ...result.entries].slice(-MAX_LOG_ENTRIES),
      sim: {
        ...state.sim,
        deprivation: result.state.deprivation,
        recentChoices: result.state.recentChoices,
        // Not forced to null: answering one turning can surface another, and
        // the engine is what decides whether the run is free to move on.
        pendingChoice: result.state.pendingChoice,
        phase: result.state.status === 'ended' ? 'ended' : state.sim.phase,
      },
    });
  },

  advanceOneDay: () => {
    const state = get();
    if (state.sim.phase === 'ended') return;
    // The run waits on the player, not the clock.
    if (state.sim.pendingChoice !== null) return;
    if (!state.survivors.some((survivor) => survivor.alive)) return;

    // The engine is pure, so store arrays can be handed to it directly.
    const world: WorldState = {
      day: state.sim.day,
      runSeed: state.sim.runSeed,
      status: 'running',
      survivors: state.survivors,
      relationships: state.relationships,
      inventory: state.inventory,
      deprivation: state.sim.deprivation,
      pendingChoice: null,
      pureLove: state.sim.pureLove,
      recentEvents: state.sim.recentEvents,
      recentChoices: state.sim.recentChoices,
    };

    const result = advanceDay(world);
    const hasEnded = result.state.status === 'ended';

    set({
      survivors: result.state.survivors,
      relationships: result.state.relationships,
      inventory: result.state.inventory,
      log: [...state.log, ...result.entries].slice(-MAX_LOG_ENTRIES),
      sim: {
        ...state.sim,
        day: result.state.day,
        deprivation: result.state.deprivation,
        recentEvents: result.state.recentEvents,
        recentChoices: result.state.recentChoices,
        pendingChoice: result.state.pendingChoice,
        phase: hasEnded
          ? 'ended'
          : state.sim.phase === 'running'
            ? 'running'
            : 'paused',
      },
    });
  },

  // 순애 모드 is a play-style preference, not part of a run, so a full reset
  // keeps it — the same reasoning that keeps dev mode out of the save.
  resetSim: () =>
    set((state) => ({
      sim: { ...createInitialSim(), pureLove: state.sim.pureLove },
    })),
});
