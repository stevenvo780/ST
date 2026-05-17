// ============================================================
// ST Abduction — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  bestExplanation,
  defaultConsistent,
  defaultEntails,
  findExplanations,
  type AbductionProblem,
  type EntailmentOracle,
  type Formula,
} from '../../../reasoning/abduction';

// ── Helpers para tests con oráculo custom ────────────────────
//
// Un oráculo "set-based" trivial: las premisas son tratadas como un
// set de strings; entails sii target ∈ closure(premises) bajo un set
// de reglas dadas como pares (lhs[]) → rhs.

function makeRuleEntails(
  rules: ReadonlyArray<{ premises: string[]; conclusion: string }>,
): EntailmentOracle {
  return (premises, target) => {
    const facts = new Set<string>(premises);
    let changed = true;
    let iter = 0;
    while (changed && iter < 1000) {
      changed = false;
      iter++;
      for (const r of rules) {
        if (r.premises.every((p) => facts.has(p)) && !facts.has(r.conclusion)) {
          facts.add(r.conclusion);
          changed = true;
        }
      }
    }
    return facts.has(target);
  };
}

// ── Test 1: caso canónico bird(x) → fly(x), observe fly(tweety) ──

describe('abduction — caso canónico bird→fly', () => {
  it('bird(tweety) explica fly(tweety)', () => {
    const problem: AbductionProblem = {
      kb: ['bird(x) → fly(x)'],
      observation: 'fly(tweety)',
      abducibles: ['bird(tweety)'],
    };
    const expls = findExplanations(problem);
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    expect(e0).toBeDefined();
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['bird(tweety)']);
    expect(e0.size).toBe(1);
    expect(e0.parsimonious).toBe(true);
  });

  it('bestExplanation devuelve la única solución', () => {
    const problem: AbductionProblem = {
      kb: ['bird(x) → fly(x)'],
      observation: 'fly(tweety)',
      abducibles: ['bird(tweety)', 'sparrow(tweety)'],
    };
    const best = bestExplanation(problem);
    expect(best).not.toBeNull();
    expect(best?.hypotheses).toEqual(['bird(tweety)']);
  });
});

// ── Test 2: múltiples explicaciones, preferencia minimum-cardinality ──

describe('abduction — preferencia minimum-cardinality', () => {
  // KB:
  //   has_cough ∧ has_fever → flu
  //   flu_short → flu                (un único hecho ya basta)
  // Observation: flu
  // Abducibles: [has_cough, has_fever, flu_short]
  //
  // Explicaciones: {flu_short} (size 1), {has_cough, has_fever} (size 2).
  // minimum-cardinality debe devolver solo {flu_short}.
  const kb = ['has_cough ∧ has_fever → flu', 'flu_short → flu'];
  const abducibles = ['has_cough', 'has_fever', 'flu_short'];
  const problem: AbductionProblem = { kb, observation: 'flu', abducibles };

  it('preferred=all devuelve todas (incluye supersets)', () => {
    const expls = findExplanations(problem, { preferred: 'all' });
    // Hay al menos las dos minimal: {flu_short} y {has_cough, has_fever}.
    const minimal = expls.filter((e) => e.parsimonious);
    const minimalSizes = minimal.map((e) => e.size).sort();
    expect(minimalSizes).toEqual([1, 2]);
    // El total puede incluir supersets no parsimoniosos.
    expect(expls.length).toBeGreaterThanOrEqual(2);
  });

  it('preferred=minimal filtra a las dos parsimoniosas', () => {
    const expls = findExplanations(problem, { preferred: 'minimal' });
    const sizes = expls.map((e) => e.size).sort();
    expect(sizes).toEqual([1, 2]);
    expect(expls.every((e) => e.parsimonious)).toBe(true);
  });

  it('preferred=minimum-cardinality devuelve la pequeña', () => {
    const expls = findExplanations(problem, { preferred: 'minimum-cardinality' });
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['flu_short']);
    expect(e0.size).toBe(1);
  });
});

