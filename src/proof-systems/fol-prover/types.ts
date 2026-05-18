/**
 * A first-order term: variable, constant, or function application.
 * `args` is present (and may be empty) only when `kind === 'func'`.
 */
export interface FOLTerm {
  kind: 'var' | 'const' | 'func';
  name: string;
  args?: FOLTerm[];
}

/** A first-order literal: a (possibly negated) predicate applied to terms. */
export interface FOLLiteral {
  negated: boolean;
  predicate: string;
  args: FOLTerm[];
}

/** A clause in CNF: a disjunction of literals. Empty clause represents ⊥. */
export type FOLClause = FOLLiteral[];

/** Records one resolution step: which two clauses were resolved and the result. */
export interface FOLResolutionStep {
  from: [number, number];
  resolvent: FOLClause;
  substitution: Record<string, string>;
}

/** Result returned by the FOL resolution prover. */
export interface FOLProveResult {
  proven: boolean;
  steps: FOLResolutionStep[];
  timeoutHit?: boolean;
  reason?: string;
}

/** Options controlling the FOL prover's search budget. */
export interface FOLProveOptions {
  timeoutMs?: number;
  maxSteps?: number;
}

/** Creates a variable term. */
export function mkVar(name: string): FOLTerm {
  return { kind: 'var', name };
}

/** Creates a constant term. */
export function mkConst(name: string): FOLTerm {
  return { kind: 'const', name };
}

/** Creates a function application term. */
export function mkFunc(name: string, args: FOLTerm[]): FOLTerm {
  return { kind: 'func', name, args };
}

/** Creates a literal from its negation flag, predicate name, and argument terms. */
export function mkLit(negated: boolean, predicate: string, args: FOLTerm[]): FOLLiteral {
  return { negated, predicate, args };
}

/** Renders a term as `name` (var/const) or `name(arg,...)` (func). */
export function termToString(t: FOLTerm): string {
  if (t.kind === 'var' || t.kind === 'const') return t.name;
  const args = (t.args ?? []).map(termToString).join(',');
  return `${t.name}(${args})`;
}

/** Renders a literal as `P(args)` or `¬P(args)`. */
export function literalToString(lit: FOLLiteral): string {
  const args = lit.args.map(termToString).join(',');
  const head = `${lit.predicate}(${args})`;
  return lit.negated ? `¬${head}` : head;
}

/** Renders a clause as a disjunction of literals, or `⊥` for the empty clause. */
export function clauseToString(c: FOLClause): string {
  if (c.length === 0) return '⊥';
  return c.map(literalToString).join(' ∨ ');
}
