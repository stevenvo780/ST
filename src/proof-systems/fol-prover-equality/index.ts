export type {
  EqualityProveResult,
  EqualityProveStep,
  EqualityProveOptions,
  EqualityRule,
} from './types';
export { EQ_PREDICATE } from './types';

export {
  paramodulate,
  paramodulateAll,
  paramodulateWithSubst,
  reflexivityResolve,
} from './paramodulate';
export { demodulate, equalityFactor } from './demodulate';
export type { DemodulationRule } from './demodulate';
export { proveWithEquality } from './prove';
export {
  allLiteralPositions,
  allPositions,
  compareTerms,
  isEqualityLiteral,
  replaceAt,
  replaceLiteralSubterm,
  termAt,
} from './term-utils';
