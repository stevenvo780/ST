// ============================================================
// ST Group Presentation — barrel público.
// ============================================================
// Presentaciones finitas de grupos ⟨S | R⟩, palabras en el grupo
// libre F(S), reducción libre, multiplicación, Todd-Coxeter para
// enumeración de cosets, orden de grupo finito, pertenencia a
// subgrupo y grafo de Cayley.
//
// Convención del alfabeto: letras a-z son generadores positivos,
// A-Z son sus inversos (case-flip). Las palabras son `Generator[]`,
// la palabra vacía representa el neutro 1.
// ============================================================

export type { Generator, Word, GroupPresentation } from './types';

export {
  inverse,
  reduceWord,
  multiplyWords,
  invertWord,
  wordEquals,
  isReduced,
  parseWord,
  wordToString,
} from './words';

export type { CosetTable } from './todd-coxeter';
export { toddCoxeter, groupOrder, isInSubgroup } from './todd-coxeter';

export { cyclicGroupZn, dihedralGroupDn, freeGroupFn, symmetricGroupSn } from './standard-groups';

export type { CayleyGraph } from './cayley';
export { cayleyGraph } from './cayley';
