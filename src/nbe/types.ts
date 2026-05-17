// ============================================================
// NbE para STLC — Tipos sintácticos y dominio semántico
// ============================================================
//
// Términos del λ-cálculo simplemente tipado (STLC) y los valores
// semánticos sobre los que evaluamos. La separación entre sintaxis
// (Term, Type) y semántica (Value, Neutral) es lo que hace al
// algoritmo NbE limpio: evaluar produce valores; reificar los baja
// otra vez a términos en forma normal η-larga.

export type Type = { kind: 'base'; name: string } | { kind: 'arrow'; from: Type; to: Type };

export type Term =
  | { kind: 'var'; name: string }
  | { kind: 'abs'; param: string; paramType: Type; body: Term }
  | { kind: 'app'; fn: Term; arg: Term };

// Dominio semántico:
// - 'neutral' = una variable libre o una aplicación atascada (no
//   podemos reducir más sin saber qué es la cabeza).
// - 'closure' = una λ-abstracción capturada con su entorno léxico.
export type Value =
  | { kind: 'neutral'; head: Neutral }
  | { kind: 'closure'; env: Env; param: string; paramType: Type; body: Term };

export type Neutral = { kind: 'var'; name: string } | { kind: 'app'; head: Neutral; arg: Value };

export type Env = Map<string, Value>;

// ---------- Constructores sintácticos ----------
export const tBase = (name: string): Type => ({ kind: 'base', name });
export const tArr = (from: Type, to: Type): Type => ({ kind: 'arrow', from, to });

export const v = (name: string): Term => ({ kind: 'var', name });
export const lam = (param: string, paramType: Type, body: Term): Term => ({
  kind: 'abs',
  param,
  paramType,
  body,
});
export const ap = (fn: Term, arg: Term): Term => ({ kind: 'app', fn, arg });
export const apN = (head: Term, ...args: Term[]): Term => args.reduce(ap, head);

// ---------- Constructores semánticos ----------
export const vNeutralVar = (name: string): Value => ({
  kind: 'neutral',
  head: { kind: 'var', name },
});
export const vNeutral = (head: Neutral): Value => ({ kind: 'neutral', head });
export const vClosure = (env: Env, param: string, paramType: Type, body: Term): Value => ({
  kind: 'closure',
  env,
  param,
  paramType,
  body,
});

// ---------- Igualdad estructural módulo α ----------
// Renombra binders a posiciones canónicas para comparar.
export function alphaEq(a: Term, b: Term): boolean {
  return alphaEqEnv(a, b, new Map(), new Map(), { n: 0 });
}

function alphaEqEnv(
  a: Term,
  b: Term,
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
      if (ia === undefined && ib === undefined) return a.name === bb.name; // free vars
      return ia === ib;
    }
    case 'abs': {
      const bb = b as typeof a;
      if (!typeEq(a.paramType, bb.paramType)) return false;
      const idx = counter.n++;
      const newA = new Map(envA);
      newA.set(a.param, idx);
      const newB = new Map(envB);
      newB.set(bb.param, idx);
      return alphaEqEnv(a.body, bb.body, newA, newB, counter);
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

export function typeEq(a: Type, b: Type): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'base' && b.kind === 'base') return a.name === b.name;
  if (a.kind === 'arrow' && b.kind === 'arrow') {
    return typeEq(a.from, b.from) && typeEq(a.to, b.to);
  }
  return false;
}

// Pretty-printer mínimo para términos y tipos (útil en tests/debug).
export function typeToString(t: Type): string {
  if (t.kind === 'base') return t.name;
  // arrow es asociativo a la derecha: A → B → C  ≡  A → (B → C)
  const from = t.from.kind === 'arrow' ? `(${typeToString(t.from)})` : typeToString(t.from);
  return `${from} → ${typeToString(t.to)}`;
}

export function termToString(t: Term): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'abs':
      return `(λ${t.param}:${typeToString(t.paramType)}.${termToString(t.body)})`;
    case 'app': {
      const fn = termToString(t.fn);
      const arg = t.arg.kind === 'app' ? `(${termToString(t.arg)})` : termToString(t.arg);
      return `(${fn} ${arg})`;
    }
  }
}
