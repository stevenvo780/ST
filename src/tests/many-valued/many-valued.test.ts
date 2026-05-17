import { describe, it, expect } from 'vitest';
import {
  atom,
  not,
  and,
  or,
  implies,
  evaluate,
  isTautology,
  isContradiction,
  findValuation,
  collectFuzzyAtoms,
  FuzzyOperator,
} from '../../profiles/many-valued';

const P = atom('P');
const Q = atom('Q');

describe('many-valued logics — núcleo de evaluación', () => {
  it('Łukasiewicz: P → P es tautología', () => {
    expect(isTautology(implies(P, P), 'lukasiewicz')).toBe(true);
  });

  it('Łukasiewicz (strong OR): P ∨ ¬P SÍ es tautología vía s-norm min(1, p+(1-p))=1', () => {
    // Con la disyunción fuerte (s-norm), P ∨ ¬P se colapsa a 1 siempre.
    // Es Gödel/Producto quienes rompen el tercero excluido — ver tests abajo.
    expect(isTautology(or(P, not(P)), 'lukasiewicz')).toBe(true);
    const v = evaluate(or(P, not(P)), { P: 0.5 }, 'lukasiewicz');
    expect(v).toBeCloseTo(1, 9); // min(1, 0.5+0.5)=1
  });

  it('Łukasiewicz: P ∧ ¬P NO siempre 0 — pero ¬(P ∧ ¬P) sí es tautología', () => {
    // En Łukasiewicz, P ∧ ¬P = max(0, P + (1-P) - 1) = max(0, 0) = 0
    // Así que ¬(P ∧ ¬P) sí es tautología (es la "no-contradicción").
    expect(isTautology(not(and(P, not(P))), 'lukasiewicz')).toBe(true);
    expect(isContradiction(and(P, not(P)), 'lukasiewicz')).toBe(true);
  });

  it('Gödel: P ∨ ¬P NO es tautología', () => {
    expect(isTautology(or(P, not(P)), 'godel')).toBe(false);
    // Cuando P=0.5: ¬P=0 (porque P≠0), entonces max(0.5, 0)=0.5
    const v = evaluate(or(P, not(P)), { P: 0.5 }, 'godel');
    expect(v).toBeCloseTo(0.5, 9);
  });

  it('Gödel: P → P es tautología', () => {
    expect(isTautology(implies(P, P), 'godel')).toBe(true);
  });

  it('Gödel: P ∧ P = P (t-norm idempotente)', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expect(evaluate(and(P, P), { P: p }, 'godel')).toBeCloseTo(p, 9);
    }
  });

  it('Producto: P ∧ P puede ser strictly menor que P (P=0.5 → 0.25)', () => {
    expect(evaluate(and(P, P), { P: 0.5 }, 'product')).toBeCloseTo(0.25, 9);
    expect(evaluate(and(P, P), { P: 0.3 }, 'product')).toBeCloseTo(0.09, 9);
    expect(evaluate(and(P, P), { P: 1 }, 'product')).toBeCloseTo(1, 9);
    expect(evaluate(and(P, P), { P: 0 }, 'product')).toBeCloseTo(0, 9);
  });

  it('Producto: P → P es tautología y P → Q vale q/p cuando p>q', () => {
    expect(isTautology(implies(P, P), 'product')).toBe(true);
    // P=0.8, Q=0.2 → q/p = 0.25
    expect(evaluate(implies(P, Q), { P: 0.8, Q: 0.2 }, 'product')).toBeCloseTo(
      0.25,
      9,
    );
    // P=0.2, Q=0.8 → 1 (porque p<=q)
    expect(evaluate(implies(P, Q), { P: 0.2, Q: 0.8 }, 'product')).toBeCloseTo(
      1,
      9,
    );
  });

  it('Comparación: P ∧ Q con P=0.6, Q=0.4 da distinto en cada sistema', () => {
    const env = { P: 0.6, Q: 0.4 };
    const luka = evaluate(and(P, Q), env, 'lukasiewicz');
    const godel = evaluate(and(P, Q), env, 'godel');
    const prod = evaluate(and(P, Q), env, 'product');

    // Łukasiewicz: max(0, 0.6+0.4-1)=0
    expect(luka).toBeCloseTo(0, 9);
    // Gödel: min(0.6, 0.4)=0.4
    expect(godel).toBeCloseTo(0.4, 9);
    // Product: 0.6*0.4=0.24
    expect(prod).toBeCloseTo(0.24, 9);

    expect(luka).not.toBeCloseTo(godel, 2);
    expect(godel).not.toBeCloseTo(prod, 2);
  });

  it('Comparación de implicación: P=0.6, Q=0.4 (p>q)', () => {
    const env = { P: 0.6, Q: 0.4 };
    // Łukasiewicz: min(1, 1-0.6+0.4)=0.8
    expect(evaluate(implies(P, Q), env, 'lukasiewicz')).toBeCloseTo(0.8, 9);
    // Gödel: p>q → 0.4
    expect(evaluate(implies(P, Q), env, 'godel')).toBeCloseTo(0.4, 9);
    // Product: q/p = 0.4/0.6 ≈ 0.6667
    expect(evaluate(implies(P, Q), env, 'product')).toBeCloseTo(2 / 3, 9);
  });

  it('Łukasiewicz: negación involutiva ¬¬P = P es tautología modal', () => {
    // En la rejilla, ¬¬P debe coincidir con P; expresado como
    // (¬¬P → P) ∧ (P → ¬¬P) ambas deben ser tautologías.
    expect(isTautology(implies(not(not(P)), P), 'lukasiewicz')).toBe(true);
    expect(isTautology(implies(P, not(not(P))), 'lukasiewicz')).toBe(true);
  });

  it('Gödel/Product: ¬¬P ≠ P (negación no involutiva)', () => {
    // En Gödel/Product, ¬0.5 = 0 → ¬¬0.5 = 1, distinto de 0.5.
    expect(evaluate(not(not(P)), { P: 0.5 }, 'godel')).toBeCloseTo(1, 9);
    expect(evaluate(not(not(P)), { P: 0.5 }, 'product')).toBeCloseTo(1, 9);
    // por tanto (¬¬P → P) NO es tautología
    expect(isTautology(implies(not(not(P)), P), 'godel')).toBe(false);
    expect(isTautology(implies(not(not(P)), P), 'product')).toBe(false);
  });

  it('Modus ponens (P ∧ (P → Q)) → Q es tautología en los 3 sistemas', () => {
    const mp = implies(and(P, implies(P, Q)), Q);
    for (const sys of ['lukasiewicz', 'godel', 'product'] as FuzzyOperator[]) {
      expect(isTautology(mp, sys)).toBe(true);
    }
  });

  it('findValuation: P ∨ ¬P en Łukasiewicz no tiene contraejemplo (s-norm fuerte)', () => {
    // En Łukasiewicz strong, P∨¬P = min(1, P+1-P)=1 siempre.
    const v = findValuation(or(P, not(P)), 'lukasiewicz', 0.5);
    expect(v).toBeNull();
  });

  it('findValuation encuentra contraejemplo de P ∨ ¬P en Gödel', () => {
    const v = findValuation(or(P, not(P)), 'godel', 0.5);
    // P=0.5 → ¬P=0 → max=0.5
    expect(v).not.toBeNull();
    if (v) {
      expect(v.P).toBeCloseTo(0.5, 6);
    }
  });

  it('isContradiction: 0 sólo es 0 — P ∧ ¬P es contradicción en Łukasiewicz', () => {
    expect(isContradiction(and(P, not(P)), 'lukasiewicz')).toBe(true);
  });

  it('collectFuzzyAtoms recoge átomos únicos y ordenados', () => {
    const f = and(P, or(Q, not(atom('R'))));
    expect(collectFuzzyAtoms(f)).toEqual(['P', 'Q', 'R']);
  });

  it('evaluate clamp01: entradas fuera de [0,1] se clampean', () => {
    // env con valor 2 — el evaluator clampea a 1.
    expect(evaluate(P, { P: 2 }, 'lukasiewicz')).toBeCloseTo(1, 9);
    expect(evaluate(P, { P: -0.5 }, 'product')).toBeCloseTo(0, 9);
  });

  it('Casos extremos 0/1: comportamiento clásico recuperado', () => {
    // Cuando P,Q ∈ {0,1}, las 3 lógicas degeneran a clásica.
    for (const p of [0, 1]) {
      for (const q of [0, 1]) {
        const env = { P: p, Q: q };
        const luka = evaluate(implies(P, Q), env, 'lukasiewicz');
        const god = evaluate(implies(P, Q), env, 'godel');
        const prod = evaluate(implies(P, Q), env, 'product');
        const classical = p === 1 && q === 0 ? 0 : 1;
        expect(luka).toBeCloseTo(classical, 9);
        expect(god).toBeCloseTo(classical, 9);
        expect(prod).toBeCloseTo(classical, 9);
      }
    }
  });

  it('Łukasiewicz: (P → Q) ∨ (Q → P) — prelinearity / Dummett', () => {
    // Es tautología en los 3 sistemas (axioma común de las lógicas de Hájek).
    const dum = or(implies(P, Q), implies(Q, P));
    expect(isTautology(dum, 'lukasiewicz')).toBe(true);
    expect(isTautology(dum, 'godel')).toBe(true);
    expect(isTautology(dum, 'product')).toBe(true);
  });

  it('Producto: P ∧ Q = P*Q (t-norm conmutativo y asociativo)', () => {
    const env1 = { P: 0.5, Q: 0.4 };
    const env2 = { P: 0.4, Q: 0.5 };
    const v1 = evaluate(and(P, Q), env1, 'product');
    const v2 = evaluate(and(P, Q), env2, 'product');
    expect(v1).toBeCloseTo(v2, 9);
    expect(v1).toBeCloseTo(0.2, 9);
  });
});
