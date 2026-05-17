// ============================================================
// SMT-LIB v2 — AST de sorts, términos y comandos
// ============================================================
//
// Cubre el grueso del estándar SMT-LIB v2.6:
//   - sorts atómicos y aplicados (e.g. (Array Int Int), (_ BitVec 32))
//   - términos: constantes especiales, símbolos, aplicaciones, let,
//     forall/exists, match, annotated terms (`!`)
//   - comandos: set-logic / set-option / set-info, declare-* / define-*,
//     assert, check-sat / check-sat-assuming, get-*, push/pop, reset*, exit, echo
//
// Estos tipos son intencionalmente conservadores: cualquier expresión que el
// parser no entienda como construcción privilegiada cae a `{ kind: 'app' }`
// con la cabeza preservada como string, así no perdemos información.

/** Sort SMT-LIB v2: o bien un símbolo (Int, Real, Bool) o una aplicación. */
export type SmtSort =
  | { kind: 'symbol'; name: string }
  | { kind: 'app'; name: string; args: SmtSort[] };

/** Tipos de constantes especiales del estándar (spec_constant). */
export type SmtSpecConstantType = 'numeral' | 'decimal' | 'string' | 'hex' | 'binary';

/** Término SMT-LIB v2. */
export type SmtTerm =
  | { kind: 'spec-constant'; type: SmtSpecConstantType; value: string }
  | { kind: 'symbol'; name: string }
  | { kind: 'app'; fn: string; args: SmtTerm[] }
  | { kind: 'let'; bindings: Array<{ name: string; value: SmtTerm }>; body: SmtTerm }
  | { kind: 'forall'; vars: Array<{ name: string; sort: SmtSort }>; body: SmtTerm }
  | { kind: 'exists'; vars: Array<{ name: string; sort: SmtSort }>; body: SmtTerm }
  | { kind: 'match'; scrutinee: SmtTerm; cases: Array<{ pattern: SmtTerm; body: SmtTerm }> }
  | { kind: 'annotated'; term: SmtTerm; attrs: Array<{ key: string; value?: string }> };

/** Comando SMT-LIB v2 (subset operativo del estándar). */
export type SmtCommand =
  | { kind: 'set-logic'; logic: string }
  | { kind: 'set-option'; key: string; value: string }
  | { kind: 'set-info'; key: string; value: string }
  | { kind: 'declare-sort'; name: string; arity: number }
  | { kind: 'define-sort'; name: string; params: string[]; body: SmtSort }
  | { kind: 'declare-fun'; name: string; paramSorts: SmtSort[]; resultSort: SmtSort }
  | {
      kind: 'define-fun';
      name: string;
      params: Array<{ name: string; sort: SmtSort }>;
      resultSort: SmtSort;
      body: SmtTerm;
    }
  | { kind: 'declare-const'; name: string; sort: SmtSort }
  | { kind: 'assert'; formula: SmtTerm }
  | { kind: 'check-sat' }
  | { kind: 'check-sat-assuming'; assumptions: SmtTerm[] }
  | { kind: 'get-assertions' }
  | { kind: 'get-model' }
  | { kind: 'get-proof' }
  | { kind: 'get-unsat-core' }
  | { kind: 'get-value'; terms: SmtTerm[] }
  | { kind: 'push'; levels: number }
  | { kind: 'pop'; levels: number }
  | { kind: 'reset' }
  | { kind: 'reset-assertions' }
  | { kind: 'exit' }
  | { kind: 'echo'; message: string };

/** Lógicas estándar reconocidas (no exhaustivo). */
export const KNOWN_LOGICS: ReadonlySet<string> = new Set<string>([
  'QF_UF',
  'QF_LIA',
  'QF_LRA',
  'QF_LIRA',
  'QF_NIA',
  'QF_NRA',
  'QF_NIRA',
  'QF_BV',
  'QF_AX',
  'QF_ABV',
  'QF_AUFBV',
  'QF_AUFLIA',
  'QF_UFLIA',
  'QF_UFLRA',
  'QF_UFNRA',
  'QF_UFBV',
  'AUFLIA',
  'AUFLIRA',
  'AUFNIA',
  'AUFNIRA',
  'LIA',
  'LRA',
  'NIA',
  'NRA',
  'BV',
  'UF',
  'ALL',
]);

/** Identifica si una cabeza de comando es nombre estándar del estándar. */
export const COMMAND_NAMES: ReadonlySet<string> = new Set<string>([
  'set-logic',
  'set-option',
  'set-info',
  'declare-sort',
  'define-sort',
  'declare-fun',
  'define-fun',
  'declare-const',
  'assert',
  'check-sat',
  'check-sat-assuming',
  'get-assertions',
  'get-model',
  'get-proof',
  'get-unsat-core',
  'get-value',
  'push',
  'pop',
  'reset',
  'reset-assertions',
  'exit',
  'echo',
]);
