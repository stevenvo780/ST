/**
 * ST Runtime — Intérprete de scripts .st
 */

import {
  Theory,
  Diagnostic,
  RunResult,
  ExecutionOutput,
  LogicProfile,
  Claim,
  TruthTableResult,
  TextLayerState,
  Formula,
} from '../types';
import { Parser } from '../parser/parser';
import {
  Statement,
  LogicDeclNode,
  AxiomDeclNode,
  TheoremDeclNode,
  DeriveCmdNode,
  CheckValidCmdNode,
  CheckSatisfiableCmdNode,
  CheckEquivalentCmdNode,
  ProveCmdNode,
  CountermodelCmdNode,
  TruthTableCmdNode,
  LetDeclNode,
  ClaimDeclNode,
  SupportDeclNode,
  ConfidenceDeclNode,
  ContextDeclNode,
  RenderCmdNode,
  AnalyzeCmdNode,
  ExplainCmdNode,
  ImportDeclNode,
  ExportDeclNode,
  ProofBlockNode,
  TheoryDeclNode,
  PrintCmdNode,
  SetCmdNode,
  IfStmtNode,
  ForStmtNode,
  WhileStmtNode,
  FnDeclNode,
  ReturnStmtNode,
} from '../ast/nodes';
import { registry } from '../profiles/interface';
import { formulaToString } from '../profiles/classical/propositional';
import { formulaToUnicode } from './format';
import { detectFallacies, FallacyInfo } from './fallacies';
// Barrel import: registra todos los perfiles automáticamente
import '../profiles';
import {
  createTextLayerState,
  registerPassage,
  registerFormalization,
  registerClaim,
  registerSupport,
  registerConfidence,
  registerContext,
  compileClaimsToTheory,
} from '../text-layer/compiler';
import { classifyFormula } from './formula-classifier';

/**
 * Plantilla de una teoría (Clase)
 */
interface TheoryTemplate {
  node: TheoryDeclNode;
  parent?: string;
}

/**
 * Scope de una teoría (OOP): encapsula axiomas, teoremas, let-bindings y descripciones
 */
interface TheoryScope {
  name: string;
  parent?: string;
  letBindings: Map<string, Formula>;
  letDescriptions: Map<string, string>;
  axioms: Map<string, Formula>;
  theorems: Map<string, Formula>;
  /** Miembros privados — no accesibles desde fuera via dot notation */
  privateMembers: Set<string>;
}

const MAX_CALL_DEPTH = 500;

export class Interpreter {
  private theory: Theory;
  private profile: LogicProfile | null = null;
  private textLayer: TextLayerState;
  private diagnostics: Diagnostic[] = [];
  private results: RunResult[] = [];
  private stdoutLines: string[] = [];
  private letBindings: Map<string, Formula> = new Map();
  private letDescriptions: Map<string, string> = new Map();
  private theories: Map<string, TheoryScope> = new Map();
  /** Plantillas de teorías (clases) */
  private theoryTemplates: Map<string, TheoryTemplate> = new Map();
  /** Nombre de la teoría actual (si estamos dentro de una) */
  private currentTheoryName: string | null = null;
  /** Funciones declaradas */
  private functions: Map<string, FnDeclNode> = new Map();
  /** Señal de return activa (para salir de funciones) */
  private returnSignal: boolean = false;
  private returnValue: Formula | undefined = undefined;
  /** Modo importación: solo registrar exports */
  private isImporting: boolean = false;
  /** Elementos exportados por el archivo actual */
  private exportedBindings: Map<string, Formula> = new Map();
  private exportedAxioms: Map<string, Formula> = new Map();
  private exportedTheorems: Map<string, Formula> = new Map();
  private exportedFunctions: Map<string, FnDeclNode> = new Map();
  private exportedTheories: Map<string, TheoryScope> = new Map();
  /** Profundidad de llamadas a funciones (anti-recursión infinita) */
  private callDepth = 0;

  constructor() {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
    this.registerBuiltins();
  }

