"use strict";
// ============================================================
// ST Paraconsistent Belnap — Stub (contrato definido)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParaconsistentBelnap = void 0;
const propositional_1 = require("../classical/propositional");
class ParaconsistentBelnap {
    name = 'paraconsistent.belnap';
    description = 'Logica paraconsistente Belnap-Dunn (stub — contrato definido, motor pendiente)';
    checkWellFormed(formula) {
        return [];
    }
    checkValid(formula) {
        return {
            status: 'unknown',
            output: `[paraconsistent.belnap] Motor no implementado aun. Formula: ${(0, propositional_1.formulaToString)(formula)}`,
            diagnostics: [{ severity: 'warning', message: 'Perfil paraconsistent.belnap aun no tiene motor completo' }],
            formula,
        };
    }
    checkSatisfiable(formula) {
        return { status: 'unknown', output: '[paraconsistent.belnap] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
    prove(goal, theory) {
        return { status: 'unknown', output: '[paraconsistent.belnap] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula: goal };
    }
    derive(goal, premises, theory) {
        return { status: 'unknown', output: '[paraconsistent.belnap] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula: goal };
    }
    countermodel(formula) {
        return { status: 'unknown', output: '[paraconsistent.belnap] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
    explain(formula) {
        return { status: 'unknown', output: '[paraconsistent.belnap] No implementado', diagnostics: [{ severity: 'warning', message: 'Motor no implementado' }], formula };
    }
}
exports.ParaconsistentBelnap = ParaconsistentBelnap;
//# sourceMappingURL=belnap.js.map