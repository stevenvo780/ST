# `type-theory/curry-howard/reduce.ts`

============================================================ Curry-Howard — β-reducción (estrategia call-by-name / leftmost-outermost) ============================================================ Reglas implementadas:   (λx:T. M) N           ↦ M[N/x]   fst ⟨a, b⟩            ↦ a   snd ⟨a, b⟩            ↦ b   case (inl v) of L|R   ↦ L[v/leftBind]   case (inr v) of L|R   ↦ R[v/rightBind] `reduceBeta` aplica UN paso. `normalize` itera hasta forma normal (con guardia anti-loop para casos patológicos como `(λx. xx)(λx. xx)`).

## Contents

- [`freeVars`](#freevars) — Function
- [`substituteTerm`](#substituteterm) — Function
- [`reduceBeta`](#reducebeta) — Function
- [`isNormal`](#isnormal) — Function
- [`normalize`](#normalize) — Function

## `freeVars`

> Function · `type-theory/curry-howard/reduce.ts:17`

```ts
export function freeVars(t: LambdaTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `LambdaTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `substituteTerm`

> Function · `type-theory/curry-howard/reduce.ts:156`

```ts
export function substituteTerm(term: LambdaTerm, name: string, value: LambdaTerm): LambdaTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |
| `name` | `string` | no |  |
| `value` | `LambdaTerm` | no |  |

### Returns

`LambdaTerm` — 


## `reduceBeta`

> Function · `type-theory/curry-howard/reduce.ts:162`

```ts
export function reduceBeta(term: LambdaTerm): LambdaTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |

### Returns

`LambdaTerm` — 


## `isNormal`

> Function · `type-theory/curry-howard/reduce.ts:236`

```ts
export function isNormal(term: LambdaTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |

### Returns

`boolean` — 


## `normalize`

> Function · `type-theory/curry-howard/reduce.ts:240`

```ts
export function normalize(term: LambdaTerm, maxSteps = 1000): LambdaTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`LambdaTerm` — 

