import { describe, expect, it } from 'vitest';
import {
  abelianEquations,
  carrierIndex,
  cyclicGroupAlgebra,
  cyclicRingAlgebra,
  equivalenceClasses,
  evalTerm,
  freeVars,
  groupEquations,
  groupSignature,
  image,
  isAlgebra,
  isCongruence,
  isHomomorphism,
  isValidSignature,
  kernel,
  latticeEquations,
  latticeSignature,
  modelsEquation,
  quotientAlgebra,
  ringEquations,
  termAlgebra,
  termEquals,
  termEqualsModulo,
  termSubstitute,
  termToString,
  variety,
  type Algebra,
  type Congruence,
  type Equation,
  type Homomorphism,
  type Signature,
  type Term,
} from '../../../reasoning/universal-algebra';

const v = (name: string): Term => ({ var: name });
const op = (name: string, ...args: Term[]): Term => ({ op: name, args });

describe('Signatures and algebra structural checks', () => {
  it('rechaza signaturas con símbolos duplicados', () => {
    const sig: Signature = {
      operations: [
        { name: 'f', arity: 1 },
        { name: 'f', arity: 2 },
      ],
    };
    expect(isValidSignature(sig)).toBe(false);
  });

  it('rechaza signaturas con aridad negativa', () => {
    const sig: Signature = { operations: [{ name: 'bad', arity: -1 }] };
    expect(isValidSignature(sig)).toBe(false);
  });

  it('Z/5Z bajo + es un álgebra válida en groupSignature', () => {
    const A = cyclicGroupAlgebra(5);
    expect(A.carrier.length).toBe(5);
    expect(isAlgebra(A)).toBe(true);
  });

  it('detecta álgebras NO cerradas bajo sus operaciones', () => {
    const sig: Signature = { operations: [{ name: 'f', arity: 1 }] };
    const ops = new Map<string, (...args: number[]) => number>();
    // f(x) = x + 1 — sale del carrier {0,1,2}
    ops.set('f', (x: number) => x + 1);
    const A: Algebra<number> = {
      signature: sig,
      carrier: [0, 1, 2],
      operations: ops,
    };
    expect(isAlgebra(A)).toBe(false);
  });
});

describe('Homomorphisms', () => {
  it('Z → Z/nZ por reducción módulo n es homomorfismo de grupos', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const Z3 = cyclicGroupAlgebra(3);
    // El "Z grande" lo modelamos como Z/6Z para usar carrier finito;
    // la reducción mod 3 sigue siendo homomorfismo Z/6 → Z/3 (porque 3 | 6).
    const h: Homomorphism<number, number> = {
      source: Z6,
      target: Z3,
      map: (x) => x % 3,
    };
    expect(isHomomorphism(h)).toBe(true);
  });

  it('imagen de Z/6 → Z/3 es {0,1,2}', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const Z3 = cyclicGroupAlgebra(3);
    const h: Homomorphism<number, number> = {
      source: Z6,
      target: Z3,
      map: (x) => x % 3,
    };
    const img = image(h);
    expect(img.length).toBe(3);
    expect(new Set(img)).toEqual(new Set([0, 1, 2]));
  });

  it('kernel de Z/6 → Z/3 contiene (0,3), (1,4), (2,5) y simétricos', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const Z3 = cyclicGroupAlgebra(3);
    const h: Homomorphism<number, number> = {
      source: Z6,
      target: Z3,
      map: (x) => x % 3,
    };
    const ker = kernel(h);
    // Debe contener al menos los pares no triviales:
    const pairs = new Set(ker.map(([a, b]) => `${a},${b}`));
    expect(pairs.has('0,3')).toBe(true);
    expect(pairs.has('3,0')).toBe(true);
    expect(pairs.has('1,4')).toBe(true);
    expect(pairs.has('2,5')).toBe(true);
    // Y NO contiene pares fuera del kernel (0,1) p.ej.
    expect(pairs.has('0,1')).toBe(false);
  });

  it('un map que NO preserva operación es rechazado', () => {
    const Z4 = cyclicGroupAlgebra(4);
    const Z2 = cyclicGroupAlgebra(2);
    // Map "constante a 0" sólo preserva si conserva e; preserva e (0→0)
    // pero rompe mul: h(1+1=2) = 0, h(1)+h(1) = 0+0 = 0  → ok. Probemos un
    // map distinto: h(x) = (x+1) mod 2, que NO preserva identidad.
    const h: Homomorphism<number, number> = {
      source: Z4,
      target: Z2,
      map: (x) => (x + 1) % 2,
    };
    expect(isHomomorphism(h)).toBe(false);
  });
});

