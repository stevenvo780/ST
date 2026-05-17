// ============================================================
// Tests — Lean 4 exporter (classical profile)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  exportToLean4,
  exportProofToLean4,
  exportTheoryToLean4,
  formulaToLeanTerm,
  leanTacticForRule,
  LEAN4_OPS,
  COMMON_IMPORTS,
} from '../../../../tooling/exporters/lean4';
import { Formula, Proof } from '../../../../types';

// ----------------------------------------------------------------
// Formula builder helpers (mirrors coq-exporter.test.ts)
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

function countOccurrences(str: string, sub: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = str.indexOf(sub, idx)) !== -1) {
    count++;
    idx += sub.length;
  }
  return count;
}

function parensBalanced(code: string): boolean {
  let depth = 0;
  for (const ch of code) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function angleBracketsBalanced(code: string): boolean {
  const opens = countOccurrences(code, '⟨');
  const closes = countOccurrences(code, '⟩');
  return opens === closes;
}

function hasLeanStructure(code: string): {
  namespaceOpen: boolean;
  namespaceClose: boolean;
  theorem: boolean;
  byBlock: boolean;
} {
  return {
    namespaceOpen: /^namespace\s+\w+/m.test(code),
    namespaceClose: /^end\s+\w+/m.test(code),
    theorem: code.includes('theorem'),
    byBlock: code.includes(':= by'),
  };
}

// ----------------------------------------------------------------
// LEAN4_OPS map
// ----------------------------------------------------------------

describe('LEAN4_OPS — Unicode operator mapping', () => {
  it('maps and → ∧', () => {
    expect(LEAN4_OPS.get('and')).toBe('∧');
  });

  it('maps or → ∨', () => {
    expect(LEAN4_OPS.get('or')).toBe('∨');
  });

  it('maps implies → →', () => {
    expect(LEAN4_OPS.get('implies')).toBe('→');
  });

  it('maps not → ¬', () => {
    expect(LEAN4_OPS.get('not')).toBe('¬');
  });

  it('maps biconditional → ↔', () => {
    expect(LEAN4_OPS.get('biconditional')).toBe('↔');
  });

  it('maps forall → ∀ and exists → ∃', () => {
    expect(LEAN4_OPS.get('forall')).toBe('∀');
    expect(LEAN4_OPS.get('exists')).toBe('∃');
  });
});

// ----------------------------------------------------------------
// formulaToLeanTerm unit tests
// ----------------------------------------------------------------

describe('formulaToLeanTerm — connective mapping', () => {
  it('atom → identifier', () => {
    expect(formulaToLeanTerm(atom('P'))).toBe('P');
  });

  it('⊤ → True', () => {
    expect(formulaToLeanTerm(top())).toBe('True');
  });

  it('⊥ → False', () => {
    expect(formulaToLeanTerm(bot())).toBe('False');
  });

  it('¬P contains ¬ glyph', () => {
    const result = formulaToLeanTerm(not(atom('P')));
    expect(result).toContain('¬');
    expect(result).toContain('P');
  });

  it('P ∧ Q uses ∧ glyph (not /\\)', () => {
    const result = formulaToLeanTerm(and(atom('P'), atom('Q')));
    expect(result).toContain('∧');
    expect(result).not.toContain('/\\');
  });

  it('P ∨ Q uses ∨ glyph (not \\/)', () => {
    const result = formulaToLeanTerm(or(atom('P'), atom('Q')));
    expect(result).toContain('∨');
    expect(result).not.toContain('\\/');
  });

  it('P → Q uses → glyph (not ->)', () => {
    const result = formulaToLeanTerm(implies(atom('P'), atom('Q')));
    expect(result).toContain('→');
    expect(result).not.toContain('->');
  });

  it('P ↔ Q uses ↔ glyph', () => {
    const result = formulaToLeanTerm(iff(atom('P'), atom('Q')));
    expect(result).toContain('↔');
  });

  it('∀x. φ uses ∀ + Prop binding', () => {
    const result = formulaToLeanTerm(forall('x', atom('P')));
    expect(result).toMatch(/∀ x : Prop/);
  });

  it('∃y. φ uses ∃ + Prop binding', () => {
    const result = formulaToLeanTerm(exists('y', atom('Q')));
    expect(result).toMatch(/∃ y : Prop/);
  });

  it('predicate P(x, y) → P x y', () => {
    const result = formulaToLeanTerm(predicate('R', 'x', 'y'));
    expect(result).toMatch(/R x y/);
  });

  it('predicate with no args → just name', () => {
    expect(formulaToLeanTerm(predicate('P'))).toBe('P');
  });
});

// ----------------------------------------------------------------
// exportToLean4 — P → P (identity)
// ----------------------------------------------------------------

describe('exportToLean4 — P → P', () => {
  const pImpliesP = implies(atom('P'), atom('P'));

  it('produces valid Lean 4 output with namespace + theorem + by', () => {
    const lean = exportToLean4(pImpliesP);
    const struct = hasLeanStructure(lean);
    expect(struct.namespaceOpen).toBe(true);
    expect(struct.namespaceClose).toBe(true);
    expect(struct.theorem).toBe(true);
    expect(struct.byBlock).toBe(true);
  });

  it('has balanced parentheses and ⟨⟩ brackets', () => {
    const lean = exportToLean4(pImpliesP);
    expect(parensBalanced(lean)).toBe(true);
    expect(angleBracketsBalanced(lean)).toBe(true);
  });

  it('imports Mathlib.Tactic by default', () => {
    const lean = exportToLean4(pImpliesP);
    expect(lean).toContain('import Mathlib.Tactic');
  });

  it('uses default namespace STExport', () => {
    const lean = exportToLean4(pImpliesP);
    expect(lean).toContain('namespace STExport');
    expect(lean).toContain('end STExport');
  });

  it('emits intro + exact tactics for identity', () => {
    const lean = exportToLean4(pImpliesP);
    expect(lean).toMatch(/intro\s+h/);
    expect(lean).toMatch(/exact\s+h/);
  });

  it('definition contains → glyph (Lean implication)', () => {
    const lean = exportToLean4(pImpliesP);
    expect(lean).toContain('→');
  });

  it('uses := for the def assignment', () => {
    const lean = exportToLean4(pImpliesP);
    expect(lean).toMatch(/def stmt : Prop :=/);
  });
});

// ----------------------------------------------------------------
// exportToLean4 — (P ∧ Q) → P
// ----------------------------------------------------------------

describe('exportToLean4 — (P ∧ Q) → P', () => {
  const formula = implies(and(atom('P'), atom('Q')), atom('P'));

  it('produces syntactically valid output', () => {
    const lean = exportToLean4(formula);
    const struct = hasLeanStructure(lean);
    expect(struct.theorem).toBe(true);
    expect(struct.byBlock).toBe(true);
  });

  it('has balanced parentheses', () => {
    expect(parensBalanced(exportToLean4(formula))).toBe(true);
  });

  it('contains ∧ for conjunction', () => {
    expect(exportToLean4(formula)).toContain('∧');
  });

  it('emits .left projection or And.left for conjunction elim', () => {
    const lean = exportToLean4(formula);
    expect(lean.includes('.left') || lean.includes('And.left')).toBe(true);
  });
});

// ----------------------------------------------------------------
// exportToLean4 — ∀x. P(x) → ∃y. P(y)
// ----------------------------------------------------------------

describe('exportToLean4 — ∀x. P(x) → ∃y. P(y)', () => {
  const formula = forall('x', implies(predicate('P', 'x'), exists('y', predicate('P', 'y'))));

  it('produces syntactically valid output', () => {
    const lean = exportToLean4(formula);
    const struct = hasLeanStructure(lean);
    expect(struct.theorem).toBe(true);
    expect(struct.byBlock).toBe(true);
  });

  it('has balanced parens and ⟨⟩ brackets', () => {
    const lean = exportToLean4(formula);
    expect(parensBalanced(lean)).toBe(true);
    expect(angleBracketsBalanced(lean)).toBe(true);
  });

  it('contains ∀ and ∃ glyphs', () => {
    const lean = exportToLean4(formula);
    expect(lean).toContain('∀');
    expect(lean).toContain('∃');
  });

  it('contains predicate applications P x and P y', () => {
    const lean = exportToLean4(formula);
    expect(lean).toContain('P x');
    expect(lean).toContain('P y');
  });

  it('uses anonymous constructor ⟨...⟩ for the existential witness', () => {
    const lean = exportToLean4(formula);
    expect(lean).toContain('⟨');
    expect(lean).toContain('⟩');
  });
});

// ----------------------------------------------------------------
// exportToLean4 — LEM (P ∨ ¬P) uses Classical.em
// ----------------------------------------------------------------

describe('exportToLean4 — LEM gets Classical.em', () => {
  it('P ∨ ¬P emits Classical.em', () => {
    const lem = or(atom('P'), not(atom('P')));
    const lean = exportToLean4(lem);
    expect(lean).toContain('Classical.em');
  });

  it('¬P ∨ P also handled via Classical.em', () => {
    const lem = or(not(atom('P')), atom('P'));
    const lean = exportToLean4(lem);
    expect(lean).toContain('Classical.em');
  });
});

// ----------------------------------------------------------------
// Options
// ----------------------------------------------------------------

describe('exportToLean4 — options', () => {
  const f = implies(atom('A'), atom('B'));

  it('omits imports when imports = []', () => {
    const lean = exportToLean4(f, { imports: [] });
    expect(lean).not.toContain('import');
  });

  it('omits Mathlib when useMathlib = false', () => {
    const lean = exportToLean4(f, { useMathlib: false });
    expect(lean).not.toContain('import Mathlib');
  });

  it('honors custom imports list', () => {
    const lean = exportToLean4(f, { imports: ['Std.Tactic.Basic', 'Mathlib.Logic.Basic'] });
    expect(lean).toContain('import Std.Tactic.Basic');
    expect(lean).toContain('import Mathlib.Logic.Basic');
  });

  it('omits theorem block when emitProof = false', () => {
    const lean = exportToLean4(f, { emitProof: false });
    expect(lean).not.toContain('theorem');
    expect(lean).not.toContain(':= by');
  });

  it('uses custom namespace name', () => {
    const lean = exportToLean4(f, { moduleName: 'MyLogic' });
    expect(lean).toContain('namespace MyLogic');
    expect(lean).toContain('end MyLogic');
  });
});

// ----------------------------------------------------------------
// COMMON_IMPORTS presets
// ----------------------------------------------------------------

describe('COMMON_IMPORTS presets', () => {
  it('exposes minimal / standard / mathlib keys', () => {
    expect(COMMON_IMPORTS).toHaveProperty('minimal');
    expect(COMMON_IMPORTS).toHaveProperty('standard');
    expect(COMMON_IMPORTS).toHaveProperty('mathlib');
  });

  it('mathlib preset includes Mathlib.Tactic', () => {
    expect(COMMON_IMPORTS.mathlib).toContain('Mathlib.Tactic');
  });

  it('minimal preset is empty', () => {
    expect(COMMON_IMPORTS.minimal).toEqual([]);
  });
});

// ----------------------------------------------------------------
// leanTacticForRule unit tests
// ----------------------------------------------------------------

describe('leanTacticForRule — rule → tactic mapping', () => {
  it('modus ponens → exact application', () => {
    expect(leanTacticForRule('modus ponens')).toMatch(/exact/);
  });

  it('implies intro → intro h', () => {
    expect(leanTacticForRule('implies intro')).toMatch(/intro/);
  });

  it('and intro → constructor', () => {
    expect(leanTacticForRule('and intro')).toContain('constructor');
  });

  it('and elim → obtain ⟨...⟩', () => {
    const t = leanTacticForRule('and elim');
    expect(t).toContain('obtain');
    expect(t).toContain('⟨');
  });

  it('or intro left → left', () => {
    expect(leanTacticForRule('or intro left')).toBe('left');
  });

  it('lem → Classical.em', () => {
    expect(leanTacticForRule('lem')).toContain('Classical.em');
  });

  it('unknown rule → sorry placeholder', () => {
    expect(leanTacticForRule('zzz-not-a-rule')).toContain('sorry');
  });
});

// ----------------------------------------------------------------
// exportProofToLean4
// ----------------------------------------------------------------

describe('exportProofToLean4 — with proof steps', () => {
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
    const lean = exportProofToLean4(proof);
    const struct = hasLeanStructure(lean);
    expect(struct.theorem).toBe(true);
    expect(struct.byBlock).toBe(true);
  });

  it('has balanced parentheses', () => {
    expect(parensBalanced(exportProofToLean4(proof))).toBe(true);
  });

  it('mentions premise or assumption tactic', () => {
    const lean = exportProofToLean4(proof);
    expect(lean.toLowerCase().includes('premise') || lean.includes('assumption')).toBe(true);
  });
});

