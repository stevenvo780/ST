import { describe, it, expect } from 'vitest';
import {
  paigeTarjan,
  areBisimilar,
  quotientLTS,
  strongBisimulation,
  weakBisimulation,
} from '../../runtime/bisimulation';
import type { LTS } from '../../runtime/bisimulation';

function labels(...names: string[]): Set<string> {
  return new Set(names);
}

describe('Bisimulation — Paige-Tarjan partition refinement', () => {
  it('LTS lineal a→b→c con label X discrimina los tres estados', () => {
    // a -t-> b -t-> c ; sólo c tiene label X.
    const lts: LTS = {
      states: ['a', 'b', 'c'],
      transitions: [
        ['a', 't', 'b'],
        ['b', 't', 'c'],
      ],
      labelling: { c: labels('X') },
    };
    const r = paigeTarjan(lts);
    expect(r.numBlocks).toBe(3);
    expect(r.partition.get('a')).not.toBe(r.partition.get('b'));
    expect(r.partition.get('b')).not.toBe(r.partition.get('c'));
    expect(r.partition.get('a')).not.toBe(r.partition.get('c'));
  });

  it('dos estados con misma estructura colapsan en el mismo bloque', () => {
    // s1 y s2 son hojas sin transiciones y con el mismo labelling.
    const lts: LTS = {
      states: ['root', 's1', 's2'],
      transitions: [
        ['root', 'a', 's1'],
        ['root', 'a', 's2'],
      ],
      labelling: { s1: labels('p'), s2: labels('p') },
    };
    const r = paigeTarjan(lts);
    expect(r.partition.get('s1')).toBe(r.partition.get('s2'));
    expect(r.partition.get('root')).not.toBe(r.partition.get('s1'));
  });

  it('areBisimilar reporta true sii los estados están en el mismo bloque', () => {
    const lts: LTS = {
      states: ['x', 'y', 'z'],
      transitions: [
        ['x', 'a', 'x'],
        ['y', 'a', 'y'],
      ],
      labelling: { x: labels('p'), y: labels('p'), z: labels('q') },
    };
    expect(areBisimilar(lts, 'x', 'y')).toBe(true);
    expect(areBisimilar(lts, 'x', 'z')).toBe(false);
  });

  it('areBisimilar lanza si el estado no existe', () => {
    const lts: LTS = { states: ['a'], transitions: [] };
    expect(() => areBisimilar(lts, 'a', 'missing')).toThrow();
  });

  it('LTS sin labelling: todos los estados parten del mismo bloque', () => {
    // 4 estados aislados sin transiciones ni labelling → un único bloque.
    const lts: LTS = {
      states: ['a', 'b', 'c', 'd'],
      transitions: [],
    };
    const r = paigeTarjan(lts);
    expect(r.numBlocks).toBe(1);
  });

  it('estados con distinto fan-out de acciones se separan', () => {
    // a tiene salida 'x', b no.
    const lts: LTS = {
      states: ['a', 'b', 't'],
      transitions: [['a', 'x', 't']],
    };
    const r = paigeTarjan(lts);
    expect(r.partition.get('a')).not.toBe(r.partition.get('b'));
  });

  it('estados con misma acción pero a bloques distintos se separan', () => {
    // s -a-> goal (label G), t -a-> sink (sin label).
    const lts: LTS = {
      states: ['s', 't', 'goal', 'sink'],
      transitions: [
        ['s', 'a', 'goal'],
        ['t', 'a', 'sink'],
      ],
      labelling: { goal: labels('G') },
    };
    const r = paigeTarjan(lts);
    expect(r.partition.get('s')).not.toBe(r.partition.get('t'));
  });
});

describe('Bisimulation — quotientLTS', () => {
  it('quotient reduce el número de estados cuando hay redundancia', () => {
    // Tres hojas equivalentes.
    const lts: LTS = {
      states: ['root', 'l1', 'l2', 'l3'],
      transitions: [
        ['root', 'a', 'l1'],
        ['root', 'a', 'l2'],
        ['root', 'a', 'l3'],
      ],
    };
    const q = quotientLTS(lts);
    expect(q.states.length).toBeLessThan(lts.states.length);
    // Debe ser exactamente 2: { root }, { l1, l2, l3 }.
    expect(q.states.length).toBe(2);
  });

  it('quotient deduplica transiciones equivalentes', () => {
    const lts: LTS = {
      states: ['s1', 's2', 't1', 't2'],
      transitions: [
        ['s1', 'a', 't1'],
        ['s2', 'a', 't2'],
      ],
      labelling: { s1: labels('S'), s2: labels('S'), t1: labels('T'), t2: labels('T') },
    };
    const q = quotientLTS(lts);
    // 2 bloques: {s1, s2}, {t1, t2}; una sola arista a.
    expect(q.states.length).toBe(2);
    expect(q.transitions.length).toBe(1);
  });

  it('quotient preserva labelling en los bloques', () => {
    const lts: LTS = {
      states: ['a', 'b'],
      transitions: [],
      labelling: { a: labels('P'), b: labels('P') },
    };
    const q = quotientLTS(lts);
    expect(q.states.length).toBe(1);
    const repr = q.states[0];
    expect(q.labelling?.[repr]?.has('P')).toBe(true);
  });
});

