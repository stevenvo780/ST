// ============================================================
// CTL → modal μ-calculus translator
// ============================================================
// Encoding clásico (Emerson 1990 — "Temporal and Modal Logic"):
//
//   EX φ        ≡ ◇φ
//   AX φ        ≡ □φ
//   EF φ        ≡ μX. φ ∨ ◇X
//   AF φ        ≡ μX. φ ∨ □X
//   EG φ        ≡ νX. φ ∧ ◇X
//   AG φ        ≡ νX. φ ∧ □X
//   E[φ U ψ]    ≡ μX. ψ ∨ (φ ∧ ◇X)
//   A[φ U ψ]    ≡ μX. ψ ∨ (φ ∧ □X ∧ ◇true)
//                  (la cláusula `◇true` excluye deadlocks que no han
//                   alcanzado ψ — coincide con la semántica AU clásica
//                   donde un camino debe existir hasta ψ).
//
// Para evitar capturas accidentales en fórmulas anidadas (`EF (EF p)`),
// generamos nombres de variable frescos en cada `gensym()`.
// ============================================================

import type { MuFormula } from './types';

/** Subset de CTL que el translator entiende. Reproduce la forma del AST
 *  de `src/profiles/ctl/types.ts` para que se pueda pasar tal cual. */
export type CTLLike =
  | { kind: 'atom'; name: string }
  | { kind: 'true' }
  | { kind: 'false' }
  | { kind: 'not'; arg: CTLLike }
  | { kind: 'and'; args: CTLLike[] }
  | { kind: 'or'; args: CTLLike[] }
  | { kind: 'implies'; left: CTLLike; right: CTLLike }
  | { kind: 'EX'; arg: CTLLike }
  | { kind: 'AX'; arg: CTLLike }
  | { kind: 'EF'; arg: CTLLike }
  | { kind: 'AF'; arg: CTLLike }
  | { kind: 'EG'; arg: CTLLike }
  | { kind: 'AG'; arg: CTLLike }
  | { kind: 'EU'; left: CTLLike; right: CTLLike }
  | { kind: 'AU'; left: CTLLike; right: CTLLike };

function makeGensym(): () => string {
  let n = 0;
  return () => `__X${n++}`;
}

/** Constantes ⊤/⊥ codificadas como `μX.X ∨ ¬X` evitables: usamos
 *  atoms internos siempre verdaderos/falsos vía `or`/`and` vacíos? El
 *  AST de μ no admite n-arios vacíos, así que codificamos con un
 *  binder trivial:  ⊤ ≡ νX. X ;  ⊥ ≡ μX. X. */
function muTrue(gensym: () => string): MuFormula {
  const x = gensym();
  return { kind: 'nu', bind: x, body: { kind: 'var', name: x } };
}

function muFalse(gensym: () => string): MuFormula {
  const x = gensym();
  return { kind: 'mu', bind: x, body: { kind: 'var', name: x } };
}

function bigAnd(parts: MuFormula[], gensym: () => string): MuFormula {
  if (parts.length === 0) return muTrue(gensym);
  let acc = parts[0];
  for (let i = 1; i < parts.length; i++) {
    acc = { kind: 'and', left: acc, right: parts[i] };
  }
  return acc;
}

function bigOr(parts: MuFormula[], gensym: () => string): MuFormula {
  if (parts.length === 0) return muFalse(gensym);
  let acc = parts[0];
  for (let i = 1; i < parts.length; i++) {
    acc = { kind: 'or', left: acc, right: parts[i] };
  }
  return acc;
}

function translate(phi: CTLLike, gensym: () => string): MuFormula {
  switch (phi.kind) {
    case 'atom':
      return { kind: 'atom', name: phi.name };
    case 'true':
      return muTrue(gensym);
    case 'false':
      return muFalse(gensym);
    case 'not':
      return { kind: 'not', arg: translate(phi.arg, gensym) };
    case 'and':
      return bigAnd(
        phi.args.map((a) => translate(a, gensym)),
        gensym,
      );
    case 'or':
      return bigOr(
        phi.args.map((a) => translate(a, gensym)),
        gensym,
      );
    case 'implies': {
      // p → q ≡ ¬p ∨ q
      return {
        kind: 'or',
        left: { kind: 'not', arg: translate(phi.left, gensym) },
        right: translate(phi.right, gensym),
      };
    }
    case 'EX':
      return { kind: 'diamond', arg: translate(phi.arg, gensym) };
    case 'AX':
      return { kind: 'box', arg: translate(phi.arg, gensym) };
    case 'EF': {
      const x = gensym();
      return {
        kind: 'mu',
        bind: x,
        body: {
          kind: 'or',
          left: translate(phi.arg, gensym),
          right: { kind: 'diamond', arg: { kind: 'var', name: x } },
        },
      };
    }
    case 'AF': {
      const x = gensym();
      return {
        kind: 'mu',
        bind: x,
        body: {
          kind: 'or',
          left: translate(phi.arg, gensym),
          right: { kind: 'box', arg: { kind: 'var', name: x } },
        },
      };
    }
    case 'EG': {
      const x = gensym();
      return {
        kind: 'nu',
        bind: x,
        body: {
          kind: 'and',
          left: translate(phi.arg, gensym),
          right: { kind: 'diamond', arg: { kind: 'var', name: x } },
        },
      };
    }
    case 'AG': {
      const x = gensym();
      return {
        kind: 'nu',
        bind: x,
        body: {
          kind: 'and',
          left: translate(phi.arg, gensym),
          right: { kind: 'box', arg: { kind: 'var', name: x } },
        },
      };
    }
    case 'EU': {
      // E[A U B] ≡ μX. B ∨ (A ∧ ◇X)
      const x = gensym();
      return {
        kind: 'mu',
        bind: x,
        body: {
          kind: 'or',
          left: translate(phi.right, gensym),
          right: {
            kind: 'and',
            left: translate(phi.left, gensym),
            right: { kind: 'diamond', arg: { kind: 'var', name: x } },
          },
        },
      };
    }
    case 'AU': {
      // A[A U B] ≡ μX. B ∨ (A ∧ □X ∧ ◇⊤)
      const x = gensym();
      return {
        kind: 'mu',
        bind: x,
        body: {
          kind: 'or',
          left: translate(phi.right, gensym),
          right: {
            kind: 'and',
            left: translate(phi.left, gensym),
            right: {
              kind: 'and',
              left: { kind: 'box', arg: { kind: 'var', name: x } },
              right: { kind: 'diamond', arg: muTrue(gensym) },
            },
          },
        },
      };
    }
  }
}

/**
 * Traduce una fórmula CTL a su equivalente en μ-cálculo.
 *
 * Acepta el shape estructural del AST de CTL (sin importar la fuente
 * exacta) — útil para evitar acoplamiento directo con `src/profiles/ctl`.
 */
export function ctlToMu(ctlFormula: { kind: string; [k: string]: unknown }): MuFormula {
  return translate(ctlFormula as CTLLike, makeGensym());
}
