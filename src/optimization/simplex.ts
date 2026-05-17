// ============================================================
// Simplex de dos fases sobre tableau denso.
// ============================================================
// Implementa el método simplex revisado (forma tableau) con Bland's
// rule para evitar ciclos. Fase 1 construye una solución básica
// factible (BFS) introduciendo variables artificiales y minimizando
// su suma; si el óptimo de Fase 1 no es cero, el problema original
// es infactible. Fase 2 optimiza la función objetivo real partiendo
// de la BFS obtenida.
//
// Convenciones internas (DESPUÉS de pasar por `standardForm`):
//   - Maximizar c·x s.t. Ax ≤ b, x ≥ 0.
//   - Añadimos slacks s_i para cada restricción: Ax + Is = b.
//   - Si algún b_i < 0, multiplicamos la fila por -1 (invierte el
//     operador). Tras ese arreglo, si una fila no es naturalmente
//     básica (slack negativo no nos sirve), introducimos artificial
//     y entramos a Fase 1.
//
// El tableau se almacena como Float64Array por filas en un arreglo
// de length (m+1) * (n+m+a+1), donde m = #restricciones, n = #vars
// originales, a = #artificiales y la última columna es el RHS. La
// fila final es el costo reducido (objetivo).
//
// Tolerancia numérica: epsilon configurable. Bland's rule selecciona
// la columna entrante de menor índice con costo reducido > 0
// (estrictamente). Esto garantiza terminación finita aunque sea más
// lento que Dantzig en problemas degenerados.
// ============================================================

import { standardForm } from './standard-form';
import type { LPOptions, LPProblem, LPSolution } from './types';

const DEFAULT_EPS = 1e-9;
const DEFAULT_MAX_ITER = 5000;

interface TableauState {
  /** Filas del tableau (m+1) × (n+m+a+1) en row-major. */
  T: number[][];
  /** Para cada fila i ∈ [0,m), índice de la variable básica. */
  basis: number[];
  /** Total de columnas = n + m + a + 1 (la última es RHS). */
  ncols: number;
  /** #restricciones (filas reales, sin contar la objetivo). */
  m: number;
  /** #variables originales. */
  n: number;
  /** Índices de variables artificiales (en columnas). */
  artificialCols: number[];
}

function buildTableau(std: LPProblem, _eps: number): TableauState {
  const m = std.constraints.length;
  const n = std.objective.coefficients.length;

  // Detectar filas con RHS negativo y reflejarlas. Aún así, los
  // slacks no nos darán siempre una BFS positiva (si reflejamos,
  // el slack queda con coeficiente -1 en su fila, ya no sirve como
  // básico). En esas filas necesitamos artificial.
  const rows: { a: number[]; b: number; needsArtificial: boolean }[] = [];
  for (const c of std.constraints) {
    if (c.operator !== '<=') {
      throw new Error('buildTableau: se esperaban solo ≤ tras standardForm');
    }
    if (c.rhs >= 0) {
      rows.push({ a: c.coefficients.slice(), b: c.rhs, needsArtificial: false });
    } else {
      rows.push({
        a: c.coefficients.map((v) => -v),
        b: -c.rhs,
        needsArtificial: true,
      });
    }
  }

  const artificialRows: number[] = [];
  for (let i = 0; i < m; i++) {
    const row = rows[i];
    if (row && row.needsArtificial) artificialRows.push(i);
  }
  const a = artificialRows.length;
  const ncols = n + m + a + 1; // vars + slacks + artificiales + RHS
  const T: number[][] = [];
  const basis: number[] = new Array<number>(m).fill(-1);
  const artificialCols: number[] = [];

  // Filas del tableau
  for (let i = 0; i < m; i++) {
    const row = new Array<number>(ncols).fill(0);
    const src = rows[i];
    if (!src) throw new Error('buildTableau: fila no inicializada');
    for (let j = 0; j < n; j++) {
      row[j] = src.a[j] ?? 0;
    }
    // Slack en columna n + i. Si la fila se reflejó, el "slack"
    // realmente tiene signo -1 (es un excedente). Para mantener
    // base inicial limpia, usamos artificial.
    row[n + i] = src.needsArtificial ? -1 : 1;
    row[ncols - 1] = src.b;
    T.push(row);
    if (!src.needsArtificial) {
      basis[i] = n + i; // slack como básico inicial
    }
  }
  // Columnas artificiales
  let artIdx = 0;
  for (const i of artificialRows) {
    const col = n + m + artIdx;
    const rowI = T[i];
    if (!rowI) throw new Error('buildTableau: fila artificial inexistente');
    rowI[col] = 1;
    basis[i] = col;
    artificialCols.push(col);
    artIdx++;
  }

  // Fila objetivo (placeholder; phase1/phase2 la sobrescriben).
  T.push(new Array<number>(ncols).fill(0));

  return { T, basis, ncols, m, n, artificialCols };
}

