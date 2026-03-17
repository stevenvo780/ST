// ============================================================
// ST Modal K — Motor de Tableau para Kripke (Corregido)
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString } from '../classical/propositional';

interface TableauNode {
  formula: Formula;
  sign: boolean;
  world: string;
}

export class ModalK implements LogicProfile {
  name = 'modal.k';
  description = 'Logica modal K (Sistema base con semantica de mundos posibles)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const check = (f: Formula) => {
      if (f.kind === 'atom' && !f.name)
        diags.push({ severity: 'error', message: 'Atomo sin nombre' });
      if (f.args) f.args.forEach(check);
    };
    check(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const isClosed = this.solve([{ formula, sign: false, world: 'w0' }], new Map([['w0', []]]));
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
    const isClosed = this.solve([{ formula, sign: true, world: 'w0' }], new Map([['w0', []]]));
    return {
      status: !isClosed ? 'satisfiable' : 'unsatisfiable',
      output: !isClosed ? `SATISFACIBLE en K` : `INSATISFACIBLE en K`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    const nodes: TableauNode[] = [
      ...axioms.map((a) => ({ formula: a, sign: true, world: 'w0' })),
      { formula: goal, sign: false, world: 'w0' },
    ];
    const isClosed = this.solve(nodes, new Map([['w0', []]]));
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
    const nodes: TableauNode[] = [
      ...premiseFormulas.map((a) => ({ formula: a, sign: true, world: 'w0' })),
      { formula: goal, sign: false, world: 'w0' },
    ];
    const isClosed = this.solve(nodes, new Map([['w0', []]]));
    return {
      status: isClosed ? 'provable' : 'refutable',
      output: 'Derivacion',
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
      output: `Logica Modal K: ${formulaToString(formula)}`,
      diagnostics: [],
      formula,
    };
  }

  private solve(
    nodes: TableauNode[],
    accessibility: Map<string, string[]>,
    processed: Set<string> = new Set(),
    depth: number = 0,
  ): boolean {
    if (depth > 100) return false;

    // 1. Verificar contradicción
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (
          nodes[i].world === nodes[j].world &&
          nodes[i].sign === !nodes[j].sign &&
          this.isEqual(nodes[i].formula, nodes[j].formula)
        ) {
          return true;
        }
      }
    }

    const findType = (n: TableauNode) => {
      const f = n.formula;
      const s = n.sign;
      if (f.kind === 'not') return 'alfa';
      if (f.kind === 'and') return s ? 'alfa' : 'beta';
      if (f.kind === 'or') return s ? 'beta' : 'alfa';
      if (f.kind === 'implies') return s ? 'beta' : 'alfa';
      if (f.kind === 'biconditional') return 'beta';
      if (f.kind === 'modal_necessity') return s ? 'gamma' : 'delta';
      if (f.kind === 'modal_possibility') return s ? 'delta' : 'gamma';
      return 'atom';
    };

    // Prioridad: Alfa > Delta > Beta > Gamma
    let idx = nodes.findIndex((n) => findType(n) === 'alfa');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'delta');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'beta');
    if (idx === -1) idx = nodes.findIndex((n) => findType(n) === 'gamma');

    if (idx === -1) return false;

    const node = nodes[idx];
    const rest = nodes.filter((_, i) => i !== idx);
    const { formula: f, sign: s, world: w } = node;
    const args = f.args || [];

    const nodeKey = `${w}:${s}:${JSON.stringify(f)}`;
    if (findType(node) !== 'gamma' && findType(node) !== 'atom' && processed.has(nodeKey)) {
      return this.solve(rest, accessibility, processed, depth);
    }
    const newProcessed = new Set(processed);
    if (findType(node) !== 'gamma' && findType(node) !== 'atom') newProcessed.add(nodeKey);

    switch (f.kind) {
      case 'not':
        if (!args[0]) return false;
        return this.solve(
          [{ formula: args[0], sign: !s, world: w }, ...rest],
          accessibility,
          newProcessed,
          depth + 1,
        );
      case 'and':
        if (!args[0] || !args[1]) return false;
        if (s)
          return this.solve(
            [
              { formula: args[0], sign: true, world: w },
              { formula: args[1], sign: true, world: w },
              ...rest,
            ],
            accessibility,
            newProcessed,
            depth + 1,
          );
        else
          return (
            this.solve(
              [{ formula: args[0], sign: false, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: false, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            )
          );
      case 'or':
        if (!args[0] || !args[1]) return false;
        if (s)
          return (
            this.solve(
              [{ formula: args[0], sign: true, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: true, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            )
          );
        else
          return this.solve(
            [
              { formula: args[0], sign: false, world: w },
              { formula: args[1], sign: false, world: w },
              ...rest,
            ],
            accessibility,
            newProcessed,
            depth + 1,
          );
      case 'implies':
        if (!args[0] || !args[1]) return false;
        if (s)
          return (
            this.solve(
              [{ formula: args[0], sign: false, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: args[1], sign: true, world: w }, ...rest],
              accessibility,
              depth + 1,
            )
          );
        else
          return this.solve(
            [
              { formula: args[0], sign: true, world: w },
              { formula: args[1], sign: false, world: w },
              ...rest,
            ],
            accessibility,
            newProcessed,
            depth + 1,
          );
      case 'biconditional':
        if (!args[0] || !args[1]) return false;
        if (s) {
          const f1: Formula = { kind: 'implies', args: [args[0], args[1]] };
          const f2: Formula = { kind: 'implies', args: [args[1], args[0]] };
          return this.solve(
            [{ formula: f1, sign: true, world: w }, { formula: f2, sign: true, world: w }, ...rest],
            accessibility,
            newProcessed,
            depth + 1,
          );
        } else {
          const f1: Formula = {
            kind: 'not',
            args: [{ kind: 'implies', args: [args[0], args[1]] }],
          };
          const f2: Formula = {
            kind: 'not',
            args: [{ kind: 'implies', args: [args[1], args[0]] }],
          };
          return (
            this.solve(
              [{ formula: f1, sign: true, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: f2, sign: true, world: w }, ...rest],
              accessibility,
              newProcessed,
              depth + 1,
            )
          );
        }
      case 'modal_necessity': // []P
        if (!args[0]) return false;
        if (s) {
          // Gamma: []P is true
          const nexts = accessibility.get(w) || [];
          const instantiated = nexts
            .map((nw) => ({ formula: args[0], sign: true, world: nw }))
            .filter((n) => !processed.has(`${n.world}:true:${JSON.stringify(n.formula)}`));

          if (instantiated.length === 0) {
            return this.solve(rest, accessibility, newProcessed, depth);
          }
          const nextProcessed = new Set(processed);
          instantiated.forEach((n) =>
            nextProcessed.add(`${n.world}:true:${JSON.stringify(n.formula)}`),
          );
          return this.solve(
            [...rest, ...instantiated, node],
            accessibility,
            nextProcessed,
            depth + 1,
          );
        } else {
          // Delta
          const newW = `w${depth}_${Math.random().toString(36).substring(2, 5)}`;
          const newAcc = new Map(accessibility);
          newAcc.set(w, [...(accessibility.get(w) || []), newW]);
          newAcc.set(newW, []);
          // Importante: volver a meter todas las reglas Gamma del mismo mundo para que se instancien en el nuevo
          const gammas = nodes.filter((n) => n.world === w && findType(n) === 'gamma');
          return this.solve(
            [{ formula: args[0], sign: false, world: newW }, ...rest, ...gammas],
            newAcc,
            newProcessed,
            depth + 1,
          );
        }
      case 'modal_possibility': // <>P
        if (!args[0]) return false;
        if (s) {
          // Delta
          const newW = `w${depth}_${Math.random().toString(36).substring(2, 5)}`;
          const newAcc = new Map(accessibility);
          newAcc.set(w, [...(accessibility.get(w) || []), newW]);
          newAcc.set(newW, []);
          const gammas = nodes.filter((n) => n.world === w && findType(n) === 'gamma');
          return this.solve(
            [{ formula: args[0], sign: true, world: newW }, ...rest, ...gammas],
            newAcc,
            newProcessed,
            depth + 1,
          );
        } else {
          // Gamma
          const nexts = accessibility.get(w) || [];
          const instantiated = nexts
            .map((nw) => ({ formula: args[0], sign: false, world: nw }))
            .filter((n) => !processed.has(`${n.world}:false:${JSON.stringify(n.formula)}`));

          if (instantiated.length === 0)
            return this.solve(rest, accessibility, newProcessed, depth);
          const nextProcessed = new Set(processed);
          instantiated.forEach((n) =>
            nextProcessed.add(`${n.world}:false:${JSON.stringify(n.formula)}`),
          );
          return this.solve(
            [...rest, ...instantiated, node],
            accessibility,
            nextProcessed,
            depth + 1,
          );
        }
    }
    return false;
  }

  private isEqual(a: Formula, b: Formula): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
