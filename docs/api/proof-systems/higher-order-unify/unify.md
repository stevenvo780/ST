# `proof-systems/higher-order-unify/unify.ts`

============================================================ Higher-order unification — Algoritmo de unificación Miller ============================================================ Implementa el fragmento de patrón de la unificación de orden superior. Referencia: Dale Miller, "A Logic Programming Language with Lambda Abstraction, Function Variables, and Simple Unification", 1991. Garantías del fragmento de patrón:   - Decidible (siempre termina).   - Unicidad: si existe unificador, existe un único MGU (most general     unifier) módulo α-equivalencia. Manejo de terms no-patrón:   Los pares que involucran meta-variables aplicadas a no-variables o   variables repetidas/libres se rechazan (retornan null) para mantener   la decidibilidad. Ver `isPattern` en pattern.ts.

## Contents

- [`unifyPattern`](#unifypattern) — Function
- [`buildLambdaBinding`](#buildlambdabinding) — Function
- [`unifyMetaApp`](#unifymetaapp) — Function

## `unifyPattern`

> Function · `proof-systems/higher-order-unify/unify.ts:25`

```ts
export function unifyPattern(t1: HOTerm, t2: HOTerm): HOSubst | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `HOTerm` | no |  |
| `t2` | `HOTerm` | no |  |

### Returns

`HOSubst \| null` — 


## `buildLambdaBinding`

> Function · `proof-systems/higher-order-unify/unify.ts:306`

```ts
export function buildLambdaBinding( params: string[], body: HOTerm, avoidNames: Set<string>, ): HOTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `params` | `string[]` | no |  |
| `body` | `HOTerm` | no |  |
| `avoidNames` | `Set<string>` | no |  |

### Returns

`HOTerm` — 


## `unifyMetaApp`

> Function · `proof-systems/higher-order-unify/unify.ts:326`

```ts
export function unifyMetaApp(metaName: string, boundVars: string[], body: HOTerm): HOSubst | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `metaName` | `string` | no |  |
| `boundVars` | `string[]` | no |  |
| `body` | `HOTerm` | no |  |

### Returns

`HOSubst \| null` — 

