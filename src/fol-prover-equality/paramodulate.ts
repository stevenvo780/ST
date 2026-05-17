import type { FOLClause, FOLTerm } from '../fol-prover/types';
import { applyClause, applyLiteral, applyTerm, unify } from '../fol-prover/unify';
import {
  allLiteralPositions,
  cloneClause,
  cloneTerm,
  freshenClause,
  isEqualityLiteral,
  literalKey,
  replaceLiteralSubterm,
  getLiteralSubterm,
  termKey,
  termsEqual,
} from './term-utils';

export interface ParamodResult {
  resolvent: FOLClause;
  substitution: Map<string, FOLTerm>;
}

/**
 * Paramodulation:
 *
 *   from C ∨ (s = t)         (eqClause, eq_idx points to the s=t literal)
 *   and  D[u]                (target clause, target_idx points to literal containing u,
 *                            target_pos points inside that literal's args)
 *   if unify(s, u) = σ then  (C ∨ D[u → t])·σ
 *
 * The direction is fixed: args[0] = s (lhs), args[1] = t (rhs). To paramodulate
 * "in the other direction" callers should retry with the equation flipped (see
 * `paramodulateAll` for the symmetric enumeration).
 *
 * Returns null when the literals can't paramodulate (wrong kind, unification fails, etc.).
 */
export function paramodulate(
  c1Raw: FOLClause,
  eq_idx: number,
  c2Raw: FOLClause,
  target_idx: number,
  target_pos: number[],
): FOLClause | null {
  const out = paramodulateWithSubst(c1Raw, eq_idx, c2Raw, target_idx, target_pos);
  return out ? out.resolvent : null;
}

export function paramodulateWithSubst(
  c1Raw: FOLClause,
  eq_idx: number,
  c2Raw: FOLClause,
  target_idx: number,
  target_pos: number[],
): ParamodResult | null {
  // Standardize variables apart between the two parents.
  const c1 = freshenClause(c1Raw);
  const c2 = freshenClause(c2Raw);

  const eqLit = c1[eq_idx];
  if (eqLit === undefined) return null;
  if (!isEqualityLiteral(eqLit)) return null;
  if (eqLit.negated) return null;

  const s = eqLit.args[0];
  const t = eqLit.args[1];
  if (s === undefined || t === undefined) return null;

  const target = c2[target_idx];
  if (target === undefined) return null;

  const u = getLiteralSubterm(target, target_pos);
  if (u === null) return null;

  // Don't try to paramodulate into a bare variable subterm — that produces
  // an explosion of useless rewrites equivalent to factoring.
  if (u.kind === 'var') return null;

  const sigma = new Map<string, FOLTerm>();
  const unified = unify(s, u, sigma);
  if (unified === null) return null;

  // Build C·σ (rest of clause 1 minus the equation literal)
  const rest1 = c1.filter((_, k) => k !== eq_idx).map((lit) => applyLiteral(lit, sigma));

  // Build the rewritten target: replace u with t at target_pos, then apply σ.
  const rewritten = replaceLiteralSubterm(target, target_pos, applyTerm(t, sigma));
  const rewrittenSigma = applyLiteral(rewritten, sigma);

  const rest2 = c2.filter((_, k) => k !== target_idx).map((lit) => applyLiteral(lit, sigma));

  const merged: FOLClause = factor([...rest1, rewrittenSigma, ...rest2]);
  return { resolvent: merged, substitution: sigma };
}

/**
 * Generate all paramodulation children between two clauses considering both directions
 * of every equality literal in either clause and every interior position of every
 * non-equality target literal in the other.
 */
export interface ParamodAllStep {
  fromEqClause: number;
  fromTargetClause: number;
  eqIdx: number;
  targetIdx: number;
  targetPos: number[];
  flipped: boolean;
  resolvent: FOLClause;
  substitution: Map<string, FOLTerm>;
}

export function paramodulateAll(
  idxA: number,
  cA: FOLClause,
  idxB: number,
  cB: FOLClause,
): ParamodAllStep[] {
  const out: ParamodAllStep[] = [];
  collectParamods(idxA, cA, idxB, cB, false, out);
  if (idxA !== idxB) collectParamods(idxB, cB, idxA, cA, false, out);
  return out;
}

function collectParamods(
  idxEq: number,
  cEq: FOLClause,
  idxTgt: number,
  cTgt: FOLClause,
  _unusedFlip: boolean,
  out: ParamodAllStep[],
): void {
  for (let i = 0; i < cEq.length; i++) {
    const lit = cEq[i];
    if (lit === undefined) continue;
    if (!isEqualityLiteral(lit) || lit.negated) continue;
    const lhs = lit.args[0];
    const rhs = lit.args[1];
    if (lhs === undefined || rhs === undefined) continue;

    for (const flip of [false, true]) {
      // Build a virtual clause where, when flip=true, the equation is t = s instead of s = t.
      const directedEq = flip
        ? cEq.map((l, k) =>
            k === i
              ? {
                  negated: l.negated,
                  predicate: l.predicate,
                  args: [cloneTerm(rhs), cloneTerm(lhs)],
                }
              : l,
          )
        : cEq;

      for (let j = 0; j < cTgt.length; j++) {
        const tgtLit = cTgt[j];
        if (tgtLit === undefined) continue;
        for (const pos of allLiteralPositions(tgtLit)) {
          const result = paramodulateWithSubst(directedEq, i, cTgt, j, pos);
          if (result === null) continue;
          out.push({
            fromEqClause: idxEq,
            fromTargetClause: idxTgt,
            eqIdx: i,
            targetIdx: j,
            targetPos: pos,
            flipped: flip,
            resolvent: result.resolvent,
            substitution: result.substitution,
          });
        }
      }
    }
  }
}

function factor(c: FOLClause): FOLClause {
  const seen = new Set<string>();
  const out: FOLClause = [];
  for (const lit of c) {
    const k = literalKey(lit);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(lit);
  }
  return out;
}

/**
 * Reflexivity resolution: drop a literal of the form ¬(t = t) from a clause.
 * Useful both during search and for proving reflexive goals.
 */
export function reflexivityResolve(c: FOLClause): FOLClause | null {
  for (let i = 0; i < c.length; i++) {
    const lit = c[i];
    if (lit === undefined) continue;
    if (!isEqualityLiteral(lit)) continue;
    if (!lit.negated) continue;
    const a = lit.args[0];
    const b = lit.args[1];
    if (a === undefined || b === undefined) continue;
    const sigma = new Map<string, FOLTerm>();
    const u = unify(a, b, sigma);
    if (u === null) continue;
    return applyClause(
      c.filter((_, k) => k !== i),
      sigma,
    );
  }
  return null;
}

/** Re-export utilities used by tests. */
export { isEqualityLiteral, termKey, termsEqual, cloneClause };
