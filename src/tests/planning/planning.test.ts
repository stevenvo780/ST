// ============================================================
// ST Planning — Tests (STRIPS / PDDL light)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  aStarPlan,
  applyAction,
  bfsPlan,
  fastForwardHeuristic,
  goalCountHeuristic,
  goalSatisfied,
  ground,
  groundAll,
  hashState,
  makeFFHeuristic,
  preconditionsSatisfied,
  substituteVars,
  type Fact,
  type Plan,
  type STRIPSAction,
  type STRIPSProblem,
} from '../../runtime/planning';

// ──────────────────────────────────────────────────────────────
// Dominio: Blocks World
// ──────────────────────────────────────────────────────────────
//
// Predicados:
//   on(?x, ?y)     — bloque x está sobre bloque y
//   on-table(?x)   — bloque x está sobre la mesa
//   clear(?x)      — no hay bloque encima de x
//   holding(?x)    — el brazo robot sostiene x
//   arm-empty      — el brazo está libre
//
// Acciones:
//   pickup(?x):        clear(?x) ∧ on-table(?x) ∧ arm-empty →
//                      holding(?x) ∧ ¬on-table(?x) ∧ ¬clear(?x) ∧ ¬arm-empty
//   putdown(?x):       holding(?x) →
//                      on-table(?x) ∧ clear(?x) ∧ arm-empty ∧ ¬holding(?x)
//   stack(?x, ?y):     holding(?x) ∧ clear(?y) →
//                      on(?x,?y) ∧ clear(?x) ∧ arm-empty ∧ ¬holding(?x) ∧ ¬clear(?y)
//   unstack(?x, ?y):   on(?x,?y) ∧ clear(?x) ∧ arm-empty →
//                      holding(?x) ∧ clear(?y) ∧ ¬on(?x,?y) ∧ ¬clear(?x) ∧ ¬arm-empty

const blocksWorldActions: STRIPSAction[] = [
  {
    name: 'pickup',
    parameters: ['?x'],
    preconditions: ['clear(?x)', 'on-table(?x)', 'arm-empty'],
    addList: ['holding(?x)'],
    delList: ['on-table(?x)', 'clear(?x)', 'arm-empty'],
  },
  {
    name: 'putdown',
    parameters: ['?x'],
    preconditions: ['holding(?x)'],
    addList: ['on-table(?x)', 'clear(?x)', 'arm-empty'],
    delList: ['holding(?x)'],
  },
  {
    name: 'stack',
    parameters: ['?x', '?y'],
    preconditions: ['holding(?x)', 'clear(?y)'],
    addList: ['on(?x,?y)', 'clear(?x)', 'arm-empty'],
    delList: ['holding(?x)', 'clear(?y)'],
  },
  {
    name: 'unstack',
    parameters: ['?x', '?y'],
    preconditions: ['on(?x,?y)', 'clear(?x)', 'arm-empty'],
    addList: ['holding(?x)', 'clear(?y)'],
    delList: ['on(?x,?y)', 'clear(?x)', 'arm-empty'],
  },
];

function blocksProblem(
  initial: Iterable<Fact>,
  goal: Iterable<Fact>,
  blocks: string[] = ['a', 'b', 'c'],
): STRIPSProblem {
  return {
    predicates: ['on', 'on-table', 'clear', 'holding', 'arm-empty'],
    objects: { block: blocks },
    actions: blocksWorldActions,
    initialState: new Set(initial),
    goal: new Set(goal),
  };
}

// ──────────────────────────────────────────────────────────────
// 1. substituteVars y ground
// ──────────────────────────────────────────────────────────────

describe('planning — substituteVars', () => {
  it('reemplaza variables ?x por sus valores', () => {
    expect(substituteVars('on(?x,?y)', { '?x': 'a', '?y': 'b' })).toBe('on(a,b)');
  });

  it('no toca strings sin variables', () => {
    expect(substituteVars('arm-empty', {})).toBe('arm-empty');
  });

  it('respeta boundaries (no confunde ?x con ?xy)', () => {
    expect(substituteVars('p(?xy,?x)', { '?x': 'A', '?xy': 'B' })).toBe('p(B,A)');
  });

  it('deja la variable sin tocar si no está en bindings', () => {
    expect(substituteVars('p(?x)', {})).toBe('p(?x)');
  });
});

