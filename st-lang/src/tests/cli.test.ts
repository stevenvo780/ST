// ============================================================
// ST Tests — CLI / Integration (ejecutan el intérprete completo)
// ============================================================

import { describe, it, assert, assertEqual, assertIncludes } from './runner';
import { Interpreter } from '../runtime/interpreter';

export function runCLITests(): void {
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
      assertEqual(output.exitCode, 0, `Exit code deberia ser 0, fue ${output.exitCode}. stderr: ${output.stderr}`);
      assertIncludes(output.stdout, 'Perfil logico: classical.propositional');
      assertIncludes(output.stdout, 'derivado');

      // El check valid debe dar valid (es contraposicion, tautologia)
      const validResult = output.results.find(r => r.status === 'valid');
      assert(validResult !== undefined, 'Deberia haber un resultado valid');
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
      assertEqual(output.exitCode, 0);
      const deriveResult = output.results[0];
      assertEqual(deriveResult.status, 'provable');
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
      assertEqual(deriveResult.status, 'refutable');
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
      assertEqual(output.results[0].status, 'valid');
    });

    it('contingente detectada', () => {
      const source = `
logic classical.propositional
check valid (P -> Q)
`;
      const interpreter = new Interpreter();
      const output = interpreter.execute(source);
      assertEqual(output.results[0].status, 'invalid');
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
      assertEqual(output.results[0].status, 'satisfiable');
    });

    it('insatisfacible (contradiccion)', () => {
      const source = `
logic classical.propositional
check satisfiable (P & !P)
`;
      const interpreter = new Interpreter();
      const output = interpreter.execute(source);
      assertEqual(output.results[0].status, 'unsatisfiable');
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
      assertEqual(output.results[0].status, 'invalid');
      assert(output.results[0].model !== undefined, 'Debe dar modelo');
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
      assertIncludes(output.stdout, 'P');
      assertIncludes(output.stdout, 'Q');
      assertIncludes(output.stdout, 'T');
      assertIncludes(output.stdout, 'F');
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
      assertEqual(output.exitCode, 0, `Exit code deberia ser 0. stderr: ${output.stderr}`);
      assertIncludes(output.stdout, 'Passage p');
      assertIncludes(output.stdout, 'Formalizacion phi');
      assertIncludes(output.stdout, 'Claim c1');
      assertIncludes(output.stdout, 'Support');
      assertIncludes(output.stdout, 'Confidence');
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
      assertEqual(output.results[0].status, 'valid');
    });
  });

  describe('Interpreter — errores', () => {
    it('error sin perfil logico', () => {
      const source = `axiom a1 = P`;
      const interpreter = new Interpreter();
      const output = interpreter.execute(source);
      assert(output.exitCode !== 0, 'Deberia fallar sin perfil');
    });

    it('perfil inexistente', () => {
      const source = `logic inexistente.perfil`;
      const interpreter = new Interpreter();
      const output = interpreter.execute(source);
      assert(output.exitCode !== 0, 'Deberia fallar con perfil desconocido');
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
      assertEqual(output.results[0].status, 'provable');
    });
  });
}
