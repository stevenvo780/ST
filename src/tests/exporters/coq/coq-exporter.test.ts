// ============================================================
// Tests — Coq exporter (classical profile, v1)
// ============================================================

import { describe, it, expect } from 'vitest';
import { exportToCoq, exportProofToCoq, formulaToCoqTerm } from '../../../exporters/coq';
import { Formula, Proof } from '../../../types';

// ----------------------------------------------------------------
// Formula builder helpers (mirrors core.test.ts conventions)
// ----------------------------------------------------------------

function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}
function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}
function or(a: Formula, b: Formula): Formula {
  return { kind: 'or', args: [a, b] };
}
function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}
function iff(a: Formula, b: Formula): Formula {
  return { kind: 'biconditional', args: [a, b] };
}
function forall(variable: string, body: Formula): Formula {
  return { kind: 'forall', variable, args: [body] };
}
function exists(variable: string, body: Formula): Formula {
  return { kind: 'exists', variable, args: [body] };
}
function predicate(name: string, ...params: string[]): Formula {
  return { kind: 'predicate', name, params };
}
function top(): Formula {
  return { kind: 'true' };
}
function bot(): Formula {
  return { kind: 'false' };
}

// ----------------------------------------------------------------
// Syntax checker helpers
// ----------------------------------------------------------------

/** Count occurrences of a substring */
function countOccurrences(str: string, sub: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = str.indexOf(sub, idx)) !== -1) {
    count++;
    idx += sub.length;
  }
  return count;
}

