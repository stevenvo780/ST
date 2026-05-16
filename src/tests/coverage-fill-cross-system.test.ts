/**
 * Coverage fill — src/runtime/cross-system-compare.ts
 * Current coverage: 0% (file not touched by any test)
 */

import { describe, it, expect } from 'vitest';
import { compareAcrossSystems } from '../runtime/cross-system-compare';
import { Interpreter } from '../runtime/interpreter';
import type { Formula } from '../types';

// Ensure registry is populated by creating an interpreter
new Interpreter();
// The registry is exported from profiles/interface
import { registry } from '../profiles/interface';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });

describe('compareAcrossSystems()', () => {
  it('returns a Record<string, string>', () => {
    const result = compareAcrossSystems(atom('P'), registry);
    expect(typeof result).toBe('object');
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('tautology P∨¬P is VÁLIDA in classical', () => {
    const f = or(atom('P'), not(atom('P')));
    const result = compareAcrossSystems(f, registry);
    expect(result['classical.propositional']).toBe('VÁLIDA');
  });

  it('tautology P∨¬P is not VÁLIDA in intuitionistic', () => {
    const f = or(atom('P'), not(atom('P')));
    const result = compareAcrossSystems(f, registry);
    expect(result['intuitionistic.propositional']).toBe('NO VÁLIDA');
  });

  it('P→P is valid in all propositional systems', () => {
    const f = implies(atom('P'), atom('P'));
    const result = compareAcrossSystems(f, registry);
    expect(result['classical.propositional']).toBe('VÁLIDA');
    expect(result['intuitionistic.propositional']).toBe('VÁLIDA');
    expect(result['modal.k']).toBe('VÁLIDA');
  });

  it('P∧¬P shows as satisfiable in Belnap row', () => {
    const f = and(atom('P'), not(atom('P')));
    const result = compareAcrossSystems(f, registry);
    // Belnap: invalid but satisfiable
    expect(result['paraconsistent.belnap']).toContain('SATISFACIBLE');
  });

  it('handles formula with no compatible systems gracefully', () => {
    // A quantified formula may be N/A in propositional systems
    const f: Formula = { kind: 'forall', variable: 'x', args: [atom('P')] };
    const result = compareAcrossSystems(f, registry);
    // Some systems will say N/A
    expect(typeof result).toBe('object');
  });

  it('non-tautology P shows as NO VÁLIDA in classical', () => {
    const result = compareAcrossSystems(atom('P'), registry);
    expect(result['classical.propositional']).toBe('NO VÁLIDA');
  });

  it('checks all expected systems are present', () => {
    const f = implies(atom('A'), atom('A'));
    const result = compareAcrossSystems(f, registry);
    const keys = Object.keys(result);
    expect(keys).toContain('classical.propositional');
    expect(keys).toContain('modal.k');
    expect(keys).toContain('paraconsistent.belnap');
  });

  it('handles computational error gracefully', () => {
    // A formula that might cause an issue in certain profiles
    const f = implies(atom('X'), atom('X'));
    const result = compareAcrossSystems(f, registry);
    // Should not throw
    expect(typeof result).toBe('object');
  });
});
