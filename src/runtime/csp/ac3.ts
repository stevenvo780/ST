// ============================================================
// AC-3 — Arc Consistency #3 (Mackworth, 1977).
// ============================================================
// Mantiene la consistencia de arco binaria: para cada arco (Xi, Xj)
// y para cada valor v ∈ D(Xi), debe existir al menos un valor
// w ∈ D(Xj) tal que la restricción binaria entre Xi y Xj acepte
// la tupla (v, w). Si no existe, v se elimina de D(Xi).
//
// Complejidad: O(e · d³) donde e = # de restricciones binarias y
// d = tamaño máximo de dominio. Suficientemente rápido para CSPs
// de tamaño moderado (sudoku, n-queens, coloreo de grafos).
//
// Las restricciones n-arias (n > 2) NO participan en AC-3: sólo
// se contraen las binarias. Las n-arias se chequean en backtracking.
// ============================================================

import type { CSP, Constraint } from './types';

/**
 * Devuelve `true` si el predicado de la restricción binaria acepta la
 * tupla (a, b) según el orden de `c.vars`. Si los var indices están
 * cruzados, alinea automáticamente.
 */
function binaryAccepts<V, D>(c: Constraint<V, D>, xi: V, xj: V, a: D, b: D): boolean {
  if (c.vars.length !== 2) {
    throw new Error('binaryAccepts: la restricción no es binaria');
  }
  const [v0, v1] = c.vars;
  if (v0 === xi && v1 === xj) return c.predicate([a, b]);
  if (v0 === xj && v1 === xi) return c.predicate([b, a]);
  throw new Error('binaryAccepts: la restricción no involucra (xi, xj)');
}

/**
 * Construye el índice "vecinos binarios" del CSP.
 * vecinos[xi] = lista de pares { xj, constraint } tales que existe una
 * restricción binaria entre xi y xj.
 */
function buildBinaryNeighbors<V, D>(
  csp: CSP<V, D>,
): Map<V, Array<{ other: V; constraint: Constraint<V, D> }>> {
  const neighbors = new Map<V, Array<{ other: V; constraint: Constraint<V, D> }>>();
  for (const v of csp.variables) neighbors.set(v, []);
  for (const c of csp.constraints) {
    if (c.vars.length !== 2) continue;
    const [a, b] = c.vars;
    if (a === undefined || b === undefined) continue;
    neighbors.get(a)?.push({ other: b, constraint: c });
    neighbors.get(b)?.push({ other: a, constraint: c });
  }
  return neighbors;
}

/**
 * Revisa el arco (xi → xj): elimina de D(xi) todo valor sin soporte
 * en D(xj). Retorna `true` si el dominio cambió.
 */
function revise<V, D>(domains: Map<V, D[]>, xi: V, xj: V, constraint: Constraint<V, D>): boolean {
  const dxi = domains.get(xi);
  const dxj = domains.get(xj);
  if (!dxi || !dxj) return false;
  let revised = false;
  const keep: D[] = [];
  for (const a of dxi) {
    let hasSupport = false;
    for (const b of dxj) {
      if (binaryAccepts(constraint, xi, xj, a, b)) {
        hasSupport = true;
        break;
      }
    }
    if (hasSupport) keep.push(a);
    else revised = true;
  }
  if (revised) domains.set(xi, keep);
  return revised;
}

/**
 * Aplica AC-3 sobre una copia de los dominios del CSP.
 * Devuelve { consistent, reducedDomains }: si `consistent` es false,
 * el CSP es UNSAT por consistencia de arco (algún dominio quedó vacío).
 *
 * La firma deja los dominios originales intactos: el caller decide si
 * adoptar `reducedDomains` o conservar los originales.
 */
export function ac3<V, D>(
  csp: CSP<V, D>,
): {
  consistent: boolean;
  reducedDomains: Map<V, D[]>;
} {
  // Copia profunda de dominios para no mutar el input.
  const reduced = new Map<V, D[]>();
  for (const [k, vals] of csp.domains) reduced.set(k, [...vals]);

  const neighbors = buildBinaryNeighbors(csp);

  // Cola inicial: todos los arcos binarios en ambas direcciones.
  type Arc = { xi: V; xj: V; constraint: Constraint<V, D> };
  const queue: Arc[] = [];
  for (const c of csp.constraints) {
    if (c.vars.length !== 2) continue;
    const [a, b] = c.vars;
    if (a === undefined || b === undefined) continue;
    queue.push({ xi: a, xj: b, constraint: c });
    queue.push({ xi: b, xj: a, constraint: c });
  }

  while (queue.length > 0) {
    const arc = queue.shift();
    if (!arc) continue;
    const { xi, xj, constraint } = arc;
    if (revise(reduced, xi, xj, constraint)) {
      const di = reduced.get(xi);
      if (!di || di.length === 0) {
        return { consistent: false, reducedDomains: reduced };
      }
      // Re-encolar (xk, xi) para cada vecino xk ≠ xj.
      const nbrs = neighbors.get(xi) ?? [];
      for (const { other: xk, constraint: ck } of nbrs) {
        if (xk === xj) continue;
        queue.push({ xi: xk, xj: xi, constraint: ck });
      }
    }
  }

  return { consistent: true, reducedDomains: reduced };
}

/**
 * Helper público para uso en backtracking incremental: aplica AC-3
 * sobre un set de dominios ya provisto (mutación in-place permitida)
 * y devuelve `true` si los dominios siguen consistentes.
 */
export function ac3InPlace<V, D>(csp: CSP<V, D>, domains: Map<V, D[]>): boolean {
  const neighbors = buildBinaryNeighbors(csp);
  type Arc = { xi: V; xj: V; constraint: Constraint<V, D> };
  const queue: Arc[] = [];
  for (const c of csp.constraints) {
    if (c.vars.length !== 2) continue;
    const [a, b] = c.vars;
    if (a === undefined || b === undefined) continue;
    queue.push({ xi: a, xj: b, constraint: c });
    queue.push({ xi: b, xj: a, constraint: c });
  }

  while (queue.length > 0) {
    const arc = queue.shift();
    if (!arc) continue;
    const { xi, xj, constraint } = arc;
    if (revise(domains, xi, xj, constraint)) {
      const di = domains.get(xi);
      if (!di || di.length === 0) return false;
      const nbrs = neighbors.get(xi) ?? [];
      for (const { other: xk, constraint: ck } of nbrs) {
        if (xk === xj) continue;
        queue.push({ xi: xk, xj: xi, constraint: ck });
      }
    }
  }
  return true;
}
