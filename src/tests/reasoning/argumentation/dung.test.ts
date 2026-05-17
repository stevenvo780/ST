/**
 * ST Argumentation — Tests del framework de Dung
 * ================================================
 * Valida predicados (conflict-free, admisible, defiende) y extensiones
 * estándar (grounded, preferred, stable, complete, semi-stable) sobre
 * fixtures canónicos de la literatura.
 */
import { describe, it, expect } from 'vitest';
import {
  createFramework,
  computeExtensions,
  groundedExtension,
  preferredExtensions,
  stableExtensions,
  completeExtensions,
  semiStableExtensions,
  isAdmissible,
  isConflictFree,
  defends,
  characteristicFunction,
  dotExport,
} from '../../../reasoning/argumentation';
import type { ArgumentationFramework } from '../../../reasoning/argumentation';

function setToSortedArray(set: Set<string>): string[] {
  return Array.from(set).sort();
}

function extensionsAsSortedArrays(extensions: Set<string>[]): string[][] {
  return extensions.map(setToSortedArray).sort((a, b) => a.join(',').localeCompare(b.join(',')));
}

function expectExtensions(extensions: Set<string>[], expected: string[][]): void {
  const got = extensionsAsSortedArrays(extensions);
  const want = expected
    .map((arr) => [...arr].sort())
    .sort((a, b) => a.join(',').localeCompare(b.join(',')));
  expect(got).toEqual(want);
}

describe('Argumentation — predicados básicos', () => {
  it('conflict-free detecta ataques internos', () => {
    const af = createFramework(['a', 'b'], [['a', 'b']]);
    expect(isConflictFree(af, new Set(['a']))).toBe(true);
    expect(isConflictFree(af, new Set(['b']))).toBe(true);
    expect(isConflictFree(af, new Set(['a', 'b']))).toBe(false);
    expect(isConflictFree(af, new Set())).toBe(true);
  });

  it('defends correctamente cuando hay contraataque', () => {
    const af = createFramework(
      ['a', 'b', 'c'],
      [
        ['b', 'a'],
        ['c', 'b'],
      ],
    );
    expect(defends(af, new Set(['c']), 'a')).toBe(true);
    expect(defends(af, new Set([]), 'a')).toBe(false);
    expect(defends(af, new Set(['c']), 'c')).toBe(true);
  });

  it('admisible requiere conflict-free + defender a cada miembro', () => {
    const af = createFramework(
      ['a', 'b', 'c'],
      [
        ['b', 'a'],
        ['c', 'b'],
      ],
    );
    expect(isAdmissible(af, new Set([]))).toBe(true);
    expect(isAdmissible(af, new Set(['c']))).toBe(true);
    expect(isAdmissible(af, new Set(['a']))).toBe(false);
    expect(isAdmissible(af, new Set(['a', 'c']))).toBe(true);
    expect(isAdmissible(af, new Set(['b', 'c']))).toBe(false);
  });

  it('characteristicFunction devuelve args defendidos', () => {
    const af = createFramework(
      ['a', 'b', 'c'],
      [
        ['b', 'a'],
        ['c', 'b'],
      ],
    );
    const fc = characteristicFunction(af, new Set(['c']));
    expect(setToSortedArray(fc)).toEqual(['a', 'c']);
  });

  it('createFramework rechaza ataques con argumentos desconocidos', () => {
    expect(() => createFramework(['a'], [['a', 'b']])).toThrow();
    expect(() => createFramework(['a'], [['b', 'a']])).toThrow();
  });
});

describe('Argumentation — AF clásico de Dung {a,b,c} con a↔b, b↔c', () => {
  function buildClassic(): ArgumentationFramework {
    return createFramework(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'a'],
        ['b', 'c'],
        ['c', 'b'],
      ],
    );
  }

  it('grounded = ∅ (b ataca a y c, a y c se atacan mutuamente con b no resuelto)', () => {
    const af = buildClassic();
    const grounded = groundedExtension(af);
    expect(setToSortedArray(grounded)).toEqual([]);
  });

  it('preferred = {{a,c}, {b}}', () => {
    const af = buildClassic();
    const ext = preferredExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [['a', 'c'], ['b']]);
  });

  it('stable = {{a,c}, {b}}', () => {
    const af = buildClassic();
    const ext = stableExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [['a', 'c'], ['b']]);
  });

  it('complete incluye grounded + ambos preferred', () => {
    const af = buildClassic();
    const ext = completeExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [[], ['a', 'c'], ['b']]);
  });

  it('semi-stable = preferred maximizando rango', () => {
    const af = buildClassic();
    const ext = semiStableExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [['a', 'c'], ['b']]);
  });

  it('computeExtensions despacha cada semántica', () => {
    const af = buildClassic();
    expectExtensions(computeExtensions(af, 'grounded'), [[]]);
    expectExtensions(computeExtensions(af, 'preferred'), [['a', 'c'], ['b']]);
    expectExtensions(computeExtensions(af, 'stable'), [['a', 'c'], ['b']]);
    expectExtensions(computeExtensions(af, 'complete'), [[], ['a', 'c'], ['b']]);
    expectExtensions(computeExtensions(af, 'semi-stable'), [['a', 'c'], ['b']]);
  });
});

