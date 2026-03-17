// ============================================================
// ST Base Tableau Profile — Clase base para perfiles modales
// ============================================================
// Todos los perfiles basados en tableau (modal, deontic, epistemic,
// intuitionistic, temporal) extienden esta clase y solo definen:
//   - name, description
//   - frameRules (tipo de relación de accesibilidad)
//   - formatFormula() (notación específica del dominio)
//   - explainSystem() (descripción de axiomas del sistema)
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString } from '../classical/propositional';
import { FrameRules, isValid, isSatisfiable } from './tableau-engine';

export abstract class BaseTableauProfile implements LogicProfile {
  abstract name: string;
  abstract description: string;
  abstract frameRules: FrameRules;

  /** Notación de dominio. Por defecto usa formulaToString. */
  formatFormula(f: Formula): string {
    return formulaToString(f);
  }

  /** Descripción del sistema para explain(). */
  abstract explainSystem(): string;

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'atom' && !f.name) {
        diags.push({ severity: 'error', message: 'Átomo sin nombre' });
      }
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const valid = isValid(formula, this.frameRules);
    const fStr = this.formatFormula(formula);
    return {
      status: valid ? 'valid' : 'invalid',
      output: valid ? `${fStr} es VÁLIDA en ${this.name}` : `${fStr} NO es válida en ${this.name}`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const sat = isSatisfiable(formula, this.frameRules);
    const fStr = this.formatFormula(formula);
    return {
      status: sat ? 'satisfiable' : 'unsatisfiable',
      output: sat
        ? `${fStr} es SATISFACIBLE en ${this.name}`
        : `${fStr} es INSATISFACIBLE en ${this.name}`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.values());
    if (axioms.length === 0) return this.checkValid(goal);
    const conj: Formula = axioms.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    const valid = isValid(impl, this.frameRules);
    const fStr = this.formatFormula(goal);
    return {
      status: valid ? 'provable' : 'refutable',
      output: valid
        ? `${fStr} es DEMOSTRABLE desde los axiomas`
        : `${fStr} NO es demostrable desde los axiomas`,
      diagnostics: [],
      formula: goal,
    };
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
    const valid = isValid(impl, this.frameRules);
    const fStr = this.formatFormula(goal);
    return {
      status: valid ? 'provable' : 'refutable',
      output: valid
        ? `${fStr} es DERIVABLE desde {${premises.join(', ')}}`
        : `${fStr} NO es derivable desde {${premises.join(', ')}}`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const sat = isSatisfiable({ kind: 'not', args: [formula] }, this.frameRules);
    const fStr = this.formatFormula(formula);
    return {
      status: sat ? 'invalid' : 'valid',
      output: sat
        ? `Existe un contramodelo para ${fStr}`
        : `No existe contramodelo — ${fStr} es válida en ${this.name}`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const fStr = this.formatFormula(formula);
    let explanation = `Fórmula: ${fStr}\n\n`;
    explanation += this.explainSystem();
    const valid = isValid(formula, this.frameRules);
    explanation += `\nEstatus: ${valid ? 'VÁLIDA' : 'NO válida'} en ${this.name}`;
    return {
      status: valid ? 'valid' : 'invalid',
      output: explanation,
      diagnostics: [],
      formula,
    };
  }
}
