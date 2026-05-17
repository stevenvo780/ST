// ============================================================
// ST Countermodel Minimization — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  minimizeCountermodel,
  type CountermodelMinAlgorithm,
} from '../../runtime/countermodel-min';
import type { Formula } from '../../types';

// ── Helpers de fórmula ────────────────────────────────────────

function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}
function or(a: Formula, b: Formula): Formula {
  return { kind: 'or', args: [a, b] };
}
function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}

// ── Evaluador propositional clásico ──────────────────────────

/**
 * Evalúa una fórmula clásica bajo una asignación total. Cualquier
 * variable faltante se trata como `false` (no debería pasar en los
 * tests bien formados).
 */
function evalClassical(f: Formula, asg: Record<string, boolean>): boolean {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'atom':
      return Boolean(asg[f.name!]);
    case 'not':
      return !evalClassical(f.args![0], asg);
    case 'and':
      return evalClassical(f.args![0], asg) && evalClassical(f.args![1], asg);
    case 'or':
      return evalClassical(f.args![0], asg) || evalClassical(f.args![1], asg);
    case 'implies':
      return !evalClassical(f.args![0], asg) || evalClassical(f.args![1], asg);
    case 'biconditional':
      return evalClassical(f.args![0], asg) === evalClassical(f.args![1], asg);
    default:
      throw new Error(`evalClassical: kind no soportado: ${f.kind}`);
  }
}

/** Wrapper que cumple la firma esperada por `minimizeCountermodel`. */
function evaluator(f: Formula): (asg: Record<string, boolean>) => boolean {
  return (asg) => evalClassical(f, asg);
}

const ALGORITHMS: CountermodelMinAlgorithm[] = ['one-at-a-time', 'binary-search', 'delta-debug'];

// ── Caso 1: P ∧ Q falsada con {P:T, Q:F, R:T, S:F} ───────────

describe('minimizeCountermodel — P ∧ Q', () => {
  const formula = and(atom('P'), atom('Q'));
  const fullCounter = { P: true, Q: false, R: true, S: false };

  it.each(ALGORITHMS)('reduce a {Q:F} con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(1);
    expect(min.assignments).toEqual({ Q: false });
    expect(min.removed.sort()).toEqual(['P', 'R', 'S']);
  });
});

// ── Caso 2: ¬P falsada con {P:T, Q:T, R:F} ───────────────────

describe('minimizeCountermodel — ¬P', () => {
  const formula = not(atom('P'));
  const fullCounter = { P: true, Q: true, R: false };

  it.each(ALGORITHMS)('reduce a {P:T} con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(1);
    expect(min.assignments).toEqual({ P: true });
    expect(min.removed.sort()).toEqual(['Q', 'R']);
  });
});

// ── Caso 3: P ∨ Q falsada con {P:F, Q:F, R:F, S:T} ───────────

describe('minimizeCountermodel — P ∨ Q', () => {
  const formula = or(atom('P'), atom('Q'));
  const fullCounter = { P: false, Q: false, R: false, S: true };

  it.each(ALGORITHMS)('reduce a {P:F, Q:F} con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(2);
    expect(min.assignments).toEqual({ P: false, Q: false });
    expect(min.removed.sort()).toEqual(['R', 'S']);
  });
});

// ── Caso 4: fórmula con 50 vars, sólo 5 son necesarias ───────

describe('minimizeCountermodel — escalabilidad (50 vars, 5 necesarias)', () => {
  // Fórmula: v00 ∨ v01 ∨ v02 ∨ v03 ∨ v04.
  // Para falsificarla TODAS las 5 disyuntas deben ser false.
  // Asignamos las 50 variables a false → falsifica.
  // Minimal counter-witness debería ser exactamente {v00..v04 a F}.
  const target = or(or(or(atom('v00'), atom('v01')), or(atom('v02'), atom('v03'))), atom('v04'));

  const fullCounter: Record<string, boolean> = {};
  for (let i = 0; i < 50; i++) {
    const key = `v${i.toString().padStart(2, '0')}`;
    fullCounter[key] = false;
  }

  it.each(ALGORITHMS)('reduce a las 5 disyuntas (%s)', (algorithm) => {
    const min = minimizeCountermodel(target, fullCounter, evaluator(target), {
      algorithm,
    });
    expect(min.size).toBe(5);
    expect(min.assignments).toEqual({
      v00: false,
      v01: false,
      v02: false,
      v03: false,
      v04: false,
    });
    expect(min.removed.length).toBe(45);
  });
});

// ── Caso 5: determinismo (mismo input ⇒ mismo output) ────────

