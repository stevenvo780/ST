# `type-theory/mltt/equality.ts`

============================================================ MLTT — α-equivalencia y igualdad definicional (αβ-equality) ============================================================ Igualdad definicional ≡ normalizamos ambos lados (β + ι) y comparamos módulo α-renombrado de binders.

## Contents

- [`alphaEq`](#alphaeq) — Function
- [`alphaBetaEq`](#alphabetaeq) — Function

## `alphaEq`

> Function · `type-theory/mltt/equality.ts:13`

α-equivalencia estructural sobre términos (no normaliza).

```ts
export function alphaEq(a: MLTTTerm, b: MLTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `MLTTTerm` | no |  |
| `b` | `MLTTTerm` | no |  |

### Returns

`boolean` — 


## `alphaBetaEq`

> Function · `type-theory/mltt/equality.ts:78`

Igualdad αβ (definicional): normaliza ambos y luego compara α.
`ctx` reservado para implementaciones futuras (η, definitional unfolding).

```ts
export function alphaBetaEq(a: MLTTTerm, b: MLTTTerm, _ctx?: Map<string, MLTTTerm>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `MLTTTerm` | no |  |
| `b` | `MLTTTerm` | no |  |
| `_ctx` | `Map<string, MLTTTerm>` | yes |  |

### Returns

`boolean` — 

