import { describe, expect, it } from 'vitest';
import { VSIDS } from '../../../solver/cdcl-v2';

describe('VSIDS', () => {
  it('initializes activities from clause appearances', () => {
    const v = new VSIDS(3, 0.95);
    v.initFromClauses([new Int32Array([1, 2, -3]), new Int32Array([-1, 2])]);
    expect(v.activity[1]).toBe(2);
    expect(v.activity[2]).toBe(2);
    expect(v.activity[3]).toBe(1);
  });

  it('bump increases activity by current varInc', () => {
    const v = new VSIDS(3, 0.95);
    const before = v.activity[2] ?? 0;
    v.bump(2);
    expect(v.activity[2]).toBe(before + v.currentInc);
  });

  it('decayStep amplifies subsequent bumps so newer variables outweigh older', () => {
    const v = new VSIDS(3, 0.5);
    v.bump(1);
    const oldAct = v.activity[1] ?? 0;
    v.decayStep();
    v.bump(2);
    const newAct = v.activity[2] ?? 0;
    // Tras un decayStep con factor 0.5, la nueva activity debe ser 2x la vieja.
    expect(newAct).toBeGreaterThan(oldAct);
    expect(newAct / oldAct).toBeCloseTo(2, 5);
  });

  it('pick chooses the unassigned variable with highest activity', () => {
    const v = new VSIDS(4, 0.95);
    v.activity[1] = 5;
    v.activity[2] = 10;
    v.activity[3] = 7;
    v.activity[4] = 3;
    const varVal = new Int8Array(5);
    expect(v.pick(varVal)).toBe(2);
    varVal[2] = 1; // ya asignada
    expect(v.pick(varVal)).toBe(3);
    varVal[3] = -1;
    expect(v.pick(varVal)).toBe(1);
  });

  it('pick returns 0 when no free variables', () => {
    const v = new VSIDS(2, 0.95);
    v.activity[1] = 1;
    v.activity[2] = 2;
    const varVal = new Int8Array([0, 1, -1]);
    expect(v.pick(varVal)).toBe(0);
  });

  it('rescales activities when they exceed the threshold without losing ordering', () => {
    const v = new VSIDS(2, 0.5);
    // Forzamos muchos decay steps para subir varInc.
    for (let i = 0; i < 2200; i++) v.decayStep();
    v.bump(1);
    v.bump(2);
    v.bump(2);
    // Tras rescale automático, valores deben seguir siendo finitos.
    expect(Number.isFinite(v.activity[1])).toBe(true);
    expect(Number.isFinite(v.activity[2])).toBe(true);
    expect((v.activity[2] ?? 0) > (v.activity[1] ?? 0)).toBe(true);
  });

  it('rejects invalid constructor arguments', () => {
    expect(() => new VSIDS(-1, 0.95)).toThrow();
    expect(() => new VSIDS(3, 0)).toThrow();
    expect(() => new VSIDS(3, 1.5)).toThrow();
  });
});
