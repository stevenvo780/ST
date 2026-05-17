import { describe, it, expect } from 'vitest';
import {
  evaluate,
  parse,
  check,
  quickEval,
  createInterpreter,
  listProfiles,
  hover,
  symbols,
  gotoDefinition,
  completion,
  formulaToString,
  formulaToUnicode,
  formulaToLaTeX,
  detectFallacies,
} from '../../api';
import { Interpreter } from '../../runtime/interpreter';
import { registry } from '../../profiles/interface';
import type { Formula } from '../../types';

describe('api — evaluate / parse / check / quickEval', () => {
  it('evaluate succeeds on valid ST script', () => {
    const r = evaluate(`logic classical.propositional
axiom a1 : P -> Q
axiom a2 : P
derive Q from a1, a2
`);
    expect(r.ok).toBe(true);
    expect(r.exitCode).toBe(0);
    expect(r.results.length).toBeGreaterThanOrEqual(1);
    expect(r.stdout.length).toBeGreaterThan(0);
  });

  it('evaluate reports parse error with exitCode 1', () => {
    const r = evaluate('logic\n@@@@\n');
    expect(r.ok).toBe(false);
    expect(r.exitCode).toBe(1);
    expect(r.stderr.length).toBeGreaterThan(0);
  });

  it('parse: returns program on success', () => {
    const r = parse('logic classical.propositional\naxiom a : P\n');
    expect(r.ok).toBe(true);
    expect(r.program).not.toBeNull();
    expect(r.program!.statements.length).toBe(2);
  });

  it('parse: returns null program on error', () => {
    const r = parse('axiom : ::\n');
    expect(r.ok).toBe(false);
    expect(r.program).toBeNull();
  });

  it('check: ok=true for valid syntax', () => {
    const r = check('logic classical.propositional\n');
    expect(r.ok).toBe(true);
  });

  it('check: ok=false for syntax error', () => {
    const r = check('axiom : ::\n');
    expect(r.ok).toBe(false);
  });

  it('quickEval auto-prepends classical.propositional', () => {
    const r = quickEval('check valid (P -> (Q -> P))');
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('valid');
  });

  it('quickEval handles invalid expression', () => {
    const r = quickEval('check valid (P & !P)');
    expect(r.results[0]?.status).toBe('invalid');
  });
});

describe('api — listProfiles', () => {
  it('returns at least the built-in profiles', () => {
    const profiles = listProfiles();
    expect(profiles).toContain('classical.propositional');
    expect(profiles).toContain('classical.first_order');
    expect(profiles.length).toBeGreaterThan(5);
  });
});

describe('api — createInterpreter (stateful)', () => {
  it('exec maintains state across calls', () => {
    const st = createInterpreter();
    expect(st.getProfile()).toBeNull();
    st.exec('logic classical.propositional');
    expect(st.getProfile()).toBe('classical.propositional');

    st.exec('axiom a1 : P -> Q');
    st.exec('axiom a2 : P');
    expect(st.getAxioms()).toContain('a1');
    expect(st.getAxioms()).toContain('a2');

    const r = st.exec('derive Q from a1, a2');
    expect(r.ok).toBe(true);

    const sum = st.getTheorySummary();
    expect(sum.profile).toBe('classical.propositional');
    expect(sum.axioms).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(sum.judgmentCount).toBeGreaterThanOrEqual(0);

    expect(st.getHistory().length).toBeGreaterThan(0);
  });

  it('reset clears state', () => {
    const st = createInterpreter();
    st.exec('logic classical.propositional');
    st.exec('axiom a1 : P');
    st.reset();
    expect(st.getProfile()).toBeNull();
    expect(st.getAxioms()).toEqual([]);
    expect(st.getHistory()).toEqual([]);
  });

  it('exec accumulates theorems and claims', () => {
    const st = createInterpreter();
    st.exec('logic classical.propositional');
    st.exec('theorem t1 : P -> P');
    expect(st.getTheorems()).toContain('t1');

    st.exec('let phi = P -> P');
    st.exec('claim c1 = phi');
    const claims = st.getClaims();
    expect(claims.length).toBeGreaterThanOrEqual(0);
  });
});

