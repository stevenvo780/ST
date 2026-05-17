// ============================================================
// Branch-and-bound para Integer Linear Programming.
// ============================================================
// Estrategia clásica:
//   1. Resolver la relajación LP. Si infactible/unbounded, salir.
//   2. Si la solución LP es entera en `integerVars`, es óptima
//      del ILP y devolvemos.
//   3. Elegir la variable entera más fraccional (closest-to-0.5).
//      Generar dos subproblemas añadiendo x ≤ ⌊x*⌋ y x ≥ ⌈x*⌉ a
//      las restricciones originales y descender (DFS con pila).
//   4. Mantener mejor incumbent (mejor entero encontrado). Podar
//      cuando el bound de la relajación es peor que el incumbent
//      (más una tolerancia).
//
// Para problemas binarios (variables 0/1) las cotas adicionales
// son innecesarias porque ya están restringidas por
// `variableBounds`; aún así, la lógica B&B funciona idéntica.
//
// Limitación conocida: no detecta optimalidad por GAP=0 sin
// explorar toda la rama; el `gap` reportado es relativo al
// bound del root LP.
// ============================================================

import { solveLP } from './simplex';
import type { ILPOptions, ILPProblem, ILPSolution, LPProblem } from './types';

const DEFAULT_MAX_NODES = 10000;
const DEFAULT_TIMEOUT_MS = 30000;
const INTEGER_TOL = 1e-6;

/**
 * Genera el LP relajado: descarta integerVars/binaryVars pero
 * mantiene `variableBounds` (los binarios ya tienen [0,1] ahí).
 */
export function lpRelaxation(ilp: ILPProblem): LPProblem {
  // Si hay binarios sin cotas explícitas, las inyectamos.
  const bounds: NonNullable<LPProblem['variableBounds']> = ilp.variableBounds
    ? ilp.variableBounds.map((b) => ({ ...b }))
    : new Array<{ lower?: number; upper?: number }>(ilp.objective.coefficients.length)
        .fill({})
        .map(() => ({}));

  if (ilp.binaryVars) {
    for (const idx of ilp.binaryVars) {
      const existing = bounds[idx] ?? {};
      bounds[idx] = {
        lower: existing.lower ?? 0,
        upper: existing.upper !== undefined ? Math.min(existing.upper, 1) : 1,
      };
    }
  }

  return {
    objective: {
      kind: ilp.objective.kind,
      coefficients: ilp.objective.coefficients.slice(),
    },
    constraints: ilp.constraints.map((c) => ({
      coefficients: c.coefficients.slice(),
      operator: c.operator,
      rhs: c.rhs,
    })),
    variableBounds: bounds,
    variableNames: ilp.variableNames ? ilp.variableNames.slice() : undefined,
  };
}

/**
 * Comprueba qué variable de `integerVars` es la más fraccional en
 * `x`. Devuelve `-1` si todas son enteras (dentro de la tolerancia).
 */
