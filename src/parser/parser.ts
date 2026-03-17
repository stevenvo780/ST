// ============================================================
// ST Parser — Parser recursivo descendente
// ============================================================

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
} from '../ast/nodes';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private file: string;
  public diagnostics: Diagnostic[] = [];

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

  // countermodel FORMULA
  private parseCountermodelCmd(): CountermodelCmdNode {
    const src = this.loc();
    this.expect(TokenType.COUNTERMODEL);
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

    throw new Error(`Se esperaba 'passage' o 'formalize' despues de '='`);
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
    const target = this.expectIdent();
    let format = 'markdown';
    // Opcionalmente leer --format
    // Simplificado: si hay un ident 'markdown' o 'json' o 'text' después, lo tomamos
    if (this.checkType(TokenType.IDENTIFIER)) {
      format = this.current().value;
      this.advance();
    }
    return { kind: 'render_cmd', target, format, source: src };
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
    let left = this.parseConjunction();
    while (this.match(TokenType.OR)) {
      const right = this.parseConjunction();
      left = { kind: 'or', args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseConjunction(): Formula {
    let left = this.parseUnary();
    while (this.match(TokenType.AND)) {
      const right = this.parseUnary();
      left = { kind: 'and', args: [left, right], source: this.loc() };
    }
    return left;
  }

  private parseUnary(): Formula {
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
    return this.parseAtom();
  }

  private parseAtom(): Formula {
    // Paréntesis
    if (this.match(TokenType.LPAREN)) {
      const inner = this.parseFormula();
      this.expect(TokenType.RPAREN);
      return inner;
    }

    // Predicado o Atomo proposicional
    if (this.checkType(TokenType.IDENTIFIER)) {
      const tok = this.current();
      this.advance();
      if (this.match(TokenType.LPAREN)) {
        // Predicado: P(x, y, ...)
        const args: string[] = [];
        if (!this.checkType(TokenType.RPAREN)) {
          args.push(this.expectIdent());
          while (this.match(TokenType.COMMA)) {
            args.push(this.expectIdent());
          }
        }
        this.expect(TokenType.RPAREN);
        return {
          kind: 'predicate',
          name: tok.value,
          params: args,
          source: { line: tok.line, column: tok.column },
        };
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
          ? `(${this.formulaToString(arg0)} & ${this.formulaToString(arg1)})`
          : '(? & ?)';
      case 'or':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} | ${this.formulaToString(arg1)})`
          : '(? | ?)';
      case 'implies':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} -> ${this.formulaToString(arg1)})`
          : '(? -> ?)';
      case 'biconditional':
        return arg0 && arg1
          ? `(${this.formulaToString(arg0)} <-> ${this.formulaToString(arg1)})`
          : '(? <-> ?)';
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
    while (!this.isAtEnd() && !this.checkType(TokenType.NEWLINE)) {
      this.advance();
    }
    this.skipNewlines();
  }
}
