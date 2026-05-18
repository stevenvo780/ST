// ============================================================
// ST dL-Hybrid — Parser tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseFormula, parseProgram, parseTerm } from '../parser';
import { formulaToString, programToString, termToString } from '../ast';

describe('dl-hybrid parser — términos', () => {
  it('parsea números enteros y reales', () => {
    expect(parseTerm('42')).toEqual({ kind: 'num', value: 42 });
    expect(parseTerm('3.14')).toEqual({ kind: 'num', value: 3.14 });
  });

  it('parsea variables', () => {
    expect(parseTerm('x')).toEqual({ kind: 'var', name: 'x' });
  });

  it('parsea aritmética con precedencia correcta', () => {
    // x + 2 * y debe parsear como x + (2 * y)
    const t = parseTerm('x + 2 * y');
    expect(t).toEqual({
      kind: 'plus',
      left: { kind: 'var', name: 'x' },
      right: {
        kind: 'times',
        left: { kind: 'num', value: 2 },
        right: { kind: 'var', name: 'y' },
      },
    });
  });

  it('parsea potencias con exponente entero', () => {
    expect(parseTerm('x^2')).toEqual({
      kind: 'pow',
      base: { kind: 'var', name: 'x' },
      exp: 2,
    });
  });

  it('soporta negación unaria', () => {
    expect(parseTerm('-x')).toEqual({ kind: 'neg', arg: { kind: 'var', name: 'x' } });
  });
});

describe('dl-hybrid parser — fórmulas', () => {
  it('parsea comparaciones básicas', () => {
    const f = parseFormula('x > 0');
    expect(f).toEqual({
      kind: 'comp',
      op: '>',
      left: { kind: 'var', name: 'x' },
      right: { kind: 'num', value: 0 },
    });
  });

  it('parsea cada operador relacional', () => {
    expect(parseFormula('x = 1').kind).toBe('comp');
    expect(parseFormula('x != 1').kind).toBe('comp');
    expect(parseFormula('x <= 1').kind).toBe('comp');
    expect(parseFormula('x >= 1').kind).toBe('comp');
  });

  it('parsea conjunción y disyunción con precedencia', () => {
    // x > 0 & y > 0 | z > 0  →  (x>0 & y>0) | z>0
    const f = parseFormula('x > 0 & y > 0 | z > 0');
    expect(f.kind).toBe('or');
  });

  it('parsea implicación con asociatividad derecha', () => {
    const f = parseFormula('x = 0 -> y = 1 -> z = 2');
    expect(f.kind).toBe('implies');
  });

  it('parsea booleanos true/false', () => {
    expect(parseFormula('true')).toEqual({ kind: 'true' });
    expect(parseFormula('false')).toEqual({ kind: 'false' });
  });

  it('parsea negación', () => {
    expect(parseFormula('!(x = 0)').kind).toBe('not');
  });

  it('parsea modalidad [α]φ con asignación', () => {
    const f = parseFormula('[ x := 0 ] x = 0');
    expect(f.kind).toBe('box');
    if (f.kind === 'box') {
      expect(f.program.kind).toBe('assign');
      expect(f.post.kind).toBe('comp');
    }
  });

  it('parsea modalidad ⟨α⟩φ con asignación', () => {
    const f = parseFormula('<x := 1> x > 0');
    expect(f.kind).toBe('diamond');
  });
});

describe('dl-hybrid parser — programas híbridos', () => {
  it('parsea asignación simple', () => {
    const p = parseProgram('x := x + 1');
    expect(p.kind).toBe('assign');
  });

  it('parsea asignación no determinista', () => {
    const p = parseProgram('x := *');
    expect(p.kind).toBe('nondet');
  });

  it('parsea test bloqueante', () => {
    const p = parseProgram('?(x > 0)');
    expect(p.kind).toBe('test');
  });

  it('parsea secuencia', () => {
    const p = parseProgram('x := 0; x := x + 1');
    expect(p.kind).toBe('seq');
  });

  it('parsea choice con ++', () => {
    const p = parseProgram('x := 0 ++ x := 1');
    expect(p.kind).toBe('choice');
  });

  it('parsea loop con *', () => {
    const p = parseProgram('(x := x + 1)*');
    expect(p.kind).toBe('loop');
  });

  it('parsea ODE con dominio', () => {
    const p = parseProgram("{x' = 1 & x < 10}");
    expect(p.kind).toBe('ode');
    if (p.kind === 'ode') {
      expect(p.system.equations).toHaveLength(1);
      expect(p.system.equations[0]?.varName).toBe('x');
      expect(p.system.domain).toBeDefined();
    }
  });

  it('parsea ODE multi-variable', () => {
    const p = parseProgram("{x' = 1, y' = 2}");
    expect(p.kind).toBe('ode');
    if (p.kind === 'ode') {
      expect(p.system.equations).toHaveLength(2);
    }
  });

  it('round-trip: programToString invertible para casos simples', () => {
    const p = parseProgram('x := x + 1');
    const s = programToString(p);
    const p2 = parseProgram(s);
    expect(p2.kind).toBe(p.kind);
  });

  it('round-trip: formulaToString preserva estructura', () => {
    const f = parseFormula('x > 0');
    expect(formulaToString(f)).toBe('x > 0');
  });

  it('round-trip: termToString recoge variables', () => {
    const t = parseTerm('x + 1');
    expect(termToString(t)).toContain('x');
    expect(termToString(t)).toContain('1');
  });

  it('rechaza tokens sobrantes', () => {
    expect(() => parseFormula('x = 0 xxx')).toThrow();
  });

  it('rechaza paréntesis no balanceados', () => {
    expect(() => parseFormula('(x = 0')).toThrow();
  });
});
