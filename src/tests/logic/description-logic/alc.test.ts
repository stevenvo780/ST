// ============================================================
// ST Description Logic — Tests del perfil ALC
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  TOP,
  BOTTOM,
  atomic,
  not,
  and,
  or,
  exists,
  forall,
  subsumes,
  equivalent,
  instance,
  roleInstance,
  emptyKB,
  isSatisfiable,
  isSubsumed,
  isInstance,
  classify,
  toNNF,
  conceptEqual,
  conceptHash,
  conceptToString,
  type DLKnowledgeBase,
} from '../../../logic/profiles/description-logic';

describe('ALC — NNF', () => {
  it('empuja ¬ al interior y elimina ⊤/⊥ bajo ¬', () => {
    const c = not(and(atomic('A'), or(atomic('B'), atomic('C'))));
    const n = toNNF(c);
    // ¬(A ⊓ (B ⊔ C)) = ¬A ⊔ (¬B ⊓ ¬C)
    expect(conceptEqual(n, or(not(atomic('A')), and(not(atomic('B')), not(atomic('C')))))).toBe(
      true,
    );
  });

  it('¬⊤ = ⊥ y ¬⊥ = ⊤', () => {
    expect(conceptEqual(toNNF(not(TOP)), BOTTOM)).toBe(true);
    expect(conceptEqual(toNNF(not(BOTTOM)), TOP)).toBe(true);
  });

  it('¬∃R.C = ∀R.¬C y viceversa', () => {
    const c = atomic('C');
    expect(conceptEqual(toNNF(not(exists('R', c))), forall('R', not(c)))).toBe(true);
    expect(conceptEqual(toNNF(not(forall('R', c))), exists('R', not(c)))).toBe(true);
  });

  it('conceptToString rinde notación legible', () => {
    expect(conceptToString(TOP)).toBe('⊤');
    expect(conceptToString(BOTTOM)).toBe('⊥');
    expect(conceptToString(atomic('Dog'))).toBe('Dog');
    expect(conceptToString(not(atomic('A')))).toBe('¬A');
    expect(conceptToString(exists('hasChild', atomic('Person')))).toBe('∃hasChild.Person');
    expect(conceptToString(forall('R', atomic('A')))).toBe('∀R.A');
    expect(conceptToString(and(atomic('A'), atomic('B')))).toBe('(A ⊓ B)');
    expect(conceptToString(or(atomic('A'), atomic('B')))).toBe('(A ⊔ B)');
  });

  it('conceptHash es estable y conmutativo en and/or', () => {
    const a = and(atomic('A'), atomic('B'));
    const b = and(atomic('B'), atomic('A'));
    expect(conceptHash(a)).toBe(conceptHash(b));
  });
});

describe('ALC — Satisfiability básica', () => {
  it('⊤ es satisfacible', () => {
    expect(isSatisfiable(TOP)).toBe(true);
  });

  it('⊥ NO es satisfacible', () => {
    expect(isSatisfiable(BOTTOM)).toBe(false);
  });

  it('A ⊓ ¬A es insatisfacible', () => {
    expect(isSatisfiable(and(atomic('A'), not(atomic('A'))))).toBe(false);
  });

  it('A ⊔ ¬A es satisfacible (TND clásico)', () => {
    expect(isSatisfiable(or(atomic('A'), not(atomic('A'))))).toBe(true);
  });

  it('A atómico solo es satisfacible', () => {
    expect(isSatisfiable(atomic('A'))).toBe(true);
  });

  it('∃R.A es satisfacible con KB vacío', () => {
    expect(isSatisfiable(exists('R', atomic('A')))).toBe(true);
  });

  it('∀R.A es satisfacible (trivial: sin sucesores)', () => {
    expect(isSatisfiable(forall('R', atomic('A')))).toBe(true);
  });
});

describe('ALC — Interacción ∃/∀', () => {
  it('∃R.A ⊓ ∀R.¬A es INSATISFACIBLE', () => {
    const c = and(exists('R', atomic('A')), forall('R', not(atomic('A'))));
    expect(isSatisfiable(c)).toBe(false);
  });

  it('∃R.A ⊓ ∀R.A es satisfacible', () => {
    const c = and(exists('R', atomic('A')), forall('R', atomic('A')));
    expect(isSatisfiable(c)).toBe(true);
  });

  it('∃R.(A ⊓ ¬A) es INSATISFACIBLE', () => {
    const c = exists('R', and(atomic('A'), not(atomic('A'))));
    expect(isSatisfiable(c)).toBe(false);
  });

  it('∀R.⊥ ⊓ ∃R.⊤ es INSATISFACIBLE (existe sucesor que debe ser ⊥)', () => {
    const c = and(forall('R', BOTTOM), exists('R', TOP));
    expect(isSatisfiable(c)).toBe(false);
  });

  it('∃R.∃S.A es satisfacible (cadena de roles)', () => {
    const c = exists('R', exists('S', atomic('A')));
    expect(isSatisfiable(c)).toBe(true);
  });
});

