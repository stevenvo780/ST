// ============================================================
// NbE para STLC — Tipos sintácticos y dominio semántico
// ============================================================
//
// Términos del λ-cálculo simplemente tipado (STLC) y los valores
// semánticos sobre los que evaluamos. La separación entre sintaxis
// (Term, Type) y semántica (Value, Neutral) es lo que hace al
// algoritmo NbE limpio: evaluar produce valores; reificar los baja
// otra vez a términos en forma normal η-larga.

/** Tipo del STLC para NbE: tipo base `base` o flecha `from → to`. */
export type Type = { kind: 'base'; name: string } | { kind: 'arrow'; from: Type; to: Type };

/** Término sintáctico del STLC: variable, abstracción λ o aplicación. */
export type Term =
  | { kind: 'var'; name: string }
  | { kind: 'abs'; param: string; paramType: Type; body: Term }
  | { kind: 'app'; fn: Term; arg: Term };

/**
 * Valor semántico del NbE para STLC.
 * `'neutral'` = variable libre o aplicación bloqueada; `'closure'` = λ capturada con entorno léxico.
 */
export type Value =
  | { kind: 'neutral'; head: Neutral }
  | { kind: 'closure'; env: Env; param: string; paramType: Type; body: Term };

/** Término neutral: variable libre o aplicación cuya cabeza es neutral. */
export type Neutral = { kind: 'var'; name: string } | { kind: 'app'; head: Neutral; arg: Value };

/** Entorno léxico para NbE: mapa de variables a valores semánticos. */
export type Env = Map<string, Value>;

// ---------- Constructores sintácticos ----------
/** Tipo base (primitivo) con nombre. */
export const tBase = (name: string): Type => ({ kind: 'base', name });
/** Tipo flecha `from → to`. */
export const tArr = (from: Type, to: Type): Type => ({ kind: 'arrow', from, to });

/** Variable sintáctica. */
export const v = (name: string): Term => ({ kind: 'var', name });
/** Abstracción λ sintáctica. */
export const lam = (param: string, paramType: Type, body: Term): Term => ({
  kind: 'abs',
  param,
  paramType,
  body,
});
/** Aplicación binaria `fn arg`. */
export const ap = (fn: Term, arg: Term): Term => ({ kind: 'app', fn, arg });
/** Aplicación n-aria: `apN(f, a, b, c)` = `((f a) b) c`. */
export const apN = (head: Term, ...args: Term[]): Term => args.reduce(ap, head);

// ---------- Constructores semánticos ----------
/** Valor neutral de una variable libre `name`. */
export const vNeutralVar = (name: string): Value => ({
  kind: 'neutral',
  head: { kind: 'var', name },
});
/** Valor neutral a partir de una cabeza neutral. */
export const vNeutral = (head: Neutral): Value => ({ kind: 'neutral', head });
/** Valor closure (λ semántica) con entorno léxico. */
export const vClosure = (env: Env, param: string, paramType: Type, body: Term): Value => ({
  kind: 'closure',
  env,
  param,
  paramType,
  body,
});

// ---------- Igualdad estructural módulo α ----------
/** Igualdad α-equivalente entre términos STLC (renombra binders a posiciones canónicas). */
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

/** Igualdad estructural entre dos tipos STLC. */
export function typeEq(a: Type, b: Type): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'base' && b.kind === 'base') return a.name === b.name;
  if (a.kind === 'arrow' && b.kind === 'arrow') {
    return typeEq(a.from, b.from) && typeEq(a.to, b.to);
  }
  return false;
}

// Pretty-printer mínimo para términos y tipos (útil en tests/debug).
/** Serializa un tipo STLC a texto (flechas asociativas a la derecha). */
export function typeToString(t: Type): string {
  if (t.kind === 'base') return t.name;
  // arrow es asociativo a la derecha: A → B → C  ≡  A → (B → C)
  const from = t.from.kind === 'arrow' ? `(${typeToString(t.from)})` : typeToString(t.from);
  return `${from} → ${typeToString(t.to)}`;
}

/** Serializa un término STLC a texto legible. */
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
