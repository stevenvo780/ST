// ============================================================
// ST Term Rewriting — Barrel de exportaciones
// ============================================================

export type { Term, RewriteRule, TRS, Substitution, KBOptions, KBResult } from './types';

export {
  termEquals,
  cloneTerm,
  varsOf,
  applySubst,
  occursIn,
  match,
  unify,
  renameVars,
  termSize,
  v,
  f,
  c,
} from './term-utils';

export { rewriteStep, normalize, allPositions, subtermAt, replaceAt } from './rewrite';

export { lpo, lpoCompare } from './lpo';
export type { LPOComparison } from './lpo';

export { criticalPairsBetween, allCriticalPairs, isConfluent, freeVarsOf } from './critical-pairs';
export type { CriticalPair } from './critical-pairs';

export { knuthBendixCompletion, orient, makeTRS } from './knuth-bendix';
