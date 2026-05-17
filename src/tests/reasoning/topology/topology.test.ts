import { describe, it, expect } from 'vitest';
import {
  addSimplex,
  boundaryZ,
  boundaryZ2,
  bettiNumberZ,
  bettiNumberZ2,
  computeHomology,
  dimension,
  eulerCharacteristic,
  faces,
  fVector,
  kleinBottle,
  makeComplex,
  nSimplex,
  projectivePlane,
  rankBoundaryZ2,
  smithNormalForm,
  spheres,
  torsionZ,
  torus2,
  type SimplicialComplex,
} from '../../../reasoning/topology';

// Helpers de construcción.
function complexFrom(simplices: number[][]): SimplicialComplex {
  const K = makeComplex();
  for (const s of simplices) addSimplex(K, s);
  return K;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// ------------------------------------------------------------
// 1. Construcción y dimensión
// ------------------------------------------------------------

describe('topology / construcción de simplicial complexes', () => {
  it('makeComplex inicia vacío', () => {
    const K = makeComplex();
    expect(K.vertices).toEqual([]);
    expect(dimension(K)).toBe(-1);
    expect(fVector(K)).toEqual([]);
  });

  it('addSimplex añade todas las caras', () => {
    const K = makeComplex();
    addSimplex(K, [0, 1, 2]);
    // Debe tener 3 vértices, 3 aristas, 1 triángulo.
    expect(fVector(K)).toEqual([3, 3, 1]);
    expect(dimension(K)).toBe(2);
  });

  it('addSimplex normaliza el orden de vértices', () => {
    const K1 = complexFrom([[2, 0, 1]]);
    const K2 = complexFrom([[0, 1, 2]]);
    expect(fVector(K1)).toEqual(fVector(K2));
  });

  it('addSimplex es idempotente sobre simplices repetidos', () => {
    const K = makeComplex();
    addSimplex(K, [0, 1, 2]);
    addSimplex(K, [0, 1, 2]);
    addSimplex(K, [0, 1]);
    expect(fVector(K)).toEqual([3, 3, 1]);
  });

  it('faces de un triángulo da sus 3 aristas', () => {
    const fs = faces([0, 1, 2]);
    expect(fs).toHaveLength(3);
    expect(fs).toContainEqual([1, 2]);
    expect(fs).toContainEqual([0, 2]);
    expect(fs).toContainEqual([0, 1]);
  });

  it('faces de un punto es vacío', () => {
    expect(faces([5])).toEqual([]);
    expect(faces([])).toEqual([]);
  });
});

// ------------------------------------------------------------
// 2. Operador borde
// ------------------------------------------------------------

describe('topology / operador borde', () => {
  it('boundaryZ2 ignora orientación', () => {
    const b = boundaryZ2([0, 1, 2]);
    expect(b).toHaveLength(3);
    expect(b).toContainEqual([0, 1]);
    expect(b).toContainEqual([0, 2]);
    expect(b).toContainEqual([1, 2]);
  });

  it('boundaryZ asigna signos (-1)^i por vértice omitido', () => {
    const b = boundaryZ([0, 1, 2]);
    // ∂[0,1,2] = +[1,2] - [0,2] + [0,1]
    expect(b).toEqual([
      { sign: 1, simplex: [1, 2] },
      { sign: -1, simplex: [0, 2] },
      { sign: 1, simplex: [0, 1] },
    ]);
  });

  it('∂² = 0 sobre Z para un tetraedro', () => {
    // ∂([0,1,2,3]) en Z, luego aplicar ∂ a cada cara con signo y sumar.
    const top = boundaryZ([0, 1, 2, 3]);
    const acc = new Map<string, number>();
    for (const { sign, simplex } of top) {
      for (const { sign: s2, simplex: s } of boundaryZ(simplex)) {
        const k = s.join(',');
        acc.set(k, (acc.get(k) ?? 0) + sign * s2);
      }
    }
    for (const v of acc.values()) {
      expect(v).toBe(0);
    }
  });
});

// ------------------------------------------------------------
// 3. f-vector y característica de Euler
// ------------------------------------------------------------

describe('topology / f-vector y Euler', () => {
  it('triángulo hueco (1-borde): f=(3,3), euler=0', () => {
    // Frontera de un triángulo: 3 vértices + 3 aristas, sin la 2-cara.
    const K = makeComplex();
    addSimplex(K, [0, 1]);
    addSimplex(K, [1, 2]);
    addSimplex(K, [0, 2]);
    expect(fVector(K)).toEqual([3, 3]);
    expect(eulerCharacteristic(K)).toBe(0);
  });

  it('disco triangular: f=(3,3,1), euler=1', () => {
    const K = complexFrom([[0, 1, 2]]);
    expect(fVector(K)).toEqual([3, 3, 1]);
    expect(eulerCharacteristic(K)).toBe(1);
  });

  it('borde del tetraedro = S²: euler = 2', () => {
    const S2 = spheres(2);
    expect(fVector(S2)).toEqual([4, 6, 4]);
    expect(eulerCharacteristic(S2)).toBe(2);
  });

  it('eulerCharacteristic equivale a ∑(-1)^i f_i', () => {
    const K = spheres(2);
    const f = fVector(K);
    let chi = 0;
    for (let i = 0; i < f.length; i++) {
      const fi = f[i] ?? 0;
      chi += (i % 2 === 0 ? 1 : -1) * fi;
    }
    expect(chi).toBe(eulerCharacteristic(K));
  });
});

// ------------------------------------------------------------
// 4. Smith Normal Form
// ------------------------------------------------------------

describe('topology / Smith Normal Form', () => {
  it('SNF de matriz nula es nula', () => {
    const M = [
      [0, 0],
      [0, 0],
    ];
    const { rankIm, invariants } = smithNormalForm(M);
    expect(rankIm).toBe(0);
    expect(invariants).toEqual([]);
  });

  it('SNF de identidad da factores (1,1,...)', () => {
    const M = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const { rankIm, invariants } = smithNormalForm(M);
    expect(rankIm).toBe(3);
    expect(invariants).toEqual([1, 1, 1]);
  });

  it('SNF detecta torsión Z/2', () => {
    // Matriz [[2]] tiene SNF = [[2]], factor invariante 2.
    const { invariants, rankIm } = smithNormalForm([[2]]);
    expect(invariants).toEqual([2]);
    expect(rankIm).toBe(1);
  });

  it('SNF respeta divisibilidad d_i | d_{i+1}', () => {
    // diag(2,3) → SNF (1,6).
    const M = [
      [2, 0],
      [0, 3],
    ];
    const { invariants } = smithNormalForm(M);
    expect(invariants[0]).toBe(1);
    expect(invariants[1]).toBe(6);
  });
});

// ------------------------------------------------------------
// 5. Homología clásica
// ------------------------------------------------------------

describe('topology / homología clásica', () => {
  it('punto: β_0 = 1, sin más homología', () => {
    const K = makeComplex();
    addSimplex(K, [0]);
    expect(bettiNumberZ2(K, 0)).toBe(1);
    expect(bettiNumberZ(K, 0)).toBe(1);
    expect(eulerCharacteristic(K)).toBe(1);
  });

  it('dos puntos disjuntos: β_0 = 2', () => {
    const K = makeComplex();
    addSimplex(K, [0]);
    addSimplex(K, [1]);
    expect(bettiNumberZ2(K, 0)).toBe(2);
    expect(bettiNumberZ(K, 0)).toBe(2);
  });

  it('círculo S¹ (frontera del triángulo): β = [1,1], euler=0', () => {
    const S1 = spheres(1);
    expect(fVector(S1)).toEqual([3, 3]);
    expect(bettiNumberZ2(S1, 0)).toBe(1);
    expect(bettiNumberZ2(S1, 1)).toBe(1);
    expect(bettiNumberZ(S1, 0)).toBe(1);
    expect(bettiNumberZ(S1, 1)).toBe(1);
    expect(eulerCharacteristic(S1)).toBe(0);
  });

  it('esfera S² (frontera del tetraedro): β_Z2 = [1,0,1], euler=2', () => {
    const S2 = spheres(2);
    const H = computeHomology(S2, 'Z2');
    expect(H.bettiNumbers).toEqual([1, 0, 1]);
    expect(H.eulerChar).toBe(2);
  });

  it('esfera S² sobre Z: β = [1,0,1], sin torsión', () => {
    const S2 = spheres(2);
    const H = computeHomology(S2, 'Z');
    expect(H.bettiNumbers).toEqual([1, 0, 1]);
    expect(H.torsion).toEqual({});
  });

  it('esfera S³ (frontera 4-simplex): β = [1,0,0,1], euler = 0', () => {
    const S3 = spheres(3);
    const H = computeHomology(S3, 'Z');
    expect(H.bettiNumbers).toEqual([1, 0, 0, 1]);
    expect(H.eulerChar).toBe(0);
  });

  it('disco 2D (un triángulo lleno): β = [1,0,0], euler = 1', () => {
    const K = complexFrom([[0, 1, 2]]);
    const H = computeHomology(K, 'Z2');
    expect(H.bettiNumbers).toEqual([1, 0, 0]);
    expect(H.eulerChar).toBe(1);
  });

  it('n-simplex completo es contráctil: β = [1,0,...,0]', () => {
    for (const n of [1, 2, 3]) {
      const K = nSimplex(n);
      const H = computeHomology(K, 'Z');
      expect(H.bettiNumbers[0]).toBe(1);
      for (let i = 1; i <= n; i++) {
        expect(H.bettiNumbers[i]).toBe(0);
      }
    }
  });
});

// ------------------------------------------------------------
// 6. Superficies con identificaciones
// ------------------------------------------------------------

describe('topology / superficies clásicas', () => {
  it('toro T²: euler = 0', () => {
    const T = torus2();
    expect(eulerCharacteristic(T)).toBe(0);
  });

  it('toro T²: β_Z2 = [1,2,1]', () => {
    const T = torus2();
    const H = computeHomology(T, 'Z2');
    expect(H.bettiNumbers).toEqual([1, 2, 1]);
    expect(H.eulerChar).toBe(0);
  });

  it('toro T²: β_Z = [1,2,1], sin torsión (orientable)', () => {
    const T = torus2();
    const H = computeHomology(T, 'Z');
    expect(H.bettiNumbers).toEqual([1, 2, 1]);
    expect(H.torsion).toEqual({});
  });

  it('plano proyectivo RP²: euler = 1', () => {
    const P = projectivePlane();
    expect(eulerCharacteristic(P)).toBe(1);
  });

  it('plano proyectivo RP²: β_Z2 = [1,1,1]', () => {
    const P = projectivePlane();
    const H = computeHomology(P, 'Z2');
    expect(H.bettiNumbers).toEqual([1, 1, 1]);
  });

  it('plano proyectivo RP²: β_Z = [1,0,0] con torsión Z/2 en dim 1', () => {
    const P = projectivePlane();
    const H = computeHomology(P, 'Z');
    expect(H.bettiNumbers).toEqual([1, 0, 0]);
    expect(H.torsion?.[1]).toEqual([2]);
  });

  it('botella de Klein: euler = 0', () => {
    const K = kleinBottle();
    expect(eulerCharacteristic(K)).toBe(0);
  });

  it('botella de Klein sobre Z: β = [1,1,0], torsión Z/2 en dim 1', () => {
    const K = kleinBottle();
    const H = computeHomology(K, 'Z');
    expect(H.bettiNumbers).toEqual([1, 1, 0]);
    expect(H.torsion?.[1]).toEqual([2]);
  });

  it('botella de Klein sobre Z/2: β = [1,2,1]', () => {
    const K = kleinBottle();
    const H = computeHomology(K, 'Z2');
    // Sobre Z/2 la torsión Z/2 se vuelve un sumando libre extra:
    // H_1(K, Z/2) tiene dimensión 2, H_2(K, Z/2) tiene dimensión 1.
    expect(H.bettiNumbers).toEqual([1, 2, 1]);
  });
});

// ------------------------------------------------------------
// 7. Consistencia de invariantes
// ------------------------------------------------------------

describe('topology / consistencia', () => {
  it('χ = ∑ (-1)^i β_i (sobre Z/2) para todos los complejos clásicos', () => {
    const cases: { name: string; K: SimplicialComplex }[] = [
      { name: 'S^1', K: spheres(1) },
      { name: 'S^2', K: spheres(2) },
      { name: 'S^3', K: spheres(3) },
      { name: 'T²', K: torus2() },
      { name: 'RP²', K: projectivePlane() },
      { name: 'Klein', K: kleinBottle() },
      { name: '3-simplex', K: nSimplex(3) },
    ];
    for (const { name, K } of cases) {
      const H = computeHomology(K, 'Z2');
      let chi = 0;
      for (let i = 0; i < H.bettiNumbers.length; i++) {
        const b = H.bettiNumbers[i] ?? 0;
        chi += (i % 2 === 0 ? 1 : -1) * b;
      }
      expect(chi, `χ vs ∑(-1)^i β_i para ${name}`).toBe(eulerCharacteristic(K));
    }
  });

  it('rankBoundaryZ2 coherente con dimensiones', () => {
    const S2 = spheres(2);
    // rank ∂_1 ≤ #aristas, rank ∂_2 ≤ #triángulos
    expect(rankBoundaryZ2(S2, 1)).toBeLessThanOrEqual(6);
    expect(rankBoundaryZ2(S2, 2)).toBeLessThanOrEqual(4);
  });

  it('torsionZ vacía para S² (orientable)', () => {
    const S2 = spheres(2);
    expect(torsionZ(S2, 0)).toEqual([]);
    expect(torsionZ(S2, 1)).toEqual([]);
    expect(torsionZ(S2, 2)).toEqual([]);
  });

  it('fVector entries no negativas y suma consistente', () => {
    const T = torus2();
    const f = fVector(T);
    for (const fi of f) {
      expect(fi).toBeGreaterThanOrEqual(0);
    }
    // Triangulación 3×3 del toro: 9 vértices, 27 aristas, 18 triángulos.
    expect(f).toEqual([9, 27, 18]);
    expect(sum(f)).toBe(54);
  });
});
