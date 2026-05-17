/**
 * ST Text Layer 2.0 — MDX bridge.
 *
 * Conversión bidireccional Claim[] ↔ MDX con diff de cambios.
 *
 *   mdxToClaims(mdx)            → MDXClaim[]
 *   claimsToMDX(claims, opts?)  → string
 *   diffMDX(before, after)      → MDXDelta
 */

export { mdxToClaims, mdxToClaimsDetailed, stripMDXMetadata } from './parser';
export { claimsToMDX } from './serializer';
export { diffMDX } from './diff';
export type {
  MDXClaim,
  MDXClaimTemplate,
  ClaimsToMDXOptions,
  MDXDelta,
  MDXParseWarning,
  MDXParseResult,
} from './types';
