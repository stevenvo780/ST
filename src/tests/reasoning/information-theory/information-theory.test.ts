import { describe, it, expect } from 'vitest';
import {
  chainRule,
  collisionEntropy,
  conditionalEntropy,
  crossEntropy,
  hellingerDistance,
  isValidDistribution,
  jointToMarginals,
  jsDivergence,
  klDivergence,
  maxEntropy,
  minEntropy,
  mutualInformation,
  normalize,
  renyiEntropy,
  shannonEntropy,
  support,
  tvDistance,
  type Distribution,
  type Joint,
} from '../../../reasoning/information-theory';

// ------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------

function uniform<T>(symbols: T[]): Distribution<T> {
  const m = new Map<T, number>();
  const p = 1 / symbols.length;
  for (const s of symbols) m.set(s, p);
  return m;
}

function dist<T>(...pairs: [T, number][]): Distribution<T> {
  return new Map(pairs);
}

const EPS = 1e-10;
const close = (a: number, b: number, tol = EPS) => expect(Math.abs(a - b)).toBeLessThan(tol);

// ------------------------------------------------------------
// 1. Distribución uniforme y validación
// ------------------------------------------------------------

describe('information-theory / validación y soporte', () => {
  it('isValidDistribution acepta uniforme', () => {
    expect(isValidDistribution(uniform([1, 2, 3, 4]))).toBe(true);
  });

  it('isValidDistribution rechaza suma ≠ 1', () => {
    expect(isValidDistribution(dist(['a', 0.4], ['b', 0.4]))).toBe(false);
  });

  it('isValidDistribution rechaza probabilidades negativas', () => {
    expect(isValidDistribution(dist(['a', -0.1], ['b', 1.1]))).toBe(false);
  });

  it('isValidDistribution rechaza NaN', () => {
    expect(isValidDistribution(dist(['a', NaN], ['b', 1]))).toBe(false);
  });

  it('normalize reescala a masa 1', () => {
    const p = normalize(dist(['a', 2], ['b', 3], ['c', 5]));
    expect(isValidDistribution(p)).toBe(true);
    close(p.get('a')!, 0.2);
    close(p.get('b')!, 0.3);
    close(p.get('c')!, 0.5);
  });

  it('normalize lanza si masa total 0', () => {
    expect(() => normalize(dist(['a', 0], ['b', 0]))).toThrow();
  });

  it('support omite probabilidades 0', () => {
    expect(support(dist(['a', 0.5], ['b', 0], ['c', 0.5]))).toEqual(['a', 'c']);
  });
});

// ------------------------------------------------------------
// 2. Entropía de Shannon
// ------------------------------------------------------------

