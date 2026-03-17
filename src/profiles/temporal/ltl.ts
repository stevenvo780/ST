// ============================================================
// ST Temporal LTL — Lógica Temporal Lineal
// ============================================================
// Operadores temporales mapeados a modales:
//   G(φ) = [](φ)  — "siempre" (Globally)
//   F(φ) = <>(φ)  — "eventualmente" (Finally)
//   Dualidad: F(φ) ≡ ¬G(¬φ),  G(φ) ≡ ¬F(¬φ)
//
// Frame: transitivo (S4 sin simetría) — el futuro es irreversible.
// No modelamos Next (X) ni Until (U) por limitación del parser,
// pero G/F cubren las propiedades de safety y liveness.
// ============================================================

import { Formula } from '../../types';
import { formulaToString } from '../classical/propositional';
import { BaseTableauProfile } from '../shared/base-profile';
import { FRAME_S4 } from '../shared/tableau-engine';

export class TemporalLTL extends BaseTableauProfile {
  name = 'temporal.ltl';
  description = 'Lógica temporal lineal (LTL) — siempre (G/[]), eventualmente (F/<>)';
  frameRules = FRAME_S4;

  formatFormula(f: Formula): string {
    return temporalToString(f);
  }

  explainSystem(): string {
    return [
      'Operadores temporales:',
      '  G(φ) = [](φ)  — "siempre será el caso que φ" (safety)',
      '  F(φ) = <>(φ)  — "eventualmente será el caso que φ" (liveness)',
      '',
      'Dualidades:',
      '  F(φ) ≡ ¬G(¬φ)   — eventualmente = no siempre-no',
      '  G(φ) ≡ ¬F(¬φ)   — siempre = no eventualmente-no',
      '',
      'Frame: preorden (reflexivo + transitivo)',
      '  El futuro es irreversible: si w ve v, v no necesariamente ve w.',
      '  Equivale al fragmento G/F de LTL sobre modelos de Kripke.',
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
