"use strict";
// ============================================================
// ST Tests — Core (perfiles, motor proposicional)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCoreTests = runCoreTests;
const runner_1 = require("./runner");
const propositional_1 = require("../profiles/classical/propositional");
function makeTheory(axioms) {
    const t = {
        profile: 'classical.propositional',
        axioms: new Map(Object.entries(axioms)),
        theorems: new Map(),
        claims: new Map(),
        judgments: [],
    };
    return t;
}
// Helpers para crear fórmulas
function atom(name) {
    return { kind: 'atom', name };
}
function not(f) {
    return { kind: 'not', args: [f] };
}
function and(a, b) {
    return { kind: 'and', args: [a, b] };
}
function or(a, b) {
    return { kind: 'or', args: [a, b] };
}
function implies(a, b) {
    return { kind: 'implies', args: [a, b] };
}
function biconditional(a, b) {
    return { kind: 'biconditional', args: [a, b] };
}
function runCoreTests() {
    const cp = new propositional_1.ClassicalPropositional();
    (0, runner_1.describe)('ClassicalPropositional.checkWellFormed', () => {
        (0, runner_1.it)('acepta atomo simple', () => {
            const diags = cp.checkWellFormed(atom('P'));
            (0, runner_1.assertEqual)(diags.length, 0);
        });
        (0, runner_1.it)('acepta negacion', () => {
            const diags = cp.checkWellFormed(not(atom('P')));
            (0, runner_1.assertEqual)(diags.length, 0);
        });
        (0, runner_1.it)('acepta implicacion compleja', () => {
            const f = implies(atom('P'), implies(atom('Q'), atom('R')));
            const diags = cp.checkWellFormed(f);
            (0, runner_1.assertEqual)(diags.length, 0);
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.checkValid', () => {
        (0, runner_1.it)('P -> P es tautologia', () => {
            const f = implies(atom('P'), atom('P'));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
        (0, runner_1.it)('P -> (Q -> P) es tautologia', () => {
            const f = implies(atom('P'), implies(atom('Q'), atom('P')));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
        (0, runner_1.it)('(P -> Q) -> (!Q -> !P) es tautologia (contraposicion)', () => {
            const f = implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P'))));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
        (0, runner_1.it)('P -> Q no es tautologia', () => {
            const f = implies(atom('P'), atom('Q'));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'invalid');
        });
        (0, runner_1.it)('P | !P es tautologia (tercero excluido)', () => {
            const f = or(atom('P'), not(atom('P')));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
        (0, runner_1.it)('!(P & !P) es tautologia (no contradiccion)', () => {
            const f = not(and(atom('P'), not(atom('P'))));
            const result = cp.checkValid(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.checkSatisfiable', () => {
        (0, runner_1.it)('P es satisfacible', () => {
            const result = cp.checkSatisfiable(atom('P'));
            (0, runner_1.assertEqual)(result.status, 'satisfiable');
        });
        (0, runner_1.it)('P & !P es insatisfacible', () => {
            const f = and(atom('P'), not(atom('P')));
            const result = cp.checkSatisfiable(f);
            (0, runner_1.assertEqual)(result.status, 'unsatisfiable');
        });
        (0, runner_1.it)('P & Q es satisfacible', () => {
            const f = and(atom('P'), atom('Q'));
            const result = cp.checkSatisfiable(f);
            (0, runner_1.assertEqual)(result.status, 'satisfiable');
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.derive', () => {
        (0, runner_1.it)('Modus Ponens: P, P->Q |- Q', () => {
            const theory = makeTheory({
                a1: implies(atom('P'), atom('Q')),
                a2: atom('P'),
            });
            const result = cp.derive(atom('Q'), ['a1', 'a2'], theory);
            (0, runner_1.assertEqual)(result.status, 'provable');
        });
        (0, runner_1.it)('Modus Tollens: !Q, P->Q |- !P', () => {
            const theory = makeTheory({
                a1: implies(atom('P'), atom('Q')),
                a2: not(atom('Q')),
            });
            const result = cp.derive(not(atom('P')), ['a1', 'a2'], theory);
            (0, runner_1.assertEqual)(result.status, 'provable');
        });
        (0, runner_1.it)('Derivacion encadenada: P, P->Q, Q->R |- R', () => {
            const theory = makeTheory({
                a1: atom('P'),
                a2: implies(atom('P'), atom('Q')),
                a3: implies(atom('Q'), atom('R')),
            });
            const result = cp.derive(atom('R'), ['a1', 'a2', 'a3'], theory);
            (0, runner_1.assertEqual)(result.status, 'provable');
        });
        (0, runner_1.it)('No se puede derivar Q solo de P', () => {
            const theory = makeTheory({
                a1: atom('P'),
            });
            const result = cp.derive(atom('Q'), ['a1'], theory);
            (0, runner_1.assertEqual)(result.status, 'refutable');
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.countermodel', () => {
        (0, runner_1.it)('encuentra contramodelo para P -> Q', () => {
            const f = implies(atom('P'), atom('Q'));
            const result = cp.countermodel(f);
            (0, runner_1.assertEqual)(result.status, 'invalid');
            (0, runner_1.assert)(result.model !== undefined, 'Debe tener modelo');
            (0, runner_1.assert)(result.model.valuation !== undefined, 'Debe tener valuacion');
            (0, runner_1.assertEqual)(result.model.valuation['P'], true);
            (0, runner_1.assertEqual)(result.model.valuation['Q'], false);
        });
        (0, runner_1.it)('no encuentra contramodelo para tautologia', () => {
            const f = implies(atom('P'), atom('P'));
            const result = cp.countermodel(f);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.truthTable', () => {
        (0, runner_1.it)('genera tabla correcta para P & Q', () => {
            const f = and(atom('P'), atom('Q'));
            const tt = cp.truthTable(f);
            (0, runner_1.assertEqual)(tt.variables.length, 2);
            (0, runner_1.assertEqual)(tt.rows.length, 4);
            (0, runner_1.assertEqual)(tt.isTautology, false);
            (0, runner_1.assertEqual)(tt.isSatisfiable, true);
            // Solo P=T,Q=T da true
            const trueRows = tt.rows.filter(r => r.result);
            (0, runner_1.assertEqual)(trueRows.length, 1);
        });
        (0, runner_1.it)('genera tabla correcta para P | !P', () => {
            const f = or(atom('P'), not(atom('P')));
            const tt = cp.truthTable(f);
            (0, runner_1.assertEqual)(tt.isTautology, true);
            (0, runner_1.assertEqual)(tt.isContradiction, false);
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.checkEquivalent', () => {
        (0, runner_1.it)('P->Q y !P|Q son equivalentes', () => {
            const f1 = implies(atom('P'), atom('Q'));
            const f2 = or(not(atom('P')), atom('Q'));
            const result = cp.checkEquivalent(f1, f2);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
        (0, runner_1.it)('P&Q y P|Q no son equivalentes', () => {
            const f1 = and(atom('P'), atom('Q'));
            const f2 = or(atom('P'), atom('Q'));
            const result = cp.checkEquivalent(f1, f2);
            (0, runner_1.assertEqual)(result.status, 'invalid');
        });
        (0, runner_1.it)('De Morgan: !(P&Q) y (!P|!Q) son equivalentes', () => {
            const f1 = not(and(atom('P'), atom('Q')));
            const f2 = or(not(atom('P')), not(atom('Q')));
            const result = cp.checkEquivalent(f1, f2);
            (0, runner_1.assertEqual)(result.status, 'valid');
        });
    });
    (0, runner_1.describe)('ClassicalPropositional.explain', () => {
        (0, runner_1.it)('explica formula correctamente', () => {
            const f = implies(atom('P'), atom('Q'));
            const result = cp.explain(f);
            (0, runner_1.assert)(result.output !== undefined, 'Debe tener output');
            (0, runner_1.assertIncludes)(result.output, 'Variables');
            (0, runner_1.assertIncludes)(result.output, 'Tautologia: no');
        });
    });
    (0, runner_1.describe)('formulaToString', () => {
        (0, runner_1.it)('serializa atomo', () => {
            (0, runner_1.assertEqual)((0, propositional_1.formulaToString)(atom('P')), 'P');
        });
        (0, runner_1.it)('serializa negacion', () => {
            (0, runner_1.assertEqual)((0, propositional_1.formulaToString)(not(atom('P'))), '!P');
        });
        (0, runner_1.it)('serializa implicacion', () => {
            (0, runner_1.assertEqual)((0, propositional_1.formulaToString)(implies(atom('P'), atom('Q'))), '(P -> Q)');
        });
        (0, runner_1.it)('serializa formula compleja', () => {
            const f = implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P'))));
            const str = (0, propositional_1.formulaToString)(f);
            (0, runner_1.assertIncludes)(str, 'P');
            (0, runner_1.assertIncludes)(str, 'Q');
            (0, runner_1.assertIncludes)(str, '->');
        });
    });
}
//# sourceMappingURL=core.test.js.map