import { describe, it, expect } from 'vitest';
import {
  differentiate,
  simplify,
  evaluate,
  gradient,
  parse,
  toString,
  exprEquals,
  cst,
  v,
  add,
  mul,
  sub,
  div,
  pow,
  neg,
  sin,
  cos,
  tan,
  log,
  exp,
} from '../../runtime/symbolic-diff';
import type { Expr } from '../../runtime/symbolic-diff';

/**
 * Verificación numérica de la derivada: compara differentiate(f,x) con
 * un cociente diferencial centrado en varios puntos.
 */
function numericDerivative(expr: Expr, varName: string, x0: number, env: Record<string, number> = {}): number {
  const h = 1e-6;
  const envPlus = { ...env, [varName]: x0 + h };
  const envMinus = { ...env, [varName]: x0 - h };
  return (evaluate(expr, envPlus) - evaluate(expr, envMinus)) / (2 * h);
}

function assertDerivativeMatches(
  f: Expr,
  varName: string,
  points: number[],
  extraEnv: Record<string, number> = {},
  tol = 1e-4
): void {
  const df = differentiate(f, varName);
  for (const x of points) {
    const env = { ...extraEnv, [varName]: x };
    const symbolic = evaluate(df, env);
    const numeric = numericDerivative(f, varName, x, extraEnv);
    expect(Math.abs(symbolic - numeric)).toBeLessThan(tol);
  }
}

describe('differentiate — reglas básicas', () => {
  it('d/dx(x^2) = 2x', () => {
    const f = pow(v('x'), cst(2));
    const df = differentiate(f, 'x');
    expect(evaluate(df, { x: 0 })).toBe(0);
    expect(evaluate(df, { x: 3 })).toBe(6);
    expect(evaluate(df, { x: -5 })).toBe(-10);
  });

  it('d/dx(sin(x)) = cos(x)', () => {
    const f = sin(v('x'));
    const df = differentiate(f, 'x');
    for (const x of [0, 0.5, 1, Math.PI / 4, -1.2]) {
      expect(Math.abs(evaluate(df, { x }) - Math.cos(x))).toBeLessThan(1e-12);
    }
  });

  it('d/dx(cos(x)) = -sin(x)', () => {
    const f = cos(v('x'));
    const df = differentiate(f, 'x');
    for (const x of [0, 0.7, 1.5, -2]) {
      expect(Math.abs(evaluate(df, { x }) - -Math.sin(x))).toBeLessThan(1e-12);
    }
  });

  it('d/dx(c) = 0 (constante)', () => {
    const df = differentiate(cst(42), 'x');
    expect(evaluate(df, { x: 7 })).toBe(0);
  });

  it('d/dx(x) = 1, d/dy(x) = 0', () => {
    expect(evaluate(differentiate(v('x'), 'x'), { x: 99 })).toBe(1);
    expect(evaluate(differentiate(v('x'), 'y'), { x: 99, y: 0 })).toBe(0);
  });
});

describe('differentiate — regla del producto', () => {
  it('d/dx(x*sin(x)) = sin(x) + x*cos(x)', () => {
    const f = mul(v('x'), sin(v('x')));
    assertDerivativeMatches(f, 'x', [-1, 0.3, 1.0, 2.5]);
  });

  it('producto de 3 factores: d/dx(x * x * x) = 3x^2', () => {
    const f = mul(v('x'), v('x'), v('x'));
    const df = differentiate(f, 'x');
    for (const x of [-2, -0.5, 0, 1, 4]) {
      expect(Math.abs(evaluate(df, { x }) - 3 * x * x)).toBeLessThan(1e-9);
    }
  });
});

describe('differentiate — regla del cociente', () => {
  it('d/dx(sin(x)/x) coincide con derivada numérica', () => {
    const f = div(sin(v('x')), v('x'));
    // Evitamos x=0 (singularidad)
    assertDerivativeMatches(f, 'x', [0.5, 1.2, 2.0, -1.5]);
  });

  it('d/dx(1/x) = -1/x^2', () => {
    const f = div(cst(1), v('x'));
    const df = differentiate(f, 'x');
    for (const x of [1, 2, -3, 0.5]) {
      expect(Math.abs(evaluate(df, { x }) - -1 / (x * x))).toBeLessThan(1e-9);
    }
  });
});

