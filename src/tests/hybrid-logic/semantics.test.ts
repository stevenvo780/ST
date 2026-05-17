// ============================================================
// ST Hybrid Logic — Tests de semántica y satisfacibilidad
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  atom,
  nominal,
  not,
  and,
  implies,
  box,
  diamond,
  at,
  down,
  existsWorld,
  formulaToString,
  satisfies,
  isSatisfiableInFrame,
  isSatisfiable,
  type HybridFrame,
} from '../../profiles/hybrid-logic';

// Helpers para construir frames a mano sin escribir el shape completo.
function frame(spec: {
  worlds: string[];
  accessibility?: Array<[string, string]>;
  nominals?: Record<string, string>;
  valuation?: Record<string, string[]>;
}): HybridFrame {
  const valuation: Record<string, Set<string>> = {};
  for (const [k, v] of Object.entries(spec.valuation ?? {})) valuation[k] = new Set(v);
  return {
    worlds: spec.worlds,
    accessibility: spec.accessibility ?? [],
    nominals: spec.nominals ?? {},
    valuation,
  };
}

describe('Hybrid logic — semántica básica', () => {
  it('un átomo es verdadero en los mundos de su valuación', () => {
    const F = frame({ worlds: ['w0', 'w1'], valuation: { p: ['w0'] } });
    expect(satisfies(F, 'w0', atom('p'))).toBe(true);
    expect(satisfies(F, 'w1', atom('p'))).toBe(false);
  });

  it('un nominal i denota un único mundo del frame', () => {
    const F = frame({ worlds: ['w0', 'w1'], nominals: { i: 'w0' } });
    expect(satisfies(F, 'w0', nominal('i'))).toBe(true);
    expect(satisfies(F, 'w1', nominal('i'))).toBe(false);
  });

  it('@i salta al mundo nombrado por i', () => {
    const F = frame({
      worlds: ['w0', 'w1'],
      nominals: { i: 'w1' },
      valuation: { p: ['w1'] },
    });
    // Evaluamos @i p desde w0; el @ ignora el mundo actual.
    expect(satisfies(F, 'w0', at('i', atom('p')))).toBe(true);
    expect(satisfies(F, 'w0', at('i', not(atom('p'))))).toBe(false);
  });

  it('@i p ∧ @i ¬p es insatisfacible', () => {
    const result = isSatisfiable(and(at('i', atom('p')), at('i', not(atom('p')))));
    expect(result.sat).toBe(false);
  });

  it('@i p tiene modelo si existe algún mundo donde p valga y poder mapear i allí', () => {
    const result = isSatisfiable(at('i', atom('p')));
    expect(result.sat).toBe(true);
    expect(result.frame).toBeDefined();
  });
});

describe('Hybrid logic — diamond/box', () => {
  it('◇φ verdadero sii existe sucesor donde φ vale', () => {
    const F = frame({
      worlds: ['w0', 'w1'],
      accessibility: [['w0', 'w1']],
      valuation: { p: ['w1'] },
    });
    expect(satisfies(F, 'w0', diamond(atom('p')))).toBe(true);
    expect(satisfies(F, 'w1', diamond(atom('p')))).toBe(false); // w1 sin sucesores
  });

  it('□φ vacuamente verdadero en hojas (sin sucesores)', () => {
    const F = frame({ worlds: ['w0'], accessibility: [] });
    expect(satisfies(F, 'w0', box(atom('p')))).toBe(true);
  });
});

describe('Hybrid logic — ↓-binder', () => {
  it('↓i. ◇i es satisfacible sólo en frames con un loop', () => {
    // ↓i. ◇i dice: "el mundo actual es accesible a sí mismo".
    const result = isSatisfiable(down('i', diamond(nominal('i'))));
    expect(result.sat).toBe(true);
    // El frame encontrado debe contener un loop sobre el mundo testigo.
    const w = result.world!;
    const hasLoop = result.frame!.accessibility.some(([u, v]) => u === w && v === w);
    expect(hasLoop).toBe(true);
  });

  it('↓i. □¬i es satisfacible (mundo sin self-loop)', () => {
    const result = isSatisfiable(down('i', box(not(nominal('i')))));
    expect(result.sat).toBe(true);
  });

  it('↓i. ◇◇i sat: alcanzable en 2 saltos volviendo al origen', () => {
    // El modelo más chico es un self-loop w → w (◇◇i con w → w → w).
    const result = isSatisfiable(down('i', diamond(diamond(nominal('i')))));
    expect(result.sat).toBe(true);
    const w = result.world!;
    // Debe existir un camino de longitud 2 desde w que termine en w.
    const acc = result.frame!.accessibility;
    const oneStep = acc.filter(([u]) => u === w).map(([, v]) => v);
    const twoStepBack = oneStep.some((v) => acc.some(([u, dest]) => u === v && dest === w));
    expect(twoStepBack).toBe(true);
  });

  it('↓i. @i p ↔ p (evaluado en w, @i salta a w mismo)', () => {
    const F = frame({ worlds: ['w0', 'w1'], valuation: { p: ['w0'] } });
    expect(satisfies(F, 'w0', down('i', at('i', atom('p'))))).toBe(true);
    expect(satisfies(F, 'w1', down('i', at('i', atom('p'))))).toBe(false);
  });
});

