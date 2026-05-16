// ============================================================
// ST TypeChecker — Validación estática con sugerencias humanas
// ============================================================
//
// TypeChecker implementa BaseASTVisitor<TypeError[]> y recorre
// el AST emitiendo errores antes de evaluar. El caller decide
// si abortar o continuar (no bloquea evaluate por defecto).
// ============================================================

import { BaseASTVisitor, visit } from '../../ast/visitor';
import type { Statement, Program } from '../../ast/nodes';
import type {
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
  AnalyzeCmdNode,
  ExplainCmdNode,
  ImportDeclNode,
  ProofBlockNode,
  TheoryDeclNode,
  IfStmtNode,
  ForStmtNode,
  WhileStmtNode,
  FnDeclNode,
  ReturnStmtNode,
  FnCallNode,
  ExportDeclNode,
  DefineDeclNode,
  UnfoldCmdNode,
  FoldCmdNode,
  InterpretCmdNode,
} from '../../ast/nodes';
import type { Formula, SourceLocation } from '../../types';
import type { TypeError, ProfileName } from './types';
import { MODAL_PROFILES, TEMPORAL_PROFILES, FIRST_ORDER_PROFILES } from './types';
import { findClosest } from './levenshtein';

// ── Contexto de análisis por scope ───────────────────────────

interface Scope {
  /** Nombres declarados (axioms, theorems, lets, defines, fns) */
  declared: Map<string, 'axiom' | 'theorem' | 'let' | 'define' | 'fn' | 'param'>;
  /** Predicados declarados con su aridad: nombre → aridad */
  predicates: Map<string, number>;
  /** Funciones declaradas: nombre → aridad */
  functions: Map<string, number>;
  /** Si estamos dentro de una fn_decl */
  insideFn: boolean;
  /** Imports vistos (para detectar circular) */
  imports: string[];
}

function mkScope(parent?: Scope): Scope {
  return {
    declared: new Map(parent?.declared),
    predicates: new Map(parent?.predicates),
    functions: new Map(parent?.functions),
    insideFn: parent?.insideFn ?? false,
    imports: parent ? [...parent.imports] : [],
  };
}

// ── Helper: location robusta ──────────────────────────────────

function loc(node: { source?: SourceLocation }): SourceLocation {
  return node.source ?? { line: 0, column: 0 };
}

// ── TypeChecker ───────────────────────────────────────────────

export class TypeChecker extends BaseASTVisitor<TypeError[]> {
  private profile: ProfileName;
  private scope: Scope;
  /** Axioms y teoremas declarados (nombres) — para duplicados */
  private axiomNames = new Map<string, SourceLocation>();
  private theoremNames = new Map<string, SourceLocation>();
  /** Imports vistos en este programa (para TC007) */
  private importsSeen: string[] = [];
  /** Nombre del archivo actual */
  private file: string;

  constructor(profile: ProfileName = '', file = '<unknown>') {
    super();
    this.profile = profile;
    this.file = file;
    this.scope = mkScope();
  }

  protected defaultResult(_node: Statement): TypeError[] {
    return [];
  }

  // ── Utilidades privadas ───────────────────────────────────

  private err(
    code: string,
    severity: 'error' | 'warning',
    message: string,
    location: SourceLocation,
    suggestion?: string,
  ): TypeError {
    return { code, severity, message, location, suggestion };
  }

  /** Todos los nombres declarados en el scope actual (para sugerencias) */
  private allDeclaredNames(): Iterable<string> {
    return this.scope.declared.keys();
  }

  /** Comprueba si el perfil actual es modal */
  private isModalProfile(): boolean {
    if (!this.profile) return false;
    return MODAL_PROFILES.has(this.profile);
  }

  /** Comprueba si el perfil actual es temporal */
  private isTemporalProfile(): boolean {
    if (!this.profile) return false;
    return TEMPORAL_PROFILES.has(this.profile);
  }

  /** Comprueba si el perfil actual soporta FO (cuantificadores) */
  private isFirstOrderProfile(): boolean {
    if (!this.profile) return false;
    return FIRST_ORDER_PROFILES.has(this.profile);
  }

