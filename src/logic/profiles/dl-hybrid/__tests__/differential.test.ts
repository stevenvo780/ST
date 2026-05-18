// ============================================================
// ST dL-Hybrid — Tests para resolución de ODEs y derivada de Lie
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  classifyOde,
  flow,
  lieDerivative,
  termIsConstant,
  termIsLinearIn,
  termToExpr,
  evalSym,
} from '../differential';
import { parseProgram, parseTerm } from '../parser';
import type { OdeSystem, State } from '../ast';
import { variable, num, plus, times } from '../ast';

function ode(src: string): OdeSystem {
  const p = parseProgram(src);
  if (p.kind !== 'ode') throw new Error('Esperaba ODE');
  return p.system;
}

describe('dl-hybrid differential — clasificación', () => {
  it("detecta x' = 1 como constante", () => {
    const sys = ode("{x' = 1}");
    const k = classifyOde(sys);
    expect(k.kind).toBe('constant');
    if (k.kind === 'constant') {
      expect(k.rates.get('x')).toBe(1);
    }
  });

  it("detecta x' = 2 * x como lineal con a=2 b=0", () => {
    const sys = ode("{x' = 2 * x}");
    const k = classifyOde(sys);
    expect(k.kind).toBe('linear');
    if (k.kind === 'linear') {
      const c = k.coeffs.get('x');
      expect(c?.a).toBe(2);
      expect(c?.b).toBe(0);
    }
  });

  it("detecta x' = 3 * x + 5 como lineal con a=3 b=5", () => {
    const sys = ode("{x' = 3 * x + 5}");
    const k = classifyOde(sys);
    expect(k.kind).toBe('linear');
    if (k.kind === 'linear') {
      const c = k.coeffs.get('x');
      expect(c?.a).toBe(3);
      expect(c?.b).toBe(5);
    }
  });

  it("rechaza x' = x * y como acoplada (unsupported)", () => {
    const sys = ode("{x' = x * y}");
    const k = classifyOde(sys);
    expect(k.kind).toBe('unsupported');
  });
});

describe('dl-hybrid differential — flow analítico', () => {
  it("x' = 2 desde x0=1, t=3 → x=7", () => {
    const sys = ode("{x' = 2}");
    const s0: State = new Map([['x', 1]]);
    const sT = flow(sys, s0, 3);
    expect(sT.get('x')).toBeCloseTo(7, 9);
  });

  it("x' = -1 desde x0=10, t=4 → x=6", () => {
    const sys = ode("{x' = -1}");
    const s0: State = new Map([['x', 10]]);
    const sT = flow(sys, s0, 4);
    expect(sT.get('x')).toBeCloseTo(6, 9);
  });

  it("x' = x desde x0=1, t=1 → x≈e", () => {
    const sys = ode("{x' = x}");
    const s0: State = new Map([['x', 1]]);
    const sT = flow(sys, s0, 1);
    expect(sT.get('x')).toBeCloseTo(Math.E, 6);
  });

  it("x' = 2*x desde x0=1, t=ln(2)/2 → x=2", () => {
    // x(t) = x₀ · e^{2t} = 1 · e^{ln 2} = 2
    const sys = ode("{x' = 2 * x}");
    const s0: State = new Map([['x', 1]]);
    const t = Math.log(2) / 2;
    const sT = flow(sys, s0, t);
    expect(sT.get('x')).toBeCloseTo(2, 6);
  });
});

describe('dl-hybrid differential — derivada de Lie', () => {
  it("L_f(x) para x' = 1 da 1 (la propia f)", () => {
    const sys = ode("{x' = 1}");
    const lie = lieDerivative(variable('x'), sys);
    // Debe simplificarse a const 1.
    expect(lie.kind).toBe('const');
    if (lie.kind === 'const') expect(lie.value).toBe(1);
  });

  it("L_f(x) para x' = 2x da 2x", () => {
    const sys = ode("{x' = 2 * x}");
    const lie = lieDerivative(variable('x'), sys);
    // Evaluamos en x=3 → 2*3 = 6
    const v = evalSym(lie, new Map([['x', 3]]));
    expect(v).toBeCloseTo(6, 9);
  });

  it("L_f(x²) para x' = 1 da 2x", () => {
    const sys = ode("{x' = 1}");
    // candidate p = x²
    const p = parseTerm('x^2');
    const lie = lieDerivative(p, sys);
    // En x=5 da 2*5 = 10
    const v = evalSym(lie, new Map([['x', 5]]));
    expect(v).toBeCloseTo(10, 9);
  });

  it("L_f(x² + y²) para x' = -y, y' = x (rotación) da 0 (invariante exacto)", () => {
    const sys: OdeSystem = {
      equations: [
        { varName: 'x', rhs: { kind: 'neg', arg: variable('y') } },
        { varName: 'y', rhs: variable('x') },
      ],
    };
    // L_f(x²+y²) = 2x*(-y) + 2y*x = 0
    const p = plus({ kind: 'pow', base: variable('x'), exp: 2 }, {
      kind: 'pow',
      base: variable('y'),
      exp: 2,
    });
    const lie = lieDerivative(p, sys);
    const v = evalSym(lie, new Map([['x', 1], ['y', 2]]));
    expect(v).toBeCloseTo(0, 6);
  });
});

describe('dl-hybrid differential — auxiliares', () => {
  it('termIsConstant detecta enteros y resultados simplificados', () => {
    expect(termIsConstant(num(5))).toBe(5);
    expect(termIsConstant(plus(num(2), num(3)))).toBe(5);
    expect(termIsConstant(variable('x'))).toBeNull();
  });

  it('termIsLinearIn extrae a, b correctamente para 2*x + 3', () => {
    const lin = termIsLinearIn(plus(times(num(2), variable('x')), num(3)), 'x');
    expect(lin).toEqual({ a: 2, b: 3 });
  });

  it('termIsLinearIn devuelve null si hay otras variables', () => {
    expect(termIsLinearIn(plus(variable('x'), variable('y')), 'x')).toBeNull();
  });

  it('termToExpr no falla sobre términos parseados', () => {
    const t = parseTerm('x + 2 * y');
    const e = termToExpr(t);
    expect(e.kind).toBe('add');
  });
});
