// ============================================================
// ST Classical First-Order — Motor de Tableau Sistematico (Hardened)
// ============================================================

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { formulaToString, toNNF } from './propositional';

interface FONode {
  readonly formula: Formula;
}

/** Extended Set that carries per-formula Gamma counters for loop control */
interface ProcessedSetWithGamma extends Set<string> {
  __gammaCounters?: Map<string, number>;
}

// ── Transforms ─────────────────────────────────────────────────────────────

let varCounter = 0;
function getNewVar() {
  return `v${varCounter++}`;
}
let skolemCounter = 0;
function getSkolem(isFunc: boolean) {
  return isFunc ? `f${skolemCounter++}` : `c${skolemCounter++}`;
}

export function toPrenex(f: Formula): Formula {
  const nnf = toNNF(f);
  function rename(node: Formula, mapping: Map<string, string>): Formula {
    if (node.kind === 'forall' || node.kind === 'exists') {
      const v = node.variable as string;
      const nv = getNewVar();
      const newMap = new Map(mapping).set(v, nv);
      return { ...node, variable: nv, args: [rename((node.args || [])[0], newMap)] };
    }
    if (node.kind === 'predicate') {
      return { ...node, params: (node.params || []).map((p) => mapping.get(p) || p) };
    }
    if (node.args) {
      return { ...node, args: node.args.map((a) => rename(a, mapping)) };
    }
    return node;
  }
  const renamed = rename(nnf, new Map());

  const quantifiers: { kind: 'forall' | 'exists'; v: string }[] = [];
  function extract(node: Formula): Formula {
    if (node.kind === 'forall' || node.kind === 'exists') {
      quantifiers.push({ kind: node.kind, v: node.variable as string });
      return extract((node.args || [])[0]);
    }
    if (node.args) {
      return { ...node, args: node.args.map(extract) };
    }
    return node;
  }
  const matrix = extract(renamed);

  let res = matrix;
  for (let i = quantifiers.length - 1; i >= 0; i--) {
    res = { kind: quantifiers[i].kind, variable: quantifiers[i].v, args: [res] };
  }
  return res;
}

export function skolemize(f: Formula): Formula {
  const prenex = toPrenex(f);
  const foralls: string[] = [];
  function process(node: Formula): Formula {
    if (node.kind === 'forall') {
      foralls.push(node.variable as string);
      const inner = process((node.args || [])[0]);
      foralls.pop();
      return { ...node, args: [inner] };
    }
    if (node.kind === 'exists') {
      const v = node.variable as string;
      const isFunc = foralls.length > 0;
      const skName = getSkolem(isFunc);
      const replaceStr = isFunc ? `${skName}(${foralls.join(',')})` : skName;

      function rep(n: Formula): Formula {
        if (n.kind === 'predicate') {
          return { ...n, params: (n.params || []).map((p) => (p === v ? replaceStr : p)) };
        }
        if (n.args) return { ...n, args: n.args.map(rep) };
        return n;
      }
      return process(rep((node.args || [])[0]));
    }
    return node;
  }
  return process(prenex);
}

interface SolveResult {
  closed: boolean;
  trace: string[];
}

