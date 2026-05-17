// ============================================================
// Tests: guidedSearch (beam search guiada por modelo)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createEmptyModel,
  guidedSearch,
  trainModel,
  updateModel,
} from '../../../tooling/proof-guidance';
import type { ApplyTactic, ProofState, TacticRecord } from '../../../tooling/proof-guidance';

/**
 * Mini-motor de tácticas mock — lo suficientemente rico para
 * que el beam search tenga algo no-trivial que decidir.
 *
 * Tácticas:
 *  - 'assumption': cierra si goal ∈ hypotheses.
 *  - 'intro': si goal = "A → B", deja goal = B con A agregado a hyps.
 *  - 'modusPonens': si goal = G y hay "X → G" + "X" en hyps, cierra.
 *  - 'split-and': si goal = "A ∧ B", deja goal = A (rama simplificada).
 *  - 'noop': no aplica (siempre devuelve null) — táctica trampa.
 */
const mockApply: ApplyTactic = (state, tactic) => {
  const goal = state.goal.trim();

  if (tactic === 'assumption') {
    if (state.hypotheses.some((h) => h.trim() === goal)) {
      return { goal: '', hypotheses: state.hypotheses };
    }
    return null;
  }

  if (tactic === 'intro') {
    const m = /^(.+?)\s*→\s*(.+)$/.exec(goal);
    if (m) {
      const [, antecedent, consequent] = m;
      return {
        goal: consequent.trim(),
        hypotheses: [...state.hypotheses, antecedent.trim()],
      };
    }
    return null;
  }

  if (tactic === 'modusPonens') {
    // busca "X → G" con X también en hyps
    for (const h of state.hypotheses) {
      const m = /^(.+?)\s*→\s*(.+)$/.exec(h.trim());
      if (m && m[2].trim() === goal) {
        const x = m[1].trim();
        if (state.hypotheses.some((h2) => h2.trim() === x)) {
          return { goal: '', hypotheses: state.hypotheses };
        }
      }
    }
    return null;
  }

  if (tactic === 'split-and') {
    const m = /^(.+?)\s*∧\s*(.+)$/.exec(goal);
    if (m) {
      return { goal: m[1].trim(), hypotheses: state.hypotheses };
    }
    return null;
  }

  return null;
};

