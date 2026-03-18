// ============================================================
// ST Classical Propositional — Motor completo
// ============================================================

import {
  Formula,
  Diagnostic,
  RunResult,
  Theory,
  LogicProfile,
  TruthTableResult,
  TruthTableRow,
  Valuation,
  Proof,
  ProofStep,
} from '../../types';

// --- Utilidades de fórmulas ---

function collectAtoms(f: Formula): Set<string> {
  const atoms = new Set<string>();
  function walk(node: Formula) {
    if (node.kind === 'atom' && node.name) {
      atoms.add(node.name);
    }
    if (node.args) {
      for (const arg of node.args) {
        walk(arg);
      }
    }
  }
  walk(f);
  return atoms;
}

function evaluate(f: Formula, v: Valuation): boolean {
  switch (f.kind) {
    case 'atom':
      return f.name ? (v[f.name] ?? false) : false;
    case 'not':
      return f.args && f.args[0] ? !evaluate(f.args[0], v) : false;
    case 'and':
      return f.args && f.args[0] && f.args[1]
        ? evaluate(f.args[0], v) && evaluate(f.args[1], v)
        : false;
    case 'or':
      return f.args && f.args[0] && f.args[1]
        ? evaluate(f.args[0], v) || evaluate(f.args[1], v)
        : false;
    case 'implies':
      return f.args && f.args[0] && f.args[1]
        ? !evaluate(f.args[0], v) || evaluate(f.args[1], v)
        : false;
    case 'biconditional':
      return f.args && f.args[0] && f.args[1]
        ? evaluate(f.args[0], v) === evaluate(f.args[1], v)
        : false;
    default:
      return false;
  }
}

/**
 * Optimización: Generar valuaciones de forma más eficiente.
 * Usa bitsets implícitos para evitar recrear objetos innecesariamente si fuera posible,
 * pero aquí mantenemos la interfaz de Valuation (objeto) por compatibilidad.
 */
function generateValuations(atoms: string[]): Valuation[] {
  const n = atoms.length;
  if (n === 0) return [{}];
  if (n > 20) throw new Error('Demasiadas variables para tabla de verdad (>20)');

  const total = 1 << n;
  const valuations: Valuation[] = new Array<Valuation>(total);
  for (let i = 0; i < total; i++) {
    const v: Valuation = {};
    for (let j = 0; j < n; j++) {
      // Usar bitwise para determinar el valor de verdad
      v[atoms[j]] = Boolean((i >> (n - 1 - j)) & 1);
    }
    valuations[i] = v;
  }
  return valuations;
}

/**
 * Aplana recursivamente nodos binarios del mismo kind asociativo.
 * Ej: or(or(P,Q), R) → [P, Q, R]
 */
function collectAssociativeArgs(f: Formula, kind: 'and' | 'or'): Formula[] {
  if (f.kind !== kind || !f.args?.length) return [f];
  const items: Formula[] = [];
  for (const arg of f.args) {
    if (!arg) continue;
    items.push(...collectAssociativeArgs(arg, kind));
  }
  return items;
}