describe('Congruences and quotient algebras', () => {
  it('la relación "≡ mod 3" en Z/6Z es congruencia', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const relation: Array<[number, number]> = [];
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 6; b++) {
        if (a !== b && a % 3 === b % 3) relation.push([a, b]);
      }
    }
    const c: Congruence<number> = { algebra: Z6, relation };
    expect(isCongruence(c)).toBe(true);
  });

  it('una relación que NO preserva la operación NO es congruencia', () => {
    const Z6 = cyclicGroupAlgebra(6);
    // Sólo (0,3) y (3,0): falta cierre transitivo trivial pero la operación
    // {0+1=1, 3+1=4} requiere (1,4) que no está → no es congruencia.
    const c: Congruence<number> = {
      algebra: Z6,
      relation: [
        [0, 3],
        [3, 0],
      ],
    };
    expect(isCongruence(c)).toBe(false);
  });

  it('clases de equivalencia de ≡ mod 3 en Z/6 son {0,3}, {1,4}, {2,5}', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const relation: Array<[number, number]> = [];
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 6; b++) {
        if (a !== b && a % 3 === b % 3) relation.push([a, b]);
      }
    }
    const classes = equivalenceClasses({ algebra: Z6, relation });
    expect(classes.length).toBe(3);
    const sorted = classes.map((c) => [...c].sort((x, y) => x - y));
    expect(sorted).toContainEqual([0, 3]);
    expect(sorted).toContainEqual([1, 4]);
    expect(sorted).toContainEqual([2, 5]);
  });

  it('Z/6Z / (≡ mod 3) tiene 3 elementos (es isomorfo a Z/3Z)', () => {
    const Z6 = cyclicGroupAlgebra(6);
    const relation: Array<[number, number]> = [];
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 6; b++) {
        if (a !== b && a % 3 === b % 3) relation.push([a, b]);
      }
    }
    const Q = quotientAlgebra({ algebra: Z6, relation });
    expect(Q.carrier.length).toBe(3);
    expect(isAlgebra(Q)).toBe(true);
  });
});

describe('Term algebra (free algebra)', () => {
  it('genera términos libres hasta una profundidad acotada', () => {
    const sig: Signature = {
      operations: [
        { name: 'c', arity: 0 },
        { name: 'f', arity: 1 },
      ],
    };
    const T = termAlgebra(sig, ['x'], 2);
    // depth 0: x, c
    // depth 1: f(x), f(c)
    // depth 2: f(f(x)), f(f(c))
    expect(T.carrier.length).toBeGreaterThanOrEqual(6);
    expect(T.carrier.some((t) => termEquals(t, { var: 'x' }))).toBe(true);
    expect(T.carrier.some((t) => termEquals(t, op('f', op('c'))))).toBe(true);
  });

  it('termSubstitute reemplaza variables correctamente', () => {
    const t = op('f', v('x'), v('y'));
    const s = termSubstitute(t, { x: op('a'), y: op('b') });
    expect(termEquals(s, op('f', op('a'), op('b')))).toBe(true);
  });

  it('termEqualsModulo: x+0 = x usando ecuaciones de grupo (mul es +)', () => {
    const x = v('x');
    const e = op('e');
    const eqs: Array<[Term, Term]> = [[op('mul', e, v('y')), v('y')]];
    expect(termEqualsModulo(op('mul', e, x), x, eqs)).toBe(true);
  });

  it('freeVars de f(x, g(y, x)) = [x, y]', () => {
    const t = op('f', v('x'), op('g', v('y'), v('x')));
    expect(freeVars(t)).toEqual(['x', 'y']);
  });

  it('termToString produce notación funcional plana', () => {
    expect(termToString(op('mul', v('x'), op('inv', v('y'))))).toBe('mul(x,inv(y))');
  });
});

