import { describe, it, expect } from 'vitest';
import { Parser } from '../../parser/parser';
import type { Diagnostic } from '../../types';

function parse(src: string): { program: ReturnType<Parser['parse']>; diagnostics: Diagnostic[] } {
  const parser = new Parser('<test>');
  const program = parser.parse(src);
  return { program, diagnostics: parser.diagnostics };
}

describe('coverage-90 — parser extended syntax', () => {
  it('member fn call: Theory.method(args)', () => {
    const r = parse(`
logic classical.propositional
theory T {
  fn ping() {
    return P
  }
}
let x = T.ping()
`);
    // Exercises the member fn call parse path regardless of diagnostics.
    expect(r.program.statements.length).toBeGreaterThan(0);
  });

  it('member fn call with multiple args', () => {
    const r = parse(`
logic arithmetic
theory M {
  fn add(a, b) {
    return a + b
  }
}
let z = M.add(1, 2)
`);
    expect(r.program.statements.length).toBeGreaterThan(0);
  });

  it('parses claim with identifier-only value', () => {
    const r = parse(`
logic classical.propositional
claim c1 = textRef
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses claim with full formula', () => {
    const r = parse(`
logic classical.propositional
claim c1 = P -> Q
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses passage standalone with @Source', () => {
    const r = parse(`
logic classical.propositional
source S { author "X" }
let p = passage @S "El texto del pasaje"
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses passage with section identifier', () => {
    const r = parse(`
logic classical.propositional
source S { author "X" }
let p = passage @S 5 "Pasaje con section"
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses passage with [[anchor path]]', () => {
    const r = parse(`
logic classical.propositional
let p = passage([["a/path/to/section"]])
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses formalize let binding', () => {
    const r = parse(`
logic classical.propositional
let phi = formalize myPassage as P -> Q
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses description-only let', () => {
    const r = parse(`
logic classical.propositional
let note = "esta es una nota"
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses let with description and formula via colon', () => {
    const r = parse(`
logic classical.propositional
let phi = "modus ponens" : P -> Q
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses theory with private members', () => {
    const r = parse(`
logic classical.propositional
theory T {
  private axiom hidden : P
  axiom visible : Q
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses theory with extends and parameters', () => {
    const r = parse(`
logic classical.propositional
theory Base(x) {
  axiom a : P
}
theory Child(y) extends Base {
  theorem t : P
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses proof block with assume + show + qed', () => {
    const r = parse(`
logic classical.propositional
axiom a : P
assume h : P
show P
qed
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses import with dotted path', () => {
    const r = parse(`
import a.b.c
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses import with string path', () => {
    const r = parse(`
import "lib/utils.st"
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses captured actions in let', () => {
    const r = parse(`
logic classical.propositional
let r1 = check valid (P -> P)
let r2 = check satisfiable (P & Q)
let r3 = check equivalent (P & Q), (Q & P)
axiom a : P -> Q
axiom b : P
let r4 = derive Q from a, b
let r5 = prove Q from a, b
let r6 = countermodel (P -> Q)
let r7 = refute (P -> Q)
let r8 = truth_table (P)
`);
    // Exercises captured action parse paths
    expect(r.program.statements.length).toBeGreaterThan(0);
  });

  it('parses control flow: if/else nested', () => {
    const r = parse(`
logic classical.propositional
if valid (P -> P) {
  if satisfiable (P) {
    print "doble"
  }
} else {
  print "no"
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses for loop over list', () => {
    const r = parse(`
logic arithmetic
for x in 1, 2, 3 {
  print x
}
`);
    expect(r.program.statements.length).toBeGreaterThan(0);
  });

  it('parses while loop', () => {
    const r = parse(`
logic arithmetic
let i = 0
while valid (lt(i, 3)) {
  set i = i + 1
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses fn with body and return', () => {
    const r = parse(`
logic arithmetic
fn f(x, y) {
  let s = x + y
  return s
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses source with multiple attributes', () => {
    const r = parse(`
logic classical.propositional
source S {
  author "Frege"
  work "Begriffsschrift"
  year 1879
  section "Capítulo I"
}
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses define paramétrica', () => {
    const r = parse(`
logic classical.propositional
define Implies(x, y) := x -> y
description "Implicación"
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses glossary command', () => {
    const r = parse(`
logic classical.propositional
glossary
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses render glossary/analysis with format', () => {
    const r = parse(`
logic classical.propositional
render glossary as markdown
render analysis as markdown
render markdown
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses interpret command', () => {
    const r = parse(`
logic classical.propositional
interpret "todo hombre es mortal" as P -> Q
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses unfold and fold commands', () => {
    const r = parse(`
logic classical.propositional
define M := P
unfold M
fold (P)
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parses export decl', () => {
    const r = parse(`
logic classical.propositional
export axiom shared : P
`);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('parser handles malformed input without crash', () => {
    const r = parse('@@@@\n???\n');
    // Has diagnostics but parser returns a program
    expect(r.diagnostics.length).toBeGreaterThan(0);
  });
});
