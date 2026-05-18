# `solver/cdcl-v2/luby.ts`

Calcula el i-ésimo término (1-indexado) de la secuencia de Luby.
Para mantener la indexación pública 0-indexada, internamente trabajamos
con t = i + 1, aplicando la recurrencia clásica de Knuth (1991):
  luby(t) = 2^(k-1)             si t = 2^k - 1
  luby(t) = luby(t - 2^(k-1) + 1) si 2^(k-1) ≤ t < 2^k - 1

## Contents

- [`luby`](#luby) — Function
- [`lubySequence`](#lubysequence) — Function
- [`LubyRestartPolicy`](#lubyrestartpolicy) — Class

## `luby`

> Function · `solver/cdcl-v2/luby.ts:12`

Calcula el i-ésimo término (1-indexado) de la secuencia de Luby.
Para mantener la indexación pública 0-indexada, internamente trabajamos
con t = i + 1, aplicando la recurrencia clásica de Knuth (1991):
  luby(t) = 2^(k-1)             si t = 2^k - 1
  luby(t) = luby(t - 2^(k-1) + 1) si 2^(k-1) ≤ t < 2^k - 1

```ts
export function luby(i: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `i` | `number` | no |  |

### Returns

`number` — 


## `lubySequence`

> Function · `solver/cdcl-v2/luby.ts:32`

Genera los primeros `n` términos de la secuencia de Luby.
Útil para tests y previsualización.

```ts
export function lubySequence(n: number): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`number[]` — 


## `LubyRestartPolicy`

> Class · `solver/cdcl-v2/luby.ts:42`

Política de restart Luby con multiplicador `base`.
Cada paso devuelve cuántos conflictos esperar antes del próximo restart.

```ts
export class LubyRestartPolicy
```