describe('ALC — Subsumption', () => {
  it('A ⊓ B ⊑ A', () => {
    expect(isSubsumed(and(atomic('A'), atomic('B')), atomic('A'))).toBe(true);
  });

  it('A ⊑ A ⊔ B', () => {
    expect(isSubsumed(atomic('A'), or(atomic('A'), atomic('B')))).toBe(true);
  });

  it('A NO subsume a B sin KB', () => {
    expect(isSubsumed(atomic('A'), atomic('B'))).toBe(false);
  });

  it('∃R.A ⊑ ∃R.(A ⊔ B)', () => {
    expect(isSubsumed(exists('R', atomic('A')), exists('R', or(atomic('A'), atomic('B'))))).toBe(
      true,
    );
  });

  it('∀R.A ⊓ ∀R.B ⊑ ∀R.(A ⊓ B)', () => {
    expect(
      isSubsumed(
        and(forall('R', atomic('A')), forall('R', atomic('B'))),
        forall('R', and(atomic('A'), atomic('B'))),
      ),
    ).toBe(true);
  });

  it('⊥ ⊑ C para todo C', () => {
    expect(isSubsumed(BOTTOM, atomic('A'))).toBe(true);
  });

  it('C ⊑ ⊤ para todo C', () => {
    expect(isSubsumed(atomic('A'), TOP)).toBe(true);
  });
});

describe('ALC — Subsumption con TBox', () => {
  const kb: DLKnowledgeBase = {
    tbox: [subsumes(atomic('Dog'), atomic('Mammal')), subsumes(atomic('Mammal'), atomic('Animal'))],
    abox: [],
  };

  it('Dog ⊑ Animal (transitividad de subsumption)', () => {
    expect(isSubsumed(atomic('Dog'), atomic('Animal'), kb)).toBe(true);
  });

  it('Dog ⊑ Mammal', () => {
    expect(isSubsumed(atomic('Dog'), atomic('Mammal'), kb)).toBe(true);
  });

  it('Animal NO ⊑ Dog (sin información)', () => {
    expect(isSubsumed(atomic('Animal'), atomic('Dog'), kb)).toBe(false);
  });

  it('equivalencia C ≡ D implica subsumption en ambas direcciones', () => {
    const kb2: DLKnowledgeBase = {
      tbox: [equivalent(atomic('Bachelor'), and(atomic('Unmarried'), atomic('Man')))],
      abox: [],
    };
    expect(isSubsumed(atomic('Bachelor'), atomic('Man'), kb2)).toBe(true);
    expect(isSubsumed(and(atomic('Unmarried'), atomic('Man')), atomic('Bachelor'), kb2)).toBe(true);
  });
});

describe('ALC — Instance checking', () => {
  it('ABox {a:A, R(a,b), b:¬A}, ¿a : ∃R.¬A?  → true', () => {
    const kb: DLKnowledgeBase = {
      tbox: [],
      abox: [
        instance('a', atomic('A')),
        roleInstance('a', 'R', 'b'),
        instance('b', not(atomic('A'))),
      ],
    };
    expect(isInstance('a', exists('R', not(atomic('A'))), kb)).toBe(true);
  });

  it('ABox {a:A}, a NO es instancia de B', () => {
    const kb: DLKnowledgeBase = {
      tbox: [],
      abox: [instance('a', atomic('A'))],
    };
    expect(isInstance('a', atomic('B'), kb)).toBe(false);
  });

  it('TBox {A ⊑ B} + ABox {a:A} ⊨ a:B', () => {
    const kb: DLKnowledgeBase = {
      tbox: [subsumes(atomic('A'), atomic('B'))],
      abox: [instance('a', atomic('A'))],
    };
    expect(isInstance('a', atomic('B'), kb)).toBe(true);
  });

  it('inconsistencia: {a:A, a:¬A} hace que a sea instancia de cualquier cosa', () => {
    const kb: DLKnowledgeBase = {
      tbox: [],
      abox: [instance('a', atomic('A')), instance('a', not(atomic('A')))],
    };
    // KB inconsistente ⇒ todo se sigue (ex falso quodlibet)
    expect(isInstance('a', atomic('Z'), kb)).toBe(true);
  });

  it('∀R.A propaga: {R(a,b), a:∀R.A} ⊨ b:A', () => {
    const kb: DLKnowledgeBase = {
      tbox: [],
      abox: [roleInstance('a', 'R', 'b'), instance('a', forall('R', atomic('A')))],
    };
    expect(isInstance('b', atomic('A'), kb)).toBe(true);
  });
});