/**
 * Pivot reducido sobre fila r, columna c. La columna c se vuelve
 * columna unidad con 1 en la fila r y 0 en las demás (incluida la
 * fila objetivo, que es la última).
 */
function pivot(T: number[][], r: number, c: number, eps: number): void {
  const rowR = T[r];
  if (!rowR) throw new Error('pivot: fila inexistente');
  const piv = rowR[c];
  if (piv === undefined || Math.abs(piv) < eps) {
    throw new Error('pivot: elemento pivote degenerado');
  }
  const ncols = rowR.length;
  // Normalizar fila pivote
  for (let j = 0; j < ncols; j++) {
    rowR[j] = (rowR[j] ?? 0) / piv;
  }
  // Eliminar columna c en las demás filas
  for (let i = 0; i < T.length; i++) {
    if (i === r) continue;
    const rowI = T[i];
    if (!rowI) continue;
    const factor = rowI[c] ?? 0;
    if (Math.abs(factor) < eps) continue;
    for (let j = 0; j < ncols; j++) {
      rowI[j] = (rowI[j] ?? 0) - factor * (rowR[j] ?? 0);
    }
  }
}

/**
 * Selecciona la columna entrante con Bland's rule: el menor índice
 * j tal que el costo reducido z_j - c_j sea estrictamente negativo
 * (es decir, c_j - z_j > 0 en formulación de maximización; aquí
 * almacenamos en la última fila el "reduced cost" con signo tal
 * que <0 significa "entra"). Devuelve -1 si todos son ≥ -eps
 * (óptimo alcanzado).
 */
function selectEnteringBland(state: TableauState, eps: number): number {
  const T = state.T;
  const objRow = T[state.m];
  if (!objRow) return -1;
  const limit = state.ncols - 1; // excluye RHS
  for (let j = 0; j < limit; j++) {
    if ((objRow[j] ?? 0) < -eps) return j;
  }
  return -1;
}

/**
 * Selecciona la fila saliente por la regla del cociente mínimo.
 * Devuelve -1 si la columna no tiene ningún coeficiente positivo
 * (problema unbounded).
 */
function selectLeaving(state: TableauState, col: number, eps: number): number {
  const T = state.T;
  let bestRow = -1;
  let bestRatio = Infinity;
  for (let i = 0; i < state.m; i++) {
    const row = T[i];
    if (!row) continue;
    const aij = row[col] ?? 0;
    if (aij > eps) {
      const ratio = (row[state.ncols - 1] ?? 0) / aij;
      if (ratio < bestRatio - eps) {
        bestRatio = ratio;
        bestRow = i;
      } else if (Math.abs(ratio - bestRatio) <= eps && bestRow !== -1) {
        // Bland's tie-break: menor índice de variable básica saliente.
        const curBasic = state.basis[bestRow] ?? Number.POSITIVE_INFINITY;
        const newBasic = state.basis[i] ?? Number.POSITIVE_INFINITY;
        if (newBasic < curBasic) bestRow = i;
      }
    }
  }
  return bestRow;
}

/**
 * Ejecuta iteraciones simplex sobre el tableau hasta que no haya
 * columna entrante (óptimo) o se exceda el límite. Retorna:
 *  - 'optimal' si terminó normal,
 *  - 'unbounded' si una columna sin razón positiva fue elegida,
 *  - 'iteration_limit' si excedió maxIter.
 */
