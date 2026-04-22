// ============================================================
// ST Classical First-Order — Motor de Tableau Sistematico (Hardened)
// ============================================================

import {
  Formula,
  Diagnostic,
  RunResult,
  Theory,
  LogicProfile,
  TableauTraceEntry,
} from '../../types';
import { formulaToString, toNNF } from './propositional';

interface FONode {
  readonly formula: Formula;
}

/** Extended Set that carries per-formula Gamma counters for loop control */
// ── Transforms ─────────────────────────────────────────────────────────────

let varCounter = 0;
function getNewVar() {
  return `v${varCounter++}`;
}
let skolemCounter = 0;
function getSkolem(isFunc: boolean) {
  return isFunc ? `f${skolemCounter++}` : `c${skolemCounter++}`;
}

function toTypedTrace(trace: string[]): TableauTraceEntry[] {
  return trace.map((message, index) => ({
    message,
    rule: 'info',
    nodeId: `fo-${index + 1}`,
  }));
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
    const fStr = formulaToString(formula);
    return {
      status: res.closed ? 'valid' : 'invalid',
      output: res.closed
        ? `${fStr} es VÁLIDA en lógica de primer orden`
        : `${fStr} NO es válida en lógica de primer orden`,
      tableauTrace: toTypedTrace(res.trace),
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const isClosed = this.solve([{ formula: nnf }]).closed;
    const fStr = formulaToString(formula);
    return {
      status: !isClosed ? 'satisfiable' : 'unsatisfiable',
      output: !isClosed
        ? `${fStr} es SATISFACIBLE en lógica de primer orden`
        : `${fStr} es INSATISFACIBLE en lógica de primer orden`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory, premises?: string[]): RunResult {
    const useRestricted = premises !== undefined && premises.length > 0;
    const diagnostics: import('../../types').Diagnostic[] = [];
    const axioms: Formula[] = [];
    if (useRestricted) {
      for (const n of premises) {
        const f = theory.axioms.get(n) || theory.theorems.get(n);
        if (f) axioms.push(f);
        else
          diagnostics.push({
            severity: 'warning',
            message: `Premisa '${n}' no encontrada en la teoría; será ignorada en prove`,
          });
      }
    } else {
      axioms.push(...theory.axioms.values());
      axioms.push(...theory.theorems.values());
    }
    const nodes: FONode[] = [
      ...axioms.map((a) => ({ formula: toNNF(a) })),
      { formula: toNNF({ kind: 'not', args: [goal] }) },
    ];
    const res = this.solve(nodes);
    const fStr = formulaToString(goal);
    return {
      status: res.closed ? 'provable' : 'refutable',
      output: res.closed
        ? `${fStr} es DEMOSTRABLE desde la teoría`
        : `${fStr} NO es demostrable desde la teoría`,
      tableauTrace: toTypedTrace(res.trace),
      diagnostics,
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
    const fStr = formulaToString(goal);
    return {
      status: res.closed ? 'provable' : 'refutable',
      output: res.closed
        ? `${fStr} es DERIVABLE desde {${premises.join(', ')}}`
        : `${fStr} NO es derivable desde {${premises.join(', ')}}`,
      tableauTrace: toTypedTrace(res.trace),
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const res = this.solve([{ formula: { kind: 'not', args: [nnf] } }]);
    const fStr = formulaToString(formula);
    return {
      status: res.closed ? 'valid' : 'invalid',
      output: res.closed
        ? `No hay contramodelo — ${fStr} es válida en lógica de primer orden`
        : `Existe contramodelo para ${fStr} (no válida en lógica de primer orden)`,
      tableauTrace: toTypedTrace(res.trace),
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const fStr = formulaToString(formula);
    const negated = toNNF({ kind: 'not', args: [formula] });
    const res = this.solve([{ formula: negated }]);
    const valid = res.closed;

    let explanation = `Fórmula: ${fStr}\n\n`;
    explanation += [
      'Sistema: Lógica Clásica de Primer Orden (FOL)',
      '',
      'Cuantificadores:',
      '  ∀x P(x) — "para todo x, P(x)" (universal)',
      '  ∃x P(x) — "existe al menos un x tal que P(x)" (existencial)',
      '',
      'Reglas de inferencia:',
      '  ∀-Eliminación: de ∀x P(x), derivar P(t) para cualquier término t',
      '  ∃-Introducción: de P(t), derivar ∃x P(x)',
      '  Modus Ponens: de P(a) y ∀x(P(x)→Q(x)), derivar Q(a)',
      '',
      'Motor de prueba: Tableau analítico de primer orden',
      '  • Regla Gamma (∀): instancia con constantes conocidas',
      '  • Regla Delta (∃): introduce constante de Skolem fresca',
      '  • Profundidad máxima: 200 (safety limit)',
    ].join('\n');
    explanation += `\n\nEstatus: ${valid ? 'VÁLIDA' : 'NO válida'} en lógica de primer orden`;

    return {
      status: valid ? 'valid' : 'invalid',
      output: explanation,
      tableauTrace: toTypedTrace(res.trace),
      diagnostics: [],
      formula,
    };
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
    const initialConstants = new Set<string>(['c0']);
    for (const node of initialNodes) {
      for (const c of this.collectConstants(node.formula, new Set())) {
        initialConstants.add(c);
      }
    }
    const trace: string[] = [];

    interface Branch {
      nodes: FONode[];
      constants: Set<string>;
      processed: Set<string>;
      gammaCounters: Map<string, number>;
      univScope: string[];
    }

    const stack: Branch[] = [
      {
        nodes: initialNodes,
        constants: initialConstants,
        processed: new Set(),
        gammaCounters: new Map(),
        univScope: [],
      },
    ];

    let steps = 0;
    while (stack.length > 0) {
      if (steps++ > 20000) {
        trace.push(`[Iter] ⚠ Se alcanzó el límite de pasos (20000).`);
        return { closed: false, trace };
      }
      const b = stack.pop()!;
      const { nodes, constants, processed, gammaCounters, univScope } = b;

      if (nodes.length === 0) return { closed: false, trace };

      // Contradicción
      let closed = false;
      for (const n1 of nodes) {
        if (n1.formula.kind === 'not' && n1.formula.args) {
          const atom = n1.formula.args[0];
          if (nodes.some((n2) => this.isEqual(n2.formula, atom))) {
            closed = true;
            break;
          }
        }
        // Contradicción por igualdad: a != a
        if (n1.formula.kind === 'not' && n1.formula.args && n1.formula.args[0].kind === 'equals') {
          const eq = n1.formula.args[0];
          if (this.isEqual((eq.args || [])[0], (eq.args || [])[1])) {
            closed = true;
            break;
          }
        }
      }
      if (closed) {
        trace.push(`[Iter] ✕ Rama cerrada por contradicción`);
        continue;
      }

      const type = (f: Formula) => {
        if (f.kind === 'and') return 'alfa';
        if (f.kind === 'exists') return 'delta';
        if (f.kind === 'forall') return 'gamma';
        if (f.kind === 'or' || f.kind === 'implies') return 'beta';
        if (f.kind === 'equals') return 'equals';
        return 'atom';
      };

      const priorities = ['alfa', 'equals', 'delta', 'beta', 'gamma'];
      let applied = false;

      for (const p of priorities) {
        const idx = nodes.findIndex((n) => type(n.formula) === p);
        if (idx === -1) continue;

        const node = nodes[idx];
        const rest = nodes.filter((_, i) => i !== idx);
        const { formula: f } = node;
        const key = formulaToString(f);

        if (p !== 'gamma' && p !== 'atom' && p !== 'equals' && processed.has(key)) {
          continue;
        }

        applied = true;
        const nextProcessed = new Set(processed);
        if (p !== 'gamma' && p !== 'atom' && p !== 'equals') nextProcessed.add(key);

        switch (f.kind) {
          case 'equals': {
            const [eqLeft, eqRight] = f.args ?? [];
            if (
              eqLeft &&
              eqRight &&
              eqLeft.kind === 'atom' &&
              eqRight.kind === 'atom' &&
              eqLeft.name !== eqRight.name
            ) {
              // Ley de Leibniz: si a=b, reemplazar a por b en el resto de nodos
              // Hacemos el reemplazo y NO volvemos a evaluar ESTA igualdad.
              nextProcessed.add(key);
              const nextNodes = rest.map((n) => ({
                formula: this.substitute(n.formula, eqLeft.name!, eqRight.name!),
              }));
              // Y simétricamente (a veces a=b y necesitamos reemplazar b por a si b estaba)
              // Pero es suficiente reemplazar a por b en todo. La igualdad 'b=b' se evalúa a verdadero.
              stack.push({
                nodes: nextNodes,
                constants,
                processed: nextProcessed,
                gammaCounters,
                univScope,
              });
            } else {
              nextProcessed.add(key);
              stack.push({
                nodes: rest,
                constants,
                processed: nextProcessed,
                gammaCounters,
                univScope,
              });
            }
            break;
          }
          case 'and': {
            const [left, right] = f.args ?? [];
            stack.push({
              nodes: [{ formula: left }, { formula: right }, ...rest],
              constants,
              processed: nextProcessed,
              gammaCounters,
              univScope,
            });
            break;
          }
          case 'exists': {
            const [body] = f.args ?? [];
            const variable = f.variable ?? '';
            const skArgs = univScope.length > 0 ? `(${univScope.join(',')})` : '';
            const newC = `f${skolemCounter++}${skArgs}`;
            const nextConstants = new Set(constants).add(newC);
            stack.push({
              nodes: [{ formula: this.substitute(body, variable, newC) }, ...rest],
              constants: nextConstants,
              processed: nextProcessed,
              gammaCounters,
              univScope,
            });
            break;
          }
          case 'or': {
            const [orLeft, orRight] = f.args ?? [];
            stack.push({
              nodes: [{ formula: orRight }, ...rest],
              constants,
              processed: new Set(nextProcessed),
              gammaCounters: new Map(gammaCounters),
              univScope,
            });
            stack.push({
              nodes: [{ formula: orLeft }, ...rest],
              constants,
              processed: nextProcessed,
              gammaCounters,
              univScope,
            });
            break;
          }
          case 'implies': {
            const [impLeft, impRight] = f.args ?? [];
            stack.push({
              nodes: [{ formula: impRight }, ...rest],
              constants,
              processed: new Set(nextProcessed),
              gammaCounters: new Map(gammaCounters),
              univScope,
            });
            stack.push({
              nodes: [{ formula: { kind: 'not', args: [impLeft] } }, ...rest],
              constants,
              processed: nextProcessed,
              gammaCounters,
              univScope,
            });
            break;
          }
          case 'forall': {
            const gammaKey = `gamma_count:${key}`;
            const gammaCount = gammaCounters.get(gammaKey) ?? 0;
            if (gammaCount >= 20) {
              stack.push({
                nodes: rest,
                constants,
                processed: nextProcessed,
                gammaCounters,
                univScope,
              });
              break;
            }
            const nextGammaCounters = new Map(gammaCounters);
            nextGammaCounters.set(gammaKey, gammaCount + 1);
            const [forallBody] = f.args ?? [];
            const forallVar = f.variable ?? '';

            const newInsts = Array.from(constants).map((c) => ({
              formula: this.substitute(forallBody, forallVar, c),
            }));

            const nextUnivScope = [...univScope, forallVar];
            stack.push({
              nodes: [...newInsts, ...rest, node],
              constants,
              processed: nextProcessed,
              gammaCounters: nextGammaCounters,
              univScope: nextUnivScope,
            });
            break;
          }
        }
        break; // Solo aplicar una regla por paso
      }

      if (!applied) {
        const hasUnprocessed = nodes.some((n) => {
          const t = type(n.formula);
          return t !== 'atom' && t !== 'equals' && !processed.has(formulaToString(n.formula));
        });
        if (hasUnprocessed) {
          const cleanNodes = nodes.filter(
            (n) => type(n.formula) === 'atom' || type(n.formula) === 'equals',
          );
          stack.push({
            nodes: cleanNodes,
            constants,
            processed,
            gammaCounters,
            univScope,
          });
        } else {
          return { closed: false, trace };
        }
      }
    }

    return { closed: true, trace };
  }

  private substitute(f: Formula, v: string, c: string): Formula {
    const sub = (n: Formula): Formula => {
      // Evitar shadowing (capture-avoiding)
      if ((n.kind === 'forall' || n.kind === 'exists') && n.variable === v) {
        return n;
      }
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