describe('Hybrid logic — ∃-world quantifier', () => {
  it('∃i. @i p es satisfacible sii algún mundo tiene p', () => {
    const result = isSatisfiable(existsWorld('i', at('i', atom('p'))));
    expect(result.sat).toBe(true);
    // El modelo debe tener al menos un mundo con p verdadero.
    const pSet = result.frame!.valuation.p ?? new Set<string>();
    expect(pSet.size).toBeGreaterThan(0);
  });

  it('∃i. @i (p ∧ ¬p) es insatisfacible', () => {
    const result = isSatisfiable(existsWorld('i', at('i', and(atom('p'), not(atom('p'))))));
    expect(result.sat).toBe(false);
  });

  it('∃i. ↓j. (@i p ∧ @j ¬p) sat: dos mundos con valuaciones distintas', () => {
    const phi = existsWorld('i', down('j', and(at('i', atom('p')), at('j', not(atom('p'))))));
    const result = isSatisfiable(phi);
    expect(result.sat).toBe(true);
  });
});

describe('Hybrid logic — combinaciones', () => {
  it('@i (p → @j p) con i y j distintos pero conectados', () => {
    const F = frame({
      worlds: ['w0', 'w1'],
      nominals: { i: 'w0', j: 'w1' },
      valuation: { p: ['w0', 'w1'] },
    });
    expect(satisfies(F, 'w0', at('i', implies(atom('p'), at('j', atom('p')))))).toBe(true);
  });

  it('@i ◇j: i tiene acceso al mundo de j', () => {
    const F = frame({
      worlds: ['w0', 'w1'],
      accessibility: [['w0', 'w1']],
      nominals: { i: 'w0', j: 'w1' },
    });
    expect(satisfies(F, 'w0', at('i', diamond(nominal('j'))))).toBe(true);
    // Sin la arista no se satisface.
    const G = frame({
      worlds: ['w0', 'w1'],
      accessibility: [],
      nominals: { i: 'w0', j: 'w1' },
    });
    expect(satisfies(G, 'w0', at('i', diamond(nominal('j'))))).toBe(false);
  });

  it('isSatisfiableInFrame devuelve el mundo testigo', () => {
    const F = frame({
      worlds: ['w0', 'w1'],
      nominals: { i: 'w1' },
      valuation: { p: ['w1'] },
    });
    const w = isSatisfiableInFrame(F, at('i', atom('p')));
    expect(w).toBeDefined();
  });

  it('nominal libre sin asignación lanza error en satisfies', () => {
    const F = frame({ worlds: ['w0'] });
    expect(() => satisfies(F, 'w0', nominal('i'))).toThrow(/Nominal no asignado/);
  });

  it('@-operator sobre nominal no asignado lanza error en satisfies', () => {
    const F = frame({ worlds: ['w0'] });
    expect(() => satisfies(F, 'w0', at('i', atom('p')))).toThrow(/no asignado/);
  });
});

describe('Hybrid logic — formulaToString', () => {
  it('renderiza notación estándar', () => {
    expect(formulaToString(atom('p'))).toBe('p');
    expect(formulaToString(nominal('i'))).toBe('i');
    expect(formulaToString(not(atom('p')))).toBe('¬p');
    expect(formulaToString(at('i', atom('p')))).toBe('@i p');
    expect(formulaToString(down('i', diamond(nominal('i'))))).toBe('↓i. ◇i');
    expect(formulaToString(existsWorld('i', at('i', atom('p'))))).toBe('∃i. @i p');
    expect(formulaToString(box(atom('p')))).toBe('□p');
    expect(formulaToString(diamond(atom('p')))).toBe('◇p');
  });
});
