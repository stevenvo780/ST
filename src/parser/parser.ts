/**
 * ST Parser — Parser recursivo descendente
 *
 * Refactor α2 (V4): el parser monolitico se descompone en modulos.
 * - ./state.ts        — ParserState: token cursor + diagnostico
 * - ./formulas.ts     — precedencia de formulas + MODAL_ALIASES + formulaToString
 *
 * La clase `Parser` es el facade publico: misma firma de constructor,
 * mismo `parse(source): Program`, mismo `diagnostics`. Los consumidores
 * (interpreter, cli, api, protocol/handler) NO cambian.
 */

import { Token, TokenType } from '../lexer/tokens';
import { Lexer } from '../lexer/lexer';
import { Formula, Diagnostic, SourceLocation } from '../types';
import { normalizeSTSource } from '../runtime/compat';
import {
  Program,
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
  TheoryMember,
  PrintCmdNode,
  SetCmdNode,
  IfStmtNode,
  IfBranch,
  ForStmtNode,
  WhileStmtNode,
  FnDeclNode,
  ReturnStmtNode,
  FnCallNode,
  ActionExprNode,
  DefineDeclNode,
  UnfoldCmdNode,
  FoldCmdNode,
  SourceDeclNode,
  SourceField,
  InterpretCmdNode,
  GlossaryCmdNode,
} from '../ast/nodes';
import { ParserState } from './state';
import { parseFormula as parseFormulaModule, parseIdList, formulaToString } from './formulas';

export class Parser {
  private state: ParserState;
  private initialProfile: string | undefined;

  constructor(file: string = '<stdin>', profile?: string) {
    this.state = new ParserState(file);
    this.initialProfile = profile;
  }

  // --- Acceso compatible al estado (diagnostics expuesto como antes) ---

  get diagnostics(): Diagnostic[] {
    return this.state.diagnostics;
  }

  set diagnostics(value: Diagnostic[]) {
    this.state.diagnostics = value;
  }

  parse(source: string): Program {
    const normalizedSource = normalizeSTSource(source);
    const lexer = new Lexer(normalizedSource, this.state.file, this.initialProfile);
    this.state.tokens = lexer.tokenize();
    this.state.diagnostics.push(...lexer.diagnostics);
    this.state.pos = 0;
    this.state.contextStack = [];

    const statements: Statement[] = [];

    while (!this.state.isAtEnd()) {
      this.state.skipNewlines();
      if (this.state.isAtEnd()) break;

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo inesperado';
        this.state.pushDiagnostic('error', message);
        this.advanceToNextStatement();
      }
    }

