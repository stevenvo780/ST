// ============================================================
// ST Description Logic — Negation Normal Form & hashing
// ============================================================
// Empuja ¬ hasta los átomos. Tras NNF:
//   - kind 'not' SOLO envuelve 'atomic'.
//   - 'top' / 'bottom' nunca aparecen bajo 'not' (se simplifican).
// ============================================================

import { DLConcept, TOP, BOTTOM, not, and, or, exists, forall } from './types';

export function toNNF(c: DLConcept): DLConcept {
  switch (c.kind) {
    case 'top':
    case 'bottom':
      return c;
    case 'atomic':
      return c;
    case 'and':
      return and(...(c.args || []).map(toNNF));
    case 'or':
      return or(...(c.args || []).map(toNNF));
    case 'exists':
      if (!c.role || !c.arg) throw new Error('exists sin rol o argumento');
      return exists(c.role, toNNF(c.arg));
    case 'forall':
      if (!c.role || !c.arg) throw new Error('forall sin rol o argumento');
      return forall(c.role, toNNF(c.arg));
    case 'not':
      return pushNot(c.arg);
  }
}

function pushNot(inner: DLConcept | undefined): DLConcept {
  if (!inner) throw new Error('not sin argumento');
  switch (inner.kind) {
    case 'top':
      return BOTTOM;
    case 'bottom':
      return TOP;
    case 'atomic':
      return not(inner);
    case 'not':
      // doble negación
      return toNNF(inner.arg as DLConcept);
    case 'and':
      // ¬(C ⊓ D) = ¬C ⊔ ¬D
      return or(...(inner.args || []).map((a) => pushNot(a)));
    case 'or':
      // ¬(C ⊔ D) = ¬C ⊓ ¬D
      return and(...(inner.args || []).map((a) => pushNot(a)));
    case 'exists':
      // ¬∃R.C = ∀R.¬C
      if (!inner.role) throw new Error('exists sin rol');
      return forall(inner.role, pushNot(inner.arg));
    case 'forall':
      // ¬∀R.C = ∃R.¬C
      if (!inner.role) throw new Error('forall sin rol');
      return exists(inner.role, pushNot(inner.arg));
  }
}

/**
 * Hash canónico de un concepto. Dos conceptos sintácticamente iguales
 * (módulo orden de hijos en and/or) producen el mismo hash.
 */
export function conceptHash(c: DLConcept): string {
  switch (c.kind) {
    case 'top':
      return 'T';
    case 'bottom':
      return 'F';
    case 'atomic':
      return `A:${c.name || '?'}`;
    case 'not':
      return `!(${conceptHash(c.arg as DLConcept)})`;
    case 'and': {
      const parts = (c.args || []).map(conceptHash).sort();
      return `&(${parts.join(',')})`;
    }
    case 'or': {
      const parts = (c.args || []).map(conceptHash).sort();
      return `|(${parts.join(',')})`;
    }
    case 'exists':
      return `E:${c.role || '?'}(${conceptHash(c.arg as DLConcept)})`;
    case 'forall':
      return `V:${c.role || '?'}(${conceptHash(c.arg as DLConcept)})`;
  }
}

export function conceptEqual(a: DLConcept, b: DLConcept): boolean {
  return conceptHash(a) === conceptHash(b);
}

/**
 * Render legible para tracing / mensajes.
 */
export function conceptToString(c: DLConcept): string {
  switch (c.kind) {
    case 'top':
      return '⊤';
    case 'bottom':
      return '⊥';
    case 'atomic':
      return c.name || '?';
    case 'not':
      return `¬${conceptToString(c.arg as DLConcept)}`;
    case 'and':
      return `(${(c.args || []).map(conceptToString).join(' ⊓ ')})`;
    case 'or':
      return `(${(c.args || []).map(conceptToString).join(' ⊔ ')})`;
    case 'exists':
      return `∃${c.role || '?'}.${conceptToString(c.arg as DLConcept)}`;
    case 'forall':
      return `∀${c.role || '?'}.${conceptToString(c.arg as DLConcept)}`;
  }
}
