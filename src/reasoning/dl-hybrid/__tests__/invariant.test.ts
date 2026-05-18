// ============================================================
// ST dL-Hybrid Reasoning — Invariant search tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  checkDifferentialInvariant,
  suggestInvariants,
  describeVerdict,
} from '../invariant-search';
import { parseProgram } from '../../../logic/profiles/dl-hybrid';
import { variable, plus, power } from '../../../logic/profiles/dl-hybrid';
import type { OdeSystem } from '../../../logic/profiles/dl-hybrid';

function ode(src: string): OdeSystem {
  const p = parseProgram(src);
  if (p.kind !== 'ode') throw new Error('Esperaba ODE');
  return p.system;
}

describe('dl-hybrid reasoning — checkDifferentialInvariant', () => {
  it("x es invariante con L_f exacto 0 para x' = 0", () => {
    // L_f(x) = 0  → exacto.
    const v = checkDifferentialInvariant(variable('x'), ode("{x' = 0}"));
    expect(v.kind).toBe('invariant');
    if (v.kind === 'invariant') expect(v.reason).toBe('exact');
  });

  it("x es invariante para x' = 1 (L_f = 1 ≥ 0)", () => {
    const v = checkDifferentialInvariant(variable('x'), ode("{x' = 1}"));
    expect(v.kind).toBe('invariant');
  });

  it("x NO es invariante para x' = -1 (L_f = -1 < 0)", () => {
    const v = checkDifferentialInvariant(variable('x'), ode("{x' = -1}"));
    expect(v.kind).toBe('not-invariant');
  });

  it("x² + y² es invariante para rotación (x' = -y, y' = x)", () => {
    const sys: OdeSystem = {
      equations: [
        { varName: 'x', rhs: { kind: 'neg', arg: variable('y') } },
        { varName: 'y', rhs: variable('x') },
      ],
    };
    const p = plus(power(variable('x'), 2), power(variable('y'), 2));
    const v = checkDifferentialInvariant(p, sys);
    expect(v.kind).toBe('invariant');
    // El simplificador no necesariamente reduce 2x(-y)+2yx a const 0,
    // pero numéricamente la malla evidencia el invariante.
    if (v.kind === 'invariant') {
      expect(['exact', 'lie-nonnegative']).toContain(v.reason);
    }
  });

  it("x NO es invariante para x' = x*y (refutable con muestra x=-1, y=2)", () => {
    // Sistema acoplado: chequeamos numéricamente, no por solubilidad cerrada.
    const sys = ode("{x' = x * y}");
    const v = checkDifferentialInvariant(variable('x'), sys);
    expect(v.kind).toBe('not-invariant');
  });
});

describe('dl-hybrid reasoning — suggestInvariants', () => {
  it("encuentra al menos un invariante para x' = 1 (x ≥ -1 o ≥ 0)", () => {
    const sys = ode("{x' = 1}");
    const found = suggestInvariants(sys);
    expect(found.length).toBeGreaterThan(0);
  });

  it('describeVerdict produce string informativo', () => {
    const sys = ode("{x' = 1}");
    const found = suggestInvariants(sys);
    expect(found.length).toBeGreaterThan(0);
    const first = found[0];
    expect(first).toBeDefined();
    if (first) {
      const desc = describeVerdict(first);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});
