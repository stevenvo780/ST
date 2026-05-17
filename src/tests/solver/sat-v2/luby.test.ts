import { describe, expect, it } from 'vitest';
import { LubyRestartPolicy, luby, lubySequence } from '../../../solver/cdcl-v2';

describe('luby sequence', () => {
  it('matches the canonical first 15 terms', () => {
    // Knuth (1991) — 1, 1, 2, 1, 1, 2, 4, 1, 1, 2, 1, 1, 2, 4, 8, ...
    expect(lubySequence(15)).toEqual([1, 1, 2, 1, 1, 2, 4, 1, 1, 2, 1, 1, 2, 4, 8]);
  });

  it('is deterministic across repeated calls', () => {
    const a = lubySequence(32);
    const b = Array.from({ length: 32 }, (_, i) => luby(i));
    expect(a).toEqual(b);
  });

  it('places powers of two at indices 2^k - 2 (0-indexed)', () => {
    // En 0-index, el k-ésimo "pico" de 2^(k-1) aparece en posición 2^k - 2.
    // i=0 → 1, i=2 → 2, i=6 → 4, i=14 → 8, i=30 → 16, i=62 → 32.
    expect(luby(0)).toBe(1);
    expect(luby(1)).toBe(1);
    expect(luby(2)).toBe(2);
    expect(luby(6)).toBe(4);
    expect(luby(14)).toBe(8);
    expect(luby(30)).toBe(16);
    expect(luby(62)).toBe(32);
  });

  it('throws on negative or non-finite indices', () => {
    expect(() => luby(-1)).toThrow();
    expect(() => luby(Infinity)).toThrow();
    expect(() => luby(NaN)).toThrow();
  });
});

describe('LubyRestartPolicy', () => {
  it('multiplies each luby term by base', () => {
    const p = new LubyRestartPolicy(50);
    expect(p.next()).toBe(50);
    expect(p.next()).toBe(50);
    expect(p.next()).toBe(100);
    expect(p.next()).toBe(50);
    expect(p.next()).toBe(50);
    expect(p.next()).toBe(100);
    expect(p.next()).toBe(200);
  });

  it('rejects non-positive base', () => {
    expect(() => new LubyRestartPolicy(0)).toThrow();
    expect(() => new LubyRestartPolicy(-10)).toThrow();
  });

  it('reset restarts the iteration', () => {
    const p = new LubyRestartPolicy(1);
    p.next();
    p.next();
    p.next();
    expect(p.index).toBe(3);
    p.reset();
    expect(p.index).toBe(0);
    expect(p.next()).toBe(1);
  });
});