export function formulaToString(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '!?';
      if (inner.kind === 'atom') return `!${formulaToString(inner)}`;
      return `!(${formulaToString(inner)})`;
    }
    case 'and':
      return f.args && f.args[0] && f.args[1]
        ? `(${collectAssociativeArgs(f, 'and').map(formulaToString).join(' & ')})`
        : '? & ?';
    case 'or':
      return f.args && f.args[0] && f.args[1]
        ? `(${collectAssociativeArgs(f, 'or').map(formulaToString).join(' | ')})`
        : '? | ?';
    case 'implies':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} -> ${formulaToString(f.args[1])})`
        : '? -> ?';
    case 'biconditional':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} <-> ${formulaToString(f.args[1])})`
        : '? <-> ?';
    case 'equals':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} = ${formulaToString(f.args[1])})`
        : '? = ?';
    case 'temporal_next':
      return f.args?.[0] ? `X(${formulaToString(f.args[0])})` : 'X(?)';
    case 'temporal_until':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} U ${formulaToString(f.args[1])})`
        : '? U ?';
    case 'modal_necessity':
      return f.args?.[0] ? `[](${formulaToString(f.args[0])})` : '[](?)';
    case 'modal_possibility':
      return f.args?.[0] ? `<>(${formulaToString(f.args[0])})` : '<>(?)';
    case 'forall':
      return f.variable && f.args?.[0]
        ? `forall ${f.variable}(${formulaToString(f.args[0])})`
        : 'forall ?(?)';
    case 'exists':
      return f.variable && f.args?.[0]
        ? `exists ${f.variable}(${formulaToString(f.args[0])})`
        : 'exists ?(?)';
    case 'predicate':
      return f.name
        ? `${f.name}(${(f.params || []).join(', ')})`
        : '?(...)';
    // Arithmetic
    case 'number':
      return f.value !== undefined ? String(f.value) : '?';
    case 'add':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} + ${formulaToString(f.args[1])})`
        : '? + ?';
    case 'subtract':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} - ${formulaToString(f.args[1])})`
        : '? - ?';
    case 'multiply':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} * ${formulaToString(f.args[1])})`
        : '? * ?';
    case 'divide':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} / ${formulaToString(f.args[1])})`
        : '? / ?';
    case 'modulo':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} % ${formulaToString(f.args[1])})`
        : '? % ?';
    case 'less':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} < ${formulaToString(f.args[1])})`
        : '? < ?';
    case 'greater':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} > ${formulaToString(f.args[1])})`
        : '? > ?';
    case 'less_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} <= ${formulaToString(f.args[1])})`
        : '? <= ?';
    case 'greater_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} >= ${formulaToString(f.args[1])})`
        : '? >= ?';
    default:
      return '?';
  }
}

export function toNNF(f: Formula): Formula {
  const simplify = (node: Formula, negated: boolean): Formula => {
    const k = node.kind;
    const args = node.args || [];

    if (!negated) {
      switch (k) {
        case 'atom':
        case 'predicate':
          return node;
        case 'not':
          return simplify(args[0], true);
        case 'and':
        case 'or':
        case 'implies':
        case 'biconditional':
        case 'modal_necessity':
        case 'modal_possibility':
        case 'temporal_next':
        case 'forall':
        case 'exists':
          return { ...node, args: args.map((a) => simplify(a, false)) };
      }
    } else {
      switch (k) {
        case 'atom':
        case 'predicate':
          return { kind: 'not', args: [node] };
        case 'not':
          return simplify(args[0], false);
        case 'and':
          return { kind: 'or', args: args.map((a) => simplify(a, true)) };
        case 'or':
          return { kind: 'and', args: args.map((a) => simplify(a, true)) };
        case 'implies':
          // !(A -> B)  =>  A & !B
          return { kind: 'and', args: [simplify(args[0], false), simplify(args[1], true)] };
        case 'biconditional':
          // !(A <-> B) => (A & !B) | (!A & B)
          return simplify(
            {
              kind: 'or',
              args: [
                { kind: 'and', args: [args[0], { kind: 'not', args: [args[1]] }] },
                { kind: 'and', args: [{ kind: 'not', args: [args[0]] }, args[1]] },
              ],
            },
            false,
          );
        case 'modal_necessity':
          return { kind: 'modal_possibility', args: [simplify(args[0], true)] };
        case 'modal_possibility':
          return { kind: 'modal_necessity', args: [simplify(args[0], true)] };
        case 'temporal_next':
          // ¬X(φ) ≡ X(¬φ) — next conmuta con negación en LTL
          return { kind: 'temporal_next', args: [simplify(args[0], true)] };
        case 'forall':
          return {
            kind: 'exists',
            variable: node.variable,
            args: [simplify(args[0], true)],
          };
        case 'exists':
          return {
            kind: 'forall',
            variable: node.variable,
            args: [simplify(args[0], true)],
          };
      }
    }
    return node;
  };
  return simplify(f, false);
}

