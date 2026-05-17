import { describe, it, expect } from 'vitest';
import {
  vec,
  dot,
  norm,
  normalize,
  isOrthogonal,
  orthonormalBasis,
  span,
  isContained,
  equalsSubspace,
  meet,
  join,
  orthocomplement,
  zeroSubspace,
  topSubspace,
  makeQuantumLattice,
  isDistributive,
  isModular,
  isOrthomodular,
  isKSColorable,
  isKSColorableContexts,
  findOrthogonalTriples,
  kochenSpeckerTheorem3D,
  kochenSpeckerCabello18,
} from '../../../../logic/profiles/quantum';

describe('quantum logic — núcleo vectorial', () => {
  it('dot de vectores ortogonales es 0; norma de e1 es 1', () => {
    const e1 = vec([1, 0, 0]);
    const e2 = vec([0, 1, 0]);
    expect(dot(e1, e2)).toBeCloseTo(0, 12);
    expect(norm(e1)).toBeCloseTo(1, 12);
  });

  it('normalize escala al unitario; norma de cero lanza', () => {
    const v = vec([3, 4]);
    const u = normalize(v);
    expect(norm(u)).toBeCloseTo(1, 9);
    expect(() => normalize(vec([0, 0, 0]))).toThrow();
  });

  it('isOrthogonal: e1 y e2 en R^3 son ortogonales; e1 y (1,1,0) no', () => {
    expect(isOrthogonal(vec([1, 0, 0]), vec([0, 1, 0]))).toBe(true);
    expect(isOrthogonal(vec([1, 0, 0]), vec([1, 1, 0]))).toBe(false);
  });

  it('orthonormalBasis: 3 vectores LI en R^3 → 3 vectores ortonormales', () => {
    const basis = orthonormalBasis([vec([1, 1, 0]), vec([0, 1, 1]), vec([1, 0, 1])]);
    expect(basis).not.toBeNull();
    expect(basis!.length).toBe(3);
    for (const v of basis!) expect(norm(v)).toBeCloseTo(1, 9);
    for (let i = 0; i < basis!.length; i++)
      for (let j = i + 1; j < basis!.length; j++)
        expect(dot(basis![i], basis![j])).toBeCloseTo(0, 9);
  });

  it('orthonormalBasis: vectores LD colapsan a una dimensión inferior', () => {
    const basis = orthonormalBasis([vec([1, 0, 0]), vec([2, 0, 0]), vec([0, 1, 0])]);
    expect(basis).not.toBeNull();
    expect(basis!.length).toBe(2);
  });
});

