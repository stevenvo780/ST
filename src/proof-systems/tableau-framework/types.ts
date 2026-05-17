// ============================================================
// Tableau Framework — Core types
// ============================================================

export interface TableauNode<F> {
  formula: F;
  signed?: 'T' | 'F';
  label?: string;
}

export interface TableauBranch<F> {
  nodes: TableauNode<F>[];
  closed: boolean;
  reason?: string;
}

export interface Tableau<F> {
  root: TableauBranch<F>;
  branches: TableauBranch<F>[];
  open: TableauBranch<F>[];
  closed: boolean;
}

/**
 * A rule consumes a node from a branch and expands it into
 * one or more groups of new nodes.  Each inner array represents
 * a new branch (α-rules return 1 group, β-rules return 2+).
 */
export type Rule<F> = {
  name: string;
  match: (node: TableauNode<F>, branch: TableauBranch<F>) => boolean;
  apply: (node: TableauNode<F>, branch: TableauBranch<F>) => TableauNode<F>[][];
};

/**
 * A closure condition inspects a branch and returns a human-readable
 * reason string when the branch should be closed, or null otherwise.
 */
export type ClosureCondition<F> = (branch: TableauBranch<F>) => string | null;
