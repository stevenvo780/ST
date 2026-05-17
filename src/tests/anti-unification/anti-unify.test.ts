// ============================================================
// Tests — Anti-unification (lgg / Plotkin)
// ============================================================
//
// Casos cubiertos:
//   - Igualdad estructural: lgg(t, t) = t sin vars.
//   - Cabeza común: lgg argument-wise.
//   - Cabeza distinta: fresh var.
//   - Reuso de fresh var para desacuerdos duplicados (clave para lgg).
//   - Verificación de las dos sustituciones.
//   - n-way con asociatividad.
//   - generalizationOrder con todos los casos.

import { describe, expect, it } from 'vitest';
import {
  antiUnify,
  antiUnifyMany,
  antiUnifyManyDetailed,
  applySubst,
  c,
  defaultFreshSupply,
  f,
  generalizationOrder,
  termEquals,
  v,
  varsOf,
} from '../../runtime/anti-unification';

describe('anti-unification — caso base', () => {
  it('lgg(a, a) = a sin variables introducidas', () => {
    const result = antiUnify(c('a'), c('a'));
    expect(termEquals(result.generalization, c('a'))).toBe(true);
    expect(result.variables).toHaveLength(0);
    expect(result.substLeft.size).toBe(0);
    expect(result.substRight.size).toBe(0);
  });

  it('lgg(X, X) = X (variables iguales no introducen fresh)', () => {
    const result = antiUnify(v('X'), v('X'));
    expect(termEquals(result.generalization, v('X'))).toBe(true);
    expect(result.variables).toHaveLength(0);
  });
});

describe('anti-unification — cabeza común', () => {
  it('lgg(f(a, b), f(a, c)) = f(a, V) con substs correctas', () => {
    const result = antiUnify(f('f', c('a'), c('b')), f('f', c('a'), c('c')));
    expect(result.variables).toHaveLength(1);
    const vname = result.variables[0];
    expect(vname).toBeDefined();
    if (vname === undefined) return;
    expect(termEquals(result.generalization, f('f', c('a'), v(vname)))).toBe(true);
    expect(termEquals(result.substLeft.get(vname)!, c('b'))).toBe(true);
    expect(termEquals(result.substRight.get(vname)!, c('c'))).toBe(true);
    // σ_L(g) = t1 y σ_R(g) = t2
    expect(
      termEquals(applySubst(result.generalization, result.substLeft), f('f', c('a'), c('b'))),
    ).toBe(true);
    expect(
      termEquals(applySubst(result.generalization, result.substRight), f('f', c('a'), c('c'))),
    ).toBe(true);
  });

  it('lgg(f(a), f(a)) = f(a) sin variables', () => {
    const result = antiUnify(f('f', c('a')), f('f', c('a')));
    expect(termEquals(result.generalization, f('f', c('a')))).toBe(true);
    expect(result.variables).toHaveLength(0);
  });
});

describe('anti-unification — cabeza distinta', () => {
  it('lgg(f(a), g(a)) = fresh var (funciones diferentes)', () => {
    const result = antiUnify(f('f', c('a')), f('g', c('a')));
    expect(result.variables).toHaveLength(1);
    expect(result.generalization.kind).toBe('var');
    const vname = result.variables[0];
    expect(vname).toBeDefined();
    if (vname === undefined) return;
    expect(termEquals(result.substLeft.get(vname)!, f('f', c('a')))).toBe(true);
    expect(termEquals(result.substRight.get(vname)!, f('g', c('a')))).toBe(true);
  });

  it('lgg(a, b) = fresh var (constantes distintas)', () => {
    const result = antiUnify(c('a'), c('b'));
    expect(result.generalization.kind).toBe('var');
    expect(result.variables).toHaveLength(1);
  });

  it('lgg(f(a, b), g(a, b)) = fresh var (no comparten cabeza)', () => {
    const result = antiUnify(f('f', c('a'), c('b')), f('g', c('a'), c('b')));
    // La cabeza difiere → un solo fresh var, sin recursar en args.
    expect(result.variables).toHaveLength(1);
    expect(result.generalization.kind).toBe('var');
  });
});

