// ============================================================
// ST Peano Arithmetic — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  AXIOM_P1,
  AXIOM_P2,
  AXIOM_P3,
  AXIOM_P4,
  AXIOM_P5,
  AXIOM_P6,
  PEANO_AXIOMS,
  add,
  andF,
  eq,
  evalFormula,
  evalNat,
  exists,
  forall,
  fromGodel,
  godelNumber,
  inductionSchema,
  mul,
  notF,
  numeral,
  succ,
  theoremAddAssociative,
  theoremAddCommutative,
  theoremMulCommutative,
  theoremMulDistOverAdd,
  verifyTheoremBySampling,
  vt,
  zero,
} from '../../../reasoning/peano-arithmetic';

describe('peano-arithmetic — evaluación de términos', () => {
  it('evalNat(succ(succ(zero))) = 2', () => {
    expect(evalNat(succ(succ(zero)))).toBe(2);
  });

  it('evalNat(add(numeral(2), numeral(3))) = 5', () => {
    expect(evalNat(add(numeral(2), numeral(3)))).toBe(5);
  });

  it('evalNat(mul(numeral(3), numeral(4))) = 12', () => {
    expect(evalNat(mul(numeral(3), numeral(4)))).toBe(12);
  });

  it('evalNat con variable libre y entorno', () => {
    expect(evalNat(add(vt('x'), numeral(1)), { x: 7 })).toBe(8);
  });

  it('evalNat devuelve null para variable libre sin binding', () => {
    expect(evalNat(vt('y'), {})).toBeNull();
  });
});

describe('peano-arithmetic — axiomas P1..P6 en ℕ', () => {
  it('P1: ¬(succ(x) = 0) se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P1).valid).toBe(true);
  });

  it('P2: succ(x) = succ(y) → x = y se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P2).valid).toBe(true);
  });

  it('P3: x + 0 = x se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P3).valid).toBe(true);
  });

  it('P4: x + succ(y) = succ(x + y) se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P4).valid).toBe(true);
  });

  it('P5: x · 0 = 0 se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P5).valid).toBe(true);
  });

  it('P6: x · succ(y) = (x · y) + x se cumple', () => {
    expect(verifyTheoremBySampling(AXIOM_P6).valid).toBe(true);
  });

  it('PEANO_AXIOMS exporta los 6 axiomas', () => {
    expect(PEANO_AXIOMS).toHaveLength(6);
    expect(PEANO_AXIOMS).toContain(AXIOM_P1);
    expect(PEANO_AXIOMS).toContain(AXIOM_P6);
  });
});

describe('peano-arithmetic — teoremas estándar', () => {
  it('add commutative: ∀x,y. x+y = y+x', () => {
    const res = verifyTheoremBySampling(theoremAddCommutative());
    expect(res.valid).toBe(true);
    expect(res.counterexample).toBeUndefined();
  });

  it('add associative: ∀x,y,z. (x+y)+z = x+(y+z)', () => {
    expect(verifyTheoremBySampling(theoremAddAssociative()).valid).toBe(true);
  });

  it('mul commutative: ∀x,y. x·y = y·x', () => {
    expect(verifyTheoremBySampling(theoremMulCommutative()).valid).toBe(true);
  });

  it('mul distributes over add: ∀x,y,z. x·(y+z) = x·y + x·z', () => {
    expect(verifyTheoremBySampling(theoremMulDistOverAdd()).valid).toBe(true);
  });
});

