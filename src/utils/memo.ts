import { Formula } from '../types';

/**
 * Cache central para derivaciones y operaciones frecuentes sobre AST.
 * ST genera fórmulas inmutables en su mayoría, por lo que podemos usar
 * la referencia del objeto Formula como clave en un WeakMap, evitando
 * pérdidas de memoria y logrando cacheo O(1).
 */

const stringCache = new WeakMap<Formula, string>();
const hashCache = new WeakMap<Formula, string>();
const atomsCache = new WeakMap<Formula, Set<string>>();
const nnfCache = new WeakMap<Formula, Formula>();
const cnfCache = new WeakMap<Formula, Formula>();
const dnfCache = new WeakMap<Formula, Formula>();

/**
 * Función genérica de memoización para operaciones que toman FormData y
 * devuelven un string.
 */
export function memoizeString(f: Formula, compute: (f: Formula) => string): string {
  let cached = stringCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  stringCache.set(f, cached);
  return cached;
}

export function memoizeHash(f: Formula, compute: (f: Formula) => string): string {
  let cached = hashCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  hashCache.set(f, cached);
  return cached;
}

export function memoizeAtoms(f: Formula, compute: (f: Formula) => Set<string>): Set<string> {
  let cached = atomsCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  atomsCache.set(f, cached);
  return cached;
}

export function memoizeNNF(f: Formula, compute: (f: Formula) => Formula): Formula {
  let cached = nnfCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  nnfCache.set(f, cached);
  return cached;
}

export function memoizeCNF(f: Formula, compute: (f: Formula) => Formula): Formula {
  let cached = cnfCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  cnfCache.set(f, cached);
  return cached;
}

export function memoizeDNF(f: Formula, compute: (f: Formula) => Formula): Formula {
  let cached = dnfCache.get(f);
  if (cached !== undefined) return cached;
  cached = compute(f);
  dnfCache.set(f, cached);
  return cached;
}
