// ============================================================
// Tests: trainModel, rankTactics, updateModel, tacticSuccessProbability
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createEmptyModel,
  rankTactics,
  tacticSuccessProbability,
  trainModel,
  updateModel,
} from '../../../tooling/proof-guidance';
import type { ProofState, TacticRecord } from '../../../tooling/proof-guidance';

function record(
  tactic: string,
  beforeState: ProofState,
  afterState: ProofState,
  successful: boolean,
): TacticRecord {
  return { tactic, beforeState, afterState, successful };
}

describe('trainModel', () => {
  it('con 10 records produce modelo con weights aprendidos', () => {
    // Dataset sintético: 'assumption' funciona cuando hypEqualsGoal=1.
    // 'intro' funciona cuando el goal tiene →.
    const records: TacticRecord[] = [
      record('assumption', { goal: 'P', hypotheses: ['P'] }, { goal: '', hypotheses: ['P'] }, true),
      record('assumption', { goal: 'Q', hypotheses: ['Q'] }, { goal: '', hypotheses: ['Q'] }, true),
      record('assumption', { goal: 'R', hypotheses: ['R'] }, { goal: '', hypotheses: ['R'] }, true),
      record(
        'assumption',
        { goal: 'P', hypotheses: ['Q'] },
        { goal: 'P', hypotheses: ['Q'] },
        false,
      ),
      record(
        'assumption',
        { goal: 'A', hypotheses: ['B'] },
        { goal: 'A', hypotheses: ['B'] },
        false,
      ),
      record('intro', { goal: 'P → Q', hypotheses: [] }, { goal: 'Q', hypotheses: ['P'] }, true),
      record('intro', { goal: 'A → B', hypotheses: [] }, { goal: 'B', hypotheses: ['A'] }, true),
      record('intro', { goal: 'X → Y', hypotheses: [] }, { goal: 'Y', hypotheses: ['X'] }, true),
      record('intro', { goal: 'P', hypotheses: [] }, { goal: 'P', hypotheses: [] }, false),
      record('intro', { goal: 'Q', hypotheses: [] }, { goal: 'Q', hypotheses: [] }, false),
    ];

    const model = trainModel(records, { epochs: 100 });

    expect(model.weights.size).toBeGreaterThan(0);
    expect(model.bias.size).toBeGreaterThan(0);
    expect(model.features.length).toBeGreaterThan(0);

    // El modelo debe puntuar 'assumption' alto cuando hypEqualsGoal=1.
    const goodForAssumption: ProofState = { goal: 'P', hypotheses: ['P'] };
    const ranked1 = rankTactics(goodForAssumption, model, ['assumption', 'intro']);
    expect(ranked1[0].tactic).toBe('assumption');

    // Y 'intro' alto cuando el goal tiene →.
    const goodForIntro: ProofState = { goal: 'A → B', hypotheses: [] };
    const ranked2 = rankTactics(goodForIntro, model, ['assumption', 'intro']);
    expect(ranked2[0].tactic).toBe('intro');
  });

  it('modelo vacío (sin records) tiene weights vacíos pero rankea sin crashear', () => {
    const model = trainModel([]);
    expect(model.weights.size).toBe(0);
    const ranked = rankTactics({ goal: 'P', hypotheses: [] }, model, ['a', 'b', 'c']);
    expect(ranked.length).toBe(3);
    // Todas con score 0 — orden estable por idx.
    expect(ranked.every((r) => r.score === 0)).toBe(true);
    expect(ranked.map((r) => r.tactic)).toEqual(['a', 'b', 'c']);
  });
});

