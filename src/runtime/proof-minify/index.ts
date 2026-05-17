// ============================================================
// ST Proof Minification — Barrel
// ============================================================

export {
  minifyProof,
  compactModusPonensChain,
  removeUnusedSubproofs,
  countNodes,
  depthOf,
} from './minify';

export type { GenericProofNode, MinifyOptions, MinifyResult, MinifyRule } from './types';
