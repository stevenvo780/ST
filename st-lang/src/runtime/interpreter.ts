// ============================================================
// ST Runtime — Intérprete de scripts .st
// ============================================================

import {
  Formula, Theory, Diagnostic, RunResult, ExecutionOutput,
  LogicProfile, Claim, TruthTableResult, Valuation
} from '../types';
import { Parser } from '../parser/parser';
import { Program, Statement } from '../ast/nodes';
import { registry } from '../profiles/interface';
import { ClassicalPropositional, formulaToString } from '../profiles/classical/propositional';
import { ClassicalFirstOrder } from '../profiles/classical/first-order';
import { ModalK } from '../profiles/modal/k';
import { ParaconsistentBelnap } from '../profiles/paraconsistent/belnap';
import {
  TextLayerState, createTextLayerState,
  registerPassage, registerFormalization, registerClaim,
  registerSupport, registerConfidence, registerContext,
  compileClaimsToTheory
} from '../text-layer/compiler';

// Registrar todos los perfiles
function ensureProfilesRegistered() {
  if (!registry.has('classical.propositional')) {
    registry.register(new ClassicalPropositional());
  }
  if (!registry.has('classical.first_order')) {
    registry.register(new ClassicalFirstOrder());
  }
  if (!registry.has('modal.k')) {
    registry.register(new ModalK());
  }
  if (!registry.has('paraconsistent.belnap')) {
    registry.register(new ParaconsistentBelnap());
  }
}

export class Interpreter {
  private theory: Theory;
  private profile: LogicProfile | null = null;
  private textLayer: TextLayerState;
  private diagnostics: Diagnostic[] = [];
  private results: RunResult[] = [];
  private stdoutLines: string[] = [];

  constructor() {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
    ensureProfilesRegistered();
  }

  private createEmptyTheory(): Theory {
    return {
      profile: '',
      axioms: new Map(),
      theorems: new Map(),
      claims: new Map(),
      judgments: [],
    };
  }

  reset(): void {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
    this.diagnostics = [];
    this.results = [];
    this.stdoutLines = [];
    this.profile = null;
  }

