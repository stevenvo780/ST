// ============================================================
// ST Streaming — streamEval(): evaluación incremental con AsyncIterable
// ============================================================

import type { Formula } from '../../types';
import { registry } from '../../logic/profiles/interface';
import { formulaToString } from '../../logic/profiles/classical/propositional';
import '../../logic/profiles'; // registra perfiles built-in
import type { StreamEvent, EvalResult, ProfileName } from './types';

// ── Opciones ──────────────────────────────────────────────────

export interface StreamEvalOptions {
  abortSignal?: AbortSignal;
}

// ── Helpers internos ──────────────────────────────────────────

/** Yield un tick de event-loop para que el iterable sea genuinamente async. */
function tick(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

/**
 * Mapea el status de RunResult a las categorías de subproof.
 */
function statusToSubproofResult(status: string): 'T' | 'F' | 'both' | 'neither' | 'unknown' {
  switch (status) {
    case 'valid':
    case 'provable':
    case 'satisfiable':
      return 'T';
    case 'invalid':
    case 'refutable':
    case 'unsatisfiable':
      return 'F';
    case 'error':
      return 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * Extrae sub-nodos significativos de la fórmula para generar eventos subproof.
 * Devuelve hasta maxNodes sub-fórmulas con su representación string.
 */
function extractSubnodes(formula: Formula, maxNodes = 8): Formula[] {
  const result: Formula[] = [];

  function walk(f: Formula, depth: number): void {
    if (result.length >= maxNodes) return;
    if (depth > 0 && f.kind !== 'atom') {
      result.push(f);
    }
    for (const arg of f.args ?? []) {
      walk(arg, depth + 1);
    }
  }

  walk(formula, 0);
  return result;
}

// ── API principal ─────────────────────────────────────────────

/**
 * Evalúa una fórmula AST bajo el perfil dado y emite eventos progresivos.
 *
 * Orden garantizado de eventos:
 *   `start` → (`subproof` | `progress`)* → `partial` → `done` | `error`
 *
 * Soporta cancelación vía `AbortSignal`. Cuando se cancela:
 *   - Se emite un evento `error` con mensaje de cancelación.
 *   - El iterable termina inmediatamente.
 *
 * Errores en la evaluación producen un evento `error` (no throw).
 *
 * @example
 * ```ts
 * const formula: Formula = { kind: 'implies', args: [
 *   { kind: 'atom', name: 'P' },
 *   { kind: 'atom', name: 'P' },
 * ]};
 * for await (const event of streamEval(formula, 'classical.propositional')) {
 *   console.log(event);
 * }
 * ```
 */
export async function* streamEval(
  formula: Formula,
  profile: ProfileName,
  opts?: StreamEvalOptions,
): AsyncIterable<StreamEvent> {
  const signal = opts?.abortSignal;
  const startTime = Date.now();

  const checkAborted = (): boolean => signal?.aborted ?? false;

  const formulaStr = formulaToString(formula);

  // ── start ────────────────────────────────────────────────────
  yield { kind: 'start', formula: formulaStr } satisfies StreamEvent;
  await tick();

  if (checkAborted()) {
    yield { kind: 'error', error: 'Evaluación cancelada (AbortSignal)' } satisfies StreamEvent;
    return;
  }

  // ── Resolver perfil ─────────────────────────────────────────
  const logicProfile = registry.get(profile);
  if (!logicProfile) {
    yield {
      kind: 'error',
      error: `Perfil lógico desconocido: "${profile}"`,
    } satisfies StreamEvent;
    return;
  }

  // ── Sub-nodos para eventos subproof ──────────────────────────
  const subnodes = extractSubnodes(formula);
  const total = subnodes.length;

  for (let i = 0; i < subnodes.length; i++) {
    if (checkAborted()) {
      yield { kind: 'error', error: 'Evaluación cancelada (AbortSignal)' } satisfies StreamEvent;
      return;
    }

    const sub = subnodes[i];
    if (!sub) continue;

    let subResult: EvalResult;
    try {
      subResult = logicProfile.checkValid(sub);
    } catch {
      subResult = { status: 'unknown', diagnostics: [], formula: sub };
    }

    const subStr = formulaToString(sub);
    yield {
      kind: 'subproof',
      node: subStr,
      result: statusToSubproofResult(subResult.status),
    } satisfies StreamEvent;

    await tick();

    const ratio = (i + 1) / (total + 1);
    yield { kind: 'progress', ratio } satisfies StreamEvent;
    await tick();
  }

  if (checkAborted()) {
    yield { kind: 'error', error: 'Evaluación cancelada (AbortSignal)' } satisfies StreamEvent;
    return;
  }

  // ── Progreso: 90% — a punto de evaluar ──────────────────────
  yield { kind: 'progress', ratio: 0.9 } satisfies StreamEvent;
  await tick();

  // ── Evaluación principal ─────────────────────────────────────
  let finalResult: EvalResult;
  try {
    finalResult = logicProfile.checkValid(formula);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { kind: 'error', error: message } satisfies StreamEvent;
    return;
  }

  if (checkAborted()) {
    yield { kind: 'error', error: 'Evaluación cancelada (AbortSignal)' } satisfies StreamEvent;
    return;
  }

  // ── partial result ───────────────────────────────────────────
  yield { kind: 'partial', result: finalResult } satisfies StreamEvent;
  await tick();

  // ── done ─────────────────────────────────────────────────────
  const totalMs = Date.now() - startTime;
  yield { kind: 'done', result: finalResult, totalMs } satisfies StreamEvent;
}
