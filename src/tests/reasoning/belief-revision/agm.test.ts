import { describe, it, expect } from 'vitest';
import {
  newBeliefSet,
  expand,
  contract,
  revise,
  entails,
  isConsistent,
  verifySuccess,
  verifyInclusion,
  verifyClosure,
  beliefSetToArray,
  canonicalize,
  type PartialOrder,
} from '../../../reasoning/belief-revision';

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

describe('expand (K + φ)', () => {
  it('añade una fórmula nueva al belief set', () => {
    const K = newBeliefSet(['p']);
    const expanded = expand(K, 'q');
    expect(beliefSetToArray(expanded)).toEqual(['p', 'q']);
  });

  it('no duplica si la fórmula ya está', () => {
    const K = newBeliefSet(['p', 'q']);
    const expanded = expand(K, 'p');
    expect(beliefSetToArray(expanded)).toEqual(['p', 'q']);
  });

  it('no muta el belief set original', () => {
    const K = newBeliefSet(['p']);
    expand(K, 'q');
    expect(beliefSetToArray(K)).toEqual(['p']);
  });

  it('puede generar inconsistencia (expansion no se compromete con consistencia)', () => {
    const K = newBeliefSet(['p']);
    const inconsistent = expand(K, '!p');
    expect(isConsistent(inconsistent)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Contraction
// ---------------------------------------------------------------------------

describe('contract (K - φ)', () => {
  it('al contraer por p, K ya no implica p', () => {
    const K = newBeliefSet(['p', 'q']);
    const contracted = contract(K, 'p');
    expect(entails(contracted, 'p')).toBe(false);
  });

  it('al contraer por p, sigue implicando q (preserva lo no relacionado)', () => {
    const K = newBeliefSet(['p', 'q']);
    const contracted = contract(K, 'p');
    expect(entails(contracted, 'q')).toBe(true);
  });

  it('si K no implica φ, K - φ = K (vacuidad)', () => {
    const K = newBeliefSet(['p']);
    const contracted = contract(K, 'q');
    expect(beliefSetToArray(contracted)).toEqual(beliefSetToArray(K));
  });

  it('si φ es tautología, K - φ = K (postulado K-5 vacuidad)', () => {
    const K = newBeliefSet(['p']);
    const contracted = contract(K, 'p | !p');
    expect(beliefSetToArray(contracted)).toEqual(beliefSetToArray(K));
  });

  it('con entrenchment, remueve la fórmula MENOS arraigada', () => {
    // K implica p de dos formas: directamente "p", y "q -> p" + "q".
    // Si contraemos por p, hay que romper ambas vías.
    // Con entrenchment alto en "q -> p" y bajo en "p" y "q", debería preferir
    // quitar "p" y "q" antes que "q -> p".
    const K = newBeliefSet(['p', 'q', 'q -> p']);
    const ordering: PartialOrder = new Map([
      ['p', 1],
      ['q', 1],
      ['q -> p', 10],
    ]);
    const contracted = contract(K, 'p', ordering);
    expect(entails(contracted, 'p')).toBe(false);
    // q -> p sobrevive: es la más arraigada.
    expect(contracted.formulas.has('q -> p')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Revision (identidad de Levi)
// ---------------------------------------------------------------------------

describe('revise (K * φ)', () => {
  it('K * φ contiene φ (K2 success)', () => {
    const K = newBeliefSet(['p']);
    const revised = revise(K, '!p');
    expect(entails(revised, '!p')).toBe(true);
    expect(verifySuccess(revised, '!p')).toBe(true);
  });

  it('K * ¬p sobre K={p} produce un set consistente sin p', () => {
    const K = newBeliefSet(['p']);
    const revised = revise(K, '!p');
    expect(isConsistent(revised)).toBe(true);
    expect(entails(revised, 'p')).toBe(false);
  });

  it('revisar por p en {p | q, !p} produce {p, ...} sin !p', () => {
    const K = newBeliefSet(['p | q', '!p']);
    const revised = revise(K, 'p');
    expect(entails(revised, 'p')).toBe(true);
    expect(entails(revised, '!p')).toBe(false);
    expect(isConsistent(revised)).toBe(true);
  });

  it('revisar por una fórmula ya implicada deja K extendido pero consistente', () => {
    const K = newBeliefSet(['p', 'q']);
    const revised = revise(K, 'p');
    expect(entails(revised, 'p')).toBe(true);
    expect(entails(revised, 'q')).toBe(true);
    expect(isConsistent(revised)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Postulados AGM
// ---------------------------------------------------------------------------

describe('AGM postulates', () => {
  it('K2 (éxito): φ siempre derivable después de revise(K, φ)', () => {
    const K = newBeliefSet(['p', 'q']);
    const revised = revise(K, '!p');
    expect(verifySuccess(revised, '!p')).toBe(true);
  });

  it('K3 (inclusión): K * φ ⊆ Cn(K + φ) cuando K + φ es consistente', () => {
    const K = newBeliefSet(['p', 'q']);
    // K + p es consistente (p ya está), así que K3 aplica.
    const revised = revise(K, 'p');
    expect(verifyInclusion(revised, K, 'p')).toBe(true);
  });

  it('verifyClosure: cada fórmula de K es derivable desde K (autocontención)', () => {
    const K = newBeliefSet(['p', 'q', 'p -> r']);
    expect(verifyClosure(K)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Helpers y consistencia
// ---------------------------------------------------------------------------

describe('isConsistent / entails', () => {
  it('belief set vacío es consistente', () => {
    const K = newBeliefSet([]);
    expect(isConsistent(K)).toBe(true);
  });

  it('{p, !p} es inconsistente', () => {
    const K = newBeliefSet(['p', '!p']);
    expect(isConsistent(K)).toBe(false);
  });

  it('modus ponens: {p, p -> q} ⊢ q', () => {
    const K = newBeliefSet(['p', 'p -> q']);
    expect(entails(K, 'q')).toBe(true);
  });

  it('belief set vacío implica tautologías', () => {
    const K = newBeliefSet([]);
    expect(entails(K, 'p | !p')).toBe(true);
  });

  it('belief set vacío NO implica fórmulas contingentes', () => {
    const K = newBeliefSet([]);
    expect(entails(K, 'p')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Canonicalización
// ---------------------------------------------------------------------------

describe('canonicalize', () => {
  it('produce orden estable independiente del orden de inserción', () => {
    const a = newBeliefSet(['p', 'q -> r', 'q']);
    const b = newBeliefSet(['q -> r', 'p', 'q']);
    expect(canonicalize(a)).toBe(canonicalize(b));
  });
});

// ---------------------------------------------------------------------------
// Parser edge cases
// ---------------------------------------------------------------------------

describe('parser de fórmulas (aliases unicode/ascii)', () => {
  it('acepta unicode (∧, ∨, ¬, →, ↔)', () => {
    const K = newBeliefSet(['p ∧ q', '¬r', 'p → r', 'a ↔ b']);
    expect(K.formulas.size).toBe(4);
  });

  it('acepta ascii (& | ! -> <->)', () => {
    const K = newBeliefSet(['p & q', '!r', 'p -> r', 'a <-> b']);
    expect(K.formulas.size).toBe(4);
  });

  it('lanza error para sintaxis inválida', () => {
    expect(() => newBeliefSet(['p & &'])).toThrow();
  });
});
