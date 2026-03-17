// ============================================================
// ST Deontic Standard — KD sobre BaseTableauProfile
// ============================================================
// O(φ) = [](φ)  — obligación
// P(φ) = <>(φ)  — permisión
// F(φ) = [](!φ) — prohibición
// Axioma D: O(φ) → P(φ) — serialidad
// ============================================================

import { Formula } from '../../types';
import { formulaToString } from '../classical/propositional';
import { BaseTableauProfile } from '../shared/base-profile';
import { FRAME_KD } from '../shared/tableau-engine';

export class DeonticStandard extends BaseTableauProfile {
  name = 'deontic.standard';
  description = 'Lógica deóntica estándar (KD) — obligación (O/[]), permisión (P/<>), prohibición (F/[]!)';
  frameRules = FRAME_KD;

  formatFormula(f: Formula): string {
    return deonticToString(f);
  }

  explainSystem(): string {
    return [
      'Operadores deónticos:',
      '  O(φ) = [](φ)  — "Es obligatorio que φ"',
      '  P(φ) = <>(φ)  — "Está permitido que φ"',
      '  F(φ) = [](!φ) — "Está prohibido que φ"',
      '',
      'Sistema: KD (K + axioma D)',
      '  Axioma K: O(φ→ψ) → (O(φ)→O(ψ))',
      '  Axioma D: O(φ) → P(φ) — "lo obligatorio es permisible"',
      '  Serialidad: todo mundo tiene al menos un mundo accesible',
    ].join('\n');
  }
}

function deonticToString(f: Formula): string {
  switch (f.kind) {
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      if (!inner) return 'O(?)';
      if (inner.kind === 'not' && inner.args?.[0]) {
        return `F(${deonticToString(inner.args[0])})`;
      }
      return `O(${deonticToString(inner)})`;
    }
    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      return inner ? `P(${deonticToString(inner)})` : 'P(?)';
    }
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return '¬?';
      if (inner.kind === 'atom') return `¬${deonticToString(inner)}`;
      return `¬(${deonticToString(inner)})`;
    }
    case 'and':
      return `(${deonticToString((f.args || [])[0])} ∧ ${deonticToString((f.args || [])[1])})`;
    case 'or':
      return `(${deonticToString((f.args || [])[0])} ∨ ${deonticToString((f.args || [])[1])})`;
    case 'implies':
      return `(${deonticToString((f.args || [])[0])} → ${deonticToString((f.args || [])[1])})`;
    case 'biconditional':
      return `(${deonticToString((f.args || [])[0])} ↔ ${deonticToString((f.args || [])[1])})`;
    default:
      return formulaToString(f);
  }
}
