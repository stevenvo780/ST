// ============================================================
// ST Modal K — Motor de Tableau Sistematico (v2 Perfect)
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString, toNNF } from '../classical/propositional';

interface KNode {
  readonly formula: Formula;
  readonly world: string;
}

export class ModalK implements LogicProfile {
  readonly name = 'modal.k';
  readonly description = 'Logica modal K (Sistema base) — Motor de Tableau v2';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'atom' && !f.name)
        diags.push({ severity: 'error', message: 'Atomo sin nombre' });
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const negated = toNNF({ kind: 'not', args: [formula] });
    const isClosed = this.solve([{ formula: negated, world: 'w0' }]);
    return {
      status: isClosed ? 'valid' : 'invalid',
      output: isClosed
        ? `${formulaToString(formula)} es VALIDA en K`
        : `${formulaToString(formula)} NO es valida en K`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const isClosed = this.solve([{ formula: nnf, world: 'w0' }]);
    return {
      status: !isClosed ? 'satisfiable' : 'unsatisfiable',
      output: !isClosed ? `Satisfacible` : `Insatisfacible`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    const nodes: KNode[] = [
      ...axioms.map((a) => ({ formula: toNNF(a), world: 'w0' })),
      { formula: toNNF({ kind: 'not', args: [goal] }), world: 'w0' },
    ];
    return {
      status: this.solve(nodes) ? 'provable' : 'refutable',
      output: 'Prove',
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const formulas = premises.map((p) => theory.axioms.get(p)).filter((f): f is Formula => !!f);
    const nodes: KNode[] = [
      ...formulas.map((f) => ({ formula: toNNF(f), world: 'w0' })),
      { formula: toNNF({ kind: 'not', args: [goal] }), world: 'w0' },
    ];
    return {
      status: this.solve(nodes) ? 'provable' : 'refutable',
      output: 'Derivacion',
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    return this.checkValid(formula);
  }
  explain(formula: Formula): RunResult {
    return { status: 'unknown', output: `Modal K`, diagnostics: [], formula };
  }

  private solve(initialNodes: KNode[]): boolean {
    return this.solveRecursive(initialNodes, new Map([['w0', []]]), new Set(), 0);
  }

  private solveRecursive(
    nodes: KNode[],
    acc: Map<string, string[]>,
    processed: Set<string>,
    depth: number,
  ): boolean {
    if (depth > 100) return false;
    for (const n1 of nodes) {
      if (n1.formula.kind === 'not' && n1.formula.args?.[0]) {
        const target = n1.formula.args[0];
        if (nodes.some((n2) => n2.world === n1.world && this.isEqual(n2.formula, target)))
          return true;
      }
    }

    const type = (f: Formula) => {
      if (f.kind === 'and') return 'alfa';
      if (f.kind === 'or') return 'beta';
      if (f.kind === 'modal_possibility') return 'delta';
      if (f.kind === 'modal_necessity') return 'gamma';
      return 'atom';
    };

    const priorities = ['alfa', 'delta', 'gamma', 'beta'];
    for (const p of priorities) {
      const idx = nodes.findIndex((n) => type(n.formula) === p);
      if (idx === -1) continue;

      const node = nodes[idx];
      const rest = nodes.filter((_, i) => i !== idx);
      const { formula: f, world: w } = node;
      const args = f.args || [];

      if (p !== 'gamma' && p !== 'atom') {
        const key = `${w}:${this.formulaHash(f)}`;
        if (processed.has(key)) return this.solveRecursive(rest, acc, processed, depth);
        const nextProcessed = new Set(processed).add(key);

        switch (f.kind) {
          case 'and':
            return this.solveRecursive(
              [{ formula: args[0], world: w }, { formula: args[1], world: w }, ...rest],
              acc,
              nextProcessed,
              depth + 1,
            );
          case 'modal_possibility': {
            const newW = `w_${depth}_${Math.random().toString(36).slice(2, 5)}`;
            const nextAcc = new Map(acc);
            nextAcc.set(w, [...(acc.get(w) || []), newW]);
            nextAcc.set(newW, []);
            return this.solveRecursive(
              [{ formula: args[0], world: newW }, ...nodes],
              nextAcc,
              nextProcessed,
              depth + 1,
            );
          }
          case 'or':
            return (
              this.solveRecursive(
                [{ formula: args[0], world: w }, ...rest],
                acc,
                nextProcessed,
                depth + 1,
              ) &&
              this.solveRecursive(
                [{ formula: args[1], world: w }, ...rest],
                acc,
                nextProcessed,
                depth + 1,
              )
            );
        }
      } else if (p === 'gamma') {
        const nextWorlds = acc.get(w) || [];
        for (const nw of nextWorlds) {
          const instKey = `gamma:${nw}:${this.formulaHash(f)}`;
          if (!processed.has(instKey)) {
            const nextProcessed = new Set(processed).add(instKey);
            return this.solveRecursive(
              [{ formula: args[0], world: nw }, ...nodes],
              acc,
              nextProcessed,
              depth + 1,
            );
          }
        }
      }
    }
    return false;
  }

  private formulaHash(f: Formula): string {
    return formulaToString(f);
  }
  private isEqual(a: Formula, b: Formula): boolean {
    return this.formulaHash(a) === this.formulaHash(b);
  }
}