describe('anti-unification — aridad distinta', () => {
  it('lgg(f(a), f(a, b)) = fresh var (misma cabeza pero aridad distinta)', () => {
    const result = antiUnify(f('f', c('a')), f('f', c('a'), c('b')));
    expect(result.variables).toHaveLength(1);
    expect(result.generalization.kind).toBe('var');
  });
});

describe('anti-unification — desacuerdo repetido se comparte', () => {
  it('lgg(p(a, a), p(b, b)) = p(V, V) (misma fresh var en ambas posiciones)', () => {
    const result = antiUnify(f('p', c('a'), c('a')), f('p', c('b'), c('b')));
    expect(result.variables).toHaveLength(1);
    const vname = result.variables[0];
    expect(vname).toBeDefined();
    if (vname === undefined) return;
    expect(termEquals(result.generalization, f('p', v(vname), v(vname)))).toBe(true);
    // Validamos que la generalización es LEAST: σ_L(g) = t1.
    expect(
      termEquals(applySubst(result.generalization, result.substLeft), f('p', c('a'), c('a'))),
    ).toBe(true);
    expect(
      termEquals(applySubst(result.generalization, result.substRight), f('p', c('b'), c('b'))),
    ).toBe(true);
  });

  it('lgg(f(a, b, c), f(b, a, c)) = f(X, Y, c) con swaps en cada lado', () => {
    const result = antiUnify(f('f', c('a'), c('b'), c('c')), f('f', c('b'), c('a'), c('c')));
    // Dos desacuerdos: (a,b) en pos 0 y (b,a) en pos 1. Son pares
    // distintos → dos fresh vars.
    expect(result.variables).toHaveLength(2);
    const [x, y] = result.variables;
    expect(x).toBeDefined();
    expect(y).toBeDefined();
    if (x === undefined || y === undefined) return;
    expect(termEquals(result.generalization, f('f', v(x), v(y), c('c')))).toBe(true);
    // Left: X→a, Y→b. Right: X→b, Y→a.
    expect(termEquals(result.substLeft.get(x)!, c('a'))).toBe(true);
    expect(termEquals(result.substLeft.get(y)!, c('b'))).toBe(true);
    expect(termEquals(result.substRight.get(x)!, c('b'))).toBe(true);
    expect(termEquals(result.substRight.get(y)!, c('a'))).toBe(true);
  });
});

describe('anti-unification — desacuerdos anidados', () => {
  it('lgg(f(g(a), g(b)), f(g(c), g(d))) = f(g(V1), g(V2))', () => {
    const result = antiUnify(
      f('f', f('g', c('a')), f('g', c('b'))),
      f('f', f('g', c('c')), f('g', c('d'))),
    );
    expect(result.variables).toHaveLength(2);
    expect(
      termEquals(
        applySubst(result.generalization, result.substLeft),
        f('f', f('g', c('a')), f('g', c('b'))),
      ),
    ).toBe(true);
    expect(
      termEquals(
        applySubst(result.generalization, result.substRight),
        f('f', f('g', c('c')), f('g', c('d'))),
      ),
    ).toBe(true);
  });

  it('lgg(h(x, x), h(y, z)) — variables como términos comunes y distintos', () => {
    // h(x, x) vs h(y, z): pos 0 desacuerdo (x, y), pos 1 desacuerdo (x, z).
    // Son pares DISTINTOS porque el segundo componente difiere → dos
    // fresh vars distintas.
    const result = antiUnify(f('h', v('x'), v('x')), f('h', v('y'), v('z')));
    expect(result.variables).toHaveLength(2);
  });
});

