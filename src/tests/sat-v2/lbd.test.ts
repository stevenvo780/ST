import { describe, expect, it } from 'vitest';
import { computeLBD, selectClausesToRemove, type LearnedMeta } from '../../solver/cdcl-v2';

describe('computeLBD', () => {
  // varLevel[v] = nivel de decisión en que se asignó v (1-indexado).
  // Construimos un mini-estado: vars 1..5 con niveles distintos.
  function mkVarLevel(levels: number[]): Int32Array {
    const out = new Int32Array(levels.length + 1).fill(-1);
    for (let i = 0; i < levels.length; i++) out[i + 1] = levels[i]!;
    return out;
  }

  it('counts distinct decision levels in clause', () => {
    const varLevel = mkVarLevel([1, 1, 2, 3, 3]);
    const seen = new Uint8Array(10);
    // Cláusula con vars {1,3,5} → niveles {1, 2, 3} → LBD = 3.
    expect(computeLBD(new Int32Array([1, -3, 5]), varLevel, seen)).toBe(3);
    // Cláusula con vars {1,2} (mismo nivel 1) → LBD = 1.
    expect(computeLBD(new Int32Array([1, 2]), varLevel, seen)).toBe(1);
    // Cláusula con vars {1,2,4} (niveles 1,1,3) → LBD = 2.
    expect(computeLBD(new Int32Array([-1, 2, 4]), varLevel, seen)).toBe(2);
  });

  it('ignores unassigned variables (level -1)', () => {
    const varLevel = mkVarLevel([1, -1, 2]); // var 2 sin asignar
    const seen = new Uint8Array(10);
    expect(computeLBD(new Int32Array([1, 2, 3]), varLevel, seen)).toBe(2);
  });

  it('resets seenBuffer between calls (idempotent)', () => {
    const varLevel = mkVarLevel([1, 2, 3]);
    const seen = new Uint8Array(10);
    computeLBD(new Int32Array([1, 2, 3]), varLevel, seen);
    // Buffer debe estar todo a cero tras la llamada.
    for (let i = 0; i < seen.length; i++) expect(seen[i]).toBe(0);
  });
});

describe('selectClausesToRemove', () => {
  function mk(
    index: number,
    lbd: number,
    activity: number,
    locked: boolean,
    length: number,
  ): LearnedMeta {
    return { index, lbd, activity, locked, length };
  }

  it('protects glue clauses (LBD <= threshold)', () => {
    const metas = [
      mk(0, 2, 0.1, false, 4),
      mk(1, 1, 0.1, false, 5),
      mk(2, 8, 0.1, false, 6),
      mk(3, 9, 0.1, false, 7),
    ];
    const removed = selectClausesToRemove(metas, 2);
    expect(removed).not.toContain(0);
    expect(removed).not.toContain(1);
    // Sólo candidatas son metas[2], metas[3] (LBD > 2, length > 2, not locked).
    // half = 1, así que se elimina la peor (mayor LBD).
    expect(removed).toEqual([3]);
  });

  it('protects locked clauses', () => {
    const metas = [mk(0, 9, 0.1, true, 5), mk(1, 8, 0.1, false, 6), mk(2, 7, 0.1, false, 7)];
    const removed = selectClausesToRemove(metas, 2);
    expect(removed).not.toContain(0);
  });

  it('protects binary clauses (length <= 2)', () => {
    const metas = [mk(0, 5, 0.1, false, 2), mk(1, 6, 0.1, false, 8), mk(2, 7, 0.1, false, 9)];
    const removed = selectClausesToRemove(metas, 2);
    expect(removed).not.toContain(0);
  });

  it('ranks higher-LBD then lower-activity for removal', () => {
    const metas = [
      mk(0, 10, 5.0, false, 5),
      mk(1, 10, 0.1, false, 5),
      mk(2, 5, 5.0, false, 5),
      mk(3, 5, 0.1, false, 5),
    ];
    // Sorted by (lbd desc, act asc, length desc): [1, 0, 3, 2]. half=2 ⇒ [1, 0].
    const removed = selectClausesToRemove(metas, 2);
    expect(removed.sort()).toEqual([0, 1]);
  });

  it('returns empty when no candidates qualify', () => {
    const metas = [mk(0, 1, 0.1, false, 5), mk(1, 2, 0.1, false, 6)];
    expect(selectClausesToRemove(metas, 2)).toEqual([]);
  });
});
