// ============================================================
// ST Mathlib — Subset curado de definiciones algebraicas.
// Inspirado en Lean mathlib. Soporta order theory, group theory,
// ring theory + instancias estándar (Z, Q, Z/nZ, S_3) + lemas.
// ============================================================

export type {
  AlgebraicStructure,
  AlgebraAxiom,
  PartialOrder,
  TotalOrder,
  Magma,
  Semigroup,
  Monoid,
  Group,
  AbelianGroup,
  Ring,
  Lemma,
  VerificationResult,
} from './types';

export { isReflexive, isAntisymmetric, isTransitive, isLattice, verifyPartialOrder } from './order';

export {
  isAssociative,
  isCommutative,
  hasIdentity,
  hasInverses,
  verifyGroup,
  verifyAbelianGroup,
} from './group';

export { verifyRing, isField } from './ring';

export {
  intAdditiveGroup,
  intRing,
  rationalsField,
  rational,
  rationalEq,
  rationalDiv,
  zModN,
  zModNElements,
  zModNDiv,
  sym3,
  sym3Elements,
  perm3Eq,
} from './instances';
export type { Rational, Perm3 } from './instances';

export { STANDARD_LEMMAS } from './lemmas';
