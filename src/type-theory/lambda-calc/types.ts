// ============================================================
// λ-cálculo untyped — Términos, constructores y serialización
// ============================================================
//
// Distinto al módulo curry-howard (typed λ-cálculo con conexión a
// deducción natural): aquí trabajamos λ puro, sin tipos, con
// β/η-reducción, varias estrategias de normalización y los
// combinadores clásicos (I, K, S, Y) + Church numerals.

export type Term =
  | { kind: 'var'; name: string }
  | { kind: 'abs'; param: string; body: Term }
  | { kind: 'app'; fn: Term; arg: Term };

// ---------- Constructores convenientes ----------
export const v = (name: string): Term => ({ kind: 'var', name });
export const lam = (param: string, body: Term): Term => ({ kind: 'abs', param, body });
export const ap = (fn: Term, arg: Term): Term => ({ kind: 'app', fn, arg });

// Aplicación n-aria por la izquierda: apN(f, a, b, c) = ((f a) b) c
export const apN = (head: Term, ...args: Term[]): Term => args.reduce(ap, head);

// Igualdad estructural módulo α (alpha-equivalencia).
// Compara términos renombrando binders a posiciones canónicas.
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

// Pretty-printer minimalista. Aplicación es asociativa a la izquierda,
// abstracción se extiende lo más posible a la derecha.
export function termToString(t: Term): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'abs':
      return `(λ${t.param}.${termToString(t.body)})`;
    case 'app': {
      const fn = termToString(t.fn);
      const arg = t.arg.kind === 'app' ? `(${termToString(t.arg)})` : termToString(t.arg);
      return `(${fn} ${arg})`;
    }
  }
}