  execute(source: string, file: string = '<stdin>'): ExecutionOutput {
    this.diagnostics = [];
    this.results = [];
    this.stdoutLines = [];

    const parser = new Parser(file);
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
      } catch (e: any) {
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
  executeSingle(source: string): ExecutionOutput {
    const parser = new Parser('<repl>');
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
      } catch (e: any) {
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

  private executeStatement(stmt: Statement): void {
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

  private requireProfile(): LogicProfile {
    if (!this.profile) {
      throw new Error('No se ha declarado un perfil logico. Use: logic <perfil>');
    }
    return this.profile;
  }

  private execLogicDecl(stmt: any): void {
    const p = registry.get(stmt.profile);
    if (!p) {
      throw new Error(`Perfil logico desconocido: '${stmt.profile}'. Disponibles: ${registry.list().join(', ')}`);
    }
    this.profile = p;
    this.theory.profile = stmt.profile;
    this.emit(`Perfil logico: ${stmt.profile}`);
  }

  private execAxiomDecl(stmt: any): void {
    this.requireProfile();
    const diags = this.profile!.checkWellFormed(stmt.formula);
    this.diagnostics.push(...diags);
    this.theory.axioms.set(stmt.name, stmt.formula);
    this.emit(`Axioma ${stmt.name} = ${formulaToString(stmt.formula)}`);
  }

  private execTheoremDecl(stmt: any): void {
    this.requireProfile();
    const diags = this.profile!.checkWellFormed(stmt.formula);
    this.diagnostics.push(...diags);
    this.theory.theorems.set(stmt.name, stmt.formula);
    this.emit(`Teorema ${stmt.name} = ${formulaToString(stmt.formula)}`);
  }

  private execDeriveCmd(stmt: any): void {
    const profile = this.requireProfile();
    const result = profile.derive(stmt.goal, stmt.premises, this.theory);
    this.results.push(result);
    this.emitResult('derive', result);
  }

  private execCheckValidCmd(stmt: any): void {
    const profile = this.requireProfile();
    const result = profile.checkValid(stmt.formula);
    this.results.push(result);
    this.emitResult('check valid', result);
  }

  private execCheckSatisfiableCmd(stmt: any): void {
    const profile = this.requireProfile();
    const result = profile.checkSatisfiable(stmt.formula);
    this.results.push(result);
    this.emitResult('check satisfiable', result);
  }

  private execCheckEquivalentCmd(stmt: any): void {
    const profile = this.requireProfile();
    if (!profile.checkEquivalent) {
      throw new Error('Este perfil no soporta check equivalent');
    }
    const result = profile.checkEquivalent(stmt.left, stmt.right);
    this.results.push(result);
    this.emitResult('check equivalent', result);
  }

  private execProveCmd(stmt: any): void {
    const profile = this.requireProfile();
    const result = profile.prove(stmt.goal, this.theory);
    this.results.push(result);
    this.emitResult('prove', result);
  }

  private execCountermodelCmd(stmt: any): void {
    const profile = this.requireProfile();
    const result = profile.countermodel(stmt.formula);
    this.results.push(result);
    this.emitResult('countermodel', result);
  }

  private execTruthTableCmd(stmt: any): void {
    const profile = this.requireProfile();
    if (!profile.truthTable) {
      throw new Error('Este perfil no soporta truth_table');
    }
    const tt = profile.truthTable(stmt.formula);
    const result: RunResult = {
      status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
      output: this.formatTruthTable(stmt.formula, tt),
      truthTable: tt,
      diagnostics: [],
      formula: stmt.formula,
    };
    this.results.push(result);
    this.emit(result.output!);
  }

  private execLetDecl(stmt: any): void {
    if (stmt.letType === 'passage') {
      const diags = registerPassage(this.textLayer, stmt.name, stmt.anchorPath);
      this.diagnostics.push(...diags);
      this.emit(`Passage ${stmt.name} = [[${stmt.anchorPath}]]`);
    } else if (stmt.letType === 'formalize') {
      const diags = registerFormalization(this.textLayer, stmt.name, stmt.passageName, stmt.formula);
      this.diagnostics.push(...diags);
      this.emit(`Formalizacion ${stmt.name}: ${stmt.passageName} -> ${formulaToString(stmt.formula)}`);
    }
  }

  private execClaimDecl(stmt: any): void {
    const diags = registerClaim(this.textLayer, stmt.name, stmt.formula, stmt.value);
    this.diagnostics.push(...diags);

    // También agregar al theory.claims
    const claim: Claim = { name: stmt.name, formula: stmt.formula };
    this.theory.claims.set(stmt.name, claim);
    this.emit(`Claim ${stmt.name} registrado`);
  }

  private execSupportDecl(stmt: any): void {
    const diags = registerSupport(this.textLayer, stmt.claimName, stmt.sourceName);
    this.diagnostics.push(...diags);
    this.emit(`Support: ${stmt.claimName} <- ${stmt.sourceName}`);
  }

  private execConfidenceDecl(stmt: any): void {
    const diags = registerConfidence(this.textLayer, stmt.claimName, stmt.value);
    this.diagnostics.push(...diags);
    this.emit(`Confidence: ${stmt.claimName} = ${stmt.value}`);
  }

  private execContextDecl(stmt: any): void {
    const diags = registerContext(this.textLayer, stmt.claimName, stmt.text);
    this.diagnostics.push(...diags);
    this.emit(`Context: ${stmt.claimName} = "${stmt.text}"`);
  }

  private execRenderCmd(stmt: any): void {
    // Compilar claims y renderizar
    const diags = compileClaimsToTheory(this.textLayer, this.theory);
    this.diagnostics.push(...diags);
    this.emit(`Render: ${stmt.target} (format: ${stmt.format})`);
  }

  // --- Output helpers ---

  private emit(msg: string): void {
    this.stdoutLines.push(msg);
  }

  private emitResult(cmd: string, result: RunResult): void {
    const statusIcon = this.statusIcon(result.status);
    this.emit(`${statusIcon} [${cmd}] ${result.output || result.status}`);

    if (result.proof && result.proof.steps.length > 0) {
      this.emit('  Prueba:');
      for (const step of result.proof.steps) {
        const premisesStr = step.premises.length > 0 ? ` [de ${step.premises.join(', ')}]` : '';
        this.emit(`    ${step.stepNumber}. ${formulaToString(step.formula)}  — ${step.justification}${premisesStr}`);
      }
    }

    if (result.model && result.model.valuation) {
      this.emit('  Modelo:');
      for (const [k, v] of Object.entries(result.model.valuation)) {
        this.emit(`    ${k} = ${v}`);
      }
    }
  }

  private statusIcon(status: string): string {
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

  private formatTruthTable(formula: Formula, tt: TruthTableResult): string {
    const lines: string[] = [];
    const header = [...tt.variables, formulaToString(formula)];
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
    if (tt.isTautology) lines.push('→ Tautologia');
    else if (tt.isContradiction) lines.push('→ Contradiccion');
    else lines.push('→ Contingente (satisfacible)');

    return lines.join('\n');
  }

  // Getters para el estado (usados por REPL)
  getTheory(): Theory { return this.theory; }
  getProfile(): LogicProfile | null { return this.profile; }
  getTextLayer(): TextLayerState { return this.textLayer; }
}
