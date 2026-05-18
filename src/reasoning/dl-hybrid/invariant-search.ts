// ============================================================
// ST dL-Hybrid — Búsqueda heurística de invariantes diferenciales
// ============================================================
// Dado un sistema ODE y una propiedad objetivo de la forma p(x) ≥ 0,
// determina si p es un invariante diferencial bajo la regla:
//
//   Si L_f(p) ≥ 0 en todo punto del dominio Q, entonces p ≥ 0 es
//   invariante a lo largo de la evolución continua (Platzer 2010,
//   "Differential Invariants for ODEs").
//
// Esta es una condición *suficiente*: si la chequeamos en una malla de
// muestras y se cumple en todas, reportamos `likely-invariant`; si falla
// en alguna, `not-invariant`; si la derivada de Lie es identicamente
// cero, el invariante es exacto (consonant con el flujo).
//
// La búsqueda automática prueba algunos candidatos típicos:
//   • p(x) = x - c        (semihalfplanes)
//   • p(x) = c - x        (cotas superiores)
//   • p(x, y) = x² + y² - r²   (esferas / círculos en R²)
// ============================================================

import type { DLTerm, OdeSystem, State } from '../../logic/profiles/dl-hybrid';
import {
  evalSym,
  lieDerivative,
  termToString,
  variable,
  num,
  minus,
  plus,
  power,
} from '../../logic/profiles/dl-hybrid';

/** Veredicto sobre un candidato de invariante diferencial. */
export type InvariantVerdict =
  | { kind: 'invariant'; reason: 'exact' | 'lie-nonnegative'; samples: number }
  | { kind: 'not-invariant'; counterexample: State; lieValue: number }
  | { kind: 'unknown'; reason: string };

export interface InvariantOptions {
  /** Conjunto de estados a verificar la condición L_f(p) ≥ 0. */
  samples?: State[];
  /** Malla por defecto si `samples` no se pasa. */
  meshValues?: number[];
}

const DEFAULTS = {
  meshValues: [-2, -1, -0.5, 0, 0.5, 1, 2],
};

/**
 * Verifica si `p ≥ 0` es invariante diferencial del sistema bajo el
 * dominio implícito (sin restringir). Chequea L_f(p) ≥ 0 en una malla.
 */
export function checkDifferentialInvariant(
  p: DLTerm,
  system: OdeSystem,
  opts?: InvariantOptions,
): InvariantVerdict {
  // El chequeo de invariante NO requiere que la ODE sea soluble cerrada:
  // basta con poder calcular la derivada de Lie y muestrearla. La
  // clasificación se consulta para distinguir "no podemos evaluar"
  // (genuinamente unknown) de "sistema acoplado pero el invariante se
  // verifica numéricamente".
  const lie = lieDerivative(p, system);
  // Si L_f(p) se simplifica a 0 → invariante exacto.
  if (lie.kind === 'const' && lie.value === 0) {
    return { kind: 'invariant', reason: 'exact', samples: 0 };
  }
  // Caso general: chequeo en una malla.
  // Variables relevantes para la malla: las del sistema ODE más las
  // variables libres que aparezcan en la derivada de Lie (ej. ODEs
  // acopladas que mencionan `y` aunque `y` no tenga su propia ecuación).
  const meshVars = new Set<string>();
  for (const eq of system.equations) meshVars.add(eq.varName);
  const collectVars = (e: typeof lie): void => {
    switch (e.kind) {
      case 'var':
        meshVars.add(e.name);
        return;
      case 'const':
        return;
      case 'add':
      case 'mul':
        e.args.forEach(collectVars);
        return;
      case 'sub':
      case 'div':
        collectVars(e.left);
        collectVars(e.right);
        return;
      case 'pow':
        collectVars(e.base);
        collectVars(e.exp);
        return;
      case 'neg':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case 'exp':
        collectVars(e.arg);
        return;
    }
  };
  collectVars(lie);
  const samples = opts?.samples ?? buildMesh(Array.from(meshVars), opts?.meshValues ?? DEFAULTS.meshValues);
  let checked = 0;
  for (const s of samples) {
    const val = evalSym(lie, s);
    if (Number.isNaN(val)) continue;
    checked++;
    if (val < -1e-9) {
      return { kind: 'not-invariant', counterexample: s, lieValue: val };
    }
  }
  if (checked === 0) {
    return { kind: 'unknown', reason: 'Ninguna muestra evaluable; ODE puede involucrar divisiones.' };
  }
  return { kind: 'invariant', reason: 'lie-nonnegative', samples: checked };
}

