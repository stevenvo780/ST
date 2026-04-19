// ============================================================
// ST Temporal LTL — Lógica Temporal Lineal
// ============================================================
// Operadores temporales mapeados a modales:
//   G(φ) = [](φ)  — "siempre" (Globally)
//   F(φ) = <>(φ)  — "eventualmente" (Finally)
//   X(φ)          — "en el siguiente estado" (Next)
//   φ U ψ         — "φ vale hasta que ψ" (Until)
//   Dualidad: F(φ) ≡ ¬G(¬φ),  G(φ) ≡ ¬F(¬φ)
//
// Frame: transitivo (S4 sin simetría) — el futuro es irreversible.
// X y U se soportan como operadores nativos del parser.
// ============================================================

import { Formula } from '../../types';
import { formulaToString } from '../classical/propositional';
import { BaseTableauProfile } from '../shared/base-profile';
import { FRAME_S4, type FrameRules } from '../shared/tableau-engine';

const FRAME_LTL: FrameRules = {
  ...FRAME_S4,
  deterministicNext: true,
};

export class TemporalLTL extends BaseTableauProfile {
  name = 'temporal.ltl';
  description = 'Lógica temporal lineal (LTL) — G/F/X/U sobre modelos de Kripke';
  frameRules = FRAME_LTL;

  formatFormula(f: Formula): string {
    return temporalToString(f);
  }

  explainSystem(): string {
    return [
      'Operadores temporales:',
      '  G(φ) = [](φ)  — "siempre será el caso que φ" (safety)',
      '  F(φ) = <>(φ)  — "eventualmente será el caso que φ" (liveness)',
      '  X(φ)          — "en el siguiente estado" (next)',
      '  φ U ψ         — "φ vale hasta que ψ se cumpla" (until)',
      '',
      'Dualidades:',
      '  F(φ) ≡ ¬G(¬φ)   — eventualmente = no siempre-no',
      '  G(φ) ≡ ¬F(¬φ)   — siempre = no eventualmente-no',
      '  F(φ) ≡ ⊤ U φ    — eventualmente = true-until-φ',
      '',
      'Frame: preorden (reflexivo + transitivo)',
      '  El futuro es irreversible: si w ve v, v no necesariamente ve w.',
      '  Equivale al marco de Kripke S4 para G/F.',
    ].join('\n');
  }

  explain(formula: Formula): import('../../types').RunResult {
    const result = super.explain(formula);
    const pattern = classifyTemporalPattern(formula);
    if (pattern) {
      const patternStr = `\nPatrón temporal: ${pattern.name}\n  Significado: ${pattern.meaning}\n  Categoría: ${pattern.category}`;
      result.output = (result.output || '') + patternStr;
      result.educationalNote =
        (result.educationalNote || '') +
        `\nEsta fórmula corresponde al patrón temporal "${pattern.name}" (${pattern.category}).`;
    }
    return result;
  }
}

interface TemporalPattern {
  name: string;
  meaning: string;
  category: string;
}

function classifyTemporalPattern(f: Formula): TemporalPattern | null {
  // G(¬P) — Safety: "P nunca ocurre"
  if (f.kind === 'modal_necessity' && f.args?.[0]?.kind === 'not') {
    return {
      name: 'Safety (Seguridad)',
      meaning: '"Lo malo nunca ocurre"',
      category: 'Propiedad de Safety',
    };
  }
  // F(P) — Liveness: "P eventualmente ocurre"
  if (f.kind === 'modal_possibility' && f.args?.[0]?.kind === 'atom') {
    return {
      name: 'Liveness (Vivacidad)',
      meaning: '"Lo bueno eventualmente ocurre"',
      category: 'Propiedad de Liveness',
    };
  }
  // G(P → F(Q)) — Response: "Cada P es seguido por Q"
  if (
    f.kind === 'modal_necessity' &&
    f.args?.[0]?.kind === 'implies' &&
    f.args[0].args?.[1]?.kind === 'modal_possibility'
  ) {
    return {
      name: 'Response (Respuesta)',
      meaning: '"Cada solicitud eventualmente recibe respuesta"',
      category: 'Propiedad de Liveness',
    };
  }
  // F(G(P)) — Persistence: "P eventualmente se vuelve permanente"
  if (f.kind === 'modal_possibility' && f.args?.[0]?.kind === 'modal_necessity') {
    return {
      name: 'Persistence (Persistencia)',
      meaning: '"P eventualmente se vuelve permanente"',
      category: 'Propiedad de Persistencia',
    };
  }
  // G(F(P)) — Recurrence: "P ocurre infinitamente a menudo"
  if (f.kind === 'modal_necessity' && f.args?.[0]?.kind === 'modal_possibility') {
    return {
      name: 'Recurrence (Recurrencia)',
      meaning: '"P ocurre infinitamente a menudo"',
      category: 'Propiedad de Fairness',
    };
  }
  // ¬P U Q — Precedence: "Q llega antes que P"
  if (f.kind === 'temporal_until' && f.args?.[0]?.kind === 'not') {
    return {
      name: 'Precedence (Precedencia)',
      meaning: '"Q llega antes que P"',
      category: 'Propiedad de Order',
    };
  }
  return null;
}

function temporalToString(f: Formula): string {
  switch (f.kind) {
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      return inner ? `G(${temporalToString(inner)})` : 'G(?)';
    }
    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      return inner ? `F(${temporalToString(inner)})` : 'F(?)';
    }
    case 'temporal_next': {
      const inner = (f.args || [])[0];
      return inner ? `X(${temporalToString(inner)})` : 'X(?)';
    }
    case 'temporal_until':
      return `(${temporalToString((f.args || [])[0])} U ${temporalToString((f.args || [])[1])})`;
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return '¬?';
      if (inner.kind === 'atom') return `¬${temporalToString(inner)}`;
      return `¬(${temporalToString(inner)})`;
    }
    case 'and':
      return `(${temporalToString((f.args || [])[0])} ∧ ${temporalToString((f.args || [])[1])})`;
    case 'or':
      return `(${temporalToString((f.args || [])[0])} ∨ ${temporalToString((f.args || [])[1])})`;
    case 'implies':
      return `(${temporalToString((f.args || [])[0])} → ${temporalToString((f.args || [])[1])})`;
    case 'biconditional':
      return `(${temporalToString((f.args || [])[0])} ↔ ${temporalToString((f.args || [])[1])})`;
    default:
      return formulaToString(f);
  }
}
