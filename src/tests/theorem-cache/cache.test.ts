import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import {
  TheoremCache,
  tryReuseProof,
  canonicalize,
  canonicalString,
  computeSubstitution,
  applySubstitution,
  matchPattern,
  patternMatches,
} from '../../runtime/theorem-cache';

function baseMeta(overrides?: Partial<{ provedAt: string; ms: number; provedBy: string }>): {
  provedAt: string;
  ms: number;
  provedBy?: string;
} {
  return {
    provedAt: overrides?.provedAt ?? '2026-05-17T12:00:00.000Z',
    ms: overrides?.ms ?? 42,
    provedBy: overrides?.provedBy,
  };
}

describe('canonicalize', () => {
  it('mapea identificadores en orden de aparición', () => {
    expect(canonicalString('P -> Q')).toBe('?0 -> ?1');
  });

  it('mismas posiciones reciben mismo placeholder', () => {
    expect(canonicalString('P -> P')).toBe('?0 -> ?0');
  });

  it('P->P y Q->Q producen la misma forma canónica', () => {
    expect(canonicalString('P -> P')).toBe(canonicalString('Q -> Q'));
  });

  it('preserva operadores y paréntesis', () => {
    expect(canonicalString('(P and Q) -> P')).toBe('(?0 and ?1) -> ?0');
  });

  it('normaliza whitespace agresivo', () => {
    expect(canonicalString('  P   ->\tP\n')).toBe(canonicalString('P -> P'));
  });

  it('no renombra palabras reservadas', () => {
    const out = canonicalize('not P or Q');
    expect(out.canonical).toBe('not ?0 or ?1');
  });

  it('forward y reverse son consistentes', () => {
    const out = canonicalize('P -> Q -> P');
    expect(out.forward.get('P')).toBe('?0');
    expect(out.forward.get('Q')).toBe('?1');
    expect(out.reverse.get('?0')).toBe('P');
    expect(out.reverse.get('?1')).toBe('Q');
  });
});

describe('computeSubstitution / applySubstitution', () => {
  it('mapea P->P a Q->Q', () => {
    const sub = computeSubstitution('P -> P', 'Q -> Q');
    expect(sub).toEqual({ P: 'Q' });
  });

  it('mapea (P and Q) -> P a (A and B) -> A', () => {
    const sub = computeSubstitution('(P and Q) -> P', '(A and B) -> A');
    expect(sub).toEqual({ P: 'A', Q: 'B' });
  });

  it('retorna undefined si la estructura difiere', () => {
    expect(computeSubstitution('P -> Q', 'P and Q')).toBeUndefined();
  });

  it('aplica substitución preservando operadores', () => {
    const out = applySubstitution('P -> Q and not P', { P: 'A', Q: 'B' });
    expect(out).toBe('A -> B and not A');
  });

  it('applySubstitution no toca reservadas', () => {
    const out = applySubstitution('not P or P', { P: 'X', not: 'BAD' });
    expect(out).toBe('not X or X');
  });
});

describe('matchPattern', () => {
  it('?x -> ?x matchea P -> P con x=P', () => {
    expect(matchPattern('?x -> ?x', 'P -> P')).toEqual({ x: 'P' });
  });

  it('?x -> ?x NO matchea P -> Q', () => {
    expect(matchPattern('?x -> ?x', 'P -> Q')).toBeUndefined();
  });

  it('?x -> ?y matchea P -> Q', () => {
    expect(matchPattern('?x -> ?y', 'P -> Q')).toEqual({ x: 'P', y: 'Q' });
  });

  it('?x -> ?y matchea P -> P (vars distintas pueden coincidir)', () => {
    expect(matchPattern('?x -> ?y', 'P -> P')).toEqual({ x: 'P', y: 'P' });
  });

  it('patternMatches sobre fórmula con paréntesis', () => {
    expect(patternMatches('(?x and ?y) -> ?x', '(A and B) -> A')).toBe(true);
    expect(patternMatches('(?x and ?y) -> ?x', '(A and B) -> B')).toBe(false);
  });

  it('rechaza match si metavariable se liga a operador', () => {
    expect(matchPattern('?x', 'and')).toBeUndefined();
  });
});

