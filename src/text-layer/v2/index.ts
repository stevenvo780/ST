/**
 * ST Text Layer 2.0 — entry point.
 */

export type { Claim, ClaimValidation, ClaimSource, ClaimEvaluator } from './types';
export { ClaimGraph, CycleError } from './claim-graph';
export {
  mdxToClaims,
  mdxToClaimsDetailed,
  claimsToMDX,
  diffMDX,
  stripMDXMetadata,
} from './mdx-bridge';
export type {
  MDXClaim,
  MDXClaimTemplate,
  ClaimsToMDXOptions,
  MDXDelta,
  MDXParseWarning,
  MDXParseResult,
} from './mdx-bridge';
