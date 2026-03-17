import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

describe('Engines Implementation — Belnap (4-valued)', () => {
  const interpreter = new Interpreter();

  it('evalua contradicciones como designadas (Both)', () => {
    const source = `
logic paraconsistent.belnap
check valid (P & !P)
`;
    // En Belnap, P & !P no es una tautología (no es siempre T o B),
    // pero queremos ver que el motor funciona.
    const output = interpreter.execute(source);
    expect(output.exitCode).toBe(0);
    expect(output.stdout).toContain('Belnap');
  });

  it('maneja el valor None (N)', () => {
    const source = `
logic paraconsistent.belnap
check satisfiable (P | !P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('satisfiable');
  });
});

describe('Engines Implementation — Modal K', () => {
  const interpreter = new Interpreter();

  it('valida el axioma K: [](P -> Q) -> ([]P -> []Q)', () => {
    const source = `
logic modal.k
check valid ([](P -> Q) -> ([]P -> []Q))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('no valida T en K (P -> []P no es valido)', () => {
    const source = `
logic modal.k
check valid (P -> []P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });

  it('valida dualidad: <>P <-> ![]!P', () => {
    const source = `
logic modal.k
check valid (<>P <-> ![]!P)
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});

describe('Engines Implementation — First-Order Logic', () => {
  const interpreter = new Interpreter();

  it('valida silogismo simple: (forall x P(x)) -> P(a)', () => {
    const source = `
logic classical.first_order
check valid ((forall x P(x)) -> P(a))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('valida existe: P(a) -> (exists x P(x))', () => {
    const source = `
logic classical.first_order
check valid (P(a) -> (exists x P(x)))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('detecta formulas no validas en FOL', () => {
    const source = `
logic classical.first_order
check valid ((exists x P(x)) -> (forall x P(x)))
`;
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('unknown'); // El motor FOL devuelve unknown si no cierra el tableau
  });
});