describe('ALC — Classify (taxonomía)', () => {
  it('jerarquía simple Dog ⊑ Mammal ⊑ Animal', () => {
    const kb: DLKnowledgeBase = {
      tbox: [
        subsumes(atomic('Dog'), atomic('Mammal')),
        subsumes(atomic('Mammal'), atomic('Animal')),
      ],
      abox: [],
    };
    const tax = classify(kb);
    // Dog está subsumido por Dog, Mammal, Animal, ⊤
    expect(tax.get('Dog')!.has('Mammal')).toBe(true);
    expect(tax.get('Dog')!.has('Animal')).toBe(true);
    expect(tax.get('Dog')!.has('⊤')).toBe(true);
    // Mammal por sí mismo + Animal + ⊤ (no Dog)
    expect(tax.get('Mammal')!.has('Animal')).toBe(true);
    expect(tax.get('Mammal')!.has('Dog')).toBe(false);
    // Animal por sí mismo + ⊤
    expect(tax.get('Animal')!.has('Dog')).toBe(false);
    expect(tax.get('Animal')!.has('Mammal')).toBe(false);
    expect(tax.get('Animal')!.has('⊤')).toBe(true);
  });

  it('concepto insatisfacible aparece como subsumido por TODO', () => {
    const kb: DLKnowledgeBase = {
      tbox: [
        subsumes(atomic('Round'), not(atomic('Square'))),
        subsumes(atomic('RoundSquare'), and(atomic('Round'), atomic('Square'))),
      ],
      abox: [],
    };
    const tax = classify(kb);
    // RoundSquare es insatisfacible → subsumido por todo, incluso conceptos no-relacionados
    const rs = tax.get('RoundSquare')!;
    expect(rs.has('Round')).toBe(true);
    expect(rs.has('Square')).toBe(true);
    expect(rs.has('⊥')).toBe(true);
  });
});

describe('ALC — emptyKB helper', () => {
  it('emptyKB devuelve una KB vacía utilizable', () => {
    const kb = emptyKB();
    expect(kb.tbox).toEqual([]);
    expect(kb.abox).toEqual([]);
    expect(isSatisfiable(atomic('A'), kb)).toBe(true);
  });
});

describe('ALC — Terminación con TBox cíclico (blocking)', () => {
  it('TBox cíclico Person ≡ ∃hasParent.Person no diverge y A:Person es satisfacible', () => {
    const kb: DLKnowledgeBase = {
      tbox: [equivalent(atomic('Person'), exists('hasParent', atomic('Person')))],
      abox: [],
    };
    // No debe colgarse — el blocking garantiza terminación.
    expect(isSatisfiable(atomic('Person'), kb)).toBe(true);
  });

  it('TBox cíclico contradictorio Person ⊑ ∃hasFoo.Person ⊓ ∀hasFoo.⊥ es insatisfacible', () => {
    const kb: DLKnowledgeBase = {
      tbox: [
        subsumes(
          atomic('Person'),
          and(exists('hasFoo', atomic('Person')), forall('hasFoo', BOTTOM)),
        ),
      ],
      abox: [],
    };
    expect(isSatisfiable(atomic('Person'), kb)).toBe(false);
  });
});

describe('ALC — Casos clásicos OWL/DL', () => {
  it('regla de De Morgan a nivel de concepto', () => {
    // ¬(A ⊓ B) ≡ ¬A ⊔ ¬B
    const lhs = not(and(atomic('A'), atomic('B')));
    const rhs = or(not(atomic('A')), not(atomic('B')));
    expect(isSubsumed(lhs, rhs)).toBe(true);
    expect(isSubsumed(rhs, lhs)).toBe(true);
  });

  it('axioma K modal: ∀R.(A ⊓ B) ⊑ ∀R.A ⊓ ∀R.B', () => {
    expect(
      isSubsumed(
        forall('R', and(atomic('A'), atomic('B'))),
        and(forall('R', atomic('A')), forall('R', atomic('B'))),
      ),
    ).toBe(true);
  });

  it('∃R.A ⊓ ∀R.B ⊑ ∃R.(A ⊓ B)', () => {
    expect(
      isSubsumed(
        and(exists('R', atomic('A')), forall('R', atomic('B'))),
        exists('R', and(atomic('A'), atomic('B'))),
      ),
    ).toBe(true);
  });
});
