// ============================================================
// TPTP — AST
// ============================================================
//
// AST de fórmulas TPTP (Thousands of Problems for Theorem Provers).
// Soporta FOF (First-Order Form), CNF (Clause Normal Form) y
// TFF light (Typed First-order Form sin sistema de tipos completo).
//
// Convenciones léxicas TPTP:
//  - Predicados, funciones y constantes: identificador en `lower_case`
//    (empieza por minúscula, sigue alfanumérico/`_`).
//  - Variables: identificador en `Upper_Case` (empieza por mayúscula).
//  - Operadores: `~` (not), `&` (and), `|` (or), `=>` (implies),
//    `<=>` (iff), `<~>` (xor), `!` (forall), `?` (exists),
//    `=` (eq), `!=` (neq).

export type TptpRole =
  | 'axiom'
  | 'hypothesis'
  | 'conjecture'
  | 'negated_conjecture'
  | 'lemma'
  | 'theorem'
  | 'definition'
  | 'plain';

export type TptpLanguage = 'fof' | 'cnf' | 'tff' | 'thf';

export type TptpTerm =
  | { kind: 'var'; name: string }
  | { kind: 'const'; name: string }
  | { kind: 'func'; name: string; args: TptpTerm[] };

export type TptpFormula =
  | { kind: 'atom'; predicate: string; args: TptpTerm[] }
  | { kind: 'eq'; left: TptpTerm; right: TptpTerm }
  | { kind: 'neq'; left: TptpTerm; right: TptpTerm }
  | { kind: 'not'; arg: TptpFormula }
  | { kind: 'and'; args: TptpFormula[] }
  | { kind: 'or'; args: TptpFormula[] }
  | { kind: 'implies'; left: TptpFormula; right: TptpFormula }
  | { kind: 'iff'; left: TptpFormula; right: TptpFormula }
  | { kind: 'xor'; left: TptpFormula; right: TptpFormula }
  | { kind: 'forall'; vars: string[]; body: TptpFormula }
  | { kind: 'exists'; vars: string[]; body: TptpFormula }
  | { kind: 'true' }
  | { kind: 'false' };

export interface TptpAnnotated {
  language: TptpLanguage;
  name: string;
  role: TptpRole;
  formula: TptpFormula;
  comment?: string;
}

export interface TptpProblem {
  annotated: TptpAnnotated[];
  includes: string[];
}

export const TPTP_ROLES: ReadonlySet<TptpRole> = new Set<TptpRole>([
  'axiom',
  'hypothesis',
  'conjecture',
  'negated_conjecture',
  'lemma',
  'theorem',
  'definition',
  'plain',
]);

export const TPTP_LANGUAGES: ReadonlySet<TptpLanguage> = new Set<TptpLanguage>([
  'fof',
  'cnf',
  'tff',
  'thf',
]);
