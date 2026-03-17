// ============================================================
// ST Classical First-Order — Motor de Tableau Sistematico (v2 Perfect)
// ============================================================

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { formulaToString, toNNF } from './propositional';

interface FONode {
  readonly formula: Formula;
}

export class ClassicalFirstOrder implements LogicProfile {
  readonly name = 'classical.first_order';
  readonly description = 'Logica clasica de primer orden (FOL) — Motor de Tableau v2';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'predicate' && !f.name)
        diags.push({ severity: 'error', message: 'Predicado sin nombre' });
      if ((f.kind === 'forall' || f.kind === 'exists') && !f.variable)
        diags.push({ severity: 'error', message: 'Cuantificador sin variable' });
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const negated = toNNF({ kind: 'not', args: [formula] });
    const isClosed = this.solve([{ formula: negated }]);
    return {
      status: isClosed ? 'valid' : 'unknown',
      output: isClosed
        ? `${formulaToString(formula)} es VALIDA en FOL`
        : `${formulaToString(formula)} no demostrada`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const isClosed = this.solve([{ formula: nnf }]);
    return {
      status: !isClosed ? 'satisfiable' : 'unsatisfiable',
      output: !isClosed ? `Satisfacible` : `Insatisfacible`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    const nodes: FONode[] = [
      ...axioms.map((a) => ({ formula: toNNF(a) })),
      { formula: toNNF({ kind: 'not', args: [goal] }) },
    ];
    const isClosed = this.solve(nodes);
    return {
      status: isClosed ? 'provable' : 'refutable',
      output: isClosed ? 'Demostrado' : 'No demostrable',
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const formulas = premises.map((p) => theory.axioms.get(p)).filter((f): f is Formula => !!f);
    const nodes: FONode[] = [
      ...formulas.map((f) => ({ formula: toNNF(f) })),
      { formula: toNNF({ kind: 'not', args: [goal] }) },
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
    return { status: 'unknown', output: `FOL`, diagnostics: [], formula };
  }

  private solve(initialNodes: FONode[]): boolean {
    const constants = new Set<string>(['c0']);
    const collect = (f: Formula) => {
      if (f.kind === 'predicate' && f.params) {
        for (const p of f.params) if (!p.match(/^[xyz]/)) constants.add(p);
      }
      f.args?.forEach(collect);
    };
    initialNodes.forEach((n) => collect(n.formula));
    return this.solveRecursive(initialNodes, constants, new Set(), 0);
  }

  private solveRecursive(
    nodes: FONode[],
    constants: Set<string>,
    processed: Set<string>,
    depth: number,
  ): boolean {
    if (depth > 50 || nodes.length === 0) return false;

    // 1. Contradicción robusta (comparación canónica)
    for (const n1 of nodes) {
      if (n1.formula.kind === 'not' && n1.formula.args) {
        const atom = n1.formula.args[0];
        if (nodes.some((n2) => this.isEqual(n2.formula, atom))) return true;
      }
    }

    const type = (f: Formula) => {
      if (f.kind === 'and') return 'alfa';
      if (f.kind === 'or') return 'beta';
      if (f.kind === 'exists') return 'delta';
      if (f.kind === 'forall') return 'gamma';
      return 'atom';
    };

    const priorities = ['alfa', 'delta', 'gamma', 'beta'];
    for (const p of priorities) {
      const idx = nodes.findIndex((n) => type(n.formula) === p);
      if (idx === -1) continue;

      const node = nodes[idx];
      const rest = nodes.filter((_, i) => i !== idx);
      const { formula: f } = node;
      const args = f.args || [];

      const key = this.formulaHash(f);
      if (p !== 'gamma' && p !== 'atom' && processed.has(key))
        return this.solveRecursive(rest, constants, processed, depth);
      const nextProcessed = new Set(processed);
      if (p !== 'gamma' && p !== 'atom') nextProcessed.add(key);

      switch (f.kind) {
        case 'and':
          return this.solveRecursive(
            [{ formula: args[0] }, { formula: args[1] }, ...rest],
            constants,
            nextProcessed,
            depth + 1,
          );
        case 'exists': {
          const variable = f.variable;
          if (!args[0] || !variable) return false;
          const newC = `c${constants.size}`;
          const nextConstants = new Set(constants).add(newC);
          return this.solveRecursive(
            [{ formula: this.substitute(args[0], variable, newC) }, ...rest],
            nextConstants,
            nextProcessed,
            depth + 1,
          );
        }
        case 'forall': {
          const variable = f.variable;
          if (!args[0] || !variable) return false;
          const newInsts: FONode[] = [];
          for (const c of constants) {
            const instKey = `gamma:${c}:${key}`;
            if (!processed.has(instKey)) {
              newInsts.push({ formula: this.substitute(args[0], variable, c) });
              processed.add(instKey);
            }
          }
          if (newInsts.length > 0)
            return this.solveRecursive([...newInsts, ...nodes], constants, processed, depth + 1);
          return this.solveRecursive(rest, constants, nextProcessed, depth);
        }
        case 'or':
          return (
            this.solveRecursive(
              [{ formula: args[0] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
            ) &&
            this.solveRecursive(
              [{ formula: args[1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
            )
          );
      }
    }
    return false;
  }

  private formulaHash(f: Formula): string {
    return formulaToString(f);
  }
  private substitute(f: Formula, v: string, c: string): Formula {
    const sub = (n: Formula): Formula => {
      if (n.kind === 'predicate' && n.params)
        return { ...n, params: n.params.map((p) => (p === v ? c : p)) };
      if ((n.kind === 'forall' || n.kind === 'exists') && n.variable === v) return n;
      if (n.args) return { ...n, args: n.args.map(sub) };
      return n;
    };
    return sub(f);
  }

  private isEqual(a: Formula, b: Formula): boolean {
    return this.formulaHash(a) === this.formulaHash(b);
  }
}
