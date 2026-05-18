# `tooling/exporters/lean4/index.ts`

============================================================ ST Exporters — Lean 4 code generator (classical profile) ============================================================ Converts ST Formula AST and Proof objects into valid Lean 4 source code. Differences vs. Coq exporter:   - Uses Unicode connectives (∧ ∨ → ¬ ↔) instead of ASCII.   - Definitions use `:=` and theorems use `theorem ... := by ...`.   - Tactics use Lean 4 vocabulary: `intro`, `exact`, `constructor`,     `obtain ⟨...⟩`, `cases`, `left`/`right`, `exfalso`, etc.   - Imports list controls Mathlib vs. core; default pulls in     `Mathlib.Tactic` for `tauto`, `exact?`, `Classical.em`, etc. ============================================================

## Contents

- [`Lean4ExportOptions`](#lean4exportoptions) — Interface
- [`COMMON_IMPORTS`](#common-imports) — Const
- [`LEAN4_OPS`](#lean4-ops) — Const
- [`formulaToLeanTerm`](#formulatoleanterm) — Function
- [`leanTacticForRule`](#leantacticforrule) — Function
- [`exportToLean4`](#exporttolean4) — Function
- [`exportProofToLean4`](#exportprooftolean4) — Function
- [`exportTheoryToLean4`](#exporttheorytolean4) — Function

## `Lean4ExportOptions`

> Interface · `tooling/exporters/lean4/index.ts:20`

```ts
export interface Lean4ExportOptions
```


## `COMMON_IMPORTS`

> Const · `tooling/exporters/lean4/index.ts:35`

```ts
const COMMON_IMPORTS: Record<'standard' | 'mathlib' | 'minimal', string[]>
```


## `LEAN4_OPS`

> Const · `tooling/exporters/lean4/index.ts:53`

Maps ST/Unicode logical operators to their Lean 4 surface syntax.
Lean 4 happens to accept the same Unicode glyphs, but we keep the
map explicit so downstream tooling can introspect the mapping.

```ts
const LEAN4_OPS: Map<string, string>
```


## `formulaToLeanTerm`

> Function · `tooling/exporters/lean4/index.ts:74`

Converts an ST Formula AST node into a Lean 4 Prop expression string.
Unsupported kinds emit `(/- unsupported: <kind> -/)` so dropped
sub-trees are visible to the reader.

```ts
export function formulaToLeanTerm(formula: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |

### Returns

`string` — 


## `leanTacticForRule`

> Function · `tooling/exporters/lean4/index.ts:167`

Translates a natural-deduction rule label into a Lean 4 tactic.
Used by callers that already know what rule they want to apply
outside the context of a full proof step.

```ts
export function leanTacticForRule(rule: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rule` | `string` | no |  |

### Returns

`string` — 


## `exportToLean4`

> Function · `tooling/exporters/lean4/index.ts:372`

Exports a single ST Formula as a Lean 4 module containing a
`def stmt : Prop := ...` and an optional `theorem stmt_proof : stmt := by ...`.

```ts
export function exportToLean4(formula: Formula, opts?: Lean4ExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `opts` | `Lean4ExportOptions` | yes |  |

### Returns

`string` — 


## `exportProofToLean4`

> Function · `tooling/exporters/lean4/index.ts:406`

Exports an ST Proof object as a Lean 4 module whose theorem body is
derived from the proof steps.

```ts
export function exportProofToLean4(proof: Proof, opts?: Lean4ExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `Proof` | no |  |
| `opts` | `Lean4ExportOptions` | yes |  |

### Returns

`string` — 


## `exportTheoryToLean4`

> Function · `tooling/exporters/lean4/index.ts:441`

Exports a small theory (axioms + theorems) as a single Lean 4 module.
Axioms become `axiom ax_i : <prop>` declarations; theorems become
`theorem th_i : <prop> := by sorry` skeletons that the user fills in.

```ts
export function exportTheoryToLean4( axioms: Formula[], theorems: Formula[], opts?: Lean4ExportOptions, ): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `axioms` | `Formula[]` | no |  |
| `theorems` | `Formula[]` | no |  |
| `opts` | `Lean4ExportOptions` | yes |  |

### Returns

`string` — 

