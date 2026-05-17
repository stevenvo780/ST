// ============================================================
// ST Default Logic (Reiter) — Entailment credulous/skeptical
// ============================================================

import { DefaultTheory, Extension, ComputeOptions } from './types';
import { computeExtensions, normalizeLiteral } from './extensions';

/** Comprueba si el literal está en la extensión dada. */
export function isInExtension(formula: string, ext: Extension): boolean {
  return ext.formulas.has(normalizeLiteral(formula));
}

/**
 * Entailment escéptico: el literal está en TODAS las extensiones.
 * Si la teoría no tiene extensiones, devuelve false (entailment vacuo
 * tampoco — la convención usual es no afirmar nada sin testigos).
 */
export function isSkepticallyEntailed(
  formula: string,
  T: DefaultTheory,
  options: ComputeOptions = {},
): boolean {
  const exts = computeExtensions(T, options);
  if (exts.length === 0) return false;
  const target = normalizeLiteral(formula);
  return exts.every((e) => e.formulas.has(target));
}

/**
 * Entailment crédulo: el literal está en AL MENOS una extensión.
 */
export function isCredulouslyEntailed(
  formula: string,
  T: DefaultTheory,
  options: ComputeOptions = {},
): boolean {
  const exts = computeExtensions(T, options);
  if (exts.length === 0) return false;
  const target = normalizeLiteral(formula);
  return exts.some((e) => e.formulas.has(target));
}