    return { statements, file: this.state.file };
  }

  // --- Parsing de statements ---

  private parseStatement(): Statement | null {
    const s = this.state;
    const tok = s.current();

    // Detección de llamada a función: nombre(...)
    if (
      s.peek(1) === TokenType.LPAREN &&
      (tok.type === TokenType.IDENTIFIER || s.knownFunctionNames.has(tok.value))
    ) {
      return s.withContext(`llamada a funcion '${tok.value}'`, () => this.parseFnCall());
    }

    // Detección de llamada a método: objeto.metodo(...)
    if (
      tok.type === TokenType.IDENTIFIER &&
      s.peek(1) === TokenType.DOT &&
      s.peek(2) === TokenType.IDENTIFIER &&
      s.peek(3) === TokenType.LPAREN
    ) {
      return s.withContext(`llamada a metodo '${tok.value}'`, () => this.parseMemberFnCall());
    }

    return s.withContext(this.describeStatementContext(tok), () => {
      switch (tok.type) {
        case TokenType.LOGIC:
          return this.parseLogicDecl();
        case TokenType.AXIOM:
          return this.parseAxiomDecl();
        case TokenType.THEOREM:
          return this.parseTheoremDecl();
        case TokenType.DERIVE:
          return this.parseDeriveCmd();
        case TokenType.CHECK:
          return this.parseCheckCmd();
        case TokenType.PROVE:
          return this.parseProveCmd();
        case TokenType.COUNTERMODEL:
        case TokenType.REFUTE:
          return this.parseCountermodelCmd();
        case TokenType.TRUTH_TABLE:
          return this.parseTruthTableCmd();
        case TokenType.LET:
          return this.parseLetDecl();
        case TokenType.CLAIM:
          return this.parseClaimDecl();
        case TokenType.SUPPORT:
          return this.parseSupportDecl();
        case TokenType.CONFIDENCE:
          return this.parseConfidenceDecl();
        case TokenType.CONTEXT:
          return this.parseContextDecl();
        case TokenType.RENDER:
          return this.parseRenderCmd();
        case TokenType.ANALYZE:
          return this.parseAnalyzeCmd();
        case TokenType.EXPLAIN:
          return this.parseExplainCmd();
        case TokenType.IMPORT:
          return this.parseImportDecl();
        case TokenType.ASSUME:
          return this.parseProofBlock();
        case TokenType.THEORY:
          return this.parseTheoryDecl();
        case TokenType.PRINT:
          return this.parsePrintCmd();
        case TokenType.SET:
          return this.parseSetCmd();
        case TokenType.IF:
          return this.parseIfStmt();
        case TokenType.FOR:
          return this.parseForStmt();
        case TokenType.WHILE:
          return this.parseWhileStmt();
        case TokenType.FN:
          return this.parseFnDecl();
        case TokenType.RETURN:
          return this.parseReturnStmt();
        case TokenType.EXPORT:
          return this.parseExportDecl();
        case TokenType.DEFINE:
          return this.parseDefineDecl();
        case TokenType.UNFOLD:
          return this.parseUnfoldCmd();
        case TokenType.FOLD:
          return this.parseFoldCmd();
        case TokenType.SOURCE_KW:
          return this.parseSourceDecl();
        case TokenType.INTERPRET:
          return this.parseInterpretCmd();
        case TokenType.GLOSSARY:
          return this.parseGlossaryCmd();
        case TokenType.IDENTIFIER:
          throw new Error(s.contextualize(`Statement inesperado: '${tok.value}' (${tok.type})`));
        case TokenType.NEWLINE:
          s.advance();
          return null;
        case TokenType.EOF:
          return null;
        default:
          throw new Error(s.contextualize(`Statement inesperado: '${tok.value}' (${tok.type})`));
      }
    });
  }

  // logic classical.propositional
  private parseLogicDecl(): LogicDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.LOGIC);
    let profile = s.expectIdent();
    while (s.match(TokenType.DOT)) {
      profile += '.';
      profile += s.expectIdent();
    }
    s.currentProfile = profile;
    return { kind: 'logic_decl', profile, source: src };
  }

  // axiom name = FORMULA  o  axiom name : FORMULA
  private parseAxiomDecl(): AxiomDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.AXIOM);
    const name = s.expectIdent();
    s.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'axiom_decl', name, formula, source: src };
  }

  // theorem name = FORMULA  o  theorem name : FORMULA
  private parseTheoremDecl(): TheoremDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.THEOREM);
    const name = s.expectIdent();
    s.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'theorem_decl', name, formula, source: src };
  }

  // derive FORMULA from {a1, a2, ...}
  private parseDeriveCmd(): DeriveCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.DERIVE);
    const goal = this.parseFormula();
    s.expect(TokenType.FROM);
    const premises = parseIdList(s);
    return { kind: 'derive_cmd', goal, premises, source: src };
  }

  // check valid FORMULA | check satisfiable FORMULA | check equivalent F, F
  private parseCheckCmd(): Statement {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.CHECK);

    if (s.match(TokenType.VALID)) {
      const formula = this.parseFormula();
      return { kind: 'check_valid_cmd', formula, source: src } as CheckValidCmdNode;
    }
    if (s.match(TokenType.SATISFIABLE)) {
      const formula = this.parseFormula();
      return { kind: 'check_satisfiable_cmd', formula, source: src } as CheckSatisfiableCmdNode;
    }
    if (s.match(TokenType.EQUIVALENT)) {
      const left = this.parseFormula();
      s.expect(TokenType.COMMA);
      const right = this.parseFormula();
      return { kind: 'check_equivalent_cmd', left, right, source: src } as CheckEquivalentCmdNode;
    }

    throw new Error(`Se esperaba 'valid', 'satisfiable' o 'equivalent' despues de 'check'`);
  }

  // prove FORMULA [from {a1, a2}]
  private parseProveCmd(): ProveCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.PROVE);
    const goal = this.parseFormula();
    let premises: string[] = [];
    if (s.match(TokenType.FROM)) {
      premises = parseIdList(s);
    }
    return { kind: 'prove_cmd', goal, premises, source: src };
  }

  // countermodel FORMULA | refute FORMULA
  private parseCountermodelCmd(): CountermodelCmdNode {
    const s = this.state;
    const src = s.loc();
    if (s.checkType(TokenType.COUNTERMODEL)) {
      s.advance();
    } else {
      s.expect(TokenType.REFUTE);
    }
    const formula = this.parseFormula();
    return { kind: 'countermodel_cmd', formula, source: src };
  }

  // truth_table FORMULA
  private parseTruthTableCmd(): TruthTableCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.TRUTH_TABLE);
    const formula = this.parseFormula();
    return { kind: 'truth_table_cmd', formula, source: src };
  }

  // let name = passage([[path#anchor]])
  // let name = formalize passageName as FORMULA
  private parseLetDecl(): LetDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.LET);
    const name = s.expectIdent();
    s.expect(TokenType.EQUALS);

    if (this.canStartActionExpr()) {
      const action = this.parseActionExpr();
      return { kind: 'let_decl', name, letType: 'action', action, source: src };
    }

    if (s.match(TokenType.PASSAGE)) {
      // passage @Source "text" (standalone passage with source and raw text)
      if (s.checkType(TokenType.AT)) {
        s.advance(); // skip @
        const sourceRef = s.expectName();
        let section = '';
        if (s.checkType(TokenType.STRING)) {
          // No section, just text
        } else if (s.checkType(TokenType.IDENTIFIER) || s.checkType(TokenType.NUMBER)) {
          section = s.current().value;
          s.advance();
        }
        if (s.checkType(TokenType.STRING)) {
          s.advance();
          const anchorPath = `@${sourceRef}${section ? '#' + section : ''}`;
          return { kind: 'let_decl', name, letType: 'passage', anchorPath, source: src };
        }
      }
      s.expect(TokenType.LPAREN);
      s.expect(TokenType.LBRACKET_DOUBLE);
      let anchorPath = '';
      if (s.checkType(TokenType.STRING)) {
        anchorPath = s.current().value;
        s.advance();
      } else {
        while (!s.checkType(TokenType.RBRACKET_DOUBLE) && !s.isAtEnd()) {
          anchorPath += s.current().value;
          s.advance();
        }
      }
      s.expect(TokenType.RBRACKET_DOUBLE);
      s.expect(TokenType.RPAREN);
      return { kind: 'let_decl', name, letType: 'passage', anchorPath, source: src };
    }

    if (s.match(TokenType.FORMALIZE)) {
      const passageName = s.expectIdent();
      s.expect(TokenType.AS);
      const formula = this.parseFormula();
      return { kind: 'let_decl', name, letType: 'formalize', passageName, formula, source: src };
    }

    // let name = "texto descriptivo" [: FORMULA]
    if (s.checkType(TokenType.STRING)) {
      const description = s.current().value;
      s.advance();
      if (s.match(TokenType.COLON)) {
        const formula = this.parseFormula();
        return { kind: 'let_decl', name, letType: 'formula', formula, description, source: src };
      }
      return { kind: 'let_decl', name, letType: 'description', description, source: src };
    }

    // let name = FORMULA (alias de fórmula)
    const formula = this.parseFormula();
    return { kind: 'let_decl', name, letType: 'formula', formula, source: src };
  }

  // claim name = ID_OR_FORMULA
  private parseClaimDecl(): ClaimDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.CLAIM);
    const name = s.expectIdent();
    s.expect(TokenType.EQUALS);

    if (s.checkType(TokenType.IDENTIFIER) && s.peek(1) !== TokenType.LPAREN) {
      const val = s.current().value;
      const saved = s.pos;
      s.advance();
      if (s.isAtEnd() || s.checkType(TokenType.NEWLINE)) {
        return { kind: 'claim_decl', name, value: val, formalization: val, source: src };
      }
      s.pos = saved;
    }

    const formula = this.parseFormula();
    return {
      kind: 'claim_decl',
      name,
      value: formulaToString(formula),
      formula,
      source: src,
    };
  }

  // support claimName <- sourceName
  private parseSupportDecl(): SupportDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.SUPPORT);
    const claimName = s.expectIdent();
    s.expect(TokenType.BACK_ARROW);
    const sourceName = s.expectIdent();
    return { kind: 'support_decl', claimName, sourceName, source: src };
  }

  // confidence claimName = NUMBER
  private parseConfidenceDecl(): ConfidenceDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.CONFIDENCE);
    const claimName = s.expectIdent();
    s.expect(TokenType.EQUALS);
    const tok = s.expect(TokenType.NUMBER);
    return { kind: 'confidence_decl', claimName, value: parseFloat(tok.value), source: src };
  }

  // context claimName = "text"
  private parseContextDecl(): ContextDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.CONTEXT);
    const claimName = s.expectIdent();
    s.expect(TokenType.EQUALS);
    const tok = s.expect(TokenType.STRING);
    return { kind: 'context_decl', claimName, text: tok.value, source: src };
  }

  // render target [as FORMAT] | render glossary [as FORMAT] | render analysis [as FORMAT]
  private parseRenderCmd(): RenderCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.RENDER);
    let target: string;
    if (s.checkType(TokenType.THEORY)) {
      target = s.current().value;
      s.advance();
    } else if (s.checkType(TokenType.GLOSSARY)) {
      target = 'glossary';
      s.advance();
    } else {
      target = s.expectIdent();
    }
    let format = 'markdown';
    if (s.match(TokenType.AS)) {
      if (s.checkType(TokenType.IDENTIFIER)) {
        format = s.current().value;
        s.advance();
      }
    } else if (s.checkType(TokenType.IDENTIFIER)) {
      format = s.current().value;
      s.advance();
    }
    return { kind: 'render_cmd', target, format, source: src };
  }

  // analyze {P1, P2, ...} -> CONCLUSION
  private parseAnalyzeCmd(): AnalyzeCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.ANALYZE);
    s.expect(TokenType.LBRACE);
    const premises: Formula[] = [];
    if (!s.checkType(TokenType.RBRACE)) {
      premises.push(this.parseFormula());
      while (s.match(TokenType.COMMA)) {
        premises.push(this.parseFormula());
      }
    }
    s.expect(TokenType.RBRACE);
    s.expect(TokenType.ARROW);
    const conclusion = this.parseFormula();
    return { kind: 'analyze_cmd', premises, conclusion, source: src };
  }

  // explain FORMULA
  private parseExplainCmd(): ExplainCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.EXPLAIN);
    const formula = this.parseFormula();
    return { kind: 'explain_cmd', formula, source: src };
  }

  private canStartActionExpr(): boolean {
    const s = this.state;
    return (
      s.checkType(TokenType.CHECK) ||
      s.checkType(TokenType.DERIVE) ||
      s.checkType(TokenType.PROVE) ||
      s.checkType(TokenType.COUNTERMODEL) ||
      s.checkType(TokenType.REFUTE) ||
      s.checkType(TokenType.TRUTH_TABLE) ||
      s.checkType(TokenType.EXPLAIN)
    );
  }

  private parseActionExpr(): ActionExprNode {
    const s = this.state;
    const src = s.loc();

    if (s.match(TokenType.CHECK)) {
      if (s.match(TokenType.VALID)) {
        const formula = this.parseFormula();
        return { kind: 'action_expr', action: 'check_valid', formula, source: src };
      }
      if (s.match(TokenType.SATISFIABLE)) {
        const formula = this.parseFormula();
        return { kind: 'action_expr', action: 'check_satisfiable', formula, source: src };
      }
      if (s.match(TokenType.EQUIVALENT)) {
        const left = this.parseFormula();
        s.expect(TokenType.COMMA);
        const right = this.parseFormula();
        return { kind: 'action_expr', action: 'check_equivalent', left, right, source: src };
      }
      throw new Error(`Se esperaba 'valid', 'satisfiable' o 'equivalent' despues de 'check'`);
    }

    if (s.match(TokenType.DERIVE)) {
      const goal = this.parseFormula();
      s.expect(TokenType.FROM);
      const premises = parseIdList(s);
      return { kind: 'action_expr', action: 'derive', goal, premises, source: src };
    }

    if (s.match(TokenType.PROVE)) {
      const goal = this.parseFormula();
      s.expect(TokenType.FROM);
      const premises = parseIdList(s);
      return { kind: 'action_expr', action: 'prove', goal, premises, source: src };
    }

    if (s.checkType(TokenType.COUNTERMODEL)) {
      s.advance();
      const formula = this.parseFormula();
      return { kind: 'action_expr', action: 'countermodel', formula, source: src };
    }

    if (s.match(TokenType.REFUTE)) {
      const formula = this.parseFormula();
      return { kind: 'action_expr', action: 'countermodel', formula, source: src };
    }

    if (s.match(TokenType.TRUTH_TABLE)) {
      const formula = this.parseFormula();
      return { kind: 'action_expr', action: 'truth_table', formula, source: src };
    }

    if (s.match(TokenType.EXPLAIN)) {
      const formula = this.parseFormula();
      return { kind: 'action_expr', action: 'explain', formula, source: src };
    }

    throw new Error(`Se esperaba una acción capturable, encontrado '${s.current().value}'`);
  }

  // import "path/to/file.st" | import path/to/file
  private parseImportDecl(): ImportDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.IMPORT);
    let path: string;
    if (s.checkType(TokenType.STRING)) {
      path = s.current().value;
      s.advance();
    } else {
      path = s.expectIdent();
      while (s.checkType(TokenType.DOT) || s.checkType(TokenType.IDENTIFIER)) {
        if (s.match(TokenType.DOT)) {
          path += '.';
          if (s.checkType(TokenType.IDENTIFIER)) {
            path += s.current().value;
            s.advance();
          }
        } else {
          break;
        }
      }
    }
    return { kind: 'import_decl', path, source: src };
  }

  // assume name : FORMULA\n ... \n show FORMULA\n ... \n qed
  private parseProofBlock(): ProofBlockNode {
    const s = this.state;
    const src = s.loc();
    const assumptions: { name: string; formula: Formula }[] = [];

    while (s.checkType(TokenType.ASSUME)) {
      s.advance();
      const name = s.expectIdent();
      s.expectOneOf(TokenType.COLON, TokenType.EQUALS);
      const formula = this.parseFormula();
      assumptions.push({ name, formula });
      s.skipNewlines();
    }

    s.expect(TokenType.SHOW);
    const goal = this.parseFormula();
    s.skipNewlines();

    const body: Statement[] = [];
    while (!s.checkType(TokenType.QED) && !s.isAtEnd()) {
      s.skipNewlines();
      if (s.checkType(TokenType.QED)) break;
      try {
        const stmt = s.checkType(TokenType.ASSUME) ? this.parseProofBlock() : this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo en bloque de prueba';
        s.pushDiagnostic('error', message);
        this.advanceToNextStatement();
      }
    }
    if (s.isAtEnd()) {
      throw new Error(
        `Se esperaba 'qed' para cerrar el bloque de prueba abierto en linea ${src.line}, columna ${src.column}`,
      );
    }
    s.expect(TokenType.QED);

    return { kind: 'proof_block', assumptions, goal, body, source: src };
  }

  // theory Name(params) { ... } | theory Name extends Parent { ... }
  private parseTheoryDecl(): TheoryDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.THEORY);
    const name = s.expectName();
    s.knownTheoryNames.add(name);

    let params: string[] | undefined;
    if (s.match(TokenType.LPAREN)) {
      params = [];
      if (!s.checkType(TokenType.RPAREN)) {
        params.push(s.expectName());
        while (s.match(TokenType.COMMA)) {
          params.push(s.expectName());
        }
      }
      s.expect(TokenType.RPAREN);
    }

    let parent: string | undefined;
    if (s.match(TokenType.EXTENDS)) {
      parent = s.expectName();
    }

    s.expect(TokenType.LBRACE);
    s.skipNewlines();

    const members: TheoryMember[] = [];

    while (!s.checkType(TokenType.RBRACE) && !s.isAtEnd()) {
      s.skipNewlines();
      if (s.checkType(TokenType.RBRACE)) break;

      let visibility: 'public' | 'private' = 'public';
      if (s.match(TokenType.PRIVATE)) {
        visibility = 'private';
      }

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          members.push({ statement: stmt, visibility });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo en theory';
        s.pushDiagnostic('error', message);
        this.advanceToNextStatement();
      }
    }
    s.expect(TokenType.RBRACE);

    return { kind: 'theory_decl', name, params, parent, members, source: src };
  }

  // --- print "texto" | print formula ---
  private parsePrintCmd(): PrintCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.PRINT);
    if (s.checkType(TokenType.STRING)) {
      const value = s.current().value;
      s.advance();
      return { kind: 'print_cmd', value, source: src };
    }
    const formula = this.parseFormula();
    return { kind: 'print_cmd', value: null, formula, source: src };
  }

  // --- set x = formula ---
  private parseSetCmd(): SetCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.SET);
    const name = s.expectName();
    s.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'set_cmd', name, formula, source: src };
  }

  // --- if valid FORMULA { } else if satisfiable FORMULA { } else { } ---
  private parseIfStmt(): IfStmtNode {
    const s = this.state;
    const src = s.loc();
    const branches: IfBranch[] = [];
    let elseBranch: Statement[] | undefined;

    s.expect(TokenType.IF);
    branches.push(this.parseConditionBranch());

    while (this.checkElseIf()) {
      s.expect(TokenType.ELSE);
      s.expect(TokenType.IF);
      branches.push(this.parseConditionBranch());
    }

    if (s.match(TokenType.ELSE)) {
      elseBranch = this.parseBlock();
    }

    return { kind: 'if_stmt', branches, elseBranch, source: src };
  }

  private checkElseIf(): boolean {
    const s = this.state;
    if (!s.checkType(TokenType.ELSE)) return false;
    let lookahead = 1;
    while (s.peek(lookahead) === TokenType.NEWLINE) lookahead++;
    return s.peek(lookahead) === TokenType.IF;
  }

  private parseConditionBranch(): IfBranch {
    const condition = this.parseConditionKeyword();
    const formula = this.parseFormula();
    const body = this.parseBlock();
    return { condition, formula, body };
  }

  private parseConditionKeyword(): 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid' {
    const s = this.state;
    if (s.match(TokenType.VALID)) return 'valid';
    if (s.match(TokenType.SATISFIABLE)) return 'satisfiable';
    if (s.checkType(TokenType.IDENTIFIER)) {
      const v = s.current().value.toLowerCase();
      if (v === 'invalid' || v === 'invalido') {
        s.advance();
        return 'invalid';
      }
      if (v === 'unsatisfiable' || v === 'insatisfacible') {
        s.advance();
        return 'unsatisfiable';
      }
    }
    throw new Error(
      s.contextualize(
        `Se esperaba una condición lógica ('valid', 'satisfiable', 'invalid' o 'unsatisfiable'), encontrado '${s.current().value}'`,
      ),
    );
  }

  // --- for x in {A, B, C} { body } ---
  private parseForStmt(): ForStmtNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.FOR);
    const variable = s.expectName();
    s.expect(TokenType.IN);
    s.expect(TokenType.LBRACE);
    const items: Formula[] = [];
    if (!s.checkType(TokenType.RBRACE)) {
      items.push(this.parseFormula());
      while (s.match(TokenType.COMMA)) {
        items.push(this.parseFormula());
      }
    }
    s.expect(TokenType.RBRACE);
    const body = this.parseBlock();
    return { kind: 'for_stmt', variable, items, body, source: src };
  }

  // --- while valid FORMULA { body } ---
  private parseWhileStmt(): WhileStmtNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.WHILE);
    const condition = this.parseConditionKeyword();
    const formula = this.parseFormula();
    const body = this.parseBlock();
    return { kind: 'while_stmt', condition, formula, body, maxIterations: 1000, source: src };
  }

  // --- fn nombre(param1, param2) { body } ---
  private parseFnDecl(): FnDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.FN);
    const name = s.expectName();
    s.knownFunctionNames.add(name);
    s.expect(TokenType.LPAREN);
    const params: string[] = [];
    if (!s.checkType(TokenType.RPAREN)) {
      params.push(s.expectName());
      while (s.match(TokenType.COMMA)) {
        params.push(s.expectName());
      }
    }
    s.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { kind: 'fn_decl', name, params, body, source: src };
  }

  // --- return formula ---
  private parseReturnStmt(): ReturnStmtNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.RETURN);
    let formula: Formula | undefined;
    if (
      !s.checkType(TokenType.NEWLINE) &&
      !s.checkType(TokenType.EOF) &&
      !s.checkType(TokenType.RBRACE)
    ) {
      formula = this.parseFormula();
    }
    return { kind: 'return_stmt', formula, source: src };
  }

  // --- export STATEMENT ---
  private parseExportDecl(): ExportDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.EXPORT);
    const stmt = this.parseStatement();
    if (!stmt) {
      throw new Error('Se esperaba un statement después de "export"');
    }
    const exportable = [
      'let_decl',
      'axiom_decl',
      'theorem_decl',
      'fn_decl',
      'theory_decl',
      'define_decl',
    ];
    if (!exportable.includes(stmt.kind)) {
      throw new Error(`No se puede exportar un statement de tipo: ${stmt.kind}`);
    }
    return { kind: 'export_decl', statement: stmt, source: src };
  }

  // --- define NAME(params?) := FORMULA (description "text")? ---
  private parseDefineDecl(): DefineDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.DEFINE);
    const name = s.expectName();

    let params: string[] | undefined;
    if (s.match(TokenType.LPAREN)) {
      params = [];
      if (!s.checkType(TokenType.RPAREN)) {
        params.push(s.expectName());
        while (s.match(TokenType.COMMA)) {
          params.push(s.expectName());
        }
      }
      s.expect(TokenType.RPAREN);
    }

    if (s.match(TokenType.COLON)) {
      s.expect(TokenType.EQUALS);
    } else {
      s.expect(TokenType.EQUALS);
    }

    const body = this.parseFormula();

    let description: string | undefined;
    s.skipNewlines();
    if (s.checkType(TokenType.DESCRIPTION)) {
      s.advance();
      if (s.checkType(TokenType.STRING)) {
        description = s.current().value;
        s.advance();
      }
    }

    return { kind: 'define_decl', name, params, body, description, source: src };
  }

  // --- unfold FORMULA ---
  private parseUnfoldCmd(): UnfoldCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.UNFOLD);
    const formula = this.parseFormula();
    return { kind: 'unfold_cmd', formula, source: src };
  }

  // --- fold FORMULA ---
  private parseFoldCmd(): FoldCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.FOLD);
    const formula = this.parseFormula();
    return { kind: 'fold_cmd', formula, source: src };
  }

  // --- source NAME { key "value", ... } ---
  private parseSourceDecl(): SourceDeclNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.SOURCE_KW);
    const name = s.expectName();
    s.expect(TokenType.LBRACE);
    s.skipNewlines();

    const fields: SourceField[] = [];
    while (!s.checkType(TokenType.RBRACE) && !s.isAtEnd()) {
      s.skipNewlines();
      if (s.checkType(TokenType.RBRACE)) break;
      const key = s.expectName();
      if (s.checkType(TokenType.STRING)) {
        fields.push({ key, value: s.current().value });
        s.advance();
      } else if (s.checkType(TokenType.NUMBER)) {
        fields.push({ key, value: parseFloat(s.current().value) });
        s.advance();
      } else if (s.checkType(TokenType.MINUS)) {
        s.advance();
        if (s.checkType(TokenType.NUMBER)) {
          fields.push({ key, value: -parseFloat(s.current().value) });
          s.advance();
        }
      }
      s.skipNewlines();
    }
    s.expect(TokenType.RBRACE);
    return { kind: 'source_decl', name, fields, source: src };
  }

  // --- interpret "text" as FORMULA  |  interpret IDENT as FORMULA ---
  private parseInterpretCmd(): InterpretCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.INTERPRET);

    let text: string;
    let passageRef: string | undefined;

    if (s.checkType(TokenType.STRING)) {
      text = s.current().value;
      s.advance();
    } else {
      passageRef = s.expectName();
      text = passageRef;
    }

    s.expect(TokenType.AS);
    const formula = this.parseFormula();

    return { kind: 'interpret_cmd', text, passageRef, formula, source: src };
  }

  // --- glossary ---
  private parseGlossaryCmd(): GlossaryCmdNode {
    const s = this.state;
    const src = s.loc();
    s.expect(TokenType.GLOSSARY);
    return { kind: 'glossary_cmd', source: src };
  }

  // --- nombre(arg1, arg2) — llamada a función ---
  private parseFnCall(): FnCallNode {
    const s = this.state;
    const src = s.loc();
    const name = s.expectName();
    s.expect(TokenType.LPAREN);
    const args: Formula[] = [];
    if (!s.checkType(TokenType.RPAREN)) {
      args.push(this.parseFormula());
      while (s.match(TokenType.COMMA)) {
        args.push(this.parseFormula());
      }
    }
    s.expect(TokenType.RPAREN);
    return { kind: 'fn_call', name, args, source: src };
  }

  // --- obj.method(arg1, arg2) ---
  private parseMemberFnCall(): FnCallNode {
    const s = this.state;
    const src = s.loc();
    const obj = s.expectIdent();
    s.expect(TokenType.DOT);
    const method = s.expectIdent();
    const fullName = `${obj}.${method}`;
    s.expect(TokenType.LPAREN);
    const args: Formula[] = [];
    if (!s.checkType(TokenType.RPAREN)) {
      args.push(this.parseFormula());
      while (s.match(TokenType.COMMA)) {
        args.push(this.parseFormula());
      }
    }
    s.expect(TokenType.RPAREN);
    return { kind: 'fn_call', name: fullName, args, source: src };
  }

  // --- Helper: parsear un bloque { statements } ---
  private parseBlock(): Statement[] {
    const s = this.state;
    s.skipNewlines();
    s.expect(TokenType.LBRACE);
    s.skipNewlines();
    const body: Statement[] = [];
    while (!s.checkType(TokenType.RBRACE) && !s.isAtEnd()) {
      s.skipNewlines();
      if (s.checkType(TokenType.RBRACE)) break;
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo en bloque';
        s.pushDiagnostic('error', message);
        this.advanceToNextStatement();
      }
    }
    s.expect(TokenType.RBRACE);
    return body;
  }

  // --- Delegacion a modulo de formulas ---

  private parseFormula(): Formula {
    return parseFormulaModule(this.state);
  }

  // --- Helpers de diagnostico/descripcion ---

  private describeStatementContext(tok: Token): string {
    switch (tok.type) {
      case TokenType.LOGIC:
        return 'declaracion logic';
      case TokenType.AXIOM:
        return 'declaracion de axioma';
      case TokenType.THEOREM:
        return 'declaracion de teorema';
      case TokenType.DERIVE:
        return 'comando derive';
      case TokenType.CHECK:
        return 'comando check';
      case TokenType.PROVE:
        return 'comando prove';
      case TokenType.COUNTERMODEL:
      case TokenType.REFUTE:
        return 'comando countermodel';
      case TokenType.TRUTH_TABLE:
        return 'comando truth_table';
      case TokenType.LET:
        return 'declaracion let';
      case TokenType.CLAIM:
        return 'declaracion claim';
      case TokenType.SUPPORT:
        return 'declaracion support';
      case TokenType.CONFIDENCE:
        return 'declaracion confidence';
      case TokenType.CONTEXT:
        return 'declaracion context';
      case TokenType.RENDER:
        return 'comando render';
      case TokenType.ANALYZE:
        return 'comando analyze';
      case TokenType.EXPLAIN:
        return 'comando explain';
      case TokenType.IMPORT:
        return 'declaracion import';
      case TokenType.ASSUME:
        return 'bloque de prueba';
      case TokenType.THEORY:
        return 'declaracion theory';
      case TokenType.PRINT:
        return 'comando print';
      case TokenType.SET:
        return 'comando set';
      case TokenType.IF:
        return 'sentencia if';
      case TokenType.FOR:
        return 'sentencia for';
      case TokenType.WHILE:
        return 'sentencia while';
      case TokenType.FN:
        return 'declaracion fn';
      case TokenType.RETURN:
        return 'sentencia return';
      case TokenType.EXPORT:
        return 'declaracion export';
      case TokenType.DEFINE:
        return 'declaracion define';
      case TokenType.UNFOLD:
        return 'comando unfold';
      case TokenType.FOLD:
        return 'comando fold';
      case TokenType.SOURCE_KW:
        return 'declaracion source';
      case TokenType.INTERPRET:
        return 'comando interpret';
      case TokenType.GLOSSARY:
        return 'comando glossary';
      default:
        return `statement '${tok.value}'`;
    }
  }

  private advanceToNextStatement(): void {
    const s = this.state;
    const statementStarters = new Set([
      TokenType.LOGIC,
      TokenType.AXIOM,
      TokenType.THEOREM,
      TokenType.DERIVE,
      TokenType.CHECK,
      TokenType.PROVE,
      TokenType.COUNTERMODEL,
      TokenType.REFUTE,
      TokenType.TRUTH_TABLE,
      TokenType.LET,
      TokenType.CLAIM,
      TokenType.SUPPORT,
      TokenType.CONFIDENCE,
      TokenType.CONTEXT,
      TokenType.RENDER,
      TokenType.ANALYZE,
      TokenType.EXPLAIN,
      TokenType.NEXT,
      TokenType.UNTIL,
      TokenType.IMPORT,
      TokenType.ASSUME,
      TokenType.SHOW,
      TokenType.QED,
      TokenType.THEORY,
      TokenType.PRINT,
      TokenType.SET,
      TokenType.IF,
      TokenType.FOR,
      TokenType.WHILE,
      TokenType.FN,
      TokenType.RETURN,
      TokenType.DEFINE,
      TokenType.UNFOLD,
      TokenType.FOLD,
      TokenType.SOURCE_KW,
      TokenType.INTERPRET,
      TokenType.GLOSSARY,
    ]);
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    while (!s.isAtEnd()) {
      if (
        s.checkType(TokenType.NEWLINE) &&
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0
      ) {
        s.skipNewlines();
        return;
      }
      if (
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        statementStarters.has(s.current().type)
      ) {
        return;
      }
      if (s.checkType(TokenType.LPAREN)) parenDepth += 1;
      else if (s.checkType(TokenType.RPAREN)) parenDepth = Math.max(0, parenDepth - 1);
      else if (s.checkType(TokenType.LBRACE)) braceDepth += 1;
      else if (s.checkType(TokenType.RBRACE)) braceDepth = Math.max(0, braceDepth - 1);
      else if (s.checkType(TokenType.LBRACKET) || s.checkType(TokenType.LBRACKET_DOUBLE)) {
        bracketDepth += 1;
      } else if (s.checkType(TokenType.RBRACKET) || s.checkType(TokenType.RBRACKET_DOUBLE)) {
        bracketDepth = Math.max(0, bracketDepth - 1);
      }
      s.advance();
    }
  }
}
