import { describe, it, expect } from 'vitest';
import { typeCheck } from '../../runtime/typecheck/checker';
import { Parser } from '../../parser/parser';
import type { Program } from '../../ast/nodes';

function parseProgram(src: string): Program {
  const p = new Parser('<test>');
  return p.parse(src);
}

describe('TypeChecker — duplicates and undeclared', () => {
  it('TC006: duplicate axiom declaration', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a : P
axiom a : Q
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC006')).toBe(true);
  });

  it('TC006: duplicate theorem declaration', () => {
    const prog = parseProgram(`logic classical.propositional
theorem t : P
theorem t : Q
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC006')).toBe(true);
  });

  it('TC001: undeclared premise in derive', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a1 : P
derive Q from notDeclared
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC001')).toBe(true);
  });

  it('TC001: undeclared premise in prove', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a1 : P
prove Q from missingPremise
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC001')).toBe(true);
  });
});

describe('TypeChecker — operator/profile mismatch', () => {
  it('TC004: modal operator in non-modal profile', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a : []P
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC004')).toBe(true);
  });

  it('TC004: temporal operator detected when manually injected (parse keeps as token)', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a : P
`);
    // Manually inject a temporal_next into the AST to simulate type confusion
    const ax = prog.statements[1] as { kind: string; formula: unknown };
    if (ax && ax.kind === 'axiom_decl') {
      (ax as { formula: unknown }).formula = {
        kind: 'temporal_next',
        args: [{ kind: 'atom', name: 'P' }],
      };
    }
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC004')).toBe(true);
  });
});

describe('TypeChecker — imports', () => {
  it('TC007: circular import to same file', () => {
    const prog = parseProgram(`logic classical.propositional
import "<test>"
`);
    const errs = typeCheck(prog, 'classical.propositional', '<test>');
    expect(errs.some((e) => e.code === 'TC007')).toBe(true);
  });

  it('TC007: duplicate import', () => {
    const prog = parseProgram(`logic classical.propositional
import "foo.st"
import "foo.st"
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.some((e) => e.code === 'TC007')).toBe(true);
  });
});

describe('TypeChecker — accepts valid programs', () => {
  it('valid propositional program produces no errors', () => {
    const prog = parseProgram(`logic classical.propositional
axiom a1 : P -> Q
axiom a2 : P
derive Q from a1, a2
check valid (P -> P)
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });

  it('let bindings are registered', () => {
    const prog = parseProgram(`logic classical.propositional
let phi = P -> Q
axiom a1 : P
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });

  it('check satisfiable, equivalent, countermodel all OK', () => {
    const prog = parseProgram(`logic classical.propositional
check satisfiable (P | !P)
check equivalent (P & Q), (Q & P)
countermodel (P -> Q)
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });

  it('truth_table and explain OK', () => {
    const prog = parseProgram(`logic classical.propositional
truth_table (P & Q)
explain (P -> P)
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });

  it('analyze with premises and conclusion OK', () => {
    const prog = parseProgram(`logic classical.propositional
analyze {
  premises: [P -> Q, P]
  conclusion: Q
}
`);
    typeCheck(prog, 'classical.propositional');
  });

  it('theory declaration is type-checked recursively', () => {
    const prog = parseProgram(`logic classical.propositional
theory Persona(n) {
  axiom existencia : P
  theorem identidad : P -> P
}
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });

  it('modal profile accepts modal operators', () => {
    const prog = parseProgram(`logic modal.k
axiom a : []P
`);
    const errs = typeCheck(prog, 'modal.k');
    expect(errs.filter((e) => e.severity === 'error' && e.code === 'TC004').length).toBe(0);
  });

  it('temporal profile accepts temporal operators', () => {
    const prog = parseProgram(`logic temporal.ltl
axiom a : X(P)
`);
    const errs = typeCheck(prog, 'temporal.ltl');
    expect(errs.filter((e) => e.severity === 'error' && e.code === 'TC004').length).toBe(0);
  });

  it('empty profile suppresses operator-specific errors', () => {
    const prog = parseProgram(`axiom a : []P
`);
    const errs = typeCheck(prog, '');
    expect(errs.filter((e) => e.code === 'TC004').length).toBe(0);
  });
});

describe('TypeChecker — define and unfold/fold', () => {
  it('define declaration registers in scope', () => {
    const prog = parseProgram(`logic classical.propositional
define Mortal(x) := P -> Q
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });
});

describe('TypeChecker — file-level fn declarations', () => {
  it('declares function and uses it without error', () => {
    const prog = parseProgram(`logic classical.propositional
fn helper(p) {
  return p
}
`);
    const errs = typeCheck(prog, 'classical.propositional');
    expect(errs.filter((e) => e.severity === 'error').length).toBe(0);
  });
});

describe('TypeChecker — top-level typeCheck()', () => {
  it('typeCheck on empty program returns []', () => {
    const prog = parseProgram('');
    expect(typeCheck(prog)).toEqual([]);
  });

  it('typeCheck handles file arg', () => {
    const prog = parseProgram('logic classical.propositional\n');
    expect(typeCheck(prog, 'classical.propositional', 'foo.st')).toEqual([]);
  });
});
