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
        : `${formulaToString(formula)} es una contradicion en Belnap (nunca designada)`,
      truthTable: tt,
      educationalNote:
        'En la lógica de Belnap, P ∧ ¬P es satisfacible porque P puede tomar el valor designado B (Both).',
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    // Entailment correcto en Belnap: para toda valuación donde TODAS las premisas
    // son designadas (T o B), el goal también es designado.
    const axioms = Array.from(theory.axioms.values());
    if (axioms.length === 0) return this.checkValid(goal);

    const allFormulas = [...axioms, goal];
    const atoms = new Set<string>();
    for (const f of allFormulas) {
      for (const a of this.collectAtoms(f)) atoms.add(a);
    }
    const atomsArr = Array.from(atoms).sort();
    const valuations = this.generateBelnapValuations(atomsArr);
    const designated = new Set<BelnapValue>(['T', 'B']);

    for (const v of valuations) {
      const bv = v as unknown as Record<string, BelnapValue>;
      const allPremisesDesignated = axioms.every((ax) =>
        designated.has(this.evaluateBelnap(ax, bv)),
      );
      if (allPremisesDesignated) {
        const goalDesignated = designated.has(this.evaluateBelnap(goal, bv));
        if (!goalDesignated) {
          return {
            status: 'refutable',
            output: `${formulaToString(goal)} no es demostrable en Belnap (premisas designadas pero goal no)`,
            diagnostics: [],
            formula: goal,
          };
        }
      }
    }

    return {
      status: 'provable',
      output: `${formulaToString(goal)} se sigue de la teoria en Belnap (preserva valores designados)`,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const premiseFormulas = premises
      .map((p) => theory.axioms.get(p) || theory.theorems.get(p))
      .filter((f): f is Formula => f !== undefined);

    if (premiseFormulas.length === 0) return this.checkValid(goal);

    // Entailment correcto: para toda valuación donde TODAS las premisas son
    // designadas (T o B), el goal también es designado.
    const allFormulas = [...premiseFormulas, goal];
    const atoms = new Set<string>();
    for (const f of allFormulas) {
      for (const a of this.collectAtoms(f)) atoms.add(a);
    }
    const atomsArr = Array.from(atoms).sort();
    const valuations = this.generateBelnapValuations(atomsArr);
    const designated = new Set<BelnapValue>(['T', 'B']);

    for (const v of valuations) {
      const bv = v as unknown as Record<string, BelnapValue>;
      const allPremisesDesignated = premiseFormulas.every((pf) =>
        designated.has(this.evaluateBelnap(pf, bv)),
      );
      if (allPremisesDesignated) {
        const goalDesignated = designated.has(this.evaluateBelnap(goal, bv));
        if (!goalDesignated) {
          return {
            status: 'refutable',
            output: `No se puede derivar en Belnap (premisas designadas pero goal no)`,
            diagnostics: [],
            formula: goal,
          };
        }
      }
    }

    return {
      status: 'provable',
      output: `Derivacion exitosa en Belnap (preserva valores designados)`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const tt = this.generateBelnapTable(formula);
    const designated = new Set(['T', 'B']);
    const cm = tt.rows.find((r) => !designated.has(String(r.result)));

    if (cm) {
      const valNames: Record<string, string> = {
        T: 'True — solo verdadero',
        F: 'False — solo falso',
        B: 'Both — verdadero y falso',
        N: 'Neither — ni verdadero ni falso',
      };
      let output = `Contramodelo Belnap para: ${formulaToString(formula)}\n`;
      output += `  Valuación:\n`;
      for (const [v, val] of Object.entries(cm.valuation)) {
        output += `    ${v} = ${val} (${valNames[String(val)] ?? val})\n`;
      }
      output += `  Resultado: ${formulaToString(formula)} = ${cm.result} (no designado)\n`;
      output += `\n  Explicación: En la lógica de Belnap, los valores designados son {T, B}.\n`;
      output += `  El valor "${cm.result}" no es designado, por lo que la fórmula falla bajo esta valuación.`;

      return {
        status: 'invalid',
        output,
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
    const tt = this.generateBelnapTable(formula);
    const designated = new Set(['T', 'B']);
    const isTautology = tt.rows.every((r) => designated.has(String(r.result)));
    const isSatisfiable = tt.rows.some((r) => designated.has(String(r.result)));
    const atoms = Array.from(this.collectAtoms(formula));

    let out = `Lógica Paraconsistente de Belnap (4-Valores)\n`;
    out += `Fórmula: ${formulaToString(formula)}\n\n`;

    out += `Retículo de verdad (A4):\n`;
    out += `       T\n`;
    out += `      / \\\n`;
    out += `     B   N\n`;
    out += `      \\ /\n`;
    out += `       F\n`;
    out += `  Valores designados: {T, B} (portadores de verdad)\n\n`;

    // Per-value evaluation (#16)
    if (atoms.length <= 2) {
      out += `Evaluación por valor de ${atoms.length > 0 ? atoms[0] : 'P'}:\n`;
      for (const val of VALUES) {
        const valuation: Record<string, BelnapValue> = {};
        for (const a of atoms) valuation[a] = val;
        const result = this.evaluateBelnap(formula, valuation);
        const isDesig = designated.has(result);
        out += `  ${atoms.length > 0 ? atoms[0] : 'P'} = ${val} → ${formulaToString(formula)} = ${result}${isDesig ? ' ⊛ ← Designado' : ''}\n`;
      }
      out += `\n`;
    }

    // Designación marks in table (#17)
    out += `Tabla Belnap:\n`;
    const headerAtoms = atoms.length > 0 ? atoms : ['P'];
    out += `  ${headerAtoms.join(' | ')} | ${formulaToString(formula)}\n`;
    out += `  ${headerAtoms.map(() => '---').join('-+-')}---+---${'-'.repeat(formulaToString(formula).length)}\n`;
    for (const row of tt.rows) {
      const vals = headerAtoms.map((a) => String(row.valuation[a] || 'F'));
      const res = String(row.result);
      const mark = designated.has(res) ? ' ⊛' : '';
      out += `  ${vals.join(' | ')} | ${res}${mark}\n`;
    }
    out += `  ⊛ = valor designado (T o B = porta verdad)\n\n`;

    // Laws that FAIL (#16)
    out += `Leyes clásicas que FALLAN en Belnap:\n`;
    out += `  ✗ P ∨ ¬P (Tercero excluido): Falla cuando P=N (da N, no designado)\n`;
    out += `  ✗ ¬(P ∧ ¬P) (No-contradicción): Falla cuando P=B (¬(B∧B) = ¬B = B, designado pero contradictorio)\n`;
    out += `  ✗ (P ∧ ¬P) → Q (Ex falso): Falla — la explosión no vale\n`;
    out += `  ✗ P → P (Identidad): Falla cuando P=N (N→N = N, no designado)\n\n`;

    // Laws that HOLD (#18)
    out += `Leyes clásicas que SE MANTIENEN en Belnap:\n`;
    out += `  ✓ De Morgan: ¬(P∧Q) ≡ ¬P∨¬Q y ¬(P∨Q) ≡ ¬P∧¬Q\n`;
    out += `  ✓ Distributividad: P∧(Q∨R) ≡ (P∧Q)∨(P∧R)\n`;
    out += `  ✓ Idempotencia: P∧P ≡ P y P∨P ≡ P\n`;
    out += `  ✓ Doble negación: ¬¬P ≡ P\n\n`;

    // Classical comparison (#19)
    out += `Comparación con lógica clásica:\n`;
    out += `  En lógica clásica, esta fórmula sería: ${isTautology ? 'TAUTOLOGÍA (siempre V)' : isSatisfiable ? 'CONTINGENTE (a veces V, a veces F)' : 'CONTRADICCIÓN (siempre F)'}\n`;
    out += `  En Belnap: ${isTautology ? 'TAUTOLOGÍA (siempre designada)' : isSatisfiable ? 'SATISFACIBLE (al menos una valuación designada)' : 'INSATISFACIBLE (nunca designada)'}\n\n`;

    out += `Estatus: ${isTautology ? 'TAUTOLOGÍA' : isSatisfiable ? 'SATISFACIBLE' : 'INSATISFACIBLE (Nunca designada)'}\n`;

    const educationalNote = `En la lógica de Belnap, una contradicción (como P ∧ ¬P) puede tomar el valor designado 'B' (Both), lo que significa que de una contradicción no se sigue cualquier cosa (no hay "explosión" / ex falso quodlibet). Belnap modela fuentes de información contradictorias que coexisten sin colapso. Está relacionada con la lógica de la relevancia.`;

    return {
      status: isTautology ? 'valid' : 'invalid',
      output: out,
      truthTable: tt,
      educationalNote,
      diagnostics: [],
      formula,
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    // En Belnap, equivalencia = mismo valor de verdad para toda valuación 4-valorada.
    // No usamos biconditional material porque A↔A puede dar N cuando A=N.
    const allFormulas = [a, b];
    const atoms = new Set<string>();
    for (const f of allFormulas) {
      for (const at of this.collectAtoms(f)) atoms.add(at);
    }
    const atomsArr = Array.from(atoms).sort();
    const valuations = this.generateBelnapValuations(atomsArr);

    for (const v of valuations) {
      const bv = v as unknown as Record<string, BelnapValue>;
      const valA = this.evaluateBelnap(a, bv);
      const valB = this.evaluateBelnap(b, bv);
      if (valA !== valB) {
        return {
          status: 'invalid',
          output: `${formulaToString(a)} y ${formulaToString(b)} NO son equivalentes en Belnap (difieren en alguna valuación)`,
          diagnostics: [],
        };
      }
    }

    return {
      status: 'valid',
      output: `${formulaToString(a)} y ${formulaToString(b)} son EQUIVALENTES en Belnap (mismo valor 4-valorado en toda valuación)`,
      diagnostics: [],
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
      case 'biconditional': {
        // A <-> B en Belnap = (A -> B) & (B -> A) = (!A | B) & (!B | A)
        if (!args[0] || !args[1]) return 'N';
        const aVal = this.evaluateBelnap(args[0], v);
        const bVal = this.evaluateBelnap(args[1], v);
        const aToB = BELNAP_OR[BELNAP_NOT[aVal]][bVal];
        const bToA = BELNAP_OR[BELNAP_NOT[bVal]][aVal];
        return BELNAP_AND[aToB][bToA];
      }
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

  truthTable(formula: Formula): TruthTableResult {
    return this.generateBelnapTable(formula);
  }
}