// ── Test 3: costFunction define preferencia ──────────────────

describe('abduction — preferencia minimum-cost', () => {
  // Dos explicaciones de igual tamaño con costos distintos.
  // KB: cause_a → symptom; cause_b → symptom.
  // Abducibles: [cause_a, cause_b]
  // Costs: cause_a = 5, cause_b = 1
  // → minimum-cost debe preferir cause_b.
  const kb = ['cause_a → symptom', 'cause_b → symptom'];
  const abducibles = ['cause_a', 'cause_b'];
  const problem: AbductionProblem = { kb, observation: 'symptom', abducibles };

  const costFunction = (h: Formula): number => (h === 'cause_a' ? 5 : 1);

  it('minimum-cost selecciona cause_b', () => {
    const expls = findExplanations(problem, {
      costFunction,
      preferred: 'minimum-cost',
    });
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['cause_b']);
    expect(e0.costScore).toBe(1);
  });

  it('bestExplanation con costFunction usa minimum-cost por default', () => {
    const best = bestExplanation(problem, { costFunction });
    expect(best?.hypotheses).toEqual(['cause_b']);
    expect(best?.costScore).toBe(1);
  });
});

// ── Test 4: hipótesis inconsistente rechazada ────────────────

describe('abduction — rechaza hipótesis inconsistente', () => {
  it('no devuelve H que contradice KB', () => {
    // KB: ¬p (de hecho fijo). Abducible: p. Observación: q.
    // {p} es inconsistente con KB → no debe ser explicación.
    // Como no hay forma de explicar q, no hay explicaciones.
    const problem: AbductionProblem = {
      kb: ['¬p'],
      observation: 'q',
      abducibles: ['p'],
    };
    const expls = findExplanations(problem);
    expect(expls).toHaveLength(0);
  });

  it('elige H consistente cuando hay otra opción', () => {
    // KB: ¬p, q_via_r → q
    // Abducibles: p, q_via_r
    // {q_via_r} consistent y entails q → única explicación.
    const problem: AbductionProblem = {
      kb: ['¬p', 'q_via_r → q'],
      observation: 'q',
      abducibles: ['p', 'q_via_r'],
    };
    const expls = findExplanations(problem);
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['q_via_r']);
  });
});

// ── Test 5: observación ya implicada por KB ──────────────────

describe('abduction — KB ya implica O', () => {
  it('devuelve explicación vacía cuando KB ⊨ O', () => {
    // KB ya contiene la observación como hecho.
    const problem: AbductionProblem = {
      kb: ['daylight'],
      observation: 'daylight',
      abducibles: ['sun_up'],
    };
    const expls = findExplanations(problem);
    expect(expls.length).toBeGreaterThan(0);
    const empty = expls.find((e) => e.size === 0);
    expect(empty).toBeDefined();
    expect(empty?.parsimonious).toBe(true);
  });
});

// ── Test 6: sin explicación posible ──────────────────────────

describe('abduction — sin explicación', () => {
  it('devuelve [] cuando ningún subset explica O', () => {
    // KB no conecta abducibles con la observación.
    const problem: AbductionProblem = {
      kb: ['a → b'],
      observation: 'unrelated',
      abducibles: ['a', 'b', 'c'],
    };
    const expls = findExplanations(problem);
    expect(expls).toHaveLength(0);
    expect(bestExplanation(problem)).toBeNull();
  });
});

// ── Test 7: parsimony — supersets no son parsimoniosos ───────