function formulasEqual(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
  if (a.args && b.args) {
    if (a.args.length !== b.args.length) return false;
    const bArgs = b.args;
    return a.args.every((arg, i) => formulasEqual(arg, bArgs[i]));
  }
  return false;
}

// --- Motor de derivación ---

interface DerivationState {
  known: Map<string, Formula>; // fórmulas conocidas por nombre o hash
  steps: ProofStep[];
  stepCount: number;
}

function formulaHash(f: Formula): string {
  return formulaToString(f);
}

function tryDerive(goal: Formula, theory: Theory, premiseNames: string[]): Proof | null {
  const state: DerivationState = {
    known: new Map(),
    steps: [],
    stepCount: 0,
  };

  // Cargar premisas
  for (const name of premiseNames) {
    const f = theory.axioms.get(name) || theory.theorems.get(name);
    if (f) {
      state.stepCount++;
      state.steps.push({
        stepNumber: state.stepCount,
        formula: f,
        justification: `Premisa (${name})`,
        premises: [],
      });
      state.known.set(formulaHash(f), f);
    }
  }

  // Intentar derivar con BFS aplicando reglas
  // TODO: Mejorar con un algoritmo de búsqueda más robusto (Saturación)
  const maxIterations = 200;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    const currentFormulas = Array.from(state.known.values());

    for (const f1 of currentFormulas) {
      // Check if goal already found
      if (state.known.has(formulaHash(goal))) break;

      for (const f2 of currentFormulas) {
        if (state.known.has(formulaHash(goal))) break;

        // Modus Ponens: de A y (A -> B), derivar B
        if (
          f2.kind === 'implies' &&
          f2.args?.[0] &&
          f2.args?.[1] &&
          formulasEqual(f2.args[0], f1)
        ) {
          const conclusion = f2.args[1];
          const hash = formulaHash(conclusion);
          if (!state.known.has(hash)) {
            state.stepCount++;
            const s1 = findStep(state.steps, f1);
            const s2 = findStep(state.steps, f2);
            state.steps.push({
              stepNumber: state.stepCount,
              formula: conclusion,
              justification: 'Modus Ponens',
              premises: [s1, s2],
            });
            state.known.set(hash, conclusion);
            changed = true;
          }
        }

        // Modus Ponens inverso: de (A -> B) y A, derivar B
        if (
          f1.kind === 'implies' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          formulasEqual(f1.args[0], f2)
        ) {
          const conclusion = f1.args[1];
          const hash = formulaHash(conclusion);
          if (!state.known.has(hash)) {
            state.stepCount++;
            const s1 = findStep(state.steps, f1);
            const s2 = findStep(state.steps, f2);
            state.steps.push({
              stepNumber: state.stepCount,
              formula: conclusion,
              justification: 'Modus Ponens',
              premises: [s1, s2],
            });
            state.known.set(hash, conclusion);
            changed = true;
          }
        }

        // Modus Tollens: de !B y (A -> B), derivar !A
        if (
          f1.kind === 'not' &&
          f1.args?.[0] &&
          f2.kind === 'implies' &&
          f2.args?.[1] &&
          f2.args?.[0] &&
          formulasEqual(f1.args[0], f2.args[1])
        ) {
          const conclusion: Formula = { kind: 'not', args: [f2.args[0]] };
          const hash = formulaHash(conclusion);
          if (!state.known.has(hash)) {
            state.stepCount++;
            state.steps.push({
              stepNumber: state.stepCount,
              formula: conclusion,
              justification: 'Modus Tollens',
              premises: [findStep(state.steps, f1), findStep(state.steps, f2)],
            });
            state.known.set(hash, conclusion);
            changed = true;
          }
        }

        // Conjunction Introduction: de A y B, derivar A & B
        if (f1 !== f2) {
          const conj: Formula = { kind: 'and', args: [f1, f2] };
          const hash = formulaHash(conj);
          if (!state.known.has(hash) && formulasEqual(conj, goal)) {
            state.stepCount++;
            state.steps.push({
              stepNumber: state.stepCount,
              formula: conj,
              justification: 'Introduccion de conjuncion',
              premises: [findStep(state.steps, f1), findStep(state.steps, f2)],
            });
            state.known.set(hash, conj);
            changed = true;
          }
        }
      }

      // Conjunction Elimination: de A & B, derivar A y B
      if (f1.kind === 'and' && f1.args) {
        for (const sub of f1.args) {
          const hash = formulaHash(sub);
          if (!state.known.has(hash)) {
            state.stepCount++;
            state.steps.push({
              stepNumber: state.stepCount,
              formula: sub,
              justification: 'Eliminacion de conjuncion',
              premises: [findStep(state.steps, f1)],
            });
            state.known.set(hash, sub);
            changed = true;
          }
        }
      }

      // Disjunction Introduction: de A, derivar A | B (si A|B es la meta)
      if (goal.kind === 'or' && goal.args?.[0] && goal.args?.[1]) {
        if (formulasEqual(f1, goal.args[0]) || formulasEqual(f1, goal.args[1])) {
          const hash = formulaHash(goal);
          if (!state.known.has(hash)) {
            state.stepCount++;
            state.steps.push({
              stepNumber: state.stepCount,
              formula: goal,
              justification: 'Introduccion de disyuncion',
              premises: [findStep(state.steps, f1)],
            });
            state.known.set(hash, goal);
            changed = true;
          }
        }
      }

      // Double Negation Elimination: de !!A, derivar A
      if (f1.kind === 'not' && f1.args?.[0]?.kind === 'not' && f1.args[0].args?.[0]) {
        const inner = f1.args[0].args[0];
        const hash = formulaHash(inner);
        if (!state.known.has(hash)) {
          state.stepCount++;
          state.steps.push({
            stepNumber: state.stepCount,
            formula: inner,
            justification: 'Doble negacion',
            premises: [findStep(state.steps, f1)],
          });
          state.known.set(hash, inner);
          changed = true;
        }
      }

      // Contraposition: de A->B, derivar !B->!A
      if (f1.kind === 'implies' && f1.args?.[0] && f1.args?.[1]) {
        const contra: Formula = {
          kind: 'implies',
          args: [
            { kind: 'not', args: [f1.args[1]] },
            { kind: 'not', args: [f1.args[0]] },
          ],
        };
        const hash = formulaHash(contra);
        if (!state.known.has(hash)) {
          state.stepCount++;
          state.steps.push({
            stepNumber: state.stepCount,
            formula: contra,
            justification: 'Contraposicion',
            premises: [findStep(state.steps, f1)],
          });
          state.known.set(hash, contra);
          changed = true;
        }
      }

      // Biconditional Elimination: de A<->B, derivar A->B y B->A
      if (f1.kind === 'biconditional' && f1.args?.[0] && f1.args?.[1]) {
        const ab: Formula = { kind: 'implies', args: [f1.args[0], f1.args[1]] };
        const ba: Formula = { kind: 'implies', args: [f1.args[1], f1.args[0]] };
        for (const impl of [ab, ba]) {
          const hash = formulaHash(impl);
          if (!state.known.has(hash)) {
            state.stepCount++;
            state.steps.push({
              stepNumber: state.stepCount,
              formula: impl,
              justification: 'Eliminacion de bicondicional',
              premises: [findStep(state.steps, f1)],
            });
            state.known.set(hash, impl);
            changed = true;
          }
        }
      }
    }
  }

  if (state.known.has(formulaHash(goal))) {
    // Filtrar solo pasos relevantes para la derivación
    const relevantSteps = traceBack(state.steps, goal);
    return {
      goal,
      steps: relevantSteps,
      status: 'complete',
      derivedFrom: premiseNames,
    };
  }

  // Fallback: verificar semánticamente
  const allAxiomFormulas = premiseNames
    .map((n) => theory.axioms.get(n) || theory.theorems.get(n))
    .filter((f): f is Formula => f !== undefined);

  if (allAxiomFormulas.length > 0) {
    const atoms = new Set<string>();
    for (const f of allAxiomFormulas) collectAtoms(f).forEach((a) => atoms.add(a));
    collectAtoms(goal).forEach((a) => atoms.add(a));

    const atomList = Array.from(atoms);
    const valuations = generateValuations(atomList);

    let semanticallyValid = true;
    for (const v of valuations) {
      const premisesTrue = allAxiomFormulas.every((f) => evaluate(f, v));
      if (premisesTrue && !evaluate(goal, v)) {
        semanticallyValid = false;
        break;
      }
    }

    if (semanticallyValid) {
      return {
        goal,
        steps: state.steps,
        status: 'complete',
        derivedFrom: premiseNames,
      };
    }
  }

  return null;
}

