import type { Formula } from '../../types';
import type { FOLClause, FOLLiteral, FOLTerm } from '../fol-prover/types';
import { toCNF } from '../fol-prover/cnf';
import { resolveWithRecord } from '../fol-prover/resolve';
import { applyTerm, unify } from '../fol-prover/unify';
import { paramodulateAll } from './paramodulate';
import { equalityFactor } from './demodulate';
import { clauseKey, isEqualityLiteral, substToRecordTerm, termsEqual } from './term-utils';
import type { EqualityProveOptions, EqualityProveResult, EqualityProveStep } from './types';
import { EQ_PREDICATE } from './types';

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_MAX_STEPS = 5000;

/**
 * Translate the FOL Formula's `equals` kind to our internal equality predicate.
 * Currently the project's CNF pipeline does not natively know about `equals`; it
 * would turn an `equals(t1, t2)` formula into a predicate literal with two
 * parameters by name. To bring it into the equality prover we walk the Formula
 * tree and rewrite any `equals` node into a `predicate` with the special name
 * `__eq__` whose params are the term strings — but since the existing CNF only
 * supports name-based terms, we explicitly construct the FOLClause for the goal
 * and premises that contain equality.
 *
 * Strategy: parse premises and goal via the usual `toCNF`. After CNF, walk every
 * literal and rewrite predicates that look like equalities into the canonical
 * `__eq__(arg0, arg1)` form. The user-facing convention is: any literal of the
 * form `equals(a, b)` (either as a predicate named "equals", "=", or "eq") is
 * treated as an equality.
 */

const EQUALITY_ALIASES = new Set(['equals', '=', 'eq', '==']);

function rewriteEqualityLiteral(lit: FOLLiteral): FOLLiteral {
  if (EQUALITY_ALIASES.has(lit.predicate) && lit.args.length === 2) {
    return { negated: lit.negated, predicate: EQ_PREDICATE, args: lit.args };
  }
  return lit;
}

function rewriteEqualityClause(c: FOLClause): FOLClause {
  return c.map(rewriteEqualityLiteral);
}

function preprocessFormula(f: Formula): Formula {
  if (f.kind === 'equals') {
    const params = (f.params ?? f.terms ?? []).slice();
    const newF: Formula = { kind: 'predicate', name: '=', params, terms: params };
    if (f.args !== undefined) newF.args = f.args.map(preprocessFormula);
    return newF;
  }
  if (f.args === undefined) return f;
  return { ...f, args: f.args.map(preprocessFormula) };
}

function reflexivityClauses(): FOLClause[] {
  // The axiom ∀x. x = x  →  CNF clause  __eq__(x, x)
  return [
    [
      {
        negated: false,
        predicate: EQ_PREDICATE,
        args: [
          { kind: 'var', name: '__refl_x' },
          { kind: 'var', name: '__refl_x' },
        ],
      },
    ],
  ];
}

function isTautology(c: FOLClause): boolean {
  // Standard tautology: P and ¬P with identical args.
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) {
      const li = c[i];
      const lj = c[j];
      if (li === undefined || lj === undefined) continue;
      if (li.negated === lj.negated) continue;
      if (li.predicate !== lj.predicate) continue;
      if (li.args.length !== lj.args.length) continue;
      let same = true;
      for (let k = 0; k < li.args.length; k++) {
        const a = li.args[k];
        const b = lj.args[k];
        if (a === undefined || b === undefined) {
          same = false;
          break;
        }
        if (!termsEqual(a, b)) {
          same = false;
          break;
        }
      }
      if (same) return true;
    }
  }
  // Reflexive tautology: positive __eq__(t, t).
  for (const lit of c) {
    if (!isEqualityLiteral(lit) || lit.negated) continue;
    const a = lit.args[0];
    const b = lit.args[1];
    if (a === undefined || b === undefined) continue;
    if (termsEqual(a, b)) return true;
  }
  return false;
}

function reflexivityResolveStep(
  c: FOLClause,
): { clause: FOLClause; sigma: Map<string, FOLTerm> } | null {
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
    const rest = c
      .filter((_, k) => k !== i)
      .map((l) => ({
        negated: l.negated,
        predicate: l.predicate,
        args: l.args.map((t) => applyTerm(t, sigma)),
      }));
    return { clause: rest, sigma };
  }
  return null;
}

