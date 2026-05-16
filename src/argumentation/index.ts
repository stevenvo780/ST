// ============================================================
// ST Argumentation — Barrel export (Dung framework)
// ============================================================

export type { ArgumentationFramework, Semantics, ComputeOptions } from './types';
export { DEFAULT_EXHAUSTIVE_LIMIT } from './types';
export {
  createFramework,
  attackersOf,
  attackedBy,
  attackedBySet,
  hasAttack,
  isConflictFree,
  defends,
  isAdmissible,
  characteristicFunction,
  setsEqual,
  isSubset,
} from './framework';
export {
  groundedExtension,
  preferredExtensions,
  stableExtensions,
  completeExtensions,
  semiStableExtensions,
  isComplete,
  isStable,
  lazyAdmissibleSets,
  computeExtensions,
} from './extensions';
export { dotExport } from './dot';
