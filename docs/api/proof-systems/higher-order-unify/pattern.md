# `proof-systems/higher-order-unify/pattern.ts`

============================================================ Higher-order unification — Verificación de patrón Miller ============================================================ Condición de patrón (Miller 1991):   Un término es un "pattern" si toda meta-variable M aparece aplicada   exclusivamente a variables ligadas *distintas* en el scope actual. Formalmente: M y₁ … yₙ es patrón si:   1. Cada yᵢ es una variable (kind 'var').   2. Todas las yᵢ son distintas entre sí.   3. Todas las yᵢ son *ligadas* (aparecen en el scope de un λ      que las introduce). isHigherOrderPattern es un alias semántico que hace explícito que el término es una HO pattern en el sentido de Miller.

## Contents

- [`isPattern`](#ispattern) — Function
- [`isHigherOrderPattern`](#ishigherorderpattern) — Function

## `isPattern`

> Function · `proof-systems/higher-order-unify/pattern.ts:22`

```ts
export function isPattern(term: HOTerm, scope: Set<string> = new Set()): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HOTerm` | no |  |
| `scope` | `Set<string>` | yes |  |

### Returns

`boolean` — 


## `isHigherOrderPattern`

> Function · `proof-systems/higher-order-unify/pattern.ts:62`

```ts
export function isHigherOrderPattern(t: HOTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |

### Returns

`boolean` — 