describe('rankTactics', () => {
  it('ordena consistentemente: mismo state + model + candidates → mismo ranking', () => {
    const records: TacticRecord[] = [
      record('apply', { goal: 'P', hypotheses: ['P → Q'] }, { goal: 'Q', hypotheses: [] }, true),
      record('apply', { goal: 'A', hypotheses: ['A → B'] }, { goal: 'B', hypotheses: [] }, true),
      record('intro', { goal: 'P → Q', hypotheses: [] }, { goal: 'Q', hypotheses: ['P'] }, true),
      record('intro', { goal: 'X → Y', hypotheses: [] }, { goal: 'Y', hypotheses: ['X'] }, true),
      record('apply', { goal: 'P', hypotheses: [] }, { goal: 'P', hypotheses: [] }, false),
    ];
    const model = trainModel(records, { epochs: 80 });
    const state: ProofState = { goal: 'P', hypotheses: ['P → Q'] };
    const r1 = rankTactics(state, model, ['intro', 'apply', 'assumption']);
    const r2 = rankTactics(state, model, ['intro', 'apply', 'assumption']);
    expect(r1).toEqual(r2);
  });

  it('candidatos no vistos en training reciben score 0 y quedan al final', () => {
    const records: TacticRecord[] = [
      record('foo', { goal: 'P', hypotheses: ['P'] }, { goal: '', hypotheses: ['P'] }, true),
      record('foo', { goal: 'Q', hypotheses: ['Q'] }, { goal: '', hypotheses: ['Q'] }, true),
      record('foo', { goal: 'R', hypotheses: ['R'] }, { goal: '', hypotheses: ['R'] }, true),
    ];
    const model = trainModel(records, { epochs: 80 });
    const state: ProofState = { goal: 'P', hypotheses: ['P'] };
    const ranked = rankTactics(state, model, ['nunca-visto', 'foo']);
    expect(ranked[0].tactic).toBe('foo');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('tie-break determinístico cuando todos los scores son iguales', () => {
    const model = createEmptyModel();
    const state: ProofState = { goal: 'P', hypotheses: [] };
    const ranked = rankTactics(state, model, ['c', 'b', 'a']);
    expect(ranked.map((r) => r.tactic)).toEqual(['c', 'b', 'a']); // mismo orden de entrada
  });
});

describe('updateModel', () => {
  it('converge con repeated updates: la probabilidad estimada se mueve hacia el target', () => {
    let model = createEmptyModel();
    const state: ProofState = { goal: 'P', hypotheses: ['P'] };
    const successRecord: TacticRecord = {
      tactic: 'assumption',
      beforeState: state,
      afterState: { goal: '', hypotheses: ['P'] },
      successful: true,
    };

    const p0 = tacticSuccessProbability(state, model, 'assumption');
    expect(p0).toBeCloseTo(0.5); // bias 0 + features × 0 → sigmoid(0)

    // 200 actualizaciones positivas → la probabilidad debe subir mucho.
    for (let i = 0; i < 200; i++) {
      model = updateModel(model, successRecord, 0.3);
    }
    const pAfter = tacticSuccessProbability(state, model, 'assumption');
    expect(pAfter).toBeGreaterThan(0.9);
  });

  it('updateModel no muta el modelo original (immutable update)', () => {
    const model = createEmptyModel();
    const record: TacticRecord = {
      tactic: 'foo',
      beforeState: { goal: 'P', hypotheses: ['P'] },
      afterState: { goal: '', hypotheses: ['P'] },
      successful: true,
    };
    const sizeBefore = model.weights.size;
    const biasBefore = model.bias.size;
    const next = updateModel(model, record, 0.5);
    expect(model.weights.size).toBe(sizeBefore);
    expect(model.bias.size).toBe(biasBefore);
    expect(next.weights.size).toBeGreaterThanOrEqual(sizeBefore);
  });

  it('updates negativos bajan la probabilidad', () => {
    let model = createEmptyModel();
    const state: ProofState = { goal: 'P', hypotheses: [] };
    const failRecord: TacticRecord = {
      tactic: 'wrong-tactic',
      beforeState: state,
      afterState: state,
      successful: false,
    };
    for (let i = 0; i < 200; i++) {
      model = updateModel(model, failRecord, 0.3);
    }
    const p = tacticSuccessProbability(state, model, 'wrong-tactic');
    expect(p).toBeLessThan(0.1);
  });
});

describe('proofDepthRemaining weighting', () => {
  it('records con menos depth remaining tienen más peso en train', () => {
    // Mismos features y mismas tácticas; el record "close to QED" pesa más.
    const records: TacticRecord[] = [
      {
        tactic: 'finish',
        beforeState: { goal: 'P', hypotheses: ['P'] },
        afterState: { goal: '', hypotheses: ['P'] },
        successful: true,
        proofDepthRemaining: 0,
      },
      {
        tactic: 'finish',
        beforeState: { goal: 'Q', hypotheses: ['Q'] },
        afterState: { goal: '', hypotheses: ['Q'] },
        successful: true,
        proofDepthRemaining: 0,
      },
      {
        tactic: 'finish',
        beforeState: { goal: 'R', hypotheses: ['R'] },
        afterState: { goal: '', hypotheses: ['R'] },
        successful: true,
        proofDepthRemaining: 0,
      },
    ];

    const model = trainModel(records, { epochs: 100 });
    const p = tacticSuccessProbability({ goal: 'X', hypotheses: ['X'] }, model, 'finish');
    expect(p).toBeGreaterThan(0.6);
  });
});
