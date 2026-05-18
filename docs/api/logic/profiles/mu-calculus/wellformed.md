# `logic/profiles/mu-calculus/wellformed.ts`

============================================================ μ-calculus — well-formedness y alternation depth ============================================================ Una fórmula μ-cálculo es bien formada cuando:   1. Es "cerrada": cada `var` ligada referencia un `μ`/`ν` que la      envuelve sintácticamente.   2. Es "positiva": cada variable ligada aparece bajo un número PAR      de negaciones desde su binder. Esto garantiza monotonía del      funcional asociado y la existencia de los puntos fijos por      Knaster-Tarski. Alternation depth: máxima profundidad de anidamiento alternante μ/ν con variables libres del binder externo. Aproximación estándar (Niwiński/Emerson-Lei): si el body de un μX contiene νY donde Y depende sintácticamente de X (o viceversa), la profundidad sube. Aquí usamos la versión sintáctica simple: cuento bindings μ/ν distintos en el camino raíz→hoja, contando saltos μ↔ν. ============================================================

## Contents

- [`isWellFormed`](#iswellformed) — Function
- [`freeVars`](#freevars) — Function
- [`isClosed`](#isclosed) — Function
- [`isPositive`](#ispositive) — Function
- [`alternationDepth`](#alternationdepth) — Function

## `isWellFormed`

> Function · `logic/profiles/mu-calculus/wellformed.ts:29`

Verifica que una fórmula sea sintácticamente bien formada:
 - Cerrada (sin variables libres).
 - Positiva en cada variable ligada (paridad par de negaciones).
 - Sin shadowing nocivo: rebindings ocultan al outer, lo cual es
   legal pero detectable. Aquí lo permitimos.

```ts
export function isWellFormed(phi: MuFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`boolean` — 


## `freeVars`

> Function · `logic/profiles/mu-calculus/wellformed.ts:34`

Variables libres del término.

```ts
export function freeVars(phi: MuFormula): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`Set<string>` — 


## `isClosed`

> Function · `logic/profiles/mu-calculus/wellformed.ts:70`

Una fórmula es cerrada cuando no tiene variables libres.

```ts
export function isClosed(phi: MuFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`boolean` — 


## `isPositive`

> Function · `logic/profiles/mu-calculus/wellformed.ts:83`

Una fórmula es positiva cuando toda `var X` ligada por un μ/ν
aparece bajo un número par de negaciones desde su binder.

Implementación: caminamos el AST con un map `binder → paridad`
(0 = par, 1 = impar) que se actualiza al cruzar un `not`. Cuando
vemos `var X`, miramos su binder más cercano y verificamos que
su paridad relativa sea par.

```ts
export function isPositive(phi: MuFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`boolean` — 


## `alternationDepth`

> Function · `logic/profiles/mu-calculus/wellformed.ts:135`

Profundidad de alternancia μ/ν. Métrica clásica:
  ad(p) = ad(X) = 0
  ad(¬φ) = ad(◇φ) = ad(□φ) = ad(φ)
  ad(φ ∧ ψ) = ad(φ ∨ ψ) = max(ad(φ), ad(ψ))
  ad(μX. φ) = max(1, ad(φ), 1 + maxNuAlt(φ))
  ad(νX. φ) = max(1, ad(φ), 1 + maxMuAlt(φ))
donde `maxNuAlt(φ)` es la profundidad considerando solo subfórmulas
con binder ν cuyo cuerpo menciona la variable ligada externamente,
y simétrico para μ.

Aquí usamos la versión simplificada y muy usada en práctica
(Cleaveland/Steffen): contar el cambio de tipo de binder en el
camino sintáctico raíz→hoja.

```ts
export function alternationDepth(phi: MuFormula): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`number` — 