function runSimplex(
  state: TableauState,
  maxIter: number,
  eps: number,
): { status: 'optimal' | 'unbounded' | 'iteration_limit'; iterations: number } {
  let iterations = 0;
  while (iterations < maxIter) {
    const col = selectEnteringBland(state, eps);
    if (col === -1) return { status: 'optimal', iterations };
    const row = selectLeaving(state, col, eps);
    if (row === -1) return { status: 'unbounded', iterations };
    pivot(state.T, row, col, eps);
    state.basis[row] = col;
    iterations++;
  }
  return { status: 'iteration_limit', iterations };
}

/**
 * Construye la fila objetivo de Fase I: minimizar la suma de las
 * artificiales (equivalente a maximizar -Σ a_i). En tableau de
 * maximización, costo reducido z_j - c_j para artificiales debe
 * ser 0 inicialmente; aplicamos eliminación gaussiana para que la
 * fila objetivo refleje correctamente la BFS inicial.
 */
function setupPhase1Objective(state: TableauState, eps: number): void {
  const objRow = state.T[state.m];
  if (!objRow) throw new Error('phase1: fila objetivo inexistente');
  for (let j = 0; j < state.ncols; j++) objRow[j] = 0;
  // Minimizar Σ a_i ≡ maximizar -Σ a_i. En forma "reduced cost <0
  // entra" para maximización, ponemos +1 en columnas artificiales
  // (queremos que entren si reducen ese coste). Tras restar las
  // filas básicas correspondientes, la fila quedará en forma
  // canónica respecto de la base.
  for (const col of state.artificialCols) {
    objRow[col] = 1;
  }
  // Convertir a forma canónica: para cada artificial básica en la
  // fila i, restamos la fila i de la objetivo (eliminando el 1).
  for (let i = 0; i < state.m; i++) {
    const basicCol = state.basis[i] ?? -1;
    if (state.artificialCols.includes(basicCol)) {
      const rowI = state.T[i];
      if (!rowI) continue;
      for (let j = 0; j < state.ncols; j++) {
        objRow[j] = (objRow[j] ?? 0) - (rowI[j] ?? 0);
      }
    }
  }
  void eps;
}

/**
 * Construye la fila objetivo de Fase II a partir de la BFS de
 * Fase I. Maximiza c·x, donde x son las variables originales
 * (columnas 0..n-1). Pone las artificiales con coste prohibitivo
 * (lo cual es innecesario si Fase I las dejó en 0; las anulamos).
 */
function setupPhase2Objective(state: TableauState, c: number[], eps: number): void {
  const objRow = state.T[state.m];
  if (!objRow) throw new Error('phase2: fila objetivo inexistente');
  for (let j = 0; j < state.ncols; j++) objRow[j] = 0;
  // En convención "reduced cost <0 entra" para maximización,
  // la fila objetivo inicial es -c en las columnas de variables
  // originales (y 0 en slacks/artificiales).
  for (let j = 0; j < c.length; j++) {
    objRow[j] = -(c[j] ?? 0);
  }
  // Las artificiales deben evitarse: les ponemos cost reducido
  // positivo grande. Ya están en base con valor 0 (asumido); si
  // por degeneración no lo están, los pivots de Fase II no las
  // elegirán porque su columna no aporta valor real.
  for (const col of state.artificialCols) {
    objRow[col] = 1e9;
  }
  // Convertir a forma canónica respecto de la base actual.
  for (let i = 0; i < state.m; i++) {
    const basicCol = state.basis[i] ?? -1;
    const coeff = objRow[basicCol] ?? 0;
    if (Math.abs(coeff) > eps) {
      const rowI = state.T[i];
      if (!rowI) continue;
      for (let j = 0; j < state.ncols; j++) {
        objRow[j] = (objRow[j] ?? 0) - coeff * (rowI[j] ?? 0);
      }
    }
  }
}

/**
 * Extrae la solución x ∈ ℝⁿ desde el tableau, leyendo cada
 * variable básica de las filas. Las no básicas valen 0.
 */
