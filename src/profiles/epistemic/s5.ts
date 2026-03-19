// ============================================================
// ST Epistemic S5 — S5 sobre BaseTableauProfile
// ============================================================
// K(φ) = [](φ) — conocimiento
// B(φ) = <>(φ) — creencia
// S5 = K + T + 4 + B (relación de accesibilidad universal)
// ============================================================

import { Formula } from '../../types';
import { formulaToString } from '../classical/propositional';
import { BaseTableauProfile } from '../shared/base-profile';
import { FRAME_S5 } from '../shared/tableau-engine';

export class EpistemicS5 extends BaseTableauProfile {
  name = 'epistemic.s5';
  description = 'Lógica epistémica S5 — conocimiento (K/[]), creencia (B/<>), introspección';
  frameRules = FRAME_S5;

  formatFormula(f: Formula): string {
    return epistemicToString(f);
  }

  explainSystem(): string {
    return [
      'Operadores epistémicos:',
      '  K(φ) = [](φ) — "el agente sabe que φ"',
      '  B(φ) = <>(φ) — "el agente cree que φ"',
      '',
      'Sistema: S5 (K + T + 4 + B)',
      '  Axioma K:  K(φ→ψ) → (Kφ→Kψ)  — distribución',
      '  Axioma T:  Kφ → φ             — veridicidad (lo sabido es verdad)',
      '  Axioma 4:  Kφ → KKφ           — introspección positiva',
      '  Axioma 5:  ¬Kφ → K¬Kφ         — introspección negativa',
      '  Axioma B:  φ → K¬K¬φ          — simetría',
      '',
      '  Relación de accesibilidad: universal (equivalencia)',
      '  Propiedades del frame: {reflexividad, simetría, transitividad}',
      '  Significado: lo que sabes, sabes que lo sabes; lo que no sabes, sabes que no lo sabes',
      '',
      '  Simplificación de modalidades iteradas (colapsamiento S5):',
      '    KKφ ≡ Kφ     (por axioma 4)',
      '    BBφ ≡ Bφ     (colapsamiento dual)',
      '    KBφ ≡ Bφ     (por axioma 5+B)',
      '    BKφ ≡ Kφ     (colapsamiento dual)',
      '',
      '  ⚠ Paradojas conocidas:',
      '    • Omnisciencia lógica: K(P→Q) ∧ K(P) → K(Q) — siempre válido (limitación del modelo)',
      '    • Moore: P ∧ ¬K(P) — satisfacible pero no asertable',
    ].join('\n');
  }
}

function epistemicToString(f: Formula): string {
  switch (f.kind) {
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      return inner ? `K(${epistemicToString(inner)})` : 'K(?)';
    }
    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      return inner ? `B(${epistemicToString(inner)})` : 'B(?)';
    }
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return '¬?';
      if (inner.kind === 'atom') return `¬${epistemicToString(inner)}`;
      return `¬(${epistemicToString(inner)})`;
    }
    case 'and':
      return `(${epistemicToString((f.args || [])[0])} ∧ ${epistemicToString((f.args || [])[1])})`;
    case 'or':
      return `(${epistemicToString((f.args || [])[0])} ∨ ${epistemicToString((f.args || [])[1])})`;
    case 'implies':
      return `(${epistemicToString((f.args || [])[0])} → ${epistemicToString((f.args || [])[1])})`;
    case 'biconditional':
      return `(${epistemicToString((f.args || [])[0])} ↔ ${epistemicToString((f.args || [])[1])})`;
    default:
      return formulaToString(f);
  }
}