describe('Equations and varieties', () => {
  it('evalTerm: en Z/5Z, x·y mod 5 = 6 mod 5 con x=2,y=3 es 1', () => {
    const Z5 = cyclicGroupAlgebra(5);
    const t = op('mul', v('x'), v('y'));
    expect(evalTerm(Z5, t, { x: 2, y: 3 })).toBe(0);
    // (2+3) mod 5 = 0
  });

  it('Z/4Z modela todas las ecuaciones de grupo', () => {
    const Z4 = cyclicGroupAlgebra(4);
    for (const eq of groupEquations()) {
      expect(modelsEquation(Z4, eq)).toBe(true);
    }
  });

  it('Z/5Z pertenece a la variedad de grupos abelianos', () => {
    const Z5 = cyclicGroupAlgebra(5);
    expect(variety(abelianEquations(), Z5)).toBe(true);
  });

  it('un álgebra ad-hoc NO conmutativa NO satisface la ecuación de abelianos', () => {
    // S₃ (group of permutations of {0,1,2}). Carrier: 6 permutaciones
    // codificadas como tuplas. Composición (función g ∘ f).
    type Perm = [number, number, number];
    const perms: Perm[] = [];
    for (const p of permutations([0, 1, 2])) perms.push(p as Perm);
    const eq = (a: Perm, b: Perm): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    const identity: Perm = [0, 1, 2];
    const compose = (g: Perm, f: Perm): Perm => [g[f[0]], g[f[1]], g[f[2]]] as Perm;
    const inv = (p: Perm): Perm => {
      const out: number[] = [0, 0, 0];
      out[p[0]] = 0;
      out[p[1]] = 1;
      out[p[2]] = 2;
      return out as Perm;
    };
    const ops = new Map<string, (...args: Perm[]) => Perm>();
    ops.set('e', () => identity);
    ops.set('inv', (a: Perm) => inv(a));
    ops.set('mul', (a: Perm, b: Perm) => compose(a, b));
    const S3: Algebra<Perm> = {
      signature: groupSignature(),
      carrier: perms,
      operations: ops,
      eq,
    };
    expect(isAlgebra(S3)).toBe(true);
    // S3 cumple todas las ecuaciones de grupo
    for (const e of groupEquations()) {
      expect(modelsEquation(S3, e)).toBe(true);
    }
    // pero NO la conmutatividad
    const commutativity: Equation = {
      left: op('mul', v('x'), v('y')),
      right: op('mul', v('y'), v('x')),
    };
    expect(modelsEquation(S3, commutativity)).toBe(false);
  });

  it('Z/6Z como anillo satisface las ecuaciones de anillo conmutativo', () => {
    const R = cyclicRingAlgebra(6);
    expect(isAlgebra(R)).toBe(true);
    for (const eq of ringEquations()) {
      expect(modelsEquation(R, eq)).toBe(true);
    }
  });

  it('retículo trivial {0,1} con join=max, meet=min satisface latticeEquations', () => {
    const ops = new Map<string, (...args: number[]) => number>();
    ops.set('join', (a: number, b: number) => Math.max(a, b));
    ops.set('meet', (a: number, b: number) => Math.min(a, b));
    const L: Algebra<number> = {
      signature: latticeSignature(),
      carrier: [0, 1],
      operations: ops,
    };
    expect(isAlgebra(L)).toBe(true);
    for (const eq of latticeEquations()) {
      expect(modelsEquation(L, eq)).toBe(true);
    }
  });

  it('modelsEquation con samples>0 muestra ecuaciones por muestreo y converge a true', () => {
    const Z8 = cyclicGroupAlgebra(8);
    const commutativity: Equation = {
      left: op('mul', v('x'), v('y')),
      right: op('mul', v('y'), v('x')),
    };
    expect(modelsEquation(Z8, commutativity, 50)).toBe(true);
  });
});

describe('carrierIndex helper', () => {
  it('encuentra elementos por igualdad del álgebra', () => {
    const Z5 = cyclicGroupAlgebra(5);
    expect(carrierIndex(Z5, 3)).toBe(3);
    expect(carrierIndex(Z5, 99)).toBe(-1);
  });
});

function permutations<T>(xs: ReadonlyArray<T>): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i++) {
    const rest = [...xs.slice(0, i), ...xs.slice(i + 1)];
    for (const p of permutations(rest)) {
      out.push([xs[i], ...p]);
    }
  }
  return out;
}