  /** Registra funciones nativas (Built-ins) para metaprogramación e interactividad */
  private registerBuiltins(): void {
    const builtins = ['typeof', 'is_valid', 'is_satisfiable', 'get_atoms', 'input'];
    for (const name of builtins) {
      this.functions.set(name, {
        kind: 'fn_decl',
        name,
        params: ['arg'],
        body: [],
        source: { line: 0, column: 0 },
      });
    }
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

  private importedFiles: Set<string> = new Set();

  reset(): void {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
    this.diagnostics = [];
    this.results = [];
    this.stdoutLines = [];
    this.profile = null;
    this.importedFiles.clear();
    this.letBindings.clear();
    this.letDescriptions.clear();
    this.theories.clear();
    this.currentTheoryName = null;
    this.functions.clear();
    this.registerBuiltins();
    this.returnSignal = false;
    this.returnValue = undefined;
    this.isImporting = false;
    this.exportedBindings.clear();
    this.exportedAxioms.clear();
    this.exportedTheorems.clear();
    this.exportedFunctions.clear();
    this.exportedTheories.clear();
  }

  execute(source: string, file: string = '<stdin>'): ExecutionOutput {
    this.diagnostics = [];
    this.results = [];
    this.stdoutLines = [];

    const parser = new Parser(file);
    const program = parser.parse(source);
    this.diagnostics.push(...parser.diagnostics);

    if (parser.diagnostics.some((d) => d.severity === 'error')) {
      return {
        stdout: '',
        stderr: this.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.message)
          .join('\n'),
        exitCode: 1,
        diagnostics: this.diagnostics,
        results: [],
      };
    }

    for (const stmt of program.statements) {
      try {
        this.executeStatement(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.diagnostics.push({
          severity: 'error',
          message: message || 'Error de runtime',
          file,
          line: stmt.source.line,
          column: stmt.source.column,
        });
      }
    }

    const hasErrors = this.diagnostics.some((d) => d.severity === 'error');
    return {
      stdout: this.stdoutLines.join('\n'),
      stderr: this.diagnostics
        .filter((d) => d.severity === 'error')
        .map((d) => d.message)
        .join('\n'),
      exitCode: hasErrors ? 3 : 0,
      diagnostics: this.diagnostics,
      results: this.results,
      letDescriptions: Object.fromEntries(this.letDescriptions),
    };
  }

  // Ejecutar un solo statement (para REPL)
  executeSingle(source: string): ExecutionOutput {
    const parser = new Parser('<repl>');
    const program = parser.parse(source);
    this.diagnostics = [...parser.diagnostics];
    this.results = [];
    this.stdoutLines = [];

    if (parser.diagnostics.some((d) => d.severity === 'error')) {
      return {
        stdout: '',
        stderr: parser.diagnostics.map((d) => d.message).join('\n'),
        exitCode: 1,
        diagnostics: this.diagnostics,
        results: [],
      };
    }

    for (const stmt of program.statements) {
      try {
        this.executeStatement(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.diagnostics.push({
          severity: 'error',
          message: message || 'Error de runtime',
        });
      }
    }

    return {
      stdout: this.stdoutLines.join('\n'),
      stderr: this.diagnostics
        .filter((d) => d.severity === 'error')
        .map((d) => d.message)
        .join('\n'),
      exitCode: this.diagnostics.some((d) => d.severity === 'error') ? 3 : 0,
      diagnostics: this.diagnostics,
      results: this.results,
    };
  }

  private executeStatement(stmt: Statement): void {
    if (this.returnSignal) return;

    // Si estamos importando, ignoramos comandos que no sean declaraciones
    const sideEffects = [
      'derive_cmd',
      'check_valid_cmd',
      'check_satisfiable_cmd',
      'check_equivalent_cmd',
      'prove_cmd',
      'countermodel_cmd',
      'truth_table_cmd',
      'print_cmd',
      'analyze_cmd',
      'explain_cmd',
      'render_cmd',
    ];
    if (this.isImporting && (sideEffects.includes(stmt.kind) || stmt.kind === 'logic_decl')) {
      return;
    }

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
      case 'analyze_cmd':
        return this.execAnalyzeCmd(stmt);
      case 'explain_cmd':
        return this.execExplainCmd(stmt);
      case 'import_decl':
        return this.execImportDecl(stmt);
      case 'proof_block':
        return this.execProofBlock(stmt);
      case 'theory_decl':
        return this.execTheoryDecl(stmt);
      case 'print_cmd':
        return this.execPrintCmd(stmt);
      case 'set_cmd':
        return this.execSetCmd(stmt);
      case 'if_stmt':
        return this.execIfStmt(stmt);
      case 'for_stmt':
        return this.execForStmt(stmt);
      case 'while_stmt':
        return this.execWhileStmt(stmt);
      case 'fn_decl':
        return this.execFnDecl(stmt);
      case 'return_stmt':
        return this.execReturnStmt(stmt);
      case 'fn_call':
        this.executeFnCall(stmt);
        return;
      case 'export_decl':
        return this.execExportDecl(stmt);
    }
  }

  private execExportDecl(stmt: ExportDeclNode): void {
    // Ejecutar la declaración interna
    this.executeStatement(stmt.statement);

    // Registrarla como exportada
    const s = stmt.statement;
    switch (s.kind) {
      case 'let_decl':
        if (s.letType === 'formula') {
          this.exportedBindings.set(s.name, this.letBindings.get(s.name) as Formula);
          this.exportedAxioms.set(s.name, this.theory.axioms.get(s.name) as Formula);
        }
        break;
      case 'axiom_decl':
        this.exportedAxioms.set(s.name, this.theory.axioms.get(s.name) as Formula);
        break;
      case 'theorem_decl':
        this.exportedTheorems.set(s.name, this.theory.theorems.get(s.name) as Formula);
        break;
      case 'fn_decl':
        this.exportedFunctions.set(s.name, this.functions.get(s.name) as FnDeclNode);
        break;
      case 'theory_decl':
        this.exportedTheories.set(s.name, this.theories.get(s.name) as TheoryScope);
        break;
    }
  }

  private requireProfile(): LogicProfile {
    const p = this.profile;
    if (!p) {
      throw new Error('No se ha declarado un perfil logico. Use: logic <perfil>');
    }
    return p;
  }

  /**
   * Sustituye recursivamente los átomos que coincidan con variables `let`
   * por sus fórmulas definidas. Detecta ciclos para evitar recursión infinita.
   * Soporta notación con punto: Theory.member resuelve desde el scope de la teoría.
   */
  private resolveFormula(f: Formula, visited: Set<string> = new Set()): Formula {
    const resolved = this.resolveFormulaRecursive(f, visited);
    return this.tryConstantFold(resolved);
  }

  private resolveFormulaRecursive(f: Formula, visited: Set<string> = new Set()): Formula {
    if (!f) return f;

    // Si es un átomo, intentar resolver
    if (f.kind === 'atom' && f.name) {
      // Dot notation: Theory.member o instance.member
      if (f.name.includes('.')) {
        const [prefix, memberName] = f.name.split('.', 2);

        // 1. Intentar resolver el prefijo como una variable local (instancia)
        if (this.letBindings.has(prefix)) {
          const resolvedPrefix = this.letBindings.get(prefix) as Formula;
          if (resolvedPrefix.kind === 'atom' && resolvedPrefix.name) {
            const actualInstanceName = resolvedPrefix.name;
            const scope = this.theories.get(actualInstanceName);
            if (scope) {
              if (
                scope.privateMembers.has(memberName) &&
                this.currentTheoryName !== actualInstanceName
              )
                return f;
              if (scope.letBindings.has(memberName))
                return this.resolveFormulaRecursive(
                  scope.letBindings.get(memberName) as Formula,
                  new Set(visited),
                );
              if (scope.axioms.has(memberName))
                return this.resolveFormulaRecursive(
                  scope.axioms.get(memberName) as Formula,
                  new Set(visited),
                );
              if (scope.theorems.has(memberName))
                return this.resolveFormulaRecursive(
                  scope.theorems.get(memberName) as Formula,
                  new Set(visited),
                );
            }
          }
        }

        // 2. Intentar resolver como nombre de teoría global (Singleton)
        const scope = this.theories.get(prefix);
        if (scope) {
          if (scope.privateMembers.has(memberName) && this.currentTheoryName !== prefix) return f;
          if (scope.letBindings.has(memberName))
            return this.resolveFormulaRecursive(
              scope.letBindings.get(memberName) as Formula,
              new Set(visited),
            );
          if (scope.axioms.has(memberName))
            return this.resolveFormulaRecursive(
              scope.axioms.get(memberName) as Formula,
              new Set(visited),
            );
          if (scope.theorems.has(memberName))
            return this.resolveFormulaRecursive(
              scope.theorems.get(memberName) as Formula,
              new Set(visited),
            );
        }
        return f;
      }

      // Binding local normal
      if (this.letBindings.has(f.name)) {
        if (visited.has(f.name)) return f;
        const newVisited = new Set(visited);
        newVisited.add(f.name);
        return this.resolveFormulaRecursive(this.letBindings.get(f.name) as Formula, newVisited);
      }

      // También resolver axiomas/teoremas del theory actual por nombre
      if (this.theory.axioms.has(f.name)) {
        if (visited.has(f.name)) return f;
        const newVisited = new Set(visited);
        newVisited.add(f.name);
        return this.resolveFormulaRecursive(this.theory.axioms.get(f.name) as Formula, newVisited);
      }
      if (this.theory.theorems.has(f.name)) {
        if (visited.has(f.name)) return f;
        const newVisited = new Set(visited);
        newVisited.add(f.name);
        return this.resolveFormulaRecursive(
          this.theory.theorems.get(f.name) as Formula,
          newVisited,
        );
      }
    }

    // Llamada a función como expresión
    if (f.kind === 'fn_call' && f.name) {
      const result = this.executeFnCall({ name: f.name, args: f.args || [] });
      return result || { kind: 'atom', name: 'undefined', source: f.source };
    }

    // Recorrer hijos recursivamente
    if (f.args && f.args.length > 0) {
      const newArgs = f.args.map((a) =>
        a ? this.resolveFormulaRecursive(a, new Set(visited)) : a,
      );
      return { ...f, args: newArgs };
    }

    return f;
  }

  private execLogicDecl(stmt: LogicDeclNode): void {
    const p = registry.get(stmt.profile);
    if (!p) {
      throw new Error(
        `Perfil logico desconocido: '${stmt.profile}'. Disponibles: ${registry.list().join(', ')}`,
      );
    }
    this.profile = p;
    this.theory.profile = stmt.profile;
    this.emit(`Perfil logico: ${stmt.profile}`);
  }

  private execAxiomDecl(stmt: AxiomDeclNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const diags = profile.checkWellFormed(resolved);
    this.diagnostics.push(...diags);
    this.theory.axioms.set(stmt.name, resolved);
    this.emit(`Axioma ${stmt.name} = ${formulaToString(resolved)}`);
  }

  private execTheoremDecl(stmt: TheoremDeclNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const diags = profile.checkWellFormed(resolved);
    this.diagnostics.push(...diags);
    this.theory.theorems.set(stmt.name, resolved);
    this.emit(`Teorema ${stmt.name} = ${formulaToString(resolved)}`);
  }

  private execDeriveCmd(stmt: DeriveCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.goal);
    const result = profile.derive(resolved, stmt.premises, this.theory);
    this.results.push(result);
    this.emitResult('derive', result);
  }

