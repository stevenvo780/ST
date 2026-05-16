// ============================================================
// ST Streaming — Tipos públicos del API de evaluación incremental
// ============================================================

import type { RunResult } from '../../types';

/** Resultado de evaluación expuesto por el streaming API. Alias de RunResult. */
export type EvalResult = RunResult;

/**
 * Evento emitido por streamEval().
 *
 * Orden garantizado:
 *   start → (subproof | progress | partial)* → done | error
 */
export type StreamEvent =
  | { kind: 'start'; formula: string }
  | { kind: 'subproof'; node: string; result: 'T' | 'F' | 'both' | 'neither' | 'unknown' }
  | { kind: 'progress'; ratio: number }
  | { kind: 'partial'; result: EvalResult }
  | { kind: 'done'; result: EvalResult; totalMs: number }
  | { kind: 'error'; error: string };

/** Nombres válidos de perfil lógico (string abierto para extensibilidad). */
export type ProfileName = string;
