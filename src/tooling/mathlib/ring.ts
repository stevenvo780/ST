// ============================================================
// ST Mathlib — Ring theory
// Verificación de axiomas de anillo y check de campo.
// ============================================================

import { isAssociative, isCommutative, hasIdentity, hasInverses } from './group';
import type { Ring, VerificationResult } from './types';

/**
 * Verifica los axiomas de anillo (con identidad multiplicativa):
 *   - (R, +, 0) grupo abeliano.
 *   - (R, ·, 1) monoide (asociatividad + identidad).
 *   - · distribuye sobre + por ambos lados.
 */
export function verifyRing<T>(
  r: Ring<T>,
  elements: T[],
  eq: (a: T, b: T) => boolean = (a, b) => a === b,
): VerificationResult {
  const failures: string[] = [];

  // Grupo abeliano aditivo.
  const addMagma = { op: r.add };
  if (!isAssociative(addMagma, elements, eq)) failures.push('asociatividad aditiva');
  if (!hasIdentity(addMagma, elements, r.zero, eq)) failures.push('identidad aditiva (0)');
  if (!hasInverses({ op: r.add, identity: r.zero, inverse: r.neg }, elements, eq)) {
    failures.push('inversos aditivos');
  }
  if (!isCommutative(addMagma, elements, eq)) failures.push('conmutatividad aditiva');

  // Monoide multiplicativo.
  const mulMagma = { op: r.mul };
  if (!isAssociative(mulMagma, elements, eq)) failures.push('asociatividad multiplicativa');
  if (!hasIdentity(mulMagma, elements, r.one, eq)) failures.push('identidad multiplicativa (1)');

  // Distributividad: a·(b+c) = a·b + a·c  y  (a+b)·c = a·c + b·c.
  for (const a of elements) {
    for (const b of elements) {
      for (const c of elements) {
        const left = r.mul(a, r.add(b, c));
        const right = r.add(r.mul(a, b), r.mul(a, c));
        if (!eq(left, right)) {
          failures.push('distributividad por izquierda');
          break;
        }
      }
      if (failures.includes('distributividad por izquierda')) break;
    }
    if (failures.includes('distributividad por izquierda')) break;
  }

  for (const a of elements) {
    for (const b of elements) {
      for (const c of elements) {
        const left = r.mul(r.add(a, b), c);
        const right = r.add(r.mul(a, c), r.mul(b, c));
        if (!eq(left, right)) {
          failures.push('distributividad por derecha');
          break;
        }
      }
      if (failures.includes('distributividad por derecha')) break;
    }
    if (failures.includes('distributividad por derecha')) break;
  }

  return { valid: failures.length === 0, failures };
}

/**
 * Un anillo conmutativo R es campo si todo elemento no nulo tiene
 * inverso multiplicativo dentro del conjunto. `div` debe devolver
 * un T para argumentos válidos o `undefined` cuando no existe inverso.
 */
export function isField<T>(
  r: Ring<T>,
  elements: T[],
  div: (a: T, b: T) => T | undefined,
  eq: (a: T, b: T) => boolean = (a, b) => a === b,
): boolean {
  // Conmutatividad multiplicativa (requerido para campo).
  if (!isCommutative({ op: r.mul }, elements, eq)) return false;

  // Todo elemento no cero tiene inverso multiplicativo.
  for (const a of elements) {
    if (eq(a, r.zero)) continue;
    const inv = div(r.one, a);
    if (inv === undefined) return false;
    if (!eq(r.mul(a, inv), r.one)) return false;
  }
  return true;
}
