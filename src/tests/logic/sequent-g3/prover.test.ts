import { describe, it, expect } from 'vitest';
import { Formula } from '../../../types';
import { proveFormula, proveSequent, proofToLatex, ProofTree } from '../../../logic/profiles/sequent-g3';

// --- Helpers de construccion ---

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const imp = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const iff = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const T: Formula = { kind: 'true' };
const F: Formula = { kind: 'false' };

const P = atom('P');
const Q = atom('Q');
const R = atom('R');

function rules(tree: ProofTree | undefined): string[] {
  if (!tree) return [];
  const out: string[] = [];
  if (tree.rule) out.push(tree.rule);
  for (const sub of tree.premises) out.push(...rules(sub));
  return out;
}

describe('G3 — tautologias proposicionales clasicas', () => {
  it('demuestra P → P', () => {
    const res = proveFormula(imp(P, P));
    expect(res.provable).toBe(true);
    expect(res.proof?.closed).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('impR')).toBe(true);
    expect(ruleSet.has('axiom')).toBe(true);
  });

  it('demuestra (P ∧ Q) → P', () => {
    const res = proveFormula(imp(and(P, Q), P));
    expect(res.provable).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('impR')).toBe(true);
    expect(ruleSet.has('andL')).toBe(true);
    expect(ruleSet.has('axiom')).toBe(true);
  });

  it('demuestra (P ∧ Q) → Q', () => {
    const res = proveFormula(imp(and(P, Q), Q));
    expect(res.provable).toBe(true);
  });

  it('demuestra LEM: P ∨ ¬P', () => {
    const res = proveFormula(or(P, not(P)));
    expect(res.provable).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('orR')).toBe(true);
    expect(ruleSet.has('notR')).toBe(true);
    expect(ruleSet.has('axiom')).toBe(true);
  });

  it('demuestra DNE clasica: ¬¬P → P', () => {
    const res = proveFormula(imp(not(not(P)), P));
    expect(res.provable).toBe(true);
  });

  it('demuestra ley de Peirce: ((P → Q) → P) → P', () => {
    const res = proveFormula(imp(imp(imp(P, Q), P), P));
    expect(res.provable).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('impL')).toBe(true);
  });

  it('demuestra contraposicion: (P → Q) → (¬Q → ¬P)', () => {
    const res = proveFormula(imp(imp(P, Q), imp(not(Q), not(P))));
    expect(res.provable).toBe(true);
  });

  it('demuestra De Morgan: ¬(P ∧ Q) ↔ (¬P ∨ ¬Q)', () => {
    const res = proveFormula(iff(not(and(P, Q)), or(not(P), not(Q))));
    expect(res.provable).toBe(true);
  });

  it('demuestra distributividad: P ∧ (Q ∨ R) → (P ∧ Q) ∨ (P ∧ R)', () => {
    const res = proveFormula(imp(and(P, or(Q, R)), or(and(P, Q), and(P, R))));
    expect(res.provable).toBe(true);
  });

  it('demuestra silogismo hipotetico: (P→Q) → (Q→R) → (P→R)', () => {
    const goal = imp(imp(P, Q), imp(imp(Q, R), imp(P, R)));
    const res = proveFormula(goal);
    expect(res.provable).toBe(true);
  });
});

describe('G3 — no-tautologias', () => {
  it('NO demuestra P → Q', () => {
    const res = proveFormula(imp(P, Q));
    expect(res.provable).toBe(false);
  });

  it('NO demuestra P ∧ Q (con P,Q libres)', () => {
    const res = proveFormula(and(P, Q));
    expect(res.provable).toBe(false);
  });

  it('NO demuestra (P ∨ Q) → P', () => {
    const res = proveFormula(imp(or(P, Q), P));
    expect(res.provable).toBe(false);
  });

  it('NO demuestra ¬(P → P)', () => {
    const res = proveFormula(not(imp(P, P)));
    expect(res.provable).toBe(false);
  });

  it('NO demuestra ⊥', () => {
    const res = proveFormula(F);
    expect(res.provable).toBe(false);
  });
});

