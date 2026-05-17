// ============================================================
// Refinement types — Type checker bidireccional
// ============================================================
//
// El checker es bidireccional en el sentido estándar:
//   - synth : term → RefType    (inferir el tipo)
//   - check : term × RefType    (chequear contra un tipo esperado)
//
// Genera predicados de verificación (VCs) cuando es necesario:
//   - Aplicación: el argumento debe cumplir la precondición del parámetro.
//   - Anotación let: el valor debe cumplir el predicado anotado.
//   - Anotación contra `expected`: el tipo inferido debe ser subtipo.
//
// Las VCs se descargan con el solver acotado.

import {
  type RefType,
  type RTerm,
  type BaseType,
  tInt,
  tBool,
  tString,
  refTypeToString,
  termToString,
} from './types';
import { isSubtype } from './subtype';
import { evalPredicate, parsePredicate, renameVar } from './predicate';

export interface TypeCheckResult {
  ok: boolean;
  errors: string[];
  type?: RefType;
  vcs: string[];
}

export type RCtx = Map<string, RefType>;

function freshBinding(used: Set<string>, base = 'v'): string {
  let i = 0;
  let name = `_${base}${i}`;
  while (used.has(name)) {
    i++;
    name = `_${base}${i}`;
  }
  used.add(name);
  return name;
}

function ctxAssumptions(ctx: RCtx): string[] {
  const out: string[] = [];
  for (const [name, ty] of ctx.entries()) {
    const pred = ty.predicate.trim();
    if (pred === '' || pred === 'true') continue;
    if (typeof ty.base !== 'string') continue; // arrows no aportan asunciones aritméticas
    out.push(renameVar(pred, ty.binding, name));
  }
  return out;
}

function singletonInt(value: number): RefType {
  return { base: 'Int', binding: 'v', predicate: `v == ${value}` };
}
function singletonBool(value: boolean): RefType {
  return { base: 'Bool', binding: 'v', predicate: `v == ${value}` };
}
function singletonString(): RefType {
  return tString('v', 'true');
}

function eqBase(a: BaseType, b: BaseType): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  return eqBase(a.from.base, b.from.base) && eqBase(a.to.base, b.to.base);
}

/**
 * synthesize — infiere un RefType para `term` en el contexto dado.
 * Devuelve también la lista de VCs acumuladas y los errores fatales.
 */
function synthesize(term: RTerm, ctx: RCtx, errors: string[], vcs: string[]): RefType | undefined {
  switch (term.kind) {
    case 'lit':
      if (typeof term.value === 'number') return singletonInt(term.value);
      if (typeof term.value === 'boolean') return singletonBool(term.value);
      return singletonString();
    case 'var': {
      const ty = ctx.get(term.name);
      if (!ty) {
        errors.push(`variable libre "${term.name}"`);
        return undefined;
      }
      // Reflejamos el predicado de ctx como singleton sobre la variable.
      if (typeof ty.base === 'string') {
        const used = new Set(ctx.keys());
        used.add(term.name);
        const fresh = freshBinding(used);
        const refl = `${fresh} == ${term.name}`;
        const renamedPred =
          ty.predicate.trim() === '' || ty.predicate.trim() === 'true'
            ? refl
            : `(${refl}) && ${renameVar(ty.predicate, ty.binding, term.name)}`;
        return { base: ty.base, binding: fresh, predicate: renamedPred };
      }
      return ty;
    }
    case 'binop': {
      const lt = synthesize(term.left, ctx, errors, vcs);
      const rt = synthesize(term.right, ctx, errors, vcs);
      if (!lt || !rt) return undefined;
      const arith = ['+', '-', '*'].includes(term.op);
      const cmp = ['<', '<=', '>', '>=', '==', '!='].includes(term.op);
      const bool = ['&&', '||'].includes(term.op);
      if (arith) {
        if (lt.base !== 'Int' || rt.base !== 'Int') {
          errors.push(
            `binop ${term.op}: requiere Int, recibido ${refTypeToString(lt)} y ${refTypeToString(rt)}`,
          );
          return undefined;
        }
        return tInt('v', 'true');
      }
      if (cmp) {
        if (lt.base !== rt.base) {
          errors.push(`binop ${term.op}: lados de tipos distintos`);
          return undefined;
        }
        return tBool('v', 'true');
      }
      if (bool) {
        if (lt.base !== 'Bool' || rt.base !== 'Bool') {
          errors.push(`binop ${term.op}: requiere Bool`);
          return undefined;
        }
        return tBool('v', 'true');
      }
      errors.push(`binop desconocido ${term.op}`);
      return undefined;
    }
    case 'if': {
      const ct = synthesize(term.cond, ctx, errors, vcs);
      if (!ct) return undefined;
      if (ct.base !== 'Bool') {
        errors.push(`if: condición no booleana: ${refTypeToString(ct)}`);
        return undefined;
      }
      const tt = synthesize(term.then, ctx, errors, vcs);
      const et = synthesize(term.else, ctx, errors, vcs);
      if (!tt || !et) return undefined;
      if (!eqBase(tt.base, et.base)) {
        errors.push(
          `if: ramas de tipos distintos (${refTypeToString(tt)} vs ${refTypeToString(et)})`,
        );
        return undefined;
      }
      return { base: tt.base, binding: '_v', predicate: 'true' };
    }
    case 'lam': {
      const newCtx = new Map(ctx);
      newCtx.set(term.param, term.paramType);
      const bodyTy = synthesize(term.body, newCtx, errors, vcs);
      if (!bodyTy) return undefined;
      return {
        base: { kind: 'arrow', from: term.paramType, to: bodyTy },
        binding: '_f',
        predicate: 'true',
      };
    }
    case 'app': {
      const ft = synthesize(term.fn, ctx, errors, vcs);
      if (!ft) return undefined;
      if (typeof ft.base === 'string' || ft.base.kind !== 'arrow') {
        errors.push(`app: lado izquierdo no es función: ${refTypeToString(ft)}`);
        return undefined;
      }
      const paramTy = ft.base.from;
      const resTy = ft.base.to;
      // Chequeamos que el argumento sea subtipo del paramType.
      const ok = check(term.arg, paramTy, ctx, errors, vcs);
      if (!ok) return undefined;
      return resTy;
    }
    case 'let': {
      const valTy = synthesize(term.value, ctx, errors, vcs);
      if (!valTy) return undefined;
      let boundTy = valTy;
      if (term.bindType) {
        const ok = check(term.value, term.bindType, ctx, errors, vcs);
        if (!ok) return undefined;
        boundTy = term.bindType;
      }
      const newCtx = new Map(ctx);
      newCtx.set(term.bind, boundTy);
      return synthesize(term.body, newCtx, errors, vcs);
    }
  }
}

