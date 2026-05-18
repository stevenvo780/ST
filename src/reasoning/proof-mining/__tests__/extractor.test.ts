import { describe, it, expect } from 'vitest';
import {
  extractSubtrees,
  groupSubtrees,
  subtreeKey,
  extractAuxiliaryLemmas,
} from '../extractor';
import type { ProofTrace } from '../types';

function trace(
  conclusion: string,
  steps: Array<[string, string[], string, number]>,
  cost = 10,
  profile = 'classical',
  premises: string[] = [],
): ProofTrace {
  return {
    conclusion,
    premises,
    profile,
    cost,
    steps: steps.map(([rule, inputs, output, depth]) => ({
      rule,
      inputs,
      output,
      depth,
    })),
  };
}

describe('extractSubtrees', () => {
  it('devuelve array vacío si el proof no tiene pasos', () => {
    const p = trace('X', []);
    expect(extractSubtrees(p, 'p1')).toEqual([]);
  });

  it('genera un sub-tree por paso del proof', () => {
    const p = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const subs = extractSubtrees(p, 'p1');
    expect(subs).toHaveLength(3);
  });

  it('el sub-tree raíz cubre todos los pasos', () => {
    const p = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const root = extractSubtrees(p, 'p1')[0];
    expect(root).toBeDefined();
    expect(root?.steps).toHaveLength(3);
  });

  it('un sub-tree de hoja solo contiene un paso', () => {
    const p = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const subs = extractSubtrees(p, 'p1');
    const leaf = subs[2];
    expect(leaf?.steps).toHaveLength(1);
    expect(leaf?.steps[0]?.rule).toBe('axiom');
  });

  it('respeta el corte por depth cuando hay hermanos', () => {
    // Árbol: A tiene hijos B y C; B tiene hijo D
    //   A(0)
    //   ├ B(1)
    //   │  └ D(2)
    //   └ C(1)
    const p = trace('A', [
      ['rA', ['B', 'C'], 'A', 0],
      ['rB', ['D'], 'B', 1],
      ['rD', [], 'D', 2],
      ['rC', [], 'C', 1],
    ]);
    const subs = extractSubtrees(p, 'p1');
    // sub raíz en B: incluye B y D, no C
    const subB = subs[1];
    expect(subB?.steps.map((s) => s.output)).toEqual(['B', 'D']);
    // sub raíz en C: solo C
    const subC = subs[3];
    expect(subC?.steps).toHaveLength(1);
    expect(subC?.steps[0]?.output).toBe('C');
  });
});

describe('subtreeKey', () => {
  it('asigna la misma clave a sub-trees estructuralmente idénticos', () => {
    const p1 = trace('X', [
      ['MP', ['P->P', 'P'], 'P', 0],
      ['axiom', [], 'P->P', 1],
      ['axiom', [], 'P', 1],
    ]);
    const p2 = trace('X', [
      ['MP', ['Q->Q', 'Q'], 'Q', 0],
      ['axiom', [], 'Q->Q', 1],
      ['axiom', [], 'Q', 1],
    ]);
    const sub1 = extractSubtrees(p1, 'p1')[0];
    const sub2 = extractSubtrees(p2, 'p2')[0];
    expect(sub1).toBeDefined();
    expect(sub2).toBeDefined();
    expect(subtreeKey(sub1!)).toBe(subtreeKey(sub2!));
  });

  it('asigna distinta clave a sub-trees con distinta regla', () => {
    const p1 = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const p2 = trace('X', [
      ['andI', ['A', 'B'], 'A and B', 0],
      ['axiom', [], 'A', 1],
      ['axiom', [], 'B', 1],
    ]);
    expect(subtreeKey(extractSubtrees(p1, 'p1')[0]!)).not.toBe(
      subtreeKey(extractSubtrees(p2, 'p2')[0]!),
    );
  });
});

describe('groupSubtrees', () => {
  it('agrupa por clave canónica', () => {
    const p1 = trace('X', [
      ['MP', ['P->P', 'P'], 'P', 0],
      ['axiom', [], 'P->P', 1],
      ['axiom', [], 'P', 1],
    ]);
    const p2 = trace('X', [
      ['MP', ['R->R', 'R'], 'R', 0],
      ['axiom', [], 'R->R', 1],
      ['axiom', [], 'R', 1],
    ]);
    const sub1 = extractSubtrees(p1, 'p1');
    const sub2 = extractSubtrees(p2, 'p2');
    const groups = groupSubtrees([...sub1, ...sub2]);
    // los 3 sub-trees de p1 deberían tener al menos 1 par equivalente en p2
    const sized3 = groups.filter((g) => g.members.length >= 2);
    expect(sized3.length).toBeGreaterThan(0);
  });
});

