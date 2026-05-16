import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { DerivationCache } from '../../runtime/memo/cache';
import { hashFormula } from '../../runtime/memo/hash';
import { Formula, RunResult } from '../../types';

function atom(name: string): Formula {
  return { kind: 'atom', name };
}

function not(arg: Formula): Formula {
  return { kind: 'not', args: [arg] };
}

function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}

function forall(variable: string, body: Formula): Formula {
  return { kind: 'forall', variable, args: [body] };
}

function exists(variable: string, body: Formula): Formula {
  return { kind: 'exists', variable, args: [body] };
}

function predicate(name: string, terms: string[]): Formula {
  return { kind: 'predicate', name, terms, params: terms };
}

function makeResult(status: RunResult['status']): RunResult {
  return { status, diagnostics: [], output: `result-${status}` };
}

describe('hashFormula', () => {
  it('mismo átomo → mismo hash', () => {
    expect(hashFormula(atom('P'))).toBe(hashFormula(atom('P')));
  });

  it('átomos distintos → hashes distintos', () => {
    expect(hashFormula(atom('P'))).not.toBe(hashFormula(atom('Q')));
  });

  it('fórmulas estructuralmente distintas → hashes distintos', () => {
    const f1 = and(atom('P'), atom('Q'));
    const f2 = and(atom('Q'), atom('P'));
    expect(hashFormula(f1)).not.toBe(hashFormula(f2));
  });

  it('fórmulas con not distintos → hashes distintos', () => {
    expect(hashFormula(not(atom('P')))).not.toBe(hashFormula(atom('P')));
  });

  it('hash estable: alpha-equiv ∀x.P(x) ≡ ∀y.P(y)', () => {
    const f1 = forall('x', predicate('P', ['x']));
    const f2 = forall('y', predicate('P', ['y']));
    expect(hashFormula(f1)).toBe(hashFormula(f2));
  });

  it('hash estable: alpha-equiv ∃x.P(x) ≡ ∃z.P(z)', () => {
    const f1 = exists('x', predicate('P', ['x']));
    const f2 = exists('z', predicate('P', ['z']));
    expect(hashFormula(f1)).toBe(hashFormula(f2));
  });

  it('fórmulas cuantificadas distintas → hashes distintos', () => {
    const f1 = forall('x', predicate('P', ['x']));
    const f2 = forall('x', predicate('Q', ['x']));
    expect(hashFormula(f1)).not.toBe(hashFormula(f2));
  });

  it('hash ignora campo source', () => {
    const f1: Formula = { kind: 'atom', name: 'P', source: { line: 1, column: 0 } };
    const f2: Formula = { kind: 'atom', name: 'P', source: { line: 99, column: 5 } };
    expect(hashFormula(f1)).toBe(hashFormula(f2));
  });

  it('fórmulas anidadas alfa-equiv producen mismo hash', () => {
    const f1 = forall('x', forall('y', predicate('R', ['x', 'y'])));
    const f2 = forall('a', forall('b', predicate('R', ['a', 'b'])));
    expect(hashFormula(f1)).toBe(hashFormula(f2));
  });

  it('fórmulas anidadas con predicados distintos → hashes distintos', () => {
    const f1 = forall('x', forall('y', predicate('R', ['x', 'y'])));
    const f2 = forall('a', forall('b', predicate('R', ['b', 'a'])));
    expect(hashFormula(f1)).not.toBe(hashFormula(f2));
  });
});

describe('DerivationCache — hit/miss básico', () => {
  let cache: DerivationCache;

  beforeEach(() => {
    cache = new DerivationCache();
  });

  it('miss en cache vacío', () => {
    expect(cache.get(atom('P'))).toBeUndefined();
    expect(cache.stats().misses).toBe(1);
  });

  it('hit tras set', () => {
    const f = atom('P');
    const r = makeResult('valid');
    cache.set(f, r);
    const got = cache.get(f);
    expect(got).toBeDefined();
    expect(got?.status).toBe('valid');
    expect(cache.stats().hits).toBe(1);
    expect(cache.stats().misses).toBe(0);
  });

  it('set reemplaza entrada existente', () => {
    const f = atom('P');
    cache.set(f, makeResult('valid'));
    cache.set(f, makeResult('invalid'));
    expect(cache.get(f)?.status).toBe('invalid');
    expect(cache.stats().size).toBe(1);
  });

  it('clear resetea todo', () => {
    cache.set(atom('P'), makeResult('valid'));
    cache.clear();
    expect(cache.stats().size).toBe(0);
    expect(cache.stats().hits).toBe(0);
    expect(cache.stats().misses).toBe(0);
    expect(cache.stats().evictions).toBe(0);
  });

  it('fórmulas distintas tienen entradas separadas', () => {
    cache.set(atom('P'), makeResult('valid'));
    cache.set(atom('Q'), makeResult('invalid'));
    expect(cache.stats().size).toBe(2);
    expect(cache.get(atom('P'))?.status).toBe('valid');
    expect(cache.get(atom('Q'))?.status).toBe('invalid');
  });
});

