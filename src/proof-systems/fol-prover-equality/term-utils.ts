import type { FOLClause, FOLLiteral, FOLTerm } from '../fol-prover/types';
import { EQ_PREDICATE } from './types';

/** Returns `true` when `lit` is an equality literal (predicate `=` with exactly 2 args). */
export function isEqualityLiteral(lit: FOLLiteral): boolean {
  return lit.predicate === EQ_PREDICATE && lit.args.length === 2;
}

/**
 * Produces a canonical string key for a term, suitable for equality checks and
 * set membership. Variables are prefixed with `?`, constants with `#`,
 * functions use `name(arg,arg,...)`.
 */
export function termKey(t: FOLTerm): string {
  if (t.kind === 'var') return `?${t.name}`;
  if (t.kind === 'const') return `#${t.name}`;
  return `${t.name}(${(t.args ?? []).map(termKey).join(',')})`;
}

/**
 * Produces a canonical string key for a literal.
 * Negated literals are prefixed with `!`.
 */
export function literalKey(lit: FOLLiteral): string {
  const args = lit.args.map(termKey).join(',');
  return `${lit.negated ? '!' : ''}${lit.predicate}(${args})`;
}

/**
 * Produces a canonical string key for a clause by sorting its literal keys.
 * Suitable for deduplication of resolved clauses.
 */
export function clauseKey(c: FOLClause): string {
  return c.map(literalKey).sort().join('|');
}

/** Returns `true` when two terms are structurally equal (via their canonical keys). */
export function termsEqual(a: FOLTerm, b: FOLTerm): boolean {
  return termKey(a) === termKey(b);
}

/** Returns a deep copy of a term. */
export function cloneTerm(t: FOLTerm): FOLTerm {
  if (t.kind === 'var') return { kind: 'var', name: t.name };
  if (t.kind === 'const') return { kind: 'const', name: t.name };
  return { kind: 'func', name: t.name, args: (t.args ?? []).map(cloneTerm) };
}

/** Returns a deep copy of a literal, cloning all argument terms. */
export function cloneLiteral(lit: FOLLiteral): FOLLiteral {
  return {
    negated: lit.negated,
    predicate: lit.predicate,
    args: lit.args.map(cloneTerm),
  };
}

/** Returns a deep copy of a clause (array of literals). */
export function cloneClause(c: FOLClause): FOLClause {
  return c.map(cloneLiteral);
}

/**
 * Counts the number of nodes in the term tree (variables and constants count as 1,
 * function nodes add 1 plus the size of each argument).
 */
export function termSize(t: FOLTerm): number {
  if (t.kind === 'var') return 1;
  if (t.kind === 'const') return 1;
  let n = 1;
  for (const a of t.args ?? []) n += termSize(a);
  return n;
}

/**
 * Accumulates all variable names reachable from `t` into `out`.
 * @param t - The term to inspect.
 * @param out - Set that receives variable names (mutated in place).
 */
export function collectVars(t: FOLTerm, out: Set<string>): void {
  if (t.kind === 'var') {
    out.add(t.name);
    return;
  }
  if (t.kind === 'const') return;
  for (const a of t.args ?? []) collectVars(a, out);
}

/** Returns the set of variable names that appear anywhere in `t`. */
export function termVars(t: FOLTerm): Set<string> {
  const out = new Set<string>();
  collectVars(t, out);
  return out;
}

/**
 * Returns the subterm of `t` at the given position. Position [] returns t itself;
 * position [i, j, ...] descends into args[i], then args[j], etc.
 */
export function termAt(t: FOLTerm, pos: number[]): FOLTerm | null {
  let cur: FOLTerm = t;
  for (const idx of pos) {
    if (cur.kind === 'var' || cur.kind === 'const') return null;
    const args = cur.args ?? [];
    if (idx < 0 || idx >= args.length) return null;
    const nxt = args[idx];
    if (nxt === undefined) return null;
    cur = nxt;
  }
  return cur;
}

/**
 * Returns a new term equal to `t` but with the subterm at `pos` replaced by `replacement`.
 * If pos is invalid returns `t` unchanged.
 */
export function replaceAt(t: FOLTerm, pos: number[], replacement: FOLTerm): FOLTerm {
  if (pos.length === 0) return cloneTerm(replacement);
  if (t.kind === 'var' || t.kind === 'const') return cloneTerm(t);
  const [head, ...rest] = pos;
  if (head === undefined) return cloneTerm(t);
  const args = (t.args ?? []).slice();
  const child = args[head];
  if (child === undefined) return cloneTerm(t);
  args[head] = replaceAt(child, rest, replacement);
  return { kind: 'func', name: t.name, args };
}

