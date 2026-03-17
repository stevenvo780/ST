"use strict";
// ============================================================
// ST Parser — Parser recursivo descendente
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokens_1 = require("../lexer/tokens");
const lexer_1 = require("../lexer/lexer");
class Parser {
    tokens = [];
    pos = 0;
    file;
    diagnostics = [];
    constructor(file = '<stdin>') {
        this.file = file;
    }
    parse(source) {
        const lexer = new lexer_1.Lexer(source, this.file);
        this.tokens = lexer.tokenize();
        this.diagnostics.push(...lexer.diagnostics);
        this.pos = 0;
        const statements = [];
        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (this.isAtEnd())
                break;
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    statements.push(stmt);
                }
            }
            catch (e) {
                this.diagnostics.push({
                    severity: 'error',
                    message: e.message || 'Error de parseo inesperado',
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
    parseStatement() {
        const tok = this.current();
        switch (tok.type) {
            case tokens_1.TokenType.LOGIC:
                return this.parseLogicDecl();
            case tokens_1.TokenType.AXIOM:
                return this.parseAxiomDecl();
            case tokens_1.TokenType.THEOREM:
                return this.parseTheoremDecl();
            case tokens_1.TokenType.DERIVE:
                return this.parseDeriveCmd();
            case tokens_1.TokenType.CHECK:
                return this.parseCheckCmd();
            case tokens_1.TokenType.PROVE:
                return this.parseProveCmd();
            case tokens_1.TokenType.COUNTERMODEL:
                return this.parseCountermodelCmd();
            case tokens_1.TokenType.TRUTH_TABLE:
                return this.parseTruthTableCmd();
            case tokens_1.TokenType.LET:
                return this.parseLetDecl();
            case tokens_1.TokenType.CLAIM:
                return this.parseClaimDecl();
            case tokens_1.TokenType.SUPPORT:
                return this.parseSupportDecl();
            case tokens_1.TokenType.CONFIDENCE:
                return this.parseConfidenceDecl();
            case tokens_1.TokenType.CONTEXT:
                return this.parseContextDecl();
            case tokens_1.TokenType.RENDER:
                return this.parseRenderCmd();
            case tokens_1.TokenType.NEWLINE:
                this.advance();
                return null;
            case tokens_1.TokenType.EOF:
                return null;
            default:
                throw new Error(`Statement inesperado: '${tok.value}' (${tok.type})`);
        }
    }
    // logic classical.propositional
    parseLogicDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.LOGIC);
        let profile = '';
        // Leer perfil como secuencia de ID.ID
        profile = this.expectIdent();
        while (this.match(tokens_1.TokenType.DOT)) {
            profile += '.';
            profile += this.expectIdent();
        }
        return { kind: 'logic_decl', profile, source: src };
    }
    // axiom name = FORMULA  o  axiom name : FORMULA
    parseAxiomDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.AXIOM);
        const name = this.expectIdent();
        this.expectOneOf(tokens_1.TokenType.EQUALS, tokens_1.TokenType.COLON);
        const formula = this.parseFormula();
        return { kind: 'axiom_decl', name, formula, source: src };
    }
    // theorem name = FORMULA  o  theorem name : FORMULA
    parseTheoremDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.THEOREM);
        const name = this.expectIdent();
        this.expectOneOf(tokens_1.TokenType.EQUALS, tokens_1.TokenType.COLON);
        const formula = this.parseFormula();
        return { kind: 'theorem_decl', name, formula, source: src };
    }
    // derive FORMULA from {a1, a2, ...}
    parseDeriveCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.DERIVE);
        const goal = this.parseFormula();
        this.expect(tokens_1.TokenType.FROM);
        const premises = this.parseIdList();
        return { kind: 'derive_cmd', goal, premises, source: src };
    }
    // check valid FORMULA | check satisfiable FORMULA | check equivalent F, F
    parseCheckCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.CHECK);
        if (this.match(tokens_1.TokenType.VALID)) {
            const formula = this.parseFormula();
            return { kind: 'check_valid_cmd', formula, source: src };
        }
        if (this.match(tokens_1.TokenType.SATISFIABLE)) {
            const formula = this.parseFormula();
            return { kind: 'check_satisfiable_cmd', formula, source: src };
        }
        if (this.match(tokens_1.TokenType.EQUIVALENT)) {
            const left = this.parseFormula();
            this.expect(tokens_1.TokenType.COMMA);
            const right = this.parseFormula();
            return { kind: 'check_equivalent_cmd', left, right, source: src };
        }
        throw new Error(`Se esperaba 'valid', 'satisfiable' o 'equivalent' despues de 'check'`);
    }
    // prove FORMULA from {a1, a2}
    parseProveCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.PROVE);
        const goal = this.parseFormula();
        this.expect(tokens_1.TokenType.FROM);
        const premises = this.parseIdList();
        return { kind: 'prove_cmd', goal, premises, source: src };
    }
    // countermodel FORMULA
    parseCountermodelCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.COUNTERMODEL);
        const formula = this.parseFormula();
        return { kind: 'countermodel_cmd', formula, source: src };
    }
    // truth_table FORMULA
    parseTruthTableCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.TRUTH_TABLE);
        const formula = this.parseFormula();
        return { kind: 'truth_table_cmd', formula, source: src };
    }
    // let name = passage([[path#anchor]])
    // let name = formalize passageName as FORMULA
    parseLetDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.LET);
        const name = this.expectIdent();
        this.expect(tokens_1.TokenType.EQUALS);
        if (this.match(tokens_1.TokenType.PASSAGE)) {
            this.expect(tokens_1.TokenType.LPAREN);
            this.expect(tokens_1.TokenType.LBRACKET_DOUBLE);
            // El lexer ya leyó el contenido como STRING entre [[ y ]]
            let anchorPath = '';
            if (this.checkType(tokens_1.TokenType.STRING)) {
                anchorPath = this.current().value;
                this.advance();
            }
            else {
                // Fallback: leer tokens hasta ]]
                while (!this.checkType(tokens_1.TokenType.RBRACKET_DOUBLE) && !this.isAtEnd()) {
                    anchorPath += this.current().value;
                    this.advance();
                }
            }
            this.expect(tokens_1.TokenType.RBRACKET_DOUBLE);
            this.expect(tokens_1.TokenType.RPAREN);
            return { kind: 'let_decl', name, letType: 'passage', anchorPath, source: src };
        }
        if (this.match(tokens_1.TokenType.FORMALIZE)) {
            const passageName = this.expectIdent();
            this.expect(tokens_1.TokenType.AS);
            const formula = this.parseFormula();
            return { kind: 'let_decl', name, letType: 'formalize', passageName, formula, source: src };
        }
        throw new Error(`Se esperaba 'passage' o 'formalize' despues de '='`);
    }
    // claim name = ID_OR_FORMULA
    parseClaimDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.CLAIM);
        const name = this.expectIdent();
        this.expect(tokens_1.TokenType.EQUALS);
        // Intentar parsear como fórmula; si es solo un ID simple, guardarlo como value
        const saved = this.pos;
        try {
            const formula = this.parseFormula();
            return { kind: 'claim_decl', name, value: this.formulaToString(formula), formula, source: src };
        }
        catch {
            this.pos = saved;
            const value = this.expectIdent();
            return { kind: 'claim_decl', name, value, source: src };
        }
    }
    // support claimName <- sourceName
    parseSupportDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.SUPPORT);
        const claimName = this.expectIdent();
        this.expect(tokens_1.TokenType.BACK_ARROW);
        const sourceName = this.expectIdent();
        return { kind: 'support_decl', claimName, sourceName, source: src };
    }
    // confidence claimName = NUMBER
    parseConfidenceDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.CONFIDENCE);
        const claimName = this.expectIdent();
        this.expect(tokens_1.TokenType.EQUALS);
        const tok = this.expect(tokens_1.TokenType.NUMBER);
        return { kind: 'confidence_decl', claimName, value: parseFloat(tok.value), source: src };
    }
    // context claimName = "text"
    parseContextDecl() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.CONTEXT);
        const claimName = this.expectIdent();
        this.expect(tokens_1.TokenType.EQUALS);
        const tok = this.expect(tokens_1.TokenType.STRING);
        return { kind: 'context_decl', claimName, text: tok.value, source: src };
    }
    // render target --format FORMAT
    parseRenderCmd() {
        const src = this.loc();
        this.expect(tokens_1.TokenType.RENDER);
        const target = this.expectIdent();
        let format = 'markdown';
        // Opcionalmente leer --format
        // Simplificado: si hay un ident 'markdown' o 'json' o 'text' después, lo tomamos
        if (this.checkType(tokens_1.TokenType.IDENTIFIER)) {
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
    parseFormula() {
        return this.parseBiconditional();
    }
    parseBiconditional() {
        let left = this.parseImplication();
        while (this.match(tokens_1.TokenType.BICONDITIONAL)) {
            const right = this.parseImplication();
            left = { kind: 'biconditional', args: [left, right], source: this.loc() };
        }
        return left;
    }
    parseImplication() {
        const left = this.parseDisjunction();
        if (this.match(tokens_1.TokenType.ARROW)) {
            // Asociatividad a la derecha
            const right = this.parseImplication();
            return { kind: 'implies', args: [left, right], source: this.loc() };
        }
        return left;
    }
    parseDisjunction() {
        let left = this.parseConjunction();
        while (this.match(tokens_1.TokenType.OR)) {
            const right = this.parseConjunction();
            left = { kind: 'or', args: [left, right], source: this.loc() };
        }
        return left;
    }
    parseConjunction() {
        let left = this.parseUnary();
        while (this.match(tokens_1.TokenType.AND)) {
            const right = this.parseUnary();
            left = { kind: 'and', args: [left, right], source: this.loc() };
        }
        return left;
    }
    parseUnary() {
        if (this.match(tokens_1.TokenType.NOT)) {
            const operand = this.parseUnary();
            return { kind: 'not', args: [operand], source: this.loc() };
        }
        return this.parseAtom();
    }
    parseAtom() {
        // Paréntesis
        if (this.match(tokens_1.TokenType.LPAREN)) {
            const inner = this.parseFormula();
            this.expect(tokens_1.TokenType.RPAREN);
            return inner;
        }
        // Átomo proposicional
        if (this.checkType(tokens_1.TokenType.IDENTIFIER)) {
            const tok = this.current();
            this.advance();
            return { kind: 'atom', name: tok.value, source: { line: tok.line, column: tok.column } };
        }
        throw new Error(`Se esperaba formula en linea ${this.current().line}, columna ${this.current().column}, ` +
            `encontrado: '${this.current().value}' (${this.current().type})`);
    }
    // --- Helpers ---
    parseIdList() {
        this.expect(tokens_1.TokenType.LBRACE);
        const ids = [];
        if (!this.checkType(tokens_1.TokenType.RBRACE)) {
            ids.push(this.expectIdent());
            while (this.match(tokens_1.TokenType.COMMA)) {
                ids.push(this.expectIdent());
            }
        }
        this.expect(tokens_1.TokenType.RBRACE);
        return ids;
    }
    formulaToString(f) {
        switch (f.kind) {
            case 'atom': return f.name || '?';
            case 'not': return `!${this.formulaToString(f.args[0])}`;
            case 'and': return `(${this.formulaToString(f.args[0])} & ${this.formulaToString(f.args[1])})`;
            case 'or': return `(${this.formulaToString(f.args[0])} | ${this.formulaToString(f.args[1])})`;
            case 'implies': return `(${this.formulaToString(f.args[0])} -> ${this.formulaToString(f.args[1])})`;
            case 'biconditional': return `(${this.formulaToString(f.args[0])} <-> ${this.formulaToString(f.args[1])})`;
            default: return '?';
        }
    }
    current() {
        if (this.pos >= this.tokens.length) {
            return { type: tokens_1.TokenType.EOF, value: '', line: 0, column: 0 };
        }
        return this.tokens[this.pos];
    }
    advance() {
        const tok = this.current();
        this.pos++;
        return tok;
    }
    isAtEnd() {
        return this.current().type === tokens_1.TokenType.EOF;
    }
    checkType(type) {
        return this.current().type === type;
    }
    match(type) {
        if (this.checkType(type)) {
            this.advance();
            return true;
        }
        return false;
    }
    expect(type) {
        if (this.checkType(type)) {
            return this.advance();
        }
        throw new Error(`Se esperaba ${type}, encontrado '${this.current().value}' (${this.current().type}) ` +
            `en linea ${this.current().line}, columna ${this.current().column}`);
    }
    expectOneOf(...types) {
        for (const type of types) {
            if (this.checkType(type)) {
                return this.advance();
            }
        }
        throw new Error(`Se esperaba ${types.join(' o ')}, encontrado '${this.current().value}' (${this.current().type}) ` +
            `en linea ${this.current().line}, columna ${this.current().column}`);
    }
    expectIdent() {
        const tok = this.expect(tokens_1.TokenType.IDENTIFIER);
        return tok.value;
    }
    loc() {
        const tok = this.current();
        return { line: tok.line, column: tok.column, file: this.file };
    }
    skipNewlines() {
        while (this.checkType(tokens_1.TokenType.NEWLINE)) {
            this.advance();
        }
    }
    advanceToNextStatement() {
        while (!this.isAtEnd() && !this.checkType(tokens_1.TokenType.NEWLINE)) {
            this.advance();
        }
        this.skipNewlines();
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map