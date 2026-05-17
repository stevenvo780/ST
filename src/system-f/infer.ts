// ============================================================
// System F — Type checking
// ============================================================
//
// Reglas:
//   x : T                   si (x:T) ∈ Γ
//   λx:T. M : T → U          si Γ, x:T ⊢ M : U  y T well-formed en Δ
//   M N : U                  si M : T → U  y  N : T
//   Λ X. M : ∀X. T           si Δ, X ⊢ M : T  (con X fresca)
//   M [T] : U[X := T]        si M : ∀X. U  y  T well-formed en Δ

import type { FContext, FTerm, FType } from './types';
import {
  alphaEqType,
  cloneContext,
  emptyContext,
  fTypeToString,
  isWellFormed,
} from './types';
import { substType } from './reduce';

export type FTypeResult = FType | { error: string };

export function isTypeError(r: FTypeResult): r is { error: string } {
  return typeof r === 'object' && r !== null && 'error' in r;
}

export function typeOf(term: FTerm, ctx: FContext = emptyContext()): FTypeResult {
  switch (term.kind) {
    case 'var': {
      const t = ctx.term.get(term.name);
      if (!t) return { error: `variable libre sin tipo en contexto: '${term.name}'` };
      return t;
    }
    case 'abs': {
      if (!isWellFormed(term.paramType, ctx.type)) {
        return {
          error: `anotación de tipo no bien-formada: ${fTypeToString(
            term.paramType,
          )} (variables de tipo libres no declaradas)`,
        };
      }
      const newCtx = cloneContext(ctx);
      newCtx.term.set(term.param, term.paramType);
      const bodyT = typeOf(term.body, newCtx);
      if (isTypeError(bodyT)) return bodyT;
      return { kind: 'arrow', from: term.paramType, to: bodyT };
    }
    case 'app': {
      const fnT = typeOf(term.fn, ctx);
      if (isTypeError(fnT)) return fnT;
      if (fnT.kind !== 'arrow') {
        return {
          error: `aplicación requiere función A→B, encontré: ${fTypeToString(fnT)}`,
        };
      }
      const argT = typeOf(term.arg, ctx);
      if (isTypeError(argT)) return argT;
      if (!alphaEqType(fnT.from, argT)) {
        return {
          error: `tipo de argumento no coincide: esperaba ${fTypeToString(
            fnT.from,
          )}, obtuve ${fTypeToString(argT)}`,
        };
      }
      return fnT.to;
    }
    case 'tabs': {
      // Λ X. M : ∀X. T  — extender Δ con la variable de tipo nueva.
      // Si ya estaba en Δ, podríamos shadowearla; preferimos rechazar
      // shadowing implícito para evitar confusión didáctica.
      if (ctx.type.has(term.bind)) {
        return {
          error: `Λ${term.bind} shadowea una variable de tipo ya declarada — renómbrala`,
        };
      }
      const newCtx = cloneContext(ctx);
      newCtx.type.add(term.bind);
      const bodyT = typeOf(term.body, newCtx);
      if (isTypeError(bodyT)) return bodyT;
      return { kind: 'forall', bind: term.bind, body: bodyT };
    }
    case 'tapp': {
      const fnT = typeOf(term.fn, ctx);
      if (isTypeError(fnT)) return fnT;
      if (fnT.kind !== 'forall') {
        return {
          error: `type application requiere ∀X. T, encontré: ${fTypeToString(fnT)}`,
        };
      }
      if (!isWellFormed(term.typeArg, ctx.type)) {
        return {
          error: `argumento de tipo no bien-formado: ${fTypeToString(
            term.typeArg,
          )} (variables libres no declaradas)`,
        };
      }
      return substType(fnT.body, fnT.bind, term.typeArg);
    }
  }
}