function findStep(steps: ProofStep[], formula: Formula): number {
  const hash = formulaHash(formula);
  for (const s of steps) {
    if (formulaHash(s.formula) === hash) return s.stepNumber;
  }
  return 0;
}

function traceBack(steps: ProofStep[], goal: Formula): ProofStep[] {
  const goalHash = formulaHash(goal);
  const needed = new Set<number>();
  const goalStep = steps.find((s) => formulaHash(s.formula) === goalHash);
  if (!goalStep) return steps;

  function trace(stepNum: number) {
    if (needed.has(stepNum)) return;
    needed.add(stepNum);
    const step = steps.find((s) => s.stepNumber === stepNum);
    if (step) {
      for (const p of step.premises) {
        trace(p);
      }
    }
  }

  trace(goalStep.stepNumber);
  return steps.filter((s) => needed.has(s.stepNumber));
}

// --- Perfil Classical Propositional ---

export class ClassicalPropositional implements LogicProfile {
  name = 'classical.propositional';
  description =
    'Logica clasica proposicional con tabla de verdad, validez, satisfacibilidad, derivacion y contramodelo';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    function check(f: Formula) {
      switch (f.kind) {
        case 'atom':
          if (!f.name) {
            diags.push({ severity: 'error', message: 'Atomo sin nombre' });
          }
          break;
        case 'not':
          if (!f.args || f.args.length !== 1) {
            diags.push({
              severity: 'error',
              message: 'Negacion requiere exactamente un argumento',
            });
          } else if (f.args[0]) {
            check(f.args[0]);
          }
          break;
        case 'and':
        case 'or':
        case 'implies':
        case 'biconditional':
          if (!f.args || f.args.length !== 2) {
            diags.push({
              severity: 'error',
              message: `${f.kind} requiere exactamente dos argumentos`,
            });
          } else {
            if (f.args[0]) check(f.args[0]);
            if (f.args[1]) check(f.args[1]);
          }
          break;
        case 'forall':
        case 'exists':
        case 'predicate':
        case 'equals':
        case 'modal_necessity':
        case 'modal_possibility':
          diags.push({
            severity: 'error',
            message: `'${f.kind}' no esta soportado en logica proposicional clasica`,
          });
          break;
      }
    }
    check(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const tt = this.truthTable(formula);
    if (tt.isTautology) {
      return {
        status: 'valid',
        output: `${formulaToString(formula)} es VALIDA (tautologia)`,
        truthTable: tt,
        diagnostics: [],
        formula,
      };
    } else {
      // Encontrar contramodelo
      const cm = tt.rows.find((r) => !r.result);
      return {
        status: 'invalid',
        output: `${formulaToString(formula)} NO es valida`,
        truthTable: tt,
        model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
        diagnostics: [],
        formula,
      };
    }
  }

