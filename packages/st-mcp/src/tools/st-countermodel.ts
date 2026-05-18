import { evaluate, type STEvalResult } from '@stevenvo780/st-lang/api';
import type { CountermodelInputT } from '../schemas.js';

export interface CountermodelResult {
  ok: boolean;
  profile: string;
  formula: string;
  status: string | null;
  /** true si st-lang encontró un contramodelo (status === 'invalid'). */
  found: boolean | null;
  /** Modelo / valuación que falsifica la fórmula, si está disponible. */
  model: unknown | null;
  summary: string;
  educationalNote?: string;
  diagnostics: STEvalResult['diagnostics'];
  stdout: string;
  stderr: string;
}

/**
 * Construye un programa ST con el comando `countermodel <formula>` que
 * pide a st-lang buscar una valuación que falsifique la fórmula.
 * Si la fórmula es válida, status será 'valid' / 'tautology' y `found=false`.
 */
export function runCountermodel(input: CountermodelInputT): CountermodelResult {
  const { formula, profile } = input;
  const source = `logic ${profile}\ncountermodel ${formula}`;
  const r = evaluate(source, '<st-mcp:countermodel>');
  const first = r.results[0];
  const status = first?.status ?? null;
  // En st-lang el comando `countermodel` devuelve status='invalid' cuando
  // logró encontrar uno (la fórmula NO es tautología), y status='valid'
  // cuando no existe contramodelo posible (la fórmula sí es tautología).
  const found = status === null ? null : status === 'invalid';
  const model =
    (first as unknown as { model?: unknown } | undefined)?.model ?? null;
  const summary =
    first?.output ??
    (r.ok ? `Búsqueda de contramodelo completada en ${profile}` : 'Error buscando contramodelo');
  return {
    ok: r.ok,
    profile,
    formula,
    status,
    found,
    model,
    summary,
    educationalNote: first?.educationalNote,
    diagnostics: r.diagnostics,
    stdout: r.stdout,
    stderr: r.stderr,
  };
}
