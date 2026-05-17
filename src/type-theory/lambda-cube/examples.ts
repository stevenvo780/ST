// ============================================================
// Lambda Cube — Términos canónicos
// ============================================================
//
// Construcciones clásicas de cada vértice del cubo. Cada función
// devuelve un `CubeTerm` directamente; el tipo correspondiente es
// inferible con `inferType` en el sistema apropiado.

import { type CubeTerm, cVar, cLam, cApp, cPi, cArrow, cStar } from './types';

/**
 * Identidad polimórfica: λ X:*. λ x:X. x  ∈ λ2.
 * Tipo: Π X:*. X → X.
 */
export function polymorphicIdentity(): CubeTerm {
  return cLam('X', cStar, cLam('x', cVar('X'), cVar('x')));
}

/** Tipo de la identidad polimórfica: Π X:*. X → X. */
export function polymorphicIdentityType(): CubeTerm {
  return cPi('X', cStar, cArrow(cVar('X'), cVar('X')));
}

/**
 * Encoding Church de un natural `n` en System F:
 *     n = λ X:*. λ s:X→X. λ z:X. s (s (... (s z) ...))   con n aplicaciones
 *
 * Tipo: Π X:*. (X → X) → X → X.
 */
export function churchNumeral(n: number): CubeTerm {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`churchNumeral requiere natural ≥ 0, recibió ${n}`);
  }
  const X = cVar('X');
  let body: CubeTerm = cVar('z');
  for (let i = 0; i < n; i++) {
    body = cApp(cVar('s'), body);
  }
  return cLam('X', cStar, cLam('s', cArrow(X, X), cLam('z', X, body)));
}

/** Tipo de un natural Church: Π X:*. (X → X) → X → X. */
export function churchNumeralType(): CubeTerm {
  const X = cVar('X');
  return cPi('X', cStar, cArrow(cArrow(X, X), cArrow(X, X)));
}

/**
 * Tipo polimórfico de pares: Π A:*. Π B:*. (Π C:*. (A → B → C) → C) → ...
 * En la versión sencilla devolvemos solo el tipo de "Pair A B":
 *
 *   Π A:*. Π B:*. Π C:*. (A → B → C) → C
 */
export function churchPairType(): CubeTerm {
  const A = cVar('A');
  const B = cVar('B');
  const C = cVar('C');
  return cPi('A', cStar, cPi('B', cStar, cPi('C', cStar, cArrow(cArrow(A, cArrow(B, C)), C))));
}

/**
 * Esquema de "lista dependiente": dado un tipo de vectores indexado
 * por `Nat`, devolvemos el Π típico
 *
 *   Π n : Nat. Vector n
 *
 * Requiere que el contexto declare `Nat : *` y `Vector : Nat → *`.
 * Atención: ambos extremos son `*`, así que esta Π usa la regla
 * (*,*) y queda legal incluso en λ→ una vez que `Vector` está en el
 * contexto. El sabor "dependiente" viene del hecho de que el
 * codominio menciona el binder `n`.
 */
export function dependentList(): CubeTerm {
  return cPi('n', cVar('Nat'), cApp(cVar('Vector'), cVar('n')));
}

/**
 * Predicado sobre `Nat`: `Π n:Nat. *`. Domino `Nat : *` y codominio
 * `*` (cuyo sort es `◻`). Esa es justo la formación (*,◻) — exclusiva
 * de los vértices con tipos dependientes (λP, λP2, λPω, λC).
 *
 * Requiere `Nat : *` en el contexto.
 */
export function predicateOverNat(): CubeTerm {
  return cPi('n', cVar('Nat'), cStar);
}

/**
 * Operador de tipo `id-type`: λ A:*. A → A  en λω.
 * Tipo: * → *.
 */
export function typeLevelIdentity(): CubeTerm {
  return cLam('A', cStar, cArrow(cVar('A'), cVar('A')));
}

/** Tipo del operador `typeLevelIdentity`: * → *. */
export function typeLevelIdentityKind(): CubeTerm {
  return cArrow(cStar, cStar);
}

/**
 * En el Calculus of Constructions, el tipo polimórfico
 *   Π A:*. A → A
 * vive en el universo `*`.
 */
export function cocPolyIdentityType(): CubeTerm {
  return cPi('A', cStar, cArrow(cVar('A'), cVar('A')));
}
