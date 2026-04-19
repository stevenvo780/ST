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

import { Formula, RunResult, Theory, LogicProfile, Diagnostic, Model } from '../../types';
import { formulaToString } from '../classical/propositional';
import { FrameRules, checkTableau, Branch } from './tableau-engine';
import { identifyTheorem } from '../../runtime/known-theorems';

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

  protected extractKripkeModel(branch: Branch): Model {
    const valuation: Record<string, Record<string, boolean>> = {};
    for (const world of branch.worlds) {
      valuation[world] = {};
    }
    for (const lit of branch.literals) {
      if (lit.formula.kind === 'atom' && lit.formula.name) {
        valuation[lit.world][lit.formula.name] = true;
      } else if (
        lit.formula.kind === 'not' &&
        lit.formula.args?.[0]?.kind === 'atom' &&
        lit.formula.args[0].name
      ) {
        valuation[lit.world][lit.formula.args[0].name] = false;
      }
    }

    const accessibility: Record<string, string[]> = {};
    for (const [k, v] of branch.accessibility.entries()) {
      accessibility[k] = Array.from(v);
    }

    const modelWorlds = Array.from(branch.worlds).map((w) => ({
      name: w,
      valuation: valuation[w] || {},
      accessible: accessibility[w] || [],
    }));

    return { type: 'modal', worlds: modelWorlds };
  }

  protected enrichResult(formula: Formula, result: RunResult): RunResult {
    const known = identifyTheorem(formula, this.name);
    if (known) {
      result.formulaClassification = known.name;
      if (known.paradox) {
        result.paradoxWarning = known.note || known.name;
      } else if (known.note) {
        result.educationalNote = known.note;
      }
    }
    return result;
  }

  checkValid(formula: Formula): RunResult {
    const res = checkTableau(formula, this.frameRules, true);
    const valid = res.closed;
    const fStr = this.formatFormula(formula);
    return this.enrichResult(formula, {
      status: valid ? 'valid' : 'invalid',
      output: valid ? `${fStr} es VÁLIDA en ${this.name}` : `${fStr} NO es válida en ${this.name}`,
      tableauTrace: res.trace,
      model: valid || !res.openBranch ? undefined : this.extractKripkeModel(res.openBranch),
      diagnostics: [],
      formula,
    });
  }

  checkSatisfiable(formula: Formula): RunResult {
    const res = checkTableau(formula, this.frameRules, false);
    const sat = !res.closed;
    const fStr = this.formatFormula(formula);
    return {
      status: sat ? 'satisfiable' : 'unsatisfiable',
      output: sat
        ? `${fStr} es SATISFACIBLE en ${this.name}`
        : `${fStr} es INSATISFACIBLE en ${this.name}`,
      tableauTrace: res.trace,
      model: sat && res.openBranch ? this.extractKripkeModel(res.openBranch) : undefined,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory, premises?: string[]): RunResult {
    const useRestricted = premises !== undefined && premises.length > 0;
    const diagnostics: Diagnostic[] = [];
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
    if (axioms.length === 0) return this.checkValid(goal);
    const conj: Formula = axioms.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    const res = checkTableau(impl, this.frameRules, true);
    const valid = res.closed;
    const fStr = this.formatFormula(goal);
    return {
      status: valid ? 'provable' : 'refutable',
      output: valid
        ? `${fStr} es DEMOSTRABLE desde los axiomas`
        : `${fStr} NO es demostrable desde los axiomas`,
      tableauTrace: res.trace,
      model: valid || !res.openBranch ? undefined : this.extractKripkeModel(res.openBranch),
      diagnostics,
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
    const res = checkTableau(impl, this.frameRules, true);
    const valid = res.closed;
    const fStr = this.formatFormula(goal);
    return {
      status: valid ? 'provable' : 'refutable',
      output: valid
        ? `${fStr} es DERIVABLE desde {${premises.join(', ')}}`
        : `${fStr} NO es derivable desde {${premises.join(', ')}}`,
      tableauTrace: res.trace,
      model: valid || !res.openBranch ? undefined : this.extractKripkeModel(res.openBranch),
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const res = checkTableau({ kind: 'not', args: [formula] }, this.frameRules, false);
    const sat = !res.closed;
    const fStr = this.formatFormula(formula);
    return {
      status: sat ? 'invalid' : 'valid',
      output: sat
        ? `Existe un contramodelo para ${fStr}`
        : `No existe contramodelo — ${fStr} es válida en ${this.name}`,
      tableauTrace: res.trace,
      model: sat && res.openBranch ? this.extractKripkeModel(res.openBranch) : undefined,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const fStr = this.formatFormula(formula);
    let explanation = `Fórmula: ${fStr}\n\n`;
    explanation += this.explainSystem();
    const res = checkTableau(formula, this.frameRules, true);
    const valid = res.closed;
    explanation += `\nEstatus: ${valid ? 'VÁLIDA' : 'NO válida'} en ${this.name}`;
    return this.enrichResult(formula, {
      status: valid ? 'valid' : 'invalid',
      output: explanation,
      tableauTrace: res.trace,
      model: valid || !res.openBranch ? undefined : this.extractKripkeModel(res.openBranch),
      diagnostics: [],
      formula,
    });
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    const res = checkTableau(biconditional, this.frameRules, true);
    const valid = res.closed;
    const fA = this.formatFormula(a);
    const fB = this.formatFormula(b);
    return {
      status: valid ? 'valid' : 'invalid',
      output: valid
        ? `${fA} y ${fB} son EQUIVALENTES en ${this.name}`
        : `${fA} y ${fB} NO son equivalentes en ${this.name}`,
      tableauTrace: res.trace,
      model: valid || !res.openBranch ? undefined : this.extractKripkeModel(res.openBranch),
      diagnostics: [],
    };
  }
}
