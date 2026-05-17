// ============================================================
// Backtracking search con heurísticas MRV + LCV + AC-3.
// ============================================================
// Algoritmo clásico: asigna variables una a una, propaga restricciones
// y retrocede en cuanto detecta inconsistencia.
//
// Heurísticas:
//   - MRV  (Minimum Remaining Values): elige la variable cuyo dominio
//     reducido sea menor. Tie-break: orden canónico.
//   - LCV  (Least Constraining Value): ordena los valores candidatos
//     priorizando el que MENOS reduzca los dominios de los vecinos.
//   - AC-3 inicial: contrae dominios antes de empezar y, si está activo,
//     re-aplica AC-3 tras cada asignación (maintaining arc consistency).
//
// La búsqueda usa un único árbol con copias incrementales de dominios.
// Para problemas pequeños/medianos (sudoku, n-queens hasta ~20) es
// suficiente; para escalar, sustituir copias por trailing.
// ============================================================

import { ac3InPlace } from './ac3';
import type {
  CSP,
  CSPResult,
  Constraint,
  BacktrackOptions,
} from './types';

/**
 * Comprueba si una asignación parcial respeta todas las restricciones
 * cuyas variables ya están todas asignadas. Las restricciones con
 * variables aún sin asignar se posponen.
 */
function consistent<V, D>(
  csp: CSP<V, D>,
  assignment: Map<V, D>,
): boolean {
  for (const c of csp.constraints) {
    let allAssigned = true;
    const vals: D[] = [];
    for (const v of c.vars) {
      const a = assignment.get(v);
      if (a === undefined) {
        allAssigned = false;
        break;
      }
      vals.push(a);
    }
    if (!allAssigned) continue;
    if (!c.predicate(vals)) return false;
  }
  return true;
}

/**
 * Selecciona la próxima variable a asignar.
 * Con MRV: la de dominio reducido más pequeño (rompiendo empates por
 * orden canónico de `csp.variables`). Sin MRV: la primera no asignada
 * en orden canónico.
 */
function selectUnassigned<V, D>(
  csp: CSP<V, D>,
  domains: Map<V, D[]>,
  assignment: Map<V, D>,
  mrv: boolean,
): V | null {
  if (!mrv) {
    for (const v of csp.variables) {
      if (!assignment.has(v)) return v;
    }
    return null;
  }
  let best: V | null = null;
  let bestSize = Infinity;
  for (const v of csp.variables) {
    if (assignment.has(v)) continue;
    const d = domains.get(v);
    const size = d ? d.length : Infinity;
    if (size < bestSize) {
      bestSize = size;
      best = v;
    }
  }
  return best;
}

/**
 * Ordena los valores del dominio actual de `variable` según LCV:
 * el valor que "menos restringe" a los vecinos va primero. La
 * métrica usada es la suma de # de eliminaciones que provocaría
 * en los dominios de los vecinos binarios.
 */
function orderValues<V, D>(
  csp: CSP<V, D>,
  domains: Map<V, D[]>,
  variable: V,
  lcv: boolean,
): D[] {
  const dom = domains.get(variable) ?? [];
  if (!lcv) return [...dom];

  // Para cada valor, calcular cuánto restringiría a los vecinos
  // binarios. Menos restricción → menor "cost".
  const binNeighbors: Array<{ other: V; constraint: Constraint<V, D> }> = [];
  for (const c of csp.constraints) {
    if (c.vars.length !== 2) continue;
    const [a, b] = c.vars;
    if (a === variable && b !== undefined) binNeighbors.push({ other: b, constraint: c });
    else if (b === variable && a !== undefined) binNeighbors.push({ other: a, constraint: c });
  }

  const scored: Array<{ val: D; cost: number }> = dom.map((val) => {
    let cost = 0;
    for (const { other, constraint } of binNeighbors) {
      const otherDom = domains.get(other) ?? [];
      for (const w of otherDom) {
        // Alineación: el predicado espera tupla en orden de constraint.vars.
        const [v0] = constraint.vars;
        const tuple: D[] = v0 === variable ? [val, w] : [w, val];
        if (!constraint.predicate(tuple)) cost++;
      }
    }
    return { val, cost };
  });
  scored.sort((a, b) => a.cost - b.cost);
  return scored.map((e) => e.val);
}

