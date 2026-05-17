// ============================================================
// SKI combinatory logic — Términos y constructores
// ============================================================
//
// Sistema base de combinadores S, K, I (Schönfinkel / Curry). Es
// Turing-completo y equivalente al λ-cálculo, pero sin variables
// ligadas: toda función se construye combinando S, K, I y variables
// libres mediante aplicación. Las λ-abstracciones se "eliminan"
// vía bracket abstraction (ver `abstract.ts`).
//
// Reglas de reducción:
//   I x      → x
//   K x y    → x
//   S x y z  → x z (y z)

export type CTerm =
  | { kind: 'S' }
  | { kind: 'K' }
  | { kind: 'I' }
  | { kind: 'var'; name: string }
  | { kind: 'app'; fn: CTerm; arg: CTerm };

// ---------- Constructores convenientes ----------
export const S = (): CTerm => ({ kind: 'S' });
export const K = (): CTerm => ({ kind: 'K' });
export const I = (): CTerm => ({ kind: 'I' });
export const cvar = (name: string): CTerm => ({ kind: 'var', name });

// Aplicación n-aria asociativa a la izquierda: app(f, a, b, c) = ((f a) b) c.
// Con un solo argumento devuelve el término tal cual; sin argumentos lanza.
export function app(...ts: CTerm[]): CTerm {
  const head = ts[0];
  if (head === undefined) {
    throw new Error('app() requiere al menos un término');
  }
  let acc: CTerm = head;
  for (let i = 1; i < ts.length; i += 1) {
    const next = ts[i];
    if (next === undefined) break;
    acc = { kind: 'app', fn: acc, arg: next };
  }
  return acc;
}

// Igualdad estructural (no hay alpha — no hay binders).
export function ctermEq(a: CTerm, b: CTerm): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'S':
    case 'K':
    case 'I':
      return true;
    case 'var':
      return a.name === (b as typeof a).name;
    case 'app': {
      const bb = b as typeof a;
      return ctermEq(a.fn, bb.fn) && ctermEq(a.arg, bb.arg);
    }
  }
}

// Pretty-printer. Aplicación asociativa a la izquierda: agrupa con
// paréntesis sólo cuando el argumento es a su vez una aplicación.
export function termToString(t: CTerm): string {
  switch (t.kind) {
    case 'S':
      return 'S';
    case 'K':
      return 'K';
    case 'I':
      return 'I';
    case 'var':
      return t.name;
    case 'app': {
      const fn = termToString(t.fn);
      const arg = t.arg.kind === 'app' ? `(${termToString(t.arg)})` : termToString(t.arg);
      return `${fn} ${arg}`;
    }
  }
}

// Variables libres del término (no hay ligadas en SKI puro).
export function freeVars(t: CTerm): Set<string> {
  const acc = new Set<string>();
  collect(t, acc);
  return acc;
}

function collect(t: CTerm, acc: Set<string>): void {
  switch (t.kind) {
    case 'var':
      acc.add(t.name);
      return;
    case 'app':
      collect(t.fn, acc);
      collect(t.arg, acc);
      return;
    default:
      return;
  }
}
