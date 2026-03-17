"use strict";
// ============================================================
// ST Classical First-Order — Stub (contrato definido)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassicalFirstOrder = void 0;
const propositional_1 = require("./propositional");
class ClassicalFirstOrder {
    name = 'classical.first_order';
    description = 'Logica clasica de primer orden con igualdad (stub — contrato definido, motor pendiente)';
    checkWellFormed(formula) {
        return [];
    }
    checkValid(formula) {
        return {
            status: 'unknown',
            output: `[classical.first_order] Motor no implementado aun. Formula: ${(0, propositional_1.formulaToString)(formula)}`,
            diagnostics: [{
                    severity: 'warning',
                    message: 'Perfil classical.first_order aun no tiene motor completo',
                }],
            formula,
        };
    }
    checkSatisfiable(formula) {
        return {
            status: 'unknown',
            output: `[classical.first_order] Motor no implementado aun`,
            diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
            formula,
        };
    }
    prove(goal, theory) {
        return {
            status: 'unknown',
            output: `[classical.first_order] prove no implementado aun`,
            diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
            formula: goal,
        };
    }
    derive(goal, premises, theory) {
        return {
            status: 'unknown',
            output: `[classical.first_order] derive no implementado aun`,
            diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
            formula: goal,
        };
    }
    countermodel(formula) {
        return {
            status: 'unknown',
            output: `[classical.first_order] countermodel no implementado aun`,
            diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
            formula,
        };
    }
    explain(formula) {
        return {
            status: 'unknown',
            output: `[classical.first_order] explain no implementado aun`,
            diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }],
            formula,
        };
    }
}
exports.ClassicalFirstOrder = ClassicalFirstOrder;
//# sourceMappingURL=first-order.js.map