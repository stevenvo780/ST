import { describe, expect, it } from 'vitest';

import { ClaimGraph, CycleError, type Claim, type ClaimEvaluator } from '../../../semantics/text-layer/v2';

const mkClaim = (id: string, dependencies: string[] = [], formula = `F_${id}`): Claim => ({
  id,
  formula,
  profile: 'classical.propositional',
  dependencies,
});

describe('ClaimGraph — CRUD', () => {
  it('add/get/all devuelve copias defensivas', () => {
    const g = new ClaimGraph();
    const a = mkClaim('A', ['B']);
    g.add(a);
    a.dependencies.push('mutado');
    const stored = g.get('A');
    expect(stored?.dependencies).toEqual(['B']);
    expect(g.all().map((c) => c.id)).toEqual(['A']);
  });

  it('remove devuelve true si existe, false si no', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A'));
    expect(g.remove('A')).toBe(true);
    expect(g.remove('A')).toBe(false);
    expect(g.get('A')).toBeUndefined();
  });

  it('add rechaza claims sin id', () => {
    const g = new ClaimGraph();
    expect(() => g.add({ id: '', formula: 'F', profile: 'p', dependencies: [] })).toThrow();
  });

  it('add rechaza dependencies no-array', () => {
    const g = new ClaimGraph();
    expect(() =>
      g.add({ id: 'A', formula: 'F', profile: 'p', dependencies: null as unknown as string[] }),
    ).toThrow();
  });
});

describe('ClaimGraph — detección de ciclos', () => {
  it('grafo lineal A->B->C no tiene ciclos', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['B']));
    expect(g.detectCycles()).toEqual([]);
  });

  it('detecta ciclo A->B->A', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['B']));
    g.add(mkClaim('B', ['A']));
    const cycles = g.detectCycles();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].sort()).toEqual(['A', 'B']);
  });

  it('detecta ciclo de 3 A->B->C->A', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['C']));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['B']));
    const cycles = g.detectCycles();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].sort()).toEqual(['A', 'B', 'C']);
  });

  it('detecta auto-loop A->A', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['A']));
    expect(g.detectCycles()).toEqual([['A']]);
  });

  it('ignora dependencias faltantes para SCC', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['fantasma']));
    expect(g.detectCycles()).toEqual([]);
  });

  it('detecta múltiples SCCs independientes', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['B']));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['D']));
    g.add(mkClaim('D', ['C']));
    expect(g.detectCycles()).toHaveLength(2);
  });
});

describe('ClaimGraph — orden topológico', () => {
  it('A->B->C produce orden A,B,C', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('C', ['B']));
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    expect(g.topologicalOrder()).toEqual(['A', 'B', 'C']);
  });

  it('claim sin dependencias siempre va primero', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('hijo', ['raiz']));
    g.add(mkClaim('raiz', []));
    expect(g.topologicalOrder()).toEqual(['raiz', 'hijo']);
  });

  it('diamond A->B,A->C,B->D,C->D respeta dependencias', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['A']));
    g.add(mkClaim('D', ['B', 'C']));
    const order = g.topologicalOrder();
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'));
    expect(order.indexOf('B')).toBeLessThan(order.indexOf('D'));
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'));
  });

  it('tira CycleError si hay ciclo', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['B']));
    g.add(mkClaim('B', ['A']));
    expect(() => g.topologicalOrder()).toThrow(CycleError);
  });

  it('100 claims linear chain producen orden monotónico', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('c0', []));
    for (let i = 1; i < 100; i++) {
      g.add(mkClaim(`c${i}`, [`c${i - 1}`]));
    }
    const order = g.topologicalOrder();
    expect(order).toHaveLength(100);
    for (let i = 0; i < 99; i++) {
      expect(order.indexOf(`c${i}`)).toBeLessThan(order.indexOf(`c${i + 1}`));
    }
  });
});

describe('ClaimGraph — invalidationPath', () => {
  it('A<-B<-C: invalidationPath(A) devuelve [B, C]', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['B']));
    expect(g.invalidationPath('A').sort()).toEqual(['B', 'C']);
  });

  it('hoja sin dependientes devuelve []', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    expect(g.invalidationPath('B')).toEqual([]);
  });

  it('claim inexistente devuelve []', () => {
    const g = new ClaimGraph();
    expect(g.invalidationPath('fantasma')).toEqual([]);
  });

  it('diamond: invalidar A propaga a B, C, D', () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['A']));
    g.add(mkClaim('D', ['B', 'C']));
    expect(g.invalidationPath('A').sort()).toEqual(['B', 'C', 'D']);
  });
});

