# `type-theory/mltt/substitute.ts`

============================================================ MLTT — Sustitución capture-avoiding y α-renombrado ============================================================ La sustitución dependiente debe entrar también en `domain` / `first` / `second` / `codomain` / `type` porque los tipos son términos y pueden mencionar variables libres.

## `substitute`

> Function · `type-theory/mltt/substitute.ts:21`

Sustitución capture-avoiding: term[value/name].

```ts
export function substitute(term: MLTTTerm, name: string, value: MLTTTerm): MLTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |
| `name` | `string` | no |  |
| `value` | `MLTTTerm` | no |  |

### Returns

`MLTTTerm` — 