function extractSolution(state: TableauState): number[] {
  const x = new Array<number>(state.n).fill(0);
  for (let i = 0; i < state.m; i++) {
    const col = state.basis[i] ?? -1;
    if (col >= 0 && col < state.n) {
      const row = state.T[i];
      if (row) x[col] = row[state.ncols - 1] ?? 0;
    }
  }
  return x;
}

/**
 * Solver LP principal. Acepta el problema en cualquier forma
 * (min/max, ≤/≥/=, con o sin cotas), lo lleva a standardForm y
 * ejecuta simplex de dos fases.
 */
export function solveLP(problem: LPProblem, opts: LPOptions = {}): LPSolution {
  const eps = opts.eps ?? DEFAULT_EPS;
  const maxIter = opts.maxIterations ?? DEFAULT_MAX_ITER;
  const n = problem.objective.coefficients.length;

  // Validaciones rápidas
  for (const c of problem.constraints) {
    if (c.coefficients.length !== n) {
      throw new Error(
        `solveLP: constraint con ${String(c.coefficients.length)} coefs, esperado ${String(n)}`,
      );
    }
  }

  const wasMinimize = problem.objective.kind === 'minimize';
  const std = standardForm(problem);
  // standardForm devuelve objective.kind = 'maximize' siempre; los
  // coeficientes ya están negados si era minimización. Guardamos
  // wasMinimize para negar el resultado al reportar.

  const state = buildTableau(std, eps);
  let totalIterations = 0;

  // Fase I si hay artificiales
  if (state.artificialCols.length > 0) {
    setupPhase1Objective(state, eps);
    const ph1 = runSimplex(state, maxIter, eps);
    totalIterations += ph1.iterations;
    if (ph1.status === 'iteration_limit') {
      return {
        status: 'iteration_limit',
        variables: extractSolution(state),
        objectiveValue: NaN,
        iterations: totalIterations,
      };
    }
    // El valor óptimo de Fase I es -RHS de la fila objetivo (negado
    // por nuestra convención). Si > eps, infactible.
    const objRow = state.T[state.m];
    const phase1Val = objRow ? -(objRow[state.ncols - 1] ?? 0) : 0;
    if (phase1Val > 1e-6) {
      return {
        status: 'infeasible',
        variables: new Array<number>(n).fill(0),
        objectiveValue: NaN,
        iterations: totalIterations,
      };
    }
    // Si alguna artificial sigue en base con valor 0, intentamos
    // pivotearla fuera (no es estrictamente necesario para nuestros
    // tests pero da estabilidad). Si no se puede (fila degenerada),
    // continuamos: Fase II la mantendrá con cost prohibitivo.
    for (let i = 0; i < state.m; i++) {
      const bc = state.basis[i] ?? -1;
      if (!state.artificialCols.includes(bc)) continue;
      // buscar columna no artificial con coef ≠ 0
      const row = state.T[i];
      if (!row) continue;
      let swapCol = -1;
      for (let j = 0; j < state.n + state.m; j++) {
        if (state.artificialCols.includes(j)) continue;
        if (Math.abs(row[j] ?? 0) > eps) {
          swapCol = j;
          break;
        }
      }
      if (swapCol !== -1) {
        pivot(state.T, i, swapCol, eps);
        state.basis[i] = swapCol;
      }
    }
  }

  // Fase II
  setupPhase2Objective(state, std.objective.coefficients, eps);
  const ph2 = runSimplex(state, maxIter, eps);
  totalIterations += ph2.iterations;
  const x = extractSolution(state);

  if (ph2.status === 'unbounded') {
    return {
      status: 'unbounded',
      variables: x,
      objectiveValue: wasMinimize ? -Infinity : Infinity,
      iterations: totalIterations,
    };
  }
  if (ph2.status === 'iteration_limit') {
    return {
      status: 'iteration_limit',
      variables: x,
      objectiveValue: NaN,
      iterations: totalIterations,
    };
  }

  // Valor objetivo respecto del problema original (no el standardForm)
  let value = 0;
  for (let j = 0; j < n; j++) {
    value += (problem.objective.coefficients[j] ?? 0) * (x[j] ?? 0);
  }

  return {
    status: 'optimal',
    variables: x,
    objectiveValue: value,
    iterations: totalIterations,
  };
}
