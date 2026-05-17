import { describe, it, expect } from 'vitest';
import { modelCheckCTL, satisfiesCTL, generateWitness, ctlToString } from '../../../logic/profiles/ctl';
import type { CTLFormula, KripkeStructure } from '../../../logic/profiles/ctl';

function st(id: string, labels: string[] = []) {
  return { id, labels: new Set(labels) };
}

const atom = (name: string): CTLFormula => ({ kind: 'atom', name });
const not = (arg: CTLFormula): CTLFormula => ({ kind: 'not', arg });
const and = (...args: CTLFormula[]): CTLFormula => ({ kind: 'and', args });
const or = (...args: CTLFormula[]): CTLFormula => ({ kind: 'or', args });
const implies = (left: CTLFormula, right: CTLFormula): CTLFormula => ({
  kind: 'implies',
  left,
  right,
});
const EX = (arg: CTLFormula): CTLFormula => ({ kind: 'EX', arg });
const AX = (arg: CTLFormula): CTLFormula => ({ kind: 'AX', arg });
const EF = (arg: CTLFormula): CTLFormula => ({ kind: 'EF', arg });
const AF = (arg: CTLFormula): CTLFormula => ({ kind: 'AF', arg });
const EG = (arg: CTLFormula): CTLFormula => ({ kind: 'EG', arg });
const AG = (arg: CTLFormula): CTLFormula => ({ kind: 'AG', arg });
const EU = (left: CTLFormula, right: CTLFormula): CTLFormula => ({
  kind: 'EU',
  left,
  right,
});
const AU = (left: CTLFormula, right: CTLFormula): CTLFormula => ({
  kind: 'AU',
  left,
  right,
});

describe('CTL — labelling base (EX/AX)', () => {
  // Modelo lineal: s0 -> s1 -> s2, p en s1.
  const M: KripkeStructure = {
    states: [st('s0'), st('s1', ['p']), st('s2')],
    transitions: [
      ['s0', 's1'],
      ['s1', 's2'],
    ],
    initial: ['s0'],
  };

  it('AX p se cumple en estados cuyos sucesores cumplen p', () => {
    const sat = modelCheckCTL(M, AX(atom('p')));
    expect(sat.get('s0')).toBe(true); // único sucesor s1 cumple p
    expect(sat.get('s1')).toBe(false); // sucesor s2 no cumple p
    expect(sat.get('s2')).toBe(true); // deadlock → AX vacuamente true
  });

  it('EX p se cumple si algún sucesor cumple p', () => {
    const sat = modelCheckCTL(M, EX(atom('p')));
    expect(sat.get('s0')).toBe(true);
    expect(sat.get('s1')).toBe(false);
    expect(sat.get('s2')).toBe(false); // deadlock → EX trivialmente false
  });

  it('satisfiesCTL evalúa solo sobre estados iniciales', () => {
    expect(satisfiesCTL(M, EX(atom('p')))).toBe(true);
    expect(satisfiesCTL(M, atom('p'))).toBe(false); // s0 no tiene p
  });
});

describe('CTL — alcanzabilidad (EF / AF)', () => {
  // Diamante: s0 → s1, s0 → s2, ambos → s3 (goal).
  const M: KripkeStructure = {
    states: [st('s0'), st('s1'), st('s2'), st('s3', ['goal'])],
    transitions: [
      ['s0', 's1'],
      ['s0', 's2'],
      ['s1', 's3'],
      ['s2', 's3'],
    ],
    initial: ['s0'],
  };

  it('EF goal se cumple en todos los estados que alcanzan s3', () => {
    const sat = modelCheckCTL(M, EF(atom('goal')));
    expect(sat.get('s0')).toBe(true);
    expect(sat.get('s1')).toBe(true);
    expect(sat.get('s2')).toBe(true);
    expect(sat.get('s3')).toBe(true);
  });

  it('AF goal se cumple si todos los caminos llegan a goal', () => {
    const sat = modelCheckCTL(M, AF(atom('goal')));
    expect(sat.get('s0')).toBe(true);
    expect(sat.get('s3')).toBe(true);
  });

  it('AF detecta contraejemplo cuando un camino diverge sin tocar goal', () => {
    const N: KripkeStructure = {
      states: [st('a'), st('b', ['goal']), st('loop')],
      transitions: [
        ['a', 'b'],
        ['a', 'loop'],
        ['loop', 'loop'],
      ],
      initial: ['a'],
    };
    const sat = modelCheckCTL(N, AF(atom('goal')));
    // a tiene un camino al loop sin goal → AF goal falso en a
    expect(sat.get('a')).toBe(false);
    expect(satisfiesCTL(N, AF(atom('goal')))).toBe(false);
  });
});