describe('TheoremCache — store/retrieve', () => {
  it('store + retrieve round-trip', () => {
    const cache = new TheoremCache();
    const id = cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: { steps: ['assume P', 'derive P'] },
      metadata: baseMeta(),
    });
    expect(id).toMatch(/^[a-f0-9]+$/);

    const retrieved = cache.retrieve('P -> P', 'classical');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(id);
    expect(retrieved?.profile).toBe('classical');
  });

  it('retrieve para clave inexistente devuelve undefined y suma miss', () => {
    const cache = new TheoremCache();
    expect(cache.retrieve('P', 'classical')).toBeUndefined();
    expect(cache.stats().misses).toBe(1);
    expect(cache.stats().hits).toBe(0);
  });

  it('retrieve para alpha-equivalente da hit', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'identity',
      metadata: baseMeta(),
    });
    const hit = cache.retrieve('Q -> Q', 'classical');
    expect(hit).toBeDefined();
    expect(hit?.formula).toBe('P -> P'); // original almacenado
    expect(cache.stats().hits).toBe(1);
  });

  it('mismo formula en distintos profiles → entradas separadas', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P or not P',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'lem',
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'P or not P',
      normalizedFormula: '',
      profile: 'intuitionistic',
      proof: 'rejected',
      metadata: baseMeta(),
    });
    expect(cache.stats().entries).toBe(2);
    expect(cache.retrieve('P or not P', 'classical')?.proof).toBe('lem');
    expect(cache.retrieve('P or not P', 'intuitionistic')?.proof).toBe('rejected');
  });

  it('exists no afecta hits/misses', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    expect(cache.exists('P', 'classical')).toBe(true);
    expect(cache.exists('Q', 'classical')).toBe(true); // alpha-equivalente
    expect(cache.exists('P', 'modal')).toBe(false);
    const s = cache.stats();
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
  });

  it('store sobre clave existente reemplaza y mantiene size', () => {
    const cache = new TheoremCache();
    const id1 = cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'v1',
      metadata: baseMeta(),
    });
    const id2 = cache.store({
      formula: 'X -> X',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'v2',
      metadata: baseMeta(),
    });
    expect(id1).toBe(id2);
    expect(cache.stats().entries).toBe(1);
    expect(cache.retrieve('Z -> Z', 'classical')?.proof).toBe('v2');
  });

  it('remove borra una entrada por id', () => {
    const cache = new TheoremCache();
    const id = cache.store({
      formula: 'P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    expect(cache.remove(id)).toBe(true);
    expect(cache.remove(id)).toBe(false);
    expect(cache.stats().entries).toBe(0);
  });

  it('clear resetea todo', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    cache.retrieve('P', 'classical');
    cache.retrieve('NOPE', 'classical');
    cache.clear();
    const s = cache.stats();
    expect(s.entries).toBe(0);
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
  });
});

describe('TheoremCache — LRU eviction', () => {
  it('al exceder maxEntries evicta la entrada más vieja', () => {
    // Formulas estructuralmente distintas para que NO colisionen al
    // canonicalizar.
    const cache = new TheoremCache({ maxEntries: 3 });
    cache.store({
      formula: 'A',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'B and B',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'C or C',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'D -> D',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });

    expect(cache.stats().entries).toBe(3);
    // A fue la más vieja → evictada
    expect(cache.exists('A', 'p')).toBe(false);
    expect(cache.exists('D -> D', 'p')).toBe(true);
  });

  it('retrieve promueve a MRU (no se evicta luego)', () => {
    const cache = new TheoremCache({ maxEntries: 3 });
    cache.store({
      formula: 'A',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'B and B',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'C or C',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });

    // Promovemos A.
    cache.retrieve('A', 'p');

    // Insertamos D → debería evictar B and B (ahora la más vieja).
    cache.store({
      formula: 'D -> D',
      normalizedFormula: '',
      profile: 'p',
      proof: null,
      metadata: baseMeta(),
    });

    expect(cache.exists('A', 'p')).toBe(true);
    expect(cache.exists('B and B', 'p')).toBe(false);
    expect(cache.exists('D -> D', 'p')).toBe(true);
  });
});

describe('TheoremCache — retrieveByPattern', () => {
  it('?x -> ?x matchea fórmulas auto-implicantes', () => {
    // P -> P y R -> R son alpha-equivalentes (mismo profile → colisionan
    // en un único slot). Usamos profiles distintos para mantener las dos.
    const cache = new TheoremCache();
    cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'id1',
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'P -> Q',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'id2',
      metadata: baseMeta(),
    });
    cache.store({
      formula: 'R -> R',
      normalizedFormula: '',
      profile: 'intuitionistic',
      proof: 'id3',
      metadata: baseMeta(),
    });

    const hits = cache.retrieveByPattern('?x -> ?x');
    expect(hits.length).toBe(2);
    const formulas = hits.map((h) => h.formula).sort();
    expect(formulas).toEqual(['P -> P', 'R -> R']);
  });

  it('patrón sin match devuelve array vacío', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    expect(cache.retrieveByPattern('?x and ?y')).toEqual([]);
  });
});