describe('peano-arithmetic — contraejemplos', () => {
  it('refuta ∀x. x = succ(x) con contraejemplo x=0', () => {
    const falseFormula = forall('x', eq(vt('x'), succ(vt('x'))));
    const res = verifyTheoremBySampling(falseFormula);
    expect(res.valid).toBe(false);
  });

  it('refuta ∀x. x · x = x (falla para x=2)', () => {
    const idempotentMul = forall('x', eq(mul(vt('x'), vt('x')), vt('x')));
    const res = verifyTheoremBySampling(idempotentMul);
    expect(res.valid).toBe(false);
  });

  it('refuta abierta x = succ(x) con cualquier valor', () => {
    const openFormula = eq(vt('x'), succ(vt('x')));
    const res = verifyTheoremBySampling(openFormula);
    expect(res.valid).toBe(false);
    expect(res.counterexample).toBeDefined();
    expect(res.counterexample!).toHaveProperty('x');
  });

  it('refuta ∃x. succ(x) = 0 (P1 negado)', () => {
    const violateP1 = exists('x', eq(succ(vt('x')), zero));
    const res = verifyTheoremBySampling(violateP1);
    expect(res.valid).toBe(false);
  });
});

describe('peano-arithmetic — evaluación de fórmulas', () => {
  it('evalFormula cerrada: 2 + 3 = 5', () => {
    const f = eq(add(numeral(2), numeral(3)), numeral(5));
    expect(evalFormula(f)).toBe(true);
  });

  it('evalFormula con conjunción y negación', () => {
    const f = andF(eq(numeral(2), numeral(2)), notF(eq(numeral(0), numeral(1))));
    expect(evalFormula(f)).toBe(true);
  });

  it('evalFormula con implicación cortocircuito', () => {
    const f = eq(numeral(0), numeral(1));
    const implFalse = { kind: 'implies' as const, left: f, right: f };
    expect(evalFormula(implFalse)).toBe(true);
  });

  it('evalFormula cuantificador acotado', () => {
    const f = forall('x', eq(add(vt('x'), zero), vt('x')));
    expect(evalFormula(f, {}, 5)).toBe(true);
  });
});

describe('peano-arithmetic — esquema de inducción', () => {
  it('inductionSchema construye base ∧ paso → conclusión', () => {
    const P = (n: ReturnType<typeof vt>) => eq(add(n, zero), n);
    const schema = inductionSchema(P);
    expect(schema.kind).toBe('implies');
  });

  it('inducción aplicada a P(n) = (n + 0 = n) se cumple en ℕ', () => {
    const P = (n: ReturnType<typeof vt>) => eq(add(n, zero), n);
    const schema = inductionSchema(P);
    expect(verifyTheoremBySampling(schema).valid).toBe(true);
  });

  it('inducción aplicada a P(n) = (n·0 = 0)', () => {
    const P = (n: ReturnType<typeof vt>) => eq(mul(n, zero), zero);
    const schema = inductionSchema(P);
    expect(verifyTheoremBySampling(schema).valid).toBe(true);
  });
});

describe('peano-arithmetic — codificación de Gödel', () => {
  it('godel round-trip para fórmula atómica eq(0, 0)', () => {
    const f = eq(zero, zero);
    const n = godelNumber(f);
    expect(typeof n).toBe('bigint');
    const back = fromGodel(n);
    expect(back).toEqual(f);
  });

  it('godel round-trip para AXIOM_P3', () => {
    const n = godelNumber(AXIOM_P3);
    const back = fromGodel(n);
    expect(back).toEqual(AXIOM_P3);
  });

  it('godel round-trip para teorema commutativo', () => {
    const thm = theoremAddCommutative();
    const n = godelNumber(thm);
    const back = fromGodel(n);
    expect(back).toEqual(thm);
  });

  it('godel round-trip para fórmula con and de 3 args', () => {
    const f = andF(eq(numeral(1), numeral(1)), AXIOM_P3, notF(AXIOM_P1));
    const n = godelNumber(f);
    expect(fromGodel(n)).toEqual(f);
  });

  it('fromGodel devuelve null para bigint negativo', () => {
    expect(fromGodel(-1n)).toBeNull();
  });

  it('códigos de Gödel son inyectivos sobre las 6 axiomas', () => {
    const codes = PEANO_AXIOMS.map(godelNumber);
    const unique = new Set(codes.map((c) => c.toString()));
    expect(unique.size).toBe(codes.length);
  });
});
