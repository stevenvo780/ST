/**
 * ST Parser — Parser recursivo descendente
 */

import { Token, TokenType } from '../lexer/tokens';
import { Lexer } from '../lexer/lexer';
import { Formula, Diagnostic, SourceLocation } from '../types';
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
} from '../ast/nodes';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private file: string;
  public diagnostics: Diagnostic[] = [];
  private knownFunctionNames: Set<string> = new Set();

  constructor(file: string = '<stdin>') {
    this.file = file;
  }

  parse(source: string): Program {
    const lexer = new Lexer(source, this.file);
    this.tokens = lexer.tokenize();
    this.diagnostics.push(...lexer.diagnostics);
    this.pos = 0;

    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      this.skipNewlines();
      if (this.isAtEnd()) break;

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo inesperado';
        this.diagnostics.push({
          severity: 'error',
          message,
          file: this.file,
          line: this.current().line,
          column: this.current().column,
        });
        this.advanceToNextStatement();
      }
    }

    return { statements, file: this.file };
  }

  // --- Parsing de statements ---

  private parseStatement(): Statement | null {
    const tok = this.current();

    if (
      this.peek(1) === TokenType.LPAREN &&
      (tok.type === TokenType.IDENTIFIER || this.knownFunctionNames.has(tok.value))
    ) {
      return this.parseFnCall();
    }

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
      case TokenType.IDENTIFIER:
        throw new Error(`Statement inesperado: '${tok.value}' (${tok.type})`);
      case TokenType.NEWLINE:
        this.advance();
        return null;
      case TokenType.EOF:
        return null;
      default:
        throw new Error(`Statement inesperado: '${tok.value}' (${tok.type})`);
    }
  }

  // logic classical.propositional
  private parseLogicDecl(): LogicDeclNode {
    const src = this.loc();
    this.expect(TokenType.LOGIC);
    // Leer perfil como secuencia de ID.ID
    let profile = this.expectIdent();
    while (this.match(TokenType.DOT)) {
      profile += '.';
      profile += this.expectIdent();
    }
    return { kind: 'logic_decl', profile, source: src };
  }

  // axiom name = FORMULA  o  axiom name : FORMULA
  private parseAxiomDecl(): AxiomDeclNode {
    const src = this.loc();
    this.expect(TokenType.AXIOM);
    const name = this.expectIdent();
    this.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'axiom_decl', name, formula, source: src };
  }

  // theorem name = FORMULA  o  theorem name : FORMULA
  private parseTheoremDecl(): TheoremDeclNode {
    const src = this.loc();
    this.expect(TokenType.THEOREM);
    const name = this.expectIdent();
    this.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'theorem_decl', name, formula, source: src };
  }

  // derive FORMULA from {a1, a2, ...}
  private parseDeriveCmd(): DeriveCmdNode {
    const src = this.loc();
    this.expect(TokenType.DERIVE);
    const goal = this.parseFormula();
    this.expect(TokenType.FROM);
    const premises = this.parseIdList();
    return { kind: 'derive_cmd', goal, premises, source: src };
  }

  // check valid FORMULA | check satisfiable FORMULA | check equivalent F, F
  private parseCheckCmd(): Statement {
    const src = this.loc();
    this.expect(TokenType.CHECK);

    if (this.match(TokenType.VALID)) {
      const formula = this.parseFormula();
      return { kind: 'check_valid_cmd', formula, source: src } as CheckValidCmdNode;
    }
    if (this.match(TokenType.SATISFIABLE)) {
      const formula = this.parseFormula();
      return { kind: 'check_satisfiable_cmd', formula, source: src } as CheckSatisfiableCmdNode;
    }
    if (this.match(TokenType.EQUIVALENT)) {
      const left = this.parseFormula();
      this.expect(TokenType.COMMA);
      const right = this.parseFormula();
      return { kind: 'check_equivalent_cmd', left, right, source: src } as CheckEquivalentCmdNode;
    }

    throw new Error(`Se esperaba 'valid', 'satisfiable' o 'equivalent' despues de 'check'`);
  }

  // prove FORMULA from {a1, a2}
  private parseProveCmd(): ProveCmdNode {
    const src = this.loc();
    this.expect(TokenType.PROVE);
    const goal = this.parseFormula();
    this.expect(TokenType.FROM);
    const premises = this.parseIdList();
    return { kind: 'prove_cmd', goal, premises, source: src };
  }

  // countermodel FORMULA | refute FORMULA
  private parseCountermodelCmd(): CountermodelCmdNode {
    const src = this.loc();
    // Acepta tanto 'countermodel' como 'refute'
    if (this.checkType(TokenType.COUNTERMODEL)) {
      this.advance();
    } else {
      this.expect(TokenType.REFUTE);
    }
    const formula = this.parseFormula();
    return { kind: 'countermodel_cmd', formula, source: src };
  }

  // truth_table FORMULA
  private parseTruthTableCmd(): TruthTableCmdNode {
    const src = this.loc();
    this.expect(TokenType.TRUTH_TABLE);
    const formula = this.parseFormula();
    return { kind: 'truth_table_cmd', formula, source: src };
  }

  // let name = passage([[path#anchor]])
  // let name = formalize passageName as FORMULA
  private parseLetDecl(): LetDeclNode {
    const src = this.loc();
    this.expect(TokenType.LET);
    const name = this.expectIdent();
    this.expect(TokenType.EQUALS);

    if (this.match(TokenType.PASSAGE)) {
      this.expect(TokenType.LPAREN);
      this.expect(TokenType.LBRACKET_DOUBLE);
      // El lexer ya leyó el contenido como STRING entre [[ y ]]
      let anchorPath = '';
      if (this.checkType(TokenType.STRING)) {
        anchorPath = this.current().value;
        this.advance();
      } else {
        // Fallback: leer tokens hasta ]]
        while (!this.checkType(TokenType.RBRACKET_DOUBLE) && !this.isAtEnd()) {
          anchorPath += this.current().value;
          this.advance();
        }
      }
      this.expect(TokenType.RBRACKET_DOUBLE);
      this.expect(TokenType.RPAREN);
      return { kind: 'let_decl', name, letType: 'passage', anchorPath, source: src };
    }

    if (this.match(TokenType.FORMALIZE)) {
      const passageName = this.expectIdent();
      this.expect(TokenType.AS);
      const formula = this.parseFormula();
      return { kind: 'let_decl', name, letType: 'formalize', passageName, formula, source: src };
    }

    // let name = "texto descriptivo" [: FORMULA]
    if (this.checkType(TokenType.STRING)) {
      const description = this.current().value;
      this.advance();
      // Opcionalmente: let name = "desc" : FORMULA
      if (this.match(TokenType.COLON)) {
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
    const src = this.loc();
    this.expect(TokenType.CLAIM);
    const name = this.expectIdent();
    this.expect(TokenType.EQUALS);

    // Si es un identificador simple y no tiene paréntesis (no es predicado)
    // podría ser una referencia a una formalización o pasaje.
    if (this.checkType(TokenType.IDENTIFIER) && this.peek(1) !== TokenType.LPAREN) {
      const val = this.current().value;
      const saved = this.pos;
      this.advance();
      // Si después del IDENTIFIER hay un NEWLINE o EOF, es una referencia.
      if (this.isAtEnd() || this.checkType(TokenType.NEWLINE)) {
        return { kind: 'claim_decl', name, value: val, formalization: val, source: src };
      }
      // Si no, backtrack y parsear como formula completa
      this.pos = saved;
    }

    const formula = this.parseFormula();
    return {
      kind: 'claim_decl',
      name,
      value: this.formulaToString(formula),
      formula,
      source: src,
    };
  }

  // support claimName <- sourceName
  private parseSupportDecl(): SupportDeclNode {
    const src = this.loc();
    this.expect(TokenType.SUPPORT);
    const claimName = this.expectIdent();
    this.expect(TokenType.BACK_ARROW);
    const sourceName = this.expectIdent();
    return { kind: 'support_decl', claimName, sourceName, source: src };
  }

  // confidence claimName = NUMBER
  private parseConfidenceDecl(): ConfidenceDeclNode {
    const src = this.loc();
    this.expect(TokenType.CONFIDENCE);
    const claimName = this.expectIdent();
    this.expect(TokenType.EQUALS);
    const tok = this.expect(TokenType.NUMBER);
    return { kind: 'confidence_decl', claimName, value: parseFloat(tok.value), source: src };
  }

  // context claimName = "text"
  private parseContextDecl(): ContextDeclNode {
    const src = this.loc();
    this.expect(TokenType.CONTEXT);
    const claimName = this.expectIdent();
    this.expect(TokenType.EQUALS);
    const tok = this.expect(TokenType.STRING);
    return { kind: 'context_decl', claimName, text: tok.value, source: src };
  }

  // render target --format FORMAT
  private parseRenderCmd(): RenderCmdNode {
    const src = this.loc();
    this.expect(TokenType.RENDER);
    // El target puede ser un identificador o la keyword 'theory' (que ahora es un token especial)
    let target: string;
    if (this.checkType(TokenType.THEORY)) {
      target = this.current().value;
      this.advance();
    } else {
      target = this.expectIdent();
    }
    let format = 'markdown';
    // Opcionalmente leer --format
    // Simplificado: si hay un ident 'markdown' o 'json' o 'text' después, lo tomamos
    if (this.checkType(TokenType.IDENTIFIER)) {
      format = this.current().value;
      this.advance();
    }
    return { kind: 'render_cmd', target, format, source: src };
  }

  // analyze {P1, P2, ...} -> CONCLUSION
  private parseAnalyzeCmd(): AnalyzeCmdNode {
    const src = this.loc();
    this.expect(TokenType.ANALYZE);
    this.expect(TokenType.LBRACE);
    const premises: Formula[] = [];
    if (!this.checkType(TokenType.RBRACE)) {
      premises.push(this.parseFormula());
      while (this.match(TokenType.COMMA)) {
        premises.push(this.parseFormula());
      }
    }
    this.expect(TokenType.RBRACE);
    this.expect(TokenType.ARROW);
    const conclusion = this.parseFormula();
    return { kind: 'analyze_cmd', premises, conclusion, source: src };
  }

  // explain FORMULA
  private parseExplainCmd(): ExplainCmdNode {
    const src = this.loc();
    this.expect(TokenType.EXPLAIN);
    const formula = this.parseFormula();
    return { kind: 'explain_cmd', formula, source: src };
  }

  // import "path/to/file.st" | import path/to/file
  private parseImportDecl(): ImportDeclNode {
    const src = this.loc();
    this.expect(TokenType.IMPORT);
    // Acepta string entrecomillado o secuencia de ident.ident/ident
    let path = '';
    if (this.checkType(TokenType.STRING)) {
      path = this.current().value;
      this.advance();
    } else {
      path = this.expectIdent();
      while (this.checkType(TokenType.DOT) || this.checkType(TokenType.IDENTIFIER)) {
        if (this.match(TokenType.DOT)) {
          path += '.';
          if (this.checkType(TokenType.IDENTIFIER)) {
            path += this.current().value;
            this.advance();
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
    const src = this.loc();
    const assumptions: { name: string; formula: Formula }[] = [];

    // Parsear una o más assumptions
    while (this.checkType(TokenType.ASSUME)) {
      this.advance();
      const name = this.expectIdent();
      this.expectOneOf(TokenType.COLON, TokenType.EQUALS);
      const formula = this.parseFormula();
      assumptions.push({ name, formula });
      this.skipNewlines();
    }

    // Esperar 'show FORMULA'
    this.expect(TokenType.SHOW);
    const goal = this.parseFormula();
    this.skipNewlines();

    // Parsear body statements hasta 'qed'
    const body: Statement[] = [];
    while (!this.checkType(TokenType.QED) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.checkType(TokenType.QED)) break;
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo';
        this.diagnostics.push({
          severity: 'error',
          message,
          file: this.file,
          line: this.current().line,
          column: this.current().column,
        });
        this.advanceToNextStatement();
      }
    }
    this.expect(TokenType.QED);

    return { kind: 'proof_block', assumptions, goal, body, source: src };
  }

  // theory Name { ... } | theory Name extends Parent { ... }
  private parseTheoryDecl(): TheoryDeclNode {
    const src = this.loc();
    this.expect(TokenType.THEORY);
    const name = this.expectName();

    // Herencia opcional: extends Parent
    let parent: string | undefined;
    if (this.match(TokenType.EXTENDS)) {
      parent = this.expectName();
    }

    this.expect(TokenType.LBRACE);
    this.skipNewlines();

    const members: TheoryMember[] = [];

    while (!this.checkType(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.checkType(TokenType.RBRACE)) break;

      // Visibilidad: private/privado o public (default)
      let visibility: 'public' | 'private' = 'public';
      if (this.match(TokenType.PRIVATE)) {
        visibility = 'private';
      }

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          members.push({ statement: stmt, visibility });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo en theory';
        this.diagnostics.push({
          severity: 'error',
          message,
          file: this.file,
          line: this.current().line,
          column: this.current().column,
        });
        this.advanceToNextStatement();
      }
    }
    this.expect(TokenType.RBRACE);

    return { kind: 'theory_decl', name, parent, members, source: src };
  }

  // --- print "texto" | print formula ---
  private parsePrintCmd(): PrintCmdNode {
    const src = this.loc();
    this.expect(TokenType.PRINT);
    if (this.checkType(TokenType.STRING)) {
      const value = this.current().value;
      this.advance();
      return { kind: 'print_cmd', value, source: src };
    }
    // Imprimir resultado de fórmula
    const formula = this.parseFormula();
    return { kind: 'print_cmd', value: null, formula, source: src };
  }

  // --- set x = formula ---
  private parseSetCmd(): SetCmdNode {
    const src = this.loc();
    this.expect(TokenType.SET);
    const name = this.expectName();
    this.expectOneOf(TokenType.EQUALS, TokenType.COLON);
    const formula = this.parseFormula();
    return { kind: 'set_cmd', name, formula, source: src };
  }

  // --- if valid FORMULA { } else if satisfiable FORMULA { } else { } ---
  private parseIfStmt(): IfStmtNode {
    const src = this.loc();
    const branches: IfBranch[] = [];
    let elseBranch: Statement[] | undefined;

    // Primera rama: if
    this.expect(TokenType.IF);
    branches.push(this.parseConditionBranch());

    // Ramas else if
    while (this.checkElseIf()) {
      this.expect(TokenType.ELSE);
      this.expect(TokenType.IF);
      branches.push(this.parseConditionBranch());
    }

    // Rama else
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.parseBlock();
    }

    return { kind: 'if_stmt', branches, elseBranch, source: src };
  }

  private checkElseIf(): boolean {
    // Mira si hay else seguido de if (con posibles newlines entre medio)
    if (!this.checkType(TokenType.ELSE)) return false;
    // Buscar if después de else (puede haber newlines)
    let lookahead = 1;
    while (this.peek(lookahead) === TokenType.NEWLINE) lookahead++;
    return this.peek(lookahead) === TokenType.IF;
  }

  private parseConditionBranch(): IfBranch {
    const condition = this.parseConditionKeyword();
    const formula = this.parseFormula();
    const body = this.parseBlock();
    return { condition, formula, body };
  }

  private parseConditionKeyword(): 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid' {
    if (this.match(TokenType.VALID)) return 'valid';
    if (this.match(TokenType.SATISFIABLE)) return 'satisfiable';
    // Aceptar "invalid" / "unsatisfiable" como identifiers
    if (this.checkType(TokenType.IDENTIFIER)) {
      const v = this.current().value.toLowerCase();
      if (v === 'invalid' || v === 'invalido') {
        this.advance();
        return 'invalid';
      }
      if (v === 'unsatisfiable' || v === 'insatisfacible') {
        this.advance();
        return 'unsatisfiable';
      }
    }
    // Default: valid
    return 'valid';
  }

  // --- for x in {A, B, C} { body } ---
  private parseForStmt(): ForStmtNode {
    const src = this.loc();
    this.expect(TokenType.FOR);
    const variable = this.expectName();
    this.expect(TokenType.IN);
    this.expect(TokenType.LBRACE);
    const items: Formula[] = [];
    if (!this.checkType(TokenType.RBRACE)) {
      items.push(this.parseFormula());
      while (this.match(TokenType.COMMA)) {
        items.push(this.parseFormula());
      }
    }
    this.expect(TokenType.RBRACE);
    const body = this.parseBlock();
    return { kind: 'for_stmt', variable, items, body, source: src };
  }

  // --- while valid FORMULA { body } ---
  private parseWhileStmt(): WhileStmtNode {
    const src = this.loc();
    this.expect(TokenType.WHILE);
    const condition = this.parseConditionKeyword();
    const formula = this.parseFormula();
    const body = this.parseBlock();
    return { kind: 'while_stmt', condition, formula, body, maxIterations: 1000, source: src };
  }

  // --- fn nombre(param1, param2) { body } ---
  private parseFnDecl(): FnDeclNode {
    const src = this.loc();
    this.expect(TokenType.FN);
    const name = this.expectName();
    this.knownFunctionNames.add(name);
    this.expect(TokenType.LPAREN);
    const params: string[] = [];
    if (!this.checkType(TokenType.RPAREN)) {
      params.push(this.expectName());
      while (this.match(TokenType.COMMA)) {
        params.push(this.expectName());
      }
    }
    this.expect(TokenType.RPAREN);
    const body = this.parseBlock();
    return { kind: 'fn_decl', name, params, body, source: src };
  }

  // --- return formula ---
  private parseReturnStmt(): ReturnStmtNode {
    const src = this.loc();
    this.expect(TokenType.RETURN);
    let formula: Formula | undefined;
    // Si hay algo después del return que no sea newline/EOF/}
    if (!this.checkType(TokenType.NEWLINE) && !this.checkType(TokenType.EOF) &&
        !this.checkType(TokenType.RBRACE)) {
      formula = this.parseFormula();
    }
    return { kind: 'return_stmt', formula, source: src };
  }

  // --- export STATEMENT ---
  private parseExportDecl(): ExportDeclNode {
    const src = this.loc();
    this.expect(TokenType.EXPORT);
    const stmt = this.parseStatement();
    if (!stmt) {
      throw new Error('Se esperaba un statement después de "export"');
    }
    // Solo permitimos exportar declaraciones
    const exportable = ['let_decl', 'axiom_decl', 'theorem_decl', 'fn_decl', 'theory_decl'];
    if (!exportable.includes(stmt.kind)) {
      throw new Error(`No se puede exportar un statement de tipo: ${stmt.kind}`);
    }
    return { kind: 'export_decl', statement: stmt, source: src };
  }

  // --- nombre(arg1, arg2) — llamada a función ---
  private parseFnCall(): FnCallNode {
    const src = this.loc();
    const name = this.expectName();
    this.expect(TokenType.LPAREN);
    const args: Formula[] = [];
    if (!this.checkType(TokenType.RPAREN)) {
      args.push(this.parseFormula());
      while (this.match(TokenType.COMMA)) {
        args.push(this.parseFormula());
      }
    }
    this.expect(TokenType.RPAREN);
    return { kind: 'fn_call', name, args, source: src };
  }

  // --- Helper: parsear un bloque { statements } ---
  private parseBlock(): Statement[] {
    this.skipNewlines();
    this.expect(TokenType.LBRACE);
    this.skipNewlines();
    const body: Statement[] = [];
    while (!this.checkType(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.checkType(TokenType.RBRACE)) break;
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error de parseo en bloque';
        this.diagnostics.push({
          severity: 'error',
          message,
          file: this.file,
          line: this.current().line,
          column: this.current().column,
        });
        this.advanceToNextStatement();
      }
    }
    this.expect(TokenType.RBRACE);
    return body;
  }

  // --- Parsing de fórmulas (precedencia) ---
  // Precedencia (de menor a mayor):
  // 1. <-> (bicondicional)
  // 2. -> (implicación, asocia a la derecha)
  // 3. | (disyunción)
  // 4. & (conjunción)
  // 5. ! (negación) y átomos

  private parseFormula(): Formula {
    return this.parseBiconditional();
  }

  private parseBiconditional(): Formula {
    let left = this.parseImplication();
    while (this.match(TokenType.BICONDITIONAL)) {
      const right = this.parseImplication();
      left = { kind: 'biconditional', args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseImplication(): Formula {
    const left = this.parseDisjunction();
    if (this.match(TokenType.ARROW)) {
      // Asociatividad a la derecha
      const right = this.parseImplication();
      return { kind: 'implies', args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseDisjunction(): Formula {
    let left = this.parseUntil();
    while (this.match(TokenType.OR) || this.match(TokenType.XOR) || this.match(TokenType.NOR)) {
      const type = this.previous().type;
      const right = this.parseUntil();
      const kind = type === TokenType.OR ? 'or' : (type === TokenType.XOR ? 'xor' : 'nor');
      left = { kind, args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseUntil(): Formula {
    let left = this.parseConjunction();
    while (this.match(TokenType.UNTIL)) {
      const right = this.parseConjunction();
      left = { kind: 'temporal_until', args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseConjunction(): Formula {
    let left = this.parseComparison();
    while (this.match(TokenType.AND) || this.match(TokenType.NAND)) {
      const type = this.previous().type;
      const right = this.parseComparison();
      const kind = type === TokenType.AND ? 'and' : 'nand';
      left = { kind, args: [left, right], source: this.loc() };
    }
    return left;
  }

  // --- Arithmetic precedence ---

  private parseComparison(): Formula {
    let left = this.parseAdditive();
    while (
      this.checkType(TokenType.LT) ||
      this.checkType(TokenType.GT) ||
      this.checkType(TokenType.LTE) ||
      this.checkType(TokenType.GTE)
    ) {
      if (this.match(TokenType.LT)) {
        const right = this.parseAdditive();
        left = { kind: 'less', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.GT)) {
        const right = this.parseAdditive();
        left = { kind: 'greater', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.LTE)) {
        const right = this.parseAdditive();
        left = { kind: 'less_eq', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.GTE)) {
        const right = this.parseAdditive();
        left = { kind: 'greater_eq', args: [left, right], source: this.loc() };
      }
    }
    return left;
  }

  private parseAdditive(): Formula {
    let left = this.parseMultiplicative();
    while (this.checkType(TokenType.PLUS) || this.checkType(TokenType.MINUS)) {
      if (this.match(TokenType.PLUS)) {
        const right = this.parseMultiplicative();
        left = { kind: 'add', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.MINUS)) {
        const right = this.parseMultiplicative();
        left = { kind: 'subtract', args: [left, right], source: this.loc() };
      }
    }
    return left;
  }

  private parseMultiplicative(): Formula {
    let left = this.parseUnary();
    while (
      this.checkType(TokenType.STAR) ||
      this.checkType(TokenType.SLASH) ||
      this.checkType(TokenType.PERCENT)
    ) {
      if (this.match(TokenType.STAR)) {
        const right = this.parseUnary();
        left = { kind: 'multiply', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.SLASH)) {
        const right = this.parseUnary();
        left = { kind: 'divide', args: [left, right], source: this.loc() };
      } else if (this.match(TokenType.PERCENT)) {
        const right = this.parseUnary();
        left = { kind: 'modulo', args: [left, right], source: this.loc() };
      }
    }
    return left;
  }

  private parseUnary(): Formula {
    // Unary minus: -expr → subtract(0, expr)
    if (this.match(TokenType.MINUS)) {
      const operand = this.parseUnary();
      return { kind: 'subtract', args: [{ kind: 'number', value: 0, source: this.loc() }, operand], source: this.loc() };
    }
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnary();
      return { kind: 'not', args: [operand], source: this.loc() };
    }
    if (this.match(TokenType.BOX)) {
      const operand = this.parseUnary();
      return { kind: 'modal_necessity', args: [operand], source: this.loc() };
    }
    if (this.match(TokenType.DIAMOND)) {
      const operand = this.parseUnary();
      return { kind: 'modal_possibility', args: [operand], source: this.loc() };
    }
    if (this.match(TokenType.FORALL)) {
      const variable = this.expectIdent();
      const operand = this.parseUnary();
      return { kind: 'forall', variable, args: [operand], source: this.loc() };
    }
    if (this.match(TokenType.EXISTS)) {
      const variable = this.expectIdent();
      const operand = this.parseUnary();
      return { kind: 'exists', variable, args: [operand], source: this.loc() };
    }
    if (this.match(TokenType.NEXT)) {
      const operand = this.parseUnary();
      return { kind: 'temporal_next', args: [operand], source: this.loc() };
    }
    return this.parseAtom();
  }

  private parseAtom(): Formula {
    // Literal numérico
    if (this.checkType(TokenType.NUMBER)) {
      const tok = this.current();
      this.advance();
      return { kind: 'number', value: parseFloat(tok.value), source: { line: tok.line, column: tok.column } };
    }

    // Paréntesis
    if (this.match(TokenType.LPAREN)) {
      const inner = this.parseFormula();
      this.expect(TokenType.RPAREN);
      return inner;
    }

    // Dot notation con keyword como prefijo: Logic.mp, Theory.axiom, etc.
    // Si el token actual es una keyword seguida de DOT + IDENTIFIER, tratarlo como nombre calificado
    if (this.checkType(TokenType.DOT) === false &&
        this.current().type !== TokenType.IDENTIFIER &&
        this.current().type !== TokenType.NEWLINE &&
        this.current().type !== TokenType.EOF &&
        this.peek(1) === TokenType.DOT &&
        this.peek(2) === TokenType.IDENTIFIER) {
      const tok = this.current();
      this.advance(); // consumir keyword
      this.advance(); // consumir DOT
      const memberTok = this.current();
      this.advance(); // consumir IDENTIFIER
      return { kind: 'atom', name: `${tok.value}.${memberTok.value}`, source: { line: tok.line, column: tok.column } };
    }

    // Predicado o Atomo proposicional
    if (this.checkType(TokenType.IDENTIFIER)) {
      const tok = this.current();
      this.advance();

      // Notación con punto: Theory.member (acceso calificado)
      if (this.checkType(TokenType.DOT) && this.peek(1) === TokenType.IDENTIFIER) {
        this.advance(); // consumir DOT
        const memberTok = this.current();
        this.advance(); // consumir IDENTIFIER
        // Nombre calificado: "Theory.member"
        return { kind: 'atom', name: `${tok.value}.${memberTok.value}`, source: { line: tok.line, column: tok.column } };
      }

      if (this.match(TokenType.LPAREN)) {
        // Podría ser un predicado P(x, y) o una llamada a función fn(arg1, arg2)
        // Por ahora, si el nombre está en knownFunctionNames, lo tratamos como llamada a función
        if (this.knownFunctionNames.has(tok.value)) {
          const args: Formula[] = [];
          if (!this.checkType(TokenType.RPAREN)) {
            args.push(this.parseFormula());
            while (this.match(TokenType.COMMA)) {
              args.push(this.parseFormula());
            }
          }
          this.expect(TokenType.RPAREN);
          return {
            kind: 'fn_call',
            name: tok.value,
            args,
            source: { line: tok.line, column: tok.column },
          };
        }

        // Predicado: P(x, y, ...)
        const args: string[] = [];
        if (!this.checkType(TokenType.RPAREN)) {
          args.push(this.expectIdent());
          while (this.match(TokenType.COMMA)) {
            args.push(this.expectIdent());
          }
        }
        this.expect(TokenType.RPAREN);
        const predFormula: Formula = {
          kind: 'predicate',
          name: tok.value,
          params: args,
          source: { line: tok.line, column: tok.column },
        };
        // FOL igualdad: P(x) = Q(y) (raro pero posible)
        if (this.checkType(TokenType.EQUALS)) {
          this.advance();
          const right = this.parseAtom();
          return {
            kind: 'equals',
            args: [predFormula, right],
            source: { line: tok.line, column: tok.column },
          };
        }
        return predFormula;
      }
      // FOL igualdad: x = y (identidad entre términos)
      if (this.checkType(TokenType.EQUALS)) {
        this.advance();
        const rightTok = this.current();
        if (this.checkType(TokenType.IDENTIFIER)) {
          this.advance();
          const left: Formula = {
            kind: 'atom',
            name: tok.value,
            source: { line: tok.line, column: tok.column },
          };
          const right: Formula = {
            kind: 'atom',
            name: rightTok.value,
            source: { line: rightTok.line, column: rightTok.column },
          };
          return {
            kind: 'equals',
            args: [left, right],
            source: { line: tok.line, column: tok.column },
          };
        }
        // Si no es un identificador, backtrack — el = pertenece al statement
        this.pos--;
      }
      return { kind: 'atom', name: tok.value, source: { line: tok.line, column: tok.column } };
    }

    throw new Error(
      `Se esperaba formula en linea ${this.current().line}, columna ${this.current().column}, ` +
        `encontrado: '${this.current().value}' (${this.current().type})`,
    );
  }

  // --- Helpers ---

  private parseIdList(): string[] {
    this.expect(TokenType.LBRACE);
    const ids: string[] = [];
    if (!this.checkType(TokenType.RBRACE)) {
      ids.push(this.expectIdent());
      while (this.match(TokenType.COMMA)) {
        ids.push(this.expectIdent());
      }
    }
    this.expect(TokenType.RBRACE);
    return ids;
  }

  private collectAssociativeArgs(f: Formula, kind: 'and' | 'or' | 'xor'): Formula[] {
    if (f.kind !== kind || !f.args?.length) return [f];
    const items: Formula[] = [];
    for (const arg of f.args) {
      if (!arg) continue;
      items.push(...this.collectAssociativeArgs(arg, kind));
    }
    return items;
  }

  private formulaToString(f: Formula): string {
    const arg0 = f.args?.[0];
    const arg1 = f.args?.[1];

    switch (f.kind) {
      case 'atom':
        return f.name || '?';
      case 'not':
        return arg0 ? `!${this.formulaToString(arg0)}` : '!?';
      case 'modal_necessity':
        return arg0 ? `[]${this.formulaToString(arg0)}` : '[]?';
      case 'modal_possibility':
        return arg0 ? `<>${this.formulaToString(arg0)}` : '<>?';
      case 'forall':
        return arg0
          ? `forall ${f.variable} ${this.formulaToString(arg0)}`
          : `forall ${f.variable} ?`;
      case 'exists':
        return arg0
          ? `exists ${f.variable} ${this.formulaToString(arg0)}`
          : `exists ${f.variable} ?`;
      case 'predicate': {
        const params = f.params || [];
        return `${f.name || '?'}(${params.join(', ')})`;
      }
      case 'and':
        return arg0 && arg1
          ? `(${this.collectAssociativeArgs(f, 'and').map(a => this.formulaToString(a)).join(' & ')})`
          : '(? & ?)';
      case 'or':
        return arg0 && arg1
          ? `(${this.collectAssociativeArgs(f, 'or').map(a => this.formulaToString(a)).join(' | ')})`
          : '(? | ?)';
      case 'nand':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} ↑ ${this.formulaToString(arg1)})`
          : '(? ↑ ?)';
      case 'nor':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} ↓ ${this.formulaToString(arg1)})`
          : '(? ↓ ?)';
      case 'xor':
        return arg0 && arg1
          ? `(${this.collectAssociativeArgs(f, 'xor').map(a => this.formulaToString(a)).join(' ⊕ ')})`
          : '(? ⊕ ?)';
      case 'implies':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} -> ${this.formulaToString(arg1)})`
          : '(? -> ?)';
      case 'biconditional':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} <-> ${this.formulaToString(arg1)})`
          : '(? <-> ?)';
      case 'equals':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} = ${this.formulaToString(arg1)})`
          : '(? = ?)';
      case 'temporal_next':
        return arg0 ? `X(${this.formulaToString(arg0)})` : 'X(?)';
      case 'temporal_until':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} U ${this.formulaToString(arg1)})`
          : '(? U ?)';
      default:
        return '?';
    }
  }

  private current(): Token {
    if (this.pos >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    return this.tokens[this.pos];
  }

  private previous(): Token {
    if (this.pos === 0) return this.tokens[0];
    return this.tokens[this.pos - 1];
  }

  private peek(offset: number): TokenType {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) return TokenType.EOF;
    return this.tokens[idx].type;
  }

  private advance(): Token {
    const tok = this.current();
    this.pos++;
    return tok;
  }

  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }

  private checkType(type: TokenType): boolean {
    return this.current().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.checkType(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType): Token {
    if (this.checkType(type)) {
      return this.advance();
    }
    throw new Error(
      `Se esperaba ${type}, encontrado '${this.current().value}' (${this.current().type}) ` +
        `en linea ${this.current().line}, columna ${this.current().column}`,
    );
  }

  private expectOneOf(...types: TokenType[]): Token {
    for (const type of types) {
      if (this.checkType(type)) {
        return this.advance();
      }
    }
    throw new Error(
      `Se esperaba ${types.join(' o ')}, encontrado '${this.current().value}' (${this.current().type}) ` +
        `en linea ${this.current().line}, columna ${this.current().column}`,
    );
  }

  private expectIdent(): string {
    const tok = this.expect(TokenType.IDENTIFIER);
    return tok.value;
  }

  /**
   * Acepta un IDENTIFIER o cualquier keyword como nombre
   * (para soportar nombres como "Logic", "Theory", etc. que colisionan con keywords)
   */
  private expectName(): string {
    const tok = this.current();
    if (tok.type === TokenType.IDENTIFIER) {
      this.advance();
      return tok.value;
    }
    // Aceptar cualquier keyword como nombre en contextos de nombre
    if (tok.type !== TokenType.NEWLINE && tok.type !== TokenType.EOF &&
        tok.type !== TokenType.LPAREN && tok.type !== TokenType.RPAREN &&
        tok.type !== TokenType.LBRACE && tok.type !== TokenType.RBRACE &&
        tok.type !== TokenType.COLON && tok.type !== TokenType.EQUALS &&
        tok.type !== TokenType.ARROW && tok.type !== TokenType.AND &&
        tok.type !== TokenType.OR && tok.type !== TokenType.NOT &&
        tok.type !== TokenType.DOT && tok.type !== TokenType.COMMA &&
        tok.type !== TokenType.STRING && tok.type !== TokenType.NUMBER) {
      this.advance();
      return tok.value;
    }
    throw new Error(
      `Se esperaba nombre/identificador, encontrado '${tok.value}' (${tok.type}) ` +
        `en linea ${tok.line}, columna ${tok.column}`,
    );
  }

  private loc(): SourceLocation {
    const tok = this.current();
    return { line: tok.line, column: tok.column, file: this.file };
  }

  private skipNewlines(): void {
    while (this.checkType(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  private advanceToNextStatement(): void {
    // Avanza hasta encontrar un newline o un token que inicie un statement
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
    ]);
    while (!this.isAtEnd()) {
      if (this.checkType(TokenType.NEWLINE)) {
        this.skipNewlines();
        return;
      }
      if (statementStarters.has(this.current().type)) {
        return; // Encontramos el inicio del siguiente statement
      }
      this.advance();
    }
  }
}
