// ============================================================
// ST Runtime — Formateo Unicode y LaTeX de fórmulas
// ============================================================
// Centraliza la conversión de Formula AST a notación Unicode
// (¬, ∧, ∨, →, ↔, □, ◇, ∀, ∃) y LaTeX (\neg, \land, etc.)
// ============================================================

import { Formula } from '../types';

/**
 * Aplana recursivamente nodos binarios del mismo kind asociativo
 * para representarlos como operación n-aria plana.
 * Ej: or(or(P,Q), R) → [P, Q, R]
 */
function collectAssociativeArgs(f: Formula, kind: 'and' | 'or' | 'xor'): Formula[] {
  if (f.kind !== kind || !f.args?.length) return [f];
  const items: Formula[] = [];
  for (const arg of f.args) {
    if (!arg) continue;
    items.push(...collectAssociativeArgs(arg, kind));
  }
  return items;
}

/** Convierte una fórmula AST a notación Unicode legible (estilo libro de texto). */
export function formulaToUnicode(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name ?? '?';
    case 'list':
      return `[${(f.args ?? []).map(formulaToUnicode).join(', ')}]`;
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '¬?';
      return inner.kind === 'atom'
        ? `¬${formulaToUnicode(inner)}`
        : `¬(${formulaToUnicode(inner)})`;
    }
    case 'and':
      return f.args?.[0] && f.args?.[1]
        ? `(${collectAssociativeArgs(f, 'and').map(formulaToUnicode).join(' ∧ ')})`
        : '? ∧ ?';
    case 'or':
      return f.args?.[0] && f.args?.[1]
        ? `(${collectAssociativeArgs(f, 'or').map(formulaToUnicode).join(' ∨ ')})`
        : '? ∨ ?';
    case 'implies':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} → ${formulaToUnicode(f.args[1])})`
        : '? → ?';
    case 'biconditional':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ↔ ${formulaToUnicode(f.args[1])})`
        : '? ↔ ?';
    case 'nand':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ↑ ${formulaToUnicode(f.args[1])})`
        : '? ↑ ?';
    case 'nor':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ↓ ${formulaToUnicode(f.args[1])})`
        : '? ↓ ?';
    case 'xor':
      return f.args?.[0] && f.args?.[1]
        ? `(${collectAssociativeArgs(f, 'xor').map(formulaToUnicode).join(' ⊕ ')})`
        : '? ⊕ ?';
    case 'modal_necessity':
      return f.args?.[0] ? `□(${formulaToUnicode(f.args[0])})` : '□?';
    case 'modal_possibility':
      return f.args?.[0] ? `◇(${formulaToUnicode(f.args[0])})` : '◇?';
    case 'forall':
      return f.args?.[0]
        ? `∀${f.variable ?? '?'}(${formulaToUnicode(f.args[0])})`
        : `∀${f.variable ?? '?'}(?)`;
    case 'exists':
      return f.args?.[0]
        ? `∃${f.variable ?? '?'}(${formulaToUnicode(f.args[0])})`
        : `∃${f.variable ?? '?'}(?)`;
    case 'predicate':
      return `${f.name ?? '?'}(${(f.params ?? []).join(', ')})`;
    case 'equals':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} = ${formulaToUnicode(f.args[1])})`
        : '? = ?';
    case 'temporal_next':
      return f.args?.[0] ? `X(${formulaToUnicode(f.args[0])})` : 'X?';
    case 'temporal_until':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} U ${formulaToUnicode(f.args[1])})`
        : '? U ?';
    // Arithmetic
    case 'number':
      return f.value !== undefined ? String(f.value) : '?';
    case 'add':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} + ${formulaToUnicode(f.args[1])})`
        : '? + ?';
    case 'subtract':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} - ${formulaToUnicode(f.args[1])})`
        : '? - ?';
    case 'multiply':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} × ${formulaToUnicode(f.args[1])})`
        : '? × ?';
    case 'divide':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ÷ ${formulaToUnicode(f.args[1])})`
        : '? ÷ ?';
    case 'modulo':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} % ${formulaToUnicode(f.args[1])})`
        : '? % ?';
    case 'less':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} < ${formulaToUnicode(f.args[1])})`
        : '? < ?';
    case 'greater':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} > ${formulaToUnicode(f.args[1])})`
        : '? > ?';
    case 'less_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ≤ ${formulaToUnicode(f.args[1])})`
        : '? ≤ ?';
    case 'greater_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} \u2265 ${formulaToUnicode(f.args[1])})`
        : '? \u2265 ?';
    case 'fn_call':
      return `${f.name ?? '?'}(${(f.args ?? []).map(formulaToUnicode).join(', ')})`;
    default:
      return '?';
  }
}

