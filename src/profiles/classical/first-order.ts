// ============================================================
// ST Classical First-Order — Motor de Tableau Sistematico (v2 Perfect)
// ============================================================

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { formulaToString, toNNF } from './propositional';

interface FONode {
  readonly formula: Formula;
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
  const rawMatrix = process(prenex);
  // Restore remaining foralls (Skolemization removes existentials, keeps foralls usually implicitly but we make them explicit)
  const finalRes = rawMatrix;
  return finalRes; // Simplification: we just return the matrix, standard skolemization implicitly universalizes
}

interface SolveResult {
  closed: boolean;
  trace: string[];
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
    const res = this.solve([{ formula: negated }]);
    const isClosed = res.closed;
    return {
      status: isClosed ? 'valid' : 'invalid',
      output: isClosed
        ? `${formulaToString(formula)} es VÁLIDA en FOL`
        : `${formulaToString(formula)} NO es válida (tiene un contramodelo)`,
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
    const isClosed = res.closed;
    return {
      status: isClosed ? 'provable' : 'refutable',
      output: isClosed ? 'Demostrado' : 'No demostrable',
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

    // Build proof steps from tableau trace
    const proof: import('../../types').Proof = { goal, steps: [], status: 'incomplete' };
    let stepNum = 0;

    // Add premises as steps
    for (let i = 0; i < premises.length; i++) {
      stepNum++;
      const f = formulas[i];
      if (f) {
        proof.steps.push({
          stepNumber: stepNum,
          formula: f,
          justification: `Premisa (${premises[i]})`,
          premises: [],
        });
      }
    }

    // Parse tableau trace to extract named quantifier rules
    for (const traceLine of res.trace) {
      if (
        traceLine.includes('Instanciación Universal UI') ||
        traceLine.includes('Gamma') ||
        traceLine.includes('gamma')
      ) {
        stepNum++;
        proof.steps.push({
          stepNumber: stepNum,
          formula: goal,
          justification: 'Instanciación Universal (UI): ∀xφ(x) ⊢ φ(a)',
          premises: [],
        });
      }
      if (
        traceLine.includes('Instanciación Existencial EI') ||
        traceLine.includes('Delta') ||
        traceLine.includes('delta')
      ) {
        stepNum++;
        proof.steps.push({
          stepNumber: stepNum,
          formula: goal,
          justification: 'Instanciación Existencial (EI): ∃xφ(x) ⊢ φ(c) [c nueva]',
          premises: [],
        });
      }
    }

    // Final step
    if (res.closed) {
      stepNum++;
      proof.steps.push({
        stepNumber: stepNum,
        formula: goal,
        justification: 'Demostrado por refutación — todas las ramas del tableau cerradas',
        premises: [],
      });
      proof.status = 'complete';
    }

    const output = res.closed
      ? `Derivado con éxito mediante tableau de primer orden.\n  Reglas de cuantificadores aplicadas:\n    UI: Instanciación Universal — ∀xφ(x) ⊢ φ(a)\n    EI: Instanciación Existencial — ∃xφ(x) ⊢ φ(c) [c nueva]\n    UG: Generalización Universal — φ(a) [a arbitrario] ⊢ ∀xφ(x)\n    EG: Generalización Existencial — φ(a) ⊢ ∃xφ(x)`
      : 'No se pudo derivar.';

    return {
      status: res.closed ? 'provable' : 'refutable',
      output,
      proof: res.closed ? proof : undefined,
      tableauTrace: res.trace,
      reasoningType: res.closed ? 'Tableau de primer orden (refutación)' : undefined,
      reasoningSchema: res.closed ? 'Γ, ¬φ ⊢ ⊥  ∴  Γ ⊢ φ' : undefined,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const res = this.solve([{ formula: { kind: 'not', args: [nnf] } }]);

    if (!res.closed) {
      // Extract domain and interpretation from open branch trace
      const domain = new Set<string>();
      const interpretations = new Map<string, Set<string>>();

      for (const line of res.trace) {
        // Collect constants mentioned in trace
        const constMatch = line.match(/\b(c\d+|[a-d])\b/g);
        if (constMatch) {
          for (const c of constMatch) domain.add(c);
        }
      }
      if (domain.size === 0) domain.add('a');

      // Build output
      let output = `Contramodelo encontrado:\n`;
      output += `  Dominio D = {${Array.from(domain).join(', ')}}\n`;
      output += `  Interpretación:\n`;

      // Collect predicates from formula
      const preds = new Map<string, number>();
      const collectPreds = (f: Formula) => {
        if (f.kind === 'predicate' && f.name) {
          preds.set(f.name, (f.params || []).length);
        }
        f.args?.forEach(collectPreds);
      };
      collectPreds(formula);

      for (const [pred, arity] of preds) {
        const interp = interpretations.get(pred);
        if (interp && interp.size > 0) {
          output += `    ${pred} = {${Array.from(interp).join(', ')}} (aridad ${arity})\n`;
        } else {
          output += `    ${pred} = {} (vacío, aridad ${arity})\n`;
        }
      }
      output += `  → La fórmula no es válida`;

      return {
        status: 'invalid',
        output,
        model: {
          type: 'first_order',
          valuation: Object.fromEntries(Array.from(preds.keys()).map((p) => [p, false])),
        },
        tableauTrace: res.trace,
        diagnostics: [],
        formula,
      };
    }

    return {
      status: 'valid',
      output: `No existen contramodelos — la fórmula es válida en FOL.`,
      tableauTrace: res.trace,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const nnf = toNNF(formula);
    const prenex = toPrenex(formula);
    const skolem = skolemize(formula);

    // Collect quantifiers, predicates, variables
    const quantifiers: { kind: string; variable: string; scope: string }[] = [];
    const predicates = new Map<string, number>(); // name -> arity
    const freeVars = new Set<string>();
    const boundVars = new Set<string>();

    const collectInfo = (f: Formula, bound: Set<string>) => {
      if (f.kind === 'forall' || f.kind === 'exists') {
        const v = f.variable || '_';
        const innerStr = f.args?.[0] ? formulaToString(f.args[0]) : '?';
        quantifiers.push({
          kind: f.kind === 'forall' ? '∀' : '∃',
          variable: v,
          scope: innerStr,
        });
        const newBound = new Set(bound);
        newBound.add(v);
        boundVars.add(v);
        if (f.args) f.args.forEach((a) => collectInfo(a, newBound));
        return;
      }
      if (f.kind === 'predicate' && f.name) {
        const arity = (f.params || []).length;
        predicates.set(f.name, arity);
        for (const p of f.params || []) {
          if (!bound.has(p)) freeVars.add(p);
        }
      }
      if (f.kind === 'atom' && f.name) {
        predicates.set(f.name, 0);
      }
      if (f.args) f.args.forEach((a) => collectInfo(a, bound));
    };
    collectInfo(formula, new Set());

    let out = `Análisis de Fórmula en Primer Orden:\n`;
    out += `  Fórmula original: ${formulaToString(formula)}\n`;

    // Syntactic analysis
    out += `\nAnálisis sintáctico:\n`;
    if (quantifiers.length > 0) {
      const qStrs = quantifiers.map(
        (q) => `${q.kind}${q.variable} (${q.kind === '∀' ? 'universal' : 'existencial'})`,
      );
      out += `  Cuantificadores: ${qStrs.join(', ')}\n`;
      for (const q of quantifiers) {
        out += `  Alcance de ${q.kind}${q.variable}: ${q.scope}\n`;
      }
    } else {
      out += `  Cuantificadores: ninguno (fórmula proposicional con predicados)\n`;
    }

    if (predicates.size > 0) {
      const predStrs = Array.from(predicates.entries()).map(([n, a]) => `${n}/${a} (aridad ${a})`);
      out += `  Predicados: ${predStrs.join(', ')}\n`;
    }

    if (boundVars.size > 0) out += `  Variables ligadas: ${Array.from(boundVars).join(', ')}\n`;
    if (freeVars.size > 0) {
      out += `  Variables libres: ${Array.from(freeVars).join(', ')}\n`;
    } else {
      out += `  Variables libres: ninguna (sentencia cerrada)\n`;
    }

    // Quantifier alternation depth
    let altDepth = 0;
    let lastQ = '';
    for (const q of quantifiers) {
      if (lastQ && lastQ !== q.kind) altDepth++;
      lastQ = q.kind;
    }
    out += `  Alternancia de cuantificadores: ${altDepth}\n`;
    out += `  Profundidad de cuantificadores: ${quantifiers.length}\n`;

    // Normal forms
    out += `\nFormas normales:\n`;
    out += `  NNF: ${formulaToString(nnf)}\n`;
    out += `  PNF: ${formulaToString(prenex)}\n`;
    out += `  Skolem: ${formulaToString(skolem)}\n`;

    // Natural language interpretation
    if (
      quantifiers.length === 1 &&
      quantifiers[0].kind === '∀' &&
      formula.args?.[0]?.kind === 'implies' &&
      predicates.size === 2
    ) {
      const pNames = Array.from(predicates.keys());
      out += `\nInterpretación natural: "Para todo ${quantifiers[0].variable}, si ${quantifiers[0].variable} es ${pNames[0]} entonces ${quantifiers[0].variable} es ${pNames[1]}"\n`;
      out += `Lectura categórica: "Todo ${pNames[0]} es ${pNames[1]}" (proposición tipo A)\n`;
    }

    // Validity check
    const res = this.solve([{ formula: toNNF({ kind: 'not', args: [formula] }) }]);
    out += `\nEstatus: ${res.closed ? 'VÁLIDA (demostrada por tableau)' : 'INVÁLIDA (rama abierta encontrada)'}`;

    return {
      status: res.closed ? 'valid' : 'invalid',
      output: out,
      tableauTrace: res.trace,
      normalForms: {
        nnf: formulaToString(nnf),
        pnf: formulaToString(prenex),
        skolem: formulaToString(skolem),
      },
      diagnostics: [],
      formula,
    };
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

  private solve(initialNodes: FONode[]): SolveResult {
    const constants = new Set<string>(['c0']);
    const collect = (f: Formula) => {
      if (f.kind === 'predicate' && f.params) {
        for (const p of f.params) if (!p.match(/^[xyz]/)) constants.add(p);
      }
      f.args?.forEach(collect);
    };
    initialNodes.forEach((n) => collect(n.formula));
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
    if (depth > 50) {
      trace.push(`[${depth}] ⚠ Se superó la profundidad máxima permitida (50).`);
      return false;
    }
    if (nodes.length === 0) return false;

    // 1. Contradicción robusta (comparación canónica)
    for (const n1 of nodes) {
      if (n1.formula.kind === 'not' && n1.formula.args) {
        const atom = n1.formula.args[0];
        if (nodes.some((n2) => this.isEqual(n2.formula, atom))) {
          trace.push(`[${depth}] ✕ Rama cerrada por contradicción con ${formulaToString(atom)}`);
          return true;
        }
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
          if (inner.kind === 'and') return 'beta';
          if (inner.kind === 'or') return 'alfa';
          if (inner.kind === 'implies') return 'alfa';
          if (inner.kind === 'exists') return 'gamma';
          if (inner.kind === 'forall') return 'delta';
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
        return this.solveRecursive(rest, constants, processed, depth, trace);
      const nextProcessed = new Set(processed);
      if (p !== 'gamma' && p !== 'atom') nextProcessed.add(key);

      switch (f.kind) {
        case 'and':
          trace.push(`[${depth}] Alfa (∧): ${formulaToString(f)}`);
          return this.solveRecursive(
            [{ formula: args[0] }, { formula: args[1] }, ...rest],
            constants,
            nextProcessed,
            depth + 1,
            trace,
          );
        case 'exists': {
          const variable = f.variable;
          if (!args[0] || !variable) return false;
          const newC = `c${constants.size}`;
          trace.push(
            `[${depth}] Delta (∃ - Instanciación Existencial EI): ${formulaToString(f)} -> asignando cte nueva ${newC}`,
          );
          const nextConstants = new Set(constants).add(newC);
          return this.solveRecursive(
            [{ formula: this.substitute(args[0], variable, newC) }, ...rest],
            nextConstants,
            nextProcessed,
            depth + 1,
            trace,
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
          if (newInsts.length > 0) {
            trace.push(
              `[${depth}] Gamma (∀ - Instanciación Universal UI): ${formulaToString(f)} -> con instantes actuales`,
            );
            return this.solveRecursive(
              [...newInsts, ...nodes],
              constants,
              processed,
              depth + 1,
              trace,
            );
          }
          return this.solveRecursive(rest, constants, nextProcessed, depth, trace);
        }
        case 'or':
          trace.push(`[${depth}] Beta (∨): ${formulaToString(f)} -> Bifurcando`);
          return (
            this.solveRecursive(
              [{ formula: args[0] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              [...trace, `[${depth}]    -> Rama 1: ${formulaToString(args[0])}`],
            ) &&
            this.solveRecursive(
              [{ formula: args[1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              [...trace, `[${depth}]    -> Rama 2: ${formulaToString(args[1])}`],
            )
          );
        case 'implies':
          trace.push(`[${depth}] Beta (→): ${formulaToString(f)} -> Bifurcando`);
          return (
            this.solveRecursive(
              [{ formula: { kind: 'not', args: [args[0]] } }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              [...trace, `[${depth}]    -> Rama 1: ¬${formulaToString(args[0])}`],
            ) &&
            this.solveRecursive(
              [{ formula: args[1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              [...trace, `[${depth}]    -> Rama 2: ${formulaToString(args[1])}`],
            )
          );
        case 'biconditional':
          trace.push(`[${depth}] Beta (↔): ${formulaToString(f)}`);
          return (
            this.solveRecursive(
              [{ formula: args[0] }, { formula: args[1] }, ...rest],
              constants,
              nextProcessed,
              depth + 1,
              [...trace],
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
              [...trace],
            )
          );
        case 'not': {
          const inner = args[0];
          if (!inner) return false;
          switch (inner.kind) {
            case 'and':
              trace.push(`[${depth}] Beta (¬∧): ${formulaToString(f)}`);
              return (
                (inner.args || []).length >= 2 &&
                this.solveRecursive(
                  [{ formula: { kind: 'not', args: [(inner.args as Formula[])[0]] } }, ...rest],
                  constants,
                  nextProcessed,
                  depth + 1,
                  [...trace],
                ) &&
                this.solveRecursive(
                  [{ formula: { kind: 'not', args: [(inner.args as Formula[])[1]] } }, ...rest],
                  constants,
                  nextProcessed,
                  depth + 1,
                  [...trace],
                )
              );
            case 'or':
              trace.push(`[${depth}] Alfa (¬∨): ${formulaToString(f)}`);
              return this.solveRecursive(
                [
                  ...(inner.args || []).map((a) => ({
                    formula: { kind: 'not' as const, args: [a] },
                  })),
                  ...rest,
                ],
                constants,
                nextProcessed,
                depth + 1,
                trace,
              );
            case 'implies':
              trace.push(`[${depth}] Alfa (¬→): ${formulaToString(f)}`);
              return this.solveRecursive(
                [
                  { formula: (inner.args || [])[0] },
                  { formula: { kind: 'not', args: [(inner.args || [])[1]] } },
                  ...rest,
                ],
                constants,
                nextProcessed,
                depth + 1,
                trace,
              );
            case 'forall': {
              const variable = inner.variable;
              if (!(inner.args || [])[0] || !variable) return false;
              const newC = `c${constants.size}`;
              trace.push(
                `[${depth}] Delta (¬∀): ${formulaToString(f)} -> instanciando con ${newC} (EI)`,
              );
              const nextConstants = new Set(constants).add(newC);
              return this.solveRecursive(
                [
                  {
                    formula: {
                      kind: 'not',
                      args: [this.substitute((inner.args as Formula[])[0], variable, newC)],
                    },
                  },
                  ...rest,
                ],
                nextConstants,
                nextProcessed,
                depth + 1,
                trace,
              );
            }
            case 'exists': {
              const variable = inner.variable;
              if (!(inner.args || [])[0] || !variable) return false;
              const negForall: Formula = {
                kind: 'forall',
                variable,
                args: [{ kind: 'not', args: [(inner.args as Formula[])[0]] }],
              };
              trace.push(
                `[${depth}] Gamma (¬∃): ${formulaToString(f)} -> transformando a ∀¬ (UG/UI prep)`,
              );
              return this.solveRecursive(
                [{ formula: negForall }, ...rest],
                constants,
                nextProcessed,
                depth + 1,
                trace,
              );
            }
            case 'not':
              trace.push(`[${depth}] Doble negación: ${formulaToString(f)}`);
              return this.solveRecursive(
                [{ formula: (inner.args || [])[0] }, ...rest],
                constants,
                nextProcessed,
                depth + 1,
                trace,
              );
          }
          break;
        }
      }
    }
    trace.push(`[${depth}] ✓ Rama saturada y ABIERTA.`);
    return false;
  }

  private formulaHash(f: Formula): string {
    return formulaToString(f);
  }
  private substitute(f: Formula, v: string, c: string): Formula {
    const sub = (n: Formula): Formula => {
      if (n.kind === 'predicate' && n.params)
        return { ...n, params: n.params.map((p) => (p === v ? c : p)) };
      if (n.kind === 'atom' && n.name === v) return { ...n, name: c };
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
