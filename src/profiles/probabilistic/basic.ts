// ============================================================
// ST Probabilistic Basic — Razonamiento Probabilístico
// ============================================================
// Motor básico de razonamiento probabilístico basado en
// asignaciones de probabilidad y reglas bayesianas.
//
// En este perfil, las fórmulas proposicionales se evalúan
// con probabilidades [0,1] en lugar de booleanos.
//
// Reglas:
//   P(A)       ∈ [0, 1]
//   P(¬A)      = 1 - P(A)
//   P(A ∧ B)   = P(A) × P(B)          (independencia)
//   P(A ∨ B)   = P(A) + P(B) - P(A∧B) (inclusión-exclusión)
//   P(A → B)   = P(¬A ∨ B)            (material conditional)
//   P(A ↔ B)   = P(A→B) × P(B→A)
//
// Validez: P(φ) = 1 para toda asignación
// Satisfacible: ∃ asignación con P(φ) > 0
// ============================================================

import {
  Formula,
  RunResult,
  Theory,
  LogicProfile,
  Diagnostic,
  TruthTableResult,
  TruthTableRow,
} from '../../types';
import { formulaToString } from '../classical/propositional';

// ── Recolectar átomos ───────────────────────────────────────

function collectAtoms(f: Formula): Set<string> {
  const atoms = new Set<string>();
  const walk = (node: Formula) => {
    if (node.kind === 'atom' && node.name) atoms.add(node.name);
    node.args?.forEach(walk);
  };
  walk(f);
  return atoms;
}

// ── Evaluación probabilística ───────────────────────────────

type ProbAssignment = Record<string, number>;

/** Evalúa una fórmula como booleana en una asignación {0,1} */
function boolEval(f: Formula, bools: Record<string, boolean>): boolean {
  switch (f.kind) {
    case 'atom':
      return f.name ? (bools[f.name] ?? false) : false;
    case 'not':
      return !boolEval((f.args || [])[0], bools);
    case 'and':
      return (f.args || []).every((a) => boolEval(a, bools));
    case 'or':
      return (f.args || []).some((a) => boolEval(a, bools));
    case 'implies': {
      const args = f.args || [];
      return !boolEval(args[0], bools) || boolEval(args[1], bools);
    }
    case 'biconditional': {
      const args = f.args || [];
      return boolEval(args[0], bools) === boolEval(args[1], bools);
    }
    case 'nand': {
      const args = f.args || [];
      return !(boolEval(args[0], bools) && boolEval(args[1], bools));
    }
    case 'nor': {
      const args = f.args || [];
      return !(boolEval(args[0], bools) || boolEval(args[1], bools));
    }
    case 'xor': {
      const args = f.args || [];
      return boolEval(args[0], bools) !== boolEval(args[1], bools);
    }
    default:
      return false;
  }
}

/**
 * Calcula P(φ) exactamente:
 *   P(φ) = Σ_{a ∈ {0,1}^n} P(a) × [a ⊨ φ]
 * donde P(a) = Π_i p_i^{a(i)} × (1 - p_i)^{1 - a(i)}
 *
 * Esto maneja correctamente fórmulas con átomos correlacionados
 * (e.g. P ∨ ¬P siempre da 1.0).
 */
function evalProb(f: Formula, v: ProbAssignment): number {
  const atoms = Array.from(collectAtoms(f));
  if (atoms.length === 0) {
    // Sin átomos: evaluar como booleano constante
    return boolEval(f, {}) ? 1 : 0;
  }

  const n = atoms.length;
  const total = 1 << n;
  let prob = 0;

  for (let mask = 0; mask < total; mask++) {
    const bools: Record<string, boolean> = {};
    let pAssignment = 1;
    for (let i = 0; i < n; i++) {
      const isTrue = !!(mask & (1 << i));
      bools[atoms[i]] = isTrue;
      const p = v[atoms[i]] ?? 0.5;
      pAssignment *= isTrue ? p : 1 - p;
    }
    if (boolEval(f, bools)) prob += pAssignment;
  }
  return prob;
}

// ── Muestreo de probabilidades ──────────────────────────────

const SAMPLE_PROBS = [0.0, 0.25, 0.5, 0.75, 1.0];

function generateProbAssignments(atoms: string[]): ProbAssignment[] {
  if (atoms.length === 0) return [{}];
  const results: ProbAssignment[] = [];
  const total = Math.pow(SAMPLE_PROBS.length, atoms.length);
  if (total > 10000) {
    // Demasiadas combinaciones, usar muestreo reducido
    const reduced = [0.0, 0.5, 1.0];
    const totalR = Math.pow(reduced.length, atoms.length);
    for (let i = 0; i < totalR; i++) {
      const assignment: ProbAssignment = {};
      let idx = i;
      for (const atom of atoms) {
        assignment[atom] = reduced[idx % reduced.length];
        idx = Math.floor(idx / reduced.length);
      }
      results.push(assignment);
    }
    return results;
  }
  for (let i = 0; i < total; i++) {
    const assignment: ProbAssignment = {};
    let idx = i;
    for (const atom of atoms) {
      assignment[atom] = SAMPLE_PROBS[idx % SAMPLE_PROBS.length];
      idx = Math.floor(idx / SAMPLE_PROBS.length);
    }
    results.push(assignment);
  }
  return results;
}

// ── Perfil ──────────────────────────────────────────────────

