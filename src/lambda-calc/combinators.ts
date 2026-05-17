// ============================================================
// λ-cálculo untyped — Combinadores clásicos
// ============================================================
//
//   I  = λx.x
//   K  = λx.λy.x
//   S  = λx.λy.λz.(xz)(yz)
//   Y  = λf.(λx.f(xx))(λx.f(xx))             (fixpoint, diverge en cbv)
//   ω  = λx.xx
//   Ω  = ωω = (λx.xx)(λx.xx)                  (canónico divergente)

import type { Term } from './types';
import { ap, apN, lam, v } from './types';

export const I: Term = lam('x', v('x'));

export const K: Term = lam('x', lam('y', v('x')));

export const S: Term = lam(
  'x',
  lam('y', lam('z', apN(v('x'), v('z'), ap(v('y'), v('z'))))),
);

// Y-combinator (Curry).
export const Y: Term = lam(
  'f',
  ap(
    lam('x', ap(v('f'), ap(v('x'), v('x')))),
    lam('x', ap(v('f'), ap(v('x'), v('x')))),
  ),
);

// ω = λx.xx
export const omegaSmall: Term = lam('x', ap(v('x'), v('x')));

// Ω = (λx.xx)(λx.xx) — diverge bajo cualquier estrategia.
export const omega: Term = ap(omegaSmall, omegaSmall);
