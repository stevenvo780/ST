// ============================================================
// ST Classical First-Order — Stub (contrato definido)
// ============================================================

import {
  Formula, Diagnostic, RunResult, Theory, LogicProfile, TruthTableResult
} from '../../types';
import { formulaToString } from './propositional';

export class ClassicalFirstOrder implements LogicProfile {
  name = 'classical.first_order';
  description = 'Logica clasica de primer orden con igualdad (stub — contrato definido, motor pendiente)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    return [];
  }

  checkValid(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] Motor no implementado aun. Formula: ${formulaToString(formula)}`,
      diagnostics: [{
        severity: 'warning',
        message: 'Perfil classical.first_order aun no tiene motor completo',
      }],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] Motor no implementado aun`,
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] prove no implementado aun`,
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] derive no implementado aun`,
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] countermodel no implementado aun`,
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `[classical.first_order] explain no implementado aun`,
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }
}
