// ============================================================
// ST Modal K — Thin wrapper sobre BaseTableauProfile
// ============================================================

import { Formula } from '../../types';
import { formulaToString } from '../classical/propositional';
import { BaseTableauProfile } from '../shared/base-profile';
import { FRAME_K } from '../shared/tableau-engine';

export class ModalK extends BaseTableauProfile {
  name = 'modal.k';
  description = 'Lógica modal K — sistema modal mínimo (Kripke)';
  frameRules = FRAME_K;

  formatFormula(f: Formula): string {
    return modalToString(f);
  }

  explainSystem(): string {
    return [
      'Sistema: K (Kripke minimal)',
      '  Axioma K:  □(φ→ψ) → (□φ→□ψ) — distribución',
      '  Regla N:   si ⊢φ entonces ⊢□φ — necessitación',
      '',
      '  Sin restricciones sobre la relación de accesibilidad.',
      '  □φ = [](φ)  — "es necesario que φ"',
      '  ◇φ = <>(φ)  — "es posible que φ"',
    ].join('\n');
  }
}

function modalToString(f: Formula): string {
  switch (f.kind) {
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      return inner ? `□(${modalToString(inner)})` : '□(?)';
    }
    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      return inner ? `◇(${modalToString(inner)})` : '◇(?)';
    }
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return '¬?';
      if (inner.kind === 'atom') return `¬${modalToString(inner)}`;
      return `¬(${modalToString(inner)})`;
    }
    case 'and':
      return `(${modalToString((f.args || [])[0])} ∧ ${modalToString((f.args || [])[1])})`;
    case 'or':
      return `(${modalToString((f.args || [])[0])} ∨ ${modalToString((f.args || [])[1])})`;
    case 'implies':
      return `(${modalToString((f.args || [])[0])} → ${modalToString((f.args || [])[1])})`;
    case 'biconditional':
      return `(${modalToString((f.args || [])[0])} ↔ ${modalToString((f.args || [])[1])})`;
    default:
      return formulaToString(f);
  }
}