describe('quantum logic — subespacios', () => {
  it('span de e1 y e2 tiene dimensión 2', () => {
    const s = span([vec([1, 0, 0]), vec([0, 1, 0])]);
    expect(s.dimension).toBe(2);
    expect(s.ambientDim).toBe(3);
  });

  it('span de dos colineales tiene dimensión 1', () => {
    const s = span([vec([1, 1, 0]), vec([3, 3, 0])]);
    expect(s.dimension).toBe(1);
  });

  it('isContained: e1 ⊆ span(e1, e2); pero e3 ⊄ span(e1, e2)', () => {
    const plane = span([vec([1, 0, 0]), vec([0, 1, 0])]);
    const xLine = span([vec([1, 0, 0])]);
    const zLine = span([vec([0, 0, 1])]);
    expect(isContained(xLine, plane)).toBe(true);
    expect(isContained(zLine, plane)).toBe(false);
  });

  it('meet de subespacios ortogonales (xy y z) es {0}', () => {
    const xy = span([vec([1, 0, 0]), vec([0, 1, 0])]);
    const z = span([vec([0, 0, 1])]);
    const m = meet(xy, z);
    expect(m.dimension).toBe(0);
  });

  it('meet de subespacios solapados (xy y xz) es la línea x', () => {
    const xy = span([vec([1, 0, 0]), vec([0, 1, 0])]);
    const xz = span([vec([1, 0, 0]), vec([0, 0, 1])]);
    const m = meet(xy, xz);
    expect(m.dimension).toBe(1);
    const xLine = span([vec([1, 0, 0])]);
    expect(equalsSubspace(m, xLine)).toBe(true);
  });

  it('join de e1 y e2 es el plano xy (dim 2)', () => {
    const a = span([vec([1, 0, 0])]);
    const b = span([vec([0, 1, 0])]);
    const j = join(a, b);
    expect(j.dimension).toBe(2);
    expect(j.ambientDim).toBe(3);
  });

  it('orthocomplement en R^2: span(e1)⊥ ≡ span(e2)', () => {
    const e1 = span([vec([1, 0])], 2);
    const perp = orthocomplement(e1);
    expect(perp.dimension).toBe(1);
    expect(equalsSubspace(perp, span([vec([0, 1])], 2))).toBe(true);
  });

  it('orthocomplement doble es identidad: (a⊥)⊥ = a', () => {
    const a = span([vec([1, 1, 0]), vec([0, 1, 1])]);
    const aPerpPerp = orthocomplement(orthocomplement(a));
    expect(equalsSubspace(aPerpPerp, a)).toBe(true);
  });

  it('orthocomplement: zero⊥ = top, top⊥ = zero', () => {
    const Z = zeroSubspace(3);
    const T = topSubspace(3);
    expect(equalsSubspace(orthocomplement(Z, 3), T)).toBe(true);
    expect(equalsSubspace(orthocomplement(T, 3), Z)).toBe(true);
  });
});

describe('quantum logic — lattice no-distributivo pero orthomodular', () => {
  it('makeQuantumLattice expone zero, top y operaciones', () => {
    const L = makeQuantumLattice(3);
    expect(L.dimensions).toBe(3);
    expect(L.zero.dimension).toBe(0);
    expect(L.top.dimension).toBe(3);
  });

  it('CONTRAEJEMPLO de distributividad en R^2: tres rectas distintas', () => {
    // En R^2, tomamos a = span(e1), b = span(e2), c = span(e1+e2).
    // Entonces b ∨ c = todo R^2, así a ∧ (b ∨ c) = a (dimensión 1).
    // Pero a ∧ b = {0} y a ∧ c = {0}, así (a ∧ b) ∨ (a ∧ c) = {0}.
    const L = makeQuantumLattice(2);
    const a = span([vec([1, 0])], 2);
    const b = span([vec([0, 1])], 2);
    const c = span([vec([1, 1])], 2);
    const lhs = L.meet(a, L.join(b, c));
    const rhs = L.join(L.meet(a, b), L.meet(a, c));
    expect(lhs.dimension).toBe(1);
    expect(rhs.dimension).toBe(0);
    expect(equalsSubspace(lhs, rhs)).toBe(false);
  });

  it('isDistributive devuelve false para R^2 (sampling encuentra contraejemplo)', () => {
    const L = makeQuantumLattice(2);
    expect(isDistributive(L, 30)).toBe(false);
  });

  it('isDistributive devuelve false para R^3 con sampler que fuerza a ⊂ b ∨ c', () => {
    const L = makeQuantumLattice(3);
    expect(isDistributive(L, 60)).toBe(false);
  });

  it('isModular: el lattice de subespacios de R^n SÍ es modular', () => {
    const L = makeQuantumLattice(3);
    expect(isModular(L, 20)).toBe(true);
  });

  it('isOrthomodular: se cumple la ley orthomodular', () => {
    const L = makeQuantumLattice(3);
    expect(isOrthomodular(L, 20)).toBe(true);
  });

  it('R^2 es modular pero NO distributivo — combinación que separa booleano de quantum', () => {
    const L = makeQuantumLattice(2);
    expect(isModular(L, 30)).toBe(true);
    expect(isDistributive(L, 30)).toBe(false);
  });
});

