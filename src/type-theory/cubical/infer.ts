// ============================================================
// Cubical — Inferencia / chequeo de tipos
// ============================================================
//
// Reglas principales del subset CTT-Lite:
//
//   ── (I-form)     i0 : I    i1 : I    iVar i : I
//
//   Γ ⊢ r : I   Γ ⊢ s : I
//   ── (∧, ∨)       r ∧ s : I    r ∨ s : I
//
//   Γ ⊢ r : I
//   ── (~)          ~ r : I
//
//   Γ ⊢ A : I → Type   Γ ⊢ x : A i0   Γ ⊢ y : A i1
//   ── (PathP)      PathP A x y : Type
//
//   Γ, i : I ⊢ t : A i
//   ── (pLam)       λi. t : PathP (λi. A i) (t[i := i0]) (t[i := i1])
//
//   Γ ⊢ p : PathP A x y   Γ ⊢ r : I
//   ── (pApp)       p @ r : A r
//                   con (p @ i0) ≡ x y (p @ i1) ≡ y
//
//   Γ ⊢ e : A ≃ B (codificado como Σ)
//   Γ ⊢ partial : algún término candidato
//   ── (glue)       glue(e, partial) : PathP _ A B  (precursor de ua)

import type { CubicalTerm } from './types';
import { termToStringCubical, cUniverse, cI0, cI1, cPathP, cApp, cArrow, cPLam } from './types';
import { substituteCubical } from './substitute';
import { normalizeCubical } from './normalize';
import { alphaBetaEqCubical } from './equality';

export interface CubicalContext {
  termVars: Map<string, CubicalTerm>;
  intervalVars: Set<string>;
}

export type InferResultCubical = CubicalTerm | { error: string };

export const intervalType = (): CubicalTerm => ({ kind: 'var', name: '__I__' });

export function isInferErrorCubical(r: InferResultCubical): r is { error: string } {
  return typeof r === 'object' && r !== null && 'error' in r && typeof r.error === 'string';
}

export function makeContext(): CubicalContext {
  return { termVars: new Map(), intervalVars: new Set() };
}

function extendTerm(ctx: CubicalContext, name: string, type: CubicalTerm): CubicalContext {
  const next: CubicalContext = {
    termVars: new Map(ctx.termVars),
    intervalVars: new Set(ctx.intervalVars),
  };
  next.termVars.set(name, type);
  return next;
}

function extendInterval(ctx: CubicalContext, name: string): CubicalContext {
  const next: CubicalContext = {
    termVars: new Map(ctx.termVars),
    intervalVars: new Set(ctx.intervalVars),
  };
  next.intervalVars.add(name);
  return next;
}

