"use strict";
// ============================================================
// ST Tests — CLI / Integration (ejecutan el intérprete completo)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCLITests = runCLITests;
const runner_1 = require("./runner");
const interpreter_1 = require("../runtime/interpreter");
function runCLITests() {
    (0, runner_1.describe)('Interpreter — script completo (criterio de exito 02)', () => {
        (0, runner_1.it)('ejecuta el script de criterio de exito del Logic Core', () => {
            const source = `
logic classical.propositional

axiom a1 = P -> Q
axiom a2 = P

derive Q from {a1, a2}
check valid ((P -> Q) -> (!Q -> !P))
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source, 'test.st');
            (0, runner_1.assertEqual)(output.exitCode, 0, `Exit code deberia ser 0, fue ${output.exitCode}. stderr: ${output.stderr}`);
            (0, runner_1.assertIncludes)(output.stdout, 'Perfil logico: classical.propositional');
            (0, runner_1.assertIncludes)(output.stdout, 'derivado');
            // El check valid debe dar valid (es contraposicion, tautologia)
            const validResult = output.results.find(r => r.status === 'valid');
            (0, runner_1.assert)(validResult !== undefined, 'Deberia haber un resultado valid');
        });
    });
    (0, runner_1.describe)('Interpreter — derivaciones', () => {
        (0, runner_1.it)('Modus Ponens simple', () => {
            const source = `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
derive Q from {a1, a2}
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.exitCode, 0);
            const deriveResult = output.results[0];
            (0, runner_1.assertEqual)(deriveResult.status, 'provable');
        });
        (0, runner_1.it)('derivacion que falla', () => {
            const source = `
logic classical.propositional
axiom a1 = P
derive Q from {a1}
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            const deriveResult = output.results[0];
            (0, runner_1.assertEqual)(deriveResult.status, 'refutable');
        });
    });
    (0, runner_1.describe)('Interpreter — check valid', () => {
        (0, runner_1.it)('tautologia detectada', () => {
            const source = `
logic classical.propositional
check valid (P | !P)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'valid');
        });
        (0, runner_1.it)('contingente detectada', () => {
            const source = `
logic classical.propositional
check valid (P -> Q)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'invalid');
        });
    });
    (0, runner_1.describe)('Interpreter — check satisfiable', () => {
        (0, runner_1.it)('satisfacible', () => {
            const source = `
logic classical.propositional
check satisfiable (P & Q)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'satisfiable');
        });
        (0, runner_1.it)('insatisfacible (contradiccion)', () => {
            const source = `
logic classical.propositional
check satisfiable (P & !P)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'unsatisfiable');
        });
    });
    (0, runner_1.describe)('Interpreter — countermodel', () => {
        (0, runner_1.it)('encuentra contramodelo', () => {
            const source = `
logic classical.propositional
countermodel (P -> Q)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'invalid');
            (0, runner_1.assert)(output.results[0].model !== undefined, 'Debe dar modelo');
        });
    });
    (0, runner_1.describe)('Interpreter — truth_table', () => {
        (0, runner_1.it)('genera tabla de verdad', () => {
            const source = `
logic classical.propositional
truth_table (P & Q)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertIncludes)(output.stdout, 'P');
            (0, runner_1.assertIncludes)(output.stdout, 'Q');
            (0, runner_1.assertIncludes)(output.stdout, 'T');
            (0, runner_1.assertIncludes)(output.stdout, 'F');
        });
    });
    (0, runner_1.describe)('Interpreter — text layer completo', () => {
        (0, runner_1.it)('ejecuta script con text layer (criterio exito 04)', () => {
            const source = `
logic classical.propositional

let p = passage([[clase-logica.md#b8]])
let phi = formalize p as (P -> Q)

claim c1 = phi
support c1 <- p
confidence c1 = 0.84
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.exitCode, 0, `Exit code deberia ser 0. stderr: ${output.stderr}`);
            (0, runner_1.assertIncludes)(output.stdout, 'Passage p');
            (0, runner_1.assertIncludes)(output.stdout, 'Formalizacion phi');
            (0, runner_1.assertIncludes)(output.stdout, 'Claim c1');
            (0, runner_1.assertIncludes)(output.stdout, 'Support');
            (0, runner_1.assertIncludes)(output.stdout, 'Confidence');
        });
    });
    (0, runner_1.describe)('Interpreter — check equivalent', () => {
        (0, runner_1.it)('P->Q equivale a !P|Q', () => {
            const source = `
logic classical.propositional
check equivalent (P -> Q), (!P | Q)
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'valid');
        });
    });
    (0, runner_1.describe)('Interpreter — errores', () => {
        (0, runner_1.it)('error sin perfil logico', () => {
            const source = `axiom a1 = P`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assert)(output.exitCode !== 0, 'Deberia fallar sin perfil');
        });
        (0, runner_1.it)('perfil inexistente', () => {
            const source = `logic inexistente.perfil`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assert)(output.exitCode !== 0, 'Deberia fallar con perfil desconocido');
        });
    });
    (0, runner_1.describe)('Interpreter — prove', () => {
        (0, runner_1.it)('prueba desde teoria', () => {
            const source = `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
prove Q from {a1, a2}
`;
            const interpreter = new interpreter_1.Interpreter();
            const output = interpreter.execute(source);
            (0, runner_1.assertEqual)(output.results[0].status, 'provable');
        });
    });
}
//# sourceMappingURL=cli.test.js.map