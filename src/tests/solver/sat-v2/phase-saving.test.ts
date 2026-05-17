import { describe, expect, it } from 'vitest';
import { PhaseSaver } from '../../../solver/cdcl-v2';

describe('PhaseSaver', () => {
  it('returns initial phase before any save', () => {
    const negSaver = new PhaseSaver(5, 0);
    const posSaver = new PhaseSaver(5, 1);
    expect(negSaver.getPhase(3)).toBe(0);
    expect(negSaver.pickLit(3)).toBe(-3);
    expect(posSaver.getPhase(3)).toBe(1);
    expect(posSaver.pickLit(3)).toBe(3);
  });

  it('remembers the last polarity per variable', () => {
    const s = new PhaseSaver(4, 0);
    s.save(2); // var 2 = true
    s.save(-4); // var 4 = false
    expect(s.getPhase(2)).toBe(1);
    expect(s.getPhase(4)).toBe(0);
    expect(s.pickLit(2)).toBe(2);
    expect(s.pickLit(4)).toBe(-4);
  });

  it('save with same variable updates the polarity', () => {
    const s = new PhaseSaver(4, 0);
    s.save(3);
    expect(s.getPhase(3)).toBe(1);
    s.save(-3);
    expect(s.getPhase(3)).toBe(0);
  });

  it('ignores out-of-range variables silently', () => {
    const s = new PhaseSaver(3, 1);
    s.save(99);
    s.save(-99);
    expect(s.getPhase(99)).toBe(1);
    expect(s.getPhase(0)).toBe(1);
  });
});