  /**
   * Recorre una Formula recursivamente buscando errores.
   * Devuelve lista de errores encontrados.
   */
  private checkFormula(f: Formula, location: SourceLocation): TypeError[] {
    const errors: TypeError[] = [];

    switch (f.kind) {
      // TC004: Modalidades en perfil no-modal
      case 'modal_necessity':
      case 'modal_possibility': {
        if (!this.isModalProfile() && this.profile !== '') {
          const sym = f.kind === 'modal_necessity' ? '□' : '◇';
          errors.push(
            this.err(
              'TC004',
              'error',
              `Modalidad '${sym}' usada en perfil no-modal '${this.profile}'. ` +
                `Los operadores modales solo están disponibles en perfiles como modal.k, epistemic.s5, deontic.standard.`,
              f.source ?? location,
              `Cambia el perfil a 'modal.k' o elimina el operador '${sym}'.`,
            ),
          );
        }
        break;
      }

      // TC004b: Temporales en perfil no-temporal
      case 'temporal_next':
      case 'temporal_until': {
        if (!this.isTemporalProfile() && this.profile !== '') {
          const sym = f.kind === 'temporal_next' ? 'X' : 'U';
          errors.push(
            this.err(
              'TC004',
              'error',
              `Operador temporal '${sym}' usado en perfil no-temporal '${this.profile}'. ` +
                `Los operadores temporales solo están disponibles en 'temporal.ltl'.`,
              f.source ?? location,
              `Cambia el perfil a 'temporal.ltl' o elimina el operador.`,
            ),
          );
        }
        break;
      }

      // TC001 + TC002: Predicados — identidad y aridad
      case 'predicate': {
        if (f.name) {
          const arity = (f.params ?? f.terms ?? []).length;
          const knownArity = this.scope.predicates.get(f.name);
          if (knownArity !== undefined && knownArity !== arity) {
            // TC002: arity mismatch
            errors.push(
              this.err(
                'TC002',
                'error',
                `Aridad incorrecta para predicado '${f.name}': se esperaban ${knownArity} argumentos, se recibieron ${arity}.`,
                f.source ?? location,
              ),
            );
          }
          // TC001 no aplica a nivel de predicado atómico (depende de dominio FO),
          // pero si tenemos define_decl con ese nombre lo registramos.
        }
        break;
      }

      // TC005: Operaciones numéricas en contexto no-aritmético
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
      case 'modulo': {
        // Solo advertir si el perfil es explícitamente no-aritmético
        if (
          this.profile &&
          !this.profile.startsWith('arithmetic') &&
          !this.profile.startsWith('classical.first')
        ) {
          errors.push(
            this.err(
              'TC005',
              'warning',
              `Operación aritmética '${f.kind}' usada en perfil '${this.profile}'. ` +
                `La aritmética puede no estar soportada en este perfil.`,
              f.source ?? location,
            ),
          );
        }
        break;
      }

      // TC008: fn_call en fórmula — verifica aridad de funciones
      case 'fn_call': {
        if (f.name) {
          const declaredArity = this.scope.functions.get(f.name);
          const callArity = (f.args ?? []).length;
          if (declaredArity !== undefined && declaredArity !== callArity) {
            errors.push(
              this.err(
                'TC002',
                'error',
                `Aridad incorrecta para función '${f.name}': se esperaban ${declaredArity} argumentos, se recibieron ${callArity}.`,
                f.source ?? location,
                undefined,
              ),
            );
          } else if (declaredArity === undefined && this.scope.functions.size > 0) {
            // Función no declarada con sugerencia
            const suggestion = findClosest(f.name, this.scope.functions.keys());
            errors.push(
              this.err(
                'TC001',
                'warning',
                `Función '${f.name}' no está declarada.`,
                f.source ?? location,
                suggestion ? `¿Quisiste decir '${suggestion}'?` : undefined,
              ),
            );
          }
        }
        break;
      }
    }

    // Recurrir en sub-fórmulas
    if (f.args) {
      for (const sub of f.args) {
        errors.push(...this.checkFormula(sub, location));
      }
    }

    return errors;
  }

  /**
   * Visita recursivamente una lista de statements en un scope dado.
   */
  private visitStatements(stmts: Statement[], scope?: Scope): TypeError[] {
    const savedScope = this.scope;
    if (scope) this.scope = scope;
    const errors: TypeError[] = [];
    for (const stmt of stmts) {
      errors.push(...visit(stmt, this));
    }
    this.scope = savedScope;
    return errors;
  }

  // ── Visitors ──────────────────────────────────────────────

  override visitLogicDecl(node: LogicDeclNode): TypeError[] {
    this.profile = node.profile;
    return [];
  }

  override visitAxiomDecl(node: AxiomDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC006: Duplicado
    if (this.axiomNames.has(node.name)) {
      const prev = this.axiomNames.get(node.name)!;
      errors.push(
        this.err(
          'TC006',
          'error',
          `Axioma '${node.name}' ya fue declarado (primera declaración en línea ${prev.line}).`,
          location,
        ),
      );
    } else {
      this.axiomNames.set(node.name, location);
      this.scope.declared.set(node.name, 'axiom');
    }

    // Chequear la fórmula
    errors.push(...this.checkFormula(node.formula, location));

    return errors;
  }

