// ============================================================
// Tableau Framework — TableauProver<F>
// ============================================================

import type {
  Tableau,
  TableauBranch,
  TableauNode,
  Rule,
  ClosureCondition,
} from './types';

/**
 * Internal branch wrapper that tracks whether this branch is a leaf
 * or has been superseded by children after a β-rule split.
 */
interface BranchEntry<F> {
  branch: TableauBranch<F>;
  /** True once the branch has been split into children. */
  superseded: boolean;
}

export class TableauProver<F> {
  private rules: Rule<F>[] = [];
  private closureConditions: ClosureCondition<F>[] = [];

  registerRule(rule: Rule<F>): void {
    this.rules.push(rule);
  }

  registerClosureCondition(check: ClosureCondition<F>): void {
    this.closureConditions.push(check);
  }

  prove(root: TableauBranch<F>, maxDepth = 50): Tableau<F> {
    const rootClone = cloneBranch(root);
    const rootEntry: BranchEntry<F> = { branch: rootClone, superseded: false };
    const allEntries: BranchEntry<F>[] = [rootEntry];

    // Work-list: pairs of (entry, depth).
    const workList: Array<{ entry: BranchEntry<F>; depth: number }> = [
      { entry: rootEntry, depth: 0 },
    ];

    while (workList.length > 0) {
      const item = workList.shift();
      if (!item) break;
      const { entry, depth } = item;
      const { branch } = entry;

      if (branch.closed || entry.superseded) continue;

      // Check closure before any expansion.
      this.checkClosure(branch);
      if (branch.closed) continue;

      if (depth >= maxDepth) continue;

      // Find the first applicable rule.
      let expanded = false;
      for (let i = 0; i < branch.nodes.length; i++) {
        const node = branch.nodes[i];
        if (!node) continue;
        const rule = this.rules.find(r => r.match(node, branch));
        if (!rule) continue;

        const expansions = rule.apply(node, branch);
        if (expansions.length === 0) continue;

        // Remaining nodes after removing the expanded node.
        const remaining: TableauNode<F>[] = [
          ...branch.nodes.slice(0, i),
          ...branch.nodes.slice(i + 1),
        ];

        if (expansions.length === 1 && expansions[0]) {
          // α-rule: extend this branch in place (no split).
          branch.nodes = [...remaining, ...expansions[0]];
          this.checkClosure(branch);
          if (!branch.closed) {
            workList.unshift({ entry, depth: depth + 1 });
          }
        } else {
          // β-rule: mark this entry as superseded, create children.
          entry.superseded = true;
          for (const newNodes of expansions) {
            const childBranch = cloneBranch({ nodes: [...remaining, ...newNodes], closed: false });
            const childEntry: BranchEntry<F> = { branch: childBranch, superseded: false };
            allEntries.push(childEntry);
            this.checkClosure(childBranch);
            if (!childBranch.closed) {
              workList.push({ entry: childEntry, depth: depth + 1 });
            }
          }
        }

        expanded = true;
        break;
      }

      // No rule fired — saturated branch, run closure one more time.
      if (!expanded) {
        this.checkClosure(branch);
      }
    }

    // Collect all branches (for the public API).
    const allBranches = allEntries.map(e => e.branch);

    // Leaf branches: not superseded (true terminal nodes of the tree).
    const leafEntries = allEntries.filter(e => !e.superseded);
    const open = leafEntries.filter(e => !e.branch.closed).map(e => e.branch);
    const tableClosed = open.length === 0;

    return {
      root: rootClone,
      branches: allBranches,
      open,
      closed: tableClosed,
    };
  }

  private checkClosure(branch: TableauBranch<F>): void {
    if (branch.closed) return;
    for (const cond of this.closureConditions) {
      const reason = cond(branch);
      if (reason !== null) {
        branch.closed = true;
        branch.reason = reason;
        return;
      }
    }
  }
}

function cloneBranch<F>(branch: TableauBranch<F>): TableauBranch<F> {
  return {
    nodes: branch.nodes.map(n => ({ ...n })),
    closed: branch.closed,
    reason: branch.reason,
  };
}
