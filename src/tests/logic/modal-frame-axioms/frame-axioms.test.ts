// ============================================================
// Tests del tableau modal con axiomas de frame
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  atom,
  not,
  and,
  or,
  implies,
  box,
  diamond,
  isSatisfiable,
  isValid,
  tableauWithAxioms,
  systemAxioms,
  axiomFormula,
  ModalSystem,
  FrameAxiom,
} from '../../../logic/profiles/modal-frame-axioms';

const p = atom('p');
const q = atom('q');

// ------------------------------------------------------------
// Sistemas y composición
// ------------------------------------------------------------

describe('systemAxioms — composición de sistemas estándar', () => {
  it('K no tiene axiomas de frame', () => {
    expect(systemAxioms('K')).toEqual([]);
  });

  it('T = {T}', () => {
    expect(systemAxioms('T').sort()).toEqual(['T']);
  });

  it('S4 = {T, 4}', () => {
    expect(systemAxioms('S4').sort()).toEqual(['4', 'T']);
  });

  it('S5 = {T, 4, 5}', () => {
    expect(systemAxioms('S5').sort()).toEqual(['4', '5', 'T']);
  });

  it('B = {T, B}', () => {
    expect(systemAxioms('B').sort()).toEqual(['B', 'T']);
  });

  it('KD45 = {D, 4, 5}', () => {
    expect(systemAxioms('KD45').sort()).toEqual(['4', '5', 'D']);
  });
});

// ------------------------------------------------------------
// Cada axioma es válido en su sistema mínimo y refutable en K
// ------------------------------------------------------------

describe('axiomas individuales — válidos en su sistema, no en K', () => {
  const cases: Array<{ axiom: FrameAxiom; system: ModalSystem }> = [
    { axiom: 'T', system: 'T' },
    { axiom: '4', system: 'K4' },
    { axiom: '5', system: 'K5' },
    { axiom: 'B', system: 'B' },
    { axiom: 'D', system: 'D' },
  ];

  for (const { axiom, system } of cases) {
    it(`axioma ${axiom} válido en ${system}`, () => {
      expect(isValid(axiomFormula(axiom, p), system)).toBe(true);
    });

    it(`axioma ${axiom} NO válido en K`, () => {
      expect(isValid(axiomFormula(axiom, p), 'K')).toBe(false);
    });
  }
});

// ------------------------------------------------------------
// Axiomas característicos canónicos por sistema
// ------------------------------------------------------------

describe('S4 — reflexivo + transitivo', () => {
  it('□p → □□p es válido (axioma 4)', () => {
    expect(isValid(implies(box(p), box(box(p))), 'S4')).toBe(true);
  });

  it('□p → p es válido (axioma T)', () => {
    expect(isValid(implies(box(p), p), 'S4')).toBe(true);
  });

  it('◇◇p → ◇p es válido (densidad bajo trans)', () => {
    expect(isValid(implies(diamond(diamond(p)), diamond(p)), 'S4')).toBe(true);
  });

  it('◇p → □◇p NO es válido (axioma 5 no se cumple en S4)', () => {
    expect(isValid(implies(diamond(p), box(diamond(p))), 'S4')).toBe(false);
  });
});

describe('S5 — equivalencia', () => {
  it('◇p → □◇p es válido (axioma 5)', () => {
    expect(isValid(implies(diamond(p), box(diamond(p))), 'S5')).toBe(true);
  });

  it('p → □◇p es válido (axioma B)', () => {
    expect(isValid(implies(p, box(diamond(p))), 'S5')).toBe(true);
  });

  it('□p ↔ ¬◇¬p, formulado como □p → ¬◇¬p, válido', () => {
    expect(isValid(implies(box(p), not(diamond(not(p)))), 'S5')).toBe(true);
  });

  it('◇□p → p es válido (resultado clásico S5)', () => {
    expect(isValid(implies(diamond(box(p)), p), 'S5')).toBe(true);
  });

  it('◇□p → □p es válido en S5 pero no en S4', () => {
    expect(isValid(implies(diamond(box(p)), box(p)), 'S5')).toBe(true);
    expect(isValid(implies(diamond(box(p)), box(p)), 'S4')).toBe(false);
  });
});

describe('T — reflexividad', () => {
  it('□p → p es válido en T', () => {
    expect(isValid(implies(box(p), p), 'T')).toBe(true);
  });

  it('p → ◇p es válido en T (dual de T)', () => {
    expect(isValid(implies(p, diamond(p)), 'T')).toBe(true);
  });

  it('□p → ◇p es válido en T (refl ⇒ serial)', () => {
    expect(isValid(implies(box(p), diamond(p)), 'T')).toBe(true);
  });

  it('□p → □□p NO es válido en T (no hay transitividad)', () => {
    expect(isValid(implies(box(p), box(box(p))), 'T')).toBe(false);
  });
});

describe('K — sin axiomas de frame', () => {
  it('□p → p NO es válido en K', () => {
    expect(isValid(implies(box(p), p), 'K')).toBe(false);
  });

  it('□p → ◇p NO es válido en K (sin D)', () => {
    expect(isValid(implies(box(p), diamond(p)), 'K')).toBe(false);
  });

  it('axioma K válido: □(p→q) → (□p→□q)', () => {
    expect(isValid(implies(box(implies(p, q)), implies(box(p), box(q))), 'K')).toBe(true);
  });

  it('necesitación: □(p ∨ ¬p) válido en cualquier sistema normal', () => {
    expect(isValid(box(or(p, not(p))), 'K')).toBe(true);
  });
});

