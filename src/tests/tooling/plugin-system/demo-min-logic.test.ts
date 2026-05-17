import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileRegistry, minLogicPlugin } from '../../../tooling/plugin-system';
import { Formula } from '../../../types';

function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function and(...args: Formula[]): Formula {
  return { kind: 'and', args };
}
function or(...args: Formula[]): Formula {
  return { kind: 'or', args };
}
function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}
function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}

describe('Plugin demo: min-logic (3 valores)', () => {
  beforeEach(() => {
    ProfileRegistry.clear();
  });

  it('se registra y aparece en list()', () => {
    ProfileRegistry.register(minLogicPlugin);
    expect(ProfileRegistry.has('min')).toBe(true);
    const info = ProfileRegistry.list()[0];
    expect(info?.name).toBe('min');
    expect(info?.version).toBe('1.0.0');
  });

  it('get("min").evaluate hace min para ∧ y max para ∨', () => {
    ProfileRegistry.register(minLogicPlugin);
    const plugin = ProfileRegistry.get('min');
    expect(plugin).toBeDefined();
    if (!plugin) return;

    const andResult = plugin.evaluate(and(atom('P'), atom('Q')), { P: 1, Q: 0.5 });
    expect(andResult).toBe(0.5);

    const orResult = plugin.evaluate(or(atom('P'), atom('Q')), { P: 0, Q: 0.5 });
    expect(orResult).toBe(0.5);

    const notResult = plugin.evaluate(not(atom('P')), { P: 0 });
    expect(notResult).toBe(1);

    const notHalf = plugin.evaluate(not(atom('P')), { P: 0.5 });
    expect(notHalf).toBe(0.5);
  });

  it('boolean inputs se mapean (true=1, false=0)', () => {
    const plugin = minLogicPlugin;
    expect(plugin.evaluate(atom('A'), { A: true })).toBe(1);
    expect(plugin.evaluate(atom('A'), { A: false })).toBe(0);
  });

  it('atom no presente en env devuelve unknown (0.5)', () => {
    const plugin = minLogicPlugin;
    expect(plugin.evaluate(atom('Z'), {})).toBe(0.5);
  });

  it('implies usa max(1 - p, q)', () => {
    const plugin = minLogicPlugin;
    expect(plugin.evaluate(implies(atom('P'), atom('Q')), { P: 1, Q: 0 })).toBe(0);
    expect(plugin.evaluate(implies(atom('P'), atom('Q')), { P: 0, Q: 0 })).toBe(1);
    expect(plugin.evaluate(implies(atom('P'), atom('Q')), { P: 0.5, Q: 0.5 })).toBe(0.5);
  });

  it('checkValid detecta tautología (P ∨ ¬P NO es tautología en lógica min)', () => {
    const result = minLogicPlugin.checkValid(or(atom('P'), not(atom('P'))));
    expect(result.valid).toBe(false);
    expect(result.result).toContain('contraejemplo');
  });

  it('checkValid: TRUE constante es válido', () => {
    const result = minLogicPlugin.checkValid({ kind: 'true' });
    expect(result.valid).toBe(true);
  });

  it('checkValid: (TRUE ∨ P) es válido en lógica min (max(1,p) = 1)', () => {
    const result = minLogicPlugin.checkValid(or({ kind: 'true' }, atom('P')));
    expect(result.valid).toBe(true);
  });

  it('checkValid: (P → P) NO es tautología en Kleene strong (contraejemplo P=0.5)', () => {
    const result = minLogicPlugin.checkValid(implies(atom('P'), atom('P')));
    expect(result.valid).toBe(false);
  });

  it('supportedOperators expone los conectores del fragmento', () => {
    expect(minLogicPlugin.supportedOperators?.has('and')).toBe(true);
    expect(minLogicPlugin.supportedOperators?.has('or')).toBe(true);
    expect(minLogicPlugin.supportedOperators?.has('not')).toBe(true);
    expect(minLogicPlugin.supportedOperators?.has('implies')).toBe(true);
  });
});