describe('differentiate — regla de la cadena', () => {
  it('d/dx(exp(x^2)) = 2x*exp(x^2)', () => {
    const f = exp(pow(v('x'), cst(2)));
    assertDerivativeMatches(f, 'x', [-1, 0, 0.5, 1, 1.5]);
  });

  it('d/dx(sin(2*x)) = 2*cos(2*x)', () => {
    const f = sin(mul(cst(2), v('x')));
    const df = differentiate(f, 'x');
    for (const x of [0, 0.3, 1.1, -0.7]) {
      expect(Math.abs(evaluate(df, { x }) - 2 * Math.cos(2 * x))).toBeLessThan(1e-12);
    }
  });

  it('d/dx(log(x^2 + 1)) coincide con derivada numérica', () => {
    const f = log(add(pow(v('x'), cst(2)), cst(1)));
    assertDerivativeMatches(f, 'x', [-2, -0.5, 0, 1, 3]);
  });

  it('d/dx(cos(sin(x))) coincide con derivada numérica', () => {
    const f = cos(sin(v('x')));
    assertDerivativeMatches(f, 'x', [-1, 0, 0.5, 1.2]);
  });
});

describe('differentiate — potencias y exponenciales', () => {
  it('d/dx(2^x) = 2^x * ln(2)', () => {
    const f = pow(cst(2), v('x'));
    const df = differentiate(f, 'x');
    for (const x of [0, 1, 2, -1]) {
      const expected = Math.pow(2, x) * Math.log(2);
      expect(Math.abs(evaluate(df, { x }) - expected)).toBeLessThan(1e-9);
    }
  });

  it('d/dx(x^x) general (base y exponente con x)', () => {
    const f = pow(v('x'), v('x'));
    assertDerivativeMatches(f, 'x', [0.5, 1, 2, 3]);
  });

  it('d/dx(tan(x)) = 1/cos(x)^2 = sec^2(x)', () => {
    const f = tan(v('x'));
    assertDerivativeMatches(f, 'x', [0, 0.3, 0.7, -0.5]);
  });
});

describe('differentiate — operaciones adicionales', () => {
  it('d/dx(-x^3) = -3x^2', () => {
    const f = neg(pow(v('x'), cst(3)));
    const df = differentiate(f, 'x');
    for (const x of [-2, -0.5, 0, 1, 4]) {
      expect(Math.abs(evaluate(df, { x }) - -3 * x * x)).toBeLessThan(1e-9);
    }
  });

  it('d/dx(x^2 - 2*x + 1) = 2x - 2', () => {
    const f = add(sub(pow(v('x'), cst(2)), mul(cst(2), v('x'))), cst(1));
    const df = differentiate(f, 'x');
    for (const x of [-3, 0, 1, 5]) {
      expect(Math.abs(evaluate(df, { x }) - (2 * x - 2))).toBeLessThan(1e-9);
    }
  });
});

describe('simplify', () => {
  it('x + 0 + 0 = x', () => {
    const e = add(v('x'), cst(0), cst(0));
    expect(toString(simplify(e))).toBe('x');
  });

  it('x * 1 = x', () => {
    expect(toString(simplify(mul(v('x'), cst(1))))).toBe('x');
  });

  it('x * 0 = 0', () => {
    expect(toString(simplify(mul(v('x'), cst(0))))).toBe('0');
  });

  it('x^0 = 1', () => {
    expect(toString(simplify(pow(v('x'), cst(0))))).toBe('1');
  });

  it('x^1 = x', () => {
    expect(toString(simplify(pow(v('x'), cst(1))))).toBe('x');
  });

  it('constant folding aritmético: 2 + 3 * 4 = 14', () => {
    const e = add(cst(2), mul(cst(3), cst(4)));
    const s = simplify(e);
    expect(s.kind).toBe('const');
    if (s.kind === 'const') expect(s.value).toBe(14);
  });

  it('neg(neg(x)) = x', () => {
    expect(toString(simplify(neg(neg(v('x')))))).toBe('x');
  });

  it('flatten nested add: (a+b)+(c+d) → suma plana', () => {
    const e = add(add(v('a'), v('b')), add(v('c'), v('d')));
    const s = simplify(e);
    expect(s.kind).toBe('add');
    if (s.kind === 'add') expect(s.args.length).toBe(4);
  });
});

