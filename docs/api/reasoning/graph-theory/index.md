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

> Function · `reasoning/graph-theory/index.ts:73`

Añade el vértice `v` al grafo `G` (sin aristas).

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

> Function · `reasoning/graph-theory/index.ts:78`

Añade la arista `e` al grafo `G`, incluyendo sus extremos como vértices si es necesario.

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

> Function · `reasoning/graph-theory/index.ts:85`

Devuelve los vecinos salientes de `v` (en no dirigido, ambos extremos cuentan).

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

> Function · `reasoning/graph-theory/index.ts:95`

Grado de entrada de `v` (en grafo no dirigido, igual al grado total).

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

> Function · `reasoning/graph-theory/index.ts:103`

Grado de salida de `v` (en grafo no dirigido, igual al grado total).

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

> Function · `reasoning/graph-theory/index.ts:148`

BFS desde `start`; devuelve los vértices en orden de visita. Llama `visit` por cada uno si se proporciona.

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

> Function · `reasoning/graph-theory/index.ts:171`

DFS desde `start`; devuelve los vértices en orden de visita. Llama `visit` por cada uno si se proporciona.

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

> Function · `reasoning/graph-theory/index.ts:194`

Orden topológico vía Kahn. Devuelve `'has-cycle'` si el grafo no es un DAG.

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

> Function · `reasoning/graph-theory/index.ts:228`

Componentes conexos (débiles en dirigido) del grafo. Cada componente es una lista de vértices.

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

> Function · `reasoning/graph-theory/index.ts:256`

Devuelve `true` si el grafo tiene un solo componente conexo.

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

> Function · `reasoning/graph-theory/index.ts:262`

Componentes fuertemente conexos (Tarjan, iterativo). En no dirigido cada SCC = componente conexo.

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

> Function · `reasoning/graph-theory/index.ts:332`

Puntos de articulación (corte) del grafo no dirigido, detectados vía DFS lowlink.

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

> Function · `reasoning/graph-theory/index.ts:391`

Puentes del grafo no dirigido (DFS lowlink): aristas cuya eliminación desconecta el grafo.

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

> Function · `reasoning/graph-theory/index.ts:504`

Dijkstra: caminos mínimos desde `start` (pesos no negativos).

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

> Function · `reasoning/graph-theory/index.ts:541`

Bellman-Ford: caminos mínimos desde `start` con detección de ciclos negativos.

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

> Function · `reasoning/graph-theory/index.ts:588`

Floyd-Warshall: distancias mínimas entre todos los pares de vértices O(n³).

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

> Function · `reasoning/graph-theory/index.ts:676`

Kruskal: árbol generador mínimo en grafo no dirigido (DSU + ordenación por peso).

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

> Function · `reasoning/graph-theory/index.ts:697`

Prim: árbol generador mínimo en grafo no dirigido (cola de prioridad).

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

> Function · `reasoning/graph-theory/index.ts:736`

Emparejamiento bipartito máximo vía DFS-aumento (algoritmo de Kuhn).

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

> Function · `reasoning/graph-theory/index.ts:766`

Hopcroft-Karp: emparejamiento bipartito máximo con BFS por niveles + DFS de aumento (O(E√V)).

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

> Function · `reasoning/graph-theory/index.ts:851`

Coloreo greedy: ordena por grado descendente y asigna el primer color disponible.

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

> Function · `reasoning/graph-theory/index.ts:870`

Número cromático χ(G) por backtracking con poda (intenta k = 1, 2, …). Solo apto para grafos pequeños.

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

> Function · `reasoning/graph-theory/index.ts:935`

Devuelve `true` si los grafos `g1` y `g2` son isomorfos (estructuralmente equivalentes).

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

> Function · `reasoning/graph-theory/index.ts:940`

Busca un isomorfismo entre `g1` y `g2`; devuelve el mapeo de vértices o `null` si no existe.

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

