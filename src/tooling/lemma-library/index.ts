// ============================================================
// ST Lemma Library — entrypoint público.
//
// Biblioteca curada de lemas pre-probados (proposicional, primer
// orden, modal, aritmética, conjuntos) + búsqueda TF-IDF + intento
// de aplicación automática contra un goal.
// ============================================================

export type {
  CuratedLemma,
  LemmaDomain,
  LemmaDifficulty,
  LemmaApplicationResult,
  SemanticSearchHit,
  TfIdfDocument,
  TfIdfIndex,
} from './types';

export { LemmaLibrary } from './library';
export type { SearchOptions } from './library';

export { buildIndex, semanticSearch } from './tfidf';
export { tryApplyLemma } from './apply';
export { tokenize } from './tokenize';

export { PROPOSITIONAL_LEMMAS } from './propositional';
export { ARITHMETIC_LEMMAS } from './arithmetic';
export { SET_THEORY_LEMMAS } from './set-theory';
export { MODAL_LEMMAS } from './modal';
export { FIRSTORDER_LEMMAS } from './firstorder';

export { standardLibrary } from './standard';
