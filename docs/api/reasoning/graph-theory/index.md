# `reasoning/graph-theory/index.ts`

Arista de grafo con peso opcional (default 1 en algoritmos).

## Contents

- [`Edge`](#edge) — Interface
- [`WeightedEdge`](#weightededge) — Interface
- [`Graph`](#graph) — Interface
- [`makeGraph`](#makegraph) — Function
- [`addVertex`](#addvertex) — Function
- [`addEdge`](#addedge) — Function
- [`neighbors`](#neighbors) — Function
- [`inDegree`](#indegree) — Function
- [`outDegree`](#outdegree) — Function
- [`bfs`](#bfs) — Function
- [`dfs`](#dfs) — Function
- [`topologicalSort`](#topologicalsort) — Function
- [`connectedComponents`](#connectedcomponents) — Function
- [`isConnected`](#isconnected) — Function
- [`stronglyConnectedComponents`](#stronglyconnectedcomponents) — Function
- [`articulationPoints`](#articulationpoints) — Function
- [`bridges`](#bridges) — Function
- [`dijkstra`](#dijkstra) — Function
- [`bellmanFord`](#bellmanford) — Function
- [`floydWarshall`](#floydwarshall) — Function
- [`kruskal`](#kruskal) — Function
- [`prim`](#prim) — Function
- [`bipartiteMaximumMatching`](#bipartitemaximummatching) — Function
- [`hopcroftKarp`](#hopcroftkarp) — Function
- [`greedyColoring`](#greedycoloring) — Function
- [`chromaticNumber`](#chromaticnumber) — Function
- [`areIsomorphic`](#areisomorphic) — Function
- [`findIsomorphism`](#findisomorphism) — Function

## `Edge`

> Interface · `reasoning/graph-theory/index.ts:39`

Arista de grafo con peso opcional (default 1 en algoritmos).

```ts
export interface Edge<V>
```


## `WeightedEdge`

> Interface · `reasoning/graph-theory/index.ts:46`

Arista con peso obligatorio, usada en resultados de algoritmos como MST y caminos mínimos.

```ts
export interface WeightedEdge<V>
```


## `Graph`

> Interface · `reasoning/graph-theory/index.ts:53`

Grafo finito genérico sobre vértices de tipo `V`. Puede ser dirigido o no dirigido.

```ts
export interface Graph<V>
```


## `makeGraph`

> Function · `reasoning/graph-theory/index.ts:64`

Crea un grafo vacío (dirigido o no según el flag).

```ts
export function makeGraph<V>(directed = false): Graph<V>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `directed` | `any` | yes |  |

### Returns

`Graph<V>` — 


## `addVertex`

> Function · `reasoning/graph-theory/index.ts:72`

```ts
export function addVertex<V>(G: Graph<V>, v: V): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `v` | `V` | no |  |

### Returns

`void` — 


## `addEdge`

> Function · `reasoning/graph-theory/index.ts:76`

```ts
export function addEdge<V>(G: Graph<V>, e: Edge<V>): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `e` | `Edge<V>` | no |  |

### Returns

`void` — 


## `neighbors`

> Function · `reasoning/graph-theory/index.ts:83`

```ts
export function neighbors<V>(G: Graph<V>, v: V): V[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `v` | `V` | no |  |

### Returns

`V[]` — 


## `inDegree`

> Function · `reasoning/graph-theory/index.ts:92`

```ts
export function inDegree<V>(G: Graph<V>, v: V): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `v` | `V` | no |  |

### Returns

`number` — 


## `outDegree`

> Function · `reasoning/graph-theory/index.ts:99`

```ts
export function outDegree<V>(G: Graph<V>, v: V): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `v` | `V` | no |  |

### Returns

`number` — 


## `bfs`

> Function · `reasoning/graph-theory/index.ts:143`

```ts
export function bfs<V>(G: Graph<V>, start: V, visit?: (v: V) => void): V[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `start` | `V` | no |  |
| `visit` | `(v: V) => void` | yes |  |

### Returns

`V[]` — 


## `dfs`

> Function · `reasoning/graph-theory/index.ts:165`

```ts
export function dfs<V>(G: Graph<V>, start: V, visit?: (v: V) => void): V[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `start` | `V` | no |  |
| `visit` | `(v: V) => void` | yes |  |

### Returns

`V[]` — 


## `topologicalSort`

> Function · `reasoning/graph-theory/index.ts:188`

```ts
export function topologicalSort<V>(G: Graph<V>): V[] | 'has-cycle'
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`V[] \| 'has-cycle'` — 


## `connectedComponents`

> Function · `reasoning/graph-theory/index.ts:221`

```ts
export function connectedComponents<V>(G: Graph<V>): V[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`V[][]` — 


## `isConnected`

> Function · `reasoning/graph-theory/index.ts:248`

```ts
export function isConnected<V>(G: Graph<V>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`boolean` — 


## `stronglyConnectedComponents`

> Function · `reasoning/graph-theory/index.ts:255`

```ts
export function stronglyConnectedComponents<V>(G: Graph<V>): V[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`V[][]` — 


## `articulationPoints`

> Function · `reasoning/graph-theory/index.ts:325`

```ts
export function articulationPoints<V>(G: Graph<V>): V[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`V[]` — 


## `bridges`

> Function · `reasoning/graph-theory/index.ts:384`

```ts
export function bridges<V>(G: Graph<V>): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`Array<{ from: V; to: V }>` — 


## `dijkstra`

> Function · `reasoning/graph-theory/index.ts:493`

```ts
export function dijkstra<V>( G: Graph<V>, start: V, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `start` | `V` | no |  |

### Returns

`{ distances: Map<V, number>; predecessors: Map<V, V> }` — 


## `bellmanFord`

> Function · `reasoning/graph-theory/index.ts:529`

```ts
export function bellmanFord<V>( G: Graph<V>, start: V, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `start` | `V` | no |  |

### Returns

`{ distances: Map<V, number>; predecessors: Map<V, V>; negativeCycle: boolean }` — 


## `floydWarshall`

> Function · `reasoning/graph-theory/index.ts:575`

```ts
export function floydWarshall<V>(G: Graph<V>): Map<V, Map<V, number>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`Map<V, Map<V, number>>` — 


## `kruskal`

> Function · `reasoning/graph-theory/index.ts:662`

```ts
export function kruskal<V>(G: Graph<V>):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`{ edges: Array<WeightedEdge<V>>; totalWeight: number }` — 


## `prim`

> Function · `reasoning/graph-theory/index.ts:682`

```ts
export function prim<V>( G: Graph<V>, start?: V, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `start` | `V` | yes |  |

### Returns

`{ edges: Array<WeightedEdge<V>>; totalWeight: number }` — 


## `bipartiteMaximumMatching`

> Function · `reasoning/graph-theory/index.ts:721`

```ts
export function bipartiteMaximumMatching<V>( G: Graph<V>, leftPartition: Set<V>, ): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `leftPartition` | `Set<V>` | no |  |

### Returns

`Array<{ left: V; right: V }>` — 


## `hopcroftKarp`

> Function · `reasoning/graph-theory/index.ts:751`

```ts
export function hopcroftKarp<V>(G: Graph<V>, leftPartition: Set<V>): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |
| `leftPartition` | `Set<V>` | no |  |

### Returns

`Array<{ left: V; right: V }>` — 


## `greedyColoring`

> Function · `reasoning/graph-theory/index.ts:836`

```ts
export function greedyColoring<V>(G: Graph<V>): Map<V, number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`Map<V, number>` — 


## `chromaticNumber`

> Function · `reasoning/graph-theory/index.ts:855`

```ts
export function chromaticNumber<V>(G: Graph<V>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Graph<V>` | no |  |

### Returns

`number` — 


## `areIsomorphic`

> Function · `reasoning/graph-theory/index.ts:919`

```ts
export function areIsomorphic<V1, V2>(g1: Graph<V1>, g2: Graph<V2>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g1` | `Graph<V1>` | no |  |
| `g2` | `Graph<V2>` | no |  |

### Returns

`boolean` — 


## `findIsomorphism`

> Function · `reasoning/graph-theory/index.ts:923`

```ts
export function findIsomorphism<V1, V2>(g1: Graph<V1>, g2: Graph<V2>): Map<V1, V2> | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g1` | `Graph<V1>` | no |  |
| `g2` | `Graph<V2>` | no |  |

### Returns

`Map<V1, V2> \| null` — 