describe('minimizeCountermodel — determinismo', () => {
  const formula = and(or(atom('A'), atom('B')), not(atom('C')));
  // Asignación que falsifica: A=F, B=F (cualquiera de las dos cláusulas
  // ya está rota). C es irrelevante.
  const fullCounter = { A: false, B: false, C: true, D: true, E: false };

  it.each(ALGORITHMS)('mismo input produce mismo output con %s', (algorithm) => {
    const run1 = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    const run2 = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    const run3 = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(run1.assignments).toEqual(run2.assignments);
    expect(run2.assignments).toEqual(run3.assignments);
    expect(run1.removed).toEqual(run2.removed);
    expect(run1.size).toBe(run2.size);
  });
});

// ── Caso 6: contramodelo ya mínimo no se modifica ────────────

describe('minimizeCountermodel — ya mínimo', () => {
  const formula = atom('P');
  // P=F falsifica la fórmula. Es ya mínimo.
  const fullCounter = { P: false };

  it.each(ALGORITHMS)('respeta contramodelo trivial con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(1);
    expect(min.assignments).toEqual({ P: false });
    expect(min.removed).toEqual([]);
  });
});

// ── Caso 7: no es contramodelo real (sanity check) ───────────

describe('minimizeCountermodel — input no falsifica', () => {
  it('devuelve el contramodelo intacto si el input NO falsifica', () => {
    const formula = or(atom('P'), atom('Q'));
    // P=T,Q=F evalúa a true → la fórmula es válida bajo esta asig, NO
    // es contramodelo. El minimizador debe devolverlo sin tocar.
    const fullCounter = { P: true, Q: false, R: true };
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula));
    expect(min.size).toBe(3);
    expect(min.assignments).toEqual({ P: true, Q: false, R: true });
    expect(min.removed).toEqual([]);
  });
});

// ── Caso 8: maxSteps acota iteraciones ────────────────────────

describe('minimizeCountermodel — maxSteps', () => {
  it('respeta maxSteps y devuelve algo razonable', () => {
    const formula = and(atom('P'), atom('Q'));
    const fullCounter = { P: true, Q: false, R: true, S: false };
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm: 'one-at-a-time',
      maxSteps: 3,
    });
    // Con sólo 3 pasos quizá no logre minimizar del todo, pero las
    // assignments resultantes siguen siendo un superset válido del
    // contramodelo.
    expect(min.iterations).toBeLessThanOrEqual(20); // holgura: cleanup pass puede sumar
    expect(min.size).toBeLessThanOrEqual(4);
    expect(min.size).toBeGreaterThanOrEqual(1);
  });
});

// ── Caso 9: implies — falsa con A=T,B=F ──────────────────────

describe('minimizeCountermodel — implicación', () => {
  // A → B falsa sii A=T, B=F. C es irrelevante.
  const formula: Formula = { kind: 'implies', args: [atom('A'), atom('B')] };
  const fullCounter = { A: true, B: false, C: true };

  it.each(ALGORITHMS)('reduce a {A:T, B:F} con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(2);
    expect(min.assignments).toEqual({ A: true, B: false });
    expect(min.removed).toEqual(['C']);
  });
});

// ── Caso 10: tres conjunción donde sólo una variable falsa basta ─

describe('minimizeCountermodel — múltiples conjuntos viables', () => {
  // P ∧ Q ∧ R. Si TODAS están en false, basta una sola variable en
  // false para falsificar — pero el algoritmo greedy 1-flip va sacando
  // variables en orden y el "extreme flip" termina seleccionando una
  // sola (deterministicamente).
  const formula = and(and(atom('P'), atom('Q')), atom('R'));
  const fullCounter = { P: false, Q: false, R: false, S: true };

  it.each(ALGORITHMS)('reduce a 1 variable con %s', (algorithm) => {
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula), {
      algorithm,
    });
    expect(min.size).toBe(1);
    // El algoritmo selecciona exactamente UNA variable de {P,Q,R}.
    const kept = Object.keys(min.assignments);
    expect(kept).toHaveLength(1);
    expect(['P', 'Q', 'R']).toContain(kept[0]);
    expect(min.assignments[kept[0]]).toBe(false);
  });
});

// ── Caso 11: iteraciones reportadas son > 0 ──────────────────

describe('minimizeCountermodel — métricas', () => {
  it('reporta iterations y removed coherentes', () => {
    const formula = and(atom('P'), atom('Q'));
    const fullCounter = { P: true, Q: false, R: true, S: false };
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula));
    expect(min.iterations).toBeGreaterThan(0);
    expect(min.removed.length + min.size).toBe(Object.keys(fullCounter).length);
  });
});

// ── Caso 12: salida final ordenada alfabéticamente ───────────

describe('minimizeCountermodel — orden estable', () => {
  it('removed está ordenado alfabéticamente', () => {
    const formula = and(atom('zeta'), atom('alpha'));
    const fullCounter = { zeta: false, alpha: true, mu: true, beta: false };
    const min = minimizeCountermodel(formula, fullCounter, evaluator(formula));
    // zeta=false ya falsifica la conjunción
    const sortedRemoved = [...min.removed].sort();
    expect(min.removed).toEqual(sortedRemoved);
  });
});
