# `runtime/theorem-cache/cache.ts`

## Contents

- [`CachedTheorem`](#cachedtheorem) — Interface
- [`CacheOptions`](#cacheoptions) — Interface
- [`CacheStats`](#cachestats) — Interface
- [`ReuseResult`](#reuseresult) — Interface
- [`TheoremCache`](#theoremcache) — Class
- [`tryReuseProof`](#tryreuseproof) — Function

## `CachedTheorem`

> Interface · `runtime/theorem-cache/cache.ts:8`

```ts
export interface CachedTheorem
```


## `CacheOptions`

> Interface · `runtime/theorem-cache/cache.ts:26`

```ts
export interface CacheOptions
```


## `CacheStats`

> Interface · `runtime/theorem-cache/cache.ts:38`

```ts
export interface CacheStats
```


## `ReuseResult`

> Interface · `runtime/theorem-cache/cache.ts:45`

```ts
export interface ReuseResult
```


## `TheoremCache`

> Class · `runtime/theorem-cache/cache.ts:63`

```ts
export class TheoremCache
```


## `tryReuseProof`

> Function · `runtime/theorem-cache/cache.ts:249`

Intenta reusar la prueba de un teorema cacheado para un target
dado. Si las fórmulas son canónicamente equivalentes (misma
estructura, identificadores en el mismo orden), calcula la
substitución y reemplaza los nombres en la prueba (cuando la
prueba es un string o un objeto JSON que la admita textualmente).

Para pruebas opacas no-string, devuelve la prueba original sin
tocar — el caller es responsable de re-instanciar.

```ts
export function tryReuseProof(theorem: CachedTheorem, targetFormula: string): ReuseResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theorem` | `CachedTheorem` | no |  |
| `targetFormula` | `string` | no |  |

### Returns

`ReuseResult` — 

