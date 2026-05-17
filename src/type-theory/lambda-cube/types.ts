// ============================================================
// Lambda Cube (Barendregt) — Términos como Pure Type System (PTS)
// ============================================================
//
// El cubo λ de Barendregt presenta 8 sistemas de tipos puros como
// activaciones de 3 ejes ortogonales sobre el λ-cálculo simplemente
// tipado:
//
//        polymorphism             ──   ∀ sobre términos     (λ2, λω, λC ...)
//        type operators           ──   funciones a nivel tipo (λω, λC ...)
//        dependent types          ──   tipos que dependen de términos (λP, λC ...)
//
// Cada combinación es un PTS con dos sorts:
//
//        * (Set / Prop)     y     ◻ (Type / Kind)
//
// y un conjunto de reglas de formación (s1, s2) para Π.
//
// La sintaxis unificada usada en este módulo:
//
//        t ::= x
//            | s                 sort (* | ◻)
//            | Π x:t. t          producto dependiente
//            | λ x:t. t          abstracción
//            | t t               aplicación
//
// Las reglas de formación de cada vértice del cubo deciden qué
// abstracciones son legales. Por ejemplo:
//
//   λ→         (*, *)                              STLC
//   λ2         (*, *) (◻, *)                       System F
//   λω̄         (*, *) (◻, ◻)                       λω débil
//   λω         (*, *) (◻, *) (◻, ◻)                System Fω
//   λP         (*, *) (*, ◻)                       LF / λΠ
//   λP2        (*, *) (◻, *) (*, ◻)
//   λPω̄        (*, *) (*, ◻) (◻, ◻)
//   λC         (*, *) (◻, *) (*, ◻) (◻, ◻)         Calculus of Constructions

export type Sort = '*' | '◻';

export type CubeSystem =
  | 'lambda'
  | 'lambda2'
  | 'lambda-omega-bar'
  | 'lambda-omega'
  | 'lambda-P'
  | 'lambda-P2'
  | 'lambda-P-omega'
  | 'lambda-C';

export type CubeTerm =
  | { kind: 'var'; name: string }
  | { kind: 'sort'; sort: Sort }
  | { kind: 'pi'; bind: string; domain: CubeTerm; codomain: CubeTerm }
  | { kind: 'lam'; bind: string; domain: CubeTerm; body: CubeTerm }
  | { kind: 'app'; fn: CubeTerm; arg: CubeTerm };

// ---------- Constructores convenientes ----------

export const cVar = (name: string): CubeTerm => ({ kind: 'var', name });
export const cSort = (sort: Sort): CubeTerm => ({ kind: 'sort', sort });
export const cStar: CubeTerm = { kind: 'sort', sort: '*' };
export const cBox: CubeTerm = { kind: 'sort', sort: '◻' };
export const cPi = (bind: string, domain: CubeTerm, codomain: CubeTerm): CubeTerm => ({
  kind: 'pi',
  bind,
  domain,
  codomain,
});
export const cLam = (bind: string, domain: CubeTerm, body: CubeTerm): CubeTerm => ({
  kind: 'lam',
  bind,
  domain,
  body,
});
export const cApp = (fn: CubeTerm, arg: CubeTerm): CubeTerm => ({ kind: 'app', fn, arg });

/** Flecha no-dependiente: Π (_ : A). B, cuando B no menciona el binder. */
export const cArrow = (from: CubeTerm, to: CubeTerm): CubeTerm => cPi('_', from, to);

// ---------- Variables libres ----------

export function occursFree(name: string, term: CubeTerm): boolean {
  switch (term.kind) {
    case 'var':
      return term.name === name;
    case 'sort':
      return false;
    case 'pi':
    case 'lam': {
      if (occursFree(name, term.domain)) return true;
      if (term.bind === name) return false;
      const body = term.kind === 'pi' ? term.codomain : term.body;
      return occursFree(name, body);
    }
    case 'app':
      return occursFree(name, term.fn) || occursFree(name, term.arg);
  }
}

export function freeVars(term: CubeTerm, acc: Set<string> = new Set()): Set<string> {
  switch (term.kind) {
    case 'var':
      acc.add(term.name);
      return acc;
    case 'sort':
      return acc;
    case 'pi':
    case 'lam': {
      freeVars(term.domain, acc);
      const body = term.kind === 'pi' ? term.codomain : term.body;
      const inner = freeVars(body);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      return acc;
    }
    case 'app':
      freeVars(term.fn, acc);
      freeVars(term.arg, acc);
      return acc;
  }
}

// ---------- Serialización legible ----------

export function termToString(t: CubeTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'sort':
      return t.sort;
    case 'pi': {
      if (t.bind === '_' || !occursFree(t.bind, t.codomain)) {
        const lhs =
          t.domain.kind === 'pi' || t.domain.kind === 'lam'
            ? `(${termToString(t.domain)})`
            : termToString(t.domain);
        return `${lhs} → ${termToString(t.codomain)}`;
      }
      return `Π ${t.bind}:${termToString(t.domain)}. ${termToString(t.codomain)}`;
    }
    case 'lam':
      return `λ ${t.bind}:${termToString(t.domain)}. ${termToString(t.body)}`;
    case 'app': {
      const fn =
        t.fn.kind === 'lam' || t.fn.kind === 'pi' ? `(${termToString(t.fn)})` : termToString(t.fn);
      const arg =
        t.arg.kind === 'app' || t.arg.kind === 'lam' || t.arg.kind === 'pi'
          ? `(${termToString(t.arg)})`
          : termToString(t.arg);
      return `${fn} ${arg}`;
    }
  }
}

// ---------- α-equivalencia ----------

export function alphaEq(a: CubeTerm, b: CubeTerm): boolean {
  return alphaEqEnv(a, b, new Map(), new Map(), { n: 0 });
}

function alphaEqEnv(
  a: CubeTerm,
  b: CubeTerm,
  envA: Map<string, number>,
  envB: Map<string, number>,
  counter: { n: number },
): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'var': {
      const bb = b as typeof a;
      const ia = envA.get(a.name);
      const ib = envB.get(bb.name);
      if (ia === undefined && ib === undefined) return a.name === bb.name;
      return ia === ib;
    }
    case 'sort':
      return a.sort === (b as typeof a).sort;
    case 'pi':
    case 'lam': {
      const bb = b as typeof a;
      const aDom = a.domain;
      const bDom = bb.domain;
      if (!alphaEqEnv(aDom, bDom, envA, envB, counter)) return false;
      const idx = counter.n++;
      const newA = new Map(envA);
      newA.set(a.bind, idx);
      const newB = new Map(envB);
      newB.set(bb.bind, idx);
      const aBody = a.kind === 'pi' ? a.codomain : a.body;
      const bBody = bb.kind === 'pi' ? bb.codomain : bb.body;
      return alphaEqEnv(aBody, bBody, newA, newB, counter);
    }
    case 'app': {
      const bb = b as typeof a;
      return (
        alphaEqEnv(a.fn, bb.fn, envA, envB, counter) &&
        alphaEqEnv(a.arg, bb.arg, envA, envB, counter)
      );
    }
  }
}

// ---------- Contexto ----------
//
// Mapa nombre → tipo. Conserva orden de inserción para impresión.

export type CubeContext = Map<string, CubeTerm>;

export function emptyContext(): CubeContext {
  return new Map();
}

export function extendContext(ctx: CubeContext, name: string, type: CubeTerm): CubeContext {
  const next = new Map(ctx);
  next.set(name, type);
  return next;
}