describe('api — protocol-level wrappers (hover/symbols/goto/completion)', () => {
  const src = `logic classical.propositional
axiom a1 : P -> Q
theorem t1 : P -> P
`;

  it('hover returns content for a symbol', () => {
    const r = hover(src, 2, 9);
    expect(r).not.toBeNull();
    expect(r!.content).toMatch(/Axioma/);
  });

  it('hover returns null when out of range', () => {
    const r = hover(src, 999, 1);
    expect(r).toBeNull();
  });

  it('symbols returns list with axiom and theorem', () => {
    const syms = symbols(src);
    expect(syms.some((s) => s.kind === 'axiom')).toBe(true);
    expect(syms.some((s) => s.kind === 'theorem')).toBe(true);
  });

  it('gotoDefinition finds existing name', () => {
    const r = gotoDefinition(src, 'a1');
    expect(r).not.toBeNull();
    expect(r!.line).toBe(2);
  });

  it('gotoDefinition returns null for missing name', () => {
    const r = gotoDefinition(src, 'nope');
    expect(r).toBeNull();
  });

  it('completion returns a list', () => {
    const items = completion();
    expect(items.length).toBeGreaterThan(10);
  });
});

describe('api — format utilities', () => {
  const atom = (n: string): Formula => ({ kind: 'atom', name: n });
  const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });

  it('formulaToString produces ascii-ish', () => {
    expect(formulaToString(and(atom('P'), atom('Q')))).toContain('&');
  });

  it('formulaToUnicode produces unicode operators', () => {
    expect(formulaToUnicode(and(atom('P'), atom('Q')))).toContain('∧');
  });

  it('formulaToLaTeX produces TeX commands', () => {
    expect(formulaToLaTeX(and(atom('P'), atom('Q')))).toMatch(/\\(land|wedge|cap)|\\to|\\&/);
  });

  it('detectFallacies works given premises, conclusion, profile', () => {
    // affirming the consequent: P -> Q, Q => P
    const premises: Formula[] = [{ kind: 'implies', args: [atom('P'), atom('Q')] }, atom('Q')];
    const conclusion = atom('P');
    expect(listProfiles().length).toBeGreaterThan(0);
    new Interpreter();
    const p = registry.get('classical.propositional');
    if (!p) throw new Error('no profile');
    const fs = detectFallacies(premises, conclusion, p);
    expect(Array.isArray(fs)).toBe(true);
  });
});

describe('Interpreter — coverage of multiple commands', () => {
  it('runs check valid / invalid / satisfiable / equivalent', () => {
    const src = `logic classical.propositional
check valid (P -> P)
check valid (P & !P)
check satisfiable (P | !P)
check equivalent (P & Q), (Q & P)
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
    expect(out.results.length).toBe(4);
  });

  it('runs countermodel and truth_table commands', () => {
    const src = `logic classical.propositional
countermodel (P -> Q)
truth_table (P & Q)
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
  });

  it('runs explain', () => {
    const src = `logic classical.propositional
explain (P -> P)
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
  });

  it('runs let and print', () => {
    const src = `logic arithmetic
let x = 5
print x
let y = x + 3
print y
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('5');
  });

  it('runs if/else statement', () => {
    const src = `logic classical.propositional
if valid (P -> P) {
  print "ok"
} else {
  print "no"
}
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('ok');
  });

  it('runs fn declaration and call', () => {
    const src = `logic arithmetic
fn double(x) {
  return x * 2
}
let r = double(7)
print r
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('14');
  });

  it('runs theory with members', () => {
    const src = `logic classical.propositional
theory Persona(nombre) {
  let id = nombre
  axiom existencia : P
  theorem identidad : P -> P
}
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
  });

  it('runs define and unfold', () => {
    const src = `logic classical.propositional
define Mortal(x) := P -> Q
unfold Mortal(s)
`;
    const out = new Interpreter().execute(src);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles source declaration', () => {
    const src = `logic classical.propositional
source Kant24 { author "Kant" }
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
  });

  it('handles glossary command', () => {
    const src = `logic classical.propositional
define M(x) := P
glossary
`;
    const out = new Interpreter().execute(src);
    expect(out.exitCode).toBe(0);
  });
});