describe('CTL — invariantes globales (EG / AG)', () => {
  // Ciclo: s0 ↔ s1 con p en ambos, más s2 sin p alcanzable desde s1.
  const M: KripkeStructure = {
    states: [st('s0', ['p']), st('s1', ['p']), st('s2')],
    transitions: [
      ['s0', 's1'],
      ['s1', 's0'],
      ['s1', 's2'],
    ],
    initial: ['s0'],
  };

  it('EG p se cumple en estados con un camino infinito de p', () => {
    const sat = modelCheckCTL(M, EG(atom('p')));
    expect(sat.get('s0')).toBe(true);
    expect(sat.get('s1')).toBe(true);
    expect(sat.get('s2')).toBe(false);
  });

  it('AG p falla cuando hay rama que escapa de p', () => {
    const sat = modelCheckCTL(M, AG(atom('p')));
    // desde s1 podemos llegar a s2 ¬p → AG p falla en s1 y s0
    expect(sat.get('s0')).toBe(false);
    expect(sat.get('s1')).toBe(false);
  });

  it('AG (p → AX q) — invariant pattern', () => {
    const N: KripkeStructure = {
      states: [st('r1', ['p']), st('r2', ['q']), st('r3', ['q'])],
      transitions: [
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'r2'],
      ],
      initial: ['r1'],
    };
    const phi = AG(implies(atom('p'), AX(atom('q'))));
    expect(satisfiesCTL(N, phi)).toBe(true);
  });
});

describe('CTL — until (EU / AU)', () => {
  // a → b → c, p en a y b, goal en c.
  const M: KripkeStructure = {
    states: [st('a', ['p']), st('b', ['p']), st('c', ['goal'])],
    transitions: [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'c'],
    ],
    initial: ['a'],
  };

  it('E[p U goal] vale en a', () => {
    expect(satisfiesCTL(M, EU(atom('p'), atom('goal')))).toBe(true);
  });

  it('EU con loop: A[p U goal] aún se cumple si todos los caminos llegan', () => {
    expect(satisfiesCTL(M, AU(atom('p'), atom('goal')))).toBe(true);
  });

  it('AU falla cuando una rama no llega al goal manteniendo p', () => {
    const N: KripkeStructure = {
      states: [st('s', ['p']), st('t', ['p']), st('u', ['goal']), st('v')],
      transitions: [
        ['s', 't'],
        ['t', 'u'],
        ['s', 'v'], // rama sin goal y sin p
        ['v', 'v'],
      ],
      initial: ['s'],
    };
    expect(satisfiesCTL(N, AU(atom('p'), atom('goal')))).toBe(false);
    // EU sigue valiendo: existe camino s → t → u
    expect(satisfiesCTL(N, EU(atom('p'), atom('goal')))).toBe(true);
  });
});

describe('CTL — operadores booleanos y constantes', () => {
  const M: KripkeStructure = {
    states: [st('x', ['p', 'q']), st('y', ['p'])],
    transitions: [['x', 'y']],
    initial: ['x'],
  };

  it('¬p, p∧q, p∨q, p→q se evalúan local', () => {
    expect(modelCheckCTL(M, not(atom('p'))).get('x')).toBe(false);
    expect(modelCheckCTL(M, and(atom('p'), atom('q'))).get('x')).toBe(true);
    expect(modelCheckCTL(M, and(atom('p'), atom('q'))).get('y')).toBe(false);
    expect(modelCheckCTL(M, or(atom('p'), atom('q'))).get('y')).toBe(true);
    expect(modelCheckCTL(M, implies(atom('q'), atom('p'))).get('y')).toBe(true);
  });

  it('⊤ y ⊥ son constantes', () => {
    expect(modelCheckCTL(M, { kind: 'true' }).get('x')).toBe(true);
    expect(modelCheckCTL(M, { kind: 'false' }).get('y')).toBe(false);
  });
});

describe('CTL — casos degenerados', () => {
  it('Modelo sin transiciones: EX p falso, AX p true por vacuidad', () => {
    const M: KripkeStructure = {
      states: [st('only', ['p'])],
      transitions: [],
      initial: ['only'],
    };
    expect(modelCheckCTL(M, EX(atom('p'))).get('only')).toBe(false);
    expect(modelCheckCTL(M, AX(atom('p'))).get('only')).toBe(true);
  });

  it('Modelo vacío de estados iniciales: satisfiesCTL true por vacuidad', () => {
    const M: KripkeStructure = {
      states: [st('s', ['p'])],
      transitions: [],
      initial: [],
    };
    expect(satisfiesCTL(M, atom('q'))).toBe(true);
  });

  it('Transición a estado desconocido lanza error', () => {
    const bad: KripkeStructure = {
      states: [st('s')],
      transitions: [['s', 'ghost']],
      initial: ['s'],
    };
    expect(() => modelCheckCTL(bad, atom('p'))).toThrow(/ghost/);
  });
});

