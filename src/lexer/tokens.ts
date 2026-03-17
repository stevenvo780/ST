// ============================================================
// ST Lexer — Tokens
// ============================================================

export enum TokenType {
  // Keywords
  LOGIC = 'LOGIC',
  AXIOM = 'AXIOM',
  THEOREM = 'THEOREM',
  DERIVE = 'DERIVE',
  FROM = 'FROM',
  CHECK = 'CHECK',
  VALID = 'VALID',
  SATISFIABLE = 'SATISFIABLE',
  EQUIVALENT = 'EQUIVALENT',
  PROVE = 'PROVE',
  COUNTERMODEL = 'COUNTERMODEL',
  TRUTH_TABLE = 'TRUTH_TABLE',
  LET = 'LET',
  PASSAGE = 'PASSAGE',
  FORMALIZE = 'FORMALIZE',
  AS = 'AS',
  CLAIM = 'CLAIM',
  SUPPORT = 'SUPPORT',
  CONFIDENCE = 'CONFIDENCE',
  CONTEXT = 'CONTEXT',
  RENDER = 'RENDER',
  FORALL = 'FORALL',
  EXISTS = 'EXISTS',

  // Operators
  ARROW = 'ARROW', // ->
  AND = 'AND', // &
  OR = 'OR', // |
  NOT = 'NOT', // !
  BICONDITIONAL = 'BICONDITIONAL', // <->
  BACK_ARROW = 'BACK_ARROW', // <-
  EQUALS = 'EQUALS', // =

  // Delimiters
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET_DOUBLE = 'LBRACKET_DOUBLE', // [[
  RBRACKET_DOUBLE = 'RBRACKET_DOUBLE', // ]]
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Punctuation
  COMMA = 'COMMA', // ,
  COLON = 'COLON', // :
  HASH = 'HASH', // #
  DOT = 'DOT', // .

  // Modal Operators
  BOX = 'BOX', // []
  DIAMOND = 'DIAMOND', // <>

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  logic: TokenType.LOGIC,
  axiom: TokenType.AXIOM,
  theorem: TokenType.THEOREM,
  derive: TokenType.DERIVE,
  from: TokenType.FROM,
  check: TokenType.CHECK,
  valid: TokenType.VALID,
  satisfiable: TokenType.SATISFIABLE,
  equivalent: TokenType.EQUIVALENT,
  prove: TokenType.PROVE,
  countermodel: TokenType.COUNTERMODEL,
  truth_table: TokenType.TRUTH_TABLE,
  let: TokenType.LET,
  passage: TokenType.PASSAGE,
  formalize: TokenType.FORMALIZE,
  as: TokenType.AS,
  claim: TokenType.CLAIM,
  support: TokenType.SUPPORT,
  confidence: TokenType.CONFIDENCE,
  context: TokenType.CONTEXT,
  render: TokenType.RENDER,
  forall: TokenType.FORALL,
  exists: TokenType.EXISTS,
};
