export { TheoremCache, tryReuseProof } from './cache';
export type { CachedTheorem, CacheOptions, CacheStats, ReuseResult } from './cache';
export {
  canonicalize,
  canonicalString,
  computeSubstitution,
  applySubstitution,
  normalizeWhitespace,
} from './canonical';
export type { CanonicalResult } from './canonical';
export { matchPattern, patternMatches } from './pattern';