describe('Bisimulation — strongBisimulation entre dos LTS', () => {
  it('dos LTS isomorfos son fuertemente bisimilares', () => {
    const l1: LTS = {
      states: ['a', 'b'],
      transitions: [['a', 'x', 'b']],
      labelling: { a: labels('P'), b: labels('Q') },
    };
    const l2: LTS = {
      states: ['p', 'q'],
      transitions: [['p', 'x', 'q']],
      labelling: { p: labels('P'), q: labels('Q') },
    };
    expect(strongBisimulation(l1, l2)).toBe(true);
  });

  it('dos LTS con distinto labelling NO son bisimilares', () => {
    const l1: LTS = {
      states: ['a'],
      transitions: [],
      labelling: { a: labels('P') },
    };
    const l2: LTS = {
      states: ['b'],
      transitions: [],
      labelling: { b: labels('Q') },
    };
    expect(strongBisimulation(l1, l2)).toBe(false);
  });

  it('LTS con distinto fan-out NO es bisimilar', () => {
    // L1 tiene una transición a; L2 no tiene transiciones.
    const l1: LTS = {
      states: ['a', 'b'],
      transitions: [['a', 'x', 'b']],
    };
    const l2: LTS = {
      states: ['p', 'q'],
      transitions: [],
    };
    expect(strongBisimulation(l1, l2)).toBe(false);
  });
});

describe('Bisimulation — weakBisimulation (τ-transitions ocultas)', () => {
  it('τ-loops invisibles identifican estados τ-equivalentes', () => {
    // s -τ-> s' -a-> t  vs  u -a-> t. Bajo bisimulación débil, s y u son
    // equivalentes (el τ desaparece bajo ⇒).
    const lts: LTS = {
      states: ['s', 's2', 'u', 't'],
      transitions: [
        ['s', 'τ', 's2'],
        ['s2', 'a', 't'],
        ['u', 'a', 't'],
      ],
    };
    const r = weakBisimulation(lts, 'τ');
    // s y u deben caer en el mismo bloque vía bisimulación débil.
    expect(r.partition.get('s')).toBe(r.partition.get('u'));
  });

  it('weak bisimulation no identifica estados con labelling distinto', () => {
    const lts: LTS = {
      states: ['s', 't'],
      transitions: [['s', 'τ', 't']],
      labelling: { s: labels('P'), t: labels('Q') },
    };
    const r = weakBisimulation(lts, 'τ');
    expect(r.partition.get('s')).not.toBe(r.partition.get('t'));
  });
});

describe('Bisimulation — performance / escalabilidad', () => {
  it('LTS 100 estados determinista termina <500ms', () => {
    // Cadena lineal 100 estados: s0 -a-> s1 -a-> ... -a-> s99.
    // Ningún estado tiene labelling explícito → tras refinar quedan 100 bloques
    // porque el "futuro" de cada uno es estructuralmente distinto.
    const n = 100;
    const states: string[] = [];
    const transitions: Array<[string, string, string]> = [];
    for (let i = 0; i < n; i++) states.push(`s${i}`);
    for (let i = 0; i < n - 1; i++) transitions.push([`s${i}`, 'a', `s${i + 1}`]);

    const lts: LTS = { states, transitions };
    const t0 = Date.now();
    const r = paigeTarjan(lts);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(500);
    // En la cadena lineal sin labelling, cada estado se separa por su
    // longitud de camino restante → n bloques.
    expect(r.numBlocks).toBe(n);
  });

  it('100 estados duplicados (dos copias idénticas) colapsan a la mitad', () => {
    // Dos cadenas paralelas independientes con etiquetas equivalentes.
    const n = 50;
    const states: string[] = [];
    const transitions: Array<[string, string, string]> = [];
    const labelling: Record<string, Set<string>> = {};
    for (let i = 0; i < n; i++) {
      states.push(`a${i}`);
      states.push(`b${i}`);
      labelling[`a${i}`] = labels(`L${i}`);
      labelling[`b${i}`] = labels(`L${i}`);
    }
    for (let i = 0; i < n - 1; i++) {
      transitions.push([`a${i}`, 'x', `a${i + 1}`]);
      transitions.push([`b${i}`, 'x', `b${i + 1}`]);
    }
    const lts: LTS = { states, transitions, labelling };
    const r = paigeTarjan(lts);
    // Cada par (ai, bi) debe colapsar → n bloques en lugar de 2n.
    expect(r.numBlocks).toBe(n);
  });
});

describe('Bisimulation — validación de entradas', () => {
  it('lanza si una transición sale de un estado desconocido', () => {
    const lts: LTS = {
      states: ['a'],
      transitions: [['ghost', 'x', 'a']],
    };
    expect(() => paigeTarjan(lts)).toThrow(/desconocido/);
  });

  it('lanza si una transición llega a un estado desconocido', () => {
    const lts: LTS = {
      states: ['a'],
      transitions: [['a', 'x', 'ghost']],
    };
    expect(() => paigeTarjan(lts)).toThrow(/desconocido/);
  });
});
