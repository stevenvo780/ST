// ============================================================
// ST Classical First-Order — Motor de Primer Orden (Corregido)
// ============================================================

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { formulaToString } from './propositional';

interface FOTableauNode {
  formula: Formula;
  sign: boolean;
}

export class ClassicalFirstOrder implements LogicProfile {
  name = 'classical.first_order';
  description =
    'Logica clasica de primer orden (FOL) con soporte para predicados y cuantificadores';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const check = (f: Formula) => {
      switch (f.kind) {
        case 'predicate':
          if (!f.name) diags.push({ severity: 'error', message: 'Predicado sin nombre' });
          break;
        case 'forall':
        case 'exists':
          if (!f.variable) diags.push({ severity: 'error', message: 'Cuantificador sin variable' });
          if (f.args) f.args.forEach(check);
          break;
        default:
          if (f.args) f.args.forEach(check);
      }
    };
    check(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const isClosed = this.solve([{ formula, sign: false }], new Set(['c0']));
    return {
      status: isClosed ? 'valid' : 'unknown',
      output: isClosed
        ? `${formulaToString(formula)} es VALIDA en FOL`
        : `${formulaToString(formula)} no se pudo demostrar valida`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const isClosed = this.solve([{ formula, sign: true }], new Set(['c0']));
    return {
      status: !isClosed ? 'satisfiable' : 'unsatisfiable',
      output: !isClosed ? `SATISFACIBLE` : `INSATISFACIBLE`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    const nodes: FOTableauNode[] = [
      ...axioms.map((a) => ({ formula: a, sign: true })),
      { formula: goal, sign: false },
    ];
    const isClosed = this.solve(nodes, new Set(['c0']));
    return {
      status: isClosed ? 'provable' : 'refutable',
      output: isClosed ? 'DEMOSTRABLE' : 'NO demostrable',
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const premiseFormulas = premises
      .map((p) => theory.axioms.get(p))
      .filter((f): f is Formula => f !== undefined);
    const nodes: FOTableauNode[] = [
      ...premiseFormulas.map((a) => ({ formula: a, sign: true })),
      { formula: goal, sign: false },
    ];
    return {
      status: this.solve(nodes, new Set(['c0'])) ? 'provable' : 'refutable',
      output: `Derivacion`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    return this.checkValid(formula);
  }

  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `FOL: ${formulaToString(formula)}`,
      diagnostics: [],
      formula,
    };
  }

  private solve(
    nodes: FOTableauNode[],
    constants: Set<string>,
    processed: Set<string> = new Set(),
    depth: number = 0,
  ): boolean {
    if (depth > 50) return false;

    // 1. Contradicción
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].sign === !nodes[j].sign && this.isEqual(nodes[i].formula, nodes[j].formula)) {
          return true;
        }
      }
    }

    const findType = (n: FOTableauNode) => {
      const f = n.formula;
      const s = n.sign;
      if (f.kind === 'not') return 'alfa';
      if (f.kind === 'and') return s ? 'alfa' : 'beta';
      if (f.kind === 'or') return s ? 'beta' : 'alfa';
      if (f.kind === 'implies') return s ? 'beta' : 'alfa';
      if (f.kind === 'forall') return s ? 'gamma' : 'delta';
      if (f.kind === 'exists') return s ? 'delta' : 'gamma';
      return 'atom';
    };

    let idx = nodes.findIndex((n) => findType(n) === 'alfa');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'delta');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'beta');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'gamma');

    if (idx === -1) return false;

    const node = nodes[idx];
    const rest = nodes.filter((_, i) => i !== idx);
    const { formula: f, sign: s } = node;
    const args = f.args || [];

    const nodeKey = `${s}:${JSON.stringify(f)}`;
    if (findType(node) !== 'gamma' && findType(node) !== 'atom' && processed.has(nodeKey)) {
      return this.solve(rest, constants, processed, depth);
    }
    const newProcessed = new Set(processed);
    if (findType(node) !== 'gamma' && findType(node) !== 'atom') newProcessed.add(nodeKey);

    switch (f.kind) {
      case 'not':
        if (!args[0]) return false;
        return this.solve(
          [{ formula: args[0], sign: !s }, ...rest],
          constants,
          newProcessed,
          depth + 1,
        );
      case 'and':
        if (!args[0] || !args[1]) return false;
        if (s)
          return this.solve(
            [{ formula: args[0], sign: true }, { formula: args[1], sign: true }, ...rest],
            constants,
            newProcessed,
            depth + 1,
          );
        else
          return (
            this.solve(
              [{ formula: args[0], sign: false }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: false }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            )
          );
      case 'or':
        if (!args[0] || !args[1]) return false;
        if (s)
          return (
            this.solve(
              [{ formula: args[0], sign: true }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: true }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            )
          );
        else
          return this.solve(
            [{ formula: args[0], sign: false }, { formula: args[1], sign: false }, ...rest],
            constants,
            newProcessed,
            depth + 1,
          );
      case 'implies':
        if (!args[0] || !args[1]) return false;
        if (s)
          return (
            this.solve(
              [{ formula: args[0], sign: false }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: true }, ...rest],
              constants,
              newProcessed,
              depth + 1,
            )
          );
        else
          return this.solve(
            [{ formula: args[0], sign: true }, { formula: args[1], sign: false }, ...rest],
            constants,
            newProcessed,
            depth + 1,
          );
      case 'forall': {
        const variable = f.variable;
        if (!args[0] || !variable) return false;
        if (s) {
          // Gamma
          const instantiated = Array.from(constants)
            .map((c) => ({ formula: this.substitute(args[0], variable, c), sign: true }))
            .filter((n) => !processed.has(`true:${JSON.stringify(n.formula)}`));

          if (instantiated.length === 0) return this.solve(rest, constants, newProcessed, depth);
          const nextProcessed = new Set(processed);
          instantiated.forEach((n) => nextProcessed.add(`true:${JSON.stringify(n.formula)}`));
          return this.solve([...rest, ...instantiated, node], constants, nextProcessed, depth + 1);
        } else {
          // Delta
          const newC = `c${constants.size}`;
          const newCons = new Set(constants).add(newC);
          return this.solve(
            [{ formula: this.substitute(args[0], variable, newC), sign: false }, ...rest],
            newCons,
            newProcessed,
            depth + 1,
          );
        }
      }
      case 'exists': {
        const variable = f.variable;
        if (!args[0] || !variable) return false;
        if (s) {
          // Delta
          const newC = `c${constants.size}`;
          const newCons = new Set(constants).add(newC);
          return this.solve(
            [{ formula: this.substitute(args[0], variable, newC), sign: true }, ...rest],
            newCons,
            newProcessed,
            depth + 1,
          );
        } else {
          // Gamma
          const instantiated = Array.from(constants)
            .map((c) => ({ formula: this.substitute(args[0], variable, c), sign: false }))
            .filter((n) => !processed.has(`false:${JSON.stringify(n.formula)}`));

          if (instantiated.length === 0) return this.solve(rest, constants, newProcessed, depth);
          const nextProcessed = new Set(processed);
          instantiated.forEach((n) => nextProcessed.add(`false:${JSON.stringify(n.formula)}`));
          return this.solve([...rest, ...instantiated, node], constants, nextProcessed, depth + 1);
        }
      }
    }
    return false;
  }

  private substitute(f: Formula, variable: string, constant: string): Formula {
    const sub = (node: Formula): Formula => {
      if (node.kind === 'predicate' && node.params)
        return { ...node, params: node.params.map((p) => (p === variable ? constant : p)) };
      if ((node.kind === 'forall' || node.kind === 'exists') && node.variable === variable)
        return node;
      if (node.args) return { ...node, args: node.args.map((a) => sub(a)) };
      return node;
    };
    return sub(f);
  }

  private isEqual(a: Formula, b: Formula): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