describe('information-theory / Shannon entropy', () => {
  it('uniforme N=8 → log2(8) = 3 bits', () => {
    close(shannonEntropy(uniform([1, 2, 3, 4, 5, 6, 7, 8])), 3);
  });

  it('uniforme N=2 → 1 bit', () => {
    close(shannonEntropy(uniform(['H', 'T'])), 1);
  });

  it('degenerada (1 outcome) → 0', () => {
    close(shannonEntropy(dist(['a', 1])), 0);
  });

  it('moneda sesgada p=0.25 → H ≈ 0.811 bits', () => {
    close(shannonEntropy(dist(['H', 0.25], ['T', 0.75])), 0.8112781244591328, 1e-12);
  });

  it('base e (nats): uniforme N=4 → ln 4', () => {
    close(shannonEntropy(uniform(['a', 'b', 'c', 'd']), 'e'), Math.log(4), 1e-12);
  });

  it('base 10 (dits): uniforme N=10 → 1', () => {
    close(shannonEntropy(uniform([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 10), 1, 1e-12);
  });

  it('probabilidades 0 no rompen el cómputo (0·log 0 = 0)', () => {
    close(shannonEntropy(dist(['a', 0.5], ['b', 0.5], ['c', 0])), 1);
  });
});

// ------------------------------------------------------------
// 3. Rényi y variantes
// ------------------------------------------------------------

describe('information-theory / Rényi y entropías especiales', () => {
  it('Rényi(α=1) coincide con Shannon', () => {
    const p = dist(['a', 0.5], ['b', 0.3], ['c', 0.2]);
    close(renyiEntropy(p, 1), shannonEntropy(p), 1e-12);
  });

  it('Rényi(α→1+) → Shannon (continuidad)', () => {
    const p = dist(['a', 0.5], ['b', 0.3], ['c', 0.2]);
    const target = shannonEntropy(p);
    close(renyiEntropy(p, 1.0001), target, 1e-3);
    close(renyiEntropy(p, 0.9999), target, 1e-3);
  });

  it('Rényi(α=0) → log|sop(p)|', () => {
    const p = dist(['a', 0.5], ['b', 0.5], ['c', 0]);
    close(renyiEntropy(p, 0), Math.log2(2));
  });

  it('Rényi(α=2) = collisionEntropy', () => {
    const p = dist(['a', 0.5], ['b', 0.3], ['c', 0.2]);
    close(renyiEntropy(p, 2), collisionEntropy(p), 1e-12);
  });

  it('minEntropy = -log max p(x)', () => {
    const p = dist(['a', 0.7], ['b', 0.2], ['c', 0.1]);
    close(minEntropy(p), -Math.log2(0.7), 1e-12);
  });

  it('maxEntropy = log|sop(p)|', () => {
    const p = dist(['a', 0.5], ['b', 0.5], ['c', 0]);
    close(maxEntropy(p), 1);
  });

  it('orden: minEntropy ≤ Shannon ≤ maxEntropy', () => {
    const p = dist(['a', 0.5], ['b', 0.3], ['c', 0.15], ['d', 0.05]);
    const hMin = minEntropy(p);
    const hShannon = shannonEntropy(p);
    const hMax = maxEntropy(p);
    expect(hMin).toBeLessThanOrEqual(hShannon + 1e-12);
    expect(hShannon).toBeLessThanOrEqual(hMax + 1e-12);
  });

  it('renyi α negativo → lanza', () => {
    expect(() => renyiEntropy(dist(['a', 1]), -1)).toThrow();
  });
});

// ------------------------------------------------------------
// 4. Divergencias
// ------------------------------------------------------------

describe('information-theory / KL divergence', () => {
  it('KL(p, p) = 0', () => {
    const p = dist(['a', 0.3], ['b', 0.7]);
    close(klDivergence(p, p), 0);
  });

  it('KL no simétrica en general', () => {
    const p = dist(['a', 0.5], ['b', 0.5]);
    const q = dist(['a', 0.1], ['b', 0.9]);
    const dpq = klDivergence(p, q);
    const dqp = klDivergence(q, p);
    expect(dpq).not.toBeCloseTo(dqp, 6);
  });

  it('KL ≥ 0 (no-negatividad / desigualdad de Gibbs)', () => {
    const p = dist(['a', 0.2], ['b', 0.3], ['c', 0.5]);
    const q = dist(['a', 0.4], ['b', 0.4], ['c', 0.2]);
    expect(klDivergence(p, q)).toBeGreaterThanOrEqual(0);
    expect(klDivergence(q, p)).toBeGreaterThanOrEqual(0);
  });

  it('KL diverge a +∞ cuando q(x)=0 pero p(x)>0', () => {
    const p = dist(['a', 0.5], ['b', 0.5]);
    const q = dist(['a', 1], ['b', 0]);
    expect(klDivergence(p, q)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('information-theory / JS divergence', () => {
  it('JS simétrica', () => {
    const p = dist(['a', 0.2], ['b', 0.8]);
    const q = dist(['a', 0.7], ['b', 0.3]);
    close(jsDivergence(p, q), jsDivergence(q, p), 1e-12);
  });

  it('JS(p, p) = 0', () => {
    const p = dist(['a', 0.3], ['b', 0.7]);
    close(jsDivergence(p, p), 0);
  });

  it('JS finita aun con soportes disjuntos (acotada por log 2)', () => {
    const p = dist(['a', 1], ['b', 0]);
    const q = dist(['a', 0], ['b', 1]);
    const js = jsDivergence(p, q);
    expect(Number.isFinite(js)).toBe(true);
    close(js, 1, 1e-12); // base 2: log 2 = 1.
  });
});

describe('information-theory / TV y Hellinger', () => {
  it('TV ≤ 1 y TV(p,p)=0', () => {
    const p = dist(['a', 0.5], ['b', 0.5]);
    const q = dist(['a', 0.7], ['b', 0.3]);
    expect(tvDistance(p, p)).toBe(0);
    expect(tvDistance(p, q)).toBeLessThanOrEqual(1);
    close(tvDistance(p, q), 0.2);
  });

  it('TV(p,q)=1 si soportes disjuntos', () => {
    const p = dist(['a', 1], ['b', 0]);
    const q = dist(['a', 0], ['b', 1]);
    close(tvDistance(p, q), 1);
  });

  it('Hellinger ∈ [0, 1], simétrica, =0 sii p=q, =1 sii soportes disjuntos', () => {
    const p = dist(['a', 0.5], ['b', 0.5]);
    const q = dist(['a', 0.7], ['b', 0.3]);
    expect(hellingerDistance(p, p)).toBe(0);
    close(hellingerDistance(p, q), hellingerDistance(q, p), 1e-12);
    const r = dist(['a', 1], ['b', 0]);
    const s = dist(['a', 0], ['b', 1]);
    close(hellingerDistance(r, s), 1);
  });

  it('Pinsker: TV ≤ sqrt(KL/2) cuando KL finita (base e)', () => {
    const p = dist(['a', 0.4], ['b', 0.6]);
    const q = dist(['a', 0.5], ['b', 0.5]);
    const kl = klDivergence(p, q, 'e');
    expect(tvDistance(p, q)).toBeLessThanOrEqual(Math.sqrt(kl / 2) + 1e-12);
  });
});

// ------------------------------------------------------------
// 5. Cross-entropy
// ------------------------------------------------------------

describe('information-theory / cross-entropy', () => {
  it('H(p, q) = H(p) + KL(p, q)', () => {
    const p = dist(['a', 0.3], ['b', 0.5], ['c', 0.2]);
    const q = dist(['a', 0.25], ['b', 0.5], ['c', 0.25]);
    close(crossEntropy(p, q), shannonEntropy(p) + klDivergence(p, q), 1e-12);
  });

  it('H(p, p) = H(p)', () => {
    const p = dist(['a', 0.4], ['b', 0.6]);
    close(crossEntropy(p, p), shannonEntropy(p), 1e-12);
  });

  it('cross-entropy +∞ si q(x)=0 con p(x)>0', () => {
    const p = dist(['a', 0.5], ['b', 0.5]);
    const q = dist(['a', 1], ['b', 0]);
    expect(crossEntropy(p, q)).toBe(Number.POSITIVE_INFINITY);
  });
});

// ------------------------------------------------------------
// 6. Joint / mutual information
// ------------------------------------------------------------

function makeJoint<X, Y>(entries: [X, Y, number][]): Joint<X, Y> {
  const j = new Map<[X, Y], number>();
  for (const [x, y, p] of entries) j.set([x, y], p);
  return j;
}

describe('information-theory / joint distributions', () => {
  it('jointToMarginals preserva masa total', () => {
    const j = makeJoint<string, string>([
      ['x1', 'y1', 0.1],
      ['x1', 'y2', 0.2],
      ['x2', 'y1', 0.3],
      ['x2', 'y2', 0.4],
    ]);
    const { X, Y } = jointToMarginals(j);
    close(X.get('x1')! + X.get('x2')!, 1);
    close(Y.get('y1')! + Y.get('y2')!, 1);
    close(X.get('x1')!, 0.3);
    close(X.get('x2')!, 0.7);
    close(Y.get('y1')!, 0.4);
    close(Y.get('y2')!, 0.6);
  });

  it('I(X;Y) = 0 cuando X ⊥ Y (joint factorizable)', () => {
    // p(x,y) = p(x)·p(y) con p(x)=[0.4,0.6], p(y)=[0.25,0.75].
    const j = makeJoint<string, string>([
      ['x1', 'y1', 0.4 * 0.25],
      ['x1', 'y2', 0.4 * 0.75],
      ['x2', 'y1', 0.6 * 0.25],
      ['x2', 'y2', 0.6 * 0.75],
    ]);
    close(mutualInformation(j), 0, 1e-12);
  });

  it('I(X;X) = H(X) (información mutua de una variable consigo misma)', () => {
    // Joint perfectamente correlacionada: p(x,x) = p(x), p(x,y)=0 si x≠y.
    const j = makeJoint<string, string>([
      ['a', 'a', 0.3],
      ['b', 'b', 0.5],
      ['c', 'c', 0.2],
    ]);
    const { X } = jointToMarginals(j);
    close(mutualInformation(j), shannonEntropy(X), 1e-12);
  });

  it('I(X;Y) ≥ 0 siempre', () => {
    const j = makeJoint<string, string>([
      ['x1', 'y1', 0.1],
      ['x1', 'y2', 0.3],
      ['x2', 'y1', 0.4],
      ['x2', 'y2', 0.2],
    ]);
    expect(mutualInformation(j)).toBeGreaterThanOrEqual(-1e-12);
  });

  it('regla de la cadena: H(X,Y) = H(X) + H(Y) − I(X;Y)', () => {
    const j = makeJoint<string, string>([
      ['x1', 'y1', 0.1],
      ['x1', 'y2', 0.3],
      ['x2', 'y1', 0.4],
      ['x2', 'y2', 0.2],
    ]);
    const { hX, hY, hXY, iXY } = chainRule(j);
    close(hXY, hX + hY - iXY, 1e-12);
  });

  it('conditionalEntropy: H(X|Y) = H(X,Y) − H(Y) ≥ 0', () => {
    const j = makeJoint<string, string>([
      ['x1', 'y1', 0.1],
      ['x1', 'y2', 0.3],
      ['x2', 'y1', 0.4],
      ['x2', 'y2', 0.2],
    ]);
    const hX_Y = conditionalEntropy(j, 'X');
    const hY_X = conditionalEntropy(j, 'Y');
    expect(hX_Y).toBeGreaterThanOrEqual(-1e-12);
    expect(hY_X).toBeGreaterThanOrEqual(-1e-12);
    // I(X;Y) = H(X) − H(X|Y).
    const { hX, iXY } = chainRule(j);
    close(iXY, hX - hX_Y, 1e-12);
  });
});
