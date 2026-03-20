import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

// ============================================================
// Tests para perfiles lógicos extendidos
// ============================================================

// ── Deontic Standard (KD) ───────────────────────────────────

describe('Engines — Deontic Standard (KD)', () => {
  const interpreter = new Interpreter();

  it('valida axioma D: O(φ) → P(φ) ([]φ → <>φ)', () => {
    const source = `
logic deontic.standard
check valid ([](P) -> <>(P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida axioma K deóntico: [](P -> Q) -> ([]P -> []Q)', () => {
    const source = `
logic deontic.standard
check valid ([](P -> Q) -> ([]P -> []Q))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('no valida O(P) → P (lo obligatorio no implica lo real)', () => {
    const source = `
logic deontic.standard
check valid ([](P) -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('prohibición: O(¬P) → ¬P(P) ([]!P → !<>P)', () => {
    const source = `
logic deontic.standard
check valid ([](!P) -> !<>(P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});

// ── Epistemic S5 ────────────────────────────────────────────

describe('Engines — Epistemic S5', () => {
  const interpreter = new Interpreter();

  it('valida axioma T: K(P) → P (lo que se sabe es verdadero)', () => {
    const source = `
logic epistemic.s5
check valid ([](P) -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida axioma 4: K(P) → K(K(P)) (introspección positiva)', () => {
    const source = `
logic epistemic.s5
check valid ([](P) -> []([](P)))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida axioma 5: ¬K(P) → K(¬K(P)) (introspección negativa)', () => {
    const source = `
logic epistemic.s5
check valid (![]P -> [](![]P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida axioma K epistémico', () => {
    const source = `
logic epistemic.s5
check valid ([](P -> Q) -> ([]P -> []Q))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida dualidad K/B: K(P) ↔ ¬B(¬P)', () => {
    const source = `
logic epistemic.s5
check valid ([]P <-> !<>!P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});

// ── Intuitionistic Propositional ────────────────────────────

describe('Engines — Intuitionistic Propositional', () => {
  const interpreter = new Interpreter();

  it('valida P → P (identidad)', () => {
    const source = `
logic intuitionistic.propositional
check valid (P -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('NO valida ley del tercero excluido: P ∨ ¬P', () => {
    const source = `
logic intuitionistic.propositional
check valid (P | !P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('NO valida doble negación eliminación: ¬¬P → P', () => {
    const source = `
logic intuitionistic.propositional
check valid (!!P -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('valida doble negación introducción: P → ¬¬P', () => {
    const source = `
logic intuitionistic.propositional
check valid (P -> !!P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida contraposición: (P → Q) → (¬Q → ¬P)', () => {
    const source = `
logic intuitionistic.propositional
check valid ((P -> Q) -> (!Q -> !P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida ex falso quodlibet: (P & !P) → Q', () => {
    const source = `
logic intuitionistic.propositional
check valid ((P & !P) -> Q)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('NO valida Peirce: ((P → Q) → P) → P', () => {
    const source = `
logic intuitionistic.propositional
check valid (((P -> Q) -> P) -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });
});

// ── Temporal LTL ────────────────────────────────────────────

describe('Engines — Temporal LTL', () => {
  const interpreter = new Interpreter();

  it('valida G(P) → P (lo que siempre vale, vale ahora)', () => {
    const source = `
logic temporal.ltl
check valid ([](P) -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida G(P) → F(P) (siempre implica eventualmente)', () => {
    const source = `
logic temporal.ltl
check valid ([](P) -> <>(P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('no valida F(P) → G(P) (eventualmente no implica siempre)', () => {
    const source = `
logic temporal.ltl
check valid (<>(P) -> [](P))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('valida G(P → Q) → (G(P) → G(Q)) (distribución de G)', () => {
    const source = `
logic temporal.ltl
check valid ([](P -> Q) -> ([](P) -> [](Q)))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});

// ── Aristotelian Syllogistic ────────────────────────────────

describe('Engines — Aristotelian Syllogistic', () => {
  const interpreter = new Interpreter();

  it('valida Barbara: ∀x(M→P) ∧ ∀x(S→M) → ∀x(S→P)', () => {
    const source = `
logic aristotelian.syllogistic
check valid ((forall x (M(x) -> P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x))))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida Celarent: ∀x(M→¬P) ∧ ∀x(S→M) → ∀x(S→¬P)', () => {
    const source = `
logic aristotelian.syllogistic
check valid ((forall x (M(x) -> !P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> !P(x))))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('rechaza silogismo inválido: conclusión universal de premisa particular', () => {
    // IAA-1: Algún M es P, Todo S es M ⊢ Todo S es P — INVÁLIDO
    const source = `
logic aristotelian.syllogistic
check valid ((exists x (M(x) & P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x))))
`;
    const output = interpreter.execute(source);
    // No corresponde a ningún modo silogístico válido
    expect(output.results[0].status).toBe('invalid');
  });
});

// ── Probabilistic Basic ─────────────────────────────────────

describe('Engines — Probabilistic Basic', () => {
  const interpreter = new Interpreter();

  it('valida P ∨ ¬P (prob = 1.0 siempre)', () => {
    const source = `
logic probabilistic.basic
check valid (P | !P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('no valida P (prob < 1 para algunas asignaciones)', () => {
    const source = `
logic probabilistic.basic
check valid P
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('valida (P & !P) → Q (ex falso — prob P&!P = 0)', () => {
    const source = `
logic probabilistic.basic
check valid ((P & !P) -> Q)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('satisfacibilidad de P & Q', () => {
    const source = `
logic probabilistic.basic
check satisfiable (P & Q)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('satisfiable');
  });
});

// ── Paraconsistent Belnap — Enriched Output ─────────────────

describe('Engines — Belnap Enriched Output', () => {
  const interpreter = new Interpreter();

  it('countermodel Belnap muestra valuaciones de 4 valores', () => {
    const source = `
logic paraconsistent.belnap
countermodel P | !P
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
    expect(output.results[0].output).toContain('N');
    expect(output.results[0].output).toContain('no designado');
  });

  it('countermodel Belnap muestra explicación', () => {
    const source = `
logic paraconsistent.belnap
countermodel P -> P
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
    expect(output.results[0].output).toContain('Neither');
    expect(output.results[0].output).toContain('Valuación');
  });

  it('truth_table Belnap devuelve tabla con 4 valores', () => {
    const source = `
logic paraconsistent.belnap
truth_table P & !P
`;
    const output = interpreter.execute(source);
    const tt = output.results[0].truthTable;
    expect(tt).toBeDefined();
    expect(tt!.rows.length).toBe(4);
    // Verificar que hay valores Belnap (B y N) en los resultados
    const resultValues = tt!.rows.map((r) => r.result);
    expect(resultValues).toContain('B');
    expect(resultValues).toContain('F');
  });

  it('truth_table Belnap marca valores designados', () => {
    const source = `
logic paraconsistent.belnap
truth_table P | !P
`;
    const output = interpreter.execute(source);
    const tt = output.results[0].truthTable;
    expect(tt).toBeDefined();
    // P|!P no es tautología en Belnap (falla para N)
    expect(tt!.isTautology).toBe(false);
    expect(tt!.isSatisfiable).toBe(true);
    // Verificar que hay al menos un resultado no-T
    const resultValues = tt!.rows.map((r) => r.result);
    expect(resultValues).toContain('N');
  });
});

// ── Modal Syntax Aliases ────────────────────────────────────

describe('Parser — Modal Syntax Aliases', () => {
  const interpreter = new Interpreter();

  it('K(P) parsea como modal_necessity en epistemic.s5', () => {
    const source = `
logic epistemic.s5
check valid K(P) -> P
`;
    const output = interpreter.execute(source);
    // K(P) → P is the T axiom, valid in S5
    expect(output.results[0].status).toBe('valid');
  });

  it('B(P) parsea como modal_possibility en epistemic.s5', () => {
    const source = `
logic epistemic.s5
check valid K(P) -> B(P)
`;
    const output = interpreter.execute(source);
    // K(P) → B(P) should be valid (□P → ◇P)
    expect(output.results[0].status).toBe('valid');
  });

  it('O(P) parsea como modal_necessity en deontic.standard', () => {
    const source = `
logic deontic.standard
check valid O(P) -> P(P)
`;
    const output = interpreter.execute(source);
    // O(P) → P(P) is the D axiom ([]P → <>P), valid in KD
    expect(output.results[0].status).toBe('valid');
  });

  it('F(P) deóntico parsea como prohibición □(¬P)', () => {
    const source = `
logic deontic.standard
check valid F(P) -> !P(P)
`;
    const output = interpreter.execute(source);
    // F(P) = [](¬P), P(P) = <>P; [](¬P) → ¬<>P is valid
    expect(output.results[0].status).toBe('valid');
  });

  it('G(P) parsea como modal_necessity en temporal.ltl', () => {
    const source = `
logic temporal.ltl
check valid G(P) -> F(P)
`;
    const output = interpreter.execute(source);
    // G(P) → F(P) is valid (always → eventually)
    expect(output.results[0].status).toBe('valid');
  });

  it('sin perfil modal, K(P) es un predicado normal', () => {
    const source = `
logic classical.first_order
check valid K(P) -> K(P)
`;
    const output = interpreter.execute(source);
    // K(P) → K(P) is trivially valid regardless of interpretation
    expect(output.results[0].status).toBe('valid');
  });

  it('aliases no interfieren con la sintaxis [] existente', () => {
    const source = `
logic epistemic.s5
check valid ([]P -> P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});