/** Convierte una fórmula AST a notación LaTeX. */
export function formulaToLaTeX(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name ?? '?';
    case 'list':
      return `\\left[${(f.args ?? []).map(formulaToLaTeX).join(', ')}\\right]`;
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '\\neg ?';
      return inner.kind === 'atom'
        ? `\\neg ${formulaToLaTeX(inner)}`
        : `\\neg (${formulaToLaTeX(inner)})`;
    }
    case 'and':
      return f.args?.[0] && f.args?.[1]
        ? `(${collectAssociativeArgs(f, 'and').map(formulaToLaTeX).join(' \\land ')})`
        : '? \\land ?';
    case 'or':
      return f.args?.[0] && f.args?.[1]
        ? `(${collectAssociativeArgs(f, 'or').map(formulaToLaTeX).join(' \\lor ')})`
        : '? \\lor ?';
    case 'implies':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\to ${formulaToLaTeX(f.args[1])})`
        : '? \\to ?';
    case 'biconditional':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\leftrightarrow ${formulaToLaTeX(f.args[1])})`
        : '? \\leftrightarrow ?';
    case 'modal_necessity':
      return f.args?.[0] ? `\\Box ${formulaToLaTeX(f.args[0])}` : '\\Box ?';
    case 'modal_possibility':
      return f.args?.[0] ? `\\Diamond ${formulaToLaTeX(f.args[0])}` : '\\Diamond ?';
    case 'forall':
      return f.args?.[0]
        ? `\\forall ${f.variable ?? '?'}\\,(${formulaToLaTeX(f.args[0])})`
        : `\\forall ${f.variable ?? '?'}\\,?`;
    case 'exists':
      return f.args?.[0]
        ? `\\exists ${f.variable ?? '?'}\\,(${formulaToLaTeX(f.args[0])})`
        : `\\exists ${f.variable ?? '?'}\\,?`;
    case 'predicate':
      return `${f.name ?? '?'}(${(f.params ?? []).join(', ')})`;
    case 'equals':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} = ${formulaToLaTeX(f.args[1])})`
        : '? = ?';
    case 'temporal_next':
      return f.args?.[0] ? `\\mathsf{X}\\,(${formulaToLaTeX(f.args[0])})` : '\\mathsf{X}\\,?';
    case 'temporal_until':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\mathbin{\\mathsf{U}} ${formulaToLaTeX(f.args[1])})`
        : '? \\mathbin{\\mathsf{U}} ?';
    // Arithmetic
    case 'number':
      return f.value !== undefined ? String(f.value) : '?';
    case 'add':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} + ${formulaToLaTeX(f.args[1])})`
        : '? + ?';
    case 'subtract':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} - ${formulaToLaTeX(f.args[1])})`
        : '? - ?';
    case 'multiply':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\times ${formulaToLaTeX(f.args[1])})`
        : '? \\times ?';
    case 'divide':
      return f.args?.[0] && f.args?.[1]
        ? `\\frac{${formulaToLaTeX(f.args[0])}}{${formulaToLaTeX(f.args[1])}}`
        : '\\frac{?}{?}';
    case 'modulo':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\bmod ${formulaToLaTeX(f.args[1])})`
        : '? \\bmod ?';
    case 'less':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} < ${formulaToLaTeX(f.args[1])})`
        : '? < ?';
    case 'greater':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} > ${formulaToLaTeX(f.args[1])})`
        : '? > ?';
    case 'less_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\leq ${formulaToLaTeX(f.args[1])})`
        : '? \\leq ?';
    default:
      return '?';
  }
}

/**
 * Convierte una prueba paso a paso a formato LaTeX usando `bussproofs`.
 * Asume entorno `prooftree`.
 */
export function proofToLaTeX(proof: import('../types').Proof): string {
  if (!proof.steps || proof.steps.length === 0) return '';

  const lines: string[] = ['\\begin{prooftree}'];

  // Como `bussproofs` se construye de abajo arriba de forma invertida o en árbol,
  // una secuencia lineal real de Gentzen es compleja de parsear.
  // Para una prueba de estilo Fitch o lineal simple, devolveremos un entorno listado o
  // la simulación básica. Asumiremos árbol natural deduction donde cada paso toma las premisas anteriores.
  // Dado que ST produce pruebas lineales (lista de pasos con justificación y apuntadores de premisas),
  // exportaremos como texto estructurado que el usuario puede adaptar, o si tiene un solo paso final,
  // intentamos una deducción natural simple. Aquí hacemos una deducción en estilo lista numerada en LaTeX
  // ya que la prueba ST no siempre es un árbol de deducción natural estricto.

  // Alternativa: exportar array de \AxiomC etc.
  // Por simplicidad para este requerimiento genérico de "+ exportación de pruebas completas",
  // lo hacemos como pide el plan (simulación del último paso o iteración):

  // Para pruebas muy largas, es mejor usar tablas de Fitch, pero el spec decía:
  // \begin{prooftree}
  //   \AxiomC{$P \to Q$}
  //   \AxiomC{$P$}
  //   \RightLabel{\scriptsize MP}
  //   \BinaryInfC{$Q$}
  // \end{prooftree}

  // Recreador rudimentario invertido:
  for (const step of proof.steps) {
    if (step.premises.length === 0) {
      lines.push(`  \\AxiomC{$${formulaToLaTeX(step.formula)}$}`);
    } else if (step.premises.length === 1) {
      lines.push(`  \\RightLabel{\\scriptsize ${step.justification}}`);
      lines.push(`  \\UnaryInfC{$${formulaToLaTeX(step.formula)}$}`);
    } else if (step.premises.length === 2) {
      lines.push(`  \\RightLabel{\\scriptsize ${step.justification}}`);
      lines.push(`  \\BinaryInfC{$${formulaToLaTeX(step.formula)}$}`);
    } else if (step.premises.length === 3) {
      lines.push(`  \\RightLabel{\\scriptsize ${step.justification}}`);
      lines.push(`  \\TrinaryInfC{$${formulaToLaTeX(step.formula)}$}`);
    } else {
      lines.push(`  \\RightLabel{\\scriptsize ${step.justification}}`);
      lines.push(
        `  \\UnaryInfC{$${formulaToLaTeX(step.formula)}$} % ${step.premises.length} premises`,
      );
    }
  }

  lines.push('\\end{prooftree}');
  return lines.join('\n');
}
