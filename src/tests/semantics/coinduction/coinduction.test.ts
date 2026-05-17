// ============================================================
// ST Coinduction — Tests
// ============================================================
// Cubre:
//   • Constructores corecursivos (repeat, iterate, unfold).
//   • Streams notables (naturals, fibonacci).
//   • Functor/aplicativo (map, zipWith, zip, scan).
//   • Identidades coinductivas vía isBisimilar (acotado).
//   • Bisimulación up-to vía `prove` con relaciones explícitas.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  Stream,
  cons,
  repeat,
  iterate,
  unfold,
  take,
  drop,
  nth,
  map,
  zipWith,
  zip,
  filter,
  interleave,
  scan,
  naturals,
  fibonacci,
  isBisimilar,
  prove,
  __internals,
} from '../../../semantics/coinduction';

describe('Coinduction — constructores básicos', () => {
  it('repeat genera un stream constante', () => {
    const xs = repeat(7);
    expect(take(xs, 5)).toEqual([7, 7, 7, 7, 7]);
  });

  it('repeat preserva identidad de cola (punto fijo)', () => {
    // tail(repeat x) === repeat x (mismo nodo) — propiedad coinductiva
    // fuerte que sólo se cumple por la implementación con auto-referencia.
    const xs = repeat(0);
    expect(xs.tail()).toBe(xs);
  });

  it('iterate aplica f repetidamente', () => {
    const xs = iterate((n: number) => n * 2, 1);
    expect(take(xs, 6)).toEqual([1, 2, 4, 8, 16, 32]);
  });

  it('cons construye correctamente cabeza y cola', () => {
    const xs = cons(99, () => repeat(0));
    expect(xs.head).toBe(99);
    expect(take(xs, 4)).toEqual([99, 0, 0, 0]);
  });

  it('unfold anamorfismo: enumera potencias de 2', () => {
    const powers = unfold(1, (s: number) => [s, s * 2] as [number, number]);
    expect(take(powers, 5)).toEqual([1, 2, 4, 8, 16]);
  });
});

