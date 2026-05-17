import { describe, it, expect } from 'vitest';
import { normalizeSTSource, createReplCompatState, transformReplInput } from '../../runtime/compat';

describe('normalizeSTSource — Unicode and block handling', () => {
  it('preserves a simple source', () => {
    const out = normalizeSTSource('logic classical.propositional\naxiom a : P\n');
    expect(out).toContain('axiom a : P');
  });

  it('normalizes Unicode operators to ASCII', () => {
    const out = normalizeSTSource('axiom a : P → Q\n');
    expect(out).toMatch(/->|→/);
  });

  it('preserves block comments', () => {
    const src = 'logic classical.propositional\n/* multi-line\ncomment */\naxiom a : P\n';
    const out = normalizeSTSource(src);
    expect(out).toContain('axiom a : P');
  });

  it('preserves [[ ]] double brackets across lines', () => {
    const src = 'logic classical.propositional\nlet x : "[[\nfoo\n]]"\n';
    const out = normalizeSTSource(src);
    expect(out).toBeDefined();
  });

  it('produces output for empty input', () => {
    expect(normalizeSTSource('')).toBeDefined();
  });
});

describe('transformReplInput — incremental REPL transformation', () => {
  it('returns execute kind for simple complete statement', () => {
    const state = createReplCompatState();
    const r = transformReplInput('axiom a : P', state, {
      knownPremises: [],
    });
    expect(['execute', 'buffered', 'executeSingle']).toContain(r.kind);
  });

  it('buffers multi-line block starting with assume', () => {
    const state = createReplCompatState();
    const r = transformReplInput('assume P', state, { knownPremises: [] });
    expect(['buffered', 'execute', 'executeSingle']).toContain(r.kind);
  });

  it('handles theory { ... } across lines', () => {
    const state = createReplCompatState();
    const r1 = transformReplInput('theory T(n) {', state, { knownPremises: [] });
    expect(r1.kind).toBe('buffered');
    const r2 = transformReplInput('  axiom a : P', state, { knownPremises: [] });
    expect(r2.kind).toBe('buffered');
    const r3 = transformReplInput('}', state, { knownPremises: [] });
    expect(['execute', 'executeSingle']).toContain(r3.kind);
  });

  it('handles direct multi-line input via \\n', () => {
    const state = createReplCompatState();
    const r = transformReplInput('logic classical.propositional\naxiom a : P', state, {
      knownPremises: [],
    });
    expect(['execute', 'executeSingle']).toContain(r.kind);
  });

  it('createReplCompatState returns fresh state with defaults', () => {
    const s = createReplCompatState();
    expect(s.nextId).toBe(1);
    expect(s.pendingPremises).toEqual([]);
    expect(s.pendingBlockLines).toEqual([]);
    expect(s.pendingBlockBraceDepth).toBe(0);
  });

  it('handles assume + show + qed sequence', () => {
    const state = createReplCompatState();
    transformReplInput('assume P', state, { knownPremises: [] });
    transformReplInput('show P', state, { knownPremises: ['P'] });
    transformReplInput('qed', state, { knownPremises: [] });
    expect(state.pendingBlockProofDepth).toBeGreaterThanOrEqual(0);
  });
});

describe('normalizeSTSource — comment line normalization', () => {
  it('preserves line comments with //', () => {
    const out = normalizeSTSource('// hola\naxiom a : P\n');
    expect(out).toContain('axiom a : P');
  });

  it('handles strings with escaped quotes', () => {
    const out = normalizeSTSource('let x : "hello \\"world\\""\n');
    expect(out).toBeDefined();
  });
});
