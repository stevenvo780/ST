// ============================================================
// Cubical — Álgebra del intervalo I
// ============================================================
//
// El intervalo formal I tiene dos extremos (i0, i1) y forma un
// retículo distributivo con involución 1 - (·):
//
//   0 ∧ i ≡ 0       1 ∧ i ≡ i        i ∧ j ≡ j ∧ i
//   0 ∨ i ≡ i       1 ∨ i ≡ 1        i ∨ j ≡ j ∨ i
//   1 - 0 ≡ 1       1 - 1 ≡ 0        1 - (1 - i) ≡ i
//
// `evalInterval` interpreta una expresión bajo un environment de
// asignaciones concretas {i ↦ 0 ó 1}. Cuando una variable libre del
// intervalo no está en el environment, devolvemos 'gen' (genérico).

import type { CubicalTerm } from './types';

export type IntervalValue = 0 | 1 | 'gen';

export function evalInterval(t: CubicalTerm, env: Map<string, 0 | 1> = new Map()): IntervalValue {
  switch (t.kind) {
    case 'i0':
      return 0;
    case 'i1':
      return 1;
    case 'iVar': {
      const v = env.get(t.name);
      return v === undefined ? 'gen' : v;
    }
    case 'iNeg': {
      const a = evalInterval(t.arg, env);
      if (a === 0) return 1;
      if (a === 1) return 0;
      return 'gen';
    }
    case 'iMin': {
      const l = evalInterval(t.left, env);
      const r = evalInterval(t.right, env);
      // 0 ∧ x ≡ 0
      if (l === 0 || r === 0) return 0;
      // 1 ∧ x ≡ x
      if (l === 1) return r;
      if (r === 1) return l;
      return 'gen';
    }
    case 'iMax': {
      const l = evalInterval(t.left, env);
      const r = evalInterval(t.right, env);
      // 1 ∨ x ≡ 1
      if (l === 1 || r === 1) return 1;
      // 0 ∨ x ≡ x
      if (l === 0) return r;
      if (r === 0) return l;
      return 'gen';
    }
    default:
      // No es expresión de intervalo: tratamos como genérica.
      return 'gen';
  }
}

/**
 * Normaliza algebraicamente una expresión de intervalo aplicando las
 * leyes del retículo + involución. Si la expresión colapsa a un
 * extremo, retorna i0 o i1; en caso contrario reescribe lo posible.
 * No hace simplificaciones avanzadas (idempotencia, distributividad)
 * para mantener el módulo predecible.
 */
export function normalizeInterval(t: CubicalTerm): CubicalTerm {
  switch (t.kind) {
    case 'i0':
    case 'i1':
    case 'iVar':
      return t;
    case 'iNeg': {
      const a = normalizeInterval(t.arg);
      if (a.kind === 'i0') return { kind: 'i1' };
      if (a.kind === 'i1') return { kind: 'i0' };
      // involución: ~ ~ x ≡ x
      if (a.kind === 'iNeg') return a.arg;
      return { kind: 'iNeg', arg: a };
    }
    case 'iMin': {
      const l = normalizeInterval(t.left);
      const r = normalizeInterval(t.right);
      if (l.kind === 'i0' || r.kind === 'i0') return { kind: 'i0' };
      if (l.kind === 'i1') return r;
      if (r.kind === 'i1') return l;
      return { kind: 'iMin', left: l, right: r };
    }
    case 'iMax': {
      const l = normalizeInterval(t.left);
      const r = normalizeInterval(t.right);
      if (l.kind === 'i1' || r.kind === 'i1') return { kind: 'i1' };
      if (l.kind === 'i0') return r;
      if (r.kind === 'i0') return l;
      return { kind: 'iMax', left: l, right: r };
    }
    default:
      return t;
  }
}
