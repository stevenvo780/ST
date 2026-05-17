// ============================================================
// CSP Hoare — Comunicating Sequential Processes (Hoare 1978/1985)
// ============================================================
// Cálculo de procesos basado en eventos atómicos sincronizados.
// A diferencia del π-cálculo (centrado en pasar nombres), CSP modela
// concurrencia mediante la ocurrencia coordinada de nombres de evento
// compartidos en el alfabeto del paralelo.
//
// Semánticas implementadas:
//   • Traces — qué secuencias de eventos visibles pueden ocurrir.
//   • Failures — pares (traza, refusal) que capturan no-determinismo.
//   • Refinement — P ⊑_T Q y P ⊑_F Q según las semánticas anteriores.
//
// Ejemplos canónicos: máquina expendedora, filósofos cenando.
// ============================================================

export type { Event, Process, Trace, FailurePair } from './types';
export { TICK } from './types';

export {
  STOP,
  SKIP,
  prefix,
  choice,
  internal,
  parallel,
  interleave,
  sequence,
  hide,
  rename,
  recursion,
  processVar,
  alphabet,
  nextEvents,
  step,
  internalResolutions,
} from './semantics';

export {
  traces,
  failures,
  isDeadlocked,
  isLiveLocked,
  refinesTraces,
  refinesFailures,
} from './analysis';

export { vendingMachine, vendingMachineLoop, philosopher, diningPhilosophers } from './examples';