describe('Argumentation — AF sin ataques', () => {
  it('grounded = todos los argumentos', () => {
    const af = createFramework(['a', 'b', 'c'], []);
    const grounded = groundedExtension(af);
    expect(setToSortedArray(grounded)).toEqual(['a', 'b', 'c']);
  });

  it('preferred = {todos}', () => {
    const af = createFramework(['a', 'b', 'c'], []);
    const ext = preferredExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [['a', 'b', 'c']]);
  });

  it('stable = {todos}', () => {
    const af = createFramework(['a', 'b', 'c'], []);
    const ext = stableExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [['a', 'b', 'c']]);
  });
});

describe('Argumentation — Self-attacker a→a', () => {
  it('grounded = ∅', () => {
    const af = createFramework(['a'], [['a', 'a']]);
    const grounded = groundedExtension(af);
    expect(setToSortedArray(grounded)).toEqual([]);
  });

  it('preferred = {∅} (solo el vacío es admisible)', () => {
    const af = createFramework(['a'], [['a', 'a']]);
    const ext = preferredExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expectExtensions(ext, [[]]);
  });

  it('stable = ∅ (no hay extensión estable: vacío no ataca a "a")', () => {
    const af = createFramework(['a'], [['a', 'a']]);
    const ext = stableExtensions(af, { exhaustiveLimit: 20, warnOnLarge: false });
    expect(ext).toEqual([]);
  });
});

describe('Argumentation — DOT export', () => {
  it('emite digraph sintácticamente válido con nodos y aristas', () => {
    const af = createFramework(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
    );
    const dot = dotExport(af);
    expect(dot).toMatch(/^digraph\s+\w+\s*\{/);
    expect(dot).toMatch(/\}$/);
    expect(dot).toMatch(/"a"\s*->\s*"b";/);
    expect(dot).toMatch(/"b"\s*->\s*"c";/);
    expect(dot).toMatch(/"a";/);
    expect(dot).toMatch(/"b";/);
    expect(dot).toMatch(/"c";/);
  });

  it('escapea comillas dobles en ids', () => {
    const af = createFramework(['arg"1', 'arg2'], [['arg"1', 'arg2']]);
    const dot = dotExport(af);
    expect(dot).toContain('"arg\\"1"');
  });

  it('cada arista tiene formato "x" -> "y";', () => {
    const af = createFramework(['p', 'q'], [['p', 'q']]);
    const dot = dotExport(af);
    const edgeRe = /"[^"]+"\s*->\s*"[^"]+";/g;
    const matches = dot.match(edgeRe);
    expect(matches?.length).toBe(1);
  });
});

describe('Argumentation — Performance bench', () => {
  it('AF de 10 args con 30 ataques aleatorios computa preferred + stable en <500ms', () => {
    const rng = mulberry32(0xc0ffee);
    const args = Array.from({ length: 10 }, (_, i) => `arg${String(i)}`);
    const attacks: Array<[string, string]> = [];
    const seen = new Set<string>();
    while (attacks.length < 30) {
      const i = Math.floor(rng() * 10);
      const j = Math.floor(rng() * 10);
      const key = `${String(i)}-${String(j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const from = args[i];
      const to = args[j];
      if (from === undefined || to === undefined) continue;
      attacks.push([from, to]);
    }
    const af = createFramework(args, attacks);
    const start = performance.now();
    const grounded = computeExtensions(af, 'grounded');
    const preferred = computeExtensions(af, 'preferred', {
      exhaustiveLimit: 20,
      warnOnLarge: false,
    });
    const stable = computeExtensions(af, 'stable', { exhaustiveLimit: 20, warnOnLarge: false });
    const complete = computeExtensions(af, 'complete', { exhaustiveLimit: 20, warnOnLarge: false });
    const semi = computeExtensions(af, 'semi-stable', { exhaustiveLimit: 20, warnOnLarge: false });
    const elapsed = performance.now() - start;
    expect(grounded.length).toBe(1);
    expect(preferred.length).toBeGreaterThanOrEqual(1);
    expect(complete.length).toBeGreaterThanOrEqual(1);
    expect(semi.length).toBeGreaterThanOrEqual(1);
    expect(stable.length).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(500);
  });
});

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