describe('G3 — constantes y axiomas elementales', () => {
  it('demuestra ⊤', () => {
    const res = proveFormula(T);
    expect(res.provable).toBe(true);
    expect(res.proof?.rule).toBe('trueR');
  });

  it('demuestra ⊥ → P (explosion / ex falso)', () => {
    const res = proveFormula(imp(F, P));
    expect(res.provable).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('falseL')).toBe(true);
  });

  it('axioma directo: P ⊢ P', () => {
    const res = proveSequent({ left: [P], right: [P] });
    expect(res.provable).toBe(true);
    expect(res.proof?.rule).toBe('axiom');
    expect(res.proof?.premises.length).toBe(0);
  });

  it('multiset: P, Q ⊢ Q, R cierra por axioma con Q', () => {
    const res = proveSequent({ left: [P, Q], right: [Q, R] });
    expect(res.provable).toBe(true);
    expect(res.proof?.rule).toBe('axiom');
  });
});

describe('G3 — secuentes con hipotesis (premisas reales)', () => {
  it('modus ponens: P, P→Q ⊢ Q', () => {
    const res = proveSequent({ left: [P, imp(P, Q)], right: [Q] });
    expect(res.provable).toBe(true);
    const ruleSet = new Set(rules(res.proof));
    expect(ruleSet.has('impL')).toBe(true);
  });

  it('modus tollens: ¬Q, P→Q ⊢ ¬P', () => {
    const res = proveSequent({ left: [not(Q), imp(P, Q)], right: [not(P)] });
    expect(res.provable).toBe(true);
  });

  it('silogismo disyuntivo: P∨Q, ¬P ⊢ Q', () => {
    const res = proveSequent({ left: [or(P, Q), not(P)], right: [Q] });
    expect(res.provable).toBe(true);
  });
});

describe('G3 — proofToLatex (bussproofs)', () => {
  it('produce un bloque prooftree sintacticamente valido', () => {
    const res = proveFormula(imp(P, P));
    expect(res.proof).toBeDefined();
    const tex = proofToLatex(res.proof!);
    expect(tex).toContain('\\begin{prooftree}');
    expect(tex).toContain('\\end{prooftree}');
    expect(tex).toContain('\\AxiomC');
    expect(tex).toContain('\\UnaryInfC');
    expect(tex).toContain('\\vdash');
    expect(tex).toContain('\\textsc{Ax}');
    expect(tex).toContain('\\to_R');
  });

  it('serializa correctamente una prueba con ramificacion (andR)', () => {
    // ⊢ (P ∨ Q) → (P ∨ Q) cierra con orR + axiom, ahora probamos andR
    // con un goal explicitamente ramificante: P ⊢ P ∧ P
    const res = proveSequent({ left: [P], right: [and(P, P)] });
    expect(res.provable).toBe(true);
    const tex = proofToLatex(res.proof!);
    expect(tex).toContain('\\BinaryInfC');
    expect(tex).toContain('\\wedge_R');
  });

  it('serializa una prueba de De Morgan a LaTeX no vacio', () => {
    const res = proveFormula(iff(not(and(P, Q)), or(not(P), not(Q))));
    expect(res.provable).toBe(true);
    const tex = proofToLatex(res.proof!);
    expect(tex.length).toBeGreaterThan(50);
    expect(tex).toContain('\\vdash');
  });

  it('todas las reglas usadas aparecen como etiquetas en el LaTeX', () => {
    const res = proveFormula(imp(imp(imp(P, Q), P), P));
    const usedRules = new Set(rules(res.proof));
    const tex = proofToLatex(res.proof!);
    // Cuenta de \RightLabel == cantidad de reglas no-axioma efectivamente
    // emitidas en el arbol (axiom tambien emite RightLabel en bussproofs).
    const labelCount = (tex.match(/\\RightLabel/g) ?? []).length;
    expect(labelCount).toBeGreaterThanOrEqual(usedRules.size);
    expect(tex).toContain('\\to_L');
  });
});

describe('G3 — propiedad de invertibilidad (subgoals deterministas)', () => {
  it('reglas invertibles: probar (A∧B)→C ↔ A→(B→C) en ambos sentidos', () => {
    const A = atom('A'),
      B = atom('B'),
      C = atom('C');
    const left = imp(and(A, B), C);
    const right = imp(A, imp(B, C));
    expect(proveFormula(imp(left, right)).provable).toBe(true);
    expect(proveFormula(imp(right, left)).provable).toBe(true);
  });
});

describe('G3 — multiset semantics (duplicados en izquierda/derecha)', () => {
  it('dedup interno: P, P ⊢ P sigue siendo derivable', () => {
    const res = proveSequent({ left: [P, P], right: [P] });
    expect(res.provable).toBe(true);
  });

  it('dedup interno: P ⊢ P, P sigue siendo derivable', () => {
    const res = proveSequent({ left: [P], right: [P, P] });
    expect(res.provable).toBe(true);
  });
});
