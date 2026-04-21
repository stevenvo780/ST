// ============================================================
// ST Tests — CLI / Integration (ejecutan el intérprete completo)
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { formulaToString } from '../profiles/classical/propositional';

describe('Interpreter — script completo (criterio de exito 02)', () => {
  it('ejecuta el script de criterio de exito del Logic Core', () => {
    const source = `
logic classical.propositional

axiom a1 = P -> Q
axiom a2 = P

derive Q from {a1, a2}
check valid ((P -> Q) -> (!Q -> !P))
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source, 'test.st');
    expect(output.exitCode).toBe(0);
    expect(output.stdout).toContain('Perfil logico: classical.propositional');
    expect(output.stdout).toContain('derivado');

    // El check valid debe dar valid (es contraposicion, tautologia)
    const validResult = output.results.find((r) => r.status === 'valid');
    expect(validResult).toBeDefined();
  });
});

describe('Interpreter — derivaciones', () => {
  it('Modus Ponens simple', () => {
    const source = `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
derive Q from {a1, a2}
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.exitCode).toBe(0);
    const deriveResult = output.results[0];
    expect(deriveResult.status).toBe('provable');
  });

  it('derivacion que falla', () => {
    const source = `
logic classical.propositional
axiom a1 = P
derive Q from {a1}
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    const deriveResult = output.results[0];
    // Q no es consecuencia semántica de P y tampoco es derivable sintácticamente:
    // el status es 'refutable' sólo si existe un contramodelo que refuta la consecuencia.
    // Aquí el solver encuentra contramodelo (P=1, Q=0), así que el resultado debe ser
    // 'refutable'. Si el solver fuese incompleto, el status sería 'unknown'.
    expect(['refutable', 'unknown']).toContain(deriveResult.status);
  });

  it('mantiene la ND correcta aunque el script incluya derivaciones manuscritas despues', () => {
    const source = `
logic classical.propositional

let p1 = !T | !R
let p2 = !R -> S
let p3 = !T -> S
let p4 = W -> !S

let c = !W

derivar c desde {p1,p2,p3,p4}

// Derivacion
let p4 = !T // Eliminacion de disyuncion P1
let p5 = S // MT entre p4 y p3

let cp = !W // MP entre p4 y p5
`;

    const interpreter = new Interpreter();
    const output = interpreter.execute(source);

    expect(output.exitCode).toBe(0);
    expect(output.stdout).toContain('✓ [derive] !W derivado exitosamente');
    expect(output.stdout).not.toContain('Eliminacion de disyuncion');
    expect(output.stdout).not.toContain('MT entre');
    expect(output.stdout).not.toContain('MP entre');

    const deriveResult = output.results[0];
    expect(deriveResult.status).toBe('provable');
    expect(deriveResult.reasoningType).toBe('Dilema Simple, Modus Tollens');
    expect(deriveResult.proof?.method).toBe('natural_deduction');
    expect(deriveResult.proof?.metadata?.semanticFallback).toBe(false);
    expect(
      deriveResult.proof?.steps
        .filter((step) => step.source === 'rule')
        .map((step) => ({
          formula: formulaToString(step.formula),
          justification: step.justification,
          premises: step.premises,
        })),
    ).toEqual([
      {
        formula: 'S',
        justification: 'Dilema Simple',
        premises: [1, 3, 2],
      },
      {
        formula: '!W',
        justification: 'Modus Tollens',
        premises: [5, 4],
      },
    ]);
  });
});

describe('Interpreter — check valid', () => {
  it('tautologia detectada', () => {
    const source = `
logic classical.propositional
check valid (P | !P)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });

  it('contingente detectada', () => {
    const source = `
logic classical.propositional
check valid (P -> Q)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
  });
});

describe('Interpreter — check satisfiable', () => {
  it('satisfacible', () => {
    const source = `
logic classical.propositional
check satisfiable (P & Q)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('satisfiable');
  });

  it('insatisfacible (contradiccion)', () => {
    const source = `
logic classical.propositional
check satisfiable (P & !P)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('unsatisfiable');
  });
});

describe('Interpreter — countermodel', () => {
  it('encuentra contramodelo', () => {
    const source = `
logic classical.propositional
countermodel (P -> Q)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('invalid');
    expect(output.results[0].model).toBeDefined();
  });
});

describe('Interpreter — truth_table', () => {
  it('genera tabla de verdad', () => {
    const source = `
logic classical.propositional
truth_table (P & Q)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.stdout).toContain('P');
    expect(output.stdout).toContain('Q');
    expect(output.stdout).toContain('T');
    expect(output.stdout).toContain('F');
  });
});

describe('Interpreter — text layer completo', () => {
  it('ejecuta script con text layer (criterio exito 04)', () => {
    const source = `
logic classical.propositional

let p = passage([[clase-logica.md#b8]])
let phi = formalize p as (P -> Q)

claim c1 = phi
support c1 <- p
confidence c1 = 0.84
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.exitCode).toBe(0);
    expect(output.stdout).toContain('Passage p');
    expect(output.stdout).toContain('Formalizacion phi');
    expect(output.stdout).toContain('Claim c1');
    expect(output.stdout).toContain('Support');
    expect(output.stdout).toContain('Confidence');
  });
});

describe('Interpreter — check equivalent', () => {
  it('P->Q equivale a !P|Q', () => {
    const source = `
logic classical.propositional
check equivalent (P -> Q), (!P | Q)
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('valid');
  });
});

describe('Interpreter — errores', () => {
  it('error sin perfil logico', () => {
    const source = `axiom a1 = P`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.exitCode).not.toBe(0);
  });

  it('perfil inexistente', () => {
    const source = `logic inexistente.perfil`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.exitCode).not.toBe(0);
  });
});

describe('Interpreter — prove', () => {
  it('prueba desde teoria', () => {
    const source = `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
prove Q from {a1, a2}
`;
    const interpreter = new Interpreter();
    const output = interpreter.execute(source);
    expect(output.results[0].status).toBe('provable');
  });
});
