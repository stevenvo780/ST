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
  ProofBlockNode,
  TheoryDeclNode,
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
  /** Nombre de la teoría actual (si estamos dentro de una) */
  private currentTheoryName: string | null = null;

  constructor() {
    this.theory = this.createEmptyTheory();
    this.textLayer = createTextLayerState();
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
    if (!f) return f;

    // Si es un átomo, intentar resolver
    if (f.kind === 'atom' && f.name) {
      // Dot notation: Theory.member
      if (f.name.includes('.')) {
        const [theoryName, memberName] = f.name.split('.', 2);
        const scope = this.theories.get(theoryName);
        if (scope) {
          // Verificar encapsulamiento: miembros privados no accesibles desde fuera
          if (scope.privateMembers.has(memberName) && this.currentTheoryName !== theoryName) {
            // Miembro privado — no resolver, dejar como átomo
            return f;
          }
          // Buscar en letBindings de la teoría
          if (scope.letBindings.has(memberName)) {
            if (visited.has(f.name)) return f;
            visited.add(f.name);
            return this.resolveFormula(scope.letBindings.get(memberName)!, new Set(visited));
          }
          // Buscar en axiomas de la teoría
          if (scope.axioms.has(memberName)) {
            if (visited.has(f.name)) return f;
            visited.add(f.name);
            return this.resolveFormula(scope.axioms.get(memberName)!, new Set(visited));
          }
          // Buscar en teoremas de la teoría
          if (scope.theorems.has(memberName)) {
            if (visited.has(f.name)) return f;
            visited.add(f.name);
            return this.resolveFormula(scope.theorems.get(memberName)!, new Set(visited));
          }
        }
        // No se encontró — dejar como átomo con punto
        return f;
      }

      // Binding local normal
      if (this.letBindings.has(f.name)) {
        if (visited.has(f.name)) {
          return f;
        }
        visited.add(f.name);
        return this.resolveFormula(this.letBindings.get(f.name)!, new Set(visited));
      }

      // También resolver axiomas/teoremas del theory actual por nombre
      if (this.theory.axioms.has(f.name)) {
        if (visited.has(f.name)) return f;
        visited.add(f.name);
        return this.resolveFormula(this.theory.axioms.get(f.name)!, new Set(visited));
      }
      if (this.theory.theorems.has(f.name)) {
        if (visited.has(f.name)) return f;
        visited.add(f.name);
        return this.resolveFormula(this.theory.theorems.get(f.name)!, new Set(visited));
      }
    }

    // Recorrer hijos recursivamente
    if (f.args && f.args.length > 0) {
      const newArgs = f.args.map(a => a ? this.resolveFormula(a, new Set(visited)) : a);
      const changed = newArgs.some((a, i) => a !== f.args![i]);
      if (changed) {
        return { ...f, args: newArgs };
      }
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
      // Solo descripción textual: P es un átomo con significado semántico
      this.letDescriptions.set(stmt.name, stmt.description);
      this.emit(`Let ${stmt.name} = "${stmt.description}"`);
    } else if (stmt.letType === 'formula' && stmt.formula) {
      // Resolver posibles variables anidadas en la propia definición
      const resolved = this.resolveFormula(stmt.formula);
      // Registrar como binding para sustitución futura
      this.letBindings.set(stmt.name, resolved);
      // También como axioma implícito para derivaciones
      this.theory.axioms.set(stmt.name, resolved);
      // Si tiene descripción textual (let X = "desc" : formula), guardarla
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

    // También agregar al theory.claims
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
    // Compilar claims y renderizar
    const diags = compileClaimsToTheory(this.textLayer, this.theory);
    this.diagnostics.push(...diags);

    if (stmt.target === 'claims' || stmt.target === 'all') {
      this.emit(`── Render: ${stmt.target} (${stmt.format}) ──`);
      for (const [name, claim] of this.theory.claims) {
        const fStr = claim.formula ? formulaToUnicode(claim.formula) : '(sin fórmula)';
        this.emit(`  Claim "${name}": ${fStr}`);
        if (claim.support) {
          this.emit(`    Soporte: ${claim.support}`);
        }
        if (claim.confidence !== undefined) {
          this.emit(`    Confianza: ${claim.confidence}`);
        }
        if (claim.context) {
          this.emit(`    Contexto: ${claim.context}`);
        }
      }
      if (this.theory.claims.size === 0) {
        this.emit('  (sin claims registrados)');
      }
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
      // Render un claim o axioma específico por nombre
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
    const premises = stmt.premises.map(p => this.resolveFormula(p));
    const conclusion = this.resolveFormula(stmt.conclusion);
    const fallacies = detectFallacies(premises, conclusion, profile);
    const pStr = premises.map((p) => formulaToUnicode(p)).join(', ');
    const cStr = formulaToUnicode(conclusion);

    if (fallacies.length === 0) {
      // Check if the inference is valid
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
      const result2: RunResult = {
        status: result.status,
        output: result.output,
        diagnostics: [],
        formula: conclusion,
      };
      this.results.push(result2);
    } else {
      this.emit(`⚠ [analyze] {${pStr}} → ${cStr}`);
      for (const f of fallacies) {
        this.emit(`  ⚠ Falacia detectada: ${f.name}`);
        this.emit(`    ${f.description}`);
        if (f.pattern) this.emit(`    Patrón: ${f.pattern}`);
      }
      const result: RunResult = {
        status: 'invalid',
        output: `Falacias detectadas: ${fallacies.map((f: FallacyInfo) => f.name).join(', ')}`,
        diagnostics: fallacies.map((f: FallacyInfo) => ({
          severity: 'warning' as const,
          message: `Falacia: ${f.name} — ${f.description}`,
        })),
        formula: conclusion,
      };
      this.results.push(result);
    }
  }

  private execProofBlock(stmt: ProofBlockNode): void {
    const profile = this.requireProfile();

    // Guardar axiomas, letBindings y descriptions antes del bloque
    const savedAxioms = new Map(this.theory.axioms);
    const savedLetBindings = new Map(this.letBindings);
    const savedLetDescriptions = new Map(this.letDescriptions);

    // Registrar las asunciones como axiomas temporales (con resolución de variables)
    this.emit('── Proof Block ──');
    for (const assumption of stmt.assumptions) {
      const resolved = this.resolveFormula(assumption.formula);
      this.theory.axioms.set(assumption.name, resolved);
      this.emit(`  assume ${assumption.name} = ${formulaToUnicode(resolved)}`);
    }
    const resolvedGoal = this.resolveFormula(stmt.goal);
    this.emit(`  show ${formulaToUnicode(resolvedGoal)}`);

    // Ejecutar body statements
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

    // Verificar que el goal es derivable de las asunciones
    const premiseNames = stmt.assumptions.map((a) => a.name);
    const result = profile.derive(resolvedGoal, premiseNames, this.theory);
    this.results.push(result);

    if (result.status === 'valid' || result.status === 'provable') {
      this.emit(`  ✓ QED — ${formulaToUnicode(resolvedGoal)} demostrado`);
      // Registrar como teorema
      const theoremName = `proof_${this.theory.theorems.size + 1}`;
      // La implicación assumptions -> goal es un teorema
      let implication: Formula = resolvedGoal;
      for (let i = stmt.assumptions.length - 1; i >= 0; i--) {
        implication = {
          kind: 'implies',
          args: [stmt.assumptions[i].formula, implication],
        };
      }
      this.theory.theorems.set(theoremName, implication);
    } else {
      this.emit(`  ✗ QED fallido — no se pudo demostrar ${formulaToUnicode(resolvedGoal)}`);
    }

    // Restaurar axiomas, letBindings y descriptions (quitar las asunciones temporales)
    this.theory.axioms = savedAxioms;
    this.letBindings = savedLetBindings;
    this.letDescriptions = savedLetDescriptions;
    this.emit('── End Proof Block ──');
  }

  private execTheoryDecl(stmt: TheoryDeclNode): void {
    const theoryName = stmt.name;

    // Si ya existe una teoría con este nombre, sobreescribirla
    // Crear scope vacío
    const scope: TheoryScope = {
      name: theoryName,
      parent: stmt.parent,
      letBindings: new Map(),
      letDescriptions: new Map(),
      axioms: new Map(),
      theorems: new Map(),
      privateMembers: new Set(),
    };

    // HERENCIA: Si extends Parent, copiar bindings/axiomas/teoremas del padre
    if (stmt.parent) {
      const parentScope = this.theories.get(stmt.parent);
      if (!parentScope) {
        throw new Error(`Teoría padre '${stmt.parent}' no encontrada. Declárela antes de '${theoryName}'.`);
      }
      // Copiar todo del padre (no los miembros privados del padre al hijo)
      for (const [k, v] of parentScope.letBindings) {
        if (!parentScope.privateMembers.has(k)) {
          scope.letBindings.set(k, v);
        }
      }
      for (const [k, v] of parentScope.letDescriptions) {
        if (!parentScope.privateMembers.has(k)) {
          scope.letDescriptions.set(k, v);
        }
      }
      for (const [k, v] of parentScope.axioms) {
        if (!parentScope.privateMembers.has(k)) {
          scope.axioms.set(k, v);
        }
      }
      for (const [k, v] of parentScope.theorems) {
        if (!parentScope.privateMembers.has(k)) {
          scope.theorems.set(k, v);
        }
      }
    }

    // Guardar estado global antes de entrar al scope de la teoría
    const savedLetBindings = new Map(this.letBindings);
    const savedLetDescriptions = new Map(this.letDescriptions);
    const savedAxioms = new Map(this.theory.axioms);
    const savedTheorems = new Map(this.theory.theorems);
    const savedTheoryName = this.currentTheoryName;

    // Establecer el scope de la teoría como contexto actual
    // Inyectar bindings heredados al scope local para que los statements internos los vean
    for (const [k, v] of scope.letBindings) {
      this.letBindings.set(k, v);
    }
    for (const [k, v] of scope.letDescriptions) {
      this.letDescriptions.set(k, v);
    }
    for (const [k, v] of scope.axioms) {
      this.theory.axioms.set(k, v);
    }
    for (const [k, v] of scope.theorems) {
      this.theory.theorems.set(k, v);
    }

    this.currentTheoryName = theoryName;

    this.emit(`── Theory ${theoryName}${stmt.parent ? ` extends ${stmt.parent}` : ''} ──`);

    // Ejecutar los miembros del body
    for (const member of stmt.members) {
      // Registrar visibilidad
      const memberStmt = member.statement;
      const memberName = 'name' in memberStmt ? (memberStmt as { name: string }).name : null;

      if (member.visibility === 'private' && memberName) {
        scope.privateMembers.add(memberName);
      }

      try {
        this.executeStatement(memberStmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.diagnostics.push({
          severity: 'error',
          message: `[theory ${theoryName}] ${message}`,
          file: stmt.source.file,
          line: memberStmt.source.line,
          column: memberStmt.source.column,
        });
      }
    }

    // Capturar lo que los statements internos produjeron en el scope
    // (nuevos letBindings, axiomas, teoremas, descriptions)
    for (const [k, v] of this.letBindings) {
      if (!savedLetBindings.has(k)) {
        scope.letBindings.set(k, v);
      }
    }
    for (const [k, v] of this.letDescriptions) {
      if (!savedLetDescriptions.has(k)) {
        scope.letDescriptions.set(k, v);
      }
    }
    for (const [k, v] of this.theory.axioms) {
      if (!savedAxioms.has(k)) {
        scope.axioms.set(k, v);
      }
    }
    for (const [k, v] of this.theory.theorems) {
      if (!savedTheorems.has(k)) {
        scope.theorems.set(k, v);
      }
    }

    // Restaurar estado global (encapsulamiento — los internos no escapan)
    this.letBindings = savedLetBindings;
    this.letDescriptions = savedLetDescriptions;
    this.theory.axioms = savedAxioms;
    this.theory.theorems = savedTheorems;
    this.currentTheoryName = savedTheoryName;

    // Registrar la teoría
    this.theories.set(theoryName, scope);

    this.emit(`── End Theory ${theoryName} ──`);
  }

  private execImportDecl(stmt: ImportDeclNode): void {
    let filePath = stmt.path;
    // Agregar extensión .st si no la tiene
    if (!filePath.endsWith('.st')) filePath += '.st';

    // Evitar imports circulares
    if (this.importedFiles.has(filePath)) {
      this.emit(`Import: ${filePath} (ya importado, saltar)`);
      return;
    }
    this.importedFiles.add(filePath);

    // Intentar leer el archivo (solo funciona en Node.js / CLI)
    let source: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const path = require('path');
      // Resolver relativo al archivo actual si no es absoluto
      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(path.dirname(stmt.source.file || '.'), filePath);
      source = fs.readFileSync(resolved, 'utf-8');
    } catch {
      throw new Error(`No se pudo importar '${filePath}': archivo no encontrado`);
    }

    const parser = new Parser(filePath);
    const program = parser.parse(source);
    this.diagnostics.push(...parser.diagnostics);

    if (parser.diagnostics.some((d) => d.severity === 'error')) {
      throw new Error(`Errores de parseo en '${filePath}'`);
    }

    // Ejecutar statements del archivo importado en el contexto actual
    for (const importedStmt of program.statements) {
      this.executeStatement(importedStmt);
    }
    this.emit(`Import: ${filePath} cargado`);
  }

  private execExplainCmd(stmt: ExplainCmdNode): void {
    const profile = this.requireProfile();
    const resolved = this.resolveFormula(stmt.formula);
    const result = profile.explain(resolved);
    this.results.push(result);
    if (result.output) this.emit(result.output);
  }

  // --- Output helpers ---

  private emit(msg: string): void {
    this.stdoutLines.push(msg);
  }

  private emitResult(cmd: string, result: RunResult): void {
    const statusIcon = this.statusIcon(result.status);
    this.emit(`${statusIcon} [${cmd}] ${result.output || result.status}`);

    const proof = result.proof;
    if (proof && proof.steps.length > 0) {
      this.emit('  Prueba:');
      for (const step of proof.steps) {
        const premisesStr = step.premises.length > 0 ? ` [de ${step.premises.join(', ')}]` : '';
        this.emit(
          `    ${step.stepNumber}. ${formulaToUnicode(step.formula)}  — ${step.justification}${premisesStr}`,
        );
      }
    }

    const model = result.model;
    if (model && model.valuation) {
      this.emit('  Modelo:');
      for (const [k, v] of Object.entries(model.valuation)) {
        const desc = this.letDescriptions.get(k);
        const descStr = desc ? ` ("${desc}")` : '';
        this.emit(`    ${k}${descStr} = ${String(v)}`);
      }
    }

    // Mostrar leyenda de variables con descripción si hay alguna relevante
    if (this.letDescriptions.size > 0 && result.formula) {
      const atoms = this.collectAtoms(result.formula);
      const relevantDescs = atoms.filter(a => this.letDescriptions.has(a));
      if (relevantDescs.length > 0) {
        this.emit('  Donde:');
        for (const a of relevantDescs) {
          this.emit(`    ${a} = "${this.letDescriptions.get(a)}"`);
        }
      }
    }
  }

  /** Recolecta nombres de átomos únicos de una fórmula */
  private collectAtoms(f: Formula, seen: Set<string> = new Set()): string[] {
    if (!f) return [];
    if (f.kind === 'atom' && f.name && !seen.has(f.name)) {
      seen.add(f.name);
      return [f.name];
    }
    const result: string[] = [];
    if (f.args) {
      for (const arg of f.args) {
        result.push(...this.collectAtoms(arg, seen));
      }
    }
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
      case 'provable':
        return '✓';
      case 'refutable':
        return '✗';
      case 'unknown':
        return '?';
      case 'error':
        return '⚠';
      default:
        return '•';
    }
  }

  private formatTruthTable(formula: Formula, tt: TruthTableResult): string {
    const lines: string[] = [];
    const header = [...tt.variables, formulaToString(formula)];
    const colWidths = header.map((h) => Math.max(h.length, 5));

    // Header
    lines.push(header.map((h, i) => h.padEnd(colWidths[i])).join(' | '));
    lines.push(colWidths.map((w) => '-'.repeat(w)).join('-+-'));

    // Rows
    for (const row of tt.rows) {
      const vals = tt.variables.map((v) => (row.valuation[v] ? 'T' : 'F'));
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
  getTheory(): Theory {
    return this.theory;
  }
  getProfile(): LogicProfile | null {
    return this.profile;
  }
  getTextLayer(): TextLayerState {
    return this.textLayer;
  }
  getLetDescriptions(): Map<string, string> {
    return this.letDescriptions;
  }
  getLetBindings(): Map<string, Formula> {
    return this.letBindings;
  }
  getTheories(): Map<string, TheoryScope> {
    return this.theories;
  }
}
