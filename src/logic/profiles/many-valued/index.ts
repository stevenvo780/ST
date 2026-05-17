// ============================================================
// ST Many-valued logics — Łukasiewicz, Gödel, Product
// ============================================================
// Tres lógicas borrosas / multivaluadas con valores en [0, 1].
// Cada sistema define sus propias conectivas, con un núcleo
// común: T-norm + T-conorm + implicación residuada + negación.
//
// Sistemas:
//   * lukasiewicz: t-norm = max(0, p+q-1), s-norm = min(1, p+q),
//                  imp = min(1, 1-p+q), neg = 1-p (involutiva).
//   * godel:       t-norm = min(p, q), s-norm = max(p, q),
//                  imp = 1 si p<=q, q en otro caso;
//                  neg(p) = 1 si p=0, 0 en otro caso.
//   * product:     t-norm = p*q, s-norm = p + q - p*q,
//                  imp = 1 si p<=q, q/p en otro caso;
//                  neg(p) = 1 si p=0, 0 en otro caso.
//
// Una tautología es una fórmula cuyo valor es 1 para toda
// asignación; aquí "toda asignación" se aproxima por sampling
// en una rejilla finita (resolution puntos por átomo).
// ============================================================

export type FuzzyOperator = 'lukasiewicz' | 'godel' | 'product';

export interface FuzzyFormula {
  kind: 'atom' | 'not' | 'and' | 'or' | 'implies';
  name?: string;
  arg?: FuzzyFormula;
  left?: FuzzyFormula;
  right?: FuzzyFormula;
}

// ── Helpers numéricos ───────────────────────────────────────

/** Recorta x al intervalo [0,1] absorbiendo error de coma flotante. */
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

// ── Conectivas por sistema ──────────────────────────────────

function tnorm(system: FuzzyOperator, p: number, q: number): number {
  switch (system) {
    case 'lukasiewicz':
      return clamp01(Math.max(0, p + q - 1));
    case 'godel':
      return Math.min(p, q);
    case 'product':
      return clamp01(p * q);
  }
}

function snorm(system: FuzzyOperator, p: number, q: number): number {
  switch (system) {
    case 'lukasiewicz':
      return clamp01(Math.min(1, p + q));
    case 'godel':
      return Math.max(p, q);
    case 'product':
      return clamp01(p + q - p * q);
  }
}

function implication(system: FuzzyOperator, p: number, q: number): number {
  switch (system) {
    case 'lukasiewicz':
      return clamp01(Math.min(1, 1 - p + q));
    case 'godel':
      return p <= q ? 1 : q;
    case 'product':
      if (p <= q) return 1;
      if (p === 0) return 1;
      return clamp01(q / p);
  }
}

function negation(system: FuzzyOperator, p: number): number {
  switch (system) {
    case 'lukasiewicz':
      return clamp01(1 - p);
    case 'godel':
    case 'product':
      return p === 0 ? 1 : 0;
  }
}

// ── Constructores de fórmulas ───────────────────────────────

export function atom(name: string): FuzzyFormula {
  return { kind: 'atom', name };
}

export function not(arg: FuzzyFormula): FuzzyFormula {
  return { kind: 'not', arg };
}

