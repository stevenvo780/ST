import type { FOLClause, FOLTerm } from '../fol-prover/types';

export type EqualityRule = 'resolve' | 'paramod' | 'factor' | 'reflex';

export interface EqualityProveStep {
  rule: EqualityRule;
  from: number[];
  result: FOLClause;
  substitution: Record<string, FOLTerm>;
}

export interface EqualityProveResult {
  proven: boolean;
  steps: EqualityProveStep[];
  timeoutHit?: boolean;
  reason?: string;
}

export interface EqualityProveOptions {
  timeoutMs?: number;
  maxSteps?: number;
}

export const EQ_PREDICATE = '__eq__';
