"use strict";
// ============================================================
// ST Modal K — Stub (contrato definido)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalK = void 0;
const propositional_1 = require("../classical/propositional");
class ModalK {
    name = 'modal.k';
    description = 'Logica modal K (stub — contrato definido, motor pendiente)';
    checkWellFormed(formula) {
        return [];
    }
    checkValid(formula) {
        return {
            status: 'unknown',
            output: `[modal.k] Motor no implementado aun. Formula: ${(0, propositional_1.formulaToString)(formula)}`,
            diagnostics: [{ severity: 'warning', message: 'Perfil modal.k aun no tiene motor completo' }],
            formula,
        };
    }
    checkSatisfiable(formula) {
        return { status: 'unknown', output: '[modal.k] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
    prove(goal, theory) {
        return { status: 'unknown', output: '[modal.k] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula: goal };
    }
    derive(goal, premises, theory) {
        return { status: 'unknown', output: '[modal.k] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula: goal };
    }
    countermodel(formula) {
        return { status: 'unknown', output: '[modal.k] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
    explain(formula) {
        return { status: 'unknown', output: '[modal.k] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
}
exports.ModalK = ModalK;
//# sourceMappingURL=k.js.map