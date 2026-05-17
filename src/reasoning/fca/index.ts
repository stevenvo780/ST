// ============================================================
// ST Formal Concept Analysis — barrel público.
// ============================================================
// Marco matemático (Wille 1982, Ganter & Wille 1999) para extraer un
// retículo de conceptos a partir de una relación binaria objeto-atributo.
//
// API mínima:
//   createContext(G, M, I)        → FormalContext
//   derivativeObjects(K, B)       → B'   (objetos)
//   derivativeAttributes(K, A)    → A'   (atributos)
//   isConcept(K, A, B)            → (A, B) ∈ B(K)?
//   closeIntent(K, B)             → B''  (clausura Galois sobre atributos)
//   allConcepts(K)                → todos los conceptos (Next Closure)
//   lattice(concepts)             → diagrama de Hasse (aristas cobertura)
//   impliesAll(K, P, C)           → ¿P → C válida en K?
//
// Uso típico:
//   const K = createContext(objs, attrs, pairs);
//   const concepts = allConcepts(K);
//   const hasse = lattice(concepts);
// ============================================================

export type { FormalContext, FormalConcept, HasseLattice } from './types';
export {
  createContext,
  derivativeObjects,
  derivativeAttributes,
  isConcept,
  closeIntent,
  closeExtent,
  hasIncidence,
} from './context';
export { allConcepts } from './next-closure';
export { lattice } from './lattice';
export { impliesAll } from './implications';
