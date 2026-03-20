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
import {
  formulaToString,
  collectAtoms,
  evaluateClassical,
  generateValuationsLazy,
} from '../profiles/classical/propositional';
import { evalNumeric } from '../profiles/arithmetic';
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
import { FormulaFactory } from './formula-factory';

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

const MAX_CALL_DEPTH = 10000;
const DEFAULT_MAX_RUNTIME_STEPS = 100000;
const DEFAULT_MAX_RUNTIME_CALLS = 7000;

interface RuntimeStatementFrame {
  kind: 'statements';
  statements: Statement[];
  index: number;
}

interface RuntimeForFrame {
  kind: 'for';
  stmt: ForStmtNode;
  index: number;
  savedBinding: BindingSnapshot;
}

interface RuntimeWhileFrame {
  kind: 'while';
  stmt: WhileStmtNode;
  iterations: number;
}

type RuntimeFrame = RuntimeStatementFrame | RuntimeForFrame | RuntimeWhileFrame;

interface ScopeExecutionSnapshot {
  letBindings: Map<string, Formula>;
  axioms: Map<string, Formula>;
  theorems: Map<string, Formula>;
  theoryName: string | null;
}

interface BindingFrame {
  bindings: Map<string, Formula>;
  descriptions: Map<string, string>;
  parent: BindingFrame | null;
}

interface BindingSnapshot {
  exists: boolean;
  value?: Formula;
  owner: 'global' | BindingFrame;
}

interface FunctionContinuation {
  type: 'discard' | 'let_decl' | 'set_cmd' | 'return_stmt' | 'print_cmd';
  stmt?: LetDeclNode | SetCmdNode | ReturnStmtNode | PrintCmdNode;
}

interface FunctionExecutionFrame {
  name: string;
  runtimeStack: RuntimeFrame[];
  bindingFrame: BindingFrame;
  savedReturnSignal: boolean;
  savedReturnValue: Formula | undefined;
  scopeSnapshot?: ScopeExecutionSnapshot;
  continuation?: FunctionContinuation;
}

