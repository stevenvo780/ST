# `semantics/text-layer/v2/mdx-bridge/index.ts`

ST Text Layer 2.0 — MDX bridge.

Conversión bidireccional Claim[] ↔ MDX con diff de cambios.

  mdxToClaims(mdx)            → MDXClaim[]
  claimsToMDX(claims, opts?)  → string
  diffMDX(before, after)      → MDXDelta
