# `type-theory/lambda-cube/normalize.ts`

============================================================ Lambda Cube — Sustitución capture-avoiding + β-normalización ============================================================ Al ser un Pure Type System, tipos y términos comparten sintaxis. La β-reducción ocurre en cualquier sub-término, así que normalize también reduce dentro de Π y dentro del dominio de λ.

## Contents

- [`substitute`](#substitute) — Function
- [`reduceStep`](#reducestep) — Function
- [`normalize`](#normalize) — Function
- [`alphaBetaEq`](#alphabetaeq) — Function
- [`isNormal`](#isnormal) — Function

## `substitute`

> Function · `type-theory/lambda-cube/normalize.ts:21`

Sustitución capture-avoiding: term[value/name].

```ts
export function substitute(term: CubeTerm, name: string, value: CubeTerm): CubeTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `name` | `string` | no |  |
| `value` | `CubeTerm` | no |  |

### Returns

`CubeTerm` — 


## `reduceStep`

> Function · `type-theory/lambda-cube/normalize.ts:79`

Un paso de β-reducción top-down (call-by-name): si el término es
`(λ x:A. b) arg`, devuelve `b[arg/x]`. Si no hay redex top-level,
intenta reducir en sub-términos.

```ts
export function reduceStep(term: CubeTerm): CubeTerm | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |

### Returns

`CubeTerm \| undefined` — 


## `normalize`

> Function · `type-theory/lambda-cube/normalize.ts:114`

Normaliza por reducción a normal-form. `maxSteps` evita loops divergentes.

```ts
export function normalize(term: CubeTerm, _system: CubeSystem, maxSteps = 1000): CubeTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `_system` | `CubeSystem` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`CubeTerm` — 


## `alphaBetaEq`

> Function · `type-theory/lambda-cube/normalize.ts:125`

¿Dos términos son iguales módulo α y β?

```ts
export function alphaBetaEq(a: CubeTerm, b: CubeTerm, system: CubeSystem): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CubeTerm` | no |  |
| `b` | `CubeTerm` | no |  |
| `system` | `CubeSystem` | no |  |

### Returns

`boolean` — 


## `isNormal`

> Function · `type-theory/lambda-cube/normalize.ts:133`

¿El término está en forma normal (no quedan β-redex)?

```ts
export function isNormal(term: CubeTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |

### Returns

`boolean` — 

