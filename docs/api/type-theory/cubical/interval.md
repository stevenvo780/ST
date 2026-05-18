# `type-theory/cubical/interval.ts`

============================================================ Cubical — Álgebra del intervalo I ============================================================ El intervalo formal I tiene dos extremos (i0, i1) y forma un retículo distributivo con involución 1 - (·):   0 ∧ i ≡ 0       1 ∧ i ≡ i        i ∧ j ≡ j ∧ i   0 ∨ i ≡ i       1 ∨ i ≡ 1        i ∨ j ≡ j ∨ i   1 - 0 ≡ 1       1 - 1 ≡ 0        1 - (1 - i) ≡ i `evalInterval` interpreta una expresión bajo un environment de asignaciones concretas {i ↦ 0 ó 1}. Cuando una variable libre del intervalo no está en el environment, devolvemos 'gen' (genérico).

## Contents

- [`IntervalValue`](#intervalvalue) — Type
- [`evalInterval`](#evalinterval) — Function
- [`normalizeInterval`](#normalizeinterval) — Function

## `IntervalValue`

> Type · `type-theory/cubical/interval.ts:18`

```ts
export type IntervalValue = 0 | 1 | 'gen';
```


## `evalInterval`

> Function · `type-theory/cubical/interval.ts:20`

```ts
export function evalInterval(t: CubicalTerm, env: Map<string, 0 | 1> = new Map()): IntervalValue
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubicalTerm` | no |  |
| `env` | `Map<string, 0 \| 1>` | yes |  |

### Returns

`IntervalValue` — 


## `normalizeInterval`

> Function · `type-theory/cubical/interval.ts:69`

Normaliza algebraicamente una expresión de intervalo aplicando las
leyes del retículo + involución. Si la expresión colapsa a un
extremo, retorna i0 o i1; en caso contrario reescribe lo posible.
No hace simplificaciones avanzadas (idempotencia, distributividad)
para mantener el módulo predecible.

```ts
export function normalizeInterval(t: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 

