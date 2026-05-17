// ============================================================
// ST Term Rewriting — Lexicographic Path Order (LPO)
// ============================================================
//
// LPO es una de las técnicas estándar para probar terminación de
// TRSs. Dada una precedencia >F sobre símbolos de función,
// extiende a un orden bien-fundado >LPO sobre términos.
//
// Definición (Dershowitz, 1982):
//
//   s = f(s₁..sₙ) >LPO t  sii  alguno de:
//
//   (LPO1) algún sᵢ ≥LPO t
//   (LPO2) t = g(t₁..tₘ),  f >F g,  y  s >LPO tⱼ para todo j
//   (LPO3) t = f(t₁..tₘ),  s >LPO tⱼ para todo j, y
//          (s₁..sₙ) >LPO,lex (t₁..tₘ)
//
//   Variables: x >LPO t  sii  x = t y t es variable (caso trivial).
//   En general, una variable no domina a nada que no sea ella misma.
//
// Devolvemos -1 / 0 / 1 estilo comparator:
//   -1  si t1 <LPO t2
//    0  si t1 ≡LPO t2 (estructuralmente iguales)
//   +1  si t1 >LPO t2
//   NaN (sentinel = 0 acá) si incomparables — convención: 0 también.
//
// Para diferenciar "iguales" de "incomparables" exponemos `lpoCompare`
// que devuelve `'gt' | 'lt' | 'eq' | 'inc'`. `lpo` colapsa inc→0.

import type { Term } from './types';
import { termEquals } from './term-utils';

export type LPOComparison = 'gt' | 'lt' | 'eq' | 'inc';

function precOf(name: string, precedence: Map<string, number>): number {
  return precedence.get(name) ?? 0;
}

/**
 * Comparación de precedencia de símbolos de función.
 *
 * Si ambos tienen la misma prioridad, compara por nombre para
 * romper empates de forma determinista (necesario para que LPO
 * sea total sobre términos cerrados).
 */
function compareSymbols(a: string, b: string, precedence: Map<string, number>): -1 | 0 | 1 {
  const pa = precOf(a, precedence);
  const pb = precOf(b, precedence);
  if (pa > pb) return 1;
  if (pa < pb) return -1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * LPO comparison "rica": incluye 'inc' (incomparable).
 */
export function lpoCompare(t1: Term, t2: Term, precedence: Map<string, number>): LPOComparison {
  if (termEquals(t1, t2)) return 'eq';

  // Caso variable
  if (t1.kind === 'var' && t2.kind === 'var') {
    return 'inc'; // variables distintas son incomparables
  }
  if (t1.kind === 'var') {
    // x >LPO t solo si x ocurre en t (improper subterm). Estándar:
    // x ≮LPO t para todo t excepto x. Devolvemos 'lt' si x aparece en t2.
    return occursVar(t1.name, t2) ? 'lt' : 'inc';
  }
  if (t2.kind === 'var') {
    return occursVar(t2.name, t1) ? 'gt' : 'inc';
  }

  // Ambos func: t1 = f(s₁..sₙ), t2 = g(t₁..tₘ)
  const f = t1.name;
  const g = t2.name;
  const ss = t1.args;
  const ts = t2.args;

  // (LPO1): algún sᵢ ≥LPO t2 ⇒ t1 >LPO t2
  for (const si of ss) {
    const cmp = lpoCompare(si, t2, precedence);
    if (cmp === 'gt' || cmp === 'eq') return 'gt';
  }

  // Simétrico para t2: si algún tⱼ ≥LPO t1, entonces t2 >LPO t1
  for (const tj of ts) {
    const cmp = lpoCompare(tj, t1, precedence);
    if (cmp === 'gt' || cmp === 'eq') return 'lt';
  }

  const cmpFG = compareSymbols(f, g, precedence);

  // (LPO2): f >F g y t1 >LPO tⱼ para todo j
  if (cmpFG === 1) {
    if (ts.every((tj) => lpoCompare(t1, tj, precedence) === 'gt')) return 'gt';
    return 'inc';
  }
  if (cmpFG === -1) {
    if (ss.every((si) => lpoCompare(t2, si, precedence) === 'gt')) return 'lt';
    return 'inc';
  }

  // (LPO3): f = g (mismo símbolo y misma aridad, si no son incomparables)
  if (ss.length !== ts.length) return 'inc';

  // s >LPO tⱼ para todo j
  const allGt = ts.every((tj) => lpoCompare(t1, tj, precedence) === 'gt');
  if (!allGt) {
    // chequear simétrico para 'lt'
    const allLt = ss.every((si) => lpoCompare(t2, si, precedence) === 'gt');
    if (allLt) return lexCompare(ts, ss, precedence) === 'gt' ? 'lt' : 'inc';
    return 'inc';
  }

  // Comparación lexicográfica de argumentos
  return lexCompare(ss, ts, precedence);
}

/**
 * Comparación lexicográfica de tuplas de términos.
 */
function lexCompare(ss: Term[], ts: Term[], precedence: Map<string, number>): LPOComparison {
  const n = Math.min(ss.length, ts.length);
  for (let i = 0; i < n; i++) {
    const si = ss[i];
    const ti = ts[i];
    if (si === undefined || ti === undefined) continue;
    const cmp = lpoCompare(si, ti, precedence);
    if (cmp === 'eq') continue;
    return cmp;
  }
  if (ss.length === ts.length) return 'eq';
  return ss.length > ts.length ? 'gt' : 'lt';
}

function occursVar(name: string, t: Term): boolean {
  if (t.kind === 'var') return t.name === name;
  return t.args.some((a) => occursVar(name, a));
}

/**
 * API pública compacta: devuelve -1 | 0 | 1.
 *
 *  -1 si t1 <LPO t2
 *   0 si iguales o incomparables
 *  +1 si t1 >LPO t2
 *
 * Para distinguir incomparable vs igual, usar `lpoCompare`.
 */
export function lpo(t1: Term, t2: Term, precedence: Map<string, number>): -1 | 0 | 1 {
  const r = lpoCompare(t1, t2, precedence);
  if (r === 'gt') return 1;
  if (r === 'lt') return -1;
  return 0;
}
