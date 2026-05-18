# `runtime/bdd/types.ts`

============================================================ ROBDD — Tipos de nodos ============================================================ Un ROBDD (Reduced Ordered Binary Decision Diagram) representa una función booleana como un DAG canónico bajo un orden fijo de variables. Cada nodo interno tiene:   - una variable `variable` (índice según el orden global)   - un sucesor `low` para la asignación variable = 0   - un sucesor `high` para la asignación variable = 1 Las hojas son terminales `true` o `false`. La canonicidad se obtiene compartiendo nodos vía unique table y aplicando las reglas de reducción:   (R1) eliminación: si low === high, no se crea nodo interno   (R2) isomorfismo: dos nodos con el mismo (var, low, high)        comparten identidad estructural

## Contents

- [`BDDNode`](#bddnode) — Type
- [`BDDStats`](#bddstats) — Interface
- [`isTerminal`](#isterminal) — Function
- [`nodeId`](#nodeid) — Function

## `BDDNode`

> Type · `runtime/bdd/types.ts:19`

```ts
export type BDDNode = | { kind: 'terminal'; value: boolean } | { kind: 'internal'; variable: number; low: BDDNode; high: BDDNode; id: number };
```


## `BDDStats`

> Interface · `runtime/bdd/types.ts:23`

```ts
export interface BDDStats
```


## `isTerminal`

> Function · `runtime/bdd/types.ts:28`

```ts
export function isTerminal(b: BDDNode): b is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `b` | `BDDNode` | no |  |

### Returns

`b is { kind: 'terminal'; value: boolean }` — 


## `nodeId`

> Function · `runtime/bdd/types.ts:32`

```ts
export function nodeId(b: BDDNode): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `b` | `BDDNode` | no |  |

### Returns

`string` — 

