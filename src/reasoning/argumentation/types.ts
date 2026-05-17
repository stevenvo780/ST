// ============================================================
// ST Argumentation — Dung framework types
// ============================================================

export interface ArgumentationFramework {
  arguments: Set<string>;
  attacks: Array<[string, string]>;
}

export type Semantics = 'grounded' | 'preferred' | 'stable' | 'complete' | 'semi-stable';

export interface ComputeOptions {
  exhaustiveLimit?: number;
  warnOnLarge?: boolean;
}

export const DEFAULT_EXHAUSTIVE_LIMIT = 20;
