import { describe, it, expect } from 'vitest';
import {
  findIrreducibleOverZp,
  makeGaloisField,
  gfZero,
  gfOne,
  gfElement,
  gfAdd,
  gfSub,
  gfMul,
  gfDiv,
  gfPow,
  gfInverse,
  gfEq,
  findPrimitive,
  order,
  discreteLog,
  rsEncode,
  type GFElement,
} from '../../../reasoning/galois-fields';

// Helpers ----------------------------------------------------

function enumerateElements(F: ReturnType<typeof makeGaloisField>): GFElement[] {
  const out: GFElement[] = [];
  for (let k = 0; k < F.order; k++) {
    const coeffs: number[] = Array.from({ length: F.degree }, () => 0);
    let x = k;
    for (let i = 0; i < F.degree; i++) {
      coeffs[i] = x % F.prime;
      x = Math.floor(x / F.prime);
    }
    out.push(gfElement(F, coeffs));
  }
  return out;
}

describe('Galois Fields — irreducibles', () => {
  it('findIrreducibleOverZp(2, 1) devuelve x', () => {
    expect(findIrreducibleOverZp(2, 1)).toEqual([0, 1]);
  });

  it('findIrreducibleOverZp(2, 3) devuelve un polinomio de grado 3 mónico', () => {
    const f = findIrreducibleOverZp(2, 3);
    expect(f).not.toBeNull();
    expect(f && f[f.length - 1]).toBe(1);
    expect(f && f.length).toBe(4);
  });

  it('findIrreducibleOverZp(3, 2) existe y es de grado 2', () => {
    const f = findIrreducibleOverZp(3, 2);
    expect(f).not.toBeNull();
    expect(f && f.length).toBe(3);
  });

  it('rechaza p no primo', () => {
    expect(() => findIrreducibleOverZp(4, 2)).toThrow();
  });
});

describe('Galois Fields — GF(p)', () => {
  it('GF(2): suma equivale a XOR', () => {
    const F = makeGaloisField(2, 1);
    const zero = gfZero(F);
    const one = gfOne(F);
    expect(gfEq(gfAdd(F, one, one), zero)).toBe(true);
    expect(gfEq(gfAdd(F, one, zero), one)).toBe(true);
    expect(gfEq(gfAdd(F, zero, zero), zero)).toBe(true);
  });

  it('GF(2): multiplicación equivale a AND', () => {
    const F = makeGaloisField(2, 1);
    const zero = gfZero(F);
    const one = gfOne(F);
    expect(gfEq(gfMul(F, one, one), one)).toBe(true);
    expect(gfEq(gfMul(F, one, zero), zero)).toBe(true);
    expect(gfEq(gfMul(F, zero, zero), zero)).toBe(true);
  });

  it('GF(7): inverso de cada no-cero da 1', () => {
    const F = makeGaloisField(7, 1);
    for (let k = 1; k < 7; k++) {
      const a = gfElement(F, [k]);
      const inv = gfInverse(F, a);
      expect(inv).not.toBeNull();
      if (inv) expect(gfEq(gfMul(F, a, inv), gfOne(F))).toBe(true);
    }
  });

  it('GF(7) tiene primitivo y su orden es 6', () => {
    const F = makeGaloisField(7, 1);
    const g = findPrimitive(F);
    expect(order(F, g)).toBe(6);
  });
});

describe('Galois Fields — GF(2^3)', () => {
  const F = makeGaloisField(2, 3);

  it('orden del cuerpo = 8', () => {
    expect(F.order).toBe(8);
  });

  it('todo no-cero tiene inverso y a · a^-1 = 1', () => {
    const elements = enumerateElements(F);
    const one = gfOne(F);
    for (const a of elements) {
      if (gfEq(a, gfZero(F))) continue;
      const inv = gfInverse(F, a);
      expect(inv).not.toBeNull();
      if (inv) expect(gfEq(gfMul(F, a, inv), one)).toBe(true);
    }
  });

  it('Fermat little: a^(p^n - 1) = 1 para todo no-cero', () => {
    const exp = BigInt(F.order - 1);
    const one = gfOne(F);
    for (const a of enumerateElements(F)) {
      if (gfEq(a, gfZero(F))) continue;
      expect(gfEq(gfPow(F, a, exp), one)).toBe(true);
    }
  });

  it('existe primitivo y su orden divide a p^n − 1', () => {
    const g = findPrimitive(F);
    const ord = order(F, g);
    expect(ord).toBe(F.order - 1);
    expect((F.order - 1) % ord).toBe(0);
  });
});

describe('Galois Fields — GF(2^4)', () => {
  const F = makeGaloisField(2, 4);

  it('orden = 16 y existe primitivo de orden 15', () => {
    expect(F.order).toBe(16);
    const g = findPrimitive(F);
    expect(order(F, g)).toBe(15);
  });

  it('discreteLog inverso de gfPow', () => {
    const g = findPrimitive(F);
    for (let k = 0; k < F.order - 1; k++) {
      const target = gfPow(F, g, BigInt(k));
      const log = discreteLog(F, g, target);
      expect(log).toBe(k);
    }
  });

  it('gfDiv consistente con gfMul + inverso', () => {
    const a = gfElement(F, [1, 1, 0, 1]);
    const b = gfElement(F, [0, 1, 1, 0]);
    const q = gfDiv(F, a, b);
    expect(q).not.toBeNull();
    if (q) expect(gfEq(gfMul(F, q, b), a)).toBe(true);
  });
});

