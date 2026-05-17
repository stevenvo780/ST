// ============================================================
// MLTT — Inferencia / chequeo de tipos bidireccional simplificado
// ============================================================
//
// Reglas implementadas (informalmente):
//
//   ── (Var)
//   Γ, x : A ⊢ x : A
//
//   ── (Universe)        Type i : Type (i+1)
//
//   Γ ⊢ A : Type i    Γ, x : A ⊢ B : Type j
//   ── (Π-form)        Π (x : A). B : Type max(i,j)
//
//   Γ, x : A ⊢ M : B
//   ── (Π-intro)         λ (x : A). M : Π (x : A). B
//
//   Γ ⊢ f : Π (x : A). B    Γ ⊢ a : A
//   ── (Π-elim)             f a : B[a/x]
//
//   Γ ⊢ A : Type i   Γ, x : A ⊢ B : Type j
//   ── (Σ-form)            Σ (x : A). B : Type max(i,j)
//
//   Γ ⊢ a : A   Γ ⊢ b : B[a/x]   (Σ (x : A). B)
//   ── (Σ-intro)              ⟨a,b⟩ : Σ (x:A). B
//   * Simplificación: como `pair` no lleva anotación del Σ esperado,
//     en inferencia devolvemos `Σ (_ : A). B` con B independiente
//     (igual al tipo inferido para `b`). Para Σ dependiente se debe
//     usar `checkType` con el Σ esperado.
//
//   Γ ⊢ p : Σ (x : A). B
//   ── (Σ-elim-1)             fst p : A
//   ── (Σ-elim-2)             snd p : B[fst p / x]
//
//   Γ ⊢ A : Type i   Γ ⊢ a : A   Γ ⊢ b : A
//   ── (Id-form)              Id(A, a, b) : Type i
//
//   Γ ⊢ a : A
//   ── (Id-intro)             refl(a) : Id(A, a, a)
//
//   ── (Nat)                  Nat : Type 0
//   ── (zero)                 zero : Nat
//   Γ ⊢ n : Nat
//   ── (succ)                 succ n : Nat

import type { MLTTTerm } from './types';
import { termToString, mUniverse, mNat } from './types';
import { substitute } from './substitute';
import { normalize } from './normalize';
import { alphaBetaEq } from './equality';

export type InferContext = Map<string, MLTTTerm>;
export type InferResult = MLTTTerm | { error: string };

export function isInferError(r: InferResult): r is { error: string } {
  return typeof r === 'object' && r !== null && 'error' in r && typeof r.error === 'string';
}

const emptyCtx = (): InferContext => new Map();

