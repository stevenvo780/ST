import { evaluate, type STEvalResult } from '@stevenvo780/st-lang/api';
import type { CheckInputT } from '../schemas.js';

export interface CheckResult {
  ok: boolean;
  profile: string;
  formula: string;
  status: string | null;
  valid: boolean | null;
  summary: string;
  educationalNote?: string;
  diagnostics: STEvalResult['diagnostics'];
  stdout: string;
  stderr: string;
}

/**
 * Construye un programa ST mínimo del estilo:
 *   logic <profile>
 *   check valid <formula>
 * y delega la evaluación al runtime de st-lang.
 */
export function runCheck(input: CheckInputT): CheckResult {
  const { formula, profile } = input;
  const source = `logic ${profile}\ncheck valid ${formula}`;
  const r = evaluate(source, '<st-mcp:check>');
  const first = r.results[0];
  const status = first?.status ?? null;
  // En st-lang los status que indican "fórmula válida" son 'valid' y
  // 'provable'; 'invalid' / 'refutable' / 'unsatisfiable' indican lo
  // contrario. Mapeamos lo principal y exponemos `status` crudo para que
  // el cliente conserve la riqueza original.
  const valid =
    status === null ? null : status === 'valid' || status === 'provable';
  const summary =
    first?.output ??
    (r.ok ? `Evaluación completada en ${profile}` : 'Error evaluando la fórmula');
  return {
    ok: r.ok,
    profile,
    formula,
    status,
    valid,
    summary,
    educationalNote: first?.educationalNote,
    diagnostics: r.diagnostics,
    stdout: r.stdout,
    stderr: r.stderr,
  };
}
