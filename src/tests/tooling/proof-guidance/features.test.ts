// ============================================================
// Tests: extractFeatures
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractFeatures, featureNames } from '../../../tooling/proof-guidance';
import type { ProofState } from '../../../tooling/proof-guidance';

describe('extractFeatures', () => {
  it('es determinístico: misma entrada → mismas features (orden, nombres, valores)', () => {
    const state: ProofState = {
      goal: 'P → Q',
      hypotheses: ['P', 'P → Q'],
    };
    const a = extractFeatures(state);
    const b = extractFeatures(state);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    // Mismos nombres en mismo orden
    expect(a.map((f) => f.name)).toEqual(b.map((f) => f.name));
  });

  it('numHypotheses refleja el conteo, saturado en 10', () => {
    const empty = extractFeatures({ goal: 'P', hypotheses: [] });
    expect(empty.find((f) => f.name === 'numHypotheses')?.value).toBe(0);

    const three = extractFeatures({ goal: 'P', hypotheses: ['A', 'B', 'C'] });
    expect(three.find((f) => f.name === 'numHypotheses')?.value).toBe(3);

    const many = Array.from({ length: 30 }, (_, i) => `H${i}`);
    const sat = extractFeatures({ goal: 'P', hypotheses: many });
    expect(sat.find((f) => f.name === 'numHypotheses')?.value).toBe(10);
  });

  it('goalDepth cuenta operadores lógicos (saturado en 20)', () => {
    const trivial = extractFeatures({ goal: 'P', hypotheses: [] });
    expect(trivial.find((f) => f.name === 'goalDepth')?.value).toBe(0);

    const arrow = extractFeatures({ goal: 'P → Q', hypotheses: [] });
    expect(arrow.find((f) => f.name === 'goalDepth')?.value).toBe(1);

    const complex = extractFeatures({ goal: '(P ∧ Q) → (R ∨ ¬S)', hypotheses: [] });
    // ∧, →, ∨, ¬ → 4 operadores
    expect(complex.find((f) => f.name === 'goalDepth')?.value).toBe(4);
  });

  it('one-hot de símbolos top-level', () => {
    const fs = extractFeatures({ goal: 'P → Q ∧ R', hypotheses: [] });
    expect(fs.find((f) => f.name === 'hasSymbol:→')?.value).toBe(1);
    expect(fs.find((f) => f.name === 'hasSymbol:∧')?.value).toBe(1);
    expect(fs.find((f) => f.name === 'hasSymbol:∨')?.value).toBe(0);
    expect(fs.find((f) => f.name === 'hasSymbol:¬')?.value).toBe(0);
  });

  it('hypInGoal=1 si una hipótesis aparece textualmente en el goal', () => {
    const yes = extractFeatures({ goal: 'P → Q', hypotheses: ['P'] });
    expect(yes.find((f) => f.name === 'hypInGoal')?.value).toBe(1);

    const no = extractFeatures({ goal: 'X → Y', hypotheses: ['Z'] });
    expect(no.find((f) => f.name === 'hypInGoal')?.value).toBe(0);
  });

  it('hypEqualsGoal=1 cuando hay assumption directa (modus ponens trivial)', () => {
    const direct = extractFeatures({ goal: 'P', hypotheses: ['P', 'Q'] });
    expect(direct.find((f) => f.name === 'hypEqualsGoal')?.value).toBe(1);

    const indirect = extractFeatures({ goal: 'P', hypotheses: ['P → Q'] });
    expect(indirect.find((f) => f.name === 'hypEqualsGoal')?.value).toBe(0);
  });

  it('featureNames() lista incluye todos los nombres que extractFeatures emite', () => {
    const names = featureNames();
    const emitted = new Set(
      extractFeatures({ goal: 'P → Q ∧ R ∨ ¬S ↔ T', hypotheses: ['P'] }).map((f) => f.name),
    );
    for (const n of names) {
      expect(emitted.has(n), `featureNames declares "${n}" pero extractFeatures no lo emite`).toBe(
        true,
      );
    }
  });

  it('goalIsEmpty=1 cuando el goal está vacío (estado cerrado)', () => {
    const empty = extractFeatures({ goal: '', hypotheses: ['P'] });
    expect(empty.find((f) => f.name === 'goalIsEmpty')?.value).toBe(1);

    const nonEmpty = extractFeatures({ goal: 'P', hypotheses: [] });
    expect(nonEmpty.find((f) => f.name === 'goalIsEmpty')?.value).toBe(0);
  });
});
