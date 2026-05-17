import { describe, it, expect } from 'vitest';
import {
  packClauses,
  unpackClauses,
  workersAvailable,
  PARALLEL_THRESHOLD,
  MAX_WORKERS,
} from '../../profiles/classical/parallel-sat';

describe('parallel-sat — packing utilities', () => {
  it('pack and unpack roundtrip for empty array', () => {
    const packed = packClauses([]);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(0);
  });

  it('pack and unpack roundtrip for single clause', () => {
    const clauses = [new Int32Array([1, -2, 3])];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(1);
    expect(Array.from(unpacked[0])).toEqual([1, -2, 3]);
  });

  it('pack and unpack roundtrip for multiple clauses', () => {
    const clauses = [new Int32Array([1, 2]), new Int32Array([-1, 3, 4]), new Int32Array([5])];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(3);
    expect(Array.from(unpacked[0])).toEqual([1, 2]);
    expect(Array.from(unpacked[1])).toEqual([-1, 3, 4]);
    expect(Array.from(unpacked[2])).toEqual([5]);
  });

  it('PARALLEL_THRESHOLD is a positive integer', () => {
    expect(PARALLEL_THRESHOLD).toBeGreaterThan(0);
  });

  it('MAX_WORKERS is a positive integer', () => {
    expect(MAX_WORKERS).toBeGreaterThan(0);
  });

  it('workersAvailable returns a boolean', () => {
    expect(typeof workersAvailable()).toBe('boolean');
  });

  it('workersAvailable is cached (idempotent)', () => {
    const a = workersAvailable();
    const b = workersAvailable();
    expect(a).toBe(b);
  });
});