export function and(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula {
  return { kind: 'and', left, right };
}

export function or(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula {
  return { kind: 'or', left, right };
}

export function implies(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula {
  return { kind: 'implies', left, right };
}

// ── Atoms collection ────────────────────────────────────────

export function collectFuzzyAtoms(formula: FuzzyFormula): string[] {
  const set = new Set<string>();
  const visit = (f: FuzzyFormula): void => {
    switch (f.kind) {
      case 'atom':
        if (f.name) set.add(f.name);
        return;
      case 'not':
        if (f.arg) visit(f.arg);
        return;
      case 'and':
      case 'or':
      case 'implies':
        if (f.left) visit(f.left);
        if (f.right) visit(f.right);
        return;
    }
  };
  visit(formula);
  return Array.from(set).sort();
}

// ── Evaluación ──────────────────────────────────────────────

/**
 * Evalúa una fórmula borrosa bajo un environment que asigna
 * un valor en [0,1] a cada átomo (átomos sin asignar valen 0).
 */
export function evaluate(
  formula: FuzzyFormula,
  env: Record<string, number>,
  system: FuzzyOperator,
): number {
  switch (formula.kind) {
    case 'atom': {
      const v = formula.name ? env[formula.name] : undefined;
      return clamp01(v ?? 0);
    }
    case 'not':
      return negation(system, formula.arg ? evaluate(formula.arg, env, system) : 0);
    case 'and':
      return tnorm(
        system,
        formula.left ? evaluate(formula.left, env, system) : 0,
        formula.right ? evaluate(formula.right, env, system) : 0,
      );
    case 'or':
      return snorm(
        system,
        formula.left ? evaluate(formula.left, env, system) : 0,
        formula.right ? evaluate(formula.right, env, system) : 0,
      );
    case 'implies':
      return implication(
        system,
        formula.left ? evaluate(formula.left, env, system) : 0,
        formula.right ? evaluate(formula.right, env, system) : 0,
      );
  }
}

// ── Sampling sobre la rejilla [0,1]^n ───────────────────────

/** Genera la rejilla {0, 1/(r-1), ..., 1} de `resolution` puntos. */
function gridPoints(resolution: number): number[] {
  if (resolution < 2) return [0, 1];
  const out: number[] = [];
  for (let i = 0; i < resolution; i++) {
    out.push(i / (resolution - 1));
  }
  return out;
}

/**
 * Itera todas las combinaciones de la rejilla sobre los átomos,
 * llamando a `visit(env, value)` con cada valuación y el valor
 * de la fórmula. Si `visit` devuelve `false`, aborta.
 */
function forEachValuation(
  formula: FuzzyFormula,
  system: FuzzyOperator,
  resolution: number,
  visit: (env: Record<string, number>, value: number) => boolean | void,
): void {
  const atoms = collectFuzzyAtoms(formula);
  if (atoms.length === 0) {
    visit({}, evaluate(formula, {}, system));
    return;
  }
  const grid = gridPoints(resolution);
  const env: Record<string, number> = {};
  const total = Math.pow(grid.length, atoms.length);

  const indices = new Array<number>(atoms.length).fill(0);
  for (let n = 0; n < total; n++) {
    for (let i = 0; i < atoms.length; i++) {
      const key = atoms[i];
      const gi = indices[i];
      env[key] = grid[gi];
    }
    const value = evaluate(formula, env, system);
    const res = visit({ ...env }, value);
    if (res === false) return;
    // increment indices (base = grid.length)
    for (let i = atoms.length - 1; i >= 0; i--) {
      const idx = indices[i] + 1;
      if (idx < grid.length) {
        indices[i] = idx;
        break;
      }
      indices[i] = 0;
    }
  }
}

// ── Tautología / Contradicción ─────────────────────────────

const EPSILON = 1e-9;

/**
 * Devuelve true si la fórmula evalúa a 1 (módulo EPSILON) en
 * todos los puntos de la rejilla [0,1]^n con `resolution` puntos
 * por átomo. Default: 11 puntos (0, 0.1, ..., 1).
 *
 * Aviso: es una aproximación por sampling. Algunas tautologías
 * "casi" (verdaderas excepto en un conjunto de medida cero)
 * pueden seguir clasificándose correctamente, pero contraejemplos
 * sutiles requieren resolución mayor.
 */
export function isTautology(
  formula: FuzzyFormula,
  system: FuzzyOperator,
  resolution: number = 11,
): boolean {
  let ok = true;
  forEachValuation(formula, system, resolution, (_env, value) => {
    if (value < 1 - EPSILON) {
      ok = false;
      return false;
    }
    return undefined;
  });
  return ok;
}

/** Verdadera si la fórmula evalúa a 0 en toda la rejilla. */
export function isContradiction(
  formula: FuzzyFormula,
  system: FuzzyOperator,
  resolution: number = 11,
): boolean {
  let ok = true;
  forEachValuation(formula, system, resolution, (_env, value) => {
    if (value > EPSILON) {
      ok = false;
      return false;
    }
    return undefined;
  });
  return ok;
}

/**
 * Busca una valuación (en la rejilla con `resolution` puntos por
 * átomo) tal que `|evaluate(formula) - target| <= tolerance`.
 * Devuelve null si no encuentra ninguna.
 */
export function findValuation(
  formula: FuzzyFormula,
  system: FuzzyOperator,
  target: number,
  tolerance: number = 1e-6,
  resolution: number = 11,
): Record<string, number> | null {
  let hit: Record<string, number> | null = null;
  forEachValuation(formula, system, resolution, (env, value) => {
    if (Math.abs(value - target) <= tolerance) {
      hit = env;
      return false;
    }
    return undefined;
  });
  return hit;
}
