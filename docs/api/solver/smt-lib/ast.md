# `solver/smt-lib/ast.ts`

Sort SMT-LIB v2: o bien un símbolo (Int, Real, Bool) o una aplicación.

## Contents

- [`SmtSort`](#smtsort) — Type
- [`SmtSpecConstantType`](#smtspecconstanttype) — Type
- [`SmtTerm`](#smtterm) — Type
- [`SmtCommand`](#smtcommand) — Type
- [`KNOWN_LOGICS`](#known-logics) — Const
- [`COMMAND_NAMES`](#command-names) — Const

## `SmtSort`

> Type · `solver/smt-lib/ast.ts:17`

Sort SMT-LIB v2: o bien un símbolo (Int, Real, Bool) o una aplicación.

```ts
export type SmtSort = | { kind: 'symbol'; name: string } | { kind: 'app'; name: string; args: SmtSort[] };
```


## `SmtSpecConstantType`

> Type · `solver/smt-lib/ast.ts:22`

Tipos de constantes especiales del estándar (spec_constant).

```ts
export type SmtSpecConstantType = 'numeral' | 'decimal' | 'string' | 'hex' | 'binary';
```


## `SmtTerm`

> Type · `solver/smt-lib/ast.ts:25`

Término SMT-LIB v2.

```ts
export type SmtTerm = | { kind: 'spec-constant'; type: SmtSpecConstantType; value: string } | { kind: 'symbol'; name: string } | { kind: 'app'; fn: string; args: SmtTerm[] } | { kind: 'let'; bindings: Array<{ name: string; value: SmtTerm }>; body: SmtTerm } | { kind: 'forall'; vars: Array<{ name: string; sort: SmtSort }>; body: SmtTerm } | { kind: 'exists'; vars: Array<{ name: string; sort: SmtSort }>; body: SmtTerm } | { kind: 'match'; scrutinee: SmtTerm; cases: Array<{ pattern: SmtTerm; body: SmtTerm }> } | { kind: 'annotated'; term: SmtTerm; attrs: Array<{ key: string; value?: string }> };
```


## `SmtCommand`

> Type · `solver/smt-lib/ast.ts:36`

Comando SMT-LIB v2 (subset operativo del estándar).

```ts
export type SmtCommand = | { kind: 'set-logic'; logic: string } | { kind: 'set-option'; key: string; value: string } | { kind: 'set-info'; key: string; value: string } | { kind: 'declare-sort'; name: string; arity: number } | { kind: 'define-sort'; name: string; params: string[]; body: SmtSort } | { kind: 'declare-fun'; name: string; paramSorts: SmtSort[]; resultSort: SmtSort } | { kind: 'define-fun'; name: string; params: Array<{ name: string; sort: SmtSort }>; resultSort: SmtSort; body: SmtTerm; } | { kind: 'declare-const'; name: string; sort: SmtSort } | { kind: 'assert'; formula: SmtTerm } | { kind: 'check-sat' } | { kind: 'check-sat-assuming'; assumptions: SmtTerm[] } | { kind: 'get-assertions' } | { kind: 'get-model' } | { kind: 'get-proof' } | { kind: 'get-unsat-core' } | { kind: 'get-value'; terms: SmtTerm[] } | { kind: 'push'; levels: number } | { kind: 'pop'; levels: number } | { kind: 'reset' } | { kind: 'reset-assertions' } | { kind: 'exit' } | { kind: 'echo'; message: string };
```


## `KNOWN_LOGICS`

> Const · `solver/smt-lib/ast.ts:67`

Lógicas estándar reconocidas (no exhaustivo).

```ts
const KNOWN_LOGICS: ReadonlySet<string>
```


## `COMMAND_NAMES`

> Const · `solver/smt-lib/ast.ts:98`

Identifica si una cabeza de comando es nombre estándar del estándar.

```ts
const COMMAND_NAMES: ReadonlySet<string>
```

