// ============================================================
// BAN Logic — Constructores y equality de términos/fórmulas
// ============================================================

import type { BANFormula, BANTerm } from './types';

/* ── Constructores de términos ── */

export const principal = (name: string): BANTerm => ({ kind: 'principal', name });

export const key = (name: string, shared?: [string, string]): BANTerm =>
  shared ? { kind: 'key', name, shared } : { kind: 'key', name };

export const nonce = (name: string): BANTerm => ({ kind: 'nonce', name });

export const atom = (name: string): BANTerm => ({ kind: 'atom', name });

export const message = (...content: BANTerm[]): BANTerm => ({ kind: 'message', content });

export const encrypted = (msg: BANTerm, k: BANTerm): BANTerm => ({
  kind: 'encrypted',
  message: msg,
  key: k,
});

export const hashed = (msg: BANTerm): BANTerm => ({ kind: 'hashed', message: msg });

export const compound = (...parts: BANTerm[]): BANTerm => ({ kind: 'compound', parts });

/* ── Constructores de fórmulas ── */

export const believes = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'believes',
  principal: p,
  about: f,
});

export const sees = (p: BANTerm, w: BANTerm): BANFormula => ({
  kind: 'sees',
  principal: p,
  what: w,
});

export const said = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'said',
  principal: p,
  what: f,
});

export const saidMessage = (p: BANTerm, w: BANTerm): BANFormula => ({
  kind: 'said-message',
  principal: p,
  what: w,
});

export const jurisdiction = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'jurisdiction',
  principal: p,
  over: f,
});

export const fresh = (w: BANTerm): BANFormula => ({ kind: 'fresh', what: w });

export const sharedKey = (a: BANTerm, b: BANTerm, k: BANTerm): BANFormula => ({
  kind: 'sharedKey',
  a,
  b,
  key: k,
});

export const publicKey = (p: BANTerm, k: BANTerm): BANFormula => ({
  kind: 'publicKey',
  principal: p,
  key: k,
});

export const sharedSecret = (a: BANTerm, b: BANTerm, s: BANTerm): BANFormula => ({
  kind: 'sharedSecret',
  a,
  b,
  secret: s,
});

export const controls = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'controls',
  principal: p,
  statement: f,
});

export const formulaAnd = (left: BANFormula, right: BANFormula): BANFormula => ({
  kind: 'formula-and',
  left,
  right,
});

/* ── Igualdad estructural ── */

export function termEquals(a: BANTerm, b: BANTerm): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'principal':
    case 'nonce':
    case 'atom':
      // narrow b to a kind with .name
      return (b as { name: string }).name === a.name;
    case 'key': {
      const bk = b as Extract<BANTerm, { kind: 'key' }>;
      if (bk.name !== a.name) return false;
      const as = a.shared;
      const bs = bk.shared;
      if (!as && !bs) return true;
      if (!as || !bs) return false;
      // Shared pair es bi-direccional: {A,B} == {B,A}.
      return (as[0] === bs[0] && as[1] === bs[1]) || (as[0] === bs[1] && as[1] === bs[0]);
    }
    case 'message': {
      const bm = b as Extract<BANTerm, { kind: 'message' }>;
      if (a.content.length !== bm.content.length) return false;
      for (let i = 0; i < a.content.length; i++) {
        const ai = a.content[i];
        const bi = bm.content[i];
        if (!ai || !bi) return false;
        if (!termEquals(ai, bi)) return false;
      }
      return true;
    }
    case 'compound': {
      const bc = b as Extract<BANTerm, { kind: 'compound' }>;
      if (a.parts.length !== bc.parts.length) return false;
      for (let i = 0; i < a.parts.length; i++) {
        const ai = a.parts[i];
        const bi = bc.parts[i];
        if (!ai || !bi) return false;
        if (!termEquals(ai, bi)) return false;
      }
      return true;
    }
    case 'encrypted': {
      const be = b as Extract<BANTerm, { kind: 'encrypted' }>;
      return termEquals(a.message, be.message) && termEquals(a.key, be.key);
    }
    case 'hashed': {
      const bh = b as Extract<BANTerm, { kind: 'hashed' }>;
      return termEquals(a.message, bh.message);
    }
  }
}

