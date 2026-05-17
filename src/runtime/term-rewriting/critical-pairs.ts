// ============================================================
// ST Term Rewriting — Critical pairs
// ============================================================
//
// Un critical pair (CP) entre dos reglas l₁ → r₁ y l₂ → r₂ surge
// cuando un subtérmino no-variable de l₁ unifica con l₂. Esto
// representa dos formas distintas de reducir el mismo término, y
// si ambas convergen a la misma forma normal, las reglas son
// "join-able" en ese punto.
//
// Algoritmo (Knuth-Bendix Critical Pair Lemma):
//   Para cada posición p no-variable de l₁:
//     subterm = l₁ |_p
//     si unify(subterm, l₂) = σ existe:
//       cp₁ = σ(r₁)
//       cp₂ = σ(l₁[p ← r₂])
//       => (cp₁, cp₂) es un critical pair.
//
// El sistema es **localmente confluente** sii todos sus CPs son
// joinables (Newman's Lemma + decidible para sistemas terminantes).

import type { RewriteRule, Substitution, Term } from './types';
import { applySubst, renameVars, termEquals, unify, varsOf } from './term-utils';
import { allPositions, normalize, replaceAt, subtermAt } from './rewrite';

export interface CriticalPair {
  lhs: Term; // resultado de aplicar la regla "outer"
  rhs: Term; // resultado de aplicar la regla "inner"
  /** Reglas que originaron el par (informativo). */
  ruleOuterIndex: number;
  ruleInnerIndex: number;
}

/**
 * Calcula todos los critical pairs entre dos reglas.
 *
 * Las variables se renombran para evitar colisiones espurias
 * (la regla "outer" recibe sufijo `_o`, la inner sufijo `_i`).
 */
export function criticalPairsBetween(
  outer: RewriteRule,
  inner: RewriteRule,
  outerIdx: number,
  innerIdx: number,
): CriticalPair[] {
  const oLhs = renameVars(outer.lhs, 'o');
  const oRhs = renameVars(outer.rhs, 'o');
  const iLhs = renameVars(inner.lhs, 'i');
  const iRhs = renameVars(inner.rhs, 'i');

  const pairs: CriticalPair[] = [];
  const positions = allPositions(oLhs);

  for (const pos of positions) {
    const sub = subtermAt(oLhs, pos);
    if (sub === null) continue;
    if (sub.kind === 'var') continue; // CPs solo en posiciones no-variable

    const mgu: Substitution | null = unify(sub, iLhs);
    if (mgu === null) continue;

    // Trivial overlap: misma regla en raíz (outerIdx === innerIdx, pos = [])
    // ⇒ produce el CP (σ(rhs), σ(rhs)) que es siempre joinable. Lo omitimos.
    if (outerIdx === innerIdx && pos.length === 0) continue;

    const cpInner = applySubst(oRhs, mgu);
    const cpOuter = applySubst(replaceAt(oLhs, pos, iRhs), mgu);

    pairs.push({
      lhs: cpOuter,
      rhs: cpInner,
      ruleOuterIndex: outerIdx,
      ruleInnerIndex: innerIdx,
    });
  }

  return pairs;
}

/**
 * Critical pairs de un TRS completo: para cada par de reglas
 * (incluyendo (i, i) con i = i), calcula sus CPs.
 */
export function allCriticalPairs(rules: RewriteRule[]): CriticalPair[] {
  const out: CriticalPair[] = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = 0; j < rules.length; j++) {
      const ri = rules[i];
      const rj = rules[j];
      if (ri === undefined || rj === undefined) continue;
      out.push(...criticalPairsBetween(ri, rj, i, j));
    }
  }
  return out;
}

/**
 * Confluencia local: todos los CPs son joinables.
 *
 * Un CP (a, b) es joinable si normalize(a) = normalize(b).
 *
 * Por Newman's Lemma: terminating + locally confluent ⇒ confluent.
 * No verificamos terminación acá (eso requiere LPO/KBO/etc.).
 */
export function isConfluent(trs: { rules: RewriteRule[] }): boolean {
  const cps = allCriticalPairs(trs.rules);
  for (const cp of cps) {
    const a = normalize(cp.lhs, trs.rules);
    const b = normalize(cp.rhs, trs.rules);
    if (!termEquals(a, b)) return false;
  }
  return true;
}

/**
 * Helper: ¿la variable v aparece libre en t?
 *
 * Re-export para facilidad de imports.
 */
export function freeVarsOf(t: Term): Set<string> {
  return varsOf(t);
}