  private execCheckValidCmd(stmt: CheckValidCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const result = profile.checkValid(resolved);
    this.results.push(result);
    this.emitResult('check valid', result);
  }

  private execCheckSatisfiableCmd(stmt: CheckSatisfiableCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const result = profile.checkSatisfiable(resolved);
    this.results.push(result);
    this.emitResult('check satisfiable', result);
  }

  private execCheckEquivalentCmd(stmt: CheckEquivalentCmdNode): void {
    const profile = this.requireProfile();
    if (!profile.checkEquivalent) {
      throw new Error('Este perfil no soporta check equivalent');
    }
    const resolvedL = this.resolveFormula(stmt.left);
    const resolvedR = this.resolveFormula(stmt.right);
    const result = profile.checkEquivalent(resolvedL, resolvedR);
    this.results.push(result);
    this.emitResult('check equivalent', result);
  }

  private execProveCmd(stmt: ProveCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.goal);
    const result = profile.prove(resolved, this.theory);
    this.results.push(result);
    this.emitResult('prove', result);
  }

  private execCountermodelCmd(stmt: CountermodelCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const result = profile.countermodel(resolved);
    this.results.push(result);
    this.emitResult('countermodel', result);
  }

  private execTruthTableCmd(stmt: TruthTableCmdNode): void {
    const profile = this.requireProfile();
    if (!profile.truthTable) {
      throw new Error('Este perfil no soporta truth_table');
    }
    const formula = this.resolveFormula(stmt.formula);
    const tt = profile.truthTable(formula);
    const result: RunResult = {
      status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
      output: this.formatTruthTable(formula, tt),
      truthTable: tt,
      diagnostics: [],
      formula: formula,
    };
    this.results.push(result);
    if (result.output) this.emit(result.output);
  }

  private execLetDecl(stmt: LetDeclNode): void {
    if (stmt.letType === 'passage') {
      const diags = registerPassage(this.textLayer, stmt.name, stmt.anchorPath);
      this.diagnostics.push(...diags);
      this.emit(`Passage ${stmt.name} = [[${stmt.anchorPath}]]`);
    } else if (stmt.letType === 'formalize' && stmt.passageName && stmt.formula) {
      const formula = stmt.formula;
      const diags = registerFormalization(this.textLayer, stmt.name, stmt.passageName, formula);
      this.diagnostics.push(...diags);
      this.emit(`Formalizacion ${stmt.name}: ${stmt.passageName} -> ${formulaToString(formula)}`);
    } else if (stmt.letType === 'description') {
      this.letDescriptions.set(stmt.name, stmt.description);
      this.emit(`Let ${stmt.name} = "${stmt.description}"`);
    } else if (stmt.letType === 'formula' && stmt.formula) {
      const resolved = this.resolveFormula(stmt.formula);
      this.letBindings.set(stmt.name, resolved);
      this.theory.axioms.set(stmt.name, resolved);
      if ('description' in stmt && stmt.description) {
        this.letDescriptions.set(stmt.name, stmt.description);
        this.emit(`Let ${stmt.name} = "${stmt.description}" : ${formulaToUnicode(resolved)}`);
      } else {
        this.emit(`Let ${stmt.name} = ${formulaToUnicode(resolved)}`);
      }
    }
  }

  private execClaimDecl(stmt: ClaimDeclNode): void {
    const formula = stmt.formula;
    const formalization = stmt.formalization;
    const diags = registerClaim(this.textLayer, stmt.name, formula, formalization);
    this.diagnostics.push(...diags);

    const claim: Claim = {
      name: stmt.name,
      formula: formula,
      formalization: formalization,
    };
    this.theory.claims.set(stmt.name, claim);
    this.emit(`Claim ${stmt.name} registrado`);
  }

  private execSupportDecl(stmt: SupportDeclNode): void {
    const diags = registerSupport(this.textLayer, stmt.claimName, stmt.sourceName);
    this.diagnostics.push(...diags);
    this.emit(`Support: ${stmt.claimName} <- ${stmt.sourceName}`);
  }

  private execConfidenceDecl(stmt: ConfidenceDeclNode): void {
    const diags = registerConfidence(this.textLayer, stmt.claimName, stmt.value);
    this.diagnostics.push(...diags);
    this.emit(`Confidence: ${stmt.claimName} = ${stmt.value}`);
  }

  private execContextDecl(stmt: ContextDeclNode): void {
    const diags = registerContext(this.textLayer, stmt.claimName, stmt.text);
    this.diagnostics.push(...diags);
    this.emit(`Context: ${stmt.claimName} = "${stmt.text}"`);
  }

  private execRenderCmd(stmt: RenderCmdNode): void {
    const diags = compileClaimsToTheory(this.textLayer, this.theory);
    this.diagnostics.push(...diags);

    if (stmt.target === 'claims' || stmt.target === 'all') {
      this.emit(`── Render: ${stmt.target} (${stmt.format}) ──`);
      for (const [name, claim] of this.theory.claims) {
        const fStr = claim.formula ? formulaToUnicode(claim.formula) : '(sin fórmula)';
        this.emit(`  Claim "${name}": ${fStr}`);
        if (claim.support) this.emit(`    Soporte: ${claim.support}`);
        if (claim.confidence !== undefined) this.emit(`    Confianza: ${claim.confidence}`);
        if (claim.context) this.emit(`    Contexto: ${claim.context}`);
      }
      if (this.theory.claims.size === 0) this.emit('  (sin claims registrados)');
    } else if (stmt.target === 'theory') {
      this.emit(`── Render: theory (${stmt.format}) ──`);
      this.emit(`  Perfil: ${this.theory.profile || '(ninguno)'}`);
      this.emit(`  Axiomas: ${this.theory.axioms.size}`);
      for (const [name, formula] of this.theory.axioms) {
        this.emit(`    ${name} = ${formulaToUnicode(formula)}`);
      }
      this.emit(`  Teoremas: ${this.theory.theorems.size}`);
      for (const [name, formula] of this.theory.theorems) {
        this.emit(`    ${name} = ${formulaToUnicode(formula)}`);
      }
      this.emit(`  Claims: ${this.theory.claims.size}`);
    } else {
      const axiom = this.theory.axioms.get(stmt.target);
      if (axiom) {
        this.emit(`  ${stmt.target} = ${formulaToUnicode(axiom)}`);
        return;
      }
      const claim = this.theory.claims.get(stmt.target);
      if (claim) {
        const fStr = claim.formula ? formulaToUnicode(claim.formula) : '(sin fórmula)';
        this.emit(`  Claim "${stmt.target}": ${fStr}`);
        return;
      }
      this.emit(`Render: ${stmt.target} (${stmt.format})`);
    }
  }

  private execAnalyzeCmd(stmt: AnalyzeCmdNode): void {
    const profile = this.requireProfile();
    const premises = stmt.premises.map((p) => this.resolveFormula(p));
    const conclusion = this.resolveFormula(stmt.conclusion);
    const fallacies = detectFallacies(premises, conclusion, profile);
    const pStr = premises.map((p) => formulaToUnicode(p)).join(', ');
    const cStr = formulaToUnicode(conclusion);

    if (fallacies.length === 0) {
      const conj: Formula =
        premises.length === 0
          ? conclusion
          : premises.length === 1
            ? premises[0]
            : premises.reduce<Formula>((a, b) => ({ kind: 'and', args: [a, b] }), premises[0]);
      const impl: Formula =
        premises.length === 0 ? conclusion : { kind: 'implies', args: [conj, conclusion] };
      const result = profile.checkValid(impl);
      if (result.status === 'valid') {
        this.emit(`✓ [analyze] {${pStr}} → ${cStr}`);
        this.emit('  Inferencia VÁLIDA — no se detectaron falacias');
      } else {
        this.emit(`⚠ [analyze] {${pStr}} → ${cStr}`);
        this.emit('  Inferencia NO VÁLIDA — pero no corresponde a un patrón de falacia conocido');
      }
      this.results.push({
        status: result.status,
        output: result.output,
        diagnostics: [],
        formula: conclusion,
      });
    } else {
      this.emit(`⚠ [analyze] {${pStr}} → ${cStr}`);
      for (const f of fallacies) {
        this.emit(`  ⚠ Falacia detectada: ${f.name}`);
        this.emit(`    ${f.description}`);
        if (f.pattern) this.emit(`    Patrón: ${f.pattern}`);
      }
      this.results.push({
        status: 'invalid',
        output: `Falacias detectadas: ${fallacies.map((f: FallacyInfo) => f.name).join(', ')}`,
        diagnostics: fallacies.map((f: FallacyInfo) => ({
          severity: 'warning' as const,
          message: `Falacia: ${f.name} — ${f.description}`,
        })),
        formula: conclusion,
      });
    }
  }

  private execProofBlock(stmt: ProofBlockNode): void {
    const profile = this.requireProfile();
    const savedAxioms = new Map(this.theory.axioms);
    const savedLetBindings = new Map(this.letBindings);
    const savedLetDescriptions = new Map(this.letDescriptions);

    this.emit('── Proof Block ──');
    for (const assumption of stmt.assumptions) {
      const resolved = this.resolveFormula(assumption.formula);
      this.theory.axioms.set(assumption.name, resolved);
      this.emit(`  assume ${assumption.name} = ${formulaToUnicode(resolved)}`);
    }
    const resolvedGoal = this.resolveFormula(stmt.goal);
    this.emit(`  show ${formulaToUnicode(resolvedGoal)}`);

    for (const bodyStmt of stmt.body) {
      try {
        this.executeStatement(bodyStmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.diagnostics.push({
          severity: 'error',
          message,
          file: stmt.source.file,
          line: bodyStmt.source.line,
          column: bodyStmt.source.column,
        });
      }
    }

    const premiseNames = stmt.assumptions.map((a) => a.name);
    const result = profile.derive(resolvedGoal, premiseNames, this.theory);
    this.results.push(result);

    if (result.status === 'valid' || result.status === 'provable') {
      this.emit(`  ✓ QED — ${formulaToUnicode(resolvedGoal)} demostrado`);
      const theoremName = `proof_${this.theory.theorems.size + 1}`;
      let implication: Formula = resolvedGoal;
      for (let i = stmt.assumptions.length - 1; i >= 0; i--) {
        implication = { kind: 'implies', args: [stmt.assumptions[i].formula, implication] };
      }
      this.theory.theorems.set(theoremName, implication);
    } else {
      this.emit(`  ✗ QED fallido — no se pudo demostrar ${formulaToUnicode(resolvedGoal)}`);
    }

    this.theory.axioms = savedAxioms;
    this.letBindings = savedLetBindings;
    this.letDescriptions = savedLetDescriptions;
    this.emit('── End Proof Block ──');
  }

  private execTheoryDecl(stmt: TheoryDeclNode): void {
    if (stmt.params && stmt.params.length > 0) {
      this.theoryTemplates.set(stmt.name, { node: stmt, parent: stmt.parent });
      this.emit(`Teoría (plantilla) ${stmt.name}(${stmt.params.join(', ')}) declarada`);
      return;
    }
    this.instantiateTheory(stmt);
  }

  private instantiateTheory(
    node: TheoryDeclNode,
    instanceName?: string,
    args: Formula[] = [],
  ): string {
    const theoryName = instanceName || node.name;
    const scope: TheoryScope = {
      name: theoryName,
      parent: node.parent,
      letBindings: new Map(),
      letDescriptions: new Map(),
      axioms: new Map(),
      theorems: new Map(),
      privateMembers: new Set(),
    };

    if (node.parent) {
      const parentScope = this.theories.get(node.parent);
      if (!parentScope) throw new Error(`Teoría padre '${node.parent}' no encontrada.`);
      for (const [k, v] of parentScope.letBindings)
        if (!parentScope.privateMembers.has(k)) scope.letBindings.set(k, v);
      for (const [k, v] of parentScope.letDescriptions)
        if (!parentScope.privateMembers.has(k)) scope.letDescriptions.set(k, v);
      for (const [k, v] of parentScope.axioms)
        if (!parentScope.privateMembers.has(k)) scope.axioms.set(k, v);
      for (const [k, v] of parentScope.theorems)
        if (!parentScope.privateMembers.has(k)) scope.theorems.set(k, v);
    }

    const savedLetBindings = new Map(this.letBindings);
    const savedLetDescriptions = new Map(this.letDescriptions);
    const savedAxioms = new Map(this.theory.axioms);
    const savedTheorems = new Map(this.theory.theorems);
    const savedTheoryName = this.currentTheoryName;

    if (node.params && args.length > 0) {
      for (let i = 0; i < node.params.length; i++) {
        if (i < args.length) {
          const resolvedArg = this.resolveFormula(args[i]);
          this.letBindings.set(node.params[i], resolvedArg);
          scope.letBindings.set(node.params[i], resolvedArg);
        }
      }
    }

    for (const [k, v] of scope.letBindings) this.letBindings.set(k, v);
    for (const [k, v] of scope.letDescriptions) this.letDescriptions.set(k, v);
    for (const [k, v] of scope.axioms) this.theory.axioms.set(k, v);
    for (const [k, v] of scope.theorems) this.theory.theorems.set(k, v);

    this.currentTheoryName = theoryName;
    this.emit(`── Instanciando Theory ${theoryName} ──`);

    for (const member of node.members) {
      const memberStmt = member.statement;
      const memberName = 'name' in memberStmt ? (memberStmt as { name: string }).name : null;
      if (member.visibility === 'private' && memberName) scope.privateMembers.add(memberName);
      try {
        this.executeStatement(memberStmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.diagnostics.push({
          severity: 'error',
          message: `[theory ${theoryName}] ${message}`,
          file: node.source.file,
          line: memberStmt.source.line,
          column: memberStmt.source.column,
        });
      }
    }

    for (const [k, v] of this.letBindings)
      if (!savedLetBindings.has(k)) scope.letBindings.set(k, v);
    for (const [k, v] of this.letDescriptions)
      if (!savedLetDescriptions.has(k)) scope.letDescriptions.set(k, v);
    for (const [k, v] of this.theory.axioms) if (!savedAxioms.has(k)) scope.axioms.set(k, v);
    for (const [k, v] of this.theory.theorems) if (!savedTheorems.has(k)) scope.theorems.set(k, v);

    this.letBindings = savedLetBindings;
    this.letDescriptions = savedLetDescriptions;
    this.theory.axioms = savedAxioms;
    this.theory.theorems = savedTheorems;
    this.currentTheoryName = savedTheoryName;

    this.theories.set(theoryName, scope);
    this.emit(`── End Theory Instance ${theoryName} ──`);
    return theoryName;
  }

  private execPrintCmd(stmt: PrintCmdNode): void {
    if (stmt.value !== null) this.emit(stmt.value);
    else if (stmt.formula) {
      const resolved = this.resolveFormula(stmt.formula);
      this.emit(formulaToUnicode(resolved));
    }
  }

  private execSetCmd(stmt: SetCmdNode): void {
    const resolved = this.resolveFormula(stmt.formula);
    this.letBindings.set(stmt.name, resolved);
    this.theory.axioms.set(stmt.name, resolved);
    this.emit(`Set ${stmt.name} = ${formulaToUnicode(resolved)}`);
  }

  private execIfStmt(stmt: IfStmtNode): void {
    const profile = this.requireProfile();
    for (const branch of stmt.branches) {
      const resolved = this.resolveFormula(branch.formula);
      let matched: boolean;
      if (branch.condition === 'valid' || branch.condition === 'invalid') {
        const result = profile.checkValid(resolved);
        matched =
          branch.condition === 'valid' ? result.status === 'valid' : result.status !== 'valid';
      } else {
        const result = profile.checkSatisfiable(resolved);
        matched =
          branch.condition === 'satisfiable'
            ? result.status === 'satisfiable' || result.status === 'valid'
            : result.status === 'unsatisfiable';
      }
      if (matched) {
        for (const bodyStmt of branch.body) {
          if (this.returnSignal) return;
          this.executeStatement(bodyStmt);
        }
        return;
      }
    }
    if (stmt.elseBranch) {
      for (const bodyStmt of stmt.elseBranch) {
        if (this.returnSignal) return;
        this.executeStatement(bodyStmt);
      }
    }
  }

  private execForStmt(stmt: ForStmtNode): void {
    const savedBinding = this.letBindings.get(stmt.variable);
    for (const item of stmt.items) {
      if (this.returnSignal) break;
      const resolved = this.resolveFormula(item);
      this.letBindings.set(stmt.variable, resolved);
      for (const bodyStmt of stmt.body) {
        if (this.returnSignal) break;
        this.executeStatement(bodyStmt);
      }
    }
    if (savedBinding !== undefined) this.letBindings.set(stmt.variable, savedBinding);
    else this.letBindings.delete(stmt.variable);
  }

  private execWhileStmt(stmt: WhileStmtNode): void {
    const profile = this.requireProfile();
    const maxIter = stmt.maxIterations || 1000;
    let iter = 0;
    while (iter < maxIter) {
      if (this.returnSignal) break;
      iter++;
      const resolved = this.resolveFormula(stmt.formula);
      let matched: boolean;
      if (stmt.condition === 'valid' || stmt.condition === 'invalid') {
        const result = profile.checkValid(resolved);
        matched =
          stmt.condition === 'valid' ? result.status === 'valid' : result.status !== 'valid';
      } else {
        const result = profile.checkSatisfiable(resolved);
        matched =
          stmt.condition === 'satisfiable'
            ? result.status === 'satisfiable' || result.status === 'valid'
            : result.status === 'unsatisfiable';
      }
      if (!matched) break;
      for (const bodyStmt of stmt.body) {
        if (this.returnSignal) break;
        this.executeStatement(bodyStmt);
      }
    }
    if (iter >= maxIter) {
      this.diagnostics.push({
        severity: 'warning',
        message: `while: se alcanzó el límite de ${maxIter} iteraciones`,
        file: stmt.source.file,
        line: stmt.source.line,
        column: stmt.source.column,
      });
    }
  }

  private execFnDecl(stmt: FnDeclNode): void {
    const name = this.currentTheoryName ? `${this.currentTheoryName}.${stmt.name}` : stmt.name;
    this.functions.set(name, stmt);
    if (this.currentTheoryName)
      this.emit(`Función de instancia ${name}(${stmt.params.join(', ')}) declarada`);
    else this.emit(`Función ${name}(${stmt.params.join(', ')}) declarada`);
  }

  private execReturnStmt(stmt: ReturnStmtNode): void {
    if (stmt.formula) this.returnValue = this.resolveFormula(stmt.formula);
    else this.returnValue = undefined;
    this.returnSignal = true;
  }

  private executeFnCall(stmt: { name: string; args: Formula[] }): Formula | undefined {
    this.callDepth++;
    if (this.callDepth > MAX_CALL_DEPTH) {
      this.callDepth--;
      throw new Error(`Límite de recursión excedido (${MAX_CALL_DEPTH}).`);
    }
    try {
      if (['typeof', 'is_valid', 'is_satisfiable', 'get_atoms', 'input'].includes(stmt.name)) {
        return this.executeBuiltin(stmt.name, stmt.args);
      }
      if (stmt.name.includes('.')) {
        const [prefix, methodName] = stmt.name.split('.', 2);
        let actualInstanceName = prefix;
        if (this.letBindings.has(prefix)) {
          const resolved = this.letBindings.get(prefix) as Formula;
          if (resolved.kind === 'atom' && resolved.name) actualInstanceName = resolved.name;
        }
        const scope = this.theories.get(actualInstanceName);
        if (scope) {
          const internalFnName = `${actualInstanceName}.${methodName}`;
          const fn = this.functions.get(internalFnName);
          if (fn) return this.executeFunctionInScope(fn, stmt.args, scope);
        }
      }
      const template = this.theoryTemplates.get(stmt.name);
      if (template) {
        const instanceId = `inst_${stmt.name}_${this.theories.size}`;
        this.instantiateTheory(template.node, instanceId, stmt.args);
        return { kind: 'atom', name: instanceId };
      }
      const fn = this.functions.get(stmt.name);
      if (!fn) throw new Error(`Función o Teoría '${stmt.name}' no declarada`);
      if (stmt.args.length !== fn.params.length) throw new Error(`Argumentos incorrectos.`);
      const savedBindings = new Map<string, Formula | undefined>();
      for (const param of fn.params) savedBindings.set(param, this.letBindings.get(param));
      for (let i = 0; i < fn.params.length; i++)
        this.letBindings.set(fn.params[i], this.resolveFormula(stmt.args[i]));
      const savedReturnSignal = this.returnSignal;
      const savedReturnValue = this.returnValue;
      this.returnSignal = false;
      this.returnValue = undefined;
      for (const bodyStmt of fn.body) {
        if (this.returnSignal) break;
        this.executeStatement(bodyStmt);
      }
      const result = this.returnValue;
      this.returnSignal = savedReturnSignal;
      this.returnValue = savedReturnValue;
      for (const param of fn.params) {
        const prev = savedBindings.get(param);
        if (prev !== undefined) this.letBindings.set(param, prev);
        else this.letBindings.delete(param);
      }
      return result;
    } finally {
      this.callDepth--;
    }
  }

  private executeFunctionInScope(
    fn: FnDeclNode,
    args: Formula[],
    scope: TheoryScope,
  ): Formula | undefined {
    this.callDepth++;
    if (this.callDepth > MAX_CALL_DEPTH) {
      this.callDepth--;
      throw new Error(`Límite de recursión excedido.`);
    }
    try {
      const savedBindings = new Map(this.letBindings);
      const savedAxioms = new Map(this.theory.axioms);
      const savedTheorems = new Map(this.theory.theorems);
      const savedTheoryName = this.currentTheoryName;
      for (const [k, v] of scope.letBindings) this.letBindings.set(k, v);
      for (const [k, v] of scope.axioms) this.theory.axioms.set(k, v);
      for (const [k, v] of scope.theorems) this.theory.theorems.set(k, v);
      this.currentTheoryName = scope.name;
      for (let i = 0; i < fn.params.length; i++)
        this.letBindings.set(fn.params[i], this.resolveFormula(args[i]));
      const savedReturnSignal = this.returnSignal;
      const savedReturnValue = this.returnValue;
      this.returnSignal = false;
      this.returnValue = undefined;
      for (const bodyStmt of fn.body) {
        if (this.returnSignal) break;
        this.executeStatement(bodyStmt);
      }
      const result = this.returnValue;
      this.returnSignal = savedReturnSignal;
      this.returnValue = savedReturnValue;
      this.letBindings = savedBindings;
      this.theory.axioms = savedAxioms;
      this.theory.theorems = savedTheorems;
      this.currentTheoryName = savedTheoryName;
      return result;
    } finally {
      this.callDepth--;
    }
  }

  private tryConstantFold(f: Formula): Formula {
    if (!f || !f.args) return f;
    const ARITH_OPS: Record<string, (a: number, b: number) => number> = {
      add: (a, b) => a + b,
      subtract: (a, b) => a - b,
      multiply: (a, b) => a * b,
      divide: (a, b) => (b === 0 ? NaN : a / b),
      modulo: (a, b) => (b === 0 ? NaN : a % b),
    };
    const CMP_OPS: Record<string, (a: number, b: number) => number> = {
      less: (a, b) => (a < b ? 1 : 0),
      greater: (a, b) => (a > b ? 1 : 0),
      less_eq: (a, b) => (a <= b ? 1 : 0),
      greater_eq: (a, b) => (a >= b ? 1 : 0),
    };
    const newArgs = f.args.map((a) => this.tryConstantFold(a));
    if (
      newArgs.length === 2 &&
      newArgs[0].kind === 'number' &&
      newArgs[1].kind === 'number' &&
      (ARITH_OPS[f.kind] || CMP_OPS[f.kind])
    ) {
      const op = ARITH_OPS[f.kind] || CMP_OPS[f.kind];
      const res = op(newArgs[0].value ?? 0, newArgs[1].value ?? 0);
      return { kind: 'number', value: res, source: f.source };
    }
    return { ...f, args: newArgs };
  }

  private executeBuiltin(name: string, args: Formula[]): Formula | undefined {
    const arg = this.resolveFormula(args[0]);
    if (name === 'typeof') {
      let typeStr = 'Formula';
      if (arg.kind === 'number') typeStr = 'Number';
      if (arg.kind === 'atom' && arg.name?.startsWith('"')) typeStr = 'String';
      return { kind: 'atom', name: `"${typeStr}"`, source: arg.source };
    }
    if (name === 'is_valid' || name === 'is_satisfiable') {
      const profile = this.requireProfile();
      try {
        const result =
          name === 'is_valid' ? profile.checkValid(arg) : profile.checkSatisfiable(arg);
        const isTrue = result.status === 'valid' || result.status === 'satisfiable';
        return { kind: 'atom', name: `"${isTrue ? 'True' : 'False'}"`, source: arg.source };
      } catch {
        return { kind: 'atom', name: '"Error"', source: arg.source };
      }
    }
    if (name === 'get_atoms') {
      const atoms = this.collectAtoms(arg);
      return { kind: 'atom', name: `"{ ${atoms.join(', ')} }"`, source: arg.source };
    }
    if (name === 'input') {
      const prompt =
        arg.kind === 'atom' && arg.name?.startsWith('"')
          ? arg.name.replace(/(^"|"$)/g, '')
          : formulaToString(arg);
      let inputStr: string;
      try {
        process.stdout.write(prompt + ' ');
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        const fs = require('fs');
        const buf = Buffer.alloc(256);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const bytesRead = fs.readSync(process.stdin.fd, buf, 0, 256, null) as number;
        inputStr = buf.toString('utf8', 0, bytesRead).trim();
      } catch {
        inputStr = 'interactive_not_supported';
      }
      return { kind: 'atom', name: `"${inputStr}"`, source: arg.source };
    }
    return undefined;
  }

  private execImportDecl(stmt: ImportDeclNode): void {
    let filePath = stmt.path;
    if (!filePath.endsWith('.st')) filePath += '.st';
    if (this.importedFiles.has(filePath)) return;
    this.importedFiles.add(filePath);
    let source: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      const path = require('path');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const resolved: string = path.isAbsolute(filePath)
        ? filePath
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          path.resolve(path.dirname(stmt.source.file || '.'), filePath);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      source = fs.readFileSync(resolved, 'utf-8');
    } catch {
      throw new Error(`No se pudo importar '${filePath}'`);
    }
    const parser = new Parser(filePath);
    const program = parser.parse(source);
    this.diagnostics.push(...parser.diagnostics);
    const prevIsImporting = this.isImporting;
    const prevLetBindings = new Map(this.letBindings);
    const prevAxioms = new Map(this.theory.axioms);
    const prevTheorems = new Map(this.theory.theorems);
    const prevFunctions = new Map(this.functions);
    const prevTheories = new Map(this.theories);
    this.isImporting = true;
    this.letBindings.clear();
    this.theory.axioms.clear();
    this.theory.theorems.clear();
    this.functions.clear();
    this.theories.clear();
    for (const importedStmt of program.statements) this.executeStatement(importedStmt);
    const newExports = {
      bindings: new Map(this.exportedBindings),
      axioms: new Map(this.exportedAxioms),
      theorems: new Map(this.exportedTheorems),
      functions: new Map(this.exportedFunctions),
      theories: new Map(this.exportedTheories),
    };
    this.isImporting = prevIsImporting;
    this.letBindings = prevLetBindings;
    this.theory.axioms = prevAxioms;
    this.theory.theorems = prevTheorems;
    this.functions = prevFunctions;
    this.theories = prevTheories;
    for (const [k, v] of newExports.bindings) this.letBindings.set(k, v);
    for (const [k, v] of newExports.axioms) this.theory.axioms.set(k, v);
    for (const [k, v] of newExports.theorems) this.theory.theorems.set(k, v);
    for (const [k, v] of newExports.functions) this.functions.set(k, v);
    for (const [k, v] of newExports.theories) this.theories.set(k, v);
  }

  private execExplainCmd(stmt: ExplainCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const result = profile.explain(resolved);
    this.results.push(result);
    if (result.output) this.emit(result.output);
  }

  private emit(msg: string): void {
    this.stdoutLines.push(msg);
  }

  private getVerbosity(): string {
    const v = this.letBindings.get('verbose');
    if (v && v.kind === 'atom' && v.name) return v.name.toLowerCase().replace(/(^"|"$)/g, '');
    return 'off';
  }

  private emitResult(cmd: string, result: RunResult): void {
    this.emit(`${this.statusIcon(result.status)} [${cmd}] ${result.output || result.status}`);
    const verbosity = this.getVerbosity();
    if (result.paradoxWarning) this.emit(`  ⚠ PARADOJA: ${result.paradoxWarning}`);
    if (result.formula && (verbosity === 'on' || result.formulaClassification)) {
      const cls = classifyFormula(result.formula);
      const name = result.formulaClassification || cls.formulaClassification;
      if (name) this.emit(`  Identificación: ${name}`);
    }
    if (result.model && (verbosity === 'on' || cmd === 'countermodel')) {
      if (result.model.valuation) {
        this.emit('  Modelo:');
        for (const [k, v] of Object.entries(result.model.valuation)) this.emit(`    ${k} = ${v}`);
      }
    }
    if (result.tableauTrace && result.tableauTrace.length > 0 && verbosity === 'on') {
      this.emit('  Traza del tableau:');
      for (let i = 0; i < result.tableauTrace.length; i++)
        this.emit(`    ${i + 1}. ${String(result.tableauTrace[i])}`);
    }
  }

  private collectAtoms(f: Formula, seen: Set<string> = new Set()): string[] {
    if (!f) return [];
    if (f.kind === 'atom' && f.name && !seen.has(f.name)) {
      seen.add(f.name);
      return [f.name];
    }
    const result: string[] = [];
    if (f.args) for (const arg of f.args) result.push(...this.collectAtoms(arg, seen));
    return result;
  }

  private statusIcon(status: string): string {
    switch (status) {
      case 'valid':
        return '✓';
      case 'invalid':
        return '✗';
      case 'satisfiable':
        return '◎';
      case 'unsatisfiable':
        return '⊘';
      default:
        return '•';
    }
  }

  private formatTruthTable(formula: Formula, _tt: TruthTableResult): string {
    return `Tabla de verdad para ${formulaToString(formula)}`;
  }

  getTheory(): Theory {
    return this.theory;
  }
  getProfile(): LogicProfile | null {
    return this.profile;
  }
  getTextLayer(): TextLayerState {
    return this.textLayer;
  }
  getLetBindings(): Map<string, Formula> {
    return this.letBindings;
  }
  getTheories(): Map<string, TheoryScope> {
    return this.theories;
  }
}