/** Infiere el tipo de `term` o devuelve un error legible. */
export function inferType(term: MLTTTerm, ctx: InferContext = emptyCtx()): InferResult {
  switch (term.kind) {
    case 'var': {
      const t = ctx.get(term.name);
      if (!t) return { error: `variable libre sin tipo en contexto: '${term.name}'` };
      return t;
    }
    case 'universe':
      return mUniverse(term.level + 1);
    case 'nat':
      return mUniverse(0);
    case 'zero':
      return mNat();
    case 'succ': {
      const argT = inferType(term.arg, ctx);
      if (isInferError(argT)) return argT;
      if (!isNat(argT)) {
        return { error: `succ espera Nat, recibí: ${termToString(argT)}` };
      }
      return mNat();
    }
    case 'pi': {
      const domT = inferType(term.domain, ctx);
      if (isInferError(domT)) return domT;
      const i = universeLevel(domT);
      if (i === null) {
        return { error: `dominio de Π no es un universo: ${termToString(term.domain)} : ${termToString(domT)}` };
      }
      const newCtx = extend(ctx, term.bind, term.domain);
      const codT = inferType(term.codomain, newCtx);
      if (isInferError(codT)) return codT;
      const j = universeLevel(codT);
      if (j === null) {
        return { error: `codominio de Π no es un universo: ${termToString(term.codomain)} : ${termToString(codT)}` };
      }
      return mUniverse(Math.max(i, j));
    }
    case 'sigma': {
      const fT = inferType(term.first, ctx);
      if (isInferError(fT)) return fT;
      const i = universeLevel(fT);
      if (i === null) {
        return { error: `primer componente de Σ no es un universo: ${termToString(term.first)} : ${termToString(fT)}` };
      }
      const newCtx = extend(ctx, term.bind, term.first);
      const sT = inferType(term.second, newCtx);
      if (isInferError(sT)) return sT;
      const j = universeLevel(sT);
      if (j === null) {
        return { error: `segundo componente de Σ no es un universo: ${termToString(term.second)} : ${termToString(sT)}` };
      }
      return mUniverse(Math.max(i, j));
    }
    case 'lam': {
      // Chequeamos que `domain` sea un tipo (vive en algún universo).
      const domT = inferType(term.domain, ctx);
      if (isInferError(domT)) return domT;
      if (universeLevel(domT) === null) {
        return { error: `anotación de λ no es un tipo: ${termToString(term.domain)} : ${termToString(domT)}` };
      }
      const newCtx = extend(ctx, term.bind, term.domain);
      const bodyT = inferType(term.body, newCtx);
      if (isInferError(bodyT)) return bodyT;
      return { kind: 'pi', bind: term.bind, domain: term.domain, codomain: bodyT };
    }
    case 'app': {
      const fnT = inferType(term.fn, ctx);
      if (isInferError(fnT)) return fnT;
      const fnTNorm = normalize(fnT);
      if (fnTNorm.kind !== 'pi') {
        return { error: `aplicación requiere Π, encontré: ${termToString(fnTNorm)}` };
      }
      const argT = inferType(term.arg, ctx);
      if (isInferError(argT)) return argT;
      if (!alphaBetaEq(fnTNorm.domain, argT)) {
        return {
          error: `tipo de argumento no coincide: esperaba ${termToString(fnTNorm.domain)}, obtuve ${termToString(argT)}`,
        };
      }
      return substitute(fnTNorm.codomain, fnTNorm.bind, term.arg);
    }
    case 'pair': {
      const aT = inferType(term.fst, ctx);
      if (isInferError(aT)) return aT;
      const bT = inferType(term.snd, ctx);
      if (isInferError(bT)) return bT;
      // No-dependent Σ por defecto. Para Σ dependiente, usar checkType.
      return { kind: 'sigma', bind: '_', first: aT, second: bT };
    }
    case 'fst': {
      const pT = inferType(term.pair, ctx);
      if (isInferError(pT)) return pT;
      const pTNorm = normalize(pT);
      if (pTNorm.kind !== 'sigma') {
        return { error: `fst espera Σ, recibí: ${termToString(pTNorm)}` };
      }
      return pTNorm.first;
    }
    case 'snd': {
      const pT = inferType(term.pair, ctx);
      if (isInferError(pT)) return pT;
      const pTNorm = normalize(pT);
      if (pTNorm.kind !== 'sigma') {
        return { error: `snd espera Σ, recibí: ${termToString(pTNorm)}` };
      }
      // B[fst p / x]
      return substitute(pTNorm.second, pTNorm.bind, { kind: 'fst', pair: term.pair });
    }
    case 'identity': {
      const typeT = inferType(term.type, ctx);
      if (isInferError(typeT)) return typeT;
      const i = universeLevel(typeT);
      if (i === null) {
        return { error: `argumento A de Id no es un tipo: ${termToString(term.type)}` };
      }
      const lT = inferType(term.left, ctx);
      if (isInferError(lT)) return lT;
      if (!alphaBetaEq(lT, term.type)) {
        return { error: `lado izquierdo de Id tiene tipo ${termToString(lT)}, esperaba ${termToString(term.type)}` };
      }
      const rT = inferType(term.right, ctx);
      if (isInferError(rT)) return rT;
      if (!alphaBetaEq(rT, term.type)) {
        return { error: `lado derecho de Id tiene tipo ${termToString(rT)}, esperaba ${termToString(term.type)}` };
      }
      return mUniverse(i);
    }
    case 'refl': {
      const aT = inferType(term.term, ctx);
      if (isInferError(aT)) return aT;
      return { kind: 'identity', type: aT, left: term.term, right: term.term };
    }
  }
}

/**
 * Chequea que `term` tenga el tipo `expected` (bajo αβ-equality).
 * Implementa el modo "check" donde para `pair` se conoce el Σ esperado
 * y se permite la dependencia del segundo componente.
 */
export function checkType(
  term: MLTTTerm,
  expected: MLTTTerm,
  ctx: InferContext = emptyCtx(),
): boolean {
  const expectedNorm = normalize(expected);

  // Caso especial: `pair` contra un Σ dependiente.
  if (term.kind === 'pair' && expectedNorm.kind === 'sigma') {
    if (!checkType(term.fst, expectedNorm.first, ctx)) return false;
    const expectedSnd = substitute(expectedNorm.second, expectedNorm.bind, term.fst);
    return checkType(term.snd, expectedSnd, ctx);
  }

  // Caso especial: `lam` contra un Π — propaga el dominio esperado
  // si la anotación del λ falta o coincide.
  if (term.kind === 'lam' && expectedNorm.kind === 'pi') {
    if (!alphaBetaEq(term.domain, expectedNorm.domain)) return false;
    const newCtx = extend(ctx, term.bind, term.domain);
    // Renombrar binder esperado al del λ si difieren.
    const expectedBody =
      expectedNorm.bind === term.bind
        ? expectedNorm.codomain
        : substitute(expectedNorm.codomain, expectedNorm.bind, { kind: 'var', name: term.bind });
    return checkType(term.body, expectedBody, newCtx);
  }

  const inferred = inferType(term, ctx);
  if (isInferError(inferred)) return false;
  return alphaBetaEq(inferred, expected);
}

// ---------- Helpers internos ----------

function extend(ctx: InferContext, name: string, type: MLTTTerm): InferContext {
  const next = new Map(ctx);
  next.set(name, type);
  return next;
}

function isNat(t: MLTTTerm): boolean {
  return normalize(t).kind === 'nat';
}

function universeLevel(t: MLTTTerm): number | null {
  const n = normalize(t);
  return n.kind === 'universe' ? n.level : null;
}
