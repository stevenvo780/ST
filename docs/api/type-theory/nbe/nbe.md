# `type-theory/nbe/nbe.ts`

============================================================ NbE — Normalization by Evaluation para STLC ============================================================ Idea:   - evaluate :: Term × Env → Value       interpreta el término en el dominio semántico, donde las       variables libres y aplicaciones atascadas viven como       "neutrales" y las λ se vuelven clausuras nativas de TS.   - reify :: Value × Type → Term       baja un valor a un término en β-normal forma η-larga,       guiándose por el tipo. La η-expansión emerge de "aplicar"       el valor a una variable fresca cuando el tipo es flecha.   - normalize = reify ∘ evaluate Resultado: forma normal única (β-corta η-larga) por término bien tipado, sin enumerar reducciones explícitas.

## Contents

- [`makeFreshSupply`](#makefreshsupply) — Function
- [`apply`](#apply) — Function
- [`evaluate`](#evaluate) — Function
- [`reify`](#reify) — Function
- [`normalize`](#normalize) — Function

## `makeFreshSupply`

> Function · `type-theory/nbe/nbe.ts:33`

```ts
export function makeFreshSupply(prefix = '_x'): () => string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `prefix` | `any` | yes |  |

### Returns

`() => string` — 


## `apply`

> Function · `type-theory/nbe/nbe.ts:42`

```ts
export function apply(fn: Value, arg: Value): Value
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `Value` | no |  |
| `arg` | `Value` | no |  |

### Returns

`Value` — 


## `evaluate`

> Function · `type-theory/nbe/nbe.ts:54`

```ts
export function evaluate(t: Term, env: Env): Value
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `env` | `Env` | no |  |

### Returns

`Value` — 


## `reify`

> Function · `type-theory/nbe/nbe.ts:76`

```ts
export function reify(value: Value, type: Type, freshSupply: () => string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `Value` | no |  |
| `type` | `Type` | no |  |
| `freshSupply` | `() => string` | no |  |

### Returns

`Term` — 


## `normalize`

> Function · `type-theory/nbe/nbe.ts:122`

```ts
export function normalize(t: Term, type: Type, freshSupply?: () => string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `type` | `Type` | no |  |
| `freshSupply` | `() => string` | yes |  |

### Returns

`Term` — 