/**
 * Backtracking search. Si `useAC3` está activo, también aplica AC-3
 * tras cada asignación (Maintaining Arc Consistency, MAC).
 *
 * Devuelve la primera solución encontrada o `null` si UNSAT. Para
 * enumerar todas las soluciones, ver `allSolutions`.
 */
export function backtrack<V, D>(
  csp: CSP<V, D>,
  opts: BacktrackOptions = {},
): CSPResult<V, D> {
  const useAC3 = opts.useAC3 ?? true;
  const mrv = opts.mrv ?? true;
  const lcv = opts.lcv ?? true;
  const maxIter = opts.maxIterations ?? 1_000_000;

  // Copia inicial de dominios.
  const initialDomains = new Map<V, D[]>();
  for (const [k, v] of csp.domains) initialDomains.set(k, [...v]);

  // AC-3 inicial.
  if (useAC3) {
    if (!ac3InPlace(csp, initialDomains)) {
      return { solution: null, iterations: 0, failures: 0 };
    }
  }

  const stats = { iterations: 0, failures: 0 };

  function recurse(assignment: Map<V, D>, domains: Map<V, D[]>): Map<V, D> | null {
    if (stats.iterations >= maxIter) return null;
    stats.iterations++;

    if (assignment.size === csp.variables.length) {
      // Todas asignadas, verificación final por seguridad.
      if (consistent(csp, assignment)) return new Map(assignment);
      return null;
    }

    const variable = selectUnassigned(csp, domains, assignment, mrv);
    if (variable === null) return null;

    const orderedValues = orderValues(csp, domains, variable, lcv);
    for (const value of orderedValues) {
      assignment.set(variable, value);
      if (consistent(csp, assignment)) {
        // Domain snapshot para propagación.
        const snapshot = new Map<V, D[]>();
        for (const [k, v] of domains) snapshot.set(k, [...v]);
        snapshot.set(variable, [value]);

        let ok = true;
        if (useAC3) {
          ok = ac3InPlace(csp, snapshot);
        }
        if (ok) {
          const result = recurse(assignment, snapshot);
          if (result) return result;
        }
      } else {
        stats.failures++;
      }
      assignment.delete(variable);
    }
    stats.failures++;
    return null;
  }

  const solution = recurse(new Map<V, D>(), initialDomains);
  return { solution, iterations: stats.iterations, failures: stats.failures };
}

/**
 * Enumera hasta `maxSolutions` soluciones del CSP. Útil para contar
 * soluciones simétricas (e.g. n-queens completo, sudoku no-único).
 */
export function allSolutions<V, D>(
  csp: CSP<V, D>,
  maxSolutions = 100,
  opts: BacktrackOptions = {},
): Array<Map<V, D>> {
  const useAC3 = opts.useAC3 ?? true;
  const mrv = opts.mrv ?? true;
  const lcv = opts.lcv ?? true;
  const maxIter = opts.maxIterations ?? 5_000_000;

  const solutions: Array<Map<V, D>> = [];
  const initialDomains = new Map<V, D[]>();
  for (const [k, v] of csp.domains) initialDomains.set(k, [...v]);
  if (useAC3 && !ac3InPlace(csp, initialDomains)) return solutions;

  let iterations = 0;

  function recurse(assignment: Map<V, D>, domains: Map<V, D[]>): void {
    if (solutions.length >= maxSolutions) return;
    if (iterations >= maxIter) return;
    iterations++;

    if (assignment.size === csp.variables.length) {
      if (consistent(csp, assignment)) solutions.push(new Map(assignment));
      return;
    }

    const variable = selectUnassigned(csp, domains, assignment, mrv);
    if (variable === null) return;

    const orderedValues = orderValues(csp, domains, variable, lcv);
    for (const value of orderedValues) {
      if (solutions.length >= maxSolutions) return;
      assignment.set(variable, value);
      if (consistent(csp, assignment)) {
        const snapshot = new Map<V, D[]>();
        for (const [k, v] of domains) snapshot.set(k, [...v]);
        snapshot.set(variable, [value]);
        let ok = true;
        if (useAC3) ok = ac3InPlace(csp, snapshot);
        if (ok) recurse(assignment, snapshot);
      }
      assignment.delete(variable);
    }
  }

  recurse(new Map<V, D>(), initialDomains);
  return solutions;
}
