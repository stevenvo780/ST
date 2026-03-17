// ============================================================
// ST Paraconsistent Belnap — Stub (contrato definido)
// ============================================================

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { formulaToString } from '../classical/propositional';

export class ParaconsistentBelnap implements LogicProfile {
  name = 'paraconsistent.belnap';
  description = 'Logica paraconsistente Belnap-Dunn (stub — contrato definido, motor pendiente)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    return [];
  }

  checkValid(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `[paraconsistent.belnap] Motor no implementado aun. Formula: ${formulaToString(formula)}`,
      diagnostics: [
        {
          severity: 'warning',
          message: 'Perfil paraconsistent.belnap aun no tiene motor completo',
        },
      ],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: '[paraconsistent.belnap] No implementado',
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    return {
      status: 'unknown',
      output: '[paraconsistent.belnap] No implementado',
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    return {
      status: 'unknown',
      output: '[paraconsistent.belnap] No implementado',
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: '[paraconsistent.belnap] No implementado',
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: '[paraconsistent.belnap] No implementado',
      diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
      formula,
    };
  }
}
