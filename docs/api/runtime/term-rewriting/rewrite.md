# `runtime/term-rewriting/rewrite.ts`

============================================================ ST Term Rewriting — Reescritura y normalización ============================================================ Aplicación de reglas l → r sobre un término t. Estrategia: leftmost-outermost. Se recorre t en pre-order; para cada subtérmino se intenta match contra el LHS de alguna regla. El primer match gana. Esto es suficiente para sistemas confluentes (todas las estrategias llegan a la misma FN), y para los terminantes garantiza progreso. `normalize` itera `rewriteStep` hasta punto fijo o hasta `maxSteps` (default 10_000) — la cota evita ciclos cuando el sistema no es terminante.

## Contents

- [`rewriteStep`](#rewritestep) — Function
- [`normalize`](#normalize) — Function
- [`allPositions`](#allpositions) — Function
- [`subtermAt`](#subtermat) — Function
- [`replaceAt`](#replaceat) — Function

## `rewriteStep`

> Function · `runtime/term-rewriting/rewrite.ts:41`

Intenta aplicar exactamente un paso de reescritura.

Devuelve el término reducido o null si no hay redex.

Política de selección:
  - Recorre t en pre-order (raíz primero, luego argumentos).
  - Para cada nodo prueba las reglas en orden.
  - El primer match aplica.

```ts
export function rewriteStep(t: Term, rules: RewriteRule[]): Term | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `rules` | `RewriteRule[]` | no |  |

### Returns

`Term \| null` — 


## `normalize`

> Function · `runtime/term-rewriting/rewrite.ts:95`

Normaliza t aplicando reglas hasta punto fijo.

```ts
export function normalize(t: Term, rules: RewriteRule[], maxSteps: number = 10000): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `rules` | `RewriteRule[]` | no |  |
| `maxSteps` | `number` | yes | Cota de seguridad para sistemas no terminantes.                  Si se excede, devuelve el último estado alcanzado. Nota: la confluencia se asume responsabilidad del caller — si el TRS no es confluente, distintas estrategias pueden dar distintas FN. Acá fijamos leftmost-outermost. |

### Returns

`Term` — 


## `allPositions`

> Function · `runtime/term-rewriting/rewrite.ts:116`

Lista todas las posiciones (caminos) en t. Una posición es un
array de índices: [] = raíz, [0] = primer argumento, [0, 1] =
segundo argumento del primer argumento, etc.

Útil para enumerar redexes y para calcular critical pairs.

```ts
export function allPositions(t: Term, prefix: number[] = []): number[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `prefix` | `number[]` | yes |  |

### Returns

`number[][]` — 


## `subtermAt`

> Function · `runtime/term-rewriting/rewrite.ts:139`

Obtiene el subtérmino en la posición indicada.
Devuelve null si la posición no existe.

```ts
export function subtermAt(t: Term, pos: readonly number[]): Term | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `pos` | `readonly number[]` | no |  |

### Returns

`Term \| null` — 


## `replaceAt`

> Function · `runtime/term-rewriting/rewrite.ts:156`

Reemplaza el subtérmino en la posición indicada por `replacement`.

Devuelve un término nuevo (sin mutar t). Si la posición no existe,
devuelve t sin cambios.

```ts
export function replaceAt(t: Term, pos: readonly number[], replacement: Term): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `pos` | `readonly number[]` | no |  |
| `replacement` | `Term` | no |  |

### Returns

`Term` — 

