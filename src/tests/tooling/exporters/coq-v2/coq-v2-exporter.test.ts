// ============================================================
// Tests — Coq exporter V2 (dependent types + hints + strategies)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  exportToCoqV2,
  exportProofToCoqV2,
  exportTheoryToCoqV2,
  formulaToCoqType,
  inferDependentSorts,
  generateHints,
  chooseStrategy,
  ndProofToProofTerm,
} from '../../../../tooling/exporters/coq-v2';
import { Formula, Proof } from '../../../../types';

// ----------------------------------------------------------------
// Builder helpers
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
function forall(variable: string, body: Formula): Formula {
  return { kind: 'forall', variable, args: [body] };
}
function exists(variable: string, body: Formula): Formula {
  return { kind: 'exists', variable, args: [body] };
}
function predicate(name: string, ...params: string[]): Formula {
  return { kind: 'predicate', name, params };
}
function equals(a: Formula, b: Formula): Formula {
  return { kind: 'equals', args: [a, b] };
}
function less(a: Formula, b: Formula): Formula {
  return { kind: 'less', args: [a, b] };
}

// ----------------------------------------------------------------
// Sanity helpers
// ----------------------------------------------------------------

function parensBalanced(code: string): boolean {
  let depth = 0;
  for (const ch of code) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

// ----------------------------------------------------------------
// chooseStrategy
// ----------------------------------------------------------------

describe('chooseStrategy — picks tactic by shape', () => {
  it('forall n, n = n → reflexivity', () => {
    const f = forall('n', equals(atom('n'), atom('n')));
    expect(chooseStrategy(f)).toBe('reflexivity');
  });

  it('aritmética con < → lia', () => {
    const f = forall('n', less(atom('n'), atom('n')));
    expect(chooseStrategy(f)).toBe('lia');
  });

  it('forall x, P x → Q x → firstorder', () => {
    const f = forall('x', implies(predicate('P', 'x'), predicate('Q', 'x')));
    expect(chooseStrategy(f)).toBe('firstorder');
  });

  it('P ∨ ¬P → tauto', () => {
    const f = or(atom('P'), not(atom('P')));
    expect(chooseStrategy(f)).toBe('tauto');
  });

  it('(P → Q) → (Q → R) → P → R → intuition', () => {
    const f = implies(
      implies(atom('P'), atom('Q')),
      implies(implies(atom('Q'), atom('R')), implies(atom('P'), atom('R'))),
    );
    expect(chooseStrategy(f)).toBe('intuition');
  });

  it('atom → fallback auto', () => {
    expect(chooseStrategy(atom('P'))).toBe('auto');
  });

  it('non-formula input → auto', () => {
    expect(chooseStrategy(null)).toBe('auto');
    expect(chooseStrategy('not a formula')).toBe('auto');
  });
});

// ----------------------------------------------------------------
// formulaToCoqType — dependent sorts
// ----------------------------------------------------------------

describe('formulaToCoqType — dependent types', () => {
  it('forall x con uso aritmético → nat', () => {
    const f = forall('n', less(atom('n'), atom('n')));
    const t = formulaToCoqType(f);
    expect(t).toContain('forall n : nat');
  });

  it('forall x con predicado simbólico → Type', () => {
    const f = forall('x', predicate('P', 'x'));
    const t = formulaToCoqType(f);
    // No aritmética → default Type
    expect(t).toContain('forall x : Type');
  });

  it('exists y de naturaleza aritmética → nat', () => {
    const f = exists('k', less(atom('k'), atom('k')));
    const t = formulaToCoqType(f);
    expect(t).toContain('exists k : nat');
  });

  it('equality syntáctica preserva =', () => {
    const f = equals(atom('a'), atom('b'));
    const t = formulaToCoqType(f);
    expect(t).toContain('=');
  });

  it('non-formula input → Prop', () => {
    expect(formulaToCoqType(null)).toBe('Prop');
    expect(formulaToCoqType({})).toBe('Prop');
  });
});

describe('inferDependentSorts', () => {
  it('registra todas las variables cuantificadas', () => {
    const f = forall('n', exists('m', less(atom('n'), atom('m'))));
    const sorts = inferDependentSorts(f);
    expect(sorts.has('n')).toBe(true);
    expect(sorts.has('m')).toBe(true);
    expect(sorts.get('n')).toBe('nat');
    expect(sorts.get('m')).toBe('nat');
  });

  it('input no-formula → mapa vacío', () => {
    expect(inferDependentSorts(null).size).toBe(0);
  });
});

// ----------------------------------------------------------------
// exportToCoqV2 — derived tactics
// ----------------------------------------------------------------

describe('exportToCoqV2 — derived tactics', () => {
  it('LEM via Classical: P ∨ ¬P emite tauto', () => {
    const lem = forall('P', or(atom('P'), not(atom('P'))));
    const coq = exportToCoqV2(lem);
    expect(coq).toContain('Require Import Classical.');
    expect(coq).toContain('Theorem stmt_proof');
    // forall sobre P (no aritmético) y tauto resuelve disyunción + negación
    expect(coq).toContain('tauto');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('tauto sobre P ∧ Q → P ∧ Q (con ¬ no presente → no tauto, intuition o auto)', () => {
    const f = implies(and(atom('P'), atom('Q')), and(atom('P'), atom('Q')));
    const coq = exportToCoqV2(f);
    // No tiene ∨ con ¬, así que cae en intuition/auto. Lo que importa: válido.
    expect(coq).toContain('Theorem');
    expect(coq).toContain('Qed.');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('firstorder sobre (forall x, P x -> Q x) -> (exists x, P x) -> exists x, Q x', () => {
    const f = implies(
      forall('x', implies(predicate('P', 'x'), predicate('Q', 'x'))),
      implies(exists('x', predicate('P', 'x')), exists('x', predicate('Q', 'x'))),
    );
    const coq = exportToCoqV2(f);
    expect(coq).toContain('firstorder');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('intuition sobre (P → Q) → (Q → R) → P → R', () => {
    const f = implies(
      implies(atom('P'), atom('Q')),
      implies(implies(atom('Q'), atom('R')), implies(atom('P'), atom('R'))),
    );
    const coq = exportToCoqV2(f);
    expect(coq).toContain('intuition');
  });

  it('dependent: forall n : nat, n = n → reflexivity + Arith import', () => {
    const f = forall('n', equals(atom('n'), atom('n')));
    const coq = exportToCoqV2(f);
    // sort inferido: no aritmético en isolation (equals con atom no es lia-class)
    // pero la estrategia debe ser reflexivity
    expect(coq).toContain('reflexivity');
    expect(coq).toContain('Theorem stmt_proof');
  });

  it('useAuto = false: cae en admit cuando no hay strategy', () => {
    const f = atom('Mystery');
    const coq = exportToCoqV2(f, { useAuto: false });
    expect(coq).toContain('admit');
  });

  it('imports custom override inferencia', () => {
    const f = atom('P');
    const coq = exportToCoqV2(f, { imports: ['Bool'] });
    expect(coq).toContain('Require Import Bool.');
    expect(coq).not.toContain('Require Import Classical.');
  });

  it('moduleName custom', () => {
    const coq = exportToCoqV2(atom('P'), { moduleName: 'MyMod' });
    expect(coq).toContain('Module MyMod.');
    expect(coq).toContain('End MyMod.');
  });

  it('emitMode proofterm produce Definition stmt_term', () => {
    const f = implies(atom('P'), atom('P'));
    const coq = exportToCoqV2(f, { emitMode: 'proofterm' });
    expect(coq).toContain('Definition stmt_term');
    expect(coq).not.toContain('Theorem stmt_proof');
  });

  it('emitMode both emite tactic + proofterm', () => {
    const f = implies(atom('P'), atom('P'));
    const coq = exportToCoqV2(f, { emitMode: 'both' });
    expect(coq).toContain('Theorem stmt_proof');
    expect(coq).toContain('Definition stmt_term');
  });

  it('input no formula → comentario y no crashea', () => {
    const coq = exportToCoqV2(null);
    expect(coq).toContain('not a Formula');
  });
});

// ----------------------------------------------------------------
// exportTheoryToCoqV2
// ----------------------------------------------------------------

describe('exportTheoryToCoqV2 — axioms + theorems + hints', () => {
  it('2 axioms + 1 theorem + hints generation', () => {
    const axioms: Formula[] = [
      forall('x', implies(predicate('P', 'x'), predicate('Q', 'x'))),
      forall('x', predicate('P', 'x')),
    ];
    const theorems: Formula[] = [forall('x', predicate('Q', 'x'))];

    const coq = exportTheoryToCoqV2(axioms, theorems, { emitHints: true });

    expect(coq).toContain('Axiom Ax_1');
    expect(coq).toContain('Axiom Ax_2');
    expect(coq).toContain('Theorem Th_1');
    expect(coq).toContain('Hint Resolve');
    expect(coq).toContain('stdb');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('teoría vacía sigue siendo válida', () => {
    const coq = exportTheoryToCoqV2([], []);
    expect(coq).toContain('Module STTheoryV2.');
    expect(coq).toContain('End STTheoryV2.');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('filtra inputs no-formula sin crashear', () => {
    const coq = exportTheoryToCoqV2([null, undefined, 'nope', atom('P')] as unknown[], []);
    expect(coq).toContain('Axiom Ax_4'); // sólo el último (atom P) cuenta como axioma index 4
    expect(parensBalanced(coq)).toBe(true);
  });
});

// ----------------------------------------------------------------
// generateHints
// ----------------------------------------------------------------

describe('generateHints', () => {
  it('genera Hint Resolve para implicaciones', () => {
    const ax: Formula = forall('x', implies(predicate('P', 'x'), predicate('Q', 'x')));
    const hints = generateHints([ax], []);
    expect(hints.length).toBe(1);
    expect(hints[0]).toContain('Hint Resolve');
    expect(hints[0]).toContain('stdb');
  });

  it('genera Hint Rewrite para equality (incluso bajo forall)', () => {
    const ax: Formula = forall('x', equals(atom('x'), atom('x')));
    const hints = generateHints([ax], []);
    expect(hints[0]).toContain('Hint Rewrite');
  });

  it('mezcla axiomas y theorems', () => {
    const ax: Formula = atom('A');
    const th: Formula = atom('T');
    const hints = generateHints([ax], [th]);
    expect(hints.length).toBe(2);
    expect(hints.some((h) => h.includes('Ax_1'))).toBe(true);
    expect(hints.some((h) => h.includes('Th_1'))).toBe(true);
  });

  it('input no-array → array vacío sin crashear', () => {
    expect(generateHints(null as unknown as unknown[], null as unknown as unknown[])).toEqual([]);
  });
});

// ----------------------------------------------------------------
// ndProofToProofTerm
// ----------------------------------------------------------------

describe('ndProofToProofTerm', () => {
  it('identidad P → P produce fun H => H', () => {
    const p: Proof = { goal: implies(atom('P'), atom('P')), status: 'complete', steps: [] };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('fun');
    expect(term).toContain('=> H');
  });

  it('modus ponens (A → B) → A → B produce H1 H2', () => {
    // (A → B) → A → B  ≡ implies(implies(A,B), implies(A,B))
    const p: Proof = {
      goal: implies(implies(atom('A'), atom('B')), implies(atom('A'), atom('B'))),
      status: 'complete',
      steps: [],
    };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('H1 H2');
  });

  it('and elim left: (P /\\ Q) → P produce match conj HL _', () => {
    const p: Proof = {
      goal: implies(and(atom('P'), atom('Q')), atom('P')),
      status: 'complete',
      steps: [],
    };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('conj HL');
  });

  it('and elim right: (P /\\ Q) → Q produce match conj _ HR', () => {
    const p: Proof = {
      goal: implies(and(atom('P'), atom('Q')), atom('Q')),
      status: 'complete',
      steps: [],
    };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('conj _ HR');
  });

  it('forall x, x = x → fun x => eq_refl x', () => {
    const p: Proof = {
      goal: forall('n', equals(atom('n'), atom('n'))),
      status: 'complete',
      steps: [],
    };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('eq_refl');
  });

  it('shape desconocida → TODO comment', () => {
    const p: Proof = {
      goal: forall('x', exists('y', predicate('Weird', 'x', 'y'))),
      status: 'complete',
      steps: [],
    };
    const term = ndProofToProofTerm(p);
    expect(term).toContain('TODO');
  });

  it('input no-proof → comentario', () => {
    expect(ndProofToProofTerm(null)).toContain('invalid');
  });
});

// ----------------------------------------------------------------
// exportProofToCoqV2
// ----------------------------------------------------------------

describe('exportProofToCoqV2', () => {
  it('proof completo emite tactic block', () => {
    const proof: Proof = {
      goal: implies(atom('P'), atom('P')),
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
    const coq = exportProofToCoqV2(proof);
    expect(coq).toContain('Theorem stmt_proof');
    expect(coq).toContain('Qed.');
    expect(coq).toContain('exact');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('proof incompleto cae en fallback strategy (con useAuto)', () => {
    const proof: Proof = {
      goal: implies(atom('P'), atom('P')),
      status: 'incomplete',
      steps: [],
    };
    const coq = exportProofToCoqV2(proof, { useAuto: true });
    // strategy de P → P es 'auto', así que debería aparecer
    expect(coq).toContain('Theorem stmt_proof');
    expect(parensBalanced(coq)).toBe(true);
  });

  it('emitMode both incluye proofterm reconstruido', () => {
    const proof: Proof = {
      goal: implies(atom('P'), atom('P')),
      status: 'complete',
      steps: [
        {
          stepNumber: 1,
          formula: atom('P'),
          justification: 'assumption',
          premises: [],
          source: 'assumption',
        },
      ],
    };
    const coq = exportProofToCoqV2(proof, { emitMode: 'both' });
    expect(coq).toContain('Definition stmt_term');
    expect(coq).toContain('Theorem stmt_proof');
  });

  it('input no-proof → comentario', () => {
    const coq = exportProofToCoqV2(null);
    expect(coq).toContain('not a Proof');
  });
});

// ----------------------------------------------------------------
// Structural integrity over a battery of formulas
// ----------------------------------------------------------------

describe('coq-v2 — structural linter', () => {
  const cases: Array<[string, Formula]> = [
    ['atom P', atom('P')],
    ['P -> P', implies(atom('P'), atom('P'))],
    ['P /\\ Q', and(atom('P'), atom('Q'))],
    ['P \\/ ~P', or(atom('P'), not(atom('P')))],
    ['forall x, P x', forall('x', predicate('P', 'x'))],
    ['exists y, Q y', exists('y', predicate('Q', 'y'))],
    ['forall n, n = n', forall('n', equals(atom('n'), atom('n')))],
    ['forall n, n < n', forall('n', less(atom('n'), atom('n')))],
  ];

  for (const [label, f] of cases) {
    it(`${label}: output válido y balanceado`, () => {
      const coq = exportToCoqV2(f);
      expect(parensBalanced(coq)).toBe(true);
      expect(coq).toContain('Module');
      expect(coq).toContain('End');
      expect(coq).toContain('Theorem stmt_proof');
    });
  }
});
