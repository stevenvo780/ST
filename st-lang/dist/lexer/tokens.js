"use strict";
// ============================================================
// ST Lexer — Tokens
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYWORDS = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Keywords
    TokenType["LOGIC"] = "LOGIC";
    TokenType["AXIOM"] = "AXIOM";
    TokenType["THEOREM"] = "THEOREM";
    TokenType["DERIVE"] = "DERIVE";
    TokenType["FROM"] = "FROM";
    TokenType["CHECK"] = "CHECK";
    TokenType["VALID"] = "VALID";
    TokenType["SATISFIABLE"] = "SATISFIABLE";
    TokenType["EQUIVALENT"] = "EQUIVALENT";
    TokenType["PROVE"] = "PROVE";
    TokenType["COUNTERMODEL"] = "COUNTERMODEL";
    TokenType["TRUTH_TABLE"] = "TRUTH_TABLE";
    TokenType["LET"] = "LET";
    TokenType["PASSAGE"] = "PASSAGE";
    TokenType["FORMALIZE"] = "FORMALIZE";
    TokenType["AS"] = "AS";
    TokenType["CLAIM"] = "CLAIM";
    TokenType["SUPPORT"] = "SUPPORT";
    TokenType["CONFIDENCE"] = "CONFIDENCE";
    TokenType["CONTEXT"] = "CONTEXT";
    TokenType["RENDER"] = "RENDER";
    // Operators
    TokenType["ARROW"] = "ARROW";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["NOT"] = "NOT";
    TokenType["BICONDITIONAL"] = "BICONDITIONAL";
    TokenType["BACK_ARROW"] = "BACK_ARROW";
    TokenType["EQUALS"] = "EQUALS";
    // Delimiters
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LBRACKET_DOUBLE"] = "LBRACKET_DOUBLE";
    TokenType["RBRACKET_DOUBLE"] = "RBRACKET_DOUBLE";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    // Literals
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["STRING"] = "STRING";
    TokenType["NUMBER"] = "NUMBER";
    // Punctuation
    TokenType["COMMA"] = "COMMA";
    TokenType["COLON"] = "COLON";
    TokenType["HASH"] = "HASH";
    TokenType["DOT"] = "DOT";
    // Special
    TokenType["NEWLINE"] = "NEWLINE";
    TokenType["EOF"] = "EOF";
    TokenType["COMMENT"] = "COMMENT";
})(TokenType || (exports.TokenType = TokenType = {}));
exports.KEYWORDS = {
    'logic': TokenType.LOGIC,
    'axiom': TokenType.AXIOM,
    'theorem': TokenType.THEOREM,
    'derive': TokenType.DERIVE,
    'from': TokenType.FROM,
    'check': TokenType.CHECK,
    'valid': TokenType.VALID,
    'satisfiable': TokenType.SATISFIABLE,
    'equivalent': TokenType.EQUIVALENT,
    'prove': TokenType.PROVE,
    'countermodel': TokenType.COUNTERMODEL,
    'truth_table': TokenType.TRUTH_TABLE,
    'let': TokenType.LET,
    'passage': TokenType.PASSAGE,
    'formalize': TokenType.FORMALIZE,
    'as': TokenType.AS,
    'claim': TokenType.CLAIM,
    'support': TokenType.SUPPORT,
    'confidence': TokenType.CONFIDENCE,
    'context': TokenType.CONTEXT,
    'render': TokenType.RENDER,
};
//# sourceMappingURL=tokens.js.map