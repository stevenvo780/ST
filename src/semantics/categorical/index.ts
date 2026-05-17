// ============================================================
// ST Categorical — Punto de entrada público
// ============================================================
// Re-exporta primitivas de teoría de categorías: Category,
// Functor, NaturalTransformation, límites/colímites concretos
// en FinSet, y estructura monoidal estricta sobre FinSet.
// ============================================================

export type {
  Category,
  Functor,
  NaturalTransformation,
  Cone,
  Cocone,
  Diagram,
  MonoidalCategory,
  MorId,
} from './types';

export { FinSet, mkFinSetMor } from './fin-set';
export type { FinSetObj, FinSetMor } from './fin-set';

export { Poset } from './poset';
export type { PosetMor } from './poset';

export { Free } from './free';
export type { FreeMor } from './free';

export {
  mkFunctor,
  identityFunctor,
  composeFunctors,
  mkNaturalTransformation,
  identityNT,
} from './functor';

export { isCone, isLimit, product, coproduct, equalizer, coequalizer } from './limits';

export { FinSetMonoidal } from './monoidal';