describe('TheoremCache — saveToDisk + loadFromDisk', () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-theorem-cache-'));
    tmpFile = path.join(tmpDir, 'theorems.json');
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('roundtrip preserva entradas', async () => {
    const c1 = new TheoremCache({ persistPath: tmpFile });
    c1.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: { kind: 'tree', steps: 3 },
      metadata: baseMeta({ provedBy: 'fol-prover' }),
    });
    c1.store({
      formula: 'Q and R',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'opaque',
      metadata: baseMeta(),
    });
    await c1.saveToDisk();

    const c2 = new TheoremCache({ persistPath: tmpFile });
    const loaded = await c2.loadFromDisk();
    expect(loaded).toBe(2);
    expect(c2.stats().entries).toBe(2);

    const r1 = c2.retrieve('P -> P', 'classical');
    expect(r1?.proof).toEqual({ kind: 'tree', steps: 3 });
    expect(r1?.metadata.provedBy).toBe('fol-prover');

    const r2 = c2.retrieve('Q and R', 'classical');
    expect(r2?.proof).toBe('opaque');
  });

  it('loadFromDisk en archivo inexistente devuelve 0', async () => {
    const c = new TheoremCache({ persistPath: path.join(tmpDir, 'nope.json') });
    expect(await c.loadFromDisk()).toBe(0);
    expect(c.stats().entries).toBe(0);
  });

  it('save crea el directorio padre si no existe', async () => {
    const deep = path.join(tmpDir, 'a', 'b', 'c', 'cache.json');
    const c = new TheoremCache({ persistPath: deep });
    c.store({
      formula: 'P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    await c.saveToDisk();
    const stat = await fsp.stat(deep);
    expect(stat.isFile()).toBe(true);
  });

  it('loadFromDisk ignora entradas corruptas', async () => {
    await fsp.writeFile(
      tmpFile,
      JSON.stringify([
        {
          id: 'x',
          formula: 'P',
          normalizedFormula: '?0',
          profile: 'classical',
          proof: null,
          metadata: { provedAt: 'now', ms: 1 },
        },
        { id: 'y' }, // incompleto
        'not-an-object',
      ]),
      'utf-8',
    );
    const c = new TheoremCache({ persistPath: tmpFile });
    const loaded = await c.loadFromDisk();
    expect(loaded).toBe(1);
  });

  it('loadFromDisk no-op silencioso ante JSON inválido', async () => {
    await fsp.writeFile(tmpFile, 'not-json{', 'utf-8');
    const c = new TheoremCache({ persistPath: tmpFile });
    expect(await c.loadFromDisk()).toBe(0);
  });
});

describe('TheoremCache — stats', () => {
  it('reporta entries y storedBytes positivos', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: 'identity',
      metadata: baseMeta(),
    });
    const s = cache.stats();
    expect(s.entries).toBe(1);
    expect(s.storedBytes).toBeGreaterThan(0);
  });

  it('cuenta hits y misses correctamente', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P',
      normalizedFormula: '',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    });
    cache.retrieve('P', 'classical'); // hit
    cache.retrieve('P', 'classical'); // hit
    cache.retrieve('Z', 'modal'); // miss
    const s = cache.stats();
    expect(s.hits).toBe(2);
    expect(s.misses).toBe(1);
  });
});

describe('tryReuseProof — proof reuse con substitución', () => {
  it('reusa P -> P para Q -> Q', () => {
    const cache = new TheoremCache();
    cache.store({
      formula: 'P -> P',
      normalizedFormula: '',
      profile: 'classical',
      proof: { steps: ['assume P', 'conclude P'] },
      metadata: baseMeta(),
    });
    const t = cache.retrieve('P -> P', 'classical')!;
    const result = tryReuseProof(t, 'Q -> Q');
    expect(result.reusable).toBe(true);
    expect(result.substitution).toEqual({ P: 'Q' });
    expect(result.reusedProof).toEqual({ steps: ['assume Q', 'conclude Q'] });
  });

  it('reusa con prueba string', () => {
    const t = {
      id: 'x',
      formula: 'P -> P',
      normalizedFormula: '?0 -> ?0',
      profile: 'classical',
      proof: 'apply identity to P',
      metadata: baseMeta(),
    };
    const r = tryReuseProof(t, 'X -> X');
    expect(r.reusable).toBe(true);
    expect(r.reusedProof).toBe('apply identity to X');
  });

  it('no reusa si la estructura difiere', () => {
    const t = {
      id: 'x',
      formula: 'P -> P',
      normalizedFormula: '?0 -> ?0',
      profile: 'classical',
      proof: 'identity',
      metadata: baseMeta(),
    };
    const r = tryReuseProof(t, 'P and Q');
    expect(r.reusable).toBe(false);
    expect(r.substitution).toBeUndefined();
  });

  it('reusa (P and Q) -> P para (A and B) -> A', () => {
    const t = {
      id: 'x',
      formula: '(P and Q) -> P',
      normalizedFormula: '(?0 and ?1) -> ?0',
      profile: 'classical',
      proof: { rule: 'conj-elim-left', target: 'P', conjunct: 'Q' },
      metadata: baseMeta(),
    };
    const r = tryReuseProof(t, '(A and B) -> A');
    expect(r.reusable).toBe(true);
    expect(r.substitution).toEqual({ P: 'A', Q: 'B' });
    expect(r.reusedProof).toEqual({ rule: 'conj-elim-left', target: 'A', conjunct: 'B' });
  });

  it('proof null/undefined se mantiene tal cual', () => {
    const t = {
      id: 'x',
      formula: 'P',
      normalizedFormula: '?0',
      profile: 'classical',
      proof: null,
      metadata: baseMeta(),
    };
    const r = tryReuseProof(t, 'Q');
    expect(r.reusable).toBe(true);
    expect(r.reusedProof).toBeNull();
  });
});