describe('exportProofToLean4 — incomplete proof falls back to sorry', () => {
  const goal = implies(atom('A'), atom('B'));
  const proof: Proof = {
    goal,
    status: 'incomplete',
    steps: [],
  };

  it('emits sorry for incomplete proof', () => {
    const lean = exportProofToLean4(proof);
    expect(lean).toContain('sorry');
  });

  it('has balanced parentheses', () => {
    expect(parensBalanced(exportProofToLean4(proof))).toBe(true);
  });
});

// ----------------------------------------------------------------
// exportTheoryToLean4
// ----------------------------------------------------------------

describe('exportTheoryToLean4 — axioms + theorems', () => {
  const axioms: Formula[] = [implies(atom('A'), atom('B'))];
  const theorems: Formula[] = [
    implies(atom('P'), atom('P')),
    implies(and(atom('X'), atom('Y')), atom('X')),
  ];

  it('emits axiom declarations', () => {
    const lean = exportTheoryToLean4(axioms, theorems);
    expect(lean).toMatch(/axiom ax_1 :/);
  });

  it('emits a stmt + proof per theorem', () => {
    const lean = exportTheoryToLean4(axioms, theorems);
    expect(lean).toMatch(/def stmt_1 : Prop :=/);
    expect(lean).toMatch(/def stmt_2 : Prop :=/);
    expect(countOccurrences(lean, 'theorem stmt_')).toBe(2);
  });

  it('respects namespace + emitProof option', () => {
    const lean = exportTheoryToLean4(axioms, theorems, { moduleName: 'Theory', emitProof: false });
    expect(lean).toContain('namespace Theory');
    expect(lean).not.toContain('theorem');
  });
});