  checkSatisfiable(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const tt = this.truthTable(formula);
    if (tt.isSatisfiable) {
      const sat = tt.rows.find((r) => r.result);
      return {
        status: 'satisfiable',
        output: `${formulaToString(formula)} es SATISFACIBLE`,
        model: sat ? { type: 'propositional', valuation: sat.valuation } : undefined,
        truthTable: tt,
        diagnostics: [],
        formula,
      };
    } else {
      return {
        status: 'unsatisfiable',
        output: `${formulaToString(formula)} es INSATISFACIBLE (contradiccion)`,
        truthTable: tt,
        diagnostics: [],
        formula,
      };
    }
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const wf = this.checkWellFormed(goal);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula: goal };
    }

    const premiseNames = Array.from(theory.axioms.keys());
    const proof = tryDerive(goal, theory, premiseNames);

    if (proof && proof.status === 'complete') {
      return {
        status: 'provable',
        output: `${formulaToString(goal)} es DEMOSTRABLE desde la teoria`,
        proof,
        diagnostics: [],
        formula: goal,
      };
    }

    return {
      status: 'refutable',
      output: `${formulaToString(goal)} NO es demostrable desde la teoria dada`,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const wf = this.checkWellFormed(goal);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula: goal };
    }

    const proof = tryDerive(goal, theory, premises);

    if (proof && proof.status === 'complete') {
      return {
        status: 'provable',
        output: `${formulaToString(goal)} derivado exitosamente`,
        proof,
        diagnostics: [],
        formula: goal,
      };
    }

    return {
      status: 'refutable',
      output: `No se puede derivar ${formulaToString(goal)} desde las premisas dadas`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const atoms = Array.from(collectAtoms(formula));
    const valuations = generateValuations(atoms);

    for (const v of valuations) {
      if (!evaluate(formula, v)) {
        return {
          status: 'invalid',
          output: `Contramodelo encontrado para ${formulaToString(formula)}`,
          model: { type: 'propositional', valuation: v },
          diagnostics: [],
          formula,
        };
      }
    }

    return {
      status: 'valid',
      output: `${formulaToString(formula)} es tautologia, no hay contramodelo`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const tt = this.truthTable(formula);
    let explanation = `Formula: ${formulaToString(formula)}\n`;
    explanation += `Variables: ${tt.variables.join(', ')}\n`;
    explanation += `Tautologia: ${tt.isTautology ? 'si' : 'no'}\n`;
    explanation += `Contradiccion: ${tt.isContradiction ? 'si' : 'no'}\n`;
    explanation += `Satisfacible: ${tt.isSatisfiable ? 'si' : 'no'}\n`;
    explanation += `Total valuaciones: ${tt.rows.length}\n`;
    explanation += `Verdaderas: ${tt.rows.filter((r) => r.result).length}\n`;
    explanation += `Falsas: ${tt.rows.filter((r) => !r.result).length}\n`;

    return {
      status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
      output: explanation,
      truthTable: tt,
      diagnostics: [],
      formula,
    };
  }

  truthTable(formula: Formula): TruthTableResult {
    const atoms = Array.from(collectAtoms(formula)).sort();
    const valuations = generateValuations(atoms);

    const rows: TruthTableRow[] = valuations.map((v) => ({
      valuation: v,
      result: evaluate(formula, v),
    }));

    return {
      variables: atoms,
      rows,
      isTautology: rows.every((r) => r.result),
      isContradiction: rows.every((r) => !r.result),
      isSatisfiable: rows.some((r) => r.result),
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const wfA = this.checkWellFormed(a);
    const wfB = this.checkWellFormed(b);
    if (wfA.length > 0 || wfB.length > 0) {
      return { status: 'error', diagnostics: [...wfA, ...wfB] };
    }

    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    const tt = this.truthTable(biconditional);

    if (tt.isTautology) {
      return {
        status: 'valid',
        output: `${formulaToString(a)} y ${formulaToString(b)} son EQUIVALENTES`,
        truthTable: tt,
        diagnostics: [],
      };
    }

    const cm = tt.rows.find((r) => !r.result);
    return {
      status: 'invalid',
      output: `${formulaToString(a)} y ${formulaToString(b)} NO son equivalentes`,
      model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
      diagnostics: [],
    };
  }
}