interface RuntimeActionExpr {
  action:
    | 'check_valid'
    | 'check_satisfiable'
    | 'check_equivalent'
    | 'derive'
    | 'prove'
    | 'countermodel'
    | 'truth_table'
    | 'explain';
  source: Formula['source'];
  formula?: Formula;
  left?: Formula;
  right?: Formula;
  goal?: Formula;
  premises?: string[];
}

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
  private currentBindingFrame: BindingFrame | null = null;
  private runtimeStepCount = 0;
  private runtimeCallCount = 0;
  /** Cache de resolución: fórmula original → fórmula resuelta (invalidado al cambiar bindings) */
  private resolveCache = new WeakMap<Formula, Formula>();
  private resolveCacheGeneration = 0;

  constructor() {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
    this.registerBuiltins();
  }

  /** Registra funciones nativas (Built-ins) para metaprogramación e interactividad */
  private registerBuiltins(): void {
    const builtins = [
      'typeof',
      'is_valid',
      'is_satisfiable',
      'get_atoms',
      'atoms_of',
      'len',
      'at',
      'formula_eq',
      'input',
    ];
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
    this.currentBindingFrame = null;
    this.runtimeStepCount = 0;
    this.runtimeCallCount = 0;
  }

  private getRuntimeStepLimit(): number {
    const configured = this.getBinding('max_steps') || this.getBinding('max_runtime_steps');
    if (configured?.kind === 'number' && configured.value && configured.value > 0) {
      return Math.floor(configured.value);
    }
    return DEFAULT_MAX_RUNTIME_STEPS;
  }

  private getRuntimeCallLimit(): number {
    const configured = this.getBinding('max_calls') || this.getBinding('max_runtime_calls');
    if (configured?.kind === 'number' && configured.value && configured.value > 0) {
      return Math.floor(configured.value);
    }
    return DEFAULT_MAX_RUNTIME_CALLS;
  }

  private tickRuntimeStep(): void {
    this.runtimeStepCount++;
    const limit = this.getRuntimeStepLimit();
    if (this.runtimeStepCount > limit) {
      throw new Error(`Límite de ejecución excedido (${limit} pasos).`);
    }
  }

  private isSafetyLimitMessage(message: string): boolean {
    return /Límite de (recursión|ejecución|llamadas ST)/i.test(message);
  }

  private createBindingFrame(): BindingFrame {
    return {
      bindings: new Map(),
      descriptions: new Map(),
      parent: this.currentBindingFrame,
    };
  }

  private findBindingOwner(name: string): BindingFrame | 'global' | undefined {
    let frame = this.currentBindingFrame;
    while (frame) {
      if (frame.bindings.has(name)) return frame;
      frame = frame.parent;
    }
    if (this.letBindings.has(name)) return 'global';
    return undefined;
  }

  private hasBinding(name: string): boolean {
    return this.findBindingOwner(name) !== undefined;
  }

  private getBinding(name: string): Formula | undefined {
    const owner = this.findBindingOwner(name);
    if (!owner) return undefined;
    return owner === 'global' ? this.letBindings.get(name) : owner.bindings.get(name);
  }

  private defineBinding(name: string, value: Formula, description?: string): void {
    this.invalidateResolveCache();
    if (this.currentBindingFrame) {
      this.currentBindingFrame.bindings.set(name, value);
      if (description) this.currentBindingFrame.descriptions.set(name, description);
      return;
    }
    this.letBindings.set(name, value);
    if (description) this.letDescriptions.set(name, description);
  }

  private setBinding(name: string, value: Formula): void {
    this.invalidateResolveCache();
    const owner = this.findBindingOwner(name);
    if (owner === 'global') {
      this.letBindings.set(name, value);
      return;
    }
    if (owner) {
      owner.bindings.set(name, value);
      return;
    }
    if (this.currentBindingFrame) {
      this.currentBindingFrame.bindings.set(name, value);
      return;
    }
    this.letBindings.set(name, value);
  }

  private captureBindingSnapshot(name: string): BindingSnapshot {
    const owner = this.findBindingOwner(name);
    if (!owner) return { exists: false, owner: 'global' };
    return {
      exists: true,
      value: owner === 'global' ? this.letBindings.get(name) : owner.bindings.get(name),
      owner,
    };
  }

  private restoreBindingSnapshot(name: string, snapshot: BindingSnapshot): void {
    if (!snapshot.exists) {
      if (this.currentBindingFrame && this.currentBindingFrame.bindings.has(name)) {
        this.currentBindingFrame.bindings.delete(name);
      }
      this.letBindings.delete(name);
      return;
    }

    if (snapshot.owner === 'global') {
      this.letBindings.set(name, snapshot.value as Formula);
      return;
    }

    snapshot.owner.bindings.set(name, snapshot.value as Formula);
  }

  private shouldEmitLocalBindings(): boolean {
    return this.currentBindingFrame === null;
  }

  execute(source: string, file: string = '<stdin>'): ExecutionOutput {
    this.diagnostics = [];
    this.results = [];
    this.stdoutLines = [];
    this.runtimeStepCount = 0;
    this.runtimeCallCount = 0;

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

    this.executeStatementsIterative(program.statements, file);

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
    this.runtimeStepCount = 0;
    this.runtimeCallCount = 0;

    if (parser.diagnostics.some((d) => d.severity === 'error')) {
      return {
        stdout: '',
        stderr: parser.diagnostics.map((d) => d.message).join('\n'),
        exitCode: 1,
        diagnostics: this.diagnostics,
        results: [],
      };
    }

    this.executeStatementsIterative(program.statements, '<repl>');

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

  private executeStatementsIterative(statements: Statement[], fallbackFile?: string): void {
    const runtimeStack: RuntimeFrame[] = [{ kind: 'statements', statements, index: 0 }];

    while (runtimeStack.length > 0) {
      if (this.returnSignal) break;

      const frame = runtimeStack[runtimeStack.length - 1];

      if (frame.kind === 'statements') {
        if (frame.index >= frame.statements.length) {
          runtimeStack.pop();
          continue;
        }

        const stmt = frame.statements[frame.index++];
        try {
          this.dispatchRuntimeStatement(stmt, runtimeStack);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          this.diagnostics.push({
            severity: this.isSafetyLimitMessage(message || '') ? 'warning' : 'error',
            message: message || 'Error de runtime',
            file: stmt.source.file || fallbackFile,
            line: stmt.source.line,
            column: stmt.source.column,
          });
        }
        continue;
      }

      if (frame.kind === 'for') {
        if (this.returnSignal || frame.index >= frame.stmt.items.length) {
          this.restoreBindingSnapshot(frame.stmt.variable, frame.savedBinding);
          runtimeStack.pop();
          continue;
        }

        const resolved = this.evaluateFormulaValue(frame.stmt.items[frame.index]);
        this.setBinding(frame.stmt.variable, resolved);
        frame.index++;
        runtimeStack.push({ kind: 'statements', statements: frame.stmt.body, index: 0 });
        continue;
      }

      if (this.returnSignal) {
        runtimeStack.pop();
        continue;
      }

      const profile = this.requireProfile();
      const maxIter = frame.stmt.maxIterations || 1000;
      if (frame.iterations >= maxIter) {
        this.diagnostics.push({
          severity: 'warning',
          message: `while: se alcanzó el límite de ${maxIter} iteraciones`,
          file: frame.stmt.source.file,
          line: frame.stmt.source.line,
          column: frame.stmt.source.column,
        });
        runtimeStack.pop();
        continue;
      }

      const resolved = this.evaluateFormulaValue(frame.stmt.formula);
      const matched = this.matchesRuntimeCondition(profile, frame.stmt.condition, resolved);

      if (!matched) {
        runtimeStack.pop();
        continue;
      }

      frame.iterations++;
      runtimeStack.push({ kind: 'statements', statements: frame.stmt.body, index: 0 });
    }
  }

  private dispatchRuntimeStatement(stmt: Statement, runtimeStack: RuntimeFrame[]): void {
    if (this.returnSignal) return;
    this.tickRuntimeStep();

    const directCall = this.getDirectFunctionCall(stmt);
    if (directCall) {
      const result = this.executeFnCall(directCall.call);
      this.applyFunctionContinuation({ type: directCall.type, stmt: directCall.stmt }, result);
      return;
    }

    if (this.isImporting) {
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
      if (sideEffects.includes(stmt.kind) || stmt.kind === 'logic_decl') return;
    }

    switch (stmt.kind) {
      case 'if_stmt': {
        const selectedBody = this.selectIfBody(stmt);
        if (selectedBody)
          runtimeStack.push({ kind: 'statements', statements: selectedBody, index: 0 });
        return;
      }
      case 'for_stmt':
        runtimeStack.push({
          kind: 'for',
          stmt,
          index: 0,
          savedBinding: this.captureBindingSnapshot(stmt.variable),
        });
        return;
      case 'while_stmt':
        runtimeStack.push({ kind: 'while', stmt, iterations: 0 });
        return;
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

  private selectIfBody(stmt: IfStmtNode): Statement[] | undefined {
    const profile = this.requireProfile();
    for (const branch of stmt.branches) {
      const resolved = this.evaluateFormulaValue(branch.formula);
      const matched = this.matchesRuntimeCondition(profile, branch.condition, resolved);
      if (matched) return branch.body;
    }
    return stmt.elseBranch;
  }

  private matchesRuntimeCondition(
    profile: LogicProfile,
    condition: 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid',
    formula: Formula,
  ): boolean {
    if (profile.name === 'arithmetic') {
      const numeric = evalNumeric(formula);
      const truthy = !Number.isNaN(numeric) && numeric !== 0;
      if (condition === 'valid' || condition === 'satisfiable') return truthy;
      return !truthy;
    }

    if (condition === 'valid' || condition === 'invalid') {
      const result = profile.checkValid(formula);
      return condition === 'valid' ? result.status === 'valid' : result.status !== 'valid';
    }

    const result = profile.checkSatisfiable(formula);
    return condition === 'satisfiable'
      ? result.status === 'satisfiable' || result.status === 'valid'
      : result.status === 'unsatisfiable';
  }

  private evaluateFormulaValue(formula: Formula): Formula {
    if (formula.kind === 'fn_call' && formula.name) {
      const result = this.executeFnCall({ name: formula.name, args: formula.args || [] });
      return result || { kind: 'atom', name: 'undefined', source: formula.source };
    }
    return this.resolveFormula(formula);
  }

  private getDirectFunctionCall(stmt: Statement):
    | {
        call: { name: string; args: Formula[] };
        type: FunctionContinuation['type'];
        stmt?: LetDeclNode | SetCmdNode | ReturnStmtNode | PrintCmdNode;
      }
    | undefined {
    if (stmt.kind === 'fn_call') {
      return { call: { name: stmt.name, args: stmt.args }, type: 'discard' };
    }
    if (stmt.kind === 'let_decl' && stmt.letType === 'formula' && stmt.formula.kind === 'fn_call') {
      return {
        call: { name: stmt.formula.name || '', args: stmt.formula.args || [] },
        type: 'let_decl',
        stmt,
      };
    }
    if (stmt.kind === 'set_cmd' && stmt.formula.kind === 'fn_call') {
      return {
        call: { name: stmt.formula.name || '', args: stmt.formula.args || [] },
        type: 'set_cmd',
        stmt,
      };
    }
    if (stmt.kind === 'return_stmt' && stmt.formula?.kind === 'fn_call') {
      return {
        call: { name: stmt.formula.name || '', args: stmt.formula.args || [] },
        type: 'return_stmt',
        stmt,
      };
    }
    if (stmt.kind === 'print_cmd' && stmt.formula?.kind === 'fn_call') {
      return {
        call: { name: stmt.formula.name || '', args: stmt.formula.args || [] },
        type: 'print_cmd',
        stmt,
      };
    }
    return undefined;
  }

  private applyFunctionContinuation(
    continuation: FunctionContinuation,
    result: Formula | undefined,
  ): void {
    const normalized = result || { kind: 'atom', name: 'undefined' as const };

    switch (continuation.type) {
      case 'discard':
        return;
      case 'let_decl': {
        const letStmt = continuation.stmt as LetDeclNode;
        if (letStmt.letType === 'formula') {
          return this.execLetDecl({ ...letStmt, formula: normalized });
        }
        return;
      }
      case 'set_cmd':
        return this.execSetCmd({ ...(continuation.stmt as SetCmdNode), formula: normalized });
      case 'return_stmt':
        return this.execReturnStmt({
          ...(continuation.stmt as ReturnStmtNode),
          formula: normalized,
        });
      case 'print_cmd':
        return this.execPrintCmd({ ...(continuation.stmt as PrintCmdNode), formula: normalized });
    }
  }

  private execExportDecl(stmt: ExportDeclNode): void {
    // Ejecutar la declaración interna
    this.executeStatementsIterative([stmt.statement], stmt.source.file);

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
  private invalidateResolveCache(): void {
    this.resolveCache = new WeakMap<Formula, Formula>();
    this.resolveCacheGeneration++;
  }

  private resolveFormula(f: Formula, visited: Set<string> = new Set()): Formula {
    // Check resolution cache first
    const cached = this.resolveCache.get(f);
    if (cached !== undefined) return cached;

    const resolved = this.resolveFormulaRecursive(f, visited);
    // Constant-fold pure arithmetic (add, subtract, etc.) but NOT comparisons
    // so profiles can still see the structural form of comparisons.
    const folded = this.tryConstantFold(resolved);

    // Cache the result and deduplicate via FormulaFactory
    const result = FormulaFactory.create(folded);
    this.resolveCache.set(f, result);
    return result;
  }

  private resolveFormulaRecursive(f: Formula, visited: Set<string>): Formula {
    if (!f) return f;

    // Si es un átomo, intentar resolver
    if (f.kind === 'atom' && f.name) {
      if (this.hasBinding(f.name)) {
        if (visited.has(f.name)) return f;
        visited.add(f.name);
        const result = this.resolveFormulaRecursive(this.getBinding(f.name) as Formula, visited);
        visited.delete(f.name);
        return result;
      }

      // Dot notation: Theory.member o instance.member
      if (f.name.includes('.')) {
        const [prefix, memberName] = f.name.split('.', 2);

        // 1. Intentar resolver el prefijo como una variable local (instancia)
        if (this.hasBinding(prefix)) {
          const resolvedPrefix = this.getBinding(prefix) as Formula;
          if (resolvedPrefix.kind === 'atom' && resolvedPrefix.name) {
            const actualInstanceName = resolvedPrefix.name;
            const scope = this.theories.get(actualInstanceName);
            if (scope) {
              if (
                scope.privateMembers.has(memberName) &&
                this.currentTheoryName !== actualInstanceName
              )
                return f;
              const member =
                scope.letBindings.get(memberName) ??
                scope.axioms.get(memberName) ??
                scope.theorems.get(memberName);
              if (member) {
                return this.resolveFormulaRecursive(member, visited);
              }
            }
          }
        }

        // 2. Intentar resolver como nombre de teoría global (Singleton)
        const scope = this.theories.get(prefix);
        if (scope) {
          if (scope.privateMembers.has(memberName) && this.currentTheoryName !== prefix) return f;
          const member =
            scope.letBindings.get(memberName) ??
            scope.axioms.get(memberName) ??
            scope.theorems.get(memberName);
          if (member) {
            return this.resolveFormulaRecursive(member, visited);
          }
        }
        return f;
      }

      // También resolver axiomas/teoremas del theory actual por nombre
      if (this.theory.axioms.has(f.name)) {
        if (visited.has(f.name)) return f;
        visited.add(f.name);
        const result = this.resolveFormulaRecursive(
          this.theory.axioms.get(f.name) as Formula,
          visited,
        );
        visited.delete(f.name);
        return result;
      }
      if (this.theory.theorems.has(f.name)) {
        if (visited.has(f.name)) return f;
        visited.add(f.name);
        const result = this.resolveFormulaRecursive(
          this.theory.theorems.get(f.name) as Formula,
          visited,
        );
        visited.delete(f.name);
        return result;
      }
    }

    // Llamada a función como expresión
    if (f.kind === 'fn_call' && f.name) {
      const result = this.executeFnCall({ name: f.name, args: f.args || [] });
      return result || { kind: 'atom', name: 'undefined', source: f.source };
    }

    // Recorrer hijos recursivamente
    if (f.args && f.args.length > 0) {
      const newArgs = f.args.map((a) => (a ? this.resolveFormulaRecursive(a, visited) : a));
      // Check if args actually changed to avoid unnecessary object creation
      let changed = false;
      for (let i = 0; i < f.args.length; i++) {
        if (f.args[i] !== newArgs[i]) {
          changed = true;
          break;
        }
      }
      return changed ? { ...f, args: newArgs } : f;
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
    const formula = this.resolveFormula(stmt.formula);

    if (profile.name === 'classical.propositional') {
      const atoms = Array.from(collectAtoms(formula)).sort();

      // Streaming de tabla de verdad para evitar OOM
      this.emit(`Tabla de verdad para ${formulaToString(formula)}:`);
      this.emit(`  ${atoms.join(' | ')} | Resultado`);
      this.emit(`  ${atoms.map(() => '---').join('-|-')}-|----------`);

      let isTautology = true;
      let isSatisfiable = false;
      let count = 0;
      let satCount = 0;

      for (const v of generateValuationsLazy(atoms)) {
        const res = evaluateClassical(formula, v);
        if (res) {
          isSatisfiable = true;
          satCount++;
        } else {
          isTautology = false;
        }
        count++;

        // Solo imprimir las primeras 64 filas para no saturar el stdout en tablas masivas
        if (count <= 64) {
          const row = atoms.map((a) => (v[a] ? 'V' : 'F')).join(' | ');
          this.emit(`  ${row} | ${res ? 'V' : 'F'}`);
        } else if (count === 65) {
          this.emit('  ... (tabla masiva, ocultando filas intermedias) ...');
        }
      }

      this.emit(`\nResumen: ${count} valuaciones analizadas.`);
      this.emit(
        `Estatus: ${isTautology ? 'Tautología ✓' : isSatisfiable ? 'Satisfacible' : 'Contradicción ✗'}`,
      );

      this.results.push({
        status: isTautology ? 'valid' : isSatisfiable ? 'satisfiable' : 'unsatisfiable',
        output: `Tabla de verdad de ${count} filas procesada.`,
        truthTable: {
          variables: atoms,
          rows: [],
          subFormulas: [],
          subFormulaValues: [],
          isTautology,
          isContradiction: !isSatisfiable,
          isSatisfiable,
          satisfyingCount: satCount,
        },
        diagnostics: [],
        formula: formula,
      });
      return;
    }

    // Fallback para otros perfiles
    if (!profile.truthTable) {
      throw new Error('Este perfil no soporta truth_table');
    }
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
      if (this.currentBindingFrame)
        this.currentBindingFrame.descriptions.set(stmt.name, stmt.description);
      else this.letDescriptions.set(stmt.name, stmt.description);
      if (this.shouldEmitLocalBindings()) this.emit(`Let ${stmt.name} = "${stmt.description}"`);
    } else if (stmt.letType === 'action') {
      const actionStmt = stmt as { name: string; action: RuntimeActionExpr };
      const captured = this.executeActionExpr(actionStmt.action);
      this.results.push(captured.result);
      this.bindCapturedAction(
        actionStmt.name,
        actionStmt.action.action,
        captured.primary,
        captured.result,
        captured.formulas,
        captured.extraBindings,
      );
      if (this.shouldEmitLocalBindings()) {
        this.emit(`Let ${actionStmt.name} = ${formulaToUnicode(captured.primary)}`);
      }
    } else if (stmt.letType === 'formula' && stmt.formula) {
      // Resolve bindings but preserve symbolic structure (no constant-folding)
      const resolved = this.resolveFormulaRecursive(stmt.formula, new Set());
      this.defineBinding(stmt.name, resolved, 'description' in stmt ? stmt.description : undefined);
      if (!this.currentBindingFrame) this.theory.axioms.set(stmt.name, resolved);
      if ('description' in stmt && stmt.description) {
        if (!this.currentBindingFrame) this.letDescriptions.set(stmt.name, stmt.description);
        if (this.shouldEmitLocalBindings())
          this.emit(`Let ${stmt.name} = "${stmt.description}" : ${formulaToUnicode(resolved)}`);
      } else {
        if (this.shouldEmitLocalBindings())
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

    this.executeStatementsIterative(stmt.body, stmt.source.file);

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
    this.invalidateResolveCache();
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
    this.invalidateResolveCache();

    this.theories.set(theoryName, scope);
    this.emit(`── End Theory Instance ${theoryName} ──`);
    return theoryName;
  }

  private execPrintCmd(stmt: PrintCmdNode): void {
    if (stmt.value !== null) this.emit(stmt.value);
    else if (stmt.formula) {
      // Resolve bindings but skip constant-folding so print shows symbolic form
      const resolved = this.resolveFormulaRecursive(stmt.formula, new Set());
      this.emit(formulaToUnicode(resolved));
    }
  }

  private execSetCmd(stmt: SetCmdNode): void {
    const resolved = this.evaluateFormulaValue(stmt.formula);
    this.setBinding(stmt.name, resolved);
    if (!this.currentBindingFrame) this.theory.axioms.set(stmt.name, resolved);
    if (this.shouldEmitLocalBindings())
      this.emit(`Set ${stmt.name} = ${formulaToUnicode(resolved)}`);
  }

  private execIfStmt(stmt: IfStmtNode): void {
    const selectedBody = this.selectIfBody(stmt);
    if (selectedBody) this.executeStatementsIterative(selectedBody, stmt.source.file);
  }

  private execForStmt(stmt: ForStmtNode): void {
    this.executeStatementsIterative([stmt], stmt.source.file);
  }

  private execWhileStmt(stmt: WhileStmtNode): void {
    this.executeStatementsIterative([stmt], stmt.source.file);
  }

  private execFnDecl(stmt: FnDeclNode): void {
    const name = this.currentTheoryName ? `${this.currentTheoryName}.${stmt.name}` : stmt.name;
    this.functions.set(name, stmt);
    if (this.currentTheoryName)
      this.emit(`Función de instancia ${name}(${stmt.params.join(', ')}) declarada`);
    else this.emit(`Función ${name}(${stmt.params.join(', ')}) declarada`);
  }

  private execReturnStmt(stmt: ReturnStmtNode): void {
    if (stmt.formula) this.returnValue = this.evaluateFormulaValue(stmt.formula);
    else this.returnValue = undefined;
    this.returnSignal = true;
  }

  private executeFnCall(stmt: { name: string; args: Formula[] }): Formula | undefined {
    const initial = this.startFunctionFrame(stmt, undefined);
    if ('result' in initial) return initial.result;

    const callStack: FunctionExecutionFrame[] = [initial.frame];
    let finalResult: Formula | undefined = undefined;

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];

      if (this.returnSignal) {
        const result = this.finishFunctionFrame(frame);
        callStack.pop();
        if (frame.continuation) this.applyFunctionContinuation(frame.continuation, result);
        else finalResult = result;
        continue;
      }

      const nextStmt = this.nextRuntimeStatement(frame.runtimeStack);
      if (!nextStmt) {
        const result = this.finishFunctionFrame(frame);
        callStack.pop();
        if (frame.continuation) this.applyFunctionContinuation(frame.continuation, result);
        else finalResult = result;
        continue;
      }

      const nestedCall = this.getDirectFunctionCall(nextStmt);
      if (nestedCall) {
        if (nestedCall.type === 'return_stmt') {
          const replaced = this.replaceFunctionFrame(frame, nestedCall.call);
          if ('result' in replaced) {
            this.returnValue = replaced.result || { kind: 'atom', name: 'undefined' };
            this.returnSignal = true;
          } else {
            callStack[callStack.length - 1] = replaced.frame;
          }
          continue;
        }

        const started = this.startFunctionFrame(nestedCall.call, {
          type: nestedCall.type,
          stmt: nestedCall.stmt,
        });
        if ('result' in started)
          this.applyFunctionContinuation(started.resultContinuation, started.result);
        else callStack.push(started.frame);
        continue;
      }

      this.dispatchRuntimeStatement(nextStmt, frame.runtimeStack);
    }

    return finalResult;
  }

  private startFunctionFrame(
    stmt: { name: string; args: Formula[] },
    continuation: FunctionContinuation | undefined,
    inheritedReturnState?: { signal: boolean; value: Formula | undefined },
  ):
    | { frame: FunctionExecutionFrame }
    | {
        result: Formula | undefined;
        resultContinuation: FunctionContinuation;
      } {
    this.callDepth++;
    if (this.callDepth > MAX_CALL_DEPTH) {
      this.callDepth--;
      throw new Error(`Límite de recursión excedido (${MAX_CALL_DEPTH}).`);
    }
    this.runtimeCallCount++;
    if (this.runtimeCallCount > this.getRuntimeCallLimit()) {
      this.callDepth--;
      throw new Error(`Límite de llamadas ST excedido (${this.getRuntimeCallLimit()}).`);
    }

    if (
      [
        'typeof',
        'is_valid',
        'is_satisfiable',
        'get_atoms',
        'atoms_of',
        'len',
        'at',
        'formula_eq',
        'input',
      ].includes(stmt.name)
    ) {
      const result = this.executeBuiltin(stmt.name, stmt.args);
      this.callDepth--;
      return { result, resultContinuation: continuation || { type: 'discard' } };
    }

    if (stmt.name.includes('.')) {
      const [prefix, methodName] = stmt.name.split('.', 2);
      let actualInstanceName = prefix;
      if (this.hasBinding(prefix)) {
        const resolved = this.getBinding(prefix) as Formula;
        if (resolved.kind === 'atom' && resolved.name) actualInstanceName = resolved.name;
      }
      const scope = this.theories.get(actualInstanceName);
      if (scope) {
        const internalFnName = `${actualInstanceName}.${methodName}`;
        const fn = this.functions.get(internalFnName);
        if (fn)
          return {
            frame: this.createFunctionFrame(
              internalFnName,
              fn,
              stmt.args,
              continuation,
              scope,
              inheritedReturnState,
            ),
          };
      }
    }

    const template = this.theoryTemplates.get(stmt.name);
    if (template) {
      const instanceId = `inst_${stmt.name}_${this.theories.size}`;
      this.instantiateTheory(template.node, instanceId, stmt.args);
      this.callDepth--;
      return {
        result: { kind: 'atom', name: instanceId },
        resultContinuation: continuation || { type: 'discard' },
      };
    }

    const fn = this.functions.get(stmt.name);
    if (!fn) {
      this.callDepth--;
      throw new Error(`Función o Teoría '${stmt.name}' no declarada`);
    }

    return {
      frame: this.createFunctionFrame(
        stmt.name,
        fn,
        stmt.args,
        continuation,
        undefined,
        inheritedReturnState,
      ),
    };
  }

  private createFunctionFrame(
    name: string,
    fn: FnDeclNode,
    args: Formula[],
    continuation?: FunctionContinuation,
    scope?: TheoryScope,
    inheritedReturnState?: { signal: boolean; value: Formula | undefined },
  ): FunctionExecutionFrame {
    if (args.length !== fn.params.length) {
      this.callDepth--;
      throw new Error(`Argumentos incorrectos.`);
    }

    let scopeSnapshot: ScopeExecutionSnapshot | undefined;
    if (scope) {
      scopeSnapshot = {
        letBindings: new Map(this.letBindings),
        axioms: new Map(this.theory.axioms),
        theorems: new Map(this.theory.theorems),
        theoryName: this.currentTheoryName,
      };
      for (const [key, value] of scope.letBindings) this.letBindings.set(key, value);
      for (const [key, value] of scope.axioms) this.theory.axioms.set(key, value);
      for (const [key, value] of scope.theorems) this.theory.theorems.set(key, value);
      this.currentTheoryName = scope.name;
    }

    const bindingFrame = this.createBindingFrame();
    this.currentBindingFrame = bindingFrame;

    for (let i = 0; i < fn.params.length; i++) {
      this.currentBindingFrame.bindings.set(fn.params[i], this.evaluateFormulaValue(args[i]));
    }

    const savedReturnSignal = inheritedReturnState?.signal ?? this.returnSignal;
    const savedReturnValue = inheritedReturnState?.value ?? this.returnValue;
    this.returnSignal = false;
    this.returnValue = undefined;

    return {
      name,
      runtimeStack: [{ kind: 'statements', statements: fn.body, index: 0 }],
      bindingFrame,
      savedReturnSignal,
      savedReturnValue,
      scopeSnapshot,
      continuation,
    };
  }

  private finishFunctionFrame(frame: FunctionExecutionFrame): Formula | undefined {
    const result = this.returnValue;
    this.returnSignal = frame.savedReturnSignal;
    this.returnValue = frame.savedReturnValue;

    this.discardFunctionFrameState(frame);

    this.callDepth--;
    return result;
  }

  private discardFunctionFrameState(frame: FunctionExecutionFrame): void {
    this.currentBindingFrame = frame.bindingFrame.parent;

    if (frame.scopeSnapshot) {
      this.letBindings = frame.scopeSnapshot.letBindings;
      this.theory.axioms = frame.scopeSnapshot.axioms;
      this.theory.theorems = frame.scopeSnapshot.theorems;
      this.currentTheoryName = frame.scopeSnapshot.theoryName;
      this.invalidateResolveCache();
    }
  }

  private replaceFunctionFrame(
    frame: FunctionExecutionFrame,
    stmt: { name: string; args: Formula[] },
  ):
    | { frame: FunctionExecutionFrame }
    | {
        result: Formula | undefined;
      } {
    const inheritedReturnState = {
      signal: frame.savedReturnSignal,
      value: frame.savedReturnValue,
    };
    const inheritedContinuation = frame.continuation;
    const evaluatedArgs = stmt.args.map((arg) => this.evaluateFormulaValue(arg));

    this.discardFunctionFrameState(frame);
    this.callDepth--;

    const replaced = this.startFunctionFrame(
      { name: stmt.name, args: evaluatedArgs },
      inheritedContinuation,
      inheritedReturnState,
    );
    if ('frame' in replaced) return replaced;
    return { result: replaced.result };
  }

  private nextRuntimeStatement(runtimeStack: RuntimeFrame[]): Statement | undefined {
    while (runtimeStack.length > 0) {
      const frame = runtimeStack[runtimeStack.length - 1];

      if (frame.kind === 'statements') {
        if (frame.index >= frame.statements.length) {
          runtimeStack.pop();
          continue;
        }
        return frame.statements[frame.index++];
      }

      if (frame.kind === 'for') {
        if (this.returnSignal || frame.index >= frame.stmt.items.length) {
          this.restoreBindingSnapshot(frame.stmt.variable, frame.savedBinding);
          runtimeStack.pop();
          continue;
        }

        const resolved = this.evaluateFormulaValue(frame.stmt.items[frame.index]);
        this.setBinding(frame.stmt.variable, resolved);
        frame.index++;
        runtimeStack.push({ kind: 'statements', statements: frame.stmt.body, index: 0 });
        continue;
      }

      if (this.returnSignal) {
        runtimeStack.pop();
        continue;
      }

      const profile = this.requireProfile();
      const maxIter = frame.stmt.maxIterations || 1000;
      if (frame.iterations >= maxIter) {
        this.diagnostics.push({
          severity: 'warning',
          message: `while: se alcanzó el límite de ${maxIter} iteraciones`,
          file: frame.stmt.source.file,
          line: frame.stmt.source.line,
          column: frame.stmt.source.column,
        });
        runtimeStack.pop();
        continue;
      }

      const resolved = this.evaluateFormulaValue(frame.stmt.formula);
      const matched = this.matchesRuntimeCondition(profile, frame.stmt.condition, resolved);

      if (!matched) {
        runtimeStack.pop();
        continue;
      }

      frame.iterations++;
      runtimeStack.push({ kind: 'statements', statements: frame.stmt.body, index: 0 });
    }

    return undefined;
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
      divide: (a, b) => a / b,
      modulo: (a, b) => a % b,
    };
    // Note: comparison operators (less, greater, etc.) are NOT folded here.
    // They must retain their structural form so profiles can evaluate them properly.
    const newArgs = f.args.map((a) => this.tryConstantFold(a));
    if (
      newArgs.length === 2 &&
      newArgs[0].kind === 'number' &&
      newArgs[1].kind === 'number' &&
      ARITH_OPS[f.kind]
    ) {
      // Don't fold division/modulo by zero — preserve structure for checkWellFormed
      if ((f.kind === 'divide' || f.kind === 'modulo') && (newArgs[1].value ?? 0) === 0) {
        return { ...f, args: newArgs };
      }
      const op = ARITH_OPS[f.kind];
      const res = op(newArgs[0].value ?? 0, newArgs[1].value ?? 0);
      return { kind: 'number', value: res, source: f.source };
    }
    return { ...f, args: newArgs };
  }

  private executeBuiltin(name: string, args: Formula[]): Formula | undefined {
    const arg = args[0] ? this.resolveFormula(args[0]) : undefined;
    if (name === 'typeof') {
      let typeStr = 'Formula';
      if (arg?.kind === 'number') typeStr = 'Number';
      if (arg?.kind === 'list') typeStr = 'List';
      if (arg?.kind === 'atom' && arg.name?.startsWith('"')) typeStr = 'String';
      return { kind: 'atom', name: `"${typeStr}"`, source: arg?.source };
    }
    if (name === 'is_valid' || name === 'is_satisfiable') {
      const profile = this.requireProfile();
      if (!arg) return { kind: 'atom', name: '"Error"' };
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
      if (!arg) return { kind: 'atom', name: '"{ }"' };
      const atoms = this.collectAtoms(arg);
      return { kind: 'atom', name: `"{ ${atoms.join(', ')} }"`, source: arg.source };
    }
    if (name === 'atoms_of') {
      const source = arg?.source;
      const items = (arg ? this.collectValueAtoms(arg) : []).map((atomName) => ({
        kind: 'atom' as const,
        name: atomName,
        source,
      }));
      return { kind: 'list', args: items, source };
    }
    if (name === 'len') {
      if (arg?.kind === 'list') {
        return { kind: 'number', value: arg.args?.length ?? 0, source: arg.source };
      }
      if (arg?.kind === 'atom' && arg.name?.startsWith('"')) {
        return {
          kind: 'number',
          value: arg.name.replace(/(^"|"$)/g, '').length,
          source: arg.source,
        };
      }
      return { kind: 'number', value: 0, source: arg?.source };
    }
    if (name === 'at') {
      const listArg = arg;
      const indexArg = args[1] ? this.resolveFormula(args[1]) : undefined;
      if (listArg?.kind === 'list' && indexArg?.kind === 'number') {
        const index = Math.floor(indexArg.value ?? -1);
        return listArg.args?.[index] || { kind: 'atom', name: 'undefined', source: listArg.source };
      }
      return { kind: 'atom', name: 'undefined', source: listArg?.source || indexArg?.source };
    }
    if (name === 'formula_eq') {
      const left = arg;
      const right = args[1] ? this.resolveFormula(args[1]) : undefined;
      const equal = !!left && !!right && formulaToString(left) === formulaToString(right);
      return {
        kind: 'number',
        value: equal ? 1 : 0,
        source: left?.source || right?.source,
      };
    }
    if (name === 'input') {
      if (!arg) return { kind: 'atom', name: '""' };
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

  private executeActionExpr(action: RuntimeActionExpr): {
    result: RunResult;
    primary: Formula;
    formulas: Formula[];
    extraBindings: Array<[string, Formula]>;
  } {
    const profile = this.requireProfile();

    switch (action.action) {
      case 'check_valid': {
        const formula = this.resolveFormula(action.formula as Formula);
        return {
          result: profile.checkValid(formula),
          primary: formula,
          formulas: [formula],
          extraBindings: [],
        };
      }
      case 'check_satisfiable': {
        const formula = this.resolveFormula(action.formula as Formula);
        return {
          result: profile.checkSatisfiable(formula),
          primary: formula,
          formulas: [formula],
          extraBindings: [],
        };
      }
      case 'check_equivalent': {
        if (!profile.checkEquivalent) {
          throw new Error('Este perfil no soporta check equivalent');
        }
        const left = this.resolveFormula(action.left as Formula);
        const right = this.resolveFormula(action.right as Formula);
        const comparison: Formula = {
          kind: 'biconditional',
          args: [left, right],
          source: action.source,
        };
        return {
          result: profile.checkEquivalent(left, right),
          primary: comparison,
          formulas: [left, right],
          extraBindings: [
            ['left', left],
            ['right', right],
            [
              'equivalent',
              {
                kind: 'number',
                value: formulaToString(left) === formulaToString(right) ? 1 : 0,
                source: action.source,
              },
            ],
          ],
        };
      }
      case 'derive': {
        const goal = this.resolveFormula(action.goal as Formula);
        const premises = action.premises || [];
        const result = profile.derive(goal, premises, this.theory);
        const premiseFormulas = premises
          .map((premise) => this.theory.axioms.get(premise) || this.theory.theorems.get(premise))
          .filter((value): value is Formula => !!value)
          .map((formula) => this.resolveFormula(formula));
        return {
          result,
          primary: result.formula || goal,
          formulas: [goal, ...premiseFormulas],
          extraBindings: [
            ['goal', goal],
            ['premises', this.createListFormula(premiseFormulas, action.source)],
            ['premise_names', this.createStringListFormula(premises, action.source)],
          ],
        };
      }
      case 'prove': {
        const goal = this.resolveFormula(action.goal as Formula);
        const premises = action.premises || [];
        const result = profile.prove(goal, this.theory);
        const premiseFormulas = premises
          .map((premise) => this.theory.axioms.get(premise) || this.theory.theorems.get(premise))
          .filter((value): value is Formula => !!value)
          .map((formula) => this.resolveFormula(formula));
        return {
          result,
          primary: result.formula || goal,
          formulas: [goal, ...premiseFormulas],
          extraBindings: [
            ['goal', goal],
            ['premises', this.createListFormula(premiseFormulas, action.source)],
            ['premise_names', this.createStringListFormula(premises, action.source)],
          ],
        };
      }
      case 'countermodel': {
        const formula = this.resolveFormula(action.formula as Formula);
        const result = profile.countermodel(formula);
        return {
          result,
          primary: result.formula || formula,
          formulas: [formula],
          extraBindings: [
            [
              'has_countermodel',
              { kind: 'number', value: result.model ? 1 : 0, source: action.source },
            ],
          ],
        };
      }
      case 'truth_table': {
        if (!profile.truthTable) {
          throw new Error('Este perfil no soporta truth_table');
        }
        const formula = this.resolveFormula(action.formula as Formula);
        const tt = profile.truthTable(formula);
        const result: RunResult = {
          status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
          output: this.formatTruthTable(formula, tt),
          truthTable: tt,
          diagnostics: [],
          formula,
        };
        return {
          result,
          primary: formula,
          formulas: [formula],
          extraBindings: [
            ['variables', this.createAtomListFormula(tt.variables, action.source)],
            ['rows_count', { kind: 'number', value: tt.rows.length, source: action.source }],
            [
              'satisfying_count',
              { kind: 'number', value: tt.satisfyingCount ?? 0, source: action.source },
            ],
          ],
        };
      }
      case 'explain': {
        const formula = this.resolveFormula(action.formula as Formula);
        return {
          result: profile.explain(formula),
          primary: formula,
          formulas: [formula],
          extraBindings: [],
        };
      }
    }
  }

  private bindCapturedAction(
    baseName: string,
    actionName: string,
    primary: Formula,
    result: RunResult,
    formulas: Formula[],
    extraBindings: Array<[string, Formula]>,
  ): void {
    this.defineBinding(baseName, primary);
    this.defineBinding(`${baseName}.formula`, primary);
    this.defineBinding(
      `${baseName}.status`,
      this.createStringFormula(result.status, primary.source),
    );
    this.defineBinding(
      `${baseName}.output`,
      this.createStringFormula(result.output || '', primary.source),
    );
    this.defineBinding(`${baseName}.ok`, {
      kind: 'number',
      value: this.isSuccessfulStatus(result.status) ? 1 : 0,
      source: primary.source,
    });
    this.defineBinding(`${baseName}.command`, this.createStringFormula(actionName, primary.source));
    this.defineBinding(`${baseName}.formulas`, this.createListFormula(formulas, primary.source));
    this.defineBinding(
      `${baseName}.diagnostics`,
      this.createStringListFormula(
        result.diagnostics.map((diag) => diag.message),
        primary.source,
      ),
    );
    for (const [suffix, value] of extraBindings) {
      this.defineBinding(`${baseName}.${suffix}`, value);
    }
  }

  private createStringFormula(value: string, source?: Formula['source']): Formula {
    return {
      kind: 'atom',
      name: `"${value.replace(/"/g, '\\"')}"`,
      source,
    };
  }

  private createListFormula(items: Formula[], source?: Formula['source']): Formula {
    return { kind: 'list', args: items, source };
  }

  private createAtomListFormula(items: string[], source?: Formula['source']): Formula {
    return this.createListFormula(
      items.map((item) => ({ kind: 'atom', name: item, source })),
      source,
    );
  }

  private createStringListFormula(items: string[], source?: Formula['source']): Formula {
    return this.createListFormula(
      items.map((item) => this.createStringFormula(item, source)),
      source,
    );
  }

  private isSuccessfulStatus(status: RunResult['status']): boolean {
    return status === 'valid' || status === 'satisfiable' || status === 'provable';
  }

  private collectValueAtoms(formula: Formula): string[] {
    const seen = new Set<string>();
    const walk = (value: Formula) => {
      if (value.kind === 'atom' && value.name && !value.name.startsWith('"')) {
        seen.add(value.name);
        return;
      }
      for (const arg of value.args || []) {
        walk(arg);
      }
    };
    walk(formula);
    return Array.from(seen);
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
    const v = this.getBinding('verbose');
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
      case 'provable':
        return '✓';
      case 'invalid':
      case 'refutable':
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
