"use strict";
// ============================================================
// ST Runtime — Intérprete de scripts .st
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const parser_1 = require("../parser/parser");
const interface_1 = require("../profiles/interface");
const propositional_1 = require("../profiles/classical/propositional");
const first_order_1 = require("../profiles/classical/first-order");
const k_1 = require("../profiles/modal/k");
const belnap_1 = require("../profiles/paraconsistent/belnap");
const compiler_1 = require("../text-layer/compiler");
// Registrar todos los perfiles
function ensureProfilesRegistered() {
    if (!interface_1.registry.has('classical.propositional')) {
        interface_1.registry.register(new propositional_1.ClassicalPropositional());
    }
    if (!interface_1.registry.has('classical.first_order')) {
        interface_1.registry.register(new first_order_1.ClassicalFirstOrder());
    }
    if (!interface_1.registry.has('modal.k')) {
        interface_1.registry.register(new k_1.ModalK());
    }
    if (!interface_1.registry.has('paraconsistent.belnap')) {
        interface_1.registry.register(new belnap_1.ParaconsistentBelnap());
    }
}
class Interpreter {
    theory;
    profile = null;
    textLayer;
    diagnostics = [];
    results = [];
    stdoutLines = [];
    constructor() {
        this.theory = this.createEmptyTheory();
        this.textLayer = (0, compiler_1.createTextLayerState)();
        ensureProfilesRegistered();
    }
    createEmptyTheory() {
        return {
            profile: '',
            axioms: new Map(),
            theorems: new Map(),
            claims: new Map(),
            judgments: [],
        };
    }
    reset() {
        this.theory = this.createEmptyTheory();
        this.textLayer = (0, compiler_1.createTextLayerState)();
        this.diagnostics = [];
        this.results = [];
        this.stdoutLines = [];
        this.profile = null;
    }
    execute(source, file = '<stdin>') {
        this.diagnostics = [];
        this.results = [];
        this.stdoutLines = [];
        const parser = new parser_1.Parser(file);
        const program = parser.parse(source);
        this.diagnostics.push(...parser.diagnostics);
        if (parser.diagnostics.some(d => d.severity === 'error')) {
            return {
                stdout: '',
                stderr: this.diagnostics.filter(d => d.severity === 'error').map(d => d.message).join('\n'),
                exitCode: 1,
                diagnostics: this.diagnostics,
                results: [],
            };
        }
        for (const stmt of program.statements) {
            try {
                this.executeStatement(stmt);
            }
            catch (e) {
                this.diagnostics.push({
                    severity: 'error',
                    message: e.message || 'Error de runtime',
                    file,
                    line: stmt.source.line,
                    column: stmt.source.column,
                });
            }
        }
        const hasErrors = this.diagnostics.some(d => d.severity === 'error');
        return {
            stdout: this.stdoutLines.join('\n'),
            stderr: this.diagnostics.filter(d => d.severity === 'error').map(d => d.message).join('\n'),
            exitCode: hasErrors ? 3 : 0,
            diagnostics: this.diagnostics,
            results: this.results,
        };
    }
    // Ejecutar un solo statement (para REPL)
    executeSingle(source) {
        const parser = new parser_1.Parser('<repl>');
        const program = parser.parse(source);
        this.diagnostics = [...parser.diagnostics];
        this.results = [];
        this.stdoutLines = [];
        if (parser.diagnostics.some(d => d.severity === 'error')) {
            return {
                stdout: '',
                stderr: parser.diagnostics.map(d => d.message).join('\n'),
                exitCode: 1,
                diagnostics: this.diagnostics,
                results: [],
            };
        }
        for (const stmt of program.statements) {
            try {
                this.executeStatement(stmt);
            }
            catch (e) {
                this.diagnostics.push({
                    severity: 'error',
                    message: e.message || 'Error de runtime',
                });
            }
        }
        return {
            stdout: this.stdoutLines.join('\n'),
            stderr: this.diagnostics.filter(d => d.severity === 'error').map(d => d.message).join('\n'),
            exitCode: this.diagnostics.some(d => d.severity === 'error') ? 3 : 0,
            diagnostics: this.diagnostics,
            results: this.results,
        };
    }
    executeStatement(stmt) {
        switch (stmt.kind) {
            case 'logic_decl':
                return this.execLogicDecl(stmt);
            case 'axiom_decl':
                return this.execAxiomDecl(stmt);
            case 'theorem_decl':
                return this.execTheoremDecl(stmt);
            case 'derive_cmd':
                return this.execDeriveCmd(stmt);
            case 'check_valid_cmd':
                return this.execCheckValidCmd(stmt);
            case 'check_satisfiable_cmd':
                return this.execCheckSatisfiableCmd(stmt);
            case 'check_equivalent_cmd':
                return this.execCheckEquivalentCmd(stmt);
            case 'prove_cmd':
                return this.execProveCmd(stmt);
            case 'countermodel_cmd':
                return this.execCountermodelCmd(stmt);
            case 'truth_table_cmd':
                return this.execTruthTableCmd(stmt);
            case 'let_decl':
                return this.execLetDecl(stmt);
            case 'claim_decl':
                return this.execClaimDecl(stmt);
            case 'support_decl':
                return this.execSupportDecl(stmt);
            case 'confidence_decl':
                return this.execConfidenceDecl(stmt);
            case 'context_decl':
                return this.execContextDecl(stmt);
            case 'render_cmd':
                return this.execRenderCmd(stmt);
        }
    }
    requireProfile() {
        if (!this.profile) {
            throw new Error('No se ha declarado un perfil logico. Use: logic <perfil>');
        }
        return this.profile;
    }
    execLogicDecl(stmt) {
        const p = interface_1.registry.get(stmt.profile);
        if (!p) {
            throw new Error(`Perfil logico desconocido: '${stmt.profile}'. Disponibles: ${interface_1.registry.list().join(', ')}`);
        }
        this.profile = p;
        this.theory.profile = stmt.profile;
        this.emit(`Perfil logico: ${stmt.profile}`);
    }
    execAxiomDecl(stmt) {
        this.requireProfile();
        const diags = this.profile.checkWellFormed(stmt.formula);
        this.diagnostics.push(...diags);
        this.theory.axioms.set(stmt.name, stmt.formula);
        this.emit(`Axioma ${stmt.name} = ${(0, propositional_1.formulaToString)(stmt.formula)}`);
    }
    execTheoremDecl(stmt) {
        this.requireProfile();
        const diags = this.profile.checkWellFormed(stmt.formula);
        this.diagnostics.push(...diags);
        this.theory.theorems.set(stmt.name, stmt.formula);
        this.emit(`Teorema ${stmt.name} = ${(0, propositional_1.formulaToString)(stmt.formula)}`);
    }
    execDeriveCmd(stmt) {
        const profile = this.requireProfile();
        const result = profile.derive(stmt.goal, stmt.premises, this.theory);
        this.results.push(result);
        this.emitResult('derive', result);
    }
    execCheckValidCmd(stmt) {
        const profile = this.requireProfile();
        const result = profile.checkValid(stmt.formula);
        this.results.push(result);
        this.emitResult('check valid', result);
    }
    execCheckSatisfiableCmd(stmt) {
        const profile = this.requireProfile();
        const result = profile.checkSatisfiable(stmt.formula);
        this.results.push(result);
        this.emitResult('check satisfiable', result);
    }
    execCheckEquivalentCmd(stmt) {
        const profile = this.requireProfile();
        if (!profile.checkEquivalent) {
            throw new Error('Este perfil no soporta check equivalent');
        }
        const result = profile.checkEquivalent(stmt.left, stmt.right);
        this.results.push(result);
        this.emitResult('check equivalent', result);
    }
    execProveCmd(stmt) {
        const profile = this.requireProfile();
        const result = profile.prove(stmt.goal, this.theory);
        this.results.push(result);
        this.emitResult('prove', result);
    }
    execCountermodelCmd(stmt) {
        const profile = this.requireProfile();
        const result = profile.countermodel(stmt.formula);
        this.results.push(result);
        this.emitResult('countermodel', result);
    }
    execTruthTableCmd(stmt) {
        const profile = this.requireProfile();
        if (!profile.truthTable) {
            throw new Error('Este perfil no soporta truth_table');
        }
        const tt = profile.truthTable(stmt.formula);
        const result = {
            status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
            output: this.formatTruthTable(stmt.formula, tt),
            truthTable: tt,
            diagnostics: [],
            formula: stmt.formula,
        };
        this.results.push(result);
        this.emit(result.output);
    }
    execLetDecl(stmt) {
        if (stmt.letType === 'passage') {
            const diags = (0, compiler_1.registerPassage)(this.textLayer, stmt.name, stmt.anchorPath);
            this.diagnostics.push(...diags);
            this.emit(`Passage ${stmt.name} = [[${stmt.anchorPath}]]`);
        }
        else if (stmt.letType === 'formalize') {
            const diags = (0, compiler_1.registerFormalization)(this.textLayer, stmt.name, stmt.passageName, stmt.formula);
            this.diagnostics.push(...diags);
            this.emit(`Formalizacion ${stmt.name}: ${stmt.passageName} -> ${(0, propositional_1.formulaToString)(stmt.formula)}`);
        }
    }
    execClaimDecl(stmt) {
        const diags = (0, compiler_1.registerClaim)(this.textLayer, stmt.name, stmt.formula, stmt.value);
        this.diagnostics.push(...diags);
        // También agregar al theory.claims
        const claim = { name: stmt.name, formula: stmt.formula };
        this.theory.claims.set(stmt.name, claim);
        this.emit(`Claim ${stmt.name} registrado`);
    }
    execSupportDecl(stmt) {
        const diags = (0, compiler_1.registerSupport)(this.textLayer, stmt.claimName, stmt.sourceName);
        this.diagnostics.push(...diags);
        this.emit(`Support: ${stmt.claimName} <- ${stmt.sourceName}`);
    }
    execConfidenceDecl(stmt) {
        const diags = (0, compiler_1.registerConfidence)(this.textLayer, stmt.claimName, stmt.value);
        this.diagnostics.push(...diags);
        this.emit(`Confidence: ${stmt.claimName} = ${stmt.value}`);
    }
    execContextDecl(stmt) {
        const diags = (0, compiler_1.registerContext)(this.textLayer, stmt.claimName, stmt.text);
        this.diagnostics.push(...diags);
        this.emit(`Context: ${stmt.claimName} = "${stmt.text}"`);
    }
    execRenderCmd(stmt) {
        // Compilar claims y renderizar
        const diags = (0, compiler_1.compileClaimsToTheory)(this.textLayer, this.theory);
        this.diagnostics.push(...diags);
        this.emit(`Render: ${stmt.target} (format: ${stmt.format})`);
    }
    // --- Output helpers ---
    emit(msg) {
        this.stdoutLines.push(msg);
    }
    emitResult(cmd, result) {
        const statusIcon = this.statusIcon(result.status);
        this.emit(`${statusIcon} [${cmd}] ${result.output || result.status}`);
        if (result.proof && result.proof.steps.length > 0) {
            this.emit('  Prueba:');
            for (const step of result.proof.steps) {
                const premisesStr = step.premises.length > 0 ? ` [de ${step.premises.join(', ')}]` : '';
                this.emit(`    ${step.stepNumber}. ${(0, propositional_1.formulaToString)(step.formula)}  — ${step.justification}${premisesStr}`);
            }
        }
        if (result.model && result.model.valuation) {
            this.emit('  Modelo:');
            for (const [k, v] of Object.entries(result.model.valuation)) {
                this.emit(`    ${k} = ${v}`);
            }
        }
    }
    statusIcon(status) {
        switch (status) {
            case 'valid': return '✓';
            case 'invalid': return '✗';
            case 'satisfiable': return '◎';
            case 'unsatisfiable': return '⊘';
            case 'provable': return '✓';
            case 'refutable': return '✗';
            case 'unknown': return '?';
            case 'error': return '⚠';
            default: return '•';
        }
    }
    formatTruthTable(formula, tt) {
        const lines = [];
        const header = [...tt.variables, (0, propositional_1.formulaToString)(formula)];
        const colWidths = header.map(h => Math.max(h.length, 5));
        // Header
        lines.push(header.map((h, i) => h.padEnd(colWidths[i])).join(' | '));
        lines.push(colWidths.map(w => '-'.repeat(w)).join('-+-'));
        // Rows
        for (const row of tt.rows) {
            const vals = tt.variables.map(v => (row.valuation[v] ? 'T' : 'F'));
            vals.push(row.result ? 'T' : 'F');
            lines.push(vals.map((v, i) => v.padEnd(colWidths[i])).join(' | '));
        }
        lines.push('');
        if (tt.isTautology)
            lines.push('→ Tautologia');
        else if (tt.isContradiction)
            lines.push('→ Contradiccion');
        else
            lines.push('→ Contingente (satisfacible)');
        return lines.join('\n');
    }
    // Getters para el estado (usados por REPL)
    getTheory() { return this.theory; }
    getProfile() { return this.profile; }
    getTextLayer() { return this.textLayer; }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=interpreter.js.map