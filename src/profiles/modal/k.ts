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
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const premiseFormulas = premises.map((p) => theory.axioms.get(p)!).filter((f) => f);
    const nodes: TableauNode[] = [
      ...premiseFormulas.map((a) => ({ formula: a, sign: true, world: 'w0' })),
      { formula: goal, sign: false, world: 'w0' },
    ];
    const isClosed = this.solve(nodes, new Map([['w0', []]]));
    return { status: isClosed ? 'provable' : 'refutable', output: 'Derivacion', formula: goal };
  }

  countermodel(formula: Formula): RunResult {
    return this.checkValid(formula);
  }

  /**
   * Solucionador de Tableau Proposicional Modal (K).
   */
  private solve(
    nodes: TableauNode[],
    accessibility: Map<string, string[]>,
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

    // 2. Clasificar fórmulas
    // Alfa: No bifurcan (and true, or false, implies false, not)
    // Beta: Bifurcan (and false, or true, implies true)
    // Delta: Crean mundos (box false, diamond true)
    // Gamma: Instancian en mundos (box true, diamond false)

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

    switch (f.kind) {
      case 'not':
        return this.solve(
          [{ formula: f.args![0], sign: !s, world: w }, ...rest],
          accessibility,
          depth + 1,
        );
      case 'and':
        if (s)
          return this.solve(
            [
              { formula: f.args![0], sign: true, world: w },
              { formula: f.args![1], sign: true, world: w },
              ...rest,
            ],
            accessibility,
            depth + 1,
          );
        else
          return (
            this.solve(
              [{ formula: f.args![0], sign: false, world: w }, ...rest],
              accessibility,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: f.args![1], sign: false, world: w }, ...rest],
              accessibility,
              depth + 1,
            )
          );
      case 'or':
        if (s)
          return (
            this.solve(
              [{ formula: f.args![0], sign: true, world: w }, ...rest],
              accessibility,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: f.args![1], sign: true, world: w }, ...rest],
              accessibility,
              depth + 1,
            )
          );
        else
          return this.solve(
            [
              { formula: f.args![0], sign: false, world: w },
              { formula: f.args![1], sign: false, world: w },
              ...rest,
            ],
            accessibility,
            depth + 1,
          );
      case 'implies':
        if (s)
          return (
            this.solve(
              [{ formula: f.args![0], sign: false, world: w }, ...rest],
              accessibility,
              depth + 1,
            ) &&
            this.solve(
              [{ formula: f.args![1], sign: true, world: w }, ...rest],
              accessibility,
              depth + 1,
            )
          );
        else
          return this.solve(
            [
              { formula: f.args![0], sign: true, world: w },
              { formula: f.args![1], sign: false, world: w },
              ...rest,
            ],
            accessibility,
            depth + 1,
          );
      case 'biconditional':
        if (s) {
          const f1 = { kind: 'implies', args: [f.args![0], f.args![1]] } as Formula;
          const f2 = { kind: 'implies', args: [f.args![1], f.args![0]] } as Formula;
          return this.solve(
            [{ formula: f1, sign: true, world: w }, { formula: f2, sign: true, world: w }, ...rest],
            accessibility,
            depth + 1,
          );
        } else {
          const f1 = {
            kind: 'not',
            args: [{ kind: 'implies', args: [f.args![0], f.args![1]] }],
          } as Formula;
          const f2 = {
            kind: 'not',
            args: [{ kind: 'implies', args: [f.args![1], f.args![0]] }],
          } as Formula;
          return (
            this.solve(
              [{ formula: f1, sign: true, world: w }, ...rest],
              accessibility,
              depth + 1,
            ) &&
            this.solve([{ formula: f2, sign: true, world: w }, ...rest], accessibility, depth + 1)
          );
        }
      case 'modal_necessity': // []P
        if (s) {
          // Gamma: []P is true
          const nexts = accessibility.get(w) || [];
          const instantiated = nexts.map((nw) => ({ formula: f.args![0], sign: true, world: nw }));
          // Solo continuar si hay algo nuevo que instanciar o si rest tiene contenido
          if (instantiated.length === 0 && rest.every((n) => findType(n) === 'gamma')) return false;
          return this.solve([...rest, ...instantiated], accessibility, depth + 1);
        } else {
          // Delta: []P is false -> <>!P is true
          const newW = `w${depth}_${Math.random().toString(36).substring(2, 5)}`;
          const newAcc = new Map(accessibility);
          newAcc.set(w, [...(accessibility.get(w) || []), newW]);
          newAcc.set(newW, []);
          // Importante: Re-añadimos todas las reglas Gamma (Box True) para que se apliquen al nuevo mundo
          const gammas = nodes.filter((n) => findType(n) === 'gamma');
          return this.solve(
            [{ formula: f.args![0], sign: false, world: newW }, ...rest, ...gammas],
            newAcc,
            depth + 1,
          );
        }
      case 'modal_possibility': // <>P
        if (s) {
          // Delta: <>P is true
          const newW = `w${depth}_${Math.random().toString(36).substring(2, 5)}`;
          const newAcc = new Map(accessibility);
          newAcc.set(w, [...(accessibility.get(w) || []), newW]);
          newAcc.set(newW, []);
          const gammas = nodes.filter((n) => findType(n) === 'gamma');
          return this.solve(
            [{ formula: f.args![0], sign: true, world: newW }, ...rest, ...gammas],
            newAcc,
            depth + 1,
          );
        } else {
          // Gamma: <>P is false -> []!P is true
          const nexts = accessibility.get(w) || [];
          const instantiated = nexts.map((nw) => ({ formula: f.args![0], sign: false, world: nw }));
          if (instantiated.length === 0 && rest.every((n) => findType(n) === 'gamma')) return false;
          return this.solve([...rest, ...instantiated], accessibility, depth + 1);
        }
    }
    return false;
  }

  private isEqual(a: Formula, b: Formula): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
