// ============================================================
// Higher-Order Logic (HOL Light style) — Tipos
// ============================================================
//
// HOL = lógica de tipos simples + λ-binding + igualdad primitiva.
// Inspirado en HOL Light / Isabelle/HOL: un núcleo deductivo
// minimal con 10 reglas primitivas; el resto del aparato lógico
// (conectivas, cuantificadores) se define en términos de la
// igualdad polimórfica.
//
// Convención de typing: `bool` es el tipo de proposiciones,
// `ind` el tipo de individuos. Los tipos compuestos se forman
// con `fun(A, B)` que corresponde a `A → B`. Las variables de
// tipo (`tvar`) permiten polimorfismo paramétrico (let-style).
//
// Convención de terms (siguiendo HOL Light):
//   - `var`  variable libre de un tipo
//   - `const` constante (igualdad, conectivas definidas, etc.)
//   - `comb f x` aplicación de funciones (f x)
//   - `abs x.t` λ-abstracción
//
// Nota sobre nombres de variables: dos `var` con el mismo
// nombre PERO distinto tipo son variables distintas (HOL Light).

/**
 * Tipos en HOL: variables de tipo, constantes (`bool`, `ind`,
 * ...) y aplicaciones de constructores de tipo (`fun(α, β)`,
 * `prod(α, β)`, ...).
 */
export type HOLType =
  | { kind: 'tvar'; name: string }
  | { kind: 'tconst'; name: string }
  | { kind: 'tapp'; fn: string; args: HOLType[] };

/**
 * Términos HOL. Polimorfismo via `tvar` en los tipos de
 * variables/constantes. `comb` es aplicación; `abs` es
 * λ-abstracción con el tipo del parámetro registrado.
 */
export type HOLTerm =
  | { kind: 'var'; name: string; type: HOLType }
  | { kind: 'const'; name: string; type: HOLType }
  | { kind: 'comb'; fn: HOLTerm; arg: HOLTerm }
  | { kind: 'abs'; param: string; paramType: HOLType; body: HOLTerm };

/**
 * Secuente abstracto. Las hipótesis son una multiset modelada
 * como array; la igualdad se chequea por α-equivalencia.
 */
export interface HOLSequent {
  hyps: HOLTerm[];
  concl: HOLTerm;
}

/**
 * Teorema HOL: hipótesis + conclusión + huella de la regla
 * usada y los teoremas-premisa. Solo se obtiene aplicando una
 * regla primitiva — no hay constructor público.
 */
export interface HOLTheorem {
  readonly hyps: HOLTerm[];
  readonly concl: HOLTerm;
  readonly rule: string;
  readonly derived?: HOLTheorem[];
}