describe('quantum logic — Kochen–Specker', () => {
  it('findOrthogonalTriples: detecta la única base ortogonal canónica en R^3', () => {
    const v = [vec([1, 0, 0]), vec([0, 1, 0]), vec([0, 0, 1])];
    const triples = findOrthogonalTriples(v);
    expect(triples).toEqual([[0, 1, 2]]);
  });

  it('configuración trivial (una base ortonormal) SÍ es coloreable', () => {
    const v = [vec([1, 0, 0]), vec([0, 1, 0]), vec([0, 0, 1])];
    const triples = findOrthogonalTriples(v);
    expect(triples.length).toBe(1);
    expect(isKSColorable({ vectors: v, orthoTriples: triples })).toBe(true);
  });

  it('dos bases que comparten un eje en R^3: el eje compartido todavía permite coloración', () => {
    const s = 1 / Math.sqrt(2);
    const v = [vec([1, 0, 0]), vec([0, 1, 0]), vec([0, 0, 1]), vec([0, s, s]), vec([0, s, -s])];
    const triples = findOrthogonalTriples(v);
    expect(triples.length).toBeGreaterThanOrEqual(2);
    expect(isKSColorable({ vectors: v, orthoTriples: triples })).toBe(true);
  });

  it('rayo repetido en el mismo triple ⇒ no coloreable trivialmente', () => {
    // Si por error armamos un triple con dos rayos iguales, la
    // restricción "exactamente un 1" se vuelve imposible.
    const v = [vec([1, 0, 0]), vec([2, 0, 0]), vec([0, 1, 0])];
    const cfg = { vectors: v, orthoTriples: [[0, 1, 2]] as Array<[number, number, number]> };
    expect(isKSColorable(cfg)).toBe(false);
  });

  it('kochenSpeckerTheorem3D devuelve un set R^3 estilo-Peres con varios triples', () => {
    const cfg = kochenSpeckerTheorem3D();
    expect(cfg.vectors.length).toBeGreaterThanOrEqual(13);
    expect(cfg.orthoTriples.length).toBeGreaterThanOrEqual(3);
    // Todos los vectores son R^3
    for (const v of cfg.vectors) expect(v.values.length).toBe(3);
  });

  it('Cabello-18 tiene 18 vectores en R^4 y 9 contextos', () => {
    const { vectors, contexts } = kochenSpeckerCabello18();
    expect(vectors.length).toBe(18);
    expect(contexts.length).toBe(9);
    for (const v of vectors) expect(v.values.length).toBe(4);
    // Cada vector aparece en exactamente 2 contextos.
    const appearance = new Array(vectors.length).fill(0);
    for (const ctx of contexts) for (const i of ctx) appearance[i]++;
    expect(appearance.every((c) => c === 2)).toBe(true);
  });

  it('Cabello-18: cada contexto consta de 4 vectores mutuamente ortogonales', () => {
    const { vectors, contexts } = kochenSpeckerCabello18();
    for (const ctx of contexts) {
      expect(ctx.length).toBe(4);
      for (let i = 0; i < ctx.length; i++) {
        for (let j = i + 1; j < ctx.length; j++) {
          const d = dot(vectors[ctx[i]], vectors[ctx[j]]);
          expect(d).toBeCloseTo(0, 9);
        }
      }
    }
  });

  it('TEOREMA Kochen-Specker (Cabello-18): la configuración NO es coloreable', () => {
    const { vectors, contexts } = kochenSpeckerCabello18();
    expect(isKSColorableContexts(vectors, contexts)).toBe(false);
  });

  it('parity argument: 9 contextos × 1 uno/ctx = 9 (impar) vs 2 apariciones/vec = par ⇒ no coloreable', () => {
    // Sanity check del razonamiento detrás del KS Cabello-18.
    const { contexts } = kochenSpeckerCabello18();
    expect(contexts.length % 2).toBe(1); // 9 es impar
    const slots = contexts.reduce((s, c) => s + c.length, 0);
    expect(slots).toBe(36); // 9 × 4
    expect((slots / 2) % 2).toBe(0); // cada vector ocupa 2 slots ⇒ par
  });
});
