import { describe, it, expect } from 'vitest';
import {
  modelCheck,
  satisfiesAt,
  isWellFormed,
  isClosed,
  freeVars,
  alternationDepth,
  ctlToMu,
  muToString,
} from '../../profiles/mu-calculus';
import type { MuFormula, KripkeStructure } from '../../profiles/mu-calculus';

// ── helpers para construir AST ────────────────────────────────
const atom = (name: string): MuFormula => ({ kind: 'atom', name });
const v = (name: string): MuFormula => ({ kind: 'var', name });
const not = (arg: MuFormula): MuFormula => ({ kind: 'not', arg });
const and = (left: MuFormula, right: MuFormula): MuFormula => ({ kind: 'and', left, right });
const or = (left: MuFormula, right: MuFormula): MuFormula => ({ kind: 'or', left, right });
const box = (arg: MuFormula): MuFormula => ({ kind: 'box', arg });
const diamond = (arg: MuFormula): MuFormula => ({ kind: 'diamond', arg });
const mu = (bind: string, body: MuFormula): MuFormula => ({ kind: 'mu', bind, body });
const nu = (bind: string, body: MuFormula): MuFormula => ({ kind: 'nu', bind, body });

function k(
  states: string[],
  transitions: Array<[string, string]>,
  labels: Record<string, string[]> = {},
): KripkeStructure {
  const labelling: Record<string, Set<string>> = {};
  for (const s of states) labelling[s] = new Set(labels[s] ?? []);
  return { states, transitions, labelling };
}

describe('μ-calculus — operadores modales base (◇/□)', () => {
  // s0 --> s1{p}, s0 --> s2
  const M = k(
    ['s0', 's1', 's2'],
    [
      ['s0', 's1'],
      ['s0', 's2'],
    ],
    { s1: ['p'] },
  );

  it('◇p: estados con algún sucesor que cumple p', () => {
    const sat = modelCheck(M, diamond(atom('p')));
    expect(sat).toEqual(new Set(['s0']));
  });

  it('□p: estados cuyos sucesores TODOS cumplen p (deadlock incluido)', () => {
    const sat = modelCheck(M, box(atom('p')));
    // s0: tiene un sucesor (s2) sin p ⇒ false
    // s1, s2: deadlocks ⇒ vacuously true
    expect(sat).toEqual(new Set(['s1', 's2']));
  });

  it('◇⊤ distingue deadlocks: solo estados con al menos un sucesor', () => {
    const sat = modelCheck(M, diamond(nu('T', v('T'))));
    expect(sat).toEqual(new Set(['s0']));
  });
});

describe('μ-calculus — least fixed-point (μ) y reachability', () => {
  // Cadena: s0 -> s1 -> s2{p} -> s2 (auto-loop)
  const M = k(
    ['s0', 's1', 's2'],
    [
      ['s0', 's1'],
      ['s1', 's2'],
      ['s2', 's2'],
    ],
    { s2: ['p'] },
  );

  it('μX. p ∨ ◇X (EF p) — reachability hacia p', () => {
    const phi = mu('X', or(atom('p'), diamond(v('X'))));
    const sat = modelCheck(M, phi);
    expect(sat).toEqual(new Set(['s0', 's1', 's2']));
  });

  it('μX. p ∨ ◇X en grafo sin p alcanzable → ∅', () => {
    const N = k(['a', 'b'], [['a', 'b']], {});
    const phi = mu('X', or(atom('p'), diamond(v('X'))));
    expect(modelCheck(N, phi)).toEqual(new Set());
  });
});

