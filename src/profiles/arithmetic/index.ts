// ============================================================
// ST Arithmetic Profile — Evaluación aritmética
// ============================================================
// Perfil opcional que permite operaciones aritméticas (+, -, *, /, %)
// y comparaciones (<, >, <=, >=) dentro de fórmulas ST.
//
// Uso: `logic arithmetic`
//
// Sin este perfil cargado, el parser reconoce la sintaxis aritmética
// pero el intérprete no puede evaluar las expresiones numéricas.
// ============================================================

import {
  Formula,
  Diagnostic,
  RunResult,
  Theory,
  LogicProfile,
} from '../../types';

// --- Tipos aritméticos ---

const ARITHMETIC_KINDS = new Set([
  'number', 'add', 'subtract', 'multiply', 'divide', 'modulo',
  'less', 'greater', 'less_eq', 'greater_eq',
]);

const COMPARISON_KINDS = new Set([
  'less', 'greater', 'less_eq', 'greater_eq',
]);

// --- Evaluación numérica ---

/**
 * Evalúa recursivamente una fórmula aritmética a un valor numérico.
 * Los átomos se interpretan como 0 (o se buscan en la teoría).
 * Las comparaciones retornan 1 (true) o 0 (false).
 */
export function evalNumeric(f: Formula, vars?: Map<string, number>): number {
  switch (f.kind) {
    case 'number':
      return f.value ?? 0;
    case 'atom': {
      // Intentar resolver variable como número
      if (f.name && vars?.has(f.name)) {
        return vars.get(f.name)!;
      }
      // Átomo sin valor numérico conocido
      return NaN;
    }
    case 'add': {
      const l = evalNumeric(f.args![0], vars);
      const r = evalNumeric(f.args![1], vars);
      return l + r;
    }
    case 'subtract': {
      const l = evalNumeric(f.args![0], vars);
      const r = evalNumeric(f.args![1], vars);
      return l - r;
    }
    case 'multiply': {
      const l = evalNumeric(f.args![0], vars);
      const r = evalNumeric(f.args![1], vars);
      return l * r;
    }
    case 'divide': {
      const l = evalNumeric(f.args![0], vars);
      const r = evalNumeric(f.args![1], vars);
      if (r === 0) return NaN;
      return l / r;
    }
    case 'modulo': {
      const l = evalNumeric(f.args![0], vars);
      const r = evalNumeric(f.args![1], vars);
      if (r === 0) return NaN;
      return l % r;
    }
    // Comparaciones retornan 1 (true) o 0 (false)
    case 'less':
      return evalNumeric(f.args![0], vars) < evalNumeric(f.args![1], vars) ? 1 : 0;
    case 'greater':
      return evalNumeric(f.args![0], vars) > evalNumeric(f.args![1], vars) ? 1 : 0;
    case 'less_eq':
      return evalNumeric(f.args![0], vars) <= evalNumeric(f.args![1], vars) ? 1 : 0;
    case 'greater_eq':
      return evalNumeric(f.args![0], vars) >= evalNumeric(f.args![1], vars) ? 1 : 0;
    default:
      return NaN;
  }
}

/**
 * Evalúa una comparación aritmética como valor booleano.
 * Para fórmulas no-comparativas, evalúa el resultado numérico (truthy = !== 0).
 */
function evalComparison(f: Formula, vars?: Map<string, number>): boolean {
  if (COMPARISON_KINDS.has(f.kind)) {
    return evalNumeric(f, vars) === 1;
  }
  // Para expresiones no-comparativas, truthy si !== 0 y no NaN
  const val = evalNumeric(f, vars);
  return !isNaN(val) && val !== 0;
}

/** Recolecta todos los átomos de una fórmula */
function collectAtoms(f: Formula): Set<string> {
  const atoms = new Set<string>();
  function walk(node: Formula) {
    if (node.kind === 'atom' && node.name) atoms.add(node.name);
    if (node.args) for (const a of node.args) walk(a);
  }
  walk(f);
  return atoms;
}

/**
 * Verifica si una fórmula es puramente aritmética (no contiene conectivos lógicos).
 */
function isArithmeticFormula(f: Formula): boolean {
  if (ARITHMETIC_KINDS.has(f.kind) || f.kind === 'atom') return true;
  if (f.args) return f.args.every(isArithmeticFormula);
  return false;
}