describe('abduction — parsimony por inclusión', () => {
  it('preferred=all marca correctamente parsimonious', () => {
    // KB: a → o
    // Abducibles: [a, b]
    // Explicaciones: {a} y {a,b}. {a,b} no es parsimoniosa (⊃ {a}).
    const problem: AbductionProblem = {
      kb: ['a → o'],
      observation: 'o',
      abducibles: ['a', 'b'],
    };
    const expls = findExplanations(problem, { preferred: 'all' });
    const singleA = expls.find((e) => e.hypotheses.length === 1 && e.hypotheses[0] === 'a');
    const pair = expls.find((e) => e.hypotheses.length === 2);
    expect(singleA?.parsimonious).toBe(true);
    expect(pair?.parsimonious).toBe(false);
  });

  it('preferred=minimal filtra los no parsimoniosos', () => {
    const problem: AbductionProblem = {
      kb: ['a → o'],
      observation: 'o',
      abducibles: ['a', 'b'],
    };
    const expls = findExplanations(problem, { preferred: 'minimal' });
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['a']);
  });
});

// ── Test 8: cadena de implicación profunda ───────────────────

describe('abduction — cadenas de implicaciones', () => {
  it('explica a través de cadena Horn de profundidad 3', () => {
    // a → b, b → c, c → d. Observation: d. Abducible: a.
    const problem: AbductionProblem = {
      kb: ['a → b', 'b → c', 'c → d'],
      observation: 'd',
      abducibles: ['a'],
    };
    const expls = findExplanations(problem);
    expect(expls).toHaveLength(1);
    const e0 = expls[0];
    if (!e0) return;
    expect(e0.hypotheses).toEqual(['a']);
  });
});

// ── Test 9: maxSize acota el espacio ─────────────────────────

describe('abduction — maxSize cap', () => {
  it('respeta maxSize=1 y no encuentra explicaciones de tamaño 2', () => {
    // Solo {a,b} conjuntos explica o; ningún singleton lo logra.
    const problem: AbductionProblem = {
      kb: ['a ∧ b → o'],
      observation: 'o',
      abducibles: ['a', 'b'],
    };
    // Sin cap: encuentra {a,b}.
    const all = findExplanations(problem);
    expect(all).toHaveLength(1);
    // Con maxSize=1: nada.
    const capped = findExplanations(problem, { maxSize: 1 });
    expect(capped).toHaveLength(0);
  });
});

// ── Test 10: oráculo custom (independencia del default) ─────

describe('abduction — oráculo de entailment custom', () => {
  it('soporta oráculo set-based externo', () => {
    const entails = makeRuleEntails([
      { premises: ['rain'], conclusion: 'wet_ground' },
      { premises: ['sprinkler'], conclusion: 'wet_ground' },
    ]);
    const problem: AbductionProblem = {
      kb: [],
      observation: 'wet_ground',
      abducibles: ['rain', 'sprinkler'],
    };
    const expls = findExplanations(problem, {
      entails,
      consistent: () => true,
      preferred: 'all',
    });
    const sizes = expls.map((e) => e.size).sort();
    expect(sizes).toEqual([1, 1, 2]); // {rain}, {sprinkler}, {rain,sprinkler}
    const minimal = expls.filter((e) => e.parsimonious);
    expect(minimal).toHaveLength(2); // {rain} y {sprinkler}
  });

  it('multiple minimal explanations con minimum-cardinality', () => {
    const entails = makeRuleEntails([
      { premises: ['rain'], conclusion: 'wet_ground' },
      { premises: ['sprinkler'], conclusion: 'wet_ground' },
    ]);
    const problem: AbductionProblem = {
      kb: [],
      observation: 'wet_ground',
      abducibles: ['rain', 'sprinkler'],
    };
    const expls = findExplanations(problem, {
      entails,
      consistent: () => true,
      preferred: 'minimum-cardinality',
    });
    expect(expls).toHaveLength(2);
    expect(expls.every((e) => e.size === 1)).toBe(true);
  });
});

// ── Test 11: bestExplanation tiebreak determinista ───────────

