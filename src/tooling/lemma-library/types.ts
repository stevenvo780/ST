// ============================================================
// ST Lemma Library — Tipos base
//
// Biblioteca curada de lemas pre-probados organizados por dominio
// (proposicional, primer orden, modal, aritmética, conjuntos, …)
// con metadata para búsqueda, filtrado y aplicación automática.
// ============================================================

/**
 * Dominio del lema. Las constantes documentadas son los cinco
 * dominios curados de base, pero se permite cualquier string para
 * extensiones de usuario.
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type LemmaDomain = 'propositional' | 'firstorder' | 'modal' | 'arithmetic' | 'set' | string;

export type LemmaDifficulty = 'trivial' | 'easy' | 'medium' | 'hard';

/**
 * Un lema curado: enunciado canónico + metadata para búsqueda y
 * aplicación. El campo `statement` se asume en forma normalizada
 * (ASCII + Unicode lógico estándar: ∧ ∨ ¬ → ↔ ∀ ∃ □ ◇).
 */
export interface CuratedLemma {
  id: string;
  name: string;
  statement: string;
  domain: LemmaDomain;
  tags: string[];
  difficulty: LemmaDifficulty;
  provedBy?: { profile: string; proof?: unknown };
  references?: string[];
  isAxiom?: boolean;
}

/**
 * Documento indexado por TF-IDF: bag-of-words tokenizado con su
 * frecuencia local y un puntero al lema original.
 */
export interface TfIdfDocument {
  lemmaId: string;
  termFreq: Map<string, number>;
  length: number;
}

/**
 * Índice TF-IDF pre-calculado sobre la biblioteca completa.
 */
export interface TfIdfIndex {
  documents: TfIdfDocument[];
  docFreq: Map<string, number>;
  totalDocs: number;
  lemmas: Map<string, CuratedLemma>;
}

export interface SemanticSearchHit {
  lemma: CuratedLemma;
  score: number;
}

export interface LemmaApplicationResult {
  applicable: CuratedLemma[];
  substitutions?: Map<string, string>;
}