describe('μ-calculus — greatest fixed-point (ν) e invariance', () => {
  it('νX. p ∧ □X (AG p) — invariante sobre todos los caminos', () => {
    // Todos los estados etiquetados p, con loop
    const M = k(
      ['s0', 's1'],
      [
        ['s0', 's1'],
        ['s1', 's0'],
      ],
      { s0: ['p'], s1: ['p'] },
    );
    const phi = nu('X', and(atom('p'), box(v('X'))));
    expect(modelCheck(M, phi)).toEqual(new Set(['s0', 's1']));
  });

  it('νX. p ∧ □X falla cuando algún estado alcanzable rompe p', () => {
    const M = k(
      ['s0', 's1', 's2'],
      [
        ['s0', 's1'],
        ['s1', 's2'],
        ['s2', 's2'],
      ],
      { s0: ['p'], s1: ['p'] }, // s2 no tiene p
    );
    const phi = nu('X', and(atom('p'), box(v('X'))));
    // Ningún estado satisface AG p porque s2 (alcanzable desde todos) no la cumple
    expect(modelCheck(M, phi)).toEqual(new Set());
  });

  it('νX. p ∧ ◇X (EG p) — existe camino infinito con p', () => {
    // s0{p} -> s1{p} -> s0  (ciclo con p) ; s2{p} -> s3 (sin p, dead end)
    const M = k(
      ['s0', 's1', 's2', 's3'],
      [
        ['s0', 's1'],
        ['s1', 's0'],
        ['s2', 's3'],
      ],
      { s0: ['p'], s1: ['p'], s2: ['p'] },
    );
    const phi = nu('X', and(atom('p'), diamond(v('X'))));
    expect(modelCheck(M, phi)).toEqual(new Set(['s0', 's1']));
  });
});

describe('μ-calculus — Until (E[q U p])', () => {
  it('μX. p ∨ (q ∧ ◇X) — alcanza p manteniendo q en el camino', () => {
    // s0{q} -> s1{q} -> s2{p}; s0 -> s3 (sin q ni p)
    const M = k(
      ['s0', 's1', 's2', 's3'],
      [
        ['s0', 's1'],
        ['s1', 's2'],
        ['s0', 's3'],
      ],
      { s0: ['q'], s1: ['q'], s2: ['p'] },
    );
    const phi = mu('X', or(atom('p'), and(atom('q'), diamond(v('X')))));
    // s2 cumple p ⇒ ok. s1 tiene q y sucesor s2 cumple φ. s0 tiene q y sucesor s1 cumple φ.
    expect(modelCheck(M, phi)).toEqual(new Set(['s0', 's1', 's2']));
  });

  it('E[q U p] falla si el camino atraviesa estados sin q antes de p', () => {
    // s0 (sin q) -> s1{p}: no satisface (necesita q en s0)
    const M = k(['s0', 's1'], [['s0', 's1']], { s1: ['p'] });
    const phi = mu('X', or(atom('p'), and(atom('q'), diamond(v('X')))));
    expect(modelCheck(M, phi)).toEqual(new Set(['s1']));
  });
});

describe('μ-calculus — alternation depth', () => {
  it('proposición atómica: depth 0', () => {
    expect(alternationDepth(atom('p'))).toBe(0);
  });

  it('un solo binder μ: depth 1', () => {
    expect(alternationDepth(mu('X', or(atom('p'), diamond(v('X')))))).toBe(1);
  });

  it('un solo binder ν: depth 1', () => {
    expect(alternationDepth(nu('X', and(atom('p'), box(v('X')))))).toBe(1);
  });

  it('μν alternantes: depth 2', () => {
    // μX. νY. (p ∨ X) ∧ ◇Y
    const phi = mu('X', nu('Y', and(or(atom('p'), v('X')), diamond(v('Y')))));
    expect(alternationDepth(phi)).toBe(2);
  });

  it('μμ anidados sin alternancia: depth 1', () => {
    const phi = mu('X', mu('Y', or(v('X'), v('Y'))));
    expect(alternationDepth(phi)).toBe(1);
  });
});

describe('μ-calculus — well-formedness', () => {
  it('μX. p ∨ ◇X es positiva (X bajo 0 negaciones)', () => {
    const phi = mu('X', or(atom('p'), diamond(v('X'))));
    expect(isWellFormed(phi)).toBe(true);
  });

  it('μX. ¬X NO es bien formada (X bajo neg impar)', () => {
    const phi = mu('X', not(v('X')));
    expect(isWellFormed(phi)).toBe(false);
  });

  it('μX. ¬¬X es bien formada (X bajo neg par)', () => {
    const phi = mu('X', not(not(v('X'))));
    expect(isWellFormed(phi)).toBe(true);
  });

  it('detecta variables libres', () => {
    const phi = or(atom('p'), v('X')); // X libre
    expect(isClosed(phi)).toBe(false);
    expect(freeVars(phi)).toEqual(new Set(['X']));
  });

  it('fórmula cerrada no reporta variables libres', () => {
    const phi = nu('X', and(atom('p'), box(v('X'))));
    expect(isClosed(phi)).toBe(true);
    expect(freeVars(phi)).toEqual(new Set());
  });

  it('μX. p ∨ ◇(¬X) NO es bien formada — X bajo negación impar bajo ◇', () => {
    const phi = mu('X', or(atom('p'), diamond(not(v('X')))));
    expect(isWellFormed(phi)).toBe(false);
  });
});

