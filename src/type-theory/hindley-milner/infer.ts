// ============================================================
// Hindley-Milner — Algorithm W (Damas-Milner)
// ============================================================
//
// Implementación de Algorithm W tal como aparece en Damas & Milner
// 1982. La función W toma un entorno Γ y una expresión e, y devuelve
// un par (S, τ) donde S es la sustitución principal y τ el tipo
// principal de e bajo S(Γ).
//
// Reglas (esquemáticas):
//   W(Γ, x)        = (∅, [β/α] τ) si Γ(x) = ∀α. τ con β frescas
//   W(Γ, λx.e)     = sea β fresca; (S, τ) = W(Γ[x:β], e);
//                    devolver (S, S(β) → τ)
//   W(Γ, e₁ e₂)    = (S₁, τ₁) = W(Γ, e₁);
//                    (S₂, τ₂) = W(S₁(Γ), e₂);
//                    β fresca; V = mgu(S₂(τ₁), τ₂ → β);
//                    devolver (V ∘ S₂ ∘ S₁, V(β))
//   W(Γ, let x = e₁ in e₂) =
//                    (S₁, τ₁) = W(Γ, e₁);
//                    σ = generalize(S₁(Γ), τ₁);
//                    (S₂, τ₂) = W(S₁(Γ)[x:σ], e₂);
//                    devolver (S₂ ∘ S₁, τ₂)
//   W(Γ, if c then a else b) = unificar c con Bool y a con b.
//   W(Γ, letRec [n₁=e₁,...] in e) — todos los nᵢ con tvars frescos
//   en el entorno mientras se infieren los eᵢ; luego generalizar.
//
// Convención: trabajamos con `freshTypeVar('t')`. Para tests con
// nombres predecibles se llama `resetFreshSupply()`.

import type { Expr, Type, TypeScheme } from './types';
import { TBool, TInt, TStr, TypeEnv, mono, scheme, tArrow, tApp, typeFreeVars } from './types';
import type { Substitution } from './substitution';
import {
  applySubst,
  applySubstScheme,
  composeSubsts,
  emptySubst,
  freshTypeVar,
  generalize,
  instantiate,
  isUnifyError,
  unify,
} from './substitution';

export interface InferResult {
  type: Type;
  subst: Substitution;
}

export type InferOutcome = InferResult | { error: string };

export function isInferError(r: InferOutcome): r is { error: string } {
  return typeof r === 'object' && r !== null && 'error' in r && !('type' in r);
}

// ---------- Entorno inicial con primitivos ----------
//
// Operadores aritméticos como Int → Int → Int. Comparadores son
// polimórficos: ∀α. α → α → Bool. Listas y pares con sus
// constructores y proyectores.
export function initialEnv(): TypeEnv {
  const a = 'a';
  const b = 'b';
  const TA = { kind: 'tvar', name: a } as Type;
  const TB = { kind: 'tvar', name: b } as Type;

  const arithBinop: TypeScheme = mono(tArrow(TInt, tArrow(TInt, TInt)));
  const cmpBinop: TypeScheme = scheme([a], tArrow(TA, tArrow(TA, TBool)));

  const pairTy = tApp('Pair', TA, TB);
  const listTyA = tApp('List', TA);

  return new TypeEnv(
    new Map<string, TypeScheme>([
      ['+', arithBinop],
      ['-', arithBinop],
      ['*', arithBinop],
      ['/', arithBinop],
      ['mod', arithBinop],

      ['==', cmpBinop],
      ['!=', cmpBinop],
      ['<', cmpBinop],
      ['>', cmpBinop],
      ['<=', cmpBinop],
      ['>=', cmpBinop],

      ['true', mono(TBool)],
      ['false', mono(TBool)],
      ['not', mono(tArrow(TBool, TBool))],
      ['&&', mono(tArrow(TBool, tArrow(TBool, TBool)))],
      ['||', mono(tArrow(TBool, tArrow(TBool, TBool)))],

      ['pair', scheme([a, b], tArrow(TA, tArrow(TB, pairTy)))],
      ['fst', scheme([a, b], tArrow(pairTy, TA))],
      ['snd', scheme([a, b], tArrow(pairTy, TB))],

      ['nil', scheme([a], listTyA)],
      ['cons', scheme([a], tArrow(TA, tArrow(listTyA, listTyA)))],
      ['head', scheme([a], tArrow(listTyA, TA))],
      ['tail', scheme([a], tArrow(listTyA, listTyA))],
      ['isEmpty', scheme([a], tArrow(listTyA, TBool))],

      // fixpoint, útil para introducir letRec puntualmente sin el azúcar
      ['fix', scheme([a], tArrow(tArrow(TA, TA), TA))],
    ]),
  );
}

