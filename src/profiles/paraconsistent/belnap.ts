// ============================================================
// ST Belnap — Motor Paraconsistente de 4 Valores
// ============================================================

import {
  Formula,
  RunResult,
  Theory,
  LogicProfile,
  Diagnostic,
  Valuation,
  TruthTableResult,
} from '../../types';
import { formulaToString } from '../classical/propositional';

/**
 * Valores de verdad en la lógica de Belnap (A4):
 * T: True (Solo verdad)
 * F: False (Solo falsedad)
 * B: Both (Verdadero y Falso - Inconsistente)
 * N: None (Ni Verdadero ni Falso - Indeterminado)
 */
export type BelnapValue = 'T' | 'F' | 'B' | 'N';

const VALUES: BelnapValue[] = ['T', 'F', 'B', 'N'];

/**
 * Semántica de Belnap (Lattice-based):
 * Negación: intercambia T/F, mantiene B/N.
 * And: Mínimo en el retículo de información.
 * Or: Máximo en el retículo de información.
 */
const BELNAP_NOT: Record<BelnapValue, BelnapValue> = {
  T: 'F',
  F: 'T',
  B: 'B',
  N: 'N',
};

// Orden de información (Truth lattice): F < B,N < T
// Para simplificar, usamos una matriz de resultados
const BELNAP_AND: Record<BelnapValue, Record<BelnapValue, BelnapValue>> = {
  T: { T: 'T', F: 'F', B: 'B', N: 'N' },
  F: { T: 'F', F: 'F', B: 'F', N: 'F' },
  B: { T: 'B', F: 'F', B: 'B', N: 'F' },
  N: { T: 'N', F: 'F', B: 'F', N: 'N' },
};

const BELNAP_OR: Record<BelnapValue, Record<BelnapValue, BelnapValue>> = {
  T: { T: 'T', F: 'T', B: 'T', N: 'T' },
  F: { T: 'T', F: 'F', B: 'B', N: 'N' },
  B: { T: 'T', F: 'B', B: 'B', N: 'T' },
  N: { T: 'T', F: 'N', B: 'T', N: 'N' },
};