describe('μ-calculus — ctlToMu translator', () => {
  it('EX p → ◇p', () => {
    const mu1 = ctlToMu({ kind: 'EX', arg: { kind: 'atom', name: 'p' } });
    expect(mu1).toEqual({ kind: 'diamond', arg: { kind: 'atom', name: 'p' } });
  });

  it('AX p → □p', () => {
    const mu1 = ctlToMu({ kind: 'AX', arg: { kind: 'atom', name: 'p' } });
    expect(mu1).toEqual({ kind: 'box', arg: { kind: 'atom', name: 'p' } });
  });

  it('EF p produce μX. p ∨ ◇X equivalente al manual', () => {
    const M = k(['s0', 's1'], [['s0', 's1']], { s1: ['p'] });
    const muForm = ctlToMu({ kind: 'EF', arg: { kind: 'atom', name: 'p' } });
    expect(modelCheck(M, muForm)).toEqual(new Set(['s0', 's1']));
  });

  it('AG p coincide con νX. p ∧ □X sobre modelos no triviales', () => {
    const M = k(
      ['s0', 's1'],
      [
        ['s0', 's1'],
        ['s1', 's0'],
      ],
      { s0: ['p'], s1: ['p'] },
    );
    const auto = ctlToMu({ kind: 'AG', arg: { kind: 'atom', name: 'p' } });
    const manual = nu('X', and(atom('p'), box(v('X'))));
    expect(modelCheck(M, auto)).toEqual(modelCheck(M, manual));
    expect(modelCheck(M, auto)).toEqual(new Set(['s0', 's1']));
  });

  it('EG p detecta camino infinito con p', () => {
    const M = k(
      ['s0', 's1', 's2'],
      [
        ['s0', 's1'],
        ['s1', 's0'],
        ['s2', 's2'],
      ],
      { s0: ['p'], s1: ['p'] }, // s2 sin p
    );
    const phi = ctlToMu({ kind: 'EG', arg: { kind: 'atom', name: 'p' } });
    expect(modelCheck(M, phi)).toEqual(new Set(['s0', 's1']));
  });

  it('E[q U p] coincide con codificación manual', () => {
    const M = k(
      ['s0', 's1', 's2'],
      [
        ['s0', 's1'],
        ['s1', 's2'],
      ],
      { s0: ['q'], s1: ['q'], s2: ['p'] },
    );
    const auto = ctlToMu({
      kind: 'EU',
      left: { kind: 'atom', name: 'q' },
      right: { kind: 'atom', name: 'p' },
    });
    expect(modelCheck(M, auto)).toEqual(new Set(['s0', 's1', 's2']));
  });

  it('not/and/or se traducen estructuralmente', () => {
    const phi = ctlToMu({
      kind: 'and',
      args: [
        { kind: 'atom', name: 'p' },
        { kind: 'not', arg: { kind: 'atom', name: 'q' } },
      ],
    });
    const M = k(['s0', 's1'], [], { s0: ['p'], s1: ['p', 'q'] });
    expect(modelCheck(M, phi)).toEqual(new Set(['s0']));
  });
});

describe('μ-calculus — utilidades', () => {
  it('muToString renderiza con símbolos estándar', () => {
    const phi = mu('X', or(atom('p'), diamond(v('X'))));
    expect(muToString(phi)).toBe('μX. (p ∨ ◇X)');
  });

  it('satisfiesAt es coherente con modelCheck', () => {
    const M = k(['s0', 's1'], [['s0', 's1']], { s1: ['p'] });
    const phi = diamond(atom('p'));
    expect(satisfiesAt(M, phi, 's0')).toBe(true);
    expect(satisfiesAt(M, phi, 's1')).toBe(false);
  });

  it('modelCheck lanza ante transición a estado desconocido', () => {
    expect(() =>
      modelCheck(
        { states: ['s0'], transitions: [['s0', 'ghost']], labelling: { s0: new Set() } },
        atom('p'),
      ),
    ).toThrow(/estado desconocido/);
  });

  it('modelCheck lanza ante variable libre en evaluación', () => {
    const M = k(['s0'], [], {});
    expect(() => modelCheck(M, v('X'))).toThrow(/variable libre/);
  });
});