// ---------- Algorithm W ----------
export function algorithmW(expr: Expr, env: TypeEnv): InferOutcome {
  switch (expr.kind) {
    case 'lit': {
      const t =
        typeof expr.value === 'number' ? TInt : typeof expr.value === 'boolean' ? TBool : TStr;
      return { type: t, subst: emptySubst() };
    }

    case 'var': {
      const sc = env.lookup(expr.name);
      if (sc === undefined) return { error: `unbound variable: ${expr.name}` };
      return { type: instantiate(sc), subst: emptySubst() };
    }

    case 'lam': {
      const tv = freshTypeVar('t');
      const env2 = env.extend(expr.param, mono(tv));
      const body = algorithmW(expr.body, env2);
      if (isInferError(body)) return body;
      return {
        type: tArrow(applySubst(tv, body.subst), body.type),
        subst: body.subst,
      };
    }

    case 'app': {
      const r1 = algorithmW(expr.fn, env);
      if (isInferError(r1)) return r1;
      const env2 = applyEnv(env, r1.subst);
      const r2 = algorithmW(expr.arg, env2);
      if (isInferError(r2)) return r2;
      const tv = freshTypeVar('t');
      const u = unify(applySubst(r1.type, r2.subst), tArrow(r2.type, tv));
      if (isUnifyError(u)) return { error: u.error };
      const finalSubst = composeSubsts(u, composeSubsts(r2.subst, r1.subst));
      return { type: applySubst(tv, u), subst: finalSubst };
    }

    case 'let': {
      const r1 = algorithmW(expr.value, env);
      if (isInferError(r1)) return r1;
      const env1 = applyEnv(env, r1.subst);
      const sc = generalize(env1.freeVars(), r1.type);
      const env2 = env1.extend(expr.bind, sc);
      const r2 = algorithmW(expr.body, env2);
      if (isInferError(r2)) return r2;
      return {
        type: r2.type,
        subst: composeSubsts(r2.subst, r1.subst),
      };
    }

    case 'letRec': {
      // Asignar tvar fresco a cada def, inferir cada body bajo el
      // entorno extendido, unificar el tipo de cada body con el tvar
      // declarado, y al final generalizar.
      if (expr.defs.length === 0) return algorithmW(expr.body, env);

      const freshVars: Type[] = expr.defs.map(() => freshTypeVar('t'));
      let envExt = env;
      for (let i = 0; i < expr.defs.length; i++) {
        envExt = envExt.extend(expr.defs[i].name, mono(freshVars[i]));
      }

      let s: Substitution = emptySubst();
      for (let i = 0; i < expr.defs.length; i++) {
        const def = expr.defs[i];
        const fv = freshVars[i];
        const ri = algorithmW(def.body, applyEnv(envExt, s));
        if (isInferError(ri)) return ri;
        const u = unify(applySubst(fv, composeSubsts(ri.subst, s)), ri.type);
        if (isUnifyError(u)) return { error: u.error };
        s = composeSubsts(u, composeSubsts(ri.subst, s));
      }

      // Reconstruir entorno generalizado.
      const envAfter = applyEnv(env, s);
      const envFv = envAfter.freeVars();
      let envGen = envAfter;
      for (let i = 0; i < expr.defs.length; i++) {
        const ty = applySubst(freshVars[i], s);
        const sc = generalize(envFv, ty);
        envGen = envGen.extend(expr.defs[i].name, sc);
      }

      const rBody = algorithmW(expr.body, envGen);
      if (isInferError(rBody)) return rBody;
      return {
        type: rBody.type,
        subst: composeSubsts(rBody.subst, s),
      };
    }

    case 'if': {
      const rc = algorithmW(expr.cond, env);
      if (isInferError(rc)) return rc;
      const uCond = unify(rc.type, TBool);
      if (isUnifyError(uCond)) {
        return { error: `condition of 'if' must be Bool: ${uCond.error}` };
      }
      const s1 = composeSubsts(uCond, rc.subst);

      const rt = algorithmW(expr.then, applyEnv(env, s1));
      if (isInferError(rt)) return rt;
      const s2 = composeSubsts(rt.subst, s1);

      const re = algorithmW(expr.else, applyEnv(env, s2));
      if (isInferError(re)) return re;
      const s3 = composeSubsts(re.subst, s2);

      const u = unify(applySubst(rt.type, s3), re.type);
      if (isUnifyError(u)) {
        return { error: `branches of 'if' must agree: ${u.error}` };
      }
      const finalSubst = composeSubsts(u, s3);
      return { type: applySubst(re.type, u), subst: finalSubst };
    }
  }
}