export class ParaconsistentBelnap implements LogicProfile {
  name = 'paraconsistent.belnap';
  description = 'Logica paraconsistente de Belnap (4-valued: T, F, Both, None)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    // Reutilizamos la validación proposicional, ya que la sintaxis es idéntica
    const diags: Diagnostic[] = [];
    const check = (f: Formula) => {
      if (f.kind === 'atom' && !f.name) {
        diags.push({ severity: 'error', message: 'Atomo sin nombre' });
      }
      if (f.args) {
        for (const arg of f.args) check(arg);
      }
    };
    check(formula);
    return diags;
  }

  /**
   * En Belnap, una fórmula es válida si siempre evalúa a un valor "designado" (T o B).
   */
  checkValid(formula: Formula): RunResult {
    const tt = this.generateBelnapTable(formula);
    const designated = new Set(['T', 'B']);
    const isTautology = tt.rows.every((r) => designated.has(String(r.result)));

    if (isTautology) {
      return {
        status: 'valid',
        output: `${formulaToString(formula)} es una tautologia en Belnap (siempre designada T/B)`,
        truthTable: tt,
        diagnostics: [],
        formula,
      };
    }

    const cm = tt.rows.find((r) => !designated.has(String(r.result)));
    return {
      status: 'invalid',
      output: `${formulaToString(formula)} no es valida en Belnap`,
      truthTable: tt,
      model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const tt = this.generateBelnapTable(formula);
    const designated = new Set(['T', 'B']);
    const isSatisfiable = tt.rows.some((r) => designated.has(String(r.result)));

    return {
      status: isSatisfiable ? 'satisfiable' : 'unsatisfiable',
      output: isSatisfiable
        ? `${formulaToString(formula)} es satisfacible en Belnap`
        : `${formulaToString(formula)} es una contradiccion en Belnap (nunca designada)`,
      truthTable: tt,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    // Para prove en Belnap, verificamos si la inferencia es válida (preservación de valores designados)
    const axioms = Array.from(theory.axioms.values());
    const tt = this.generateBelnapTable({ kind: 'implies', args: [this.conjoin(axioms), goal] });
    const designated = new Set(['T', 'B']);
    const isProvable = tt.rows.every((r) => designated.has(String(r.result)));

    return {
      status: isProvable ? 'provable' : 'refutable',
      output: isProvable
        ? `${formulaToString(goal)} se sigue de la teoria en Belnap`
        : `${formulaToString(goal)} no es demostrable en Belnap`,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const premiseFormulas = premises
      .map((p) => theory.axioms.get(p) || theory.theorems.get(p))
      .filter((f): f is Formula => f !== undefined);

    const tt = this.generateBelnapTable({
      kind: 'implies',
      args: [this.conjoin(premiseFormulas), goal],
    });
    const designated = new Set(['T', 'B']);
    const isProvable = tt.rows.every((r) => designated.has(String(r.result)));

    return {
      status: isProvable ? 'provable' : 'refutable',
      output: isProvable ? `Derivacion exitosa en Belnap` : `No se puede derivar en Belnap`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const tt = this.generateBelnapTable(formula);
    const designated = new Set(['T', 'B']);
    const cm = tt.rows.find((r) => !designated.has(String(r.result)));

    if (cm) {
      return {
        status: 'invalid',
        output: `Contramodelo encontrado en Belnap`,
        model: { type: 'propositional', valuation: cm.valuation },
        diagnostics: [],
        formula,
      };
    }

    return {
      status: 'valid',
      output: `No hay contramodelo en Belnap (tautologia)`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `Logica de Belnap (4-valores): ${formulaToString(formula)}`,
      diagnostics: [],
      formula,
    };
  }

  private conjoin(formulas: Formula[]): Formula {
    if (formulas.length === 0) return { kind: 'atom', name: 'T' }; // Top
    if (formulas.length === 1) return formulas[0];
    return { kind: 'and', args: [formulas[0], this.conjoin(formulas.slice(1))] };
  }

  private evaluateBelnap(f: Formula, v: Record<string, BelnapValue>): BelnapValue {
    const args = f.args || [];
    switch (f.kind) {
      case 'atom':
        return f.name ? (v[f.name] ?? 'N') : 'N';
      case 'not':
        return args[0] ? BELNAP_NOT[this.evaluateBelnap(args[0], v)] : 'N';
      case 'and':
        return args[0] && args[1]
          ? BELNAP_AND[this.evaluateBelnap(args[0], v)][this.evaluateBelnap(args[1], v)]
          : 'N';
      case 'or':
        return args[0] && args[1]
          ? BELNAP_OR[this.evaluateBelnap(args[0], v)][this.evaluateBelnap(args[1], v)]
          : 'N';
      case 'implies':
        // Implicación en Belnap (A -> B es !A | B)
        return args[0] && args[1]
          ? BELNAP_OR[BELNAP_NOT[this.evaluateBelnap(args[0], v)]][this.evaluateBelnap(args[1], v)]
          : 'N';
      default:
        return 'N';
    }
  }

  private generateBelnapTable(formula: Formula): TruthTableResult {
    const atoms = Array.from(this.collectAtoms(formula)).sort();
    const rows = this.generateBelnapValuations(atoms).map((v) => ({
      valuation: v as unknown as Valuation,
      result: this.evaluateBelnap(formula, v as unknown as Record<string, BelnapValue>),
    }));

    return {
      variables: atoms,
      rows,
      isTautology: rows.every((r) => new Set(['T', 'B']).has(String(r.result))),
      isSatisfiable: rows.some((r) => new Set(['T', 'B']).has(String(r.result))),
      isContradiction: rows.every((r) => !new Set(['T', 'B']).has(String(r.result))),
    };
  }

  private collectAtoms(f: Formula): Set<string> {
    const atoms = new Set<string>();
    const walk = (node: Formula) => {
      if (node.kind === 'atom' && node.name) atoms.add(node.name);
      if (node.args) node.args.forEach(walk);
    };
    walk(f);
    return atoms;
  }

  private generateBelnapValuations(atoms: string[]): Record<string, BelnapValue>[] {
    if (atoms.length === 0) return [{}];
    const sub = this.generateBelnapValuations(atoms.slice(1));
    const result: Record<string, BelnapValue>[] = [];
    for (const v of sub) {
      for (const val of VALUES) {
        result.push({ ...v, [atoms[0]]: val });
      }
    }
    return result;
  }
}