function pickBranchVariable(x: number[], integerVars: number[]): number {
  let bestIdx = -1;
  let bestFrac = -1;
  for (const i of integerVars) {
    const v = x[i] ?? 0;
    const frac = Math.abs(v - Math.round(v));
    if (frac > INTEGER_TOL && frac > bestFrac) {
      bestFrac = frac;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Construye un nuevo LP con una restricción adicional sobre la
 * variable `idx`: si `direction='floor'`, x_idx ≤ value; si
 * `direction='ceil'`, x_idx ≥ value.
 */
function branch(lp: LPProblem, idx: number, value: number, direction: 'floor' | 'ceil'): LPProblem {
  const row = new Array<number>(lp.objective.coefficients.length).fill(0);
  row[idx] = 1;
  return {
    objective: {
      kind: lp.objective.kind,
      coefficients: lp.objective.coefficients.slice(),
    },
    constraints: [
      ...lp.constraints.map((c) => ({
        coefficients: c.coefficients.slice(),
        operator: c.operator,
        rhs: c.rhs,
      })),
      {
        coefficients: row,
        operator: direction === 'floor' ? '<=' : '>=',
        rhs: value,
      },
    ],
    variableBounds: lp.variableBounds ? lp.variableBounds.map((b) => ({ ...b })) : undefined,
    variableNames: lp.variableNames ? lp.variableNames.slice() : undefined,
  };
}

/**
 * ¿La solución LP es entera (en `integerVars`) y respeta los
 * binarios (en {0,1})?
 */
function isIntegerSolution(x: number[], integerVars: number[]): boolean {
  for (const i of integerVars) {
    const v = x[i] ?? 0;
    if (Math.abs(v - Math.round(v)) > INTEGER_TOL) return false;
  }
  return true;
}

/**
 * Redondea las componentes enteras de `x` (ya verificadas como
 * casi-enteras) para limpiar ruido numérico.
 */
function roundIntegers(x: number[], integerVars: number[]): number[] {
  const out = x.slice();
  for (const i of integerVars) {
    const v = out[i];
    if (v !== undefined) out[i] = Math.round(v);
  }
  return out;
}

/**
 * ¿`a` es mejor que `b` según la dirección de optimización?
 * Para 'maximize': a > b. Para 'minimize': a < b.
 */
function isBetter(a: number, b: number, kind: 'minimize' | 'maximize'): boolean {
  if (kind === 'maximize') return a > b + INTEGER_TOL;
  return a < b - INTEGER_TOL;
}

/**
 * El bound del nodo (valor LP relajado) ¿puede mejorar al
 * incumbent? Si no, podamos.
 */
function canImprove(
  bound: number,
  incumbent: number,
  kind: 'minimize' | 'maximize',
  hasIncumbent: boolean,
): boolean {
  if (!hasIncumbent) return true;
  if (kind === 'maximize') return bound > incumbent + INTEGER_TOL;
  return bound < incumbent - INTEGER_TOL;
}

/**
 * Solver ILP principal. Estrategia DFS con pila explícita.
 */
export function solveILP(problem: ILPProblem, opts: ILPOptions = {}): ILPSolution {
  const maxNodes = opts.maxNodes ?? DEFAULT_MAX_NODES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const lpOpts = opts.lpOptions ?? {};
  const kind = problem.objective.kind;
  const startTime = Date.now();

  // integerVars unificado (incluye binarios)
  const integerVarsSet = new Set<number>(problem.integerVars);
  if (problem.binaryVars) {
    for (const b of problem.binaryVars) integerVarsSet.add(b);
  }
  const integerVars = Array.from(integerVarsSet);

  const rootLP = lpRelaxation(problem);
  const rootSol = solveLP(rootLP, lpOpts);
  if (rootSol.status === 'infeasible' || rootSol.status === 'unbounded') {
    return {
      ...rootSol,
      nodesExplored: 1,
    };
  }
  if (rootSol.status === 'iteration_limit') {
    return {
      ...rootSol,
      nodesExplored: 1,
    };
  }

  // Si la relajación ya es entera, listo
  if (isIntegerSolution(rootSol.variables, integerVars)) {
    return {
      ...rootSol,
      variables: roundIntegers(rootSol.variables, integerVars),
      nodesExplored: 1,
      gap: 0,
    };
  }

  let bestValue = kind === 'maximize' ? -Infinity : Infinity;
  let bestVars: number[] | null = null;
  let nodesExplored = 1;
  const rootBound = rootSol.objectiveValue;

  // Stack para DFS. Cada nodo lleva su LP y el bound padre para
  // pruning agresivo (la LP de los hijos no puede mejorar al padre).
  const stack: { lp: LPProblem; parentBound: number }[] = [{ lp: rootLP, parentBound: rootBound }];

  while (stack.length > 0) {
    if (Date.now() - startTime > timeoutMs) {
      // Timeout: devolvemos el incumbent (si existe) como mejor esfuerzo
      if (bestVars) {
        return {
          status: 'iteration_limit',
          variables: bestVars,
          objectiveValue: bestValue,
          iterations: 0,
          nodesExplored,
          gap: Math.abs(rootBound - bestValue),
        };
      }
      return {
        status: 'iteration_limit',
        variables: rootSol.variables,
        objectiveValue: NaN,
        iterations: rootSol.iterations,
        nodesExplored,
      };
    }
    if (nodesExplored >= maxNodes) {
      if (bestVars) {
        return {
          status: 'iteration_limit',
          variables: bestVars,
          objectiveValue: bestValue,
          iterations: 0,
          nodesExplored,
          gap: Math.abs(rootBound - bestValue),
        };
      }
      return {
        status: 'iteration_limit',
        variables: rootSol.variables,
        objectiveValue: NaN,
        iterations: rootSol.iterations,
        nodesExplored,
      };
    }

    const node = stack.pop();
    if (!node) break;

    // Pruning preliminar contra el bound del padre
    if (!canImprove(node.parentBound, bestValue, kind, bestVars !== null)) {
      continue;
    }

    const sol = solveLP(node.lp, lpOpts);
    nodesExplored++;

    if (sol.status === 'infeasible' || sol.status === 'unbounded') continue;
    if (sol.status === 'iteration_limit') continue;

    // Pruning por bound: si el LP relajado de este nodo no mejora al
    // incumbent, podamos.
    if (!canImprove(sol.objectiveValue, bestValue, kind, bestVars !== null)) {
      continue;
    }

    if (isIntegerSolution(sol.variables, integerVars)) {
      // Candidato entero. Actualizar incumbent si mejora.
      if (bestVars === null || isBetter(sol.objectiveValue, bestValue, kind)) {
        bestValue = sol.objectiveValue;
        bestVars = roundIntegers(sol.variables, integerVars);
      }
      continue;
    }

    // Branch
    const branchIdx = pickBranchVariable(sol.variables, integerVars);
    if (branchIdx === -1) continue; // todas enteras: ya manejado arriba
    const value = sol.variables[branchIdx] ?? 0;
    const floor = Math.floor(value);
    const ceil = Math.ceil(value);
    // DFS: empujamos primero el de menor prioridad. Para max,
    // exploramos primero la rama ceil (suele tener mejor bound).
    if (kind === 'maximize') {
      stack.push({
        lp: branch(node.lp, branchIdx, floor, 'floor'),
        parentBound: sol.objectiveValue,
      });
      stack.push({ lp: branch(node.lp, branchIdx, ceil, 'ceil'), parentBound: sol.objectiveValue });
    } else {
      stack.push({ lp: branch(node.lp, branchIdx, ceil, 'ceil'), parentBound: sol.objectiveValue });
      stack.push({
        lp: branch(node.lp, branchIdx, floor, 'floor'),
        parentBound: sol.objectiveValue,
      });
    }
  }

  if (bestVars === null) {
    // No se encontró ningún entero factible
    return {
      status: 'infeasible',
      variables: new Array<number>(problem.objective.coefficients.length).fill(0),
      objectiveValue: NaN,
      iterations: rootSol.iterations,
      nodesExplored,
    };
  }

  return {
    status: 'optimal',
    variables: bestVars,
    objectiveValue: bestValue,
    iterations: rootSol.iterations,
    nodesExplored,
    gap: Math.abs(rootBound - bestValue),
  };
}
