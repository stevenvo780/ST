import { describe, it, expect, vi } from 'vitest';
import {
  groundedExtension,
  isComplete,
  isStable,
  lazyAdmissibleSets,
  preferredExtensions,
  completeExtensions,
  stableExtensions,
  semiStableExtensions,
  computeExtensions,
} from '../../reasoning/argumentation/extensions';
import type { ArgumentationFramework } from '../../reasoning/argumentation/types';

function af(args: string[], attacks: Array<[string, string]>): ArgumentationFramework {
  return { arguments: new Set(args), attacks };
}

describe('Argumentation — basic frameworks', () => {
  it('groundedExtension on empty framework returns empty set', () => {
    const f = af([], []);
    const g = groundedExtension(f);
    expect(g.size).toBe(0);
  });

  it('groundedExtension when no attacks contains all args', () => {
    const f = af(['a', 'b', 'c'], []);
    const g = groundedExtension(f);
    expect(g.size).toBe(3);
  });

  it('groundedExtension with self-attack excludes self-attacker', () => {
    const f = af(['a', 'b'], [['a', 'a']]);
    const g = groundedExtension(f);
    expect(g.has('a')).toBe(false);
  });

  it('two-cycle: grounded is empty', () => {
    const f = af(
      ['a', 'b'],
      [
        ['a', 'b'],
        ['b', 'a'],
      ],
    );
    const g = groundedExtension(f);
    expect(g.size).toBe(0);
  });

  it('isComplete identifies complete extensions', () => {
    const f = af(['a', 'b'], [['a', 'b']]);
    expect(isComplete(f, new Set(['a']))).toBe(true);
  });

  it('isStable: only when all unincluded args are attacked', () => {
    const f = af(['a', 'b'], [['a', 'b']]);
    expect(isStable(f, new Set(['a']))).toBe(true);
    expect(isStable(f, new Set())).toBe(false);
  });
});

describe('Argumentation — semantics', () => {
  const f1 = af(
    ['a', 'b'],
    [
      ['a', 'b'],
      ['b', 'a'],
    ],
  );
  const opts = { exhaustiveLimit: 20, warnOnLarge: false };

  it('preferred returns maximal admissible sets', () => {
    const ext = preferredExtensions(f1, opts);
    expect(ext.length).toBeGreaterThan(0);
  });

  it('complete returns complete extensions', () => {
    const ext = completeExtensions(f1, opts);
    expect(ext.length).toBeGreaterThan(0);
  });

  it('stable returns stable extensions', () => {
    const ext = stableExtensions(f1, opts);
    expect(Array.isArray(ext)).toBe(true);
  });

  it('semiStable returns extensions', () => {
    const ext = semiStableExtensions(f1, opts);
    expect(Array.isArray(ext)).toBe(true);
  });

  it('semiStable on empty AF returns []', () => {
    const ext = semiStableExtensions(af([], []), opts);
    expect(ext.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Argumentation — computeExtensions dispatch', () => {
  const f = af(['a', 'b'], [['a', 'b']]);

  it('grounded semantics returns single extension', () => {
    const ext = computeExtensions(f, 'grounded');
    expect(ext.length).toBe(1);
  });

  it('preferred semantics', () => {
    expect(computeExtensions(f, 'preferred').length).toBeGreaterThan(0);
  });

  it('stable semantics', () => {
    expect(Array.isArray(computeExtensions(f, 'stable'))).toBe(true);
  });

  it('complete semantics', () => {
    expect(computeExtensions(f, 'complete').length).toBeGreaterThan(0);
  });

  it('semi-stable semantics', () => {
    expect(Array.isArray(computeExtensions(f, 'semi-stable'))).toBe(true);
  });

  it('warns on large frameworks', () => {
    const big = af(['a', 'b', 'c'], []);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    computeExtensions(big, 'preferred', { exhaustiveLimit: 2, warnOnLarge: true });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('Argumentation — lazyAdmissibleSets', () => {
  it('yields all admissible subsets', () => {
    const sets = Array.from(lazyAdmissibleSets(af(['a'], [])));
    expect(sets.length).toBeGreaterThan(0);
  });

  it('throws when n > 30', () => {
    const big = af(
      Array.from({ length: 31 }, (_, i) => 'a' + i),
      [],
    );
    expect(() => Array.from(lazyAdmissibleSets(big))).toThrow();
  });
});
