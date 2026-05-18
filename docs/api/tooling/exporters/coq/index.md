# `tooling/exporters/coq/index.ts`

============================================================ ST Exporters — Coq code generator (classical profile only) ============================================================ Converts ST Formula AST and Proof objects into valid Coq 8.x source code. Scope v1: classical connectives + quantifiers. ============================================================

## Contents

- [`CoqExportOptions`](#coqexportoptions) — Interface
- [`formulaToCoqTerm`](#formulatocoqterm) — Function
- [`exportToCoq`](#exporttocoq) — Function
- [`exportProofToCoq`](#exportprooftocoq) — Function

## `CoqExportOptions`

> Interface · `tooling/exporters/coq/index.ts:14`

```ts
export interface CoqExportOptions
```


## `formulaToCoqTerm`

> Function · `tooling/exporters/coq/index.ts:33`

Converts an ST Formula AST node into a Coq Prop expression string.
Only classical connectives and quantifiers are handled; other kinds
produce a `(* unsupported: <kind> *)` placeholder so callers can
inspect what was dropped.

```ts
export function formulaToCoqTerm(formula: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |

### Returns

`string` — 


## `exportToCoq`

> Function · `tooling/exporters/coq/index.ts:276`

Exports a single ST Formula as a Coq module with a `Definition`
and an optional `Theorem` skeleton.

```ts
export function exportToCoq(formula: Formula, opts?: CoqExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no | The ST Formula AST node. |
| `opts` | `CoqExportOptions` | yes | Export options (moduleName, includeImports, emitProof). |

### Returns

`string` — Valid Coq source code as a string.


## `exportProofToCoq`

> Function · `tooling/exporters/coq/index.ts:312`

Exports an ST Proof object as a Coq module with a `Definition`
and a `Theorem` block whose body is derived from the proof steps.

```ts
export function exportProofToCoq(proof: Proof, opts?: CoqExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `Proof` | no | The ST Proof object. |
| `opts` | `CoqExportOptions` | yes | Export options. |

### Returns

`string` — Valid Coq source code as a string.