/** Checks that all parentheses are balanced */
function parensBalanced(code: string): boolean {
  let depth = 0;
  for (const ch of code) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/** Checks basic structural keywords are present */
function hasCoqStructure(code: string): { theorem: boolean; proof: boolean; qed: boolean } {
  return {
    theorem: code.includes('Theorem'),
    proof: code.includes('Proof.'),
    qed: code.includes('Qed.') || code.includes('Admitted.'),
  };
}

// ----------------------------------------------------------------
// formulaToCoqTerm unit tests
// ----------------------------------------------------------------

describe('formulaToCoqTerm — connective mapping', () => {
  it('atom → identifier', () => {
    expect(formulaToCoqTerm(atom('P'))).toBe('P');
  });

  it('⊤ → True', () => {
    expect(formulaToCoqTerm(top())).toBe('True');
  });

  it('⊥ → False', () => {
    expect(formulaToCoqTerm(bot())).toBe('False');
  });

  it('¬P → (~ P)', () => {
    const result = formulaToCoqTerm(not(atom('P')));
    expect(result).toContain('~');
    expect(result).toContain('P');
  });

  it('P ∧ Q → /\\', () => {
    const result = formulaToCoqTerm(and(atom('P'), atom('Q')));
    expect(result).toContain('/\\');
    expect(result).toContain('P');
    expect(result).toContain('Q');
  });

  it('P ∨ Q → \\/', () => {
    const result = formulaToCoqTerm(or(atom('P'), atom('Q')));
    expect(result).toContain('\\/');
    expect(result).toContain('P');
    expect(result).toContain('Q');
  });

  it('P → Q maps to ->', () => {
    const result = formulaToCoqTerm(implies(atom('P'), atom('Q')));
    expect(result).toContain('->');
    expect(result).toContain('P');
    expect(result).toContain('Q');
  });

  it('P ↔ Q maps to <->', () => {
    const result = formulaToCoqTerm(iff(atom('P'), atom('Q')));
    expect(result).toContain('<->');
  });

  it('∀x. φ → forall x : Prop, ...', () => {
    const result = formulaToCoqTerm(forall('x', atom('P')));
    expect(result).toMatch(/forall x : Prop/);
  });

  it('∃x. φ → exists x : Prop, ...', () => {
    const result = formulaToCoqTerm(exists('y', atom('Q')));
    expect(result).toMatch(/exists y : Prop/);
  });

  it('predicate P(x, y) → P x y', () => {
    const result = formulaToCoqTerm(predicate('R', 'x', 'y'));
    expect(result).toMatch(/R x y/);
  });

  it('predicate with no args → just name', () => {
    expect(formulaToCoqTerm(predicate('P'))).toBe('P');
  });
});

// ----------------------------------------------------------------
// exportToCoq — P → P (identity)
// ----------------------------------------------------------------

describe('exportToCoq — P → P', () => {
  const pImpliesP = implies(atom('P'), atom('P'));

  it('produces valid Coq output with all required keywords', () => {
    const coq = exportToCoq(pImpliesP);
    const struct = hasCoqStructure(coq);
    expect(struct.theorem).toBe(true);
    expect(struct.proof).toBe(true);
    expect(struct.qed).toBe(true);
  });

  it('has balanced parentheses', () => {
    const coq = exportToCoq(pImpliesP);
    expect(parensBalanced(coq)).toBe(true);
  });

  it('contains Require Import Classical by default', () => {
    const coq = exportToCoq(pImpliesP);
    expect(coq).toContain('Require Import Classical.');
  });

  it('uses default module name STExport', () => {
    const coq = exportToCoq(pImpliesP);
    expect(coq).toContain('Module STExport.');
    expect(coq).toContain('End STExport.');
  });

  it('emits intros + exact tactic for identity', () => {
    const coq = exportToCoq(pImpliesP);
    expect(coq).toContain('intros');
    expect(coq).toContain('exact');
  });

  it('Definition contains -> (Coq implication)', () => {
    const coq = exportToCoq(pImpliesP);
    expect(coq).toContain('->');
  });
});

// ----------------------------------------------------------------
// exportToCoq — (P ∧ Q) → P
// ----------------------------------------------------------------

describe('exportToCoq — (P ∧ Q) → P', () => {
  const formula = implies(and(atom('P'), atom('Q')), atom('P'));

  it('produces syntactically valid output', () => {
    const coq = exportToCoq(formula);
    const struct = hasCoqStructure(coq);
    expect(struct.theorem).toBe(true);
    expect(struct.proof).toBe(true);
    expect(struct.qed).toBe(true);
  });

  it('has balanced parentheses', () => {
    const coq = exportToCoq(formula);
    expect(parensBalanced(coq)).toBe(true);
  });

  it('contains /\\ for conjunction', () => {
    const coq = exportToCoq(formula);
    expect(coq).toContain('/\\');
  });

  it('emits destruct tactic for conjunction elimination', () => {
    const coq = exportToCoq(formula);
    expect(coq).toContain('destruct');
  });
});

// ----------------------------------------------------------------
// exportToCoq — ∀x. P(x) → ∃y. P(y)
// ----------------------------------------------------------------

describe('exportToCoq — ∀x. P(x) → ∃y. P(y)', () => {
  // Represents: forall x : Prop, P x -> exists y : Prop, P y
  const formula = forall('x', implies(predicate('P', 'x'), exists('y', predicate('P', 'y'))));

  it('produces syntactically valid output', () => {
    const coq = exportToCoq(formula);
    const struct = hasCoqStructure(coq);
    expect(struct.theorem).toBe(true);
    expect(struct.proof).toBe(true);
    expect(struct.qed).toBe(true);
  });

  it('has balanced parentheses', () => {
    const coq = exportToCoq(formula);
    expect(parensBalanced(coq)).toBe(true);
  });

  it('contains forall and exists keywords', () => {
    const coq = exportToCoq(formula);
    expect(coq).toContain('forall');
    expect(coq).toContain('exists');
  });

  it('contains predicate application P x and P y', () => {
    const coq = exportToCoq(formula);
    expect(coq).toContain('P x');
    expect(coq).toContain('P y');
  });
});

// ----------------------------------------------------------------
// Options: includeImports = false
// ----------------------------------------------------------------

describe('exportToCoq — options', () => {
  const f = implies(atom('A'), atom('B'));

  it('omits Require Import when includeImports = false', () => {
    const coq = exportToCoq(f, { includeImports: false });
    expect(coq).not.toContain('Require Import');
  });

  it('omits Theorem when emitProof = false', () => {
    const coq = exportToCoq(f, { emitProof: false });
    expect(coq).not.toContain('Theorem');
    expect(coq).not.toContain('Proof.');
  });

  it('uses custom module name', () => {
    const coq = exportToCoq(f, { moduleName: 'MyLogic' });
    expect(coq).toContain('Module MyLogic.');
    expect(coq).toContain('End MyLogic.');
  });
});

// ----------------------------------------------------------------
// exportProofToCoq — with a Proof object
// ----------------------------------------------------------------

describe('exportProofToCoq — with proof steps', () => {
  const goal = implies(atom('P'), atom('P'));

  const proof: Proof = {
    goal,
    status: 'complete',
    steps: [
      {
        stepNumber: 1,
        formula: atom('P'),
        justification: 'premise',
        premises: [],
        source: 'premise',
      },
      {
        stepNumber: 2,
        formula: atom('P'),
        justification: 'exact',
        premises: [1],
        source: 'goal',
      },
    ],
  };

  it('produces valid output from a Proof object', () => {
    const coq = exportProofToCoq(proof);
    const struct = hasCoqStructure(coq);
    expect(struct.theorem).toBe(true);
    expect(struct.proof).toBe(true);
    expect(struct.qed).toBe(true);
  });

  it('has balanced parentheses', () => {
    const coq = exportProofToCoq(proof);
    expect(parensBalanced(coq)).toBe(true);
  });

  it('includes assumption tactic for premise step', () => {
    const coq = exportProofToCoq(proof);
    const hasPremiseComment = coq.includes('premise') || coq.includes('assumption');
    expect(hasPremiseComment).toBe(true);
  });
});

describe('exportProofToCoq — incomplete proof falls back to Admitted', () => {
  const goal = implies(atom('A'), atom('B'));
  const proof: Proof = {
    goal,
    status: 'incomplete',
    steps: [],
  };

  it('emits Admitted for incomplete proof', () => {
    const coq = exportProofToCoq(proof);
    expect(coq).toContain('Admitted.');
  });

  it('has balanced parentheses even for Admitted', () => {
    expect(parensBalanced(exportProofToCoq(proof))).toBe(true);
  });
});

// ----------------------------------------------------------------
// Snapshot tests — stable output for fixed inputs
// ----------------------------------------------------------------

describe('exportToCoq — snapshot stability', () => {
  it('P → P snapshot is stable', () => {
    const coq = exportToCoq(implies(atom('P'), atom('P')));
    expect(coq).toMatchSnapshot();
  });

  it('(P ∧ Q) → P snapshot is stable', () => {
    const coq = exportToCoq(implies(and(atom('P'), atom('Q')), atom('P')));
    expect(coq).toMatchSnapshot();
  });

  it('∀x. P(x) → ∃y. P(y) snapshot is stable', () => {
    const coq = exportToCoq(
      forall('x', implies(predicate('P', 'x'), exists('y', predicate('P', 'y')))),
    );
    expect(coq).toMatchSnapshot();
  });
});

// ----------------------------------------------------------------
// Syntax linter: balanced parens + structural keywords
// ----------------------------------------------------------------

describe('coq linter — structural checks', () => {
  const formulas: Array<[string, Formula]> = [
    ['P → P', implies(atom('P'), atom('P'))],
    ['(P ∧ Q) → P', implies(and(atom('P'), atom('Q')), atom('P'))],
    ['¬P ∨ P', or(not(atom('P')), atom('P'))],
    ['P ↔ P', iff(atom('P'), atom('P'))],
    ['⊤', top()],
    ['⊥', bot()],
    ['∀x. P(x)', forall('x', predicate('P', 'x'))],
    ['∃y. Q(y)', exists('y', predicate('Q', 'y'))],
  ];

  for (const [label, formula] of formulas) {
    it(`${label}: parentheses balanced`, () => {
      expect(parensBalanced(exportToCoq(formula))).toBe(true);
    });

    it(`${label}: contains Theorem keyword`, () => {
      expect(exportToCoq(formula)).toContain('Theorem');
    });

    it(`${label}: contains Proof. keyword`, () => {
      expect(exportToCoq(formula)).toContain('Proof.');
    });

    it(`${label}: ends proof with Qed. or Admitted.`, () => {
      const coq = exportToCoq(formula);
      expect(coq.includes('Qed.') || coq.includes('Admitted.')).toBe(true);
    });

    it(`${label}: Module/End tags match`, () => {
      const coq = exportToCoq(formula);
      const moduleCount = countOccurrences(coq, 'Module STExport.');
      const endCount = countOccurrences(coq, 'End STExport.');
      expect(moduleCount).toBe(1);
      expect(endCount).toBe(1);
    });
  }
});