describe('DerivationCache — LRU eviction', () => {
  it('evicta el menos reciente al superar cap', () => {
    const cache = new DerivationCache({ maxEntries: 3 });
    cache.set(atom('A'), makeResult('valid'));
    cache.set(atom('B'), makeResult('valid'));
    cache.set(atom('C'), makeResult('valid'));
    expect(cache.stats().size).toBe(3);

    cache.set(atom('D'), makeResult('valid'));

    expect(cache.stats().size).toBe(3);
    expect(cache.stats().evictions).toBe(1);
    expect(cache.get(atom('A'))).toBeUndefined();
    expect(cache.get(atom('D'))).toBeDefined();
  });

  it('un hit mueve la entrada a MRU; el siguiente evict saca otra', () => {
    const cache = new DerivationCache({ maxEntries: 3 });
    cache.set(atom('A'), makeResult('valid'));
    cache.set(atom('B'), makeResult('valid'));
    cache.set(atom('C'), makeResult('valid'));

    cache.get(atom('A'));

    cache.set(atom('D'), makeResult('valid'));

    expect(cache.get(atom('A'))).toBeDefined();
    expect(cache.get(atom('B'))).toBeUndefined();
  });

  it('maxEntries=1 evicta siempre el anterior', () => {
    const cache = new DerivationCache({ maxEntries: 1 });
    cache.set(atom('X'), makeResult('valid'));
    cache.set(atom('Y'), makeResult('invalid'));
    expect(cache.stats().size).toBe(1);
    expect(cache.get(atom('X'))).toBeUndefined();
    expect(cache.get(atom('Y'))?.status).toBe('invalid');
  });
});

describe('DerivationCache — TTL', () => {
  it('entrada válida dentro del TTL', () => {
    const cache = new DerivationCache({ ttlMs: 5000 });
    cache.set(atom('P'), makeResult('valid'));
    expect(cache.get(atom('P'))).toBeDefined();
  });

  it('entrada expirada no se devuelve', () => {
    vi.useFakeTimers();
    const cache = new DerivationCache({ ttlMs: 100 });
    cache.set(atom('P'), makeResult('valid'));

    vi.advanceTimersByTime(200);

    expect(cache.get(atom('P'))).toBeUndefined();
    expect(cache.stats().misses).toBe(1);
    vi.useRealTimers();
  });

  it('TTL expira entrada pero no afecta otras vigentes', () => {
    vi.useFakeTimers();
    const cache = new DerivationCache({ ttlMs: 100 });
    cache.set(atom('P'), makeResult('valid'));
    vi.advanceTimersByTime(50);
    cache.set(atom('Q'), makeResult('invalid'));
    vi.advanceTimersByTime(60);

    expect(cache.get(atom('P'))).toBeUndefined();
    expect(cache.get(atom('Q'))).toBeDefined();
    vi.useRealTimers();
  });
});

describe('DerivationCache — persistencia round-trip', () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-memo-test-'));
    tmpFile = path.join(tmpDir, 'test-cache.json');
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('save → load preserva entradas', async () => {
    const cache1 = new DerivationCache({ persistPath: tmpFile });
    cache1.set(atom('P'), makeResult('valid'));
    cache1.set(atom('Q'), makeResult('unsatisfiable'));
    await cache1.saveToDisk();

    const cache2 = new DerivationCache({ persistPath: tmpFile });
    await cache2.loadFromDisk();

    expect(cache2.get(atom('P'))?.status).toBe('valid');
    expect(cache2.get(atom('Q'))?.status).toBe('unsatisfiable');
    expect(cache2.stats().size).toBe(2);
  });

  it('loadFromDisk es no-op si el archivo no existe', async () => {
    const cache = new DerivationCache({ persistPath: path.join(tmpDir, 'missing.json') });
    await expect(cache.loadFromDisk()).resolves.toBeUndefined();
    expect(cache.stats().size).toBe(0);
  });

  it('loadFromDisk no carga entradas TTL expiradas', async () => {
    vi.useFakeTimers();
    const cache1 = new DerivationCache({ persistPath: tmpFile, ttlMs: 100 });
    cache1.set(atom('P'), makeResult('valid'));
    await cache1.saveToDisk();

    vi.advanceTimersByTime(200);

    const cache2 = new DerivationCache({ persistPath: tmpFile });
    await cache2.loadFromDisk();
    expect(cache2.stats().size).toBe(0);
    vi.useRealTimers();
  });

  it('save crea directorio si no existe', async () => {
    const deepFile = path.join(tmpDir, 'deep', 'nested', 'cache.json');
    const cache = new DerivationCache({ persistPath: deepFile });
    cache.set(atom('X'), makeResult('valid'));
    await cache.saveToDisk();
    const stat = await fsp.stat(deepFile);
    expect(stat.isFile()).toBe(true);
  });

  it('round-trip con fórmula compleja', async () => {
    const f = forall('x', and(predicate('P', ['x']), not(predicate('Q', ['x']))));
    const cache1 = new DerivationCache({ persistPath: tmpFile });
    cache1.set(f, makeResult('valid'));
    await cache1.saveToDisk();

    const cache2 = new DerivationCache({ persistPath: tmpFile });
    await cache2.loadFromDisk();
    expect(cache2.get(f)?.status).toBe('valid');
  });
});

describe('DerivationCache — alpha-equivalencia en cache', () => {
  it('∀x.P(x) y ∀y.P(y) dan hit con la misma entrada', () => {
    const cache = new DerivationCache();
    const f1 = forall('x', predicate('P', ['x']));
    const f2 = forall('y', predicate('P', ['y']));

    cache.set(f1, makeResult('valid'));
    const result = cache.get(f2);

    expect(result).toBeDefined();
    expect(result?.status).toBe('valid');
    expect(cache.stats().hits).toBe(1);
  });

  it('∀x.P(x) y ∀x.Q(x) dan miss (predicados distintos)', () => {
    const cache = new DerivationCache();
    cache.set(forall('x', predicate('P', ['x'])), makeResult('valid'));
    expect(cache.get(forall('x', predicate('Q', ['x'])))).toBeUndefined();
  });
});