/**
 * Enumerate every (non-empty) position inside the term tree, including the root.
 * Variables and constants only yield their own position; functions also yield children.
 */
export function allPositions(t: FOLTerm): number[][] {
  const out: number[][] = [[]];
  if (t.kind === 'func') {
    const args = t.args ?? [];
    for (let i = 0; i < args.length; i++) {
      const child = args[i];
      if (child === undefined) continue;
      for (const p of allPositions(child)) {
        out.push([i, ...p]);
      }
    }
  }
  return out;
}

/**
 * Enumerate positions for a literal as (argIndex, ...termPath). Useful for paramodulation
 * targets that point inside a literal's args.
 */
export function allLiteralPositions(lit: FOLLiteral): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < lit.args.length; i++) {
    const a = lit.args[i];
    if (a === undefined) continue;
    for (const p of allPositions(a)) {
      out.push([i, ...p]);
    }
  }
  return out;
}

/**
 * Returns the subterm of `lit` addressed by `pos`, where `pos[0]` selects the
 * argument index and the remaining path descends into that term.
 * Returns `null` if the position is out of range or empty.
 */
export function getLiteralSubterm(lit: FOLLiteral, pos: number[]): FOLTerm | null {
  if (pos.length === 0) return null;
  const [head, ...rest] = pos;
  if (head === undefined) return null;
  const arg = lit.args[head];
  if (arg === undefined) return null;
  return termAt(arg, rest);
}

/**
 * Returns a new literal with the subterm at `pos` replaced by `replacement`.
 * `pos[0]` selects the argument; remaining path is forwarded to `replaceAt`.
 * Returns a clone of `lit` unchanged if `pos` is empty or invalid.
 */
export function replaceLiteralSubterm(
  lit: FOLLiteral,
  pos: number[],
  replacement: FOLTerm,
): FOLLiteral {
  if (pos.length === 0) return cloneLiteral(lit);
  const [head, ...rest] = pos;
  if (head === undefined) return cloneLiteral(lit);
  const args = lit.args.slice();
  const target = args[head];
  if (target === undefined) return cloneLiteral(lit);
  args[head] = replaceAt(target, rest, replacement);
  return { negated: lit.negated, predicate: lit.predicate, args };
}

/**
 * Lexicographic path ordering–ish comparison used for orienting equations and
 * for selecting which side rewrites the other in demodulation. Strictly compares
 * (size, then key) so that the "bigger" term is rewritten into the "smaller" one.
 */
export function compareTerms(a: FOLTerm, b: FOLTerm): number {
  const sa = termSize(a);
  const sb = termSize(b);
  if (sa !== sb) return sa - sb;
  const ka = termKey(a);
  const kb = termKey(b);
  if (ka < kb) return -1;
  if (ka > kb) return 1;
  return 0;
}

let GLOBAL_RENAME = 0;

/**
 * Returns a copy of `c` with every variable renamed to a globally unique name,
 * preventing variable-capture during paramodulation/resolution with other clauses.
 */
export function freshenClause(c: FOLClause): FOLClause {
  const suffix = `_eq${GLOBAL_RENAME++}`;
  const seen = new Map<string, string>();
  const rename = (t: FOLTerm): FOLTerm => {
    if (t.kind === 'var') {
      let nn = seen.get(t.name);
      if (nn === undefined) {
        nn = `${t.name}${suffix}`;
        seen.set(t.name, nn);
      }
      return { kind: 'var', name: nn };
    }
    if (t.kind === 'const') return { kind: 'const', name: t.name };
    return { kind: 'func', name: t.name, args: (t.args ?? []).map(rename) };
  };
  return c.map((lit) => ({
    negated: lit.negated,
    predicate: lit.predicate,
    args: lit.args.map(rename),
  }));
}

/**
 * Converts a substitution Map to a plain Record, deep-cloning each term.
 * Useful for serialization and interop with result types that expect plain objects.
 */
export function substToRecordTerm(s: Map<string, FOLTerm>): Record<string, FOLTerm> {
  const out: Record<string, FOLTerm> = {};
  for (const [k, v] of s.entries()) out[k] = cloneTerm(v);
  return out;
}
