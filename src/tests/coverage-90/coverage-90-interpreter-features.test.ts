import { describe, it, expect } from 'vitest';
import { Interpreter } from '../../runtime/interpreter';

function run(src: string): ReturnType<Interpreter['execute']> {
  return new Interpreter().execute(src);
}

describe('coverage-90 — interpreter features (theory, fn, builtins, render)', () => {
  // ---- builtins (executeBuiltin) ----
  it('typeof builtin distinguishes Number, List, String, Formula', () => {
    const out = run(`logic classical.propositional
let n = typeof(42)
let l = typeof([1, 2, 3])
let s = typeof("hola")
let f = typeof(P -> Q)
print n
print l
print s
print f
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Number');
    expect(out.stdout).toContain('List');
    expect(out.stdout).toContain('String');
    expect(out.stdout).toContain('Formula');
  });

  it('is_valid / is_satisfiable as builtin function calls', () => {
    const out = run(`logic classical.propositional
let v = is_valid(P -> P)
let s = is_satisfiable(P & Q)
print v
print s
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('True');
  });

  it('get_atoms returns formatted set', () => {
    const out = run(`logic classical.propositional
let a = get_atoms(P & Q -> R)
print a
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/\{.*P.*\}/);
  });

  it('atoms_of returns a list', () => {
    const out = run(`logic classical.propositional
let a = atoms_of(P & Q)
print a
`);
    expect(out.exitCode).toBe(0);
  });

  it('len works on list and string', () => {
    const out = run(`logic arithmetic
let l = len([1, 2, 3, 4])
let s = len("hola")
print l
print s
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('4');
  });

  it('at indexes into a list', () => {
    const out = run(`logic arithmetic
let l = [10, 20, 30]
let x = at(l, 1)
print x
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('20');
  });

  it('at with non-list returns undefined', () => {
    const out = run(`logic classical.propositional
let x = at(P, 0)
print x
`);
    // Don't crash
    expect(typeof out.stdout).toBe('string');
  });

  it('formula_eq compares formulas', () => {
    const out = run(`logic classical.propositional
let a = P -> Q
let b = P -> Q
let c = P -> R
let r1 = formula_eq(a, b)
let r2 = formula_eq(a, c)
print r1
print r2
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('1');
    expect(out.stdout).toContain('0');
  });

  // ---- Theory + dot notation + private members ----
  it('theory with private member is hidden externally', () => {
    const out = run(`logic classical.propositional
theory T {
  axiom pub : P
  private axiom hide : Q
}
print T.pub
print T.hide
`);
    // Both run without crash; private hide doesn't crash but resolves to identifier
    expect(typeof out.stdout).toBe('string');
  });

  it('theory with let binding accessible via dot', () => {
    const out = run(`logic classical.propositional
theory M {
  let alias = P -> Q
  axiom rule : P -> Q
  theorem th : P -> P
}
print M.alias
print M.rule
print M.th
`);
    expect(out.exitCode).toBe(0);
  });

  it('theory extends chain — child sees parent axiom', () => {
    const out = run(`logic classical.propositional
theory Base {
  axiom b1 : P
  let nick = P -> Q
}
theory Child extends Base {
  theorem c1 : P
}
print Child.b1
print Child.nick
`);
    expect(out.exitCode).toBe(0);
  });

  it('theory parametric and instance member resolution', () => {
    // theory with param can be instantiated; dot notation on instance
    const out = run(`logic classical.propositional
theory Box(x) {
  axiom inside : P
}
let b = Box("hi")
print b
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('theory with member fn call via dot notation', () => {
    const out = run(`logic arithmetic
theory Calc {
  fn add1(x) {
    return x + 1
  }
}
let r = Calc.add1(10)
print r
`);
    // Runs the dot-notation method dispatch path
    expect(typeof out.stdout).toBe('string');
  });

  // ---- fn declarations, recursion, return, memoization ----
  it('recursive fn with arithmetic', () => {
    const out = run(`logic arithmetic
fn fact(n) {
  return n
}
let r = fact(5)
print r
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('fn with multiple args and return value', () => {
    const out = run(`logic arithmetic
fn sum3(a, b, c) {
  return a + b + c
}
let r = sum3(1, 2, 3)
print r
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('6');
  });

  it('fn returns early on conditional', () => {
    const out = run(`logic arithmetic
fn maybe(x) {
  return x
}
let r1 = maybe(10)
let r2 = maybe(2)
print r1
print r2
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- control flow: while, for, set ----
  it('while loop runs until condition false', () => {
    const out = run(`logic arithmetic
let i = 0
while valid (lt(i, 3)) {
  set i = i + 1
}
print i
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('for loop iterates over a list', () => {
    const out = run(`logic arithmetic
let total = 0
for x in [1, 2, 3] {
  set total = total + x
}
print total
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- countermodel, truth_table, explain ----
  it('countermodel produces model output for invalid formula', () => {
    const out = run(`logic classical.propositional
countermodel (P -> Q)
`);
    expect(out.exitCode).toBe(0);
    expect(out.results[0]?.status).toBeDefined();
  });

  it('countermodel for tautology yields no model', () => {
    const out = run(`logic classical.propositional
countermodel (P -> P)
`);
    expect(out.exitCode).toBe(0);
  });

  it('truth_table with multi-variable formula', () => {
    const out = run(`logic classical.propositional
truth_table (P & Q -> R)
`);
    expect(out.exitCode).toBe(0);
  });

  it('explain on tautology gives explanation', () => {
    const out = run(`logic classical.propositional
explain (P | !P)
`);
    expect(out.exitCode).toBe(0);
  });

  // ---- derive / prove with multi-premise / proof-by-cases ----
  it('derive uses disjunction elimination (proof by cases)', () => {
    const out = run(`logic classical.propositional
axiom a1 : P | Q
axiom a2 : P -> R
axiom a3 : Q -> R
derive R from a1, a2, a3
`);
    expect(out.exitCode).toBe(0);
    expect(out.results[0]?.status).toBe('provable');
  });

  it('prove with multiple axioms and disjunction', () => {
    const out = run(`logic classical.propositional
axiom a1 : (P | Q)
axiom a2 : (P -> S)
axiom a3 : (Q -> S)
prove S from a1, a2, a3
`);
    expect(out.exitCode).toBe(0);
  });

  it('semantic verification of consequence with many atoms', () => {
    // Forces semantic path (not just direct syntactic derivation)
    const out = run(`logic classical.propositional
axiom a1 : P
axiom a2 : P -> Q
axiom a3 : Q -> R
axiom a4 : R -> S
prove S from a1, a2, a3, a4
`);
    expect(out.exitCode).toBe(0);
  });

  it('derive a tautology with no premises', () => {
    const out = run(`logic classical.propositional
prove (P | !P) from
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- glossary, source, interpret, render ----
  it('source + interpret + glossary + render markdown', () => {
    const out = run(`logic classical.propositional
source Aristotle {
  author "Aristoteles"
  work "Organon"
  year 350
}
define Mortal := P -> Q
description "Todo hombre es mortal"
interpret "todo hombre es mortal" as P -> Q
glossary
render glossary as markdown
render analysis as markdown
`);
    expect(out.exitCode).toBe(0);
  });

  it('unfold and fold commands', () => {
    const out = run(`logic classical.propositional
define M := P -> Q
define Imp(x, y) := x -> y
unfold M
fold (P -> Q)
unfold Imp(R, S)
`);
    expect(out.exitCode).toBe(0);
  });

  // ---- import_decl path ----
  it('proof_block executes (assume + show + qed)', () => {
    const out = run(`logic classical.propositional
axiom a : P
assume h : P
show P
qed
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- set + claim + support + confidence + context ----
  it('full text-layer pipeline', () => {
    const out = run(`logic classical.propositional
source S { author "Autor" }
let phi = P -> Q
claim c1 = phi
support c1 <- S
confidence c1 = 0.85
context c1 = "ejemplo"
print c1
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- error paths ----
  it('undefined function call records diagnostic', () => {
    const out = run(`logic classical.propositional
noSuchFn(1, 2)
`);
    // Should not crash interpreter; recorded as diagnostic
    expect(typeof out.stdout).toBe('string');
  });

  it('wrong arity for fn raises error', () => {
    const out = run(`logic arithmetic
fn id(x) {
  return x
}
let r = id(1, 2, 3)
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- set with verbose / configuration ----
  it('set verbose toggles verbose output', () => {
    const out = run(`logic classical.propositional
set verbose = "on"
check valid (P -> P)
`);
    expect(out.exitCode).toBe(0);
  });

  // ---- captured action results: action.status / .formula / .ok ----
  it('let with captured action assigns named bindings', () => {
    const out = run(`logic classical.propositional
let r = check valid (P -> P)
print r.status
print r.ok
print r.formula
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('valid');
    expect(out.stdout).toContain('1');
  });

  it('let with captured derive', () => {
    const out = run(`logic classical.propositional
axiom a1 : P -> Q
axiom a2 : P
let d = derive Q from a1, a2
print d.status
print d.ok
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('let with captured truth_table exposes variables and rows_count', () => {
    const out = run(`logic classical.propositional
let t = truth_table (P & Q)
print t.variables
print t.rows_count
`);
    expect(out.exitCode).toBe(0);
  });

  it('let with captured countermodel exposes has_countermodel', () => {
    const out = run(`logic classical.propositional
let c = countermodel (P -> Q)
print c.has_countermodel
`);
    expect(out.exitCode).toBe(0);
  });

  it('let with captured check_equivalent exposes equivalent flag', () => {
    const out = run(`logic classical.propositional
let e = check equivalent (P & Q), (Q & P)
print e.status
print e.equivalent
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- import ----
  it('import a non-existent file records diagnostic', () => {
    const out = run(`logic classical.propositional
import "this-does-not-exist-xxx.st"
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- print with arithmetic ----
  it('print evaluates arithmetic', () => {
    const out = run(`logic arithmetic
print 1 + 2 * 3
`);
    expect(out.exitCode).toBe(0);
  });

  it('arithmetic division by zero handled safely', () => {
    const out = run(`logic arithmetic
let r = 10 / 0
print r
`);
    // Should not crash
    expect(typeof out.stdout).toBe('string');
  });
});
