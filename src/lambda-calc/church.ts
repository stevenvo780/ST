// ============================================================
// λ-cálculo untyped — Church numerals y operaciones aritméticas
// ============================================================
//
// n̄ = λf.λx. f (f ... (f x) ... )    con n aplicaciones de f.
// 0̄ = λf.λx.x
// 1̄ = λf.λx.f x
//
// SUCC = λn.λf.λx. f (n f x)
// PLUS = λm.λn.λf.λx. m f (n f x)
// MULT = λm.λn.λf. m (n f)

import type { Term } from './types';
import { ap, apN, lam, v } from './types';
import { normalize } from './reduce';

// Codifica un natural ≥ 0 como Church numeral.
export function churchNumeral(n: number): Term {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`churchNumeral: se esperaba entero ≥ 0, recibido ${n}`);
  }
  let body: Term = v('x');
  for (let i = 0; i < n; i += 1) body = ap(v('f'), body);
  return lam('f', lam('x', body));
}

// Decodifica un Church numeral en forma normal. Devuelve null si el
// término no tiene la forma λf.λx. f^n x (módulo α). El término debe
// ser ya una forma normal — si no, normalízalo primero.
export function decodeChurch(t: Term): number | null {
  if (t.kind !== 'abs') return null;
  const fName = t.param;
  const inner = t.body;
  if (inner.kind !== 'abs') return null;
  const xName = inner.param;
  let cur: Term = inner.body;
  let n = 0;
  while (cur.kind === 'app') {
    if (cur.fn.kind !== 'var' || cur.fn.name !== fName) return null;
    cur = cur.arg;
    n += 1;
  }
  if (cur.kind !== 'var' || cur.name !== xName) return null;
  return n;
}

// Normaliza y luego decodifica. Útil para tests que computan
// `decodeChurch(churchAdd m n)`.
export function evalChurch(t: Term, maxSteps = 5000): number | null {
  const { result, terminated } = normalize(t, { maxSteps });
  if (!terminated) return null;
  return decodeChurch(result);
}

// SUCC = λn.λf.λx. f (n f x)
export const churchSucc: Term = lam(
  'n',
  lam('f', lam('x', ap(v('f'), apN(v('n'), v('f'), v('x'))))),
);

// PLUS = λm.λn.λf.λx. m f (n f x)
export const churchAdd: Term = lam(
  'm',
  lam(
    'n',
    lam('f', lam('x', apN(v('m'), v('f'), apN(v('n'), v('f'), v('x'))))),
  ),
);

// MULT = λm.λn.λf. m (n f)
export const churchMul: Term = lam(
  'm',
  lam('n', lam('f', ap(v('m'), ap(v('n'), v('f'))))),
);