export function proveWithEquality(
  premises: Formula[],
  goal: Formula,
  opts: EqualityProveOptions = {},
): EqualityProveResult {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;

  // Rewrite `equals` nodes so CNF treats them as binary predicates we can recognise.
  const preProcessedPremises = premises.map(preprocessFormula);
  const preGoal = preprocessFormula(goal);

  const rawPremiseClauses = preProcessedPremises.flatMap((p) => toCNF(p));
  const negatedGoal: Formula = { kind: 'not', args: [preGoal] };
  const rawNegGoalClauses = toCNF(negatedGoal);

  const premiseClauses = rawPremiseClauses.map(rewriteEqualityClause);
  const negGoalClauses = rawNegGoalClauses.map(rewriteEqualityClause);

  if (premiseClauses.some((c) => c.length === 0) || negGoalClauses.some((c) => c.length === 0)) {
    return { proven: true, steps: [] };
  }

  const all: FOLClause[] = [];
  const seen = new Set<string>();

  const addClause = (c: FOLClause): { idx: number; novel: boolean } => {
    if (isTautology(c)) return { idx: -1, novel: false };
    const key = clauseKey(c);
    const existingIdx = all.findIndex((existing) => clauseKey(existing) === key);
    if (existingIdx >= 0) return { idx: existingIdx, novel: false };
    seen.add(key);
    all.push(c);
    return { idx: all.length - 1, novel: true };
  };

  // Seed: reflexivity axiom (used by paramodulation when a clause demands x = x).
  for (const c of reflexivityClauses()) addClause(c);
  for (const c of premiseClauses) addClause(c);
  for (const c of negGoalClauses) addClause(c);

  const steps: EqualityProveStep[] = [];
  const startedAt = Date.now();

  const finishSuccess = (): EqualityProveResult => ({ proven: true, steps });

  // Saturation loop: classic given-clause-ish. For each new clause, try resolution
  // and paramodulation with every older clause; apply reflexivity resolution and
  // equality factoring inline.
  let cursor = 0;

  while (cursor < all.length) {
    if (Date.now() - startedAt > timeoutMs) {
      return { proven: false, steps, timeoutHit: true };
    }
    if (steps.length >= maxSteps) {
      return { proven: false, steps, reason: 'max-steps' };
    }
    const ci = all[cursor];
    if (ci === undefined) {
      cursor++;
      continue;
    }

    // Reflexivity resolution on the current clause itself.
    {
      const r = reflexivityResolveStep(ci);
      if (r !== null) {
        if (r.clause.length === 0) {
          steps.push({
            rule: 'reflex',
            from: [cursor],
            result: r.clause,
            substitution: substToRecordTerm(r.sigma),
          });
          return finishSuccess();
        }
        const { idx, novel } = addClause(r.clause);
        if (novel && idx >= 0) {
          steps.push({
            rule: 'reflex',
            from: [cursor],
            result: r.clause,
            substitution: substToRecordTerm(r.sigma),
          });
        }
      }
    }

    // Equality factoring on the current clause.
    for (const factored of equalityFactor(ci)) {
      const { idx, novel } = addClause(factored);
      if (novel && idx >= 0) {
        steps.push({
          rule: 'factor',
          from: [cursor],
          result: factored,
          substitution: {},
        });
        if (factored.length === 0) return finishSuccess();
      }
      if (steps.length >= maxSteps) return { proven: false, steps, reason: 'max-steps' };
    }

    for (let j = 0; j <= cursor; j++) {
      if (Date.now() - startedAt > timeoutMs) {
        return { proven: false, steps, timeoutHit: true };
      }
      const cj = all[j];
      if (cj === undefined) continue;

      // --- Binary resolution
      const resolvents = resolveWithRecord({ c1Idx: cursor, c2Idx: j, c1: ci, c2: cj });
      for (const r of resolvents) {
        if (r.resolvent.length === 0) {
          steps.push({
            rule: 'resolve',
            from: [cursor, j],
            result: r.resolvent,
            substitution: {},
          });
          return finishSuccess();
        }
        const { idx, novel } = addClause(r.resolvent);
        if (novel && idx >= 0) {
          steps.push({
            rule: 'resolve',
            from: [cursor, j],
            result: r.resolvent,
            substitution: {},
          });
          if (steps.length >= maxSteps) return { proven: false, steps, reason: 'max-steps' };
        }
      }

      // --- Paramodulation in both directions
      const paramods = paramodulateAll(cursor, ci, j, cj);
      for (const p of paramods) {
        if (p.resolvent.length === 0) {
          steps.push({
            rule: 'paramod',
            from: [p.fromEqClause, p.fromTargetClause],
            result: p.resolvent,
            substitution: substToRecordTerm(p.substitution),
          });
          return finishSuccess();
        }
        // Apply reflexivity resolution to the paramodulant before adding; this
        // catches the common pattern where paramod produces e.g. ¬(a = a) ∨ ...
        let toAdd = p.resolvent;
        const reflexed = reflexivityResolveStep(toAdd);
        if (reflexed !== null) toAdd = reflexed.clause;
        if (toAdd.length === 0) {
          steps.push({
            rule: 'paramod',
            from: [p.fromEqClause, p.fromTargetClause],
            result: toAdd,
            substitution: substToRecordTerm(p.substitution),
          });
          return finishSuccess();
        }
        const { idx, novel } = addClause(toAdd);
        if (novel && idx >= 0) {
          steps.push({
            rule: 'paramod',
            from: [p.fromEqClause, p.fromTargetClause],
            result: toAdd,
            substitution: substToRecordTerm(p.substitution),
          });
          if (steps.length >= maxSteps) return { proven: false, steps, reason: 'max-steps' };
        }
      }
    }
    cursor++;
  }

  return { proven: false, steps, reason: 'saturated' };
}

// Re-export the clause helper for convenience; some tests construct clauses directly.
export { rewriteEqualityClause };
