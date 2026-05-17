// ============================================================
// System F — Polymorphic lambda calculus (λ²)
// ============================================================
//
// Extiende el λ-cálculo simplemente tipado con cuantificación
// universal sobre tipos:
//
//   T ::= X | T → T | ∀X. T
//   t ::= x | λx:T. t | t t | Λ X. t | t [T]
//
// Curry-Howard: corresponde a la lógica proposicional intuicionista
// de segundo orden (cuantificación sobre proposiciones).
//
// Convenciones:
//   - Variables de término: minúsculas (x, y, f).
//   - Variables de tipo: mayúsculas convencionalmente (X, Y, Z), pero
//     no impuestas — `atom('foo')` también es legal.
//   - Λ usa `tabs` (type-abstraction); t [T] usa `tapp`.

export type FType =
  | { kind: 'atom'; name: string }
  | { kind: 'arrow'; from: FType; to: FType }
  | { kind: 'forall'; bind: string; body: FType };

export type FTerm =
  | { kind: 'var'; name: string }
  | { kind: 'abs'; param: string; paramType: FType; body: FTerm }
  | { kind: 'app'; fn: FTerm; arg: FTerm }
  | { kind: 'tabs'; bind: string; body: FTerm } //  Λ X. t
  | { kind: 'tapp'; fn: FTerm; typeArg: FType }; //  t [T]

// ---------- Constructores convenientes ----------
export const fAtom = (name: string): FType => ({ kind: 'atom', name });
export const fArrow = (from: FType, to: FType): FType => ({ kind: 'arrow', from, to });
export const fForall = (bind: string, body: FType): FType => ({ kind: 'forall', bind, body });

export const fVar = (name: string): FTerm => ({ kind: 'var', name });
export const fAbs = (param: string, paramType: FType, body: FTerm): FTerm => ({
  kind: 'abs',
  param,
  paramType,
  body,
});
export const fApp = (fn: FTerm, arg: FTerm): FTerm => ({ kind: 'app', fn, arg });
export const fTAbs = (bind: string, body: FTerm): FTerm => ({ kind: 'tabs', bind, body });
export const fTApp = (fn: FTerm, typeArg: FType): FTerm => ({ kind: 'tapp', fn, typeArg });

// ---------- Variables libres de tipo (sobre FType) ----------
export function freeTypeVars(t: FType, acc: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'atom':
      acc.add(t.name);
      return acc;
    case 'arrow':
      freeTypeVars(t.from, acc);
      freeTypeVars(t.to, acc);
      return acc;
    case 'forall': {
      const inner = freeTypeVars(t.body);
      inner.delete(t.bind);
      for (const v of inner) acc.add(v);
      return acc;
    }
  }
}

// ---------- α-equivalencia de tipos ----------
// ∀X. T y ∀Y. T[X:=Y] son iguales módulo α.
export function alphaEqType(a: FType, b: FType): boolean {
  return alphaEqTypeEnv(a, b, new Map(), new Map(), { n: 0 });
}

function alphaEqTypeEnv(
  a: FType,
  b: FType,
  envA: Map<string, number>,
  envB: Map<string, number>,
  counter: { n: number },
): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'atom': {
      const bb = b as typeof a;
      const ia = envA.get(a.name);
      const ib = envB.get(bb.name);
      if (ia === undefined && ib === undefined) return a.name === bb.name;
      return ia === ib;
    }
    case 'arrow': {
      const bb = b as typeof a;
      return (
        alphaEqTypeEnv(a.from, bb.from, envA, envB, counter) &&
        alphaEqTypeEnv(a.to, bb.to, envA, envB, counter)
      );
    }
    case 'forall': {
      const bb = b as typeof a;
      const idx = counter.n++;
      const newA = new Map(envA);
      newA.set(a.bind, idx);
      const newB = new Map(envB);
      newB.set(bb.bind, idx);
      return alphaEqTypeEnv(a.body, bb.body, newA, newB, counter);
    }
  }
}

// ---------- Well-formedness de tipos ----------
// Un tipo está bien formado si todas sus variables libres están
// declaradas en el contexto de tipos.
export function isWellFormed(type: FType, ctx: Set<string> = new Set()): boolean {
  switch (type.kind) {
    case 'atom':
      return ctx.has(type.name);
    case 'arrow':
      return isWellFormed(type.from, ctx) && isWellFormed(type.to, ctx);
    case 'forall': {
      const extended = new Set(ctx);
      extended.add(type.bind);
      return isWellFormed(type.body, extended);
    }
  }
}

// ---------- Serialización legible ----------
export function fTypeToString(t: FType): string {
  switch (t.kind) {
    case 'atom':
      return t.name;
    case 'arrow': {
      const lhs =
        t.from.kind === 'arrow' || t.from.kind === 'forall'
          ? `(${fTypeToString(t.from)})`
          : fTypeToString(t.from);
      return `${lhs} → ${fTypeToString(t.to)}`;
    }
    case 'forall':
      return `∀${t.bind}. ${fTypeToString(t.body)}`;
  }
}

export function fTermToString(t: FTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'abs':
      return `(λ${t.param}:${fTypeToString(t.paramType)}. ${fTermToString(t.body)})`;
    case 'app': {
      const fn = fTermToString(t.fn);
      const arg = t.arg.kind === 'app' ? `(${fTermToString(t.arg)})` : fTermToString(t.arg);
      return `(${fn} ${arg})`;
    }
    case 'tabs':
      return `(Λ${t.bind}. ${fTermToString(t.body)})`;
    case 'tapp':
      return `(${fTermToString(t.fn)} [${fTypeToString(t.typeArg)}])`;
  }
}

// ---------- Contexto de tipado ----------
// Contiene tanto variables de término (con su tipo asignado) como el
// conjunto de variables de tipo declaradas (Λ las introduce).
export interface FContext {
  term: Map<string, FType>;
  type: Set<string>;
}

export function emptyContext(): FContext {
  return { term: new Map(), type: new Set() };
}

export function cloneContext(ctx: FContext): FContext {
  return { term: new Map(ctx.term), type: new Set(ctx.type) };
}
