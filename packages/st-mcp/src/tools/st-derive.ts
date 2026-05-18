import { evaluate, type STEvalResult } from '@stevenvo780/st-lang/api';
import type { DeriveInputT } from '../schemas.js';

export interface DeriveResult {
  ok: boolean;
  profile: string;
  axioms: string[];
  conclusion: string;
  status: string | null;
  derivable: boolean | null;
  summary: string;
  educationalNote?: string;
  diagnostics: STEvalResult['diagnostics'];
  stdout: string;
  stderr: string;
}

/**
 * Construye un programa ST con axiomas nombrados a1..aN y emite un
 * comando `derive`. Devuelve `derivable=true` solo si st-lang reporta
 * status 'provable' / 'valid' para la derivación.
 */
export function runDerive(input: DeriveInputT): DeriveResult {
  const { axioms, conclusion, profile } = input;
  const axiomLines = axioms.map((ax, i) => `axiom a${i + 1} : ${ax}`);
  const names = axioms.map((_, i) => `a${i + 1}`);
  const source = [
    `logic ${profile}`,
    ...axiomLines,
    `derive ${conclusion} from ${names.join(', ')}`,
  ].join('\n');
  const r = evaluate(source, '<st-mcp:derive>');
  // El último result es el del comando `derive` (los axiomas no producen
  // result lógico por sí mismos, solo eco). Tomamos el último por
  // robustez ante perfiles que sí lo agreguen.
  const last = r.results[r.results.length - 1];
  const status = last?.status ?? null;
  const derivable =
    status === null ? null : status === 'provable' || status === 'valid';
  const summary =
    last?.output ??
    (r.ok ? `Derivación procesada en ${profile}` : 'Error procesando la derivación');
  return {
    ok: r.ok,
    profile,
    axioms,
    conclusion,
    status,
    derivable,
    summary,
    educationalNote: last?.educationalNote,
    diagnostics: r.diagnostics,
    stdout: r.stdout,
    stderr: r.stderr,
  };
}
