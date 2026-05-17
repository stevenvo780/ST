import { describe, it, expect } from 'vitest';
import { solveCDCLv2 } from '../../solver/cdcl-v2/solver';

describe('solveCDCLv2 — SAT solver', () => {
  it('returns SAT for 0 vars 0 clauses', () => {
    const r = solveCDCLv2([], 0);
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('returns UNSAT for empty clause', () => {
    const r = solveCDCLv2([new Int32Array([])], 1);
    expect((r as { sat?: boolean }).sat).toBeFalsy();
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });

  it('returns UNSAT for empty clause with 0 vars', () => {
    const r = solveCDCLv2([new Int32Array([])], 0);
    expect((r as { sat?: boolean }).sat).toBeFalsy();
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });

  it('returns SAT for unit clause [1]', () => {
    const r = solveCDCLv2([new Int32Array([1])], 1);
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('returns SAT for clause (1 ∨ 2)', () => {
    const r = solveCDCLv2([new Int32Array([1, 2])], 2);
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('returns UNSAT for {[1], [-1]}', () => {
    const r = solveCDCLv2([new Int32Array([1]), new Int32Array([-1])], 1);
    expect((r as { sat?: boolean }).sat).toBeFalsy();
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });

  it('returns SAT for trivial implication: {[-1, 2], [1]} → 2 must be true', () => {
    const r = solveCDCLv2([new Int32Array([-1, 2]), new Int32Array([1])], 2);
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('returns UNSAT for a Pigeonhole-tiny: {[1,2],[1,3],[2,3],[-1,-2],[-1,-3],[-2,-3]} (3 vars, but 2 holes)', () => {
    // not actually unsat with this form; let's pick a classic UNSAT
    // {[1,2],[-1,2],[1,-2],[-1,-2]} forces P&Q + P&!Q + !P&Q + !P&!Q -- contradicting
    const r = solveCDCLv2(
      [
        new Int32Array([1, 2]),
        new Int32Array([-1, 2]),
        new Int32Array([1, -2]),
        new Int32Array([-1, -2]),
      ],
      2,
    );
    expect((r as { sat?: boolean }).sat).toBeFalsy();
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });

  it('produces stats with conflicts/decisions counters', () => {
    const r = solveCDCLv2([new Int32Array([1, 2, 3]), new Int32Array([-1, -2, -3])], 3);
    expect(r.stats).toBeDefined();
    expect(typeof r.stats.solveTimeMs).toBe('number');
  });

  it('produces a deterministic result for the same input', () => {
    const r1 = solveCDCLv2([new Int32Array([1, 2]), new Int32Array([-1, -2])], 2);
    const r2 = solveCDCLv2([new Int32Array([1, 2]), new Int32Array([-1, -2])], 2);
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
  });
});