  override visitTheoremDecl(node: TheoremDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC006: Duplicado
    if (this.theoremNames.has(node.name)) {
      const prev = this.theoremNames.get(node.name)!;
      errors.push(
        this.err(
          'TC006',
          'error',
          `Teorema '${node.name}' ya fue declarado (primera declaración en línea ${prev.line}).`,
          location,
        ),
      );
    } else {
      this.theoremNames.set(node.name, location);
      this.scope.declared.set(node.name, 'theorem');
    }

    errors.push(...this.checkFormula(node.formula, location));
    return errors;
  }

  override visitDeriveCmd(node: DeriveCmdNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    errors.push(...this.checkFormula(node.goal, location));

    // TC001: Premisas no declaradas
    for (const premise of node.premises) {
      if (!this.scope.declared.has(premise)) {
        const suggestion = findClosest(premise, this.allDeclaredNames());
        errors.push(
          this.err(
            'TC001',
            'error',
            `Premisa '${premise}' usada en 'derive' no está declarada.`,
            location,
            suggestion ? `¿Quisiste decir '${suggestion}'?` : undefined,
          ),
        );
      }
    }

    return errors;
  }

  override visitCheckValidCmd(node: CheckValidCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitCheckSatisfiableCmd(node: CheckSatisfiableCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitCheckEquivalentCmd(node: CheckEquivalentCmdNode): TypeError[] {
    return [
      ...this.checkFormula(node.left, loc(node)),
      ...this.checkFormula(node.right, loc(node)),
    ];
  }

  override visitProveCmd(node: ProveCmdNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    errors.push(...this.checkFormula(node.goal, location));

    // TC001: Premisas no declaradas
    for (const premise of node.premises) {
      if (!this.scope.declared.has(premise)) {
        const suggestion = findClosest(premise, this.allDeclaredNames());
        errors.push(
          this.err(
            'TC001',
            'error',
            `Premisa '${premise}' usada en 'prove' no está declarada.`,
            location,
            suggestion ? `¿Quisiste decir '${suggestion}'?` : undefined,
          ),
        );
      }
    }

    return errors;
  }

  override visitCountermodelCmd(node: CountermodelCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitTruthTableCmd(node: TruthTableCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitLetDecl(node: LetDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC003: Registrar el binding (antes de chequear la fórmula para evitar
    // falso positivo en definiciones recursivas — aceptamos forward-ref)
    this.scope.declared.set(node.name, 'let');

    if (node.letType === 'formula' || node.letType === 'formalize') {
      const formula = node.letType === 'formula' ? node.formula : node.formula;
      if (formula) {
        errors.push(...this.checkFormula(formula, location));
      }
    }

    return errors;
  }

  override visitAnalyzeCmd(node: AnalyzeCmdNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    for (const p of node.premises) {
      errors.push(...this.checkFormula(p, location));
    }
    errors.push(...this.checkFormula(node.conclusion, location));
    return errors;
  }

  override visitExplainCmd(node: ExplainCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitImportDecl(node: ImportDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    const path = node.path;

    // TC007: Circular import (detección básica — mismo archivo)
    if (path === this.file) {
      errors.push(
        this.err(
          'TC007',
          'error',
          `Importación circular detectada: '${path}' se importa a sí mismo.`,
          location,
        ),
      );
    } else if (this.importsSeen.includes(path)) {
      errors.push(
        this.err(
          'TC007',
          'error',
          `Importación duplicada: '${path}' ya fue importado en este programa.`,
          location,
        ),
      );
    } else {
      this.importsSeen.push(path);
    }

    return errors;
  }

  override visitProofBlock(node: ProofBlockNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    const innerScope = mkScope(this.scope);

    // Registrar suposiciones en el scope del bloque
    for (const assumption of node.assumptions) {
      innerScope.declared.set(assumption.name, 'axiom');
      errors.push(...this.checkFormula(assumption.formula, location));
    }

    errors.push(...this.checkFormula(node.goal, location));
    errors.push(...this.visitStatements(node.body, innerScope));
    return errors;
  }

  override visitTheoryDecl(node: TheoryDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    const theoryScope = mkScope(this.scope);

    // Registrar la teoría en el scope externo
    this.scope.declared.set(node.name, 'let');

    // Parámetros de la teoría en el scope interno
    if (node.params) {
      for (const param of node.params) {
        theoryScope.declared.set(param, 'param');
      }
    }

    // TC006: nombre duplicado de teoría (ya se manejará con el declared map)
    const savedAxioms = new Map(this.axiomNames);
    const savedTheorems = new Map(this.theoremNames);

    const savedScope = this.scope;
    this.scope = theoryScope;

    for (const member of node.members) {
      errors.push(...visit(member.statement, this));
    }

    this.scope = savedScope;
    // Restaurar nombre maps globales (las teorías tienen su propio espacio)
    this.axiomNames = savedAxioms;
    this.theoremNames = savedTheorems;

    return errors;
  }

  override visitIfStmt(node: IfStmtNode): TypeError[] {
    const errors: TypeError[] = [];
    for (const branch of node.branches) {
      errors.push(...this.checkFormula(branch.formula, loc(node)));
      errors.push(...this.visitStatements(branch.body));
    }
    if (node.elseBranch) {
      errors.push(...this.visitStatements(node.elseBranch));
    }
    return errors;
  }

  override visitForStmt(node: ForStmtNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);
    const innerScope = mkScope(this.scope);
    innerScope.declared.set(node.variable, 'let');

    for (const item of node.items) {
      errors.push(...this.checkFormula(item, location));
    }
    errors.push(...this.visitStatements(node.body, innerScope));
    return errors;
  }

  override visitWhileStmt(node: WhileStmtNode): TypeError[] {
    const errors: TypeError[] = [];
    errors.push(...this.checkFormula(node.formula, loc(node)));
    errors.push(...this.visitStatements(node.body));
    return errors;
  }

  override visitFnDecl(node: FnDeclNode): TypeError[] {
    const errors: TypeError[] = [];

    // Registrar la función en el scope externo con su aridad
    this.scope.declared.set(node.name, 'fn');
    this.scope.functions.set(node.name, node.params.length);

    // Scope interno: parámetros como let
    const innerScope = mkScope(this.scope);
    innerScope.insideFn = true;
    for (const param of node.params) {
      innerScope.declared.set(param, 'param');
    }

    errors.push(...this.visitStatements(node.body, innerScope));
    return errors;
  }

  override visitReturnStmt(node: ReturnStmtNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC008: return fuera de fn
    if (!this.scope.insideFn) {
      errors.push(
        this.err(
          'TC008',
          'error',
          `'return' usado fuera de una declaración 'fn'. Solo se puede usar 'return' dentro de una función.`,
          location,
        ),
      );
    }

    if (node.formula) {
      errors.push(...this.checkFormula(node.formula, location));
    }

    return errors;
  }

  override visitFnCall(node: FnCallNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC001: función no declarada
    if (!this.scope.declared.has(node.name)) {
      const suggestion = findClosest(node.name, this.allDeclaredNames());
      errors.push(
        this.err(
          'TC001',
          'error',
          `Función '${node.name}' llamada pero no declarada.`,
          location,
          suggestion ? `¿Quisiste decir '${suggestion}'?` : undefined,
        ),
      );
    } else {
      // TC002: aridad
      const declaredArity = this.scope.functions.get(node.name);
      if (declaredArity !== undefined && declaredArity !== node.args.length) {
        errors.push(
          this.err(
            'TC002',
            'error',
            `Aridad incorrecta para '${node.name}': se esperaban ${declaredArity} argumentos, se recibieron ${node.args.length}.`,
            location,
          ),
        );
      }
    }

    for (const arg of node.args) {
      errors.push(...this.checkFormula(arg, location));
    }

    return errors;
  }

  override visitExportDecl(node: ExportDeclNode): TypeError[] {
    return visit(node.statement, this);
  }

  override visitDefineDecl(node: DefineDeclNode): TypeError[] {
    const errors: TypeError[] = [];
    const location = loc(node);

    // TC006: define duplicado
    if (this.scope.declared.has(node.name)) {
      errors.push(
        this.err(
          'TC006',
          'warning',
          `Definición '${node.name}' ya existe en el scope actual.`,
          location,
        ),
      );
    } else {
      this.scope.declared.set(node.name, 'define');
      // Registrar como predicado si tiene params (aridad conocida)
      if (node.params !== undefined) {
        this.scope.predicates.set(node.name, node.params.length);
      }
    }

    // Scope interno con parámetros
    const innerScope = mkScope(this.scope);
    if (node.params) {
      for (const param of node.params) {
        innerScope.declared.set(param, 'param');
      }
    }

    const savedScope = this.scope;
    this.scope = innerScope;
    errors.push(...this.checkFormula(node.body, location));
    this.scope = savedScope;

    return errors;
  }

  override visitUnfoldCmd(node: UnfoldCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitFoldCmd(node: FoldCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }

  override visitInterpretCmd(node: InterpretCmdNode): TypeError[] {
    return this.checkFormula(node.formula, loc(node));
  }
}

// ── Función principal de API ──────────────────────────────────

/**
 * Ejecuta el type-checker estático sobre un Program ya parseado.
 *
 * @param program AST del programa ST
 * @param profile Nombre del perfil activo (puede estar en el AST como logic_decl)
 * @param file    Nombre del archivo (para TC007)
 * @returns Lista de TypeError[]  — vacía si no hay errores
 */
export function typeCheck(
  program: Program,
  profile: ProfileName = '',
  file?: string,
): TypeError[] {
  const checker = new TypeChecker(profile, file ?? program.file ?? '<unknown>');
  const errors: TypeError[] = [];

  for (const stmt of program.statements) {
    errors.push(...visit(stmt, checker));
  }

  return errors;
}
