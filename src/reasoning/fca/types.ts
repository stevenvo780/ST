// ============================================================
// Formal Concept Analysis (FCA) — tipos públicos
// ============================================================
// Marco matemático de Wille (1982) para extraer una jerarquía conceptual
// a partir de una relación binaria objeto-atributo.
//
// Contexto formal:
//   K = (G, M, I)
//     G  conjunto finito de "objetos"
//     M  conjunto finito de "atributos"
//     I ⊆ G × M  relación de incidencia ("el objeto g tiene el atributo m")
//
// Operadores de derivación (polares de Galois):
//   A' = { m ∈ M | ∀ g ∈ A. (g, m) ∈ I }     (atributos comunes a A ⊆ G)
//   B' = { g ∈ G | ∀ m ∈ B. (g, m) ∈ I }     (objetos que poseen todo B ⊆ M)
//
// Un concepto formal es un par (A, B) con A ⊆ G, B ⊆ M tal que
//   A' = B  y  B' = A
// equivalentemente:  A = A''  y  B = B''  (clausura).
//
// El conjunto B(K) de todos los conceptos, ordenado por
//   (A1, B1) ≤ (A2, B2) ⇔ A1 ⊆ A2  ( ⇔ B2 ⊆ B1 )
// forma un retículo completo (lattice), el "concept lattice".
//
// Top:     (G, G')   — todos los objetos, atributos comunes.
// Bottom:  (M', M)   — atributos en todos, en general ∅ objetos.
// ============================================================

/**
 * Contexto formal K = (G, M, I).
 *  - `objects`    G como lista finita ordenada.
 *  - `attributes` M como lista finita ordenada.
 *  - `incidence`  representación canónica como conjunto de pares
 *                 codificados "objeto|atributo" para test O(1).
 */
export interface FormalContext {
  objects: string[];
  attributes: string[];
  incidence: Set<string>;
}

/**
 * Concepto formal (A, B) con A = extent, B = intent.
 * Invariante: A' = B y B' = A (verificable con `isConcept`).
 */
export interface FormalConcept {
  extent: Set<string>;
  intent: Set<string>;
}

/**
 * Diagrama de Hasse del concept lattice como lista de aristas de cobertura.
 * `edges[i] = [child, parent]` significa que el concepto `child` está cubierto
 * inmediatamente por `parent` (no hay concepto intermedio estricto).
 * Los índices son posiciones en el array de conceptos devuelto por
 * `allConcepts`.
 */
export interface HasseLattice {
  edges: Array<[number, number]>;
}
