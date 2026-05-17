import { describe, it, expect } from 'vitest';
import { detectUndecidable } from '../../logic/profiles/classical/undecidability-detector';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const pred = (name: string, ...terms: string[]): Formula => ({
  kind: 'predicate',
  name,
  args: terms.map((t) => ({ kind: 'atom', name: t })),
});
const forall = (variable: string, body: Formula): Formula => ({
  kind: 'forall',
  variable,
  args: [body],
});
const exists = (variable: string, body: Formula): Formula => ({
  kind: 'exists',
  variable,
  args: [body],
});
const fn = (name: string, ...args: Formula[]): Formula => ({
  kind: 'fn_call',
  name,
  args,
});

describe('detectUndecidable() — undecidability detector', () => {
  it('returns empty array for a simple atom', () => {
    expect(detectUndecidable(atom('P'))).toEqual([]);
  });

  it('returns empty for a single quantifier', () => {
    const f = forall('x', pred('P', 'x'));
    expect(detectUndecidable(f)).toEqual([]);
  });

  it('detects quantifier alternation depth >= 3 as warning', () => {
    // ∀x ∃y ∀z ∃w P(x,y,z,w)
    const f = forall('x', exists('y', forall('z', exists('w', pred('P', 'x', 'y', 'z', 'w')))));
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'quantifier_alternation')).toBe(true);
    const qa = w.find((x) => x.pattern === 'quantifier_alternation');
    expect(qa).toBeDefined();
    expect(['warning', 'critical']).toContain(qa!.severity);
  });

  it('marks quantifier alternation depth >= 4 as critical', () => {
    // ∀ ∃ ∀ ∃ ∀ → alternation depth 4
    const f = forall(
      'a',
      exists('b', forall('c', exists('d', forall('e', pred('Q', 'a', 'b', 'c', 'd', 'e'))))),
    );
    const w = detectUndecidable(f);
    const qa = w.find((x) => x.pattern === 'quantifier_alternation');
    expect(qa).toBeDefined();
    expect(qa!.severity).toBe('critical');
  });

  it('detects deep quantifier nesting (>=5)', () => {
    // ∀∀∀∀∀ P(a,b,c,d,e) — nesting 5, alternation 0
    const f = forall(
      'a',
      forall('b', forall('c', forall('d', forall('e', pred('R', 'a', 'b', 'c', 'd', 'e'))))),
    );
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'deep_quantifier_nesting')).toBe(true);
  });

  it('marks nesting >= 8 as critical', () => {
    let body: Formula = pred('S', 'a');
    for (let i = 0; i < 8; i++) {
      body = forall(`v${i}`, body);
    }
    const w = detectUndecidable(body);
    const dn = w.find((x) => x.pattern === 'deep_quantifier_nesting');
    expect(dn).toBeDefined();
    expect(dn!.severity).toBe('critical');
  });

  it('detects Gödel-like self-reference (provable)', () => {
    const f = forall('x', pred('provable_of', 'x'));
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'goedel_self_reference')).toBe(true);
  });

  it('detects truth_of self-reference', () => {
    const f = pred('truth_of', 'x');
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'goedel_self_reference')).toBe(true);
  });

  it('detects godel atom', () => {
    const f = atom('godel_sentence');
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'goedel_self_reference')).toBe(true);
  });

  it('detects halt-like names', () => {
    const f = pred('halts', 'p');
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'goedel_self_reference')).toBe(true);
  });

  it('detects reflexive predicate', () => {
    const f = pred('reflexive_check', 'x');
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'goedel_self_reference')).toBe(true);
  });

  it('detects deep function nesting with quantifiers', () => {
    // P(f(f(f(f(x)))))
    const fx = fn('f', atom('x'));
    const ffx = fn('f', fx);
    const fffx = fn('f', ffx);
    const ffffx = fn('f', fffx);
    const f = forall('x', { kind: 'predicate', name: 'P', args: [ffffx] });
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'deep_function_nesting')).toBe(true);
  });

  it('marks function nesting >= 6 as critical', () => {
    let term: Formula = atom('x');
    for (let i = 0; i < 6; i++) {
      term = fn('g', term);
    }
    const f = forall('x', { kind: 'predicate', name: 'P', args: [term] });
    const w = detectUndecidable(f);
    const fn_w = w.find((x) => x.pattern === 'deep_function_nesting');
    expect(fn_w).toBeDefined();
    expect(fn_w!.severity).toBe('critical');
  });

  it('detects polyadic predicates combined with alternation', () => {
    // ∀x ∃y ∀z P(x,y,z) — alternation depth 2 + polyadic predicate
    const f = forall('x', exists('y', forall('z', pred('Three', 'x', 'y', 'z'))));
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'polyadic_with_alternation')).toBe(true);
  });

  it('detects infinite-domain-requiring formula', () => {
    // ∀x ∃y ¬P(x,y)
    const f = forall('x', exists('y', not(pred('P', 'x', 'y'))));
    const w = detectUndecidable(f);
    expect(w.some((x) => x.pattern === 'infinite_domain')).toBe(true);
  });

  it('does not report on monadic decidable patterns', () => {
    const f = forall('x', pred('M', 'x'));
    const w = detectUndecidable(f);
    expect(w.find((x) => x.pattern === 'polyadic_with_alternation')).toBeUndefined();
    expect(w.find((x) => x.pattern === 'quantifier_alternation')).toBeUndefined();
  });

  it('returns empty for and/or compound without quantifiers', () => {
    const f = and(atom('P'), atom('Q'));
    expect(detectUndecidable(f)).toEqual([]);
  });

  it('all warnings have required fields', () => {
    const f = forall(
      'a',
      exists('b', forall('c', exists('d', pred('provable', 'a', 'b', 'c', 'd')))),
    );
    const ws = detectUndecidable(f);
    expect(ws.length).toBeGreaterThan(0);
    for (const w of ws) {
      expect(typeof w.pattern).toBe('string');
      expect(typeof w.description).toBe('string');
      expect(['info', 'warning', 'critical']).toContain(w.severity);
      expect(typeof w.suggestion).toBe('string');
    }
  });
});
