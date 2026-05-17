// ============================================================
// ST Mathlib — Tipos base para estructuras algebraicas
// Inspirado en Lean mathlib, subset mínimo para enseñanza.
// ============================================================

/**
 * Estructura algebraica genérica: un dominio de elementos + un
 * diccionario de operaciones + una lista de axiomas declarados.
 *
 * `elements` puede ser un arreglo finito (para grupos finitos como S_3)
 * o un generador indexado (para anillos infinitos como Z donde se
 * muestrea un subconjunto representativo).
 */
export interface AlgebraicStructure<T> {
  name: string;
  elements: T[] | ((idx: number) => T);
  operations: Map<string, (...args: T[]) => T>;
  axioms: AlgebraAxiom[];
}

/**
 * Un axioma con su fórmula informal (template) y un verificador
 * computacional opcional que decide si los elementos lo cumplen.
 */
export interface AlgebraAxiom {
  name: string;
  formula: string;
  verifier?: (elements: unknown[], ops: Map<string, unknown>) => boolean;
}

// ============================================================
// Order theory
// ============================================================

export interface PartialOrder<T> {
  leq(a: T, b: T): boolean;
}

export interface TotalOrder<T> extends PartialOrder<T> {
  compare(a: T, b: T): -1 | 0 | 1;
}

// ============================================================
// Group theory
// ============================================================

export interface Magma<T> {
  op: (a: T, b: T) => T;
}

// Semigroup no añade campos en runtime: el axioma asociatividad
// se verifica con isAssociative.
export interface Semigroup<T> extends Magma<T> {
  readonly _semigroup?: true;
}

export interface Monoid<T> extends Semigroup<T> {
  identity: T;
}

export interface Group<T> extends Monoid<T> {
  inverse: (a: T) => T;
}

export interface AbelianGroup<T> extends Group<T> {
  readonly _abelian?: true;
}

// ============================================================
// Ring theory
// ============================================================

export interface Ring<T> {
  add: (a: T, b: T) => T;
  mul: (a: T, b: T) => T;
  zero: T;
  one: T;
  neg: (a: T) => T;
}

// ============================================================
// Lemmas — afirmaciones reutilizables con verificación opcional
// ============================================================

export interface Lemma {
  name: string;
  statement: string;
  applicableTo: (structure: AlgebraicStructure<unknown>) => boolean;
  proof?: string;
}

// ============================================================
// Resultado uniforme de verificación
// ============================================================

export interface VerificationResult {
  valid: boolean;
  failures: string[];
}
