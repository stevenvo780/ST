// ============================================================
// ST dL-Hybrid — Profile descriptor para registro en ST
// ============================================================
// Adaptador entre el AST nativo de dL (DLFormula) y la `LogicProfile`
// del runtime ST (basada en `Formula` clásica). Por defecto, este perfil
// se usa programáticamente con el AST nativo (parseFormula + checkValid);
// el adaptador `LogicProfile` lo expone por el registry global pero
// degrada graciosamente para fórmulas no-dL (no usa la forma estándar
// de tableau modal, sino el motor dedicado de dl-hybrid).
// ============================================================

import type {
  LogicProfile,
  Formula,
  RunResult,
  Theory,
  Diagnostic,
} from '../../../types';
import { checkValid as dlCheckValid, checkSatisfiable as dlCheckSat } from './tableau';
import type { DLFormula } from './ast';
import { formulaToString } from './ast';

/**
 * Indicador para que ST sepa que este perfil usa AST nativo paralelo.
 * Si el caller pasa una `Formula` clásica, devolvemos `unknown` con un
 * mensaje informativo. El uso recomendado es vía las funciones exportadas
 * en el index del perfil.
 */
const UNSUPPORTED_FORMULA: Diagnostic = {
  severity: 'info',
  message:
    'dl-hybrid usa un AST nativo (DLFormula). Para usar este perfil, parsea con `parseFormula(src)` y usa `checkValid` directamente.',
};

export class DLHybridProfile implements LogicProfile {
  name = 'dl-hybrid';
  description =
    'Differential Dynamic Logic (Platzer) — verificación de sistemas híbridos (estados continuos + discretos) con ODEs polinomiales lineales en subset decidible.';

  checkWellFormed(_formula: Formula): Diagnostic[] {
    return [UNSUPPORTED_FORMULA];
  }

  checkValid(formula: Formula): RunResult {
    return this.notApplicable(formula);
  }
  checkSatisfiable(formula: Formula): RunResult {
    return this.notApplicable(formula);
  }
  prove(goal: Formula, _theory: Theory, _premises?: string[]): RunResult {
    return this.notApplicable(goal);
  }
  derive(goal: Formula, _premises: string[], _theory: Theory): RunResult {
    return this.notApplicable(goal);
  }
  countermodel(formula: Formula): RunResult {
    return this.notApplicable(formula);
  }
  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: this.explainSystem(),
      diagnostics: [UNSUPPORTED_FORMULA],
      formula,
    };
  }

  private notApplicable(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output:
        'dl-hybrid no acepta `Formula` clásica directamente. Use el API nativo: `parseFormula`, `checkValid`, etc.',
      diagnostics: [UNSUPPORTED_FORMULA],
      formula,
    };
  }

  explainSystem(): string {
    return [
      'Sistema: dL (Differential Dynamic Logic, Platzer 2008/2010)',
      '  Programas híbridos:',
      '    x := e          asignación discreta',
      '    x := *          asignación no determinista',
      '    ?ψ              test',
      '    α ; β           secuencia',
      '    α ++ β          choice no determinista (∪)',
      '    α*              loop (acotado en la implementación)',
      "    {x' = f(x) & Q} evolución continua bajo dominio Q",
      '  Modalidades:',
      '    [α] φ           todo trace de α termina en φ',
      '    ⟨α⟩ φ           existe un trace de α que termina en φ',
      '  Subset decidible implementado:',
      "    - ODE x' = c (constante) → x(t) = x₀ + c·t",
      "    - ODE x' = a·x + b lineal desacoplada → cerrada exponencial",
      '    - Loops acotados a N iteraciones',
      '    - Derivada de Lie disponible para invariantes diferenciales',
      '  Aplicaciones: control, robótica, sistemas embebidos.',
    ].join('\n');
  }
}

/**
 * Adaptador: ejecuta `checkValid` sobre una DLFormula nativa y devuelve
 * un `RunResult` ST-compatible (con witness en `output`).
 */
export function runValidity(formula: DLFormula): RunResult {
  const res = dlCheckValid(formula);
  return {
    status: res.status === 'valid' ? 'valid' : 'invalid',
    output:
      res.status === 'valid'
        ? `${formulaToString(formula)} es VÁLIDA en dl-hybrid (${res.statesChecked} estados muestreados)`
        : `${formulaToString(formula)} NO es válida (contramodelo en estado ${describeState(res.witness)})`,
    diagnostics: [],
  };
}

/** Versión satisfacibilidad. */
export function runSatisfiability(formula: DLFormula): RunResult {
  const res = dlCheckSat(formula);
  return {
    status: res.status === 'satisfiable' ? 'satisfiable' : 'unsatisfiable',
    output:
      res.status === 'satisfiable'
        ? `${formulaToString(formula)} es SATISFACIBLE (${res.statesChecked} estados muestreados, testigo: ${describeState(res.witness)})`
        : `${formulaToString(formula)} es INSATISFACIBLE en la malla muestreada (${res.statesChecked} estados)`,
    diagnostics: [],
  };
}

function describeState(s: { entries(): IterableIterator<[string, number]> } | undefined): string {
  if (!s) return '∅';
  const pairs: string[] = [];
  for (const [k, v] of s.entries()) pairs.push(`${k}=${v}`);
  return `{${pairs.join(', ')}}`;
}
