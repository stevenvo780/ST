import { describe, it, expect } from 'vitest';
import { STANDARD_RULES } from '../../proof-systems/certificate/rules';

function check(name: string, args: string[], conclusion: string, premises: string[]): boolean {
  const fn = STANDARD_RULES.get(name);
  if (!fn) throw new Error(`Unknown rule: ${name}`);
  return fn(args, conclusion, premises);
}

describe('coverage-90 — certificate STANDARD_RULES checkers', () => {
  // ---- axiom / premise ----
  it('axiom accepts conclusion present in args', () => {
    expect(check('axiom', ['P -> Q'], 'P -> Q', [])).toBe(true);
  });
  it('axiom rejects when conclusion not in args', () => {
    expect(check('axiom', ['P'], 'Q', [])).toBe(false);
  });
  it('axiom rejects when premises present', () => {
    expect(check('axiom', ['P'], 'P', ['Q'])).toBe(false);
  });
  it('axiom rejects no args', () => {
    expect(check('axiom', [], 'P', [])).toBe(false);
  });

  // ---- assumption / hypothesis ----
  it('assumption: no premises required', () => {
    expect(check('assumption', [], 'P', [])).toBe(true);
    expect(check('hypothesis', [], 'P', [])).toBe(true);
  });
  it('assumption rejected with premises', () => {
    expect(check('assumption', [], 'P', ['Q'])).toBe(false);
  });

  // ---- reiteration / reit ----
  it('reit: single premise equal to conclusion', () => {
    expect(check('reit', [], 'P', ['P'])).toBe(true);
    expect(check('reiteration', [], '(P)', ['P'])).toBe(true);
  });
  it('reit rejects different premise', () => {
    expect(check('reit', [], 'P', ['Q'])).toBe(false);
  });
  it('reit rejects multiple premises', () => {
    expect(check('reit', [], 'P', ['P', 'Q'])).toBe(false);
  });

  // ---- modus-ponens / mp / ->E ----
  it('modus-ponens accepts A->B, A ⊢ B', () => {
    expect(check('modus-ponens', [], 'B', ['A -> B', 'A'])).toBe(true);
    expect(check('mp', [], 'Q', ['P -> Q', 'P'])).toBe(true);
    expect(check('->E', [], 'Q', ['P -> Q', 'P'])).toBe(true);
  });
  it('mp rejects wrong premises count', () => {
    expect(check('mp', [], 'Q', ['P -> Q'])).toBe(false);
  });
  it('mp rejects non-implies first premise', () => {
    expect(check('mp', [], 'Q', ['P & Q', 'P'])).toBe(false);
  });
  it('mp rejects mismatched antecedent', () => {
    expect(check('mp', [], 'Q', ['P -> Q', 'R'])).toBe(false);
  });

  // ---- modus-tollens ----
  it('modus-tollens accepts A->B, ¬B ⊢ ¬A', () => {
    expect(check('modus-tollens', [], '¬A', ['A -> B', '¬B'])).toBe(true);
    expect(check('modus-tollens', [], '~P', ['P -> Q', '~Q'])).toBe(true);
  });
  it('modus-tollens rejects when negation pattern wrong', () => {
    expect(check('modus-tollens', [], 'A', ['A -> B', '¬B'])).toBe(false);
  });

  // ---- and-intro ----
  it('and-intro: A, B ⊢ A & B', () => {
    expect(check('and-intro', [], 'A & B', ['A', 'B'])).toBe(true);
    expect(check('and-intro', [], 'P ∧ Q', ['P', 'Q'])).toBe(true);
  });
  it('and-intro rejects mismatch', () => {
    expect(check('and-intro', [], 'A & B', ['A', 'C'])).toBe(false);
  });

  // ---- and-elim ----
  it('and-elim-left: A & B ⊢ A', () => {
    expect(check('and-elim-left', [], 'A', ['A & B'])).toBe(true);
  });
  it('and-elim-right: A & B ⊢ B', () => {
    expect(check('and-elim-right', [], 'B', ['A & B'])).toBe(true);
  });
  it('and-elim-left rejects non-and premise', () => {
    expect(check('and-elim-left', [], 'A', ['A | B'])).toBe(false);
  });

  // ---- or-intro ----
  it('or-intro-left: A ⊢ A | B', () => {
    expect(check('or-intro-left', [], 'A | B', ['A'])).toBe(true);
  });
  it('or-intro-right: B ⊢ A | B', () => {
    expect(check('or-intro-right', [], 'A | B', ['B'])).toBe(true);
  });

  // ---- or-elim ----
  it('or-elim: A|B, A->C, B->C ⊢ C', () => {
    expect(check('or-elim', [], 'C', ['A | B', 'A -> C', 'B -> C'])).toBe(true);
  });
  it('or-elim rejects mismatched conclusion', () => {
    expect(check('or-elim', [], 'D', ['A | B', 'A -> C', 'B -> C'])).toBe(false);
  });
  it('or-elim rejects wrong premises count', () => {
    expect(check('or-elim', [], 'C', ['A | B', 'A -> C'])).toBe(false);
  });

  // ---- implies-intro ----
  it('implies-intro: assumes A, derived B ⊢ A -> B', () => {
    expect(check('implies-intro', ['A'], 'A -> B', ['B'])).toBe(true);
  });
  it('implies-intro rejects no args', () => {
    expect(check('implies-intro', [], 'A -> B', ['B'])).toBe(false);
  });

  // ---- not-intro ----
  it('not-intro: from ⊥ assuming A ⊢ ¬A', () => {
    expect(check('not-intro', ['P'], '¬P', ['⊥'])).toBe(true);
    expect(check('not-intro', ['P'], '~P', ['false'])).toBe(true);
    expect(check('not-intro', ['P'], '!P', ['bottom'])).toBe(true);
  });
  it('not-intro rejects non-bottom premise', () => {
    expect(check('not-intro', ['P'], '¬P', ['Q'])).toBe(false);
  });

  // ---- not-elim ----
  it('not-elim: A, ¬A ⊢ ⊥', () => {
    expect(check('not-elim', [], '⊥', ['P', '¬P'])).toBe(true);
    expect(check('not-elim', [], 'false', ['Q', '~Q'])).toBe(true);
  });
  it('not-elim rejects non-matching pair', () => {
    expect(check('not-elim', [], '⊥', ['P', '¬Q'])).toBe(false);
  });

  // ---- efq ----
  it('efq: from ⊥ derive anything', () => {
    expect(check('efq', [], 'P', ['⊥'])).toBe(true);
    expect(check('efq', [], 'Q', ['false'])).toBe(true);
  });
  it('efq rejects non-bottom premise', () => {
    expect(check('efq', [], 'P', ['Q'])).toBe(false);
  });

  // ---- double-neg ----
  it('double-neg-elim: ¬¬A ⊢ A', () => {
    expect(check('double-neg-elim', [], 'A', ['¬¬A'])).toBe(true);
  });
  it('double-neg-intro: A ⊢ ¬¬A', () => {
    expect(check('double-neg-intro', [], '¬¬A', ['A'])).toBe(true);
  });
  it('double-neg-elim rejects single negation', () => {
    expect(check('double-neg-elim', [], 'A', ['¬A'])).toBe(false);
  });

  // ---- iff rules ----
  it('iff-intro: A->B, B->A ⊢ A<->B', () => {
    expect(check('iff-intro', [], 'A <-> B', ['A -> B', 'B -> A'])).toBe(true);
  });
  it('iff-intro rejects mismatch', () => {
    expect(check('iff-intro', [], 'A <-> C', ['A -> B', 'B -> A'])).toBe(false);
  });
  it('iff-elim-left: A<->B ⊢ A->B', () => {
    expect(check('iff-elim-left', [], 'A -> B', ['A <-> B'])).toBe(true);
  });
  it('iff-elim-right: A<->B ⊢ B->A', () => {
    expect(check('iff-elim-right', [], 'B -> A', ['A <-> B'])).toBe(true);
  });

  // ---- Mixed spellings (¬, ~, !, not) ----
  it('mp accepts ASCII implies', () => {
    expect(check('mp', [], 'Q', ['P -> Q', 'P'])).toBe(true);
  });
  it('mp accepts unicode →', () => {
    expect(check('mp', [], 'Q', ['P → Q', 'P'])).toBe(true);
  });
  it('and-intro accepts unicode ∧', () => {
    expect(check('and-intro', [], 'P ∧ Q', ['P', 'Q'])).toBe(true);
  });

  // ---- Parenthesized formulas ----
  it('mp strips outer parens', () => {
    expect(check('mp', [], 'Q', ['(P -> Q)', '(P)'])).toBe(true);
  });
});
