# `runtime/format.ts`

============================================================ ST Runtime — Formateo Unicode y LaTeX de fórmulas ============================================================ Centraliza la conversión de Formula AST a notación Unicode (¬, ∧, ∨, →, ↔, □, ◇, ∀, ∃) y LaTeX (\neg, \land, etc.) ============================================================

## Contents

- [`formulaToUnicode`](#formulatounicode) — Function
- [`formulaToLaTeX`](#formulatolatex) — Function
- [`proofToLaTeX`](#prooftolatex) — Function

## `formulaToUnicode`

> Function · `runtime/format.ts:26`

Convierte una fórmula AST a notación Unicode legible (estilo libro de texto).

```ts
export function formulaToUnicode(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `formulaToLaTeX`

> Function · `runtime/format.ts:138`

Convierte una fórmula AST a notación LaTeX.

```ts
export function formulaToLaTeX(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `proofToLaTeX`

> Function · `runtime/format.ts:235`

Convierte una prueba paso a paso a formato LaTeX usando `bussproofs`.
Asume entorno `prooftree`.

```ts
export function proofToLaTeX(proof: import('../types').Proof): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `import('../types').Proof` | no |  |

### Returns

`string` — 