describe('CTL — witness paths', () => {
  // grafo: a → b → c (goal)
  const M: KripkeStructure = {
    states: [st('a'), st('b'), st('c', ['goal'])],
    transitions: [
      ['a', 'b'],
      ['b', 'c'],
    ],
    initial: ['a'],
  };

  it('witness para EF goal desde a es a → b → c', () => {
    const path = generateWitness(M, EF(atom('goal')), 'a');
    expect(path).toEqual(['a', 'b', 'c']);
  });

  it('witness para EX en deadlock devuelve null', () => {
    const path = generateWitness(M, EX(atom('goal')), 'c');
    expect(path).toBeNull();
  });

  it('witness para EU atraviesa estados que cumplen A', () => {
    const N: KripkeStructure = {
      states: [
        st('s0', ['p']),
        st('s1', ['p']),
        st('s2', ['goal']),
        st('bad'), // sin p y sin goal
      ],
      transitions: [
        ['s0', 's1'],
        ['s1', 's2'],
        ['s0', 'bad'],
        ['bad', 's2'],
      ],
      initial: ['s0'],
    };
    const path = generateWitness(N, EU(atom('p'), atom('goal')), 's0');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('s0');
    expect(path![path!.length - 1]).toBe('s2');
    // Todos los intermedios cumplen p; bad nunca aparece.
    expect(path).not.toContain('bad');
  });

  it('witness para EG construye lasso (último elemento repite en el camino)', () => {
    const N: KripkeStructure = {
      states: [st('a', ['p']), st('b', ['p']), st('c', ['p'])],
      transitions: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'b'],
      ],
      initial: ['a'],
    };
    const path = generateWitness(N, EG(atom('p')), 'a');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('a');
    // El último estado del path debe estar duplicado más atrás (loop back).
    const last = path![path!.length - 1];
    const occurrences = path!.filter((s) => s === last).length;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it('witness para fórmulas universales (AF/AG/AX/AU) devuelve null', () => {
    expect(generateWitness(M, AF(atom('goal')), 'a')).toBeNull();
    expect(generateWitness(M, AG({ kind: 'true' }), 'a')).toBeNull();
    expect(generateWitness(M, AX(atom('goal')), 'b')).toBeNull();
    expect(generateWitness(M, AU(atom('goal'), atom('goal')), 'a')).toBeNull();
  });

  it('witness con state desconocido devuelve null', () => {
    expect(generateWitness(M, EF(atom('goal')), 'ghost')).toBeNull();
  });

  it('witness cuando φ no se cumple en el estado devuelve null', () => {
    const N: KripkeStructure = {
      states: [st('p1'), st('p2')],
      transitions: [['p1', 'p2']],
      initial: ['p1'],
    };
    expect(generateWitness(N, EF(atom('unreachable')), 'p1')).toBeNull();
  });
});

describe('CTL — equivalencias clásicas', () => {
  // Modelo arbitrario para comprobar ¬EX ¬φ ≡ AX φ, ¬EG ¬φ ≡ AF φ, ¬EF ¬φ ≡ AG φ.
  const M: KripkeStructure = {
    states: [st('s0', ['p']), st('s1', ['p']), st('s2'), st('s3', ['p'])],
    transitions: [
      ['s0', 's1'],
      ['s1', 's2'],
      ['s2', 's3'],
      ['s3', 's3'],
    ],
    initial: ['s0'],
  };

  it('AX p ≡ ¬EX ¬p en cada estado', () => {
    const axp = modelCheckCTL(M, AX(atom('p')));
    const negExNeg = modelCheckCTL(M, not(EX(not(atom('p')))));
    for (const id of ['s0', 's1', 's2', 's3']) {
      expect(axp.get(id)).toBe(negExNeg.get(id));
    }
  });

  it('AF p ≡ ¬EG ¬p en cada estado', () => {
    const afp = modelCheckCTL(M, AF(atom('p')));
    const negEgNeg = modelCheckCTL(M, not(EG(not(atom('p')))));
    for (const id of ['s0', 's1', 's2', 's3']) {
      expect(afp.get(id)).toBe(negEgNeg.get(id));
    }
  });

  it('AG p ≡ ¬EF ¬p en cada estado', () => {
    const agp = modelCheckCTL(M, AG(atom('p')));
    const negEfNeg = modelCheckCTL(M, not(EF(not(atom('p')))));
    for (const id of ['s0', 's1', 's2', 's3']) {
      expect(agp.get(id)).toBe(negEfNeg.get(id));
    }
  });
});

describe('CTL — utilidades', () => {
  it('ctlToString renderiza los operadores principales', () => {
    expect(ctlToString(EX(atom('p')))).toBe('EX p');
    expect(ctlToString(AG(implies(atom('p'), AX(atom('q')))))).toContain('AG');
    expect(ctlToString(EU(atom('a'), atom('b')))).toBe('E[a U b]');
    expect(ctlToString(AU(atom('a'), atom('b')))).toBe('A[a U b]');
    expect(ctlToString(not(atom('p')))).toBe('¬p');
    expect(ctlToString({ kind: 'true' })).toBe('⊤');
    expect(ctlToString({ kind: 'false' })).toBe('⊥');
  });
});
