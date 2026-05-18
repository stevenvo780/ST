# `logic/profiles/description-logic/nnf.ts`

============================================================ ST Description Logic — Negation Normal Form & hashing ============================================================ Empuja ¬ hasta los átomos. Tras NNF:   - kind 'not' SOLO envuelve 'atomic'.   - 'top' / 'bottom' nunca aparecen bajo 'not' (se simplifican). ============================================================

## Contents

- [`toNNF`](#tonnf) — Function
- [`conceptHash`](#concepthash) — Function
- [`conceptEqual`](#conceptequal) — Function
- [`conceptToString`](#concepttostring) — Function

## `toNNF`

> Function · `logic/profiles/description-logic/nnf.ts:11`

```ts
export function toNNF(c: DLConcept): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `DLConcept` | no |  |

### Returns

`DLConcept` — 


## `conceptHash`

> Function · `logic/profiles/description-logic/nnf.ts:66`

Hash canónico de un concepto. Dos conceptos sintácticamente iguales
(módulo orden de hijos en and/or) producen el mismo hash.

```ts
export function conceptHash(c: DLConcept): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `DLConcept` | no |  |

### Returns

`string` — 


## `conceptEqual`

> Function · `logic/profiles/description-logic/nnf.ts:91`

```ts
export function conceptEqual(a: DLConcept, b: DLConcept): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `DLConcept` | no |  |
| `b` | `DLConcept` | no |  |

### Returns

`boolean` — 


## `conceptToString`

> Function · `logic/profiles/description-logic/nnf.ts:98`

Render legible para tracing / mensajes.

```ts
export function conceptToString(c: DLConcept): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `DLConcept` | no |  |

### Returns

`string` — 

