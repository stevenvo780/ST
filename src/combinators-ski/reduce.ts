// ============================================================
// SKI combinatory logic — Reducción
// ============================================================
//
// Reglas (weak reduction, leftmost-outermost):
//   I x      → x
//   K x y    → x          (descarta `y` aunque éste tenga redex propios)
//   S x y z  → x z (y z)
//
// `reduceStep` aplica un único paso si encuentra un redex en la
// cabeza o, si no, baja por las ramas siguiendo orden
// leftmost-outermost. Como no hay binders ni captura, no se requiere
// renombrar; la sustitución es pegado físico de subárboles.
//
// La forma normal SKI puede no existir (e.g. términos divergentes
// equivalentes a Ω), por lo que `normalize` recibe `maxSteps`.

import type { CTerm } from './types';

// Devuelve el término reducido en UN paso, o `null` si no hay redex.
export function reduceStep(t: CTerm): CTerm | null {
  // Intenta primero un paso en la posición de cabeza.
  const head = reduceHead(t);
  if (head !== null) return head;
  // Si no hay redex en cabeza, baja recursivamente.
  switch (t.kind) {
    case 'app': {
      const fn2 = reduceStep(t.fn);
      if (fn2 !== null) return { kind: 'app', fn: fn2, arg: t.arg };
      const arg2 = reduceStep(t.arg);
      if (arg2 !== null) return { kind: 'app', fn: t.fn, arg: arg2 };
      return null;
    }
    default:
      return null;
  }
}

// Intenta una reducción en la posición de cabeza del término.
// Devuelve `null` si no hay redex de cabeza.
function reduceHead(t: CTerm): CTerm | null {
  if (t.kind !== 'app') return null;

  // Junta la cabeza (combinador o variable) con sus argumentos
  // recorridos por la espina izquierda.
  const spine: CTerm[] = [];
  let cursor: CTerm = t;
  while (cursor.kind === 'app') {
    spine.unshift(cursor.arg);
    cursor = cursor.fn;
  }
  // `cursor` es la cabeza definitiva (S/K/I/var); `spine` son los args
  // aplicados de izquierda a derecha.

  switch (cursor.kind) {
    case 'I': {
      const x = spine[0];
      if (x === undefined) return null;
      // I x rest... → x rest...
      return rebuild(x, spine.slice(1));
    }
    case 'K': {
      const x = spine[0];
      const y = spine[1];
      if (x === undefined || y === undefined) return null;
      // K x y rest... → x rest...     (y se descarta)
      return rebuild(x, spine.slice(2));
    }
    case 'S': {
      const x = spine[0];
      const y = spine[1];
      const z = spine[2];
      if (x === undefined || y === undefined || z === undefined) return null;
      // S x y z rest... → (x z (y z)) rest...
      const reduced: CTerm = {
        kind: 'app',
        fn: { kind: 'app', fn: x, arg: z },
        arg: { kind: 'app', fn: y, arg: z },
      };
      return rebuild(reduced, spine.slice(3));
    }
    default:
      return null;
  }
}

// Reconstruye `head arg0 arg1 ...` como aplicación asociativa a la izquierda.
function rebuild(head: CTerm, args: CTerm[]): CTerm {
  let acc: CTerm = head;
  for (const a of args) {
    acc = { kind: 'app', fn: acc, arg: a };
  }
  return acc;
}

export interface NormalizeResult {
  result: CTerm;
  steps: number;
  terminated: boolean;
}

// Itera reducciones hasta forma normal o agotar `maxSteps`.
// `terminated=true` significa que no quedan redex (forma normal SKI);
// `false` indica que se alcanzó el cap (típico para términos divergentes).
export function normalize(t: CTerm, maxSteps = 1000): NormalizeResult {
  let current = t;
  let steps = 0;
  for (; steps < maxSteps; steps += 1) {
    const next = reduceStep(current);
    if (next === null) return { result: current, steps, terminated: true };
    current = next;
  }
  return { result: current, steps, terminated: false };
}

// ¿No hay más redex aplicable?
export function isNormalForm(t: CTerm): boolean {
  return reduceStep(t) === null;
}