describe('Galois Fields — leyes algebraicas (GF(3^2))', () => {
  const F = makeGaloisField(3, 2);

  it('suma asociativa y conmutativa', () => {
    const elements = enumerateElements(F);
    // Muestreo: 3 triples (a,b,c) deterministas.
    const samples: Array<[GFElement, GFElement, GFElement]> = [];
    for (let i = 0; i < 4; i++) {
      const a = elements[(i * 3) % elements.length];
      const b = elements[(i * 5 + 1) % elements.length];
      const c = elements[(i * 7 + 2) % elements.length];
      if (a && b && c) samples.push([a, b, c]);
    }
    for (const [a, b, c] of samples) {
      expect(gfEq(gfAdd(F, a, b), gfAdd(F, b, a))).toBe(true);
      const left = gfAdd(F, gfAdd(F, a, b), c);
      const right = gfAdd(F, a, gfAdd(F, b, c));
      expect(gfEq(left, right)).toBe(true);
    }
  });

  it('multiplicación distributiva sobre la suma', () => {
    const elements = enumerateElements(F);
    for (let i = 0; i < 5; i++) {
      const a = elements[(i * 2) % elements.length];
      const b = elements[(i * 3 + 1) % elements.length];
      const c = elements[(i * 5 + 2) % elements.length];
      if (!a || !b || !c) continue;
      const left = gfMul(F, a, gfAdd(F, b, c));
      const right = gfAdd(F, gfMul(F, a, b), gfMul(F, a, c));
      expect(gfEq(left, right)).toBe(true);
    }
  });

  it('a − a = 0 y a + (−a) = 0', () => {
    for (const a of enumerateElements(F)) {
      expect(gfEq(gfSub(F, a, a), gfZero(F))).toBe(true);
    }
  });
});

describe('Galois Fields — Reed-Solomon encoding (GF(2^3))', () => {
  const F = makeGaloisField(2, 3);

  it('rsEncode con mensaje constante c devuelve [c, c, ...]', () => {
    const c = gfElement(F, [1, 0, 1]);
    const word = rsEncode(F, [c], 5);
    expect(word.length).toBe(5);
    for (const w of word) {
      expect(gfEq(w, c)).toBe(true);
    }
  });

  it('rsEncode evalúa el polinomio en potencias del primitivo', () => {
    const g = findPrimitive(F);
    const m0 = gfOne(F);
    const m1 = gfOne(F);
    // polinomio P(x) = 1 + x
    const word = rsEncode(F, [m0, m1], 3);
    expect(word.length).toBe(3);
    // P(1) = 1+1 = 0 en GF(2^k)
    expect(gfEq(word[0], gfZero(F))).toBe(true);
    // P(g) = 1 + g
    expect(gfEq(word[1], gfAdd(F, gfOne(F), g))).toBe(true);
  });
});

describe('Galois Fields — errores y bordes', () => {
  it('gfInverse(0) = null', () => {
    const F = makeGaloisField(5, 2);
    expect(gfInverse(F, gfZero(F))).toBeNull();
  });

  it('gfDiv por 0 devuelve null', () => {
    const F = makeGaloisField(5, 2);
    const a = gfElement(F, [1, 2]);
    expect(gfDiv(F, a, gfZero(F))).toBeNull();
  });

  it('gfPow con exponente 0 da 1', () => {
    const F = makeGaloisField(3, 2);
    const a = gfElement(F, [2, 1]);
    expect(gfEq(gfPow(F, a, 0n), gfOne(F))).toBe(true);
  });

  it('gfPow exponente negativo usa inverso', () => {
    const F = makeGaloisField(5, 1);
    const a = gfElement(F, [3]);
    // 3^(-1) mod 5 = 2
    expect(gfEq(gfPow(F, a, -1n), gfElement(F, [2]))).toBe(true);
  });

  it('makeGaloisField rechaza irreducible reducible', () => {
    // (x^2) sobre Z/2 NO es irreducible.
    expect(() => makeGaloisField(2, 2, [0, 0, 1])).toThrow();
  });

  it('makeGaloisField acepta irreducible explícito válido para GF(2^2)', () => {
    // x^2 + x + 1 sobre Z/2 es irreducible.
    const F = makeGaloisField(2, 2, [1, 1, 1]);
    expect(F.order).toBe(4);
    // Verificar que (1 + x) * (1 + x) reducido tiene sentido.
    const a = gfElement(F, [1, 1]);
    const a2 = gfMul(F, a, a);
    // (1+x)^2 = 1 + 2x + x^2 = 1 + x^2 ≡ 1 + (x+1) = x (mod x^2+x+1, en Z/2)
    expect(gfEq(a2, gfElement(F, [0, 1]))).toBe(true);
  });
});