export function formulaEquals(a: BANFormula, b: BANFormula): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'believes': {
      const bb = b as Extract<BANFormula, { kind: 'believes' }>;
      return termEquals(a.principal, bb.principal) && formulaEquals(a.about, bb.about);
    }
    case 'sees': {
      const bs = b as Extract<BANFormula, { kind: 'sees' }>;
      return termEquals(a.principal, bs.principal) && termEquals(a.what, bs.what);
    }
    case 'said': {
      const bs = b as Extract<BANFormula, { kind: 'said' }>;
      return termEquals(a.principal, bs.principal) && formulaEquals(a.what, bs.what);
    }
    case 'said-message': {
      const bs = b as Extract<BANFormula, { kind: 'said-message' }>;
      return termEquals(a.principal, bs.principal) && termEquals(a.what, bs.what);
    }
    case 'jurisdiction': {
      const bj = b as Extract<BANFormula, { kind: 'jurisdiction' }>;
      return termEquals(a.principal, bj.principal) && formulaEquals(a.over, bj.over);
    }
    case 'fresh': {
      const bf = b as Extract<BANFormula, { kind: 'fresh' }>;
      return termEquals(a.what, bf.what);
    }
    case 'sharedKey': {
      const bs = b as Extract<BANFormula, { kind: 'sharedKey' }>;
      // El predicado "A ↔K B" es simétrico en (A,B).
      const ab = termEquals(a.a, bs.a) && termEquals(a.b, bs.b);
      const ba = termEquals(a.a, bs.b) && termEquals(a.b, bs.a);
      return (ab || ba) && termEquals(a.key, bs.key);
    }
    case 'publicKey': {
      const bp = b as Extract<BANFormula, { kind: 'publicKey' }>;
      return termEquals(a.principal, bp.principal) && termEquals(a.key, bp.key);
    }
    case 'sharedSecret': {
      const bs = b as Extract<BANFormula, { kind: 'sharedSecret' }>;
      const ab = termEquals(a.a, bs.a) && termEquals(a.b, bs.b);
      const ba = termEquals(a.a, bs.b) && termEquals(a.b, bs.a);
      return (ab || ba) && termEquals(a.secret, bs.secret);
    }
    case 'controls': {
      const bc = b as Extract<BANFormula, { kind: 'controls' }>;
      return termEquals(a.principal, bc.principal) && formulaEquals(a.statement, bc.statement);
    }
    case 'formula-and': {
      const ba = b as Extract<BANFormula, { kind: 'formula-and' }>;
      return formulaEquals(a.left, ba.left) && formulaEquals(a.right, ba.right);
    }
  }
}

export function hasFormula(state: ReadonlyArray<BANFormula>, target: BANFormula): boolean {
  return state.some((f) => formulaEquals(f, target));
}

/* ── Pretty printing ── */

export function termToString(t: BANTerm): string {
  switch (t.kind) {
    case 'principal':
    case 'nonce':
    case 'atom':
      return t.name;
    case 'key':
      return t.shared ? `K_${t.shared[0]}${t.shared[1]}` : t.name;
    case 'message':
      return `<${t.content.map(termToString).join(', ')}>`;
    case 'compound':
      return `(${t.parts.map(termToString).join(' · ')})`;
    case 'encrypted':
      return `{${termToString(t.message)}}_${termToString(t.key)}`;
    case 'hashed':
      return `H(${termToString(t.message)})`;
  }
}

export function formulaToString(f: BANFormula): string {
  switch (f.kind) {
    case 'believes':
      return `${termToString(f.principal)} |≡ ${formulaToString(f.about)}`;
    case 'sees':
      return `${termToString(f.principal)} ◁ ${termToString(f.what)}`;
    case 'said':
      return `${termToString(f.principal)} |~ ${formulaToString(f.what)}`;
    case 'said-message':
      return `${termToString(f.principal)} |~ ${termToString(f.what)}`;
    case 'jurisdiction':
      return `${termToString(f.principal)} |⇒ ${formulaToString(f.over)}`;
    case 'fresh':
      return `#(${termToString(f.what)})`;
    case 'sharedKey':
      return `${termToString(f.a)} ↔${termToString(f.key)} ${termToString(f.b)}`;
    case 'publicKey':
      return `|→${termToString(f.key)} ${termToString(f.principal)}`;
    case 'sharedSecret':
      return `${termToString(f.a)} ⇌${termToString(f.secret)} ${termToString(f.b)}`;
    case 'controls':
      return `${termToString(f.principal)} |⇒ ${formulaToString(f.statement)}`;
    case 'formula-and':
      return `(${formulaToString(f.left)}) ∧ (${formulaToString(f.right)})`;
  }
}