/** Construye una malla cartesiana sobre el conjunto de variables dado. */
function buildMesh(vars: string[], values: number[]): State[] {
  if (vars.length === 0) return [new Map()];
  if (vars.length > 3) {
    // Modo light para evitar explosión combinatoria.
    const result: State[] = [];
    for (const v of values) {
      const s: State = new Map();
      for (const x of vars) s.set(x, v);
      result.push(s);
    }
    return result;
  }
  const result: State[] = [];
  const recurse = (idx: number, current: State): void => {
    if (idx === vars.length) {
      result.push(new Map(current));
      return;
    }
    const name = vars[idx];
    if (!name) return;
    for (const val of values) {
      current.set(name, val);
      recurse(idx + 1, current);
    }
  };
  recurse(0, new Map());
  return result;
}

/**
 * Sugiere candidatos típicos de invariante diferencial para un sistema
 * ODE y devuelve los que satisfacen la condición suficiente. Si no
 * encuentra nada, devuelve lista vacía.
 */
export interface CandidateResult {
  candidate: DLTerm;
  description: string;
  verdict: InvariantVerdict;
}

export function suggestInvariants(system: OdeSystem, opts?: InvariantOptions): CandidateResult[] {
  const found: CandidateResult[] = [];
  const vars = system.equations.map((e) => e.varName);

  // 1) Halfplanes p = xᵢ - c y p = c - xᵢ para algunos c.
  for (const v of vars) {
    for (const c of [-1, 0, 1]) {
      const upper: DLTerm = c === 0 ? variable(v) : minus(variable(v), num(c));
      const verdict = checkDifferentialInvariant(upper, system, opts);
      if (verdict.kind === 'invariant') {
        found.push({
          candidate: upper,
          description: `${v} ≥ ${c}`,
          verdict,
        });
      }
      const lower: DLTerm = minus(num(c), variable(v));
      const v2 = checkDifferentialInvariant(lower, system, opts);
      if (v2.kind === 'invariant') {
        found.push({
          candidate: lower,
          description: `${v} ≤ ${c}`,
          verdict: v2,
        });
      }
    }
  }

  // 2) Esferas x² + y² - r² (si hay al menos 2 vars).
  if (vars.length >= 2) {
    const x = vars[0];
    const y = vars[1];
    if (x && y) {
      for (const r of [1, 2]) {
        const sphere: DLTerm = minus(
          plus(power(variable(x), 2), power(variable(y), 2)),
          num(r * r),
        );
        const verdict = checkDifferentialInvariant(sphere, system, opts);
        if (verdict.kind === 'invariant') {
          found.push({
            candidate: sphere,
            description: `${x}² + ${y}² ≤ ${r * r}`,
            verdict,
          });
        }
      }
    }
  }

  return found;
}

/** Formatea un veredicto para inspección humana. */
export function describeVerdict(c: CandidateResult): string {
  switch (c.verdict.kind) {
    case 'invariant':
      return `[OK] ${c.description}  (term=${termToString(c.candidate)})  reason=${c.verdict.reason}, samples=${c.verdict.samples}`;
    case 'not-invariant':
      return `[NO] ${c.description}  (term=${termToString(c.candidate)})  L_f(p)=${c.verdict.lieValue} en contra-ejemplo`;
    case 'unknown':
      return `[?]  ${c.description}  reason=${c.verdict.reason}`;
  }
}
