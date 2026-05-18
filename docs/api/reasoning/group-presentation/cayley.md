# `reasoning/group-presentation/cayley.ts`

============================================================ Grafo de Cayley a partir de una tabla de cosets completa. ============================================================ Cuando la tabla representa el grupo entero (subgroupGens = []), los cosets son los elementos del grupo y τ(c, x) = c' significa "multiplicar el elemento c por el generador x da c'". Esto es, por construcción, el grafo de Cayley de G con respecto al conjunto generador S. Por convención usamos solo las aristas con generadores positivos (no sus inversos) — el grafo es naturalmente dirigido y las aristas inversas se recuperan de τ(c, x⁻¹). ============================================================

## Contents

- [`CayleyGraph`](#cayleygraph) — Interface
- [`cayleyGraph`](#cayleygraph) — Function

## `CayleyGraph`

> Interface · `reasoning/group-presentation/cayley.ts:19`

```ts
export interface CayleyGraph
```


## `cayleyGraph`

> Function · `reasoning/group-presentation/cayley.ts:24`

```ts
export function cayleyGraph(table: CosetTable): CayleyGraph
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `table` | `CosetTable` | no |  |

### Returns

`CayleyGraph` — 