describe('planning — ground', () => {
  it('aplica bindings a un schema lifted', () => {
    const action: STRIPSAction = {
      name: 'move',
      parameters: ['?from', '?to'],
      preconditions: ['at(?from)'],
      addList: ['at(?to)'],
      delList: ['at(?from)'],
    };
    const g = ground(action, { '?from': 'a', '?to': 'b' });
    expect(g.preconditions.has('at(a)')).toBe(true);
    expect(g.addList.has('at(b)')).toBe(true);
    expect(g.delList.has('at(a)')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. applyAction y goalSatisfied
// ──────────────────────────────────────────────────────────────

describe('planning — applyAction', () => {
  it('borra antes de añadir', () => {
    const state = new Set(['p', 'q']);
    const next = applyAction(state, {
      addList: new Set(['r']),
      delList: new Set(['p']),
    });
    expect(next.has('p')).toBe(false);
    expect(next.has('q')).toBe(true);
    expect(next.has('r')).toBe(true);
  });

  it('no muta el estado original', () => {
    const state = new Set(['p']);
    applyAction(state, { addList: new Set(['q']), delList: new Set() });
    expect(state.has('q')).toBe(false);
    expect(state.size).toBe(1);
  });

  it('si un hecho está en addList y delList, queda añadido (del primero)', () => {
    const state = new Set(['p']);
    const next = applyAction(state, {
      addList: new Set(['p']),
      delList: new Set(['p']),
    });
    expect(next.has('p')).toBe(true);
  });
});

describe('planning — goalSatisfied', () => {
  it('goal vacío siempre satisfecho', () => {
    expect(goalSatisfied(new Set(['p']), new Set())).toBe(true);
  });

  it('goal ⊆ state → true', () => {
    expect(goalSatisfied(new Set(['p', 'q', 'r']), new Set(['p', 'r']))).toBe(true);
  });

  it('goal ⊄ state → false', () => {
    expect(goalSatisfied(new Set(['p']), new Set(['p', 'q']))).toBe(false);
  });
});

describe('planning — preconditionsSatisfied', () => {
  it('todas presentes → true', () => {
    expect(preconditionsSatisfied(new Set(['a', 'b']), new Set(['a']))).toBe(true);
  });

  it('falta una → false', () => {
    expect(preconditionsSatisfied(new Set(['a']), new Set(['a', 'b']))).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// 3. groundAll y hashState
// ──────────────────────────────────────────────────────────────

describe('planning — groundAll', () => {
  it('|params|=1, |objs|=3 → 3 instancias', () => {
    const a: STRIPSAction = {
      name: 'p',
      parameters: ['?x'],
      preconditions: [],
      addList: ['p(?x)'],
      delList: [],
    };
    const insts = groundAll(a, { block: ['a', 'b', 'c'] });
    expect(insts).toHaveLength(3);
    const bindings = insts.map((i) => i.bindings['?x']).sort();
    expect(bindings).toEqual(['a', 'b', 'c']);
  });

  it('|params|=2, |objs|=3 → 9 instancias (producto cartesiano)', () => {
    const a: STRIPSAction = {
      name: 'p',
      parameters: ['?x', '?y'],
      preconditions: [],
      addList: ['p(?x,?y)'],
      delList: [],
    };
    const insts = groundAll(a, { block: ['a', 'b', 'c'] });
    expect(insts).toHaveLength(9);
  });

  it('|params|=0 → 1 instancia ground tal cual', () => {
    const a: STRIPSAction = {
      name: 'noop',
      parameters: [],
      preconditions: ['p'],
      addList: ['q'],
      delList: [],
    };
    const insts = groundAll(a, { block: ['a'] });
    expect(insts).toHaveLength(1);
    const first = insts[0];
    if (!first) return;
    expect(first.grounded.preconditions.has('p')).toBe(true);
  });
});

describe('planning — hashState determinista', () => {
  it('mismo conjunto → mismo hash, orden de inserción irrelevante', () => {
    const s1 = new Set(['p', 'q', 'r']);
    const s2 = new Set(['r', 'p', 'q']);
    expect(hashState(s1)).toBe(hashState(s2));
  });

  it('conjuntos distintos → hashes distintos', () => {
    expect(hashState(new Set(['p']))).not.toBe(hashState(new Set(['q'])));
  });
});

// ──────────────────────────────────────────────────────────────
// 4. BFS — Blocks World casos básicos
// ──────────────────────────────────────────────────────────────

describe('planning — BFS blocks world simple (1 step)', () => {
  it('apilar A sobre B desde brazo sosteniendo A: 1 paso (stack)', () => {
    // Estado: holding(a), on-table(b), clear(b), clear(c), on-table(c)
    // Goal: on(a,b)
    const problem = blocksProblem(
      ['holding(a)', 'on-table(b)', 'clear(b)', 'on-table(c)', 'clear(c)'],
      ['on(a,b)'],
    );
    const plan = bfsPlan(problem);
    expect(plan).not.toBeNull();
    const p = plan as Plan;
    expect(p.length).toBe(1);
    const step0 = p.actions[0];
    if (!step0) return;
    expect(step0.action.name).toBe('stack');
    expect(step0.bindings['?x']).toBe('a');
    expect(step0.bindings['?y']).toBe('b');
  });
});

describe('planning — BFS blocks world stack invertida', () => {
  it('A sobre B sobre C → C sobre B sobre A (plan multi-step)', () => {
    // Estado inicial: pila a-b-c (a arriba), c en mesa.
    // Goal: pila c-b-a (c arriba), a en mesa.
    const initial = ['on(a,b)', 'on(b,c)', 'on-table(c)', 'clear(a)', 'arm-empty'];
    const goal = ['on(c,b)', 'on(b,a)', 'on-table(a)'];
    const problem = blocksProblem(initial, goal);
    const plan = bfsPlan(problem, { maxDepth: 12 });
    expect(plan).not.toBeNull();
    const p = plan as Plan;
    expect(p.length).toBeGreaterThan(1);
    // Validamos ejecutando el plan desde el inicial.
    let state = new Set(initial);
    for (const step of p.actions) {
      const g = ground(step.action, step.bindings);
      expect(preconditionsSatisfied(state, g.preconditions)).toBe(true);
      state = applyAction(state, g);
    }
    expect(goalSatisfied(state, new Set(goal))).toBe(true);
  });
});

describe('planning — BFS goal ya satisfecho', () => {
  it('plan vacío cuando goal ⊆ initialState', () => {
    const problem = blocksProblem(['on-table(a)', 'clear(a)', 'arm-empty'], ['on-table(a)']);
    const plan = bfsPlan(problem);
    expect(plan).not.toBeNull();
    expect((plan as Plan).length).toBe(0);
    expect((plan as Plan).cost).toBe(0);
  });
});

describe('planning — BFS imposible', () => {
  it('null cuando no hay acciones aplicables que lleven al goal', () => {
    // Sin acciones, goal ≠ initial → null.
    const problem: STRIPSProblem = {
      predicates: ['p'],
      objects: { o: ['a'] },
      actions: [],
      initialState: new Set(['p']),
      goal: new Set(['q']),
    };
    const plan = bfsPlan(problem);
    expect(plan).toBeNull();
  });

  it('null cuando el goal es inalcanzable (preconditions nunca se cumplen)', () => {
    const action: STRIPSAction = {
      name: 'needs-magic',
      parameters: [],
      preconditions: ['magic'], // nunca presente
      addList: ['goal-fact'],
      delList: [],
    };
    const problem: STRIPSProblem = {
      predicates: ['magic', 'goal-fact'],
      objects: {},
      actions: [action],
      initialState: new Set(['p']),
      goal: new Set(['goal-fact']),
    };
    expect(bfsPlan(problem)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────
// 5. BFS vs A* — mismo plan length
// ──────────────────────────────────────────────────────────────

describe('planning — BFS vs A* coherencia', () => {
  it('mismo length en blocks-world simple', () => {
    const initial = ['on-table(a)', 'clear(a)', 'on-table(b)', 'clear(b)', 'arm-empty'];
    const goal = ['on(a,b)'];
    const problem = blocksProblem(initial, goal);
    const bfs = bfsPlan(problem);
    const astar = aStarPlan(problem);
    expect(bfs).not.toBeNull();
    expect(astar).not.toBeNull();
    expect((bfs as Plan).length).toBe((astar as Plan).length);
  });

  it('mismo length en problema más profundo', () => {
    const initial = ['on(a,b)', 'on-table(b)', 'clear(a)', 'arm-empty'];
    const goal = ['on(b,a)'];
    const problem = blocksProblem(initial, goal, ['a', 'b']);
    const bfs = bfsPlan(problem, { maxDepth: 10 });
    const astar = aStarPlan(problem, { maxDepth: 10 });
    expect(bfs).not.toBeNull();
    expect(astar).not.toBeNull();
    expect((bfs as Plan).length).toBe((astar as Plan).length);
  });
});

// ──────────────────────────────────────────────────────────────
// 6. Heurísticas
// ──────────────────────────────────────────────────────────────

describe('planning — goalCountHeuristic', () => {
  it('cuenta hechos faltantes', () => {
    expect(goalCountHeuristic(new Set(['a']), new Set(['a', 'b', 'c']))).toBe(2);
    expect(goalCountHeuristic(new Set(['a', 'b', 'c']), new Set(['a']))).toBe(0);
  });
});

describe('planning — fastForwardHeuristic', () => {
  it('0 cuando goal ya satisfecho', () => {
    const h = fastForwardHeuristic(new Set(['a', 'b']), new Set(['a']), []);
    expect(h).toBe(0);
  });

  it('Infinity cuando no hay forma de alcanzar el goal', () => {
    // Sin acciones que produzcan 'q'.
    const h = fastForwardHeuristic(new Set(['a']), new Set(['q']), []);
    expect(h).toBe(Infinity);
  });

  it('aproxima la distancia en niveles', () => {
    // Cadena a → b → c → d. Inicial: {a}. Goal: {d}.
    const actions: STRIPSAction[] = [
      { name: 'a2b', parameters: [], preconditions: ['a'], addList: ['b'], delList: ['a'] },
      { name: 'b2c', parameters: [], preconditions: ['b'], addList: ['c'], delList: ['b'] },
      { name: 'c2d', parameters: [], preconditions: ['c'], addList: ['d'], delList: ['c'] },
    ];
    const h = fastForwardHeuristic(new Set(['a']), new Set(['d']), actions);
    // Sin delete-list: cada nivel añade el siguiente. d aparece en nivel 3.
    expect(h).toBe(3);
  });

  it('makeFFHeuristic guía A* a una solución', () => {
    const initial = ['on-table(a)', 'clear(a)', 'on-table(b)', 'clear(b)', 'arm-empty'];
    const goal = ['on(a,b)'];
    const problem = blocksProblem(initial, goal);
    const heuristic = makeFFHeuristic(problem);
    const plan = aStarPlan(problem, { heuristic });
    expect(plan).not.toBeNull();
    expect((plan as Plan).length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────
// 7. A* con costos variables
// ──────────────────────────────────────────────────────────────

describe('planning — A* con costFunction', () => {
  it('prefiere camino más barato aunque tenga más pasos', () => {
    // Dominio juguete: del estado {s} al goal {g} por dos caminos:
    //   - cheap1; cheap2; cheap3 (cada uno cuesta 1, total 3)
    //   - heavy           (un paso, costo 100)
    // A* con cost variable debe preferir la cadena de 3 pasos.
    const actions: STRIPSAction[] = [
      { name: 'cheap1', parameters: [], preconditions: ['s'], addList: ['t1'], delList: ['s'] },
      { name: 'cheap2', parameters: [], preconditions: ['t1'], addList: ['t2'], delList: ['t1'] },
      { name: 'cheap3', parameters: [], preconditions: ['t2'], addList: ['g'], delList: ['t2'] },
      { name: 'heavy', parameters: [], preconditions: ['s'], addList: ['g'], delList: ['s'] },
    ];
    const problem: STRIPSProblem = {
      predicates: ['s', 't1', 't2', 'g'],
      objects: {},
      actions,
      initialState: new Set(['s']),
      goal: new Set(['g']),
    };
    const costFunction = (step: { action: STRIPSAction }): number =>
      step.action.name === 'heavy' ? 100 : 1;
    const plan = aStarPlan(problem, { costFunction });
    expect(plan).not.toBeNull();
    const p = plan as Plan;
    expect(p.cost).toBe(3);
    expect(p.length).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────
// 8. Plan ejecutable end-to-end
// ──────────────────────────────────────────────────────────────

describe('planning — plan ejecutable paso a paso', () => {
  it('cada acción del plan es aplicable y lleva al goal', () => {
    const initial = ['on-table(a)', 'clear(a)', 'on-table(b)', 'clear(b)', 'arm-empty'];
    const goal = ['on(a,b)'];
    const problem = blocksProblem(initial, goal);
    const plan = aStarPlan(problem, { heuristic: makeFFHeuristic(problem) });
    expect(plan).not.toBeNull();
    const p = plan as Plan;

    let state = new Set(initial);
    for (const step of p.actions) {
      const g = ground(step.action, step.bindings);
      expect(preconditionsSatisfied(state, g.preconditions)).toBe(true);
      state = applyAction(state, g);
    }
    expect(goalSatisfied(state, new Set(goal))).toBe(true);
  });
});
