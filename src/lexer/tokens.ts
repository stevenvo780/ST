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
  ANALYZE = 'ANALYZE',
  EXPLAIN = 'EXPLAIN',
  REFUTE = 'REFUTE',
  NEXT = 'NEXT',       // X (temporal next)
  UNTIL = 'UNTIL',     // U (temporal until)
  IMPORT = 'IMPORT',   // import file
  ASSUME = 'ASSUME',   // assume (natural deduction)
  SHOW = 'SHOW',       // show goal
  QED = 'QED',         // end proof block
  THEORY = 'THEORY',   // theory block (OOP)
  EXTENDS = 'EXTENDS', // theory inheritance
  PRIVATE = 'PRIVATE', // private member (encapsulation)

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
  // ── English keywords ───────────────────────────────────────
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
  analyze: TokenType.ANALYZE,
  explain: TokenType.EXPLAIN,

  // ── Spanish aliases (aliases en español) ───────────────────
  logica: TokenType.LOGIC,
  axioma: TokenType.AXIOM,
  teorema: TokenType.THEOREM,
  derivar: TokenType.DERIVE,
  desde: TokenType.FROM,
  verificar: TokenType.CHECK,
  valido: TokenType.VALID,
  satisfacible: TokenType.SATISFIABLE,
  equivalente: TokenType.EQUIVALENT,
  probar: TokenType.PROVE,
  contramodelo: TokenType.COUNTERMODEL,
  tabla_verdad: TokenType.TRUTH_TABLE,
  sea: TokenType.LET,
  pasaje: TokenType.PASSAGE,
  formalizar: TokenType.FORMALIZE,
  como: TokenType.AS,
  afirmacion: TokenType.CLAIM,
  soporte: TokenType.SUPPORT,
  confianza: TokenType.CONFIDENCE,
  contexto: TokenType.CONTEXT,
  mostrar: TokenType.RENDER,
  paratodo: TokenType.FORALL,
  existe: TokenType.EXISTS,
  analizar: TokenType.ANALYZE,
  explicar: TokenType.EXPLAIN,
  refute: TokenType.REFUTE,
  refutar: TokenType.REFUTE,
  next: TokenType.NEXT,
  siguiente: TokenType.NEXT,
  until: TokenType.UNTIL,
  hasta: TokenType.UNTIL,
  import: TokenType.IMPORT,
  importar: TokenType.IMPORT,
  assume: TokenType.ASSUME,
  asumir: TokenType.ASSUME,
  show: TokenType.SHOW,
  demostrar: TokenType.SHOW,
  qed: TokenType.QED,
  theory: TokenType.THEORY,
  teoria: TokenType.THEORY,
  extends: TokenType.EXTENDS,
  extiende: TokenType.EXTENDS,
  private: TokenType.PRIVATE,
  privado: TokenType.PRIVATE,
};
