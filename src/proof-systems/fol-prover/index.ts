export type {
  FOLTerm,
  FOLLiteral,
  FOLClause,
  FOLProveResult,
  FOLProveOptions,
  FOLResolutionStep,
} from './types';
export {
  mkVar,
  mkConst,
  mkFunc,
  mkLit,
  termToString,
  literalToString,
  clauseToString,
} from './types';
export { unify, applyTerm, applyLiteral, applyClause, substToRecord } from './unify';
export { skolemize, toCNF, negate } from './cnf';
export { resolve, runResolutionLoop } from './resolve';
export { proveFOL } from './prove';