export class ClassicalFirstOrder implements LogicProfile {
  readonly name = 'classical.first_order';
  readonly description = 'Logica clasica de primer orden (FOL) — Motor de Tableau Hardened';

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
    const res = this.solve([{ formula: negated }]);
    return {
      status: res.closed ? 'valid' : 'invalid',
      output: res.closed
        ? `${formulaToString(formula)} es VÁLIDA`
        : `${formulaToString(formula)} NO es válida`,
      tableauTrace: res.trace,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const isClosed = this.solve([{ formula: nnf }]).closed;
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
    const res = this.solve(nodes);
    return {
      status: res.closed ? 'provable' : 'refutable',
      output: res.closed ? 'Demostrado' : 'No demostrable',
      tableauTrace: res.trace,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const formulas = premises
      .map((p) => theory.axioms.get(p) || theory.theorems.get(p))
      .filter((f): f is Formula => !!f);
    const nodes: FONode[] = [
      ...formulas.map((f) => ({ formula: toNNF(f) })),
      { formula: toNNF({ kind: 'not', args: [goal] }) },
    ];
    const res = this.solve(nodes);
    return {
      status: res.closed ? 'provable' : 'refutable',
      output: res.closed ? 'Derivado' : 'No derivable',
      tableauTrace: res.trace,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const res = this.solve([{ formula: { kind: 'not', args: [nnf] } }]);
    return {
      status: res.closed ? 'valid' : 'invalid',
      output: res.closed ? 'Válida' : 'Inválida',
      tableauTrace: res.trace,
      diagnostics: [],
      formula,
    };
  }

  explain(_formula: Formula): RunResult {
    return { status: 'unknown', output: 'Explain no implementado en Hardened', diagnostics: [] };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    return this.checkValid(biconditional);
  }

  private collectConstants(f: Formula, bound: Set<string>): Set<string> {
    const result = new Set<string>();
    if (f.kind === 'predicate' && f.params) {
      for (const p of f.params) {
        if (!bound.has(p)) result.add(p);
      }
    }
    if (f.kind === 'atom' && f.name && !bound.has(f.name)) {
      // atoms used as term-like references (e.g. P(a) where a is a constant)
    }
    if (f.kind === 'forall' || f.kind === 'exists') {
      const inner = new Set(bound);
      if (f.variable) inner.add(f.variable);
      for (const s of this.collectConstants((f.args || [])[0], inner)) result.add(s);
    } else if (f.args) {
      for (const a of f.args) {
        for (const s of this.collectConstants(a, bound)) result.add(s);
      }
    }
    return result;
  }

  private solve(initialNodes: FONode[]): SolveResult {
    varCounter = 0;
    skolemCounter = 0;
    const constants = new Set<string>(['c0']);
    for (const node of initialNodes) {
      for (const c of this.collectConstants(node.formula, new Set())) {
        constants.add(c);
      }
    }
    const trace: string[] = [];
    const closed = this.solveRecursive(initialNodes, constants, new Set(), 0, trace);
    return { closed, trace };
  }

  private solveRecursive(
    nodes: FONode[],
    constants: Set<string>,
    processed: Set<string>,
    depth: number,
    trace: string[],
  ): boolean {
    if (depth > 200) {
      trace.push(`[${depth}] ⚠ Se alcanzó profundidad máxima de seguridad (200).`);
      return false;
    }
    if (nodes.length === 0) return false;

    // Contradicción
    for (const n1 of nodes) {
      if (n1.formula.kind === 'not' && n1.formula.args) {
        const atom = n1.formula.args[0];
        if (nodes.some((n2) => this.isEqual(n2.formula, atom))) {
          trace.push(`[${depth}] ✕ Rama cerrada por contradicción`);
          return true;
        }
      }
    }

    const type = (f: Formula) => {
      if (f.kind === 'and') return 'alfa';
      if (f.kind === 'exists') return 'delta';
      if (f.kind === 'forall') return 'gamma';
      if (f.kind === 'or' || f.kind === 'implies') return 'beta';
      return 'atom';
    };

    const priorities = ['alfa', 'delta', 'gamma', 'beta'];
    for (const p of priorities) {
      const idx = nodes.findIndex((n) => type(n.formula) === p);
      if (idx === -1) continue;

      const node = nodes[idx];
      const rest = nodes.filter((_, i) => i !== idx);
      const { formula: f } = node;
      const key = formulaToString(f);

      if (p !== 'gamma' && p !== 'atom' && processed.has(key))
        return this.solveRecursive(rest, constants, processed, depth, trace);

      const nextProcessed = new Set(processed);
      if (p !== 'gamma' && p !== 'atom') nextProcessed.add(key);

      switch (f.kind) {
        case 'and':
          return this.solveRecursive(
            [{ formula: f.args![0] }, { formula: f.args![1] }, ...rest],
            constants,
            nextProcessed,
            depth + 1,
            trace,
          );
        case 'exists': {
          const newC = `c${constants.size}`;
          const nextConstants = new Set(constants).add(newC);
          return this.solveRecursive(
            [{ formula: this.substitute(f.args![0], f.variable!, newC) }, ...rest],
            nextConstants,
            nextProcessed,
            depth + 1,
            trace,
          );
        }
        case 'forall': {
          const gammaKey = `gamma_count:${key}`;
          const proc = processed as ProcessedSetWithGamma;
          const gammaCount = proc.__gammaCounters?.get(gammaKey) ?? 0;
          if (gammaCount >= 20) {
            trace.push(`[${depth}] ⚠ Límite Gamma alcanzado.`);
            return this.solveRecursive(rest, constants, nextProcessed, depth, trace);
          }
          if (!proc.__gammaCounters) proc.__gammaCounters = new Map();
          proc.__gammaCounters.set(gammaKey, gammaCount + 1);
          const newInsts = Array.from(constants).map((c) => ({
            formula: this.substitute(f.args![0], f.variable!, c),
          }));
          return this.solveRecursive(
            [...newInsts, ...nodes],
            constants,
            processed,
            depth + 1,
            trace,
          );
        }
        case 'or':
          return (
            this.solveRecursive(
              [{ formula: f.args![0] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              trace,
            ) &&
            this.solveRecursive(
              [{ formula: f.args![1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              trace,
            )
          );
        case 'implies':
          // A -> B branches into: ¬A or B
          return (
            this.solveRecursive(
              [{ formula: { kind: 'not', args: [f.args![0]] } }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              trace,
            ) &&
            this.solveRecursive(
              [{ formula: f.args![1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              trace,
            )
          );
      }
    }
    return false;
  }

  private substitute(f: Formula, v: string, c: string): Formula {
    const sub = (n: Formula): Formula => {
      if (n.kind === 'predicate' && n.params)
        return { ...n, params: n.params.map((p) => (p === v ? c : p)) };
      if (n.kind === 'atom' && n.name === v) return { ...n, name: c };
      if (n.args) return { ...n, args: n.args.map(sub) };
      return n;
    };
    return sub(f);
  }

  private isEqual(a: Formula, b: Formula): boolean {
    return formulaToString(a) === formulaToString(b);
  }
}