describe('antiUnifyMany — n-way lgg', () => {
  it('lgg de 3 términos f(a, b), f(a, c), f(a, d) = f(a, V)', () => {
    const result = antiUnifyMany([
      f('f', c('a'), c('b')),
      f('f', c('a'), c('c')),
      f('f', c('a'), c('d')),
    ]);
    expect(result.variables).toHaveLength(1);
    expect(result.generalization.kind).toBe('func');
    if (result.generalization.kind !== 'func') return;
    expect(result.generalization.name).toBe('f');
    expect(result.generalization.args).toBeDefined();
    expect((result.generalization.args ?? [])[0]).toEqual(c('a'));
  });

  it('lgg de 1 término devuelve el término mismo sin variables', () => {
    const result = antiUnifyMany([f('f', c('a'))]);
    expect(termEquals(result.generalization, f('f', c('a')))).toBe(true);
    expect(result.variables).toHaveLength(0);
  });

  it('lgg de array vacío lanza', () => {
    expect(() => antiUnifyMany([])).toThrow();
  });

  it('antiUnifyManyDetailed devuelve N sustituciones, una por término', () => {
    const terms = [f('p', c('a'), c('a')), f('p', c('b'), c('b')), f('p', c('c'), c('c'))];
    const result = antiUnifyManyDetailed(terms);
    expect(result.substs).toHaveLength(3);
    for (let i = 0; i < terms.length; i++) {
      const ti = terms[i];
      const si = result.substs[i];
      expect(ti).toBeDefined();
      expect(si).toBeDefined();
      if (ti === undefined || si === undefined) continue;
      expect(termEquals(applySubst(result.generalization, si), ti)).toBe(true);
    }
  });
});

describe('generalizationOrder', () => {
  it('X es más general que f(X) → orden -1', () => {
    expect(generalizationOrder(v('X'), f('f', v('X')))).toBe(-1);
  });

  it('f(X) es menos general que X → orden +1 (sentido inverso)', () => {
    expect(generalizationOrder(f('f', v('X')), v('X'))).toBe(1);
  });

  it('términos idénticos → 0', () => {
    expect(generalizationOrder(f('f', c('a')), f('f', c('a')))).toBe(0);
  });

  it('renombre puro de variables → 0 (equivalentes)', () => {
    expect(generalizationOrder(f('f', v('X')), f('f', v('Y')))).toBe(0);
  });

  it('incomparables: f(X) vs g(X) → null', () => {
    expect(generalizationOrder(f('f', v('X')), f('g', v('X')))).toBe(null);
  });

  it('f(X, X) vs f(X, Y): la primera es menos general (más específica) que la segunda', () => {
    // f(X, Y) σ-instancia a f(X, X) con σ = {Y → X}.
    // f(X, X) NO σ-instancia a f(X, Y) (variables del pattern no se pueden duplicar libremente).
    // Resultado: f(X, Y) más general → generalizationOrder(f(X,X), f(X,Y)) = +1.
    expect(generalizationOrder(f('f', v('X'), v('X')), f('f', v('X'), v('Y')))).toBe(1);
  });
});

describe('antiUnify — verificación de propiedades invariantes', () => {
  it('para cualquier par (t1, t2), σ_L(g) = t1 y σ_R(g) = t2', () => {
    const pairs: [
      import('../../runtime/anti-unification').Term,
      import('../../runtime/anti-unification').Term,
    ][] = [
      [f('add', c('1'), c('2')), f('add', c('3'), c('4'))],
      [f('node', v('x'), f('leaf')), f('node', v('y'), f('leaf'))],
      [c('zero'), f('succ', c('zero'))],
      [f('cons', c('a'), c('nil')), f('cons', c('b'), f('cons', c('c'), c('nil')))],
    ];
    for (const [t1, t2] of pairs) {
      const result = antiUnify(t1, t2);
      expect(termEquals(applySubst(result.generalization, result.substLeft), t1)).toBe(true);
      expect(termEquals(applySubst(result.generalization, result.substRight), t2)).toBe(true);
      // Las variables de la generalización deben ser exactamente las
      // reportadas en `variables` (módulo el orden).
      expect(new Set(varsOf(result.generalization))).toEqual(new Set(result.variables));
    }
  });

  it('freshSupply custom controla los nombres de variables', () => {
    let i = 0;
    const supply = () => `Z${i++}`;
    const result = antiUnify(f('f', c('a'), c('b')), f('f', c('c'), c('d')), supply);
    expect(result.variables).toEqual(['Z0', 'Z1']);
  });

  it('defaultFreshSupply con prefijo personalizado genera nombres consistentes', () => {
    const supply = defaultFreshSupply('var_');
    const result = antiUnify(c('a'), c('b'), supply);
    expect(result.variables[0]).toBe('var_0');
  });
});
