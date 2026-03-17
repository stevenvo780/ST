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
import { FRAME_S4 } from '../shared/tableau-engine';

export class TemporalLTL extends BaseTableauProfile {
  name = 'temporal.ltl';
  description = 'Lógica temporal lineal (LTL) — G/F/X/U sobre modelos de Kripke';
  frameRules = FRAME_S4;

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
