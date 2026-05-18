# `type-theory/combinators-ski/abstract.ts`

============================================================ Bracket abstraction: λ-cálculo → SKI ============================================================ Algoritmo clásico de Curry para eliminar λ-abstracciones, traducido como `lambda x . T  ≡  [x] T` con las reglas:   [x] x         = I   [x] M         = K M             si x ∉ FV(M)   [x] (M N)     = S ([x] M) ([x] N) Es el llamado "algoritmo (abc)" — simple, no optimizado: produce términos grandes pero correctos. Hay variantes que aprovechan patrones como `[x] (M x) = M` (η) o introducen B, C, W, T, K' para reducir tamaño; aquí elegimos la canónica por claridad pedagógica. `toLambda` hace el camino inverso: codifica S, K, I como las λ-abstracciones que los definen. No pretende invertir `abstractFromLambda` exactamente — el round-trip es semántico (alpha/beta-eta equivalente), no sintáctico.

## Contents

- [`abstractFromLambda`](#abstractfromlambda) — Function
- [`toLambda`](#tolambda) — Function

## `abstractFromLambda`

> Function · `type-theory/combinators-ski/abstract.ts:28`

```ts
export function abstractFromLambda(t: LambdaTerm): CTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `LambdaTerm` | no |  |

### Returns

`CTerm` — 


## `toLambda`

> Function · `type-theory/combinators-ski/abstract.ts:71`

```ts
export function toLambda(c: CTerm): LambdaTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `CTerm` | no |  |

### Returns

`LambdaTerm` — 