describe('Coinduction — observaciones', () => {
  it('take devuelve los primeros n elementos', () => {
    expect(take(naturals, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('take con n=0 devuelve array vacío', () => {
    expect(take(naturals, 0)).toEqual([]);
  });

  it('take rechaza n negativo o no entero', () => {
    expect(() => take(naturals, -1)).toThrow();
    expect(() => take(naturals, 1.5)).toThrow();
  });

  it('drop descarta n elementos', () => {
    expect(take(drop(naturals, 3), 4)).toEqual([3, 4, 5, 6]);
  });

  it('nth recupera el i-ésimo elemento', () => {
    expect(nth(naturals, 0)).toBe(0);
    expect(nth(naturals, 10)).toBe(10);
    expect(nth(fibonacci, 9)).toBe(34);
  });
});

describe('Coinduction — streams notables', () => {
  it('naturals = 0, 1, 2, ...', () => {
    expect(take(naturals, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('fibonacci = 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...', () => {
    expect(take(fibonacci, 10)).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
  });

  it('fibonacci satisface F(n+2) = F(n+1) + F(n)', () => {
    const fs = take(fibonacci, 20);
    for (let i = 0; i + 2 < fs.length; i++) {
      const a = fs[i];
      const b = fs[i + 1];
      const c = fs[i + 2];
      if (a === undefined || b === undefined || c === undefined) {
        throw new Error('fibonacci sample shorter than expected');
      }
      expect(c).toBe(a + b);
    }
  });
});

describe('Coinduction — functor/aplicativos', () => {
  it('map respeta identidad observacionalmente: map(id, s) ~ s', () => {
    expect(
      isBisimilar(
        map((x: number) => x, naturals),
        naturals,
        50,
      ),
    ).toBe(true);
  });

  it('zipWith combina elemento a elemento', () => {
    const sumS = zipWith((a: number, b: number) => a + b, naturals, naturals);
    expect(take(sumS, 5)).toEqual([0, 2, 4, 6, 8]);
  });

  it('zip produce pares', () => {
    const ps = take(zip(naturals, repeat('x')), 3);
    expect(ps).toEqual([
      [0, 'x'],
      [1, 'x'],
      [2, 'x'],
    ]);
  });

  it('filter mantiene sólo elementos que pasan el predicado', () => {
    const evens = filter((n: number) => n % 2 === 0, naturals);
    expect(take(evens, 5)).toEqual([0, 2, 4, 6, 8]);
  });

  it('scan acumula prefijos: scan(+, 0, naturals) = 0, 0, 1, 3, 6, 10, ...', () => {
    const s = scan((acc: number, x: number) => acc + x, 0, naturals);
    expect(take(s, 6)).toEqual([0, 0, 1, 3, 6, 10]);
  });

  it('interleave alterna a, b, a, b, ...', () => {
    const xs = interleave(repeat('a'), repeat('b'));
    expect(take(xs, 6)).toEqual(['a', 'b', 'a', 'b', 'a', 'b']);
  });
});

describe('Coinduction — bisimulación acotada', () => {
  it('isBisimilar es reflexivo sobre naturals', () => {
    expect(isBisimilar(naturals, naturals, 100)).toBe(true);
  });

  it('isBisimilar detecta divergencia inmediata', () => {
    const a = cons(1, () => repeat(0));
    const b = cons(2, () => repeat(0));
    expect(isBisimilar(a, b, 10)).toBe(false);
  });

  it('isBisimilar(naturals, map(id, naturals)) — corecursión idempotente', () => {
    expect(
      isBisimilar(
        naturals,
        map((x: number) => x, naturals),
        100,
      ),
    ).toBe(true);
  });

  it('isBisimilar de fibonacci consigo mismo', () => {
    expect(isBisimilar(fibonacci, fibonacci, 30)).toBe(true);
  });

  it('isBisimilar detecta divergencia en la cola', () => {
    // a = 0, 1, 2, 3, 4, ...
    // b = 0, 1, 2, 99, 4, ...
    const b = cons(0, () => cons(1, () => cons(2, () => cons(99, () => drop(naturals, 4)))));
    expect(isBisimilar(naturals, b, 10)).toBe(false);
    expect(isBisimilar(naturals, b, 3)).toBe(true); // primeros 3 sí coinciden
  });

  it('isBisimilar funciona con elementos compuestos (objetos planos)', () => {
    const a = iterate((p: { x: number }) => ({ x: p.x + 1 }), { x: 0 });
    const b = map((n: number) => ({ x: n }), naturals);
    expect(isBisimilar(a, b, 20)).toBe(true);
  });

  it('isBisimilar rechaza depth inválido', () => {
    expect(() => isBisimilar(naturals, naturals, -1)).toThrow();
    expect(() => isBisimilar(naturals, naturals, 1.5)).toThrow();
  });
});

describe('Coinduction — bisimulación up-to (prove)', () => {
  // Identidad clásica: map f (map g s) ~ map (f ∘ g) s.
  // La relación que la atestigua: R(a, b) ≡ "a = map f (map g s')
  // y b = map (f∘g) s' para algún s'". Computacionalmente, una vez
  // que sabés que las cabezas coinciden, las colas se obtienen
  // aplicando los destructores; la propiedad se sostiene por
  // construcción. Para `prove`, basta dar una relación que sea
  // verdadera para el par inicial y se mantenga bajo tail.
  it('map (f ∘ g) s  ~  map f (map g s)', () => {
    const f = (n: number) => n + 1;
    const g = (n: number) => n * 2;
    const lhs = map(f, map(g, naturals));
    const rhs = map((n: number) => f(g(n)), naturals);

    const ok = prove(
      {
        initial: [lhs, rhs],
        // Relación: "ambos producen los mismos elementos hasta el inf."
        // El motor de prove ya chequea head equality + avance, asi que
        // basta un trivially-true predicate aquí (es la identidad up-to).
        relation: (_a, _b) => true,
      },
      50,
    );
    expect(ok).toBe(true);
  });

  it('prove falla si la relación es falsa en el par inicial', () => {
    const ok = prove(
      {
        initial: [naturals, naturals],
        relation: (_a, _b) => false,
      },
      5,
    );
    expect(ok).toBe(false);
  });

  it('prove detecta divergencia incluso con relación trivially-true', () => {
    const a = naturals;
    const b = cons(0, () => cons(99, () => drop(naturals, 2)));
    const ok = prove({ initial: [a, b], relation: (_a, _b) => true }, 5);
    expect(ok).toBe(false); // head del segundo paso difiere (1 vs 99)
  });

  it('prove para repeat: repeat x  ~  cons(x, () => repeat x)', () => {
    const x = 42;
    const lhs = repeat(x);
    const rhs: Stream<number> = cons(x, () => repeat(x));
    // Relación R(a, b): "ambos son streams constantes x"
    const ok = prove(
      {
        initial: [lhs, rhs],
        relation: (a: Stream<number>, b: Stream<number>) => a.head === x && b.head === x,
      },
      100,
    );
    expect(ok).toBe(true);
  });

  it('prove para iterate: tail(iterate f x)  ~  iterate f (f x)', () => {
    const f = (n: number) => n + 3;
    const lhs = iterate(f, 0).tail();
    const rhs = iterate(f, f(0));
    const ok = prove(
      {
        initial: [lhs, rhs],
        relation: (_a, _b) => true,
      },
      50,
    );
    expect(ok).toBe(true);
  });

  it('prove rechaza depth inválido', () => {
    expect(() => prove({ initial: [naturals, naturals], relation: () => true }, -1)).toThrow();
  });
});

describe('Coinduction — equality helper', () => {
  const { equal } = __internals;

  it('equal sobre primitivos usa Object.is (NaN igual a NaN)', () => {
    expect(equal(NaN, NaN)).toBe(true);
    expect(equal(1, 1)).toBe(true);
    expect(equal(1, '1')).toBe(false);
  });

  it('equal sobre arrays', () => {
    expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(equal([1, 2], [1, 2, 3])).toBe(false);
  });

  it('equal sobre objetos planos', () => {
    expect(equal({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(equal({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});
