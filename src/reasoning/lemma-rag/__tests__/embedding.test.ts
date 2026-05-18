// ============================================================
// Tests: HashEmbedding — propiedades del vector de embedding
// ============================================================

import { describe, it, expect } from 'vitest';
import { hashEmbed, normalizeEmbedding } from '../embedding';
import { EMBEDDING_DIM } from '../types';

describe('hashEmbed — dimensión y tipos', () => {
  it('devuelve un Float32Array de dimensión EMBEDDING_DIM', () => {
    const v = hashEmbed('P → Q');
    expect(v).toBeInstanceOf(Float32Array);
    expect(v.length).toBe(EMBEDDING_DIM);
  });

  it('no contiene NaN ni Infinity', () => {
    const v = hashEmbed('∀x. P(x) ∧ Q(x)');
    for (let i = 0; i < v.length; i++) {
      expect(Number.isFinite(v[i])).toBe(true);
    }
  });

  it('vector vacío no tiene NaN', () => {
    const v = hashEmbed('');
    for (let i = 0; i < v.length; i++) {
      expect(Number.isFinite(v[i]!)).toBe(true);
    }
  });

  it('EMBEDDING_DIM es 256', () => {
    expect(EMBEDDING_DIM).toBe(256);
  });
});

describe('hashEmbed — determinismo', () => {
  it('la misma fórmula produce el mismo vector (llamada simple)', () => {
    const f = '(P ∧ Q) → P';
    const v1 = hashEmbed(f);
    const v2 = hashEmbed(f);
    expect(Array.from(v1)).toEqual(Array.from(v2));
  });

  it('la misma fórmula produce el mismo vector (llamadas repetidas)', () => {
    const f = '¬¬P → P';
    const vecs = Array.from({ length: 5 }, () => hashEmbed(f));
    for (const v of vecs) {
      expect(Array.from(v)).toEqual(Array.from(vecs[0]!));
    }
  });

  it('fórmulas diferentes producen vectores diferentes', () => {
    const v1 = hashEmbed('P → Q');
    const v2 = hashEmbed('P ∧ Q');
    const diff = Array.from(v1).reduce((acc, x, i) => acc + Math.abs(x - (v2[i] ?? 0)), 0);
    expect(diff).toBeGreaterThan(0);
  });
});

describe('hashEmbed — normalización L2', () => {
  it('el vector normalizado tiene norma ≈ 1', () => {
    const v = hashEmbed('P ∨ ¬P');
    let norm = 0;
    for (let i = 0; i < v.length; i++) norm += (v[i] ?? 0) ** 2;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });

  it('normalizeEmbedding(zero) no produce NaN', () => {
    const zero = new Float32Array(EMBEDDING_DIM);
    const norm = normalizeEmbedding(zero);
    for (let i = 0; i < norm.length; i++) {
      expect(Number.isFinite(norm[i]!)).toBe(true);
    }
  });

  it('normalizeEmbedding idempotente sobre vector ya normalizado', () => {
    const v = hashEmbed('□P → P');
    const v2 = normalizeEmbedding(v);
    let norm = 0;
    for (let i = 0; i < v2.length; i++) norm += (v2[i] ?? 0) ** 2;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });
});

describe('hashEmbed — localidad semántica', () => {
  it('commutativity: P∧Q y Q∧P tienen similarity > 0.5', () => {
    const v1 = hashEmbed('P ∧ Q');
    const v2 = hashEmbed('Q ∧ P');
    let dot = 0;
    for (let i = 0; i < v1.length; i++) dot += (v1[i] ?? 0) * (v2[i] ?? 0);
    expect(dot).toBeGreaterThan(0.5);
  });

  it('fórmulas modales cercanas tienen similarity > 0.3', () => {
    const v1 = hashEmbed('□P → P');
    const v2 = hashEmbed('□Q → Q');
    let dot = 0;
    for (let i = 0; i < v1.length; i++) dot += (v1[i] ?? 0) * (v2[i] ?? 0);
    expect(dot).toBeGreaterThan(0.3);
  });

  it('fórmulas de distintos dominios tienen similarity < 0.95', () => {
    const vProp = hashEmbed('P ∧ Q → P');
    const vArith = hashEmbed('∀n. n + 0 = n');
    let dot = 0;
    for (let i = 0; i < vProp.length; i++) dot += (vProp[i] ?? 0) * (vArith[i] ?? 0);
    expect(dot).toBeLessThan(0.95);
  });
});