function check(
  term: RTerm,
  expected: RefType,
  ctx: RCtx,
  errors: string[],
  vcs: string[],
): boolean {
  const synth = synthesize(term, ctx, errors, vcs);
  if (!synth) return false;
  if (!eqBase(synth.base, expected.base)) {
    errors.push(
      `check: tipo base esperado ${refTypeToString(expected)}, obtenido ${refTypeToString(synth)} en ${termToString(term)}`,
    );
    return false;
  }
  // Fast-path: si el término es un literal, evaluamos el predicado esperado
  // sustituyendo concretamente — esto es exacto y evita depender de la cota
  // del solver bounded para literales grandes.
  if (term.kind === 'lit') {
    const predSrc = expected.predicate.trim();
    if (predSrc === '' || predSrc === 'true') return true;
    try {
      const ast = parsePredicate(predSrc);
      const val = evalPredicate(ast, { [expected.binding]: term.value });
      if (val === true) return true;
      const vc = `${expected.binding} = ${JSON.stringify(term.value)} ⇒ ${predSrc}`;
      vcs.push(vc);
      errors.push(`check: literal ${termToString(term)} no satisface ${refTypeToString(expected)}`);
      return false;
    } catch (err) {
      errors.push(`check: error evaluando predicado: ${String(err)}`);
      return false;
    }
  }
  const assumptions = ctxAssumptions(ctx);
  const sub = isSubtype(synth, expected, { extraAssumptions: assumptions });
  if (!sub) {
    const vc = `${synth.predicate} ⇒ ${expected.predicate}`;
    vcs.push(vc);
    errors.push(
      `check: no se pudo verificar ${refTypeToString(synth)} <: ${refTypeToString(expected)} (VC: ${vc})`,
    );
    return false;
  }
  return true;
}

/**
 * typeCheck — API principal: chequea o sintetiza el tipo de `term`.
 * Si `expected` se provee, valida contra ese tipo.
 */
export function typeCheck(term: RTerm, expected?: RefType, ctx: RCtx = new Map()): TypeCheckResult {
  const errors: string[] = [];
  const vcs: string[] = [];
  if (expected) {
    const ok = check(term, expected, ctx, errors, vcs);
    return { ok, errors, type: ok ? expected : undefined, vcs };
  }
  const ty = synthesize(term, ctx, errors, vcs);
  return { ok: errors.length === 0, errors, type: ty, vcs };
}

/**
 * generateVC — colecta los predicados que deben mantenerse para que
 * `term` sea bien tipado en `ctx`. Útil para inspección / debugging.
 */
export function generateVC(term: RTerm, ctx: RCtx = new Map()): string[] {
  const errors: string[] = [];
  const vcs: string[] = [];
  synthesize(term, ctx, errors, vcs);
  return vcs;
}