// ---------- API de alto nivel ----------
//
// infer() devuelve sólo lo necesario al consumidor: el tipo final
// y la sustitución que lo produjo (útil para imprimirla, debug,
// etc.). El esquema principal lo expone `inferScheme`.

export function infer(expr: Expr, env: TypeEnv = initialEnv()): InferOutcome {
  return algorithmW(expr, env);
}

export interface InferSchemeResult {
  scheme: TypeScheme;
  subst: Substitution;
  type: Type;
}

export function inferScheme(
  expr: Expr,
  env: TypeEnv = initialEnv(),
): InferSchemeResult | { error: string } {
  const r = algorithmW(expr, env);
  if (isInferError(r)) return r;
  const envAfter = applyEnv(env, r.subst);
  const sc = generalize(envAfter.freeVars(), r.type);
  return { scheme: sc, subst: r.subst, type: r.type };
}

// ---------- Helpers ----------
function applyEnv(env: TypeEnv, s: Substitution): TypeEnv {
  if (s.size === 0) return env;
  const next = new Map<string, TypeScheme>();
  for (const [name, sc] of env.bindings) {
    next.set(name, applySubstScheme(sc, s));
  }
  return new TypeEnv(next);
}

// Renombrado canónico de un esquema para tests: ∀t5 t9. t5 → t9
// pasa a ser ∀a b. a → b. Asegura comparaciones estables sin
// depender del contador global.
export function normalizeScheme(sc: TypeScheme): TypeScheme {
  const fv = Array.from(typeFreeVars(sc.body));
  const ordered = sc.forall.filter((v) => fv.includes(v));
  const namePool = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const renames = new Map<string, string>();
  let i = 0;
  function pick(): string {
    if (i < namePool.length) return namePool[i++];
    return `t${i++}`;
  }
  // Recorrer en orden de aparición en el cuerpo para que el nombre
  // resultante sea estable bajo equivalencia α.
  visitTypeVars(sc.body, (v) => {
    if (ordered.includes(v) && !renames.has(v)) {
      renames.set(v, pick());
    }
  });
  const sub: Substitution = new Map();
  for (const [old, fresh] of renames) {
    sub.set(old, { kind: 'tvar', name: fresh });
  }
  return {
    forall: Array.from(renames.values()),
    body: applySubst(sc.body, sub),
  };
}

function visitTypeVars(t: Type, cb: (name: string) => void): void {
  switch (t.kind) {
    case 'tvar':
      cb(t.name);
      return;
    case 'tconst':
      return;
    case 'arrow':
      visitTypeVars(t.from, cb);
      visitTypeVars(t.to, cb);
      return;
    case 'tapp':
      for (const a of t.args) visitTypeVars(a, cb);
      return;
  }
}