// ----------------------------------------------------------------
// Snapshot stability
// ----------------------------------------------------------------

describe('exportToLean4 — snapshot stability', () => {
  it('P → P snapshot is stable', () => {
    const lean = exportToLean4(implies(atom('P'), atom('P')));
    expect(lean).toMatchSnapshot();
  });

  it('(P ∧ Q) → P snapshot is stable', () => {
    const lean = exportToLean4(implies(and(atom('P'), atom('Q')), atom('P')));
    expect(lean).toMatchSnapshot();
  });

  it('∀x. P(x) → ∃y. P(y) snapshot is stable', () => {
    const lean = exportToLean4(
      forall('x', implies(predicate('P', 'x'), exists('y', predicate('P', 'y')))),
    );
    expect(lean).toMatchSnapshot();
  });
});

// ----------------------------------------------------------------
// Syntax linter: balanced glyphs + structural keywords
// ----------------------------------------------------------------

describe('lean4 linter — structural checks', () => {
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
      expect(parensBalanced(exportToLean4(formula))).toBe(true);
    });

    it(`${label}: ⟨⟩ brackets balanced`, () => {
      expect(angleBracketsBalanced(exportToLean4(formula))).toBe(true);
    });

    it(`${label}: contains theorem keyword`, () => {
      expect(exportToLean4(formula)).toContain('theorem');
    });

    it(`${label}: contains := by block`, () => {
      expect(exportToLean4(formula)).toContain(':= by');
    });

    it(`${label}: namespace open/close match`, () => {
      const lean = exportToLean4(formula);
      const openCount = countOccurrences(lean, 'namespace STExport');
      const endCount = countOccurrences(lean, 'end STExport');
      expect(openCount).toBe(1);
      expect(endCount).toBe(1);
    });
  }
});
