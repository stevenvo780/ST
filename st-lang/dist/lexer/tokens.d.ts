export declare enum TokenType {
    LOGIC = "LOGIC",
    AXIOM = "AXIOM",
    THEOREM = "THEOREM",
    DERIVE = "DERIVE",
    FROM = "FROM",
    CHECK = "CHECK",
    VALID = "VALID",
    SATISFIABLE = "SATISFIABLE",
    EQUIVALENT = "EQUIVALENT",
    PROVE = "PROVE",
    COUNTERMODEL = "COUNTERMODEL",
    TRUTH_TABLE = "TRUTH_TABLE",
    LET = "LET",
    PASSAGE = "PASSAGE",
    FORMALIZE = "FORMALIZE",
    AS = "AS",
    CLAIM = "CLAIM",
    SUPPORT = "SUPPORT",
    CONFIDENCE = "CONFIDENCE",
    CONTEXT = "CONTEXT",
    RENDER = "RENDER",
    ARROW = "ARROW",// ->
    AND = "AND",// &
    OR = "OR",// |
    NOT = "NOT",// !
    BICONDITIONAL = "BICONDITIONAL",// <->
    BACK_ARROW = "BACK_ARROW",// <-
    EQUALS = "EQUALS",// =
    LPAREN = "LPAREN",// (
    RPAREN = "RPAREN",// )
    LBRACE = "LBRACE",// {
    RBRACE = "RBRACE",// }
    LBRACKET_DOUBLE = "LBRACKET_DOUBLE",// [[
    RBRACKET_DOUBLE = "RBRACKET_DOUBLE",// ]]
    LBRACKET = "LBRACKET",// [
    RBRACKET = "RBRACKET",// ]
    IDENTIFIER = "IDENTIFIER",
    STRING = "STRING",
    NUMBER = "NUMBER",
    COMMA = "COMMA",// ,
    COLON = "COLON",// :
    HASH = "HASH",// #
    DOT = "DOT",// .
    NEWLINE = "NEWLINE",
    EOF = "EOF",
    COMMENT = "COMMENT"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export declare const KEYWORDS: Record<string, TokenType>;
//# sourceMappingURL=tokens.d.ts.map