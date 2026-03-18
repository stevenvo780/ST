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

    explanation += `P(φ) con distribución uniforme (0.5): ${probUniform.toFixed(4)}\n\n`;

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

    for (let i = 0; i < total; i++) {
      const v: ProbAssignment = {};
      for (let j = 0; j < n; j++) {
        v[atoms[j]] = (i >> (n - 1 - j)) & 1;
      }
      const prob = evalProb(formula, v);
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
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    return this.checkValid(biconditional);
  }
}
