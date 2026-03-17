// ============================================================
// ST Runtime — Formateo Unicode y LaTeX de fórmulas
// ============================================================
// Centraliza la conversión de Formula AST a notación Unicode
// (¬, ∧, ∨, →, ↔, □, ◇, ∀, ∃) y LaTeX (\neg, \land, etc.)
// ============================================================

import { Formula } from '../types';

/** Convierte una fórmula AST a notación Unicode legible (estilo libro de texto). */
export function formulaToUnicode(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name ?? '?';
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '¬?';
      return inner.kind === 'atom'
        ? `¬${formulaToUnicode(inner)}`
        : `¬(${formulaToUnicode(inner)})`;
    }
    case 'and':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ∧ ${formulaToUnicode(f.args[1])})`
        : '? ∧ ?';
    case 'or':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ∨ ${formulaToUnicode(f.args[1])})`
        : '? ∨ ?';
    case 'implies':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} → ${formulaToUnicode(f.args[1])})`
        : '? → ?';
    case 'biconditional':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToUnicode(f.args[0])} ↔ ${formulaToUnicode(f.args[1])})`
        : '? ↔ ?';
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
    default:
      return '?';
  }
}

/** Convierte una fórmula AST a notación LaTeX. */
export function formulaToLaTeX(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name ?? '?';
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '\\neg ?';
      return inner.kind === 'atom'
        ? `\\neg ${formulaToLaTeX(inner)}`
        : `\\neg (${formulaToLaTeX(inner)})`;
    }
    case 'and':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\land ${formulaToLaTeX(f.args[1])})`
        : '? \\land ?';
    case 'or':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToLaTeX(f.args[0])} \\lor ${formulaToLaTeX(f.args[1])})`
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
    default:
      return '?';
  }
}
