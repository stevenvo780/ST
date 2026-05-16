import { FOLTerm, FOLLiteral, FOLClause } from './types';

type Subst = Map<string, FOLTerm>;

export function unify(t1: FOLTerm, t2: FOLTerm, sigma?: Subst): Subst | null {
  const s: Subst = sigma ?? new Map<string, FOLTerm>();
  return unifyInto(t1, t2, s);
}

function unifyInto(t1: FOLTerm, t2: FOLTerm, s: Subst): Subst | null {
  const a = walk(t1, s);
  const b = walk(t2, s);

  if (a.kind === 'var') {
    if (b.kind === 'var' && a.name === b.name) return s;
    if (occursIn(a.name, b, s)) return null;
    s.set(a.name, b);
    return s;
  }
  if (b.kind === 'var') {
    if (occursIn(b.name, a, s)) return null;
    s.set(b.name, a);
    return s;
  }
  if (a.kind === 'const' && b.kind === 'const') {
    return a.name === b.name ? s : null;
  }
  if (a.kind === 'func' && b.kind === 'func') {
    if (a.name !== b.name) return null;
    const aa = a.args ?? [];
    const bb = b.args ?? [];
    if (aa.length !== bb.length) return null;
    for (let i = 0; i < aa.length; i++) {
      const ai = aa[i];
      const bi = bb[i];
      if (ai === undefined || bi === undefined) return null;
      const r = unifyInto(ai, bi, s);
      if (r === null) return null;
    }
    return s;
  }
  return null;
}

function walk(t: FOLTerm, s: Subst): FOLTerm {
  let cur = t;
  while (cur.kind === 'var' && s.has(cur.name)) {
    const nxt = s.get(cur.name);
    if (nxt === undefined) break;
    if (nxt === cur) break;
    cur = nxt;
  }
  return cur;
}

function occursIn(name: string, t: FOLTerm, s: Subst): boolean {
  const w = walk(t, s);
  if (w.kind === 'var') return w.name === name;
  if (w.kind === 'const') return false;
  for (const a of w.args ?? []) {
    if (occursIn(name, a, s)) return true;
  }
  return false;
}

export function applyTerm(t: FOLTerm, s: Subst): FOLTerm {
  if (t.kind === 'var') {
    const v = s.get(t.name);
    if (v === undefined) return t;
    return applyTerm(v, s);
  }
  if (t.kind === 'const') return t;
  return { kind: 'func', name: t.name, args: (t.args ?? []).map((a) => applyTerm(a, s)) };
}

export function applyLiteral(lit: FOLLiteral, s: Subst): FOLLiteral {
  return {
    negated: lit.negated,
    predicate: lit.predicate,
    args: lit.args.map((a) => applyTerm(a, s)),
  };
}

export function applyClause(c: FOLClause, s: Subst): FOLClause {
  return c.map((l) => applyLiteral(l, s));
}

export function substToRecord(s: Subst): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of s.entries()) {
    out[k] = termToShortString(v);
  }
  return out;
}

function termToShortString(t: FOLTerm): string {
  if (t.kind === 'var' || t.kind === 'const') return t.name;
  const args = (t.args ?? []).map(termToShortString).join(',');
  return `${t.name}(${args})`;
}