describe('abduction — bestExplanation determinismo', () => {
  it('dos corridas devuelven el mismo resultado', () => {
    const problem: AbductionProblem = {
      kb: ['a → o', 'b → o', 'c → o'],
      observation: 'o',
      abducibles: ['a', 'b', 'c'],
    };
    const b1 = bestExplanation(problem);
    const b2 = bestExplanation(problem);
    expect(b1?.hypotheses).toEqual(b2?.hypotheses);
  });
});

// ── Test 12: oráculo de consistencia rechaza ⊥ ──────────────

describe('abduction — defaultConsistent detecta ¬p ∧ p', () => {
  it('KB con p y ¬p reporta inconsistente', () => {
    const consistent = defaultConsistent();
    expect(consistent(['p', '¬p'])).toBe(false);
    expect(consistent(['p', 'q'])).toBe(true);
  });

  it('inconsistencia derivada por forward-chaining', () => {
    const consistent = defaultConsistent();
    // p, p → ¬q, q  ⇒  ¬q ∧ q.
    expect(consistent(['p', 'p → ¬q', 'q'])).toBe(false);
  });
});

// ── Test 13: defaultEntails con cadenas y unificación ───────

describe('abduction — defaultEntails básico', () => {
  it('forward-chaining sin variables', () => {
    const entails = defaultEntails();
    expect(entails(['a', 'a → b'], 'b')).toBe(true);
    expect(entails(['a → b'], 'b')).toBe(false);
  });

  it('forward-chaining con variable única', () => {
    const entails = defaultEntails();
    expect(entails(['p(alice)', 'p(x) → q(x)'], 'q(alice)')).toBe(true);
    expect(entails(['p(alice)', 'p(x) → q(x)'], 'q(bob)')).toBe(false);
  });

  it('forward-chaining con dos variables', () => {
    const entails = defaultEntails();
    expect(
      entails(['parent(alice, bob)', 'parent(x, y) → ancestor(x, y)'], 'ancestor(alice, bob)'),
    ).toBe(true);
  });
});

// ── Test 14: maxHypotheses limita el tamaño del output ──────

describe('abduction — maxHypotheses cap', () => {
  it('no devuelve más explicaciones que maxHypotheses', () => {
    // Muchas hipótesis posibles individuales.
    const kb = ['a → o', 'b → o', 'c → o', 'd → o'];
    const abducibles = ['a', 'b', 'c', 'd'];
    const problem: AbductionProblem = { kb, observation: 'o', abducibles };
    const expls = findExplanations(problem, { maxHypotheses: 2, preferred: 'all' });
    expect(expls.length).toBeLessThanOrEqual(2);
  });
});

// ── Test 15: diagnóstico con costos asimétricos ─────────────

describe('abduction — diagnóstico médico de juguete', () => {
  // KB:
  //   flu → fever
  //   covid → fever
  //   covid → cough
  //   bacterial → fever
  // Observación: fever.
  // Abducibles: flu, covid, bacterial.
  // Sin cost: las tres son explicaciones single-element parsimoniosas.
  // Con cost: flu=1, bacterial=2, covid=10 → flu es la best.
  const kb = ['flu → fever', 'covid → fever', 'covid → cough', 'bacterial → fever'];
  const abducibles = ['flu', 'covid', 'bacterial'];

  it('sin cost, 3 minimal explanations', () => {
    const problem: AbductionProblem = { kb, observation: 'fever', abducibles };
    const expls = findExplanations(problem, { preferred: 'minimum-cardinality' });
    expect(expls).toHaveLength(3);
    expect(expls.every((e) => e.size === 1)).toBe(true);
  });

  it('con cost, flu gana', () => {
    const problem: AbductionProblem = { kb, observation: 'fever', abducibles };
    const cost = (h: Formula): number => {
      if (h === 'flu') return 1;
      if (h === 'bacterial') return 2;
      return 10;
    };
    const best = bestExplanation(problem, { costFunction: cost });
    expect(best?.hypotheses).toEqual(['flu']);
  });
});