export class ProbabilisticBasic implements LogicProfile {
  name = 'probabilistic.basic';
  description = 'Razonamiento probabilístico básico — probabilidades [0,1], independencia, Bayes';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'atom' && !f.name) {
        diags.push({ severity: 'error', message: 'Átomo sin nombre' });
      }
      if (f.kind === 'modal_necessity' || f.kind === 'modal_possibility') {
        diags.push({
          severity: 'warning',
          message: 'Operadores modales no aplican en probabilistic.basic',
        });
      }
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const atoms = Array.from(collectAtoms(formula));
    const assignments = generateProbAssignments(atoms);
    const EPS = 1e-9;
    const allOne = assignments.every((a) => Math.abs(evalProb(formula, a) - 1) < EPS);

    if (allOne) {
      return {
        status: 'valid',
        output: `${formulaToString(formula)} tiene P=1 para toda asignación (tautología probabilística)`,
        diagnostics: [],
        formula,
      };
    }

    const counterEx = assignments.find((a) => evalProb(formula, a) < 1 - EPS);
    const prob = counterEx ? evalProb(formula, counterEx).toFixed(4) : '?';
    return {
      status: 'invalid',
      output: `${formulaToString(formula)} NO tiene P=1 siempre (ej: P=${prob})`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const atoms = Array.from(collectAtoms(formula));
    const assignments = generateProbAssignments(atoms);
    const EPS = 1e-9;
    const somePositive = assignments.some((a) => evalProb(formula, a) > EPS);

    return {
      status: somePositive ? 'satisfiable' : 'unsatisfiable',
      output: somePositive
        ? `${formulaToString(formula)} tiene asignaciones con P>0`
        : `${formulaToString(formula)} tiene P=0 para toda asignación`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    if (axioms.length === 0) return this.checkValid(goal);
    const conj: Formula = axioms.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    return this.checkValid(impl);
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const fs: Formula[] = [];
    for (const n of premises) {
      const f = theory.axioms.get(n) || theory.theorems.get(n);
      if (!f) {
        return {
          status: 'error',
          output: `Premisa no encontrada: ${n}`,
          diagnostics: [{ severity: 'error', message: `'${n}' no definida` }],
          formula: goal,
        };
      }
      fs.push(f);
    }
    if (fs.length === 0) return this.checkValid(goal);
    const conj: Formula = fs.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    return this.checkValid(impl);
  }

  countermodel(formula: Formula): RunResult {
    const atoms = Array.from(collectAtoms(formula));
    const assignments = generateProbAssignments(atoms);
    const EPS = 1e-9;
    const counterEx = assignments.find((a) => evalProb(formula, a) < 1 - EPS);

    if (counterEx) {
      const probStr = Object.entries(counterEx)
        .map(([k, v]) => `P(${k})=${v}`)
        .join(', ');
      return {
        status: 'invalid',
        output: `Contramodelo: ${probStr} → P(φ)=${evalProb(formula, counterEx).toFixed(4)}`,
        diagnostics: [],
        formula,
      };
    }
    return {
      status: 'valid',
      output: 'No hay contramodelo — P=1 siempre',
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const fStr = formulaToString(formula);
    const atoms = Array.from(collectAtoms(formula));

    let explanation = `Fórmula: ${fStr}\n`;
    explanation += `Variables: ${atoms.join(', ')}\n\n`;

    // Evaluar con distribución uniforme (0.5)
    const uniform: ProbAssignment = {};
    for (const a of atoms) uniform[a] = 0.5;
    const probUniform = evalProb(formula, uniform);

    explanation += `Cálculo paso a paso bajo distribución uniforme P(X)=0.5:\n`;

    // Named step-by-step based on formula structure (#20)
    const describeCalc = (f: Formula, assigns: ProbAssignment, indent: string): string => {
      if (f.kind === 'atom' && f.name) {
        return `${indent}P(${f.name}) = ${(assigns[f.name] ?? 0.5).toFixed(4)}  [Asignación directa]\n`;
      }
      if (f.kind === 'not' && f.args?.[0]) {
        const inner = evalProb(f.args[0], assigns);
        return `${indent}P(¬${formulaToString(f.args[0])}) = 1 - P(${formulaToString(f.args[0])}) = 1 - ${inner.toFixed(4)} = ${(1 - inner).toFixed(4)}  [Regla de negación]\n`;
      }
      if (f.kind === 'and' && f.args?.length === 2) {
        const pA = evalProb(f.args[0], assigns);
        const pB = evalProb(f.args[1], assigns);
        return `${indent}P(${formulaToString(f.args[0])} ∧ ${formulaToString(f.args[1])}) = P(${formulaToString(f.args[0])}) × P(${formulaToString(f.args[1])}) = ${pA.toFixed(4)} × ${pB.toFixed(4)} = ${(pA * pB).toFixed(4)}  [Independencia]\n`;
      }
      if (f.kind === 'or' && f.args?.length === 2) {
        const pA = evalProb(f.args[0], assigns);
        const pB = evalProb(f.args[1], assigns);
        const pAB = pA * pB;
        return `${indent}P(${formulaToString(f.args[0])} ∨ ${formulaToString(f.args[1])}) = P(A) + P(B) - P(A∧B) = ${pA.toFixed(4)} + ${pB.toFixed(4)} - ${pAB.toFixed(4)} = ${(pA + pB - pAB).toFixed(4)}  [Inclusión-exclusión]\n`;
      }
      if (f.kind === 'implies' && f.args?.length === 2) {
        return `${indent}P(${formulaToString(f)}) = P(¬${formulaToString(f.args[0])} ∨ ${formulaToString(f.args[1])}) = ${evalProb(f, assigns).toFixed(4)}  [Definición material del condicional]\n`;
      }
      return `${indent}P(${formulaToString(f)}) = ${evalProb(f, assigns).toFixed(4)}\n`;
    };

    explanation += describeCalc(formula, uniform, '  ');
    explanation += `  Resultado: P(${fStr}) = ${probUniform.toFixed(4)}\n\n`;

    explanation += `Axiomas de Kolmogorov:\n`;
    explanation += `  ✓ K1: P(φ) ≥ 0 para toda φ\n`;
    explanation += `  ✓ K2: P(⊤) = 1\n`;
    explanation += `  ✓ K3: Si φ∧ψ es insatisfacible → P(φ∨ψ) = P(φ) + P(ψ)\n\n`;

    if (atoms.length === 2) {
      const pA = 0.5;
      const pB = 0.5;
      const pAandB = 0.25; // bajo independencia
      const cond = pAandB / pA;
      const bayes = (cond * pA) / pB;
      explanation += `Probabilidad condicional (asumiendo independencia y uniformidad):\n`;
      explanation += `  P(${atoms[1]} | ${atoms[0]}) = P(${atoms[0]} ∧ ${atoms[1]}) / P(${atoms[0]}) = ${pAandB} / ${pA} = ${cond}\n\n`;

      explanation += `Teorema de Bayes:\n`;
      explanation += `  P(${atoms[0]} | ${atoms[1]}) = P(${atoms[1]} | ${atoms[0]}) × P(${atoms[0]}) / P(${atoms[1]})\n`;
      explanation += `             = ${cond} × ${pA} / ${pB}\n`;
      explanation += `             = ${bayes}\n\n`;
    }

    if (atoms.length > 0) {
      const a = atoms[0];
      explanation += `Análisis de sensibilidad de P(${fStr}) a cambios en P(${a}):\n`;
      for (const p of [0.0, 0.3, 0.5, 0.7, 1.0]) {
        const sensAssign = { ...uniform };
        sensAssign[a] = p;
        explanation += `  P(${a})=${p.toFixed(1)} → P(φ)=${evalProb(formula, sensAssign).toFixed(3)}\n`;
      }
      explanation += '\n';
    }

    explanation += [
      'Sistema: Probabilístico Básico',
      '',
      'Reglas (asumiendo independencia):',
      '  P(¬A)    = 1 - P(A)',
      '  P(A ∧ B) = P(A) × P(B)',
      '  P(A ∨ B) = P(A) + P(B) - P(A)×P(B)',
      '  P(A → B) = P(¬A ∨ B)',
      '',
      'Validez: P(φ) = 1 para toda asignación en [0,1]',
      'Satisfacible: ∃ asignación con P(φ) > 0',
    ].join('\n');

    return {
      status: 'unknown',
      output: explanation,
      diagnostics: [],
      formula,
    };
  }

  /**
   * Tabla de probabilidades (análogo a truth_table)
   */
  truthTable(formula: Formula): TruthTableResult {
    const atoms = Array.from(collectAtoms(formula));
    // Usar solo valores extremos (0 y 1) para la tabla clásica
    const n = atoms.length;
    const total = 1 << n;
    const rows: TruthTableRow[] = [];

    const subFormulas: { formula: Formula; label: string }[] = [];
    const args = formula.args || [];
    for (const arg of args) {
      if (arg.kind !== 'atom') {
        subFormulas.push({ formula: arg, label: formulaToString(arg) });
      }
    }

    const subFormulaValues: Record<string, string | boolean>[] = [];

    for (let i = 0; i < total; i++) {
      const v: ProbAssignment = {};
      for (let j = 0; j < n; j++) {
        v[atoms[j]] = (i >> (n - 1 - j)) & 1;
      }
      const prob = evalProb(formula, v);

      const subVals: Record<string, string> = {};
      for (const sf of subFormulas) {
        const subProb = evalProb(sf.formula, v);
        subVals[sf.label] = subProb.toFixed(4);
      }
      subFormulaValues.push(subVals);

      rows.push({
        valuation: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === 1])),
        result: prob.toFixed(4),
      });
    }

    const EPS = 1e-9;
    const allOne = rows.every((r) => Math.abs(Number(r.result) - 1) < EPS);
    const allZero = rows.every((r) => Math.abs(Number(r.result)) < EPS);
    const somePositive = rows.some((r) => Number(r.result) > EPS);

    return {
      variables: atoms,
      rows,
      isTautology: allOne,
      isContradiction: allZero,
      isSatisfiable: somePositive,
      subFormulas,
      subFormulaValues,
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    return this.checkValid(biconditional);
  }
}
