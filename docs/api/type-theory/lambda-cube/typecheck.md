# `type-theory/lambda-cube/typecheck.ts`

============================================================ Lambda Cube — Pure Type System type-checker ============================================================ Algoritmo bidireccional uniforme para los 8 vértices del cubo. El sistema activo se pasa como parámetro y restringe qué Π / λ son legales mediante sus reglas de formación. Reglas PTS (versión cubo de Barendregt):   AX:       ⊢ * : ◻   VAR:      Γ, x:A ⊢ x : A                  (si A está bien formado)   APP:      Γ ⊢ f : (Π x:A. B)             Γ ⊢ a : A             ───────────────────             Γ ⊢ f a : B[a/x]   LAM:      Γ, x:A ⊢ b : B             Γ ⊢ (Π x:A. B) : s                (well-formed)             ───────────────────────────             Γ ⊢ (λ x:A. b) : (Π x:A. B)   PI:       Γ ⊢ A : s1             Γ, x:A ⊢ B : s2             (s1, s2) ∈ R(system)             ───────────────────────             Γ ⊢ (Π x:A. B) : s2   CONV:     Γ ⊢ t : A,  A =βη B,  Γ ⊢ B : s             ──────────────────────────────────             Γ ⊢ t : B Sin η, sin universos jerárquicos.

## Contents

- [`InferError`](#infererror) — Type
- [`InferResult`](#inferresult) — Type
- [`isInferError`](#isinfererror) — Function
- [`inferType`](#infertype) — Function
- [`checkType`](#checktype) — Function
- [`isClosedUnder`](#isclosedunder) — Function

## `InferError`

> Type · `type-theory/lambda-cube/typecheck.ts:48`

```ts
export type InferError = { error: string };
```


## `InferResult`

> Type · `type-theory/lambda-cube/typecheck.ts:49`

```ts
export type InferResult = CubeTerm | InferError;
```


## `isInferError`

> Function · `type-theory/lambda-cube/typecheck.ts:51`

```ts
export function isInferError(r: InferResult): r is InferError
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferResult` | no |  |

### Returns

`r is InferError` — 


## `inferType`

> Function · `type-theory/lambda-cube/typecheck.ts:68`

Infiere el tipo de `term` bajo `ctx` en el sistema dado. Devuelve
el tipo, o `{ error }` si no es tipable.

```ts
export function inferType( term: CubeTerm, ctx: CubeContext = new Map(), system: CubeSystem = 'lambda-C', ): InferResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `ctx` | `CubeContext` | yes |  |
| `system` | `CubeSystem` | yes |  |

### Returns

`InferResult` — 


## `checkType`

> Function · `type-theory/lambda-cube/typecheck.ts:162`

Verifica que `term` tiene tipo `expected` bajo `ctx` en `system`.
Igualdad de tipos: módulo α y β.

```ts
export function checkType( term: CubeTerm, expected: CubeTerm, ctx: CubeContext = new Map(), system: CubeSystem = 'lambda-C', ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `expected` | `CubeTerm` | no |  |
| `ctx` | `CubeContext` | yes |  |
| `system` | `CubeSystem` | yes |  |

### Returns

`boolean` — 


## `isClosedUnder`

> Function · `type-theory/lambda-cube/typecheck.ts:174`

¿Las variables libres del término tienen todas un binding en `ctx`?

```ts
export function isClosedUnder(term: CubeTerm, ctx: CubeContext): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `ctx` | `CubeContext` | no |  |

### Returns

`boolean` — 