// --- Perfil ---

export class ArithmeticProfile implements LogicProfile {
  name = 'arithmetic';
  description = 'Aritmética básica: +, -, *, /, %, comparaciones <, >, ≤, ≥';

  private result(status: RunResult['status'], output: string): RunResult {
    return {
      status,
      output,
      diagnostics: [],
    };
  }

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    // Verificar que no hay divisiones por cero literal
    function walk(f: Formula) {
      if (f.kind === 'divide' || f.kind === 'modulo') {
        const divisor = f.args?.[1];
        if (divisor?.kind === 'number' && divisor.value === 0) {
          diags.push({
            severity: 'warning',
            message: `División por cero detectada`,
            line: f.source?.line ?? 0,
            column: f.source?.column ?? 0,
          });
        }
      }
      if (f.args) for (const a of f.args) walk(a);
    }
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    // Para aritmética pura sin variables, evaluar directamente
    const atoms = collectAtoms(formula);
    if (atoms.size === 0) {
      const result = evalComparison(formula);
      return this.result(
        result ? 'valid' : 'invalid',
        result ? 'La expresión aritmética es verdadera' : 'La expresión aritmética es falsa',
      );
    }

    // Con variables: no podemos determinar validez universal fácilmente
    return this.result(
      'unknown',
      `La fórmula contiene variables (${[...atoms].join(', ')}). No se puede determinar validez universal sin dominio.`,
    );
  }

  checkSatisfiable(formula: Formula): RunResult {
    const atoms = collectAtoms(formula);
    if (atoms.size === 0) {
      const result = evalComparison(formula);
      return this.result(
        result ? 'satisfiable' : 'unsatisfiable',
        result
          ? 'La expresión aritmética es satisfacible (verdadera)'
          : 'La expresión aritmética no es satisfacible (falsa)',
      );
    }

    // Con variables: asumimos satisfacible (no hacemos búsqueda exhaustiva)
    return this.result('satisfiable', 'La fórmula contiene variables; asumida satisfacible.');
  }

  prove(goal: Formula, theory: Theory): RunResult {
    // Intentar evaluar con axiomas como asignaciones numéricas
    const vars = new Map<string, number>();
    theory.axioms.forEach((formula, name) => {
      if (formula.kind === 'number') {
        const numericValue = Number(formula.value);
        if (!Number.isNaN(numericValue)) {
          vars.set(name, numericValue);
        }
      }
    });

    const atoms = collectAtoms(goal);
    const unresolvedAtoms = [...atoms].filter((a) => !vars.has(a));

    if (unresolvedAtoms.length === 0) {
      const result = evalComparison(goal, vars);
      return this.result(
        result ? 'provable' : 'refutable',
        result
          ? 'Demostrado: la expresión aritmética es verdadera con los axiomas dados'
          : 'Refutado: la expresión aritmética es falsa con los axiomas dados',
      );
    }

    return this.result(
      'unknown',
      `No se puede probar: variables sin valor numérico: ${unresolvedAtoms.join(', ')}`,
    );
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    return this.prove(goal, theory);
  }

  countermodel(formula: Formula): RunResult {
    const atoms = collectAtoms(formula);
    if (atoms.size === 0) {
      const result = evalComparison(formula);
      if (!result) {
        return this.result(
          'refutable',
          'Contramodelo trivial: la expresión es falsa sin variables',
        );
      }
      return this.result(
        'valid',
        'No hay contramodelo: la expresión aritmética es siempre verdadera',
      );
    }

    return this.result(
      'unknown',
      'Búsqueda de contramodelo no implementada para fórmulas con variables',
    );
  }

  explain(formula: Formula): RunResult {
    const atoms = collectAtoms(formula);

    if (atoms.size === 0) {
      const val = evalNumeric(formula);
      if (COMPARISON_KINDS.has(formula.kind)) {
        const result = evalComparison(formula);
        return this.result(
          result ? 'valid' : 'invalid',
          `Comparación aritmética: resultado = ${result ? 'verdadero' : 'falso'}`,
        );
      }
      return this.result(
        'valid',
        `Expresión aritmética: resultado = ${isNaN(val) ? 'indefinido' : val}`,
      );
    }

    return this.result(
      'unknown',
      `Expresión aritmética con variables: ${[...atoms].join(', ')}. Valor depende de asignación.`,
    );
  }
}
