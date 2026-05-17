// ============================================================
// CSP — Constraint Satisfaction Problem, tipos públicos.
// ============================================================
// Un CSP es una tripla (X, D, C) donde:
//   X = variables
//   D = dominios finitos por variable (D: X → 2^Vals)
//   C = restricciones sobre subconjuntos de variables
//
// Cada restricción es un predicado n-ario que decide si una tupla de
// valores (alineada al orden de `vars`) es admisible.
// ============================================================

/**
 * Restricción n-aria de un CSP.
 *
 *  - `vars`      variables sobre las que aplica el predicado, en orden.
 *  - `predicate` función que recibe los valores alineados a `vars` y
 *                devuelve `true` si la tupla es admisible.
 *
 * Para AC-3 estricto sólo usamos restricciones binarias; para
 * restricciones n-arias el algoritmo cae a forward-checking equivalente:
 * cada restricción se evalúa cuando todas sus variables están asignadas.
 */
export interface Constraint<V, D> {
  vars: V[];
  predicate: (vals: D[]) => boolean;
}

/**
 * CSP genérico. `variables` define el orden canónico; `domains` mapea
 * cada variable a sus posibles valores. Las restricciones pueden ser
 * binarias (sweet spot de AC-3) o n-arias.
 */
export interface CSP<V, D> {
  variables: V[];
  domains: Map<V, D[]>;
  constraints: Constraint<V, D>[];
}

/**
 * Resultado de una corrida de backtracking.
 *  - `solution`   asignación completa o `null` si UNSAT.
 *  - `iterations` nodos del árbol de búsqueda visitados.
 *  - `failures`   asignaciones que dispararon backtrack.
 */
export interface CSPResult<V, D> {
  solution: Map<V, D> | null;
  iterations: number;
  failures: number;
}

/**
 * Opciones de configuración para el solver.
 *  - `useAC3` aplica AC-3 antes de empezar (y opcionalmente tras cada
 *             asignación si `maintainAC3` está activo).
 *  - `mrv`    heurística "Minimum Remaining Values" para elegir la
 *             próxima variable: la de dominio reducido más pequeño.
 *  - `lcv`    heurística "Least Constraining Value" para ordenar
 *             valores: probar primero el que menos restringe a vecinos.
 *  - `maxIterations` corta la búsqueda tras N nodos (defensa contra
 *                    explosión combinatoria).
 */
export interface BacktrackOptions {
  useAC3?: boolean;
  mrv?: boolean;
  lcv?: boolean;
  maxIterations?: number;
}