describe('guidedSearch', () => {
  it('encuentra prueba simple por assumption directa (intro → assumption)', () => {
    // Goal "A → A" requiere: intro deja goal=A con A en hyps → assumption cierra.
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'P', hypotheses: [] };
    // Test caso donde NO está pre-cerrado: necesita aplicar al menos 1 táctica.
    const wrapped: ProofState = { goal: 'P → P', hypotheses: [] };
    const result = guidedSearch(wrapped, mockApply, model, ['assumption', 'intro', 'modusPonens']);
    expect(result.success).toBe(true);
    expect(result.proof).toBeDefined();
    expect(result.proof!.length).toBeGreaterThanOrEqual(1);
    // El último paso debe cerrar el goal.
    expect(result.proof![result.proof!.length - 1].successful).toBe(true);
    // initial nunca se usa por el caller — sólo lo mantenemos para tipado.
    void initial;
  });

  it('encuentra prueba de modus ponens: P→Q + P ⊢ Q', () => {
    // Entrenamos un modelo trivial para que prefiera modusPonens
    // cuando el goal está en el consecuente de una hipótesis.
    const trainingData: TacticRecord[] = [
      {
        tactic: 'modusPonens',
        beforeState: { goal: 'Q', hypotheses: ['P → Q', 'P'] },
        afterState: { goal: '', hypotheses: ['P → Q', 'P'] },
        successful: true,
      },
      {
        tactic: 'modusPonens',
        beforeState: { goal: 'B', hypotheses: ['A → B', 'A'] },
        afterState: { goal: '', hypotheses: ['A → B', 'A'] },
        successful: true,
      },
      {
        tactic: 'assumption',
        beforeState: { goal: 'Q', hypotheses: ['P → Q', 'P'] },
        afterState: { goal: 'Q', hypotheses: ['P → Q', 'P'] },
        successful: false,
      },
    ];
    const model = trainModel(trainingData, { epochs: 100 });

    const initial: ProofState = { goal: 'Q', hypotheses: ['P → Q', 'P'] };
    const result = guidedSearch(initial, mockApply, model, [
      'assumption',
      'intro',
      'modusPonens',
      'split-and',
    ]);

    expect(result.success).toBe(true);
    expect(result.proof).toBeDefined();
    // La prueba minimal es 1 paso (modusPonens directo).
    expect(result.proof!.length).toBeGreaterThanOrEqual(1);
    expect(result.proof!.some((p) => p.tactic === 'modusPonens')).toBe(true);
  });

  it('encuentra prueba de implicación: ⊢ A → A usando intro', () => {
    // Tras `intro`, queda {goal:'A', hypotheses:['A']} — `isClosed` lo detecta
    // (assumption implícita) sin necesidad de un paso extra. La prueba se cierra
    // en 1 táctica.
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'A → A', hypotheses: [] };
    const result = guidedSearch(initial, mockApply, model, ['intro', 'assumption']);
    expect(result.success).toBe(true);
    expect(result.proof!.length).toBeGreaterThanOrEqual(1);
    expect(result.proof![0].tactic).toBe('intro');
  });

  it('respeta timeout: retorna failure con reason=timeout si excede el presupuesto', () => {
    // Apply que tarda artificialmente — usamos busy-wait corto.
    const slowApply: ApplyTactic = (state) => {
      const t0 = Date.now();
      while (Date.now() - t0 < 5) {
        /* burn */
      }
      // Nunca cierra el goal → search nunca tendrá éxito.
      return { goal: state.goal + 'x', hypotheses: state.hypotheses };
    };
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'P', hypotheses: [] };
    const result = guidedSearch(initial, slowApply, model, ['t1', 't2', 't3'], {
      timeoutMs: 20,
      maxDepth: 50,
      beamWidth: 5,
    });
    expect(result.success).toBe(false);
    expect(result.reason === 'timeout' || result.reason === 'cap').toBe(true);
  });

  it('respeta maxDepth: falla con reason=depth si no puede probar en N pasos', () => {
    // Aplicador que estira el goal indefinidamente sin cerrarlo.
    const grow: ApplyTactic = (state, _tactic) =>
      ({ goal: state.goal + 'x', hypotheses: state.hypotheses }) as ProofState;
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'P', hypotheses: [] };
    const result = guidedSearch(initial, grow, model, ['extender'], {
      maxDepth: 3,
      timeoutMs: 5000,
      beamWidth: 1,
    });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('depth');
  });

  it('beam width afecta el número de estados explorados', () => {
    // Aplicador que produce muchos hijos: cada tactic genera estado distinto.
    const fanout: ApplyTactic = (state, tactic) => ({
      goal: `${state.goal}-${tactic}`,
      hypotheses: state.hypotheses,
    });
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'P', hypotheses: [] };
    const candidates = ['t1', 't2', 't3', 't4'];

    const narrow = guidedSearch(initial, fanout, model, candidates, {
      maxDepth: 4,
      beamWidth: 1,
      timeoutMs: 1000,
    });
    const wide = guidedSearch(initial, fanout, model, candidates, {
      maxDepth: 4,
      beamWidth: 4,
      timeoutMs: 1000,
    });

    expect(wide.exploredStates).toBeGreaterThan(narrow.exploredStates);
  });

  it('retorna éxito inmediato (proof vacío) si el goal ya está cerrado', () => {
    const model = createEmptyModel();
    const initial: ProofState = { goal: '', hypotheses: [] };
    const result = guidedSearch(initial, mockApply, model, ['assumption']);
    expect(result.success).toBe(true);
    expect(result.proof).toEqual([]);
    expect(result.exploredStates).toBe(0);
  });

  it('no entra en ciclo: estados ya visitados se descartan', () => {
    // Aplicador que devuelve el mismo estado (cycle detector debe cortar).
    const identity: ApplyTactic = (state) => ({ goal: state.goal, hypotheses: state.hypotheses });
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'P', hypotheses: [] };
    const result = guidedSearch(initial, identity, model, ['noop'], {
      maxDepth: 100,
      timeoutMs: 1000,
      beamWidth: 5,
    });
    expect(result.success).toBe(false);
    expect(result.exploredStates).toBeLessThan(50); // no debe explotar
  });

  it('exploredStates es coherente: aumenta con maxDepth', () => {
    const fanout: ApplyTactic = (state, tactic) => ({
      goal: `${state.goal}|${tactic}`,
      hypotheses: state.hypotheses,
    });
    const model = createEmptyModel();
    const initial: ProofState = { goal: 'X', hypotheses: [] };
    const shallow = guidedSearch(initial, fanout, model, ['a', 'b', 'c'], {
      maxDepth: 2,
      beamWidth: 3,
      timeoutMs: 1000,
    });
    const deep = guidedSearch(initial, fanout, model, ['a', 'b', 'c'], {
      maxDepth: 6,
      beamWidth: 3,
      timeoutMs: 1000,
    });
    expect(deep.exploredStates).toBeGreaterThan(shallow.exploredStates);
  });
});

describe('integración: train → search', () => {
  it('un modelo entrenado guía la búsqueda hacia tácticas exitosas (modus ponens)', () => {
    // Train data fuerte sobre modusPonens.
    let model = createEmptyModel();
    const goodRecord: TacticRecord = {
      tactic: 'modusPonens',
      beforeState: { goal: 'Q', hypotheses: ['P → Q', 'P'] },
      afterState: { goal: '', hypotheses: ['P → Q', 'P'] },
      successful: true,
    };
    for (let i = 0; i < 30; i++) {
      model = updateModel(model, goodRecord, 0.2);
    }

    const initial: ProofState = { goal: 'Z', hypotheses: ['Y → Z', 'Y'] };
    const result = guidedSearch(
      initial,
      mockApply,
      model,
      ['split-and', 'intro', 'modusPonens', 'assumption'],
      { beamWidth: 1, maxDepth: 5, timeoutMs: 2000 },
    );
    expect(result.success).toBe(true);
    expect(result.proof![0].tactic).toBe('modusPonens');
  });
});
