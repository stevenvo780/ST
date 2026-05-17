// ============================================================
// ST Description Logic — Public API (ALC profile)
// ============================================================
// Perfil ALC: el fragmento base de OWL/DL. Provee un decisor
// completo y terminante para satisfacibilidad de conceptos,
// subsumption, instance checking y clasificación.
//
// Procedimiento: tableau con subset blocking. Termina sobre KBs
// cíclicas. NO se inscribe en el ProfileRegistry (esto es un módulo
// de razonamiento independiente, no un perfil sentencial textual).
// ============================================================

export type { DLConcept, DLConceptKind, DLAxiom, DLAxiomKind, DLKnowledgeBase } from './types';

export {
  TOP,
  BOTTOM,
  atomic,
  not,
  and,
  or,
  exists,
  forall,
  subsumes,
  equivalent,
  instance,
  roleInstance,
  emptyKB,
} from './types';

export { toNNF, conceptHash, conceptEqual, conceptToString } from './nnf';

export { isSatisfiable, isSubsumed, isInstance, classify } from './tableau';