describe('evaluate', () => {
  it('evalúa expresiones con múltiples variables', () => {
    const e = add(mul(v('x'), v('y')), v('z'));
    expect(evaluate(e, { x: 2, y: 3, z: 7 })).toBe(13);
  });

  it('lanza error si variable no está en env', () => {
    expect(() => evaluate(v('w'), {})).toThrow();
  });

  it('evalúa funciones trascendentales', () => {
    expect(Math.abs(evaluate(sin(cst(0)), {}) - 0)).toBeLessThan(1e-12);
    expect(Math.abs(evaluate(cos(cst(0)), {}) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(evaluate(exp(cst(1)), {}) - Math.E)).toBeLessThan(1e-12);
    expect(Math.abs(evaluate(log(cst(Math.E)), {}) - 1)).toBeLessThan(1e-12);
  });
});

describe('gradient', () => {
  it('retorna N derivadas parciales', () => {
    const f = add(mul(v('x'), v('x')), mul(v('y'), v('y')));
    const grad = gradient(f, ['x', 'y']);
    expect(grad.length).toBe(2);
    // ∂/∂x = 2x
    const dfdxX = grad[0];
    const dfdxY = grad[1];
    expect(dfdxX).toBeDefined();
    expect(dfdxY).toBeDefined();
    if (dfdxX) {
      expect(evaluate(dfdxX, { x: 3, y: 99 })).toBe(6);
    }
    if (dfdxY) {
      expect(evaluate(dfdxY, { x: 99, y: 4 })).toBe(8);
    }
  });

  it('gradient de función con 3 variables y término cruzado', () => {
    // f(x,y,z) = x*y + y*z
    const f = add(mul(v('x'), v('y')), mul(v('y'), v('z')));
    const grad = gradient(f, ['x', 'y', 'z']);
    expect(grad.length).toBe(3);
    const env = { x: 2, y: 5, z: 7 };
    const g0 = grad[0];
    const g1 = grad[1];
    const g2 = grad[2];
    expect(g0).toBeDefined();
    expect(g1).toBeDefined();
    expect(g2).toBeDefined();
    if (g0 && g1 && g2) {
      expect(evaluate(g0, env)).toBe(5); // ∂/∂x = y
      expect(evaluate(g1, env)).toBe(9); // ∂/∂y = x + z
      expect(evaluate(g2, env)).toBe(5); // ∂/∂z = y
    }
  });
});

describe('parse + toString round-trip', () => {
  it('parsea polinomio simple', () => {
    const e = parse('x^2 + 3*x + 2');
    for (const x of [-2, -1, 0, 1, 2]) {
      expect(evaluate(e, { x })).toBe(x * x + 3 * x + 2);
    }
  });

  it('parsea función trascendental con argumento compuesto', () => {
    const e = parse('sin(2*x + 1)');
    for (const x of [0, 0.5, 1.2]) {
      expect(Math.abs(evaluate(e, { x }) - Math.sin(2 * x + 1))).toBeLessThan(1e-12);
    }
  });

  it('parsea potencias right-assoc: 2^3^2 = 2^(3^2) = 512', () => {
    const e = parse('2^3^2');
    expect(evaluate(e, {})).toBe(512);
  });

  it('parse + differentiate end-to-end', () => {
    const e = parse('x^3 - 2*x + 5');
    const de = differentiate(e, 'x');
    // d/dx = 3x^2 - 2
    for (const x of [-1, 0, 2]) {
      expect(Math.abs(evaluate(de, { x }) - (3 * x * x - 2))).toBeLessThan(1e-9);
    }
  });

  it('parse maneja unary minus', () => {
    const e = parse('-x + 5');
    expect(evaluate(e, { x: 3 })).toBe(2);
  });

  it('parse falla con tokens sobrantes', () => {
    expect(() => parse('x + +')).toThrow();
  });
});

describe('exprEquals', () => {
  it('detecta igualdad estructural', () => {
    expect(exprEquals(add(v('x'), cst(1)), add(v('x'), cst(1)))).toBe(true);
    expect(exprEquals(add(v('x'), cst(1)), add(v('x'), cst(2)))).toBe(false);
    expect(exprEquals(cst(3), cst(3))).toBe(true);
    expect(exprEquals(sin(v('x')), cos(v('x')))).toBe(false);
  });
});

describe('end-to-end: validación numérica de derivadas', () => {
  it('expresiones aleatorias derivadas simbólicamente coinciden con derivada numérica', () => {
    const cases: Array<{ expr: Expr; var: string; points: number[] }> = [
      { expr: parse('x^4 + 2*x^2 - x + 7'), var: 'x', points: [-2, -0.5, 0.5, 2] },
      { expr: parse('sin(x) * cos(x)'), var: 'x', points: [0, 0.5, 1, 2] },
      { expr: parse('exp(x) / (1 + x^2)'), var: 'x', points: [-1, 0, 1, 2] },
      { expr: parse('log(x*x + 1) + sin(x)'), var: 'x', points: [-1, 0, 1, 2.5] },
      { expr: parse('(x + 1)^3'), var: 'x', points: [-2, 0, 2] },
    ];
    for (const tc of cases) {
      assertDerivativeMatches(tc.expr, tc.var, tc.points);
    }
  });
});