export function inferType(
  term: CubicalTerm,
  ctx: CubicalContext = makeContext(),
): InferResultCubical {
  switch (term.kind) {
    case 'i0':
    case 'i1':
      return intervalType();
    case 'iVar':
      if (ctx.intervalVars.has(term.name)) return intervalType();
      return { error: `variable de intervalo libre: ${term.name}` };
    case 'iNeg': {
      if (!checkInterval(term.arg, ctx)) {
        return { error: `~: argumento no es I: ${termToStringCubical(term.arg)}` };
      }
      return intervalType();
    }
    case 'iMin':
    case 'iMax': {
      if (!checkInterval(term.left, ctx) || !checkInterval(term.right, ctx)) {
        return { error: `${term.kind === 'iMin' ? '∧' : '∨'}: ambos lados deben ser I` };
      }
      return intervalType();
    }
    case 'var': {
      const t = ctx.termVars.get(term.name);
      if (!t) return { error: `variable libre sin tipo: ${term.name}` };
      return t;
    }
    case 'universe':
      return cUniverse(term.level + 1);
    case 'pi': {
      const domT = inferType(term.domain, ctx);
      if (isInferErrorCubical(domT)) return domT;
      const i = universeLevel(domT);
      if (i === null) {
        return {
          error: `dominio de Π no es universo: ${termToStringCubical(term.domain)}`,
        };
      }
      const newCtx = extendTerm(ctx, term.bind, term.domain);
      const codT = inferType(term.codomain, newCtx);
      if (isInferErrorCubical(codT)) return codT;
      const j = universeLevel(codT);
      if (j === null) {
        return {
          error: `codominio de Π no es universo: ${termToStringCubical(term.codomain)}`,
        };
      }
      return cUniverse(Math.max(i, j));
    }
    case 'lam': {
      const domT = inferType(term.domain, ctx);
      if (isInferErrorCubical(domT)) return domT;
      if (universeLevel(domT) === null) {
        return {
          error: `anotación de λ no es un tipo: ${termToStringCubical(term.domain)}`,
        };
      }
      const newCtx = extendTerm(ctx, term.bind, term.domain);
      const bodyT = inferType(term.body, newCtx);
      if (isInferErrorCubical(bodyT)) return bodyT;
      return { kind: 'pi', bind: term.bind, domain: term.domain, codomain: bodyT };
    }
    case 'app': {
      const fnT = inferType(term.fn, ctx);
      if (isInferErrorCubical(fnT)) return fnT;
      const fnTNorm = normalizeCubical(fnT);
      if (fnTNorm.kind !== 'pi') {
        return { error: `aplicación requiere Π, encontré: ${termToStringCubical(fnTNorm)}` };
      }
      const argT = inferType(term.arg, ctx);
      if (isInferErrorCubical(argT)) return argT;
      if (!alphaBetaEqCubical(fnTNorm.domain, argT)) {
        return {
          error: `tipo de argumento no coincide: esperaba ${termToStringCubical(fnTNorm.domain)}, obtuve ${termToStringCubical(argT)}`,
        };
      }
      return substituteCubical(fnTNorm.codomain, fnTNorm.bind, term.arg);
    }
    case 'pathP': {
      // family : I → Type
      const famT = inferType(term.family, ctx);
      if (isInferErrorCubical(famT)) return famT;
      const famTNorm = normalizeCubical(famT);
      if (famTNorm.kind !== 'pi' || !isIntervalTypeMark(famTNorm.domain)) {
        return {
          error: `PathP: family debe ser I → Type, recibí: ${termToStringCubical(famTNorm)}`,
        };
      }
      // left : A i0, right : A i1
      const leftT = inferType(term.left, ctx);
      if (isInferErrorCubical(leftT)) return leftT;
      const rightT = inferType(term.right, ctx);
      if (isInferErrorCubical(rightT)) return rightT;
      const expectedLeft = normalizeCubical(cApp(term.family, cI0()));
      const expectedRight = normalizeCubical(cApp(term.family, cI1()));
      if (!alphaBetaEqCubical(leftT, expectedLeft)) {
        return {
          error: `PathP: left tiene tipo ${termToStringCubical(leftT)}, esperaba ${termToStringCubical(expectedLeft)}`,
        };
      }
      if (!alphaBetaEqCubical(rightT, expectedRight)) {
        return {
          error: `PathP: right tiene tipo ${termToStringCubical(rightT)}, esperaba ${termToStringCubical(expectedRight)}`,
        };
      }
      const codLevel = universeLevel(famTNorm.codomain);
      return cUniverse(codLevel ?? 0);
    }
    case 'pLam': {
      // λi. t : PathP (λi. infer(t)) (t[i:=i0]) (t[i:=i1])
      const innerCtx = extendInterval(ctx, term.bind);
      const bodyT = inferType(term.body, innerCtx);
      if (isInferErrorCubical(bodyT)) return bodyT;
      const left = normalizeCubical(substituteCubical(term.body, term.bind, cI0()));
      const right = normalizeCubical(substituteCubical(term.body, term.bind, cI1()));
      const family = cPLam(term.bind, bodyT);
      return cPathP(family, left, right);
    }
    case 'pApp': {
      const pT = inferType(term.path, ctx);
      if (isInferErrorCubical(pT)) return pT;
      const pTNorm = normalizeCubical(pT);
      if (pTNorm.kind !== 'pathP') {
        return { error: `p @ r requiere PathP, recibí: ${termToStringCubical(pTNorm)}` };
      }
      if (!checkInterval(term.arg, ctx)) {
        return { error: `p @ r: r debe ser I, recibí: ${termToStringCubical(term.arg)}` };
      }
      // tipo resultado = family @ r (que puede ser pApp o app dependiendo de la forma)
      return normalizeCubical({ kind: 'pApp', path: pTNorm.family, arg: term.arg });
    }
    case 'glue': {
      // Sintáctica: aceptamos equiv : Σ_A,B y devolvemos un PathP universo
      const eT = inferType(term.equiv, ctx);
      if (isInferErrorCubical(eT)) return eT;
      // partial: opcional, contribuye sólo al término
      const pT = inferType(term.partial, ctx);
      if (isInferErrorCubical(pT)) return pT;
      // glue introduce un path en el universo entre el dominio y codominio
      // del par de tipos codificado en equiv. Sin estructura formal en este
      // subset, devolvemos una marca de PathP genérica.
      const family = cPLam('i', cUniverse(0));
      return cPathP(family, term.equiv, term.equiv);
    }
  }
}

function checkInterval(t: CubicalTerm, ctx: CubicalContext): boolean {
  const r = inferType(t, ctx);
  return !isInferErrorCubical(r) && isIntervalTypeMark(r);
}

function isIntervalTypeMark(t: CubicalTerm): boolean {
  return t.kind === 'var' && t.name === '__I__';
}

function universeLevel(t: CubicalTerm): number | null {
  const n = normalizeCubical(t);
  return n.kind === 'universe' ? n.level : null;
}

export function checkType(
  term: CubicalTerm,
  expected: CubicalTerm,
  ctx: CubicalContext = makeContext(),
): boolean {
  const inferred = inferType(term, ctx);
  if (isInferErrorCubical(inferred)) return false;
  return alphaBetaEqCubical(inferred, expected);
}

// Exportamos cArrow para que tests/usuarios construyan I → Type
export { cArrow };
