export interface FOLTerm {
  kind: 'var' | 'const' | 'func';
  name: string;
  args?: FOLTerm[];
}

export interface FOLLiteral {
  negated: boolean;
  predicate: string;
  args: FOLTerm[];
}

export type FOLClause = FOLLiteral[];

export interface FOLResolutionStep {
  from: [number, number];
  resolvent: FOLClause;
  substitution: Record<string, string>;
}

export interface FOLProveResult {
  proven: boolean;
  steps: FOLResolutionStep[];
  timeoutHit?: boolean;
  reason?: string;
}

export interface FOLProveOptions {
  timeoutMs?: number;
  maxSteps?: number;
}

export function mkVar(name: string): FOLTerm {
  return { kind: 'var', name };
}

export function mkConst(name: string): FOLTerm {
  return { kind: 'const', name };
}

export function mkFunc(name: string, args: FOLTerm[]): FOLTerm {
  return { kind: 'func', name, args };
}

export function mkLit(negated: boolean, predicate: string, args: FOLTerm[]): FOLLiteral {
  return { negated, predicate, args };
}

export function termToString(t: FOLTerm): string {
  if (t.kind === 'var' || t.kind === 'const') return t.name;
  const args = (t.args ?? []).map(termToString).join(',');
  return `${t.name}(${args})`;
}

export function literalToString(lit: FOLLiteral): string {
  const args = lit.args.map(termToString).join(',');
  const head = `${lit.predicate}(${args})`;
  return lit.negated ? `¬${head}` : head;
}

export function clauseToString(c: FOLClause): string {
  if (c.length === 0) return '⊥';
  return c.map(literalToString).join(' ∨ ');
}
