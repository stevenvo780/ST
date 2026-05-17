// ============================================================
// Bisimulation — tipos públicos
// ============================================================
// Sistema de Transiciones Etiquetadas (LTS, Labelled Transition System):
//   M = (S, Act, →, L)
//     S       conjunto finito de estados
//     Act     alfabeto de acciones
//     →       relación de transición ⊆ S × Act × S
//     L       función de etiquetado opcional S → 2^AP (proposiciones atómicas)
//
// La bisimulación fuerte ~ es la mayor relación R ⊆ S × S tal que (s, t) ∈ R
// implica:
//   1. L(s) = L(t)                                            (mismas etiquetas)
//   2. ∀ s -a-> s'.  ∃ t'. t -a-> t' ∧ (s', t') ∈ R           (forward simulation)
//   3. ∀ t -a-> t'.  ∃ s'. s -a-> s' ∧ (s', t') ∈ R           (backward simulation)
//
// La bisimulación débil ignora τ-transiciones internas y compara cadenas
//   s ⇒ s' ≡ s -τ*-> ·-a-> ·-τ*-> s'
// ============================================================

/**
 * Sistema de transiciones etiquetadas.
 *  - `states`      lista finita de identificadores de estado.
 *  - `transitions` triplas [from, action, to] que codifican →.
 *  - `labelling`   opcional: estado → conjunto de proposiciones atómicas que
 *                  se cumplen en él. Estados ausentes se tratan como ∅.
 */
export interface LTS {
  states: string[];
  transitions: Array<[string, string, string]>;
  labelling?: Record<string, Set<string>>;
}

/**
 * Resultado de un algoritmo de partition refinement.
 *  - `partition`  estado → índice de bloque.
 *  - `blocks`     bloques como listas de estados (índice consistente con partition).
 *  - `numBlocks`  cardinalidad de la partición final.
 *  - `iterations` número de iteraciones de refinamiento ejecutadas.
 */
export interface BisimulationResult {
  partition: Map<string, number>;
  blocks: string[][];
  numBlocks: number;
  iterations: number;
}