describe('ClaimGraph — validateAll', () => {
  const allValid: ClaimEvaluator = (c) => Promise.resolve({ valid: true, result: `ok_${c.id}` });

  it('A->B->C: si A inválido, B y C marcados invalidatedBy=[A]', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['B']));

    const evaluator: ClaimEvaluator = (c) =>
      Promise.resolve(c.id === 'A' ? { valid: false, errors: ['contramodelo'] } : { valid: true });

    const results = await g.validateAll(evaluator);
    const byId = Object.fromEntries(results.map((r) => [r.claimId, r]));

    expect(byId.A.valid).toBe(false);
    expect(byId.A.invalidatedBy).toBeUndefined();
    expect(byId.B.valid).toBe(false);
    expect(byId.B.invalidatedBy).toEqual(['A']);
    expect(byId.C.valid).toBe(false);
    expect(byId.C.invalidatedBy).toEqual(['A']);
  });

  it('todas válidas: ninguna invalidatedBy', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    const results = await g.validateAll(allValid);
    expect(results.every((r) => r.valid)).toBe(true);
    expect(results.every((r) => r.invalidatedBy === undefined)).toBe(true);
  });

  it('diamond con dos raíces inválidas: D recibe invalidatedBy con ambas', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', []));
    g.add(mkClaim('D', ['B', 'C']));

    const evaluator: ClaimEvaluator = (c) =>
      Promise.resolve(c.id === 'A' || c.id === 'C' ? { valid: false } : { valid: true });

    const results = await g.validateAll(evaluator);
    const byId = Object.fromEntries(results.map((r) => [r.claimId, r]));

    expect(byId.A.valid).toBe(false);
    expect(byId.B.invalidatedBy).toEqual(['A']);
    expect(byId.C.valid).toBe(false);
    expect(byId.D.invalidatedBy).toEqual(['A', 'C']);
  });

  it('validateAll respeta orden topológico (raíces antes que hijas)', async () => {
    const g = new ClaimGraph();
    for (let i = 0; i < 100; i++) {
      g.add(mkClaim(`c${i}`, i === 0 ? [] : [`c${i - 1}`]));
    }

    const visitOrder: string[] = [];
    const evaluator: ClaimEvaluator = (c) => {
      visitOrder.push(c.id);
      return Promise.resolve({ valid: true });
    };

    const results = await g.validateAll(evaluator);
    expect(results).toHaveLength(100);
    expect(visitOrder).toHaveLength(100);
    for (let i = 0; i < 99; i++) {
      expect(visitOrder.indexOf(`c${i}`)).toBeLessThan(visitOrder.indexOf(`c${i + 1}`));
    }
  });

  it('short-circuit: evaluator no se llama para claims con dep inválida', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    g.add(mkClaim('B', ['A']));
    g.add(mkClaim('C', ['B']));

    const visited = new Set<string>();
    const evaluator: ClaimEvaluator = (c) => {
      visited.add(c.id);
      return Promise.resolve(c.id === 'A' ? { valid: false } : { valid: true });
    };

    await g.validateAll(evaluator);
    expect(visited.has('A')).toBe(true);
    expect(visited.has('B')).toBe(false);
    expect(visited.has('C')).toBe(false);
  });

  it('evaluator que lanza excepción produce claim inválida con error', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', []));
    const evaluator: ClaimEvaluator = () => Promise.reject(new Error('boom'));
    const [result] = await g.validateAll(evaluator);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain('boom');
  });

  it('tira CycleError si hay ciclo antes de validar', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('A', ['B']));
    g.add(mkClaim('B', ['A']));
    await expect(g.validateAll(allValid)).rejects.toBeInstanceOf(CycleError);
  });

  it('100 claims linear chain con A inválida: 99 marcadas invalidatedBy=[c0]', async () => {
    const g = new ClaimGraph();
    g.add(mkClaim('c0', []));
    for (let i = 1; i < 100; i++) {
      g.add(mkClaim(`c${i}`, [`c${i - 1}`]));
    }

    const evaluator: ClaimEvaluator = (c) =>
      Promise.resolve(c.id === 'c0' ? { valid: false } : { valid: true });

    const results = await g.validateAll(evaluator);
    expect(results).toHaveLength(100);
    expect(results[0].claimId).toBe('c0');
    expect(results[0].valid).toBe(false);
    for (let i = 1; i < 100; i++) {
      expect(results[i].valid).toBe(false);
      expect(results[i].invalidatedBy).toEqual(['c0']);
    }
  });
});
