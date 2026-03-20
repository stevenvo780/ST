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
  NEXT = 'NEXT', // X (temporal next)
  UNTIL = 'UNTIL', // U (temporal until)
  IMPORT = 'IMPORT', // import file
  EXPORT = 'EXPORT', // export keyword
  ASSUME = 'ASSUME', // assume (natural deduction)
  SHOW = 'SHOW', // show goal
  QED = 'QED', // end proof block
  THEORY = 'THEORY', // theory block (OOP)
  EXTENDS = 'EXTENDS', // theory inheritance
  PRIVATE = 'PRIVATE', // private member (encapsulation)
  PRINT = 'PRINT', // print command
  SET = 'SET', // set (reassign variable)
  IF = 'IF', // if conditional
  ELSE = 'ELSE', // else branch
  FOR = 'FOR', // for loop
  IN = 'IN', // in (for x in {..})
  WHILE = 'WHILE', // while loop
  FN = 'FN', // function declaration
  RETURN = 'RETURN', // return from function

  // Operators
  ARROW = 'ARROW', // ->
  AND = 'AND', // &
  OR = 'OR', // |
  NOT = 'NOT', // !
  BICONDITIONAL = 'BICONDITIONAL', // <->
  BACK_ARROW = 'BACK_ARROW', // <-
  EQUALS = 'EQUALS', // =
  NAND = 'NAND', // ↑ (NAND)
  NOR = 'NOR', // ↓ (NOR)
  XOR = 'XOR', // ⊕ (XOR)

  // Arithmetic operators
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %
  LT = 'LT', // <
  GT = 'GT', // >
  LTE = 'LTE', // <=
  GTE = 'GTE', // >=

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

/**
 * Core keywords — always reserved regardless of profile.
 */
export const CORE_KEYWORDS: Record<string, TokenType> = {
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
  print: TokenType.PRINT,
  set: TokenType.SET,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  in: TokenType.IN,
  while: TokenType.WHILE,
  fn: TokenType.FN,
  return: TokenType.RETURN,
  nand: TokenType.NAND,
  nor: TokenType.NOR,
  xor: TokenType.XOR,
  import: TokenType.IMPORT,
  importar: TokenType.IMPORT,
  export: TokenType.EXPORT,
  exportar: TokenType.EXPORT,
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
  imprimir: TokenType.PRINT,
  asignar: TokenType.SET,
  si: TokenType.IF,
  sino: TokenType.ELSE,
  para: TokenType.FOR,
  en: TokenType.IN,
  mientras: TokenType.WHILE,
  funcion: TokenType.FN,
  retornar: TokenType.RETURN,
};

/**
 * Profile-specific keywords — only reserved when the matching profile is active.
 * Keys are profile prefixes: a keyword activates when the current profile starts with the key.
 */
export const PROFILE_KEYWORDS: Record<string, Record<string, TokenType>> = {
  'temporal': {
    next: TokenType.NEXT,
    siguiente: TokenType.NEXT,
    until: TokenType.UNTIL,
    hasta: TokenType.UNTIL,
  },
};

/**
 * Build the full keyword map for a given profile.
 * If no profile is given, all keywords (core + all profile) are active (backward compatible).
 */
export function getKeywordsForProfile(profile?: string): Record<string, TokenType> {
  if (!profile) {
    // No profile context: all keywords active (backward compatible)
    const all: Record<string, TokenType> = { ...CORE_KEYWORDS };
    for (const group of Object.values(PROFILE_KEYWORDS)) {
      Object.assign(all, group);
    }
    return all;
  }

  const keywords: Record<string, TokenType> = { ...CORE_KEYWORDS };
  for (const [prefix, group] of Object.entries(PROFILE_KEYWORDS)) {
    if (profile.startsWith(prefix)) {
      Object.assign(keywords, group);
    }
  }
  return keywords;
}

/**
 * Legacy: all keywords combined (for backward compatibility).
 */
export const KEYWORDS: Record<string, TokenType> = getKeywordsForProfile();