describe('extractAuxiliaryLemmas', () => {
  it('encuentra lemmas comunes a 2 proofs con misma estructura', () => {
    const p1 = trace('X', [
      ['MP', ['P->P', 'P'], 'P', 0],
      ['axiom', [], 'P->P', 1],
      ['axiom', [], 'P', 1],
    ]);
    const p2 = trace('Y', [
      ['MP', ['Q->Q', 'Q'], 'Q', 0],
      ['axiom', [], 'Q->Q', 1],
      ['axiom', [], 'Q', 1],
    ]);
    const groups = extractAuxiliaryLemmas([p1, p2]);
    expect(groups.length).toBeGreaterThan(0);
    const root = groups.find((g) => g.members.some((m) => m.steps.length === 3));
    expect(root).toBeDefined();
    expect(root?.members.length).toBe(2);
  });

  it('respeta minReuseThreshold = 3 (no extrae si solo aparece 2 veces)', () => {
    const p1 = trace('X', [
      ['MP', ['P->P', 'P'], 'P', 0],
      ['axiom', [], 'P->P', 1],
      ['axiom', [], 'P', 1],
    ]);
    const p2 = trace('Y', [
      ['MP', ['Q->Q', 'Q'], 'Q', 0],
      ['axiom', [], 'Q->Q', 1],
      ['axiom', [], 'Q', 1],
    ]);
    const groups = extractAuxiliaryLemmas([p1, p2], { minReuseThreshold: 3 });
    expect(groups).toHaveLength(0);
  });

  it('respeta minSubtreeSize = 3 (filtra sub-trees pequeños)', () => {
    const p1 = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
    ]);
    const p2 = trace('Y', [
      ['MP', ['C->D', 'C'], 'D', 0],
      ['axiom', [], 'C->D', 1],
    ]);
    // Ningún sub-tree tiene >= 3 pasos.
    const groups = extractAuxiliaryLemmas([p1, p2], { minSubtreeSize: 3 });
    expect(groups).toHaveLength(0);
  });

  it('cuenta proofs distintos, no ocurrencias múltiples dentro del mismo proof', () => {
    // Dos sub-trees idénticos dentro del MISMO proof no califican.
    const p1 = trace('X', [
      ['andI', ['A=A', 'A=A'], '(A=A) and (A=A)', 0],
      ['refl', [], 'A=A', 1],
      ['refl', [], 'A=A', 1],
    ]);
    const groups = extractAuxiliaryLemmas([p1], { minReuseThreshold: 2 });
    expect(groups).toHaveLength(0);
  });

  it('extrae con 1 proof si minReuseThreshold = 1', () => {
    const p1 = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const groups = extractAuxiliaryLemmas([p1], {
      minReuseThreshold: 1,
      minSubtreeSize: 2,
    });
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it('agrupa correctamente cuando 3 proofs comparten un sub-tree', () => {
    const makeP = (label: string): ProofTrace =>
      trace(label, [
        ['MP', [`${label}->${label}`, label], label, 0],
        ['axiom', [], `${label}->${label}`, 1],
        ['axiom', [], label, 1],
      ]);
    const groups = extractAuxiliaryLemmas([makeP('P'), makeP('Q'), makeP('R')]);
    // El sub-tree raíz debería tener 3 miembros (uno por proof).
    const root = groups.find((g) => g.members.some((m) => m.steps.length === 3));
    expect(root?.members.length).toBe(3);
  });

  it('proofs sin solapamiento estructural no producen lemmas', () => {
    const p1 = trace('X', [
      ['MP', ['A->B', 'A'], 'B', 0],
      ['axiom', [], 'A->B', 1],
      ['axiom', [], 'A', 1],
    ]);
    const p2 = trace('Y', [
      ['andE', ['A and B'], 'A', 0],
      ['axiom', [], 'A and B', 1],
    ]);
    expect(extractAuxiliaryLemmas([p1, p2])).toHaveLength(0);
  });

  it('asigna proofId automáticamente cuando el trace no trae id', () => {
    const p1 = trace('X', [
      ['MP', ['P->P', 'P'], 'P', 0],
      ['axiom', [], 'P->P', 1],
      ['axiom', [], 'P', 1],
    ]);
    const p2 = trace('Y', [
      ['MP', ['Q->Q', 'Q'], 'Q', 0],
      ['axiom', [], 'Q->Q', 1],
      ['axiom', [], 'Q', 1],
    ]);
    const groups = extractAuxiliaryLemmas([p1, p2]);
    const allIds = new Set<string>();
    for (const g of groups) for (const m of g.members) allIds.add(m.proofId);
    expect(allIds.has('proof-0')).toBe(true);
    expect(allIds.has('proof-1')).toBe(true);
  });

  it('respeta proofId explícito cuando se provee', () => {
    const p1: ProofTrace = {
      id: 'my-proof-A',
      ...trace('X', [
        ['MP', ['P->P', 'P'], 'P', 0],
        ['axiom', [], 'P->P', 1],
        ['axiom', [], 'P', 1],
      ]),
    };
    const p2: ProofTrace = {
      id: 'my-proof-B',
      ...trace('Y', [
        ['MP', ['Q->Q', 'Q'], 'Q', 0],
        ['axiom', [], 'Q->Q', 1],
        ['axiom', [], 'Q', 1],
      ]),
    };
    const groups = extractAuxiliaryLemmas([p1, p2]);
    const allIds = new Set<string>();
    for (const g of groups) for (const m of g.members) allIds.add(m.proofId);
    expect(allIds.has('my-proof-A')).toBe(true);
    expect(allIds.has('my-proof-B')).toBe(true);
  });
});
