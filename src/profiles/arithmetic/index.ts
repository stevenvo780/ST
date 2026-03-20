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

import { Formula, Diagnostic, RunResult, Theory, LogicProfile } from '../../types';
import { collectAtoms } from '../classical/propositional';

// --- Tipos aritméticos ---

const COMPARISON_KINDS = new Set(['less', 'greater', 'less_eq', 'greater_eq']);

// --- Evaluación numérica ---

export function evalNumeric(f: Formula, vars?: Map<string, number>, trace?: string[]): number {
  switch (f.kind) {
    case 'number':
      return f.value ?? 0;
    case 'atom': {
      if (f.name && vars?.has(f.name)) {
        return vars.get(f.name) as number;
      }
      return NaN;
    }
    case 'add': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l + r;
      if (trace) trace.push(`  ${l} + ${r} = ${res} [suma]`);
      return res;
    }
    case 'subtract': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l - r;
      if (trace) trace.push(`  ${l} - ${r} = ${res} [resta]`);
      return res;
    }
    case 'multiply': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l * r;
      if (trace) trace.push(`  ${l} * ${r} = ${res} [multiplicación]`);
      return res;
    }
    case 'divide': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      if (r === 0) return NaN;
      const res = l / r;
      if (trace) trace.push(`  ${l} / ${r} = ${res} [división]`);
      return res;
    }
    case 'modulo': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      if (r === 0) return NaN;
      const res = l % r;
      if (trace) trace.push(`  ${l} % ${r} = ${res} [módulo]`);
      return res;
    }
    case 'less': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l < r;
      if (trace) trace.push(`  ${l} < ${r} = ${res ? 'verdadero' : 'falso'} [comparación]`);
      return res ? 1 : 0;
    }
    case 'greater': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l > r;
      if (trace) trace.push(`  ${l} > ${r} = ${res ? 'verdadero' : 'falso'} [comparación]`);
      return res ? 1 : 0;
    }
    case 'less_eq': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l <= r;
      if (trace) trace.push(`  ${l} <= ${r} = ${res ? 'verdadero' : 'falso'} [comparación]`);
      return res ? 1 : 0;
    }
    case 'greater_eq': {
      const l = evalNumeric((f.args as Formula[])[0], vars, trace);
      const r = evalNumeric((f.args as Formula[])[1], vars, trace);
      const res = l >= r;
      if (trace) trace.push(`  ${l} >= ${r} = ${res ? 'verdadero' : 'falso'} [comparación]`);
      return res ? 1 : 0;
    }
    default:
      return NaN;
  }
}

function evalComparison(f: Formula, vars?: Map<string, number>, trace?: string[]): boolean {
  if (COMPARISON_KINDS.has(f.kind)) {
    return evalNumeric(f, vars, trace) === 1;
  }
  const val = evalNumeric(f, vars, trace);
  return !isNaN(val) && val !== 0;
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
    const atoms = collectAtoms(formula);
    if (atoms.size === 0) {
      const trace: string[] = [];
      const result = evalComparison(formula, undefined, trace);
      let output = `Evaluación paso a paso:\n${trace.join('\n')}\n`;
      output += `  → Resultado: ${result ? '✓ verdadero' : '✗ falso'}`;

      return this.result(result ? 'valid' : 'invalid', output);
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

    let output = '';
    if (atoms.size === 0) {
      const trace: string[] = [];
      const val = evalNumeric(formula, undefined, trace);
      output += `Evaluación paso a paso:\n${trace.join('\n')}\n`;
      if (COMPARISON_KINDS.has(formula.kind)) {
        const result = evalComparison(formula);
        output += `  → Resultado: ${result ? '✓ verdadero' : '✗ falso'}\n\n`;
      } else {
        output += `  → Resultado: ${isNaN(val) ? 'indefinido' : val}\n\n`;
      }
    } else {
      output += `Expresión aritmética con variables: ${[...atoms].join(', ')}.\n\n`;
    }

    // Simplification
    const simpTrace: string[] = [];
    simplifyArithmetic(formula, simpTrace);
    if (simpTrace.length > 0) {
      output += `Simplificación detectada:\n${simpTrace.join('\n')}\n\n`;
    }

    // Properties
    if (formula.kind === 'add') {
      output += `Propiedades de la suma (+):\n`;
      output += `  ✓ Conmutativa: a + b = b + a\n`;
      output += `  ✓ Asociativa: (a + b) + c = a + (b + c)\n`;
      output += `  ✓ Identidad: a + 0 = a\n`;
      output += `  ✓ Inverso: a + (−a) = 0\n`;
    } else if (formula.kind === 'multiply') {
      output += `Propiedades de la multiplicación (*):\n`;
      output += `  ✓ Conmutativa: a * b = b * a\n`;
      output += `  ✓ Asociativa: (a * b) * c = a * (b * c)\n`;
      output += `  ✓ Identidad: a * 1 = a\n`;
      output += `  ✓ Absorción: a * 0 = 0\n`;
    }

    return this.result('unknown', output.trim() || `Expresión aritmética: ${formula.kind}`);
  }
}

function simplifyArithmetic(f: Formula, trace: string[]): Formula {
  if (f.kind === 'add' && f.args?.length === 2) {
    const l = simplifyArithmetic(f.args[0], trace);
    const r = simplifyArithmetic(f.args[1], trace);
    if (l.kind === 'number' && l.value === 0) {
      trace.push(`  0 + x = x  [identidad aditiva]`);
      return r;
    }
    if (r.kind === 'number' && r.value === 0) {
      trace.push(`  x + 0 = x  [identidad aditiva]`);
      return l;
    }
    return { ...f, args: [l, r] };
  }
  if (f.kind === 'multiply' && f.args?.length === 2) {
    const l = simplifyArithmetic(f.args[0], trace);
    const r = simplifyArithmetic(f.args[1], trace);
    if ((l.kind === 'number' && l.value === 0) || (r.kind === 'number' && r.value === 0)) {
      trace.push(`  x * 0 = 0  [absorción multiplicativa]`);
      return { kind: 'number', value: 0 };
    }
    if (l.kind === 'number' && l.value === 1) {
      trace.push(`  1 * x = x  [identidad multiplicativa]`);
      return r;
    }
    if (r.kind === 'number' && r.value === 1) {
      trace.push(`  x * 1 = x  [identidad multiplicativa]`);
      return l;
    }
    return { ...f, args: [l, r] };
  }
  if (f.args) {
    f = { ...f, args: f.args.map((a) => simplifyArithmetic(a, trace)) };
  }
  return f;
}
