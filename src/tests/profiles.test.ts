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
