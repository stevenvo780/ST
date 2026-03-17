"use strict";
// ============================================================
// ST Tests — Parser
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.runParserTests = runParserTests;
const runner_1 = require("./runner");
const parser_1 = require("../parser/parser");
function runParserTests() {
    (0, runner_1.describe)('Parser — logic declaration', () => {
        (0, runner_1.it)('parsea logic classical.propositional', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('logic classical.propositional');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            (0, runner_1.assertEqual)(program.statements[0].kind, 'logic_decl');
            (0, runner_1.assertEqual)(program.statements[0].profile, 'classical.propositional');
        });
    });
    (0, runner_1.describe)('Parser — axiom declaration', () => {
        (0, runner_1.it)('parsea axiom simple', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a1 = P');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            (0, runner_1.assertEqual)(program.statements[0].kind, 'axiom_decl');
            (0, runner_1.assertEqual)(program.statements[0].name, 'a1');
        });
        (0, runner_1.it)('parsea axiom con implicacion', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a1 = P -> Q');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'implies');
        });
    });
    (0, runner_1.describe)('Parser — formulas', () => {
        (0, runner_1.it)('parsea negacion', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = !P');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'not');
            (0, runner_1.assertEqual)(f.args[0].kind, 'atom');
        });
        (0, runner_1.it)('parsea conjuncion', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = P & Q');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'and');
        });
        (0, runner_1.it)('parsea disyuncion', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = P | Q');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'or');
        });
        (0, runner_1.it)('parsea bicondicional', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = P <-> Q');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'biconditional');
        });
        (0, runner_1.it)('respeta precedencia: & antes que |', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = P | Q & R');
            const f = program.statements[0].formula;
            // Debe ser P | (Q & R), no (P | Q) & R
            (0, runner_1.assertEqual)(f.kind, 'or');
            (0, runner_1.assertEqual)(f.args[1].kind, 'and');
        });
        (0, runner_1.it)('parsea parentesis', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = (P | Q) & R');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'and');
            (0, runner_1.assertEqual)(f.args[0].kind, 'or');
        });
        (0, runner_1.it)('asocia implicacion a la derecha', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('axiom a = P -> Q -> R');
            const f = program.statements[0].formula;
            (0, runner_1.assertEqual)(f.kind, 'implies');
            (0, runner_1.assertEqual)(f.args[1].kind, 'implies');
        });
    });
    (0, runner_1.describe)('Parser — commands', () => {
        (0, runner_1.it)('parsea derive', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('derive Q from {a1, a2}');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            (0, runner_1.assertEqual)(program.statements[0].kind, 'derive_cmd');
            (0, runner_1.assertEqual)(program.statements[0].premises.length, 2);
        });
        (0, runner_1.it)('parsea check valid', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('check valid (P -> Q)');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            (0, runner_1.assertEqual)(program.statements[0].kind, 'check_valid_cmd');
        });
        (0, runner_1.it)('parsea check satisfiable', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('check satisfiable (P & Q)');
            (0, runner_1.assertEqual)(program.statements[0].kind, 'check_satisfiable_cmd');
        });
        (0, runner_1.it)('parsea countermodel', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('countermodel (P -> Q)');
            (0, runner_1.assertEqual)(program.statements[0].kind, 'countermodel_cmd');
        });
        (0, runner_1.it)('parsea truth_table', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('truth_table (P & Q)');
            (0, runner_1.assertEqual)(program.statements[0].kind, 'truth_table_cmd');
        });
        (0, runner_1.it)('parsea prove', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('prove Q from {a1, a2}');
            (0, runner_1.assertEqual)(program.statements[0].kind, 'prove_cmd');
        });
    });
    (0, runner_1.describe)('Parser — text layer', () => {
        (0, runner_1.it)('parsea let passage', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('let p = passage([[clase-logica.md#b8]])');
            (0, runner_1.assertEqual)(program.statements.length, 1);
            const stmt = program.statements[0];
            (0, runner_1.assertEqual)(stmt.kind, 'let_decl');
            (0, runner_1.assertEqual)(stmt.letType, 'passage');
            (0, runner_1.assertIncludes)(stmt.anchorPath, 'clase-logica');
        });
        (0, runner_1.it)('parsea let formalize', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('let phi = formalize p as (P -> Q)');
            const stmt = program.statements[0];
            (0, runner_1.assertEqual)(stmt.kind, 'let_decl');
            (0, runner_1.assertEqual)(stmt.letType, 'formalize');
            (0, runner_1.assertEqual)(stmt.passageName, 'p');
        });
        (0, runner_1.it)('parsea support', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('support c1 <- p');
            (0, runner_1.assertEqual)(program.statements[0].kind, 'support_decl');
        });
        (0, runner_1.it)('parsea confidence', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('confidence c1 = 0.84');
            const stmt = program.statements[0];
            (0, runner_1.assertEqual)(stmt.kind, 'confidence_decl');
            (0, runner_1.assertEqual)(stmt.value, 0.84);
        });
        (0, runner_1.it)('parsea context', () => {
            const parser = new parser_1.Parser();
            const program = parser.parse('context c1 = "contexto de ejemplo"');
            const stmt = program.statements[0];
            (0, runner_1.assertEqual)(stmt.kind, 'context_decl');
            (0, runner_1.assertEqual)(stmt.text, 'contexto de ejemplo');
        });
    });
    (0, runner_1.describe)('Parser — programa completo', () => {
        (0, runner_1.it)('parsea script multi-linea', () => {
            const source = `
logic classical.propositional

axiom a1 = P -> Q
axiom a2 = P

derive Q from {a1, a2}
check valid ((P -> Q) -> (!Q -> !P))
`;
            const parser = new parser_1.Parser();
            const program = parser.parse(source);
            (0, runner_1.assertEqual)(parser.diagnostics.filter(d => d.severity === 'error').length, 0);
            (0, runner_1.assert)(program.statements.length >= 4, `Esperaba >= 4 statements, got ${program.statements.length}`);
        });
        (0, runner_1.it)('reporta errores de sintaxis', () => {
            const parser = new parser_1.Parser();
            parser.parse('axiom = invalid syntax 123 @@');
            (0, runner_1.assert)(parser.diagnostics.some(d => d.severity === 'error'), 'Deberia reportar errores');
        });
    });
}
//# sourceMappingURL=parser.test.js.map