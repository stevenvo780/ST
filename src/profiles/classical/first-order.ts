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

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    const result = this.checkValid(biconditional);
    const fA = formulaToString(a);
    const fB = formulaToString(b);
    return {
      status: result.status === 'valid' ? 'valid' : 'invalid',
      output:
        result.status === 'valid'
          ? `${fA} y ${fB} son EQUIVALENTES en FOL`
          : `${fA} y ${fB} NO son equivalentes en FOL`,
      diagnostics: [],
    };
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
      if (f.kind === 'or' || f.kind === 'implies') return 'beta';
      if (f.kind === 'biconditional') return 'beta';
      if (f.kind === 'exists') return 'delta';
      if (f.kind === 'forall') return 'gamma';
      if (f.kind === 'not') {
        const inner = (f.args || [])[0];
        if (inner) {
          if (inner.kind === 'and') return 'beta';   // ¬(A∧B) = ¬A∨¬B
          if (inner.kind === 'or') return 'alfa';     // ¬(A∨B) = ¬A∧¬B
          if (inner.kind === 'implies') return 'alfa'; // ¬(A→B) = A∧¬B
          if (inner.kind === 'exists') return 'gamma'; // ¬∃x = ∀x¬
          if (inner.kind === 'forall') return 'delta'; // ¬∀x = ∃x¬
        }
      }
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
        case 'implies':
          // A → B ≡ ¬A ∨ B (beta)
          return (
            this.solveRecursive(
              [{ formula: { kind: 'not', args: [args[0]] } }, ...rest],
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
        case 'biconditional':
          // A ↔ B ≡ (A∧B) ∨ (¬A∧¬B) (beta)
          return (
            this.solveRecursive(
              [{ formula: args[0] }, { formula: args[1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
            ) &&
            this.solveRecursive(
              [
                { formula: { kind: 'not', args: [args[0]] } },
                { formula: { kind: 'not', args: [args[1]] } },
                ...rest,
              ],
              constants,
              nextProcessed,
              depth + 1,
            )
          );
        case 'not': {
          const inner = args[0];
          if (!inner) return false;
          switch (inner.kind) {
            case 'and':
              // ¬(A∧B) = ¬A∨¬B (beta)
              return (
                (inner.args || []).length >= 2 &&
                this.solveRecursive(
                  [{ formula: { kind: 'not', args: [inner.args![0]] } }, ...rest],
                  constants,
                  nextProcessed,
                  depth + 1,
                ) &&
                this.solveRecursive(
                  [{ formula: { kind: 'not', args: [inner.args![1]] } }, ...rest],
                  constants,
                  nextProcessed,
                  depth + 1,
                )
              );
            case 'or':
              // ¬(A∨B) = ¬A∧¬B (alfa)
              return this.solveRecursive(
                [
                  ...((inner.args || []).map((a) => ({ formula: { kind: 'not' as const, args: [a] } }))),
                  ...rest,
                ],
                constants,
                nextProcessed,
                depth + 1,
              );
            case 'implies':
              // ¬(A→B) = A∧¬B (alfa)
              return this.solveRecursive(
                [
                  { formula: (inner.args || [])[0] },
                  { formula: { kind: 'not', args: [(inner.args || [])[1]] } },
                  ...rest,
                ],
                constants,
                nextProcessed,
                depth + 1,
              );
            case 'forall': {
              // ¬∀x.φ = ∃x.¬φ (delta)
              const variable = inner.variable;
              if (!(inner.args || [])[0] || !variable) return false;
              const newC = `c${constants.size}`;
              const nextConstants = new Set(constants).add(newC);
              return this.solveRecursive(
                [
                  { formula: { kind: 'not', args: [this.substitute(inner.args![0], variable, newC)] } },
                  ...rest,
                ],
                nextConstants,
                nextProcessed,
                depth + 1,
              );
            }
            case 'exists': {
              // ¬∃x.φ = ∀x.¬φ (gamma)
              const variable = inner.variable;
              if (!(inner.args || [])[0] || !variable) return false;
              const negForall: Formula = {
                kind: 'forall',
                variable,
                args: [{ kind: 'not', args: [inner.args![0]] }],
              };
              return this.solveRecursive(
                [{ formula: negForall }, ...rest],
                constants,
                nextProcessed,
                depth + 1,
              );
            }
            case 'not':
              // ¬¬A = A (doble negación)
              return this.solveRecursive(
                [{ formula: (inner.args || [])[0] }, ...rest],
                constants,
                nextProcessed,
                depth + 1,
              );
            default:
              break;
          }
          break;
        }
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
      if (n.kind === 'atom' && n.name === v)
        return { ...n, name: c };
      if ((n.kind === 'forall' || n.kind === 'exists') && n.variable === v) return n;
      if (n.args) return { ...n, args: n.args.map(sub) };
      return n;
    };
    return sub(f);
  }

  private isEqual(a: Formula, b: Formula): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
    if (a.kind === 'predicate' && b.kind === 'predicate') {
      if (a.name !== b.name) return false;
      const pa = a.params || [];
      const pb = b.params || [];
      if (pa.length !== pb.length) return false;
      return pa.every((p, i) => p === pb[i]);
    }
    if (a.variable !== b.variable) return false;
    const aa = a.args || [];
    const ba = b.args || [];
    if (aa.length !== ba.length) return false;
    return aa.every((ai, i) => this.isEqual(ai, ba[i]));
  }
}
