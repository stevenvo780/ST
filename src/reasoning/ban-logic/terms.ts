// ============================================================
// BAN Logic — Constructores y equality de términos/fórmulas
// ============================================================

import type { BANFormula, BANTerm } from './types';

/* ── Constructores de términos ── */

/** Crea un principal BAN: agente con identidad nominal (e.g. Alice, Bob). */
export const principal = (name: string): BANTerm => ({ kind: 'principal', name });

/** Crea una clave BAN. Si `shared` = [A, B], representa la clave simétrica K_{AB} (= K_{BA}). */
export const key = (name: string, shared?: [string, string]): BANTerm =>
  shared ? { kind: 'key', name, shared } : { kind: 'key', name };

/** Crea un nonce BAN (número usado una vez, evidencia de frescura). */
export const nonce = (name: string): BANTerm => ({ kind: 'nonce', name });

/** Crea un átomo BAN (valor opaco / constante del dominio de mensajes). */
export const atom = (name: string): BANTerm => ({ kind: 'atom', name });

/** Crea un mensaje BAN compuesto de una lista de sub-términos. */
export const message = (...content: BANTerm[]): BANTerm => ({ kind: 'message', content });

/** Crea un término cifrado `{msg}_k`: el mensaje `msg` bajo la clave `k`. */
export const encrypted = (msg: BANTerm, k: BANTerm): BANTerm => ({
  kind: 'encrypted',
  message: msg,
  key: k,
});

/** Crea un término hasheado `H(msg)`. */
export const hashed = (msg: BANTerm): BANTerm => ({ kind: 'hashed', message: msg });

/** Crea un término compuesto de partes (concatenación de mensajes). */
export const compound = (...parts: BANTerm[]): BANTerm => ({ kind: 'compound', parts });

/* ── Constructores de fórmulas ── */

/** `p |≡ f` — el principal `p` cree la fórmula `f`. */
export const believes = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'believes',
  principal: p,
  about: f,
});

/** `p ◁ w` — el principal `p` ve el término `w` (lo recibió en el mensaje). */
export const sees = (p: BANTerm, w: BANTerm): BANFormula => ({
  kind: 'sees',
  principal: p,
  what: w,
});

/** `p |~ f` — el principal `p` alguna vez dijo la fórmula `f`. */
export const said = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'said',
  principal: p,
  what: f,
});

/** `p |~ w` — el principal `p` alguna vez dijo el mensaje `w`. */
export const saidMessage = (p: BANTerm, w: BANTerm): BANFormula => ({
  kind: 'said-message',
  principal: p,
  what: w,
});

/** `p |⇒ f` — el principal `p` tiene jurisdicción sobre la fórmula `f`. */
export const jurisdiction = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'jurisdiction',
  principal: p,
  over: f,
});

/** `#(w)` — el término `w` es fresco (generado en esta sesión de protocolo). */
export const fresh = (w: BANTerm): BANFormula => ({ kind: 'fresh', what: w });

/** `a ↔K b` — `k` es la clave compartida entre los agentes `a` y `b` (simétrico). */
export const sharedKey = (a: BANTerm, b: BANTerm, k: BANTerm): BANFormula => ({
  kind: 'sharedKey',
  a,
  b,
  key: k,
});

/** `|→k p` — `k` es la clave pública del principal `p`. */
export const publicKey = (p: BANTerm, k: BANTerm): BANFormula => ({
  kind: 'publicKey',
  principal: p,
  key: k,
});

/** `a ⇌s b` — `s` es el secreto compartido entre los agentes `a` y `b` (simétrico). */
export const sharedSecret = (a: BANTerm, b: BANTerm, s: BANTerm): BANFormula => ({
  kind: 'sharedSecret',
  a,
  b,
  secret: s,
});

/** `p |⇒ f` — el principal `p` controla (tiene autoridad sobre) la fórmula `f`. */
export const controls = (p: BANTerm, f: BANFormula): BANFormula => ({
  kind: 'controls',
  principal: p,
  statement: f,
});

/** Conjunción de dos fórmulas BAN: `left ∧ right`. */
export const formulaAnd = (left: BANFormula, right: BANFormula): BANFormula => ({
  kind: 'formula-and',
  left,
  right,
});

/* ── Igualdad estructural ── */

/** Igualdad estructural entre dos términos BAN. Las claves compartidas son simétricas: K_{AB} = K_{BA}. */
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

/** Igualdad estructural entre dos fórmulas BAN. Los predicados sharedKey y sharedSecret son simétricos en sus agentes. */
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

/** Comprueba si `target` está en la lista de fórmulas BAN `state` (usando igualdad estructural). */
export function hasFormula(state: ReadonlyArray<BANFormula>, target: BANFormula): boolean {
  return state.some((f) => formulaEquals(f, target));
}

/* ── Pretty printing ── */

/** Serializa un término BAN a su representación textual estándar. */
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

/** Serializa una fórmula BAN a su representación textual estándar. */
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
