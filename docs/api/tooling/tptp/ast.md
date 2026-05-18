# `tooling/tptp/ast.ts`

============================================================ TPTP — AST ============================================================ AST de fórmulas TPTP (Thousands of Problems for Theorem Provers). Soporta FOF (First-Order Form), CNF (Clause Normal Form) y TFF light (Typed First-order Form sin sistema de tipos completo). Convenciones léxicas TPTP:  - Predicados, funciones y constantes: identificador en `lower_case`    (empieza por minúscula, sigue alfanumérico/`_`).  - Variables: identificador en `Upper_Case` (empieza por mayúscula).  - Operadores: `~` (not), `&` (and), `|` (or), `=>` (implies),    `<=>` (iff), `<~>` (xor), `!` (forall), `?` (exists),    `=` (eq), `!=` (neq).

## Contents

- [`TptpRole`](#tptprole) — Type
- [`TptpLanguage`](#tptplanguage) — Type
- [`TptpTerm`](#tptpterm) — Type
- [`TptpFormula`](#tptpformula) — Type
- [`TptpAnnotated`](#tptpannotated) — Interface
- [`TptpProblem`](#tptpproblem) — Interface
- [`TPTP_ROLES`](#tptp-roles) — Const
- [`TPTP_LANGUAGES`](#tptp-languages) — Const

## `TptpRole`

> Type · `tooling/tptp/ast.ts:17`

```ts
export type TptpRole = | 'axiom' | 'hypothesis' | 'conjecture' | 'negated_conjecture' | 'lemma' | 'theorem' | 'definition' | 'plain';
```


## `TptpLanguage`

> Type · `tooling/tptp/ast.ts:27`

```ts
export type TptpLanguage = 'fof' | 'cnf' | 'tff' | 'thf';
```


## `TptpTerm`

> Type · `tooling/tptp/ast.ts:29`

```ts
export type TptpTerm = | { kind: 'var'; name: string } | { kind: 'const'; name: string } | { kind: 'func'; name: string; args: TptpTerm[] };
```


## `TptpFormula`

> Type · `tooling/tptp/ast.ts:34`

```ts
export type TptpFormula = | { kind: 'atom'; predicate: string; args: TptpTerm[] } | { kind: 'eq'; left: TptpTerm; right: TptpTerm } | { kind: 'neq'; left: TptpTerm; right: TptpTerm } | { kind: 'not'; arg: TptpFormula } | { kind: 'and'; args: TptpFormula[] } | { kind: 'or'; args: TptpFormula[] } | { kind: 'implies'; left: TptpFormula; right: TptpFormula } | { kind: 'iff'; left: TptpFormula; right: TptpFormula } | { kind: 'xor'; left: TptpFormula; right: TptpFormula } | { kind: 'forall'; vars: string[]; body: TptpFormula } | { kind: 'exists'; vars: string[]; body: TptpFormula } | { kind: 'true' } | { kind: 'false' };
```


## `TptpAnnotated`

> Interface · `tooling/tptp/ast.ts:49`

```ts
export interface TptpAnnotated
```


## `TptpProblem`

> Interface · `tooling/tptp/ast.ts:57`

```ts
export interface TptpProblem
```


## `TPTP_ROLES`

> Const · `tooling/tptp/ast.ts:62`

```ts
const TPTP_ROLES: ReadonlySet<TptpRole>
```


## `TPTP_LANGUAGES`

> Const · `tooling/tptp/ast.ts:73`

```ts
const TPTP_LANGUAGES: ReadonlySet<TptpLanguage>
```