describe('D — serialidad', () => {
  it('□p → ◇p es válido en D', () => {
    expect(isValid(implies(box(p), diamond(p)), 'D')).toBe(true);
  });

  it('¬(□p ∧ □¬p) es válido en D (consistencia normativa)', () => {
    expect(isValid(not(and(box(p), box(not(p)))), 'D')).toBe(true);
  });

  it('□p → p NO es válido en D (D no implica T)', () => {
    expect(isValid(implies(box(p), p), 'D')).toBe(false);
  });
});

describe('B — simetría (KTB)', () => {
  it('p → □◇p válido en B (axioma B)', () => {
    expect(isValid(implies(p, box(diamond(p))), 'B')).toBe(true);
  });

  it('◇□p → p válido en B', () => {
    expect(isValid(implies(diamond(box(p)), p), 'B')).toBe(true);
  });

  it('□p → □□p NO válido en B (sin transitividad)', () => {
    expect(isValid(implies(box(p), box(box(p))), 'B')).toBe(false);
  });
});

describe('KD45 — lógica doxástica estándar', () => {
  it('axioma D válido: □p → ◇p', () => {
    expect(isValid(axiomFormula('D', p), 'KD45')).toBe(true);
  });

  it('axioma 4 válido: □p → □□p (positive introspection)', () => {
    expect(isValid(axiomFormula('4', p), 'KD45')).toBe(true);
  });

  it('axioma 5 válido: ◇p → □◇p (negative introspection)', () => {
    expect(isValid(axiomFormula('5', p), 'KD45')).toBe(true);
  });

  it('□p → p NO válido en KD45 (creencia ≠ verdad)', () => {
    expect(isValid(implies(box(p), p), 'KD45')).toBe(false);
  });
});

// ------------------------------------------------------------
// Tableau directo y modelos
// ------------------------------------------------------------

describe('tableauWithAxioms — devuelve modelo cuando es satisfacible', () => {
  it('p satisfacible en K — modelo con w0 forzando p', () => {
    const r = tableauWithAxioms(p, []);
    expect(r.sat).toBe(true);
    expect(r.model).toBeDefined();
    expect(r.model!.valuation.get(r.model!.actual)?.has('p')).toBe(true);
  });

  it('□p ∧ ¬p satisfacible en K (irreflexivo) — closed=false', () => {
    const r = tableauWithAxioms(and(box(p), not(p)), []);
    expect(r.sat).toBe(true);
    expect(r.closed).toBe(false);
  });

  it('□p ∧ ¬p insatisfacible en T (reflexivo) — closed=true', () => {
    const r = tableauWithAxioms(and(box(p), not(p)), ['T']);
    expect(r.sat).toBe(false);
    expect(r.closed).toBe(true);
    expect(r.model).toBeUndefined();
  });

  it('contradicción proposicional cierra en cualquier sistema', () => {
    expect(tableauWithAxioms(and(p, not(p)), []).closed).toBe(true);
    expect(tableauWithAxioms(and(p, not(p)), ['T']).closed).toBe(true);
    expect(tableauWithAxioms(and(p, not(p)), ['T', '4', '5']).closed).toBe(true);
  });
});

// ------------------------------------------------------------
// Composición / monotonía: T-validez ⊆ S4-validez ⊆ S5-validez
// ------------------------------------------------------------

describe('monotonía: añadir axiomas no quita validez', () => {
  const formulas = [
    implies(box(p), p), // T-válido
    implies(box(p), box(box(p))), // 4-válido
    implies(box(p), diamond(p)), // T,D-válido
  ];

  for (const phi of formulas) {
    it(`si φ válida en T también lo es en S4 y S5`, () => {
      if (isValid(phi, 'T')) {
        expect(isValid(phi, 'S4')).toBe(true);
        expect(isValid(phi, 'S5')).toBe(true);
      }
    });
  }
});

// ------------------------------------------------------------
// Casos negativos: claras refutaciones
// ------------------------------------------------------------

describe('refutaciones explícitas', () => {
  it('p → □p NO válido en S5 (sólo si universal)', () => {
    expect(isValid(implies(p, box(p)), 'S5')).toBe(false);
  });

  it('◇p → p NO válido en T (T no da simetría)', () => {
    expect(isValid(implies(diamond(p), p), 'T')).toBe(false);
  });

  it('□◇p → ◇□p NO válido en S4 (McKinsey no es teorema)', () => {
    expect(isValid(implies(box(diamond(p)), diamond(box(p))), 'S4')).toBe(false);
  });
});

// ------------------------------------------------------------
// isSatisfiable directo
// ------------------------------------------------------------

describe('isSatisfiable — consistencia con isValid', () => {
  it('p satisfacible en todos los sistemas', () => {
    expect(isSatisfiable(p, 'K')).toBe(true);
    expect(isSatisfiable(p, 'T')).toBe(true);
    expect(isSatisfiable(p, 'S5')).toBe(true);
  });

  it('p ∧ ¬p insatisfacible en todos los sistemas', () => {
    expect(isSatisfiable(and(p, not(p)), 'K')).toBe(false);
    expect(isSatisfiable(and(p, not(p)), 'KD45')).toBe(false);
  });

  it('isValid(φ) ⇔ ¬isSatisfiable(¬φ)', () => {
    const phi = implies(box(p), p);
    expect(isValid(phi, 'T')).toBe(!isSatisfiable(not(phi), 'T'));
    expect(isValid(phi, 'K')).toBe(!isSatisfiable(not(phi), 'K'));
  });

  it('□p ∧ ¬p satisfacible en K (mundo aislado), insatisfacible en T', () => {
    const phi = and(box(p), not(p));
    expect(isSatisfiable(phi, 'K')).toBe(true);
    // En T (reflexividad) w0 R w0, entonces □p fuerza p(w0), contradicción.
    expect(isSatisfiable(phi, 'T')).toBe(false);
  });
});
