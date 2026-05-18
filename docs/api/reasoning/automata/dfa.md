# `reasoning/automata/dfa.ts`

============================================================ ST Automata — DFA ============================================================ Operaciones sobre DFAs:   · dfaAccepts        — simulación de aceptación.   · dfaMinimize       — partición de equivalencia (Hopcroft).   · dfaComplement     — invierte aceptación tras totalizar.   · dfaProduct        — producto cartesiano con predicado de                         aceptación (base de union/intersection).   · dfaUnion          — L(a) ∪ L(b).   · dfaIntersection   — L(a) ∩ L(b). ============================================================

## Contents

- [`dfaAccepts`](#dfaaccepts) — Function
- [`dfaTotalize`](#dfatotalize) — Function
- [`dfaComplement`](#dfacomplement) — Function
- [`dfaProduct`](#dfaproduct) — Function
- [`dfaUnion`](#dfaunion) — Function
- [`dfaIntersection`](#dfaintersection) — Function
- [`dfaMinimize`](#dfaminimize) — Function

## `dfaAccepts`

> Function · `reasoning/automata/dfa.ts:19`

¿`M` acepta `input`? Si en algún punto no hay transición definida,
 rechaza inmediatamente (DFA visto como función parcial).

```ts
export function dfaAccepts(M: DFA, input: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `DFA` | no |  |
| `input` | `string` | no |  |

### Returns

`boolean` — 


## `dfaTotalize`

> Function · `reasoning/automata/dfa.ts:33`

Totaliza un DFA agregando un sink-state para las aristas faltantes.
 Devuelve un DFA equivalente con `transitions` totales sobre alfabeto.

```ts
export function dfaTotalize(M: DFA, sinkName = '__sink__'): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `DFA` | no |  |
| `sinkName` | `any` | yes |  |

### Returns

`DFA` — 


## `dfaComplement`

> Function · `reasoning/automata/dfa.ts:74`

Complemento de `M`: misma estructura, accept = states \ accept.

```ts
export function dfaComplement(M: DFA): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `DFA` | no |  |

### Returns

`DFA` — 


## `dfaProduct`

> Function · `reasoning/automata/dfa.ts:90`

Producto cartesiano con predicado de aceptación arbitrario sobre
 (a-state, b-state). Sólo se crean estados alcanzables desde el par
 inicial.

```ts
export function dfaProduct(a: DFA, b: DFA, acceptPair: (sa: string, sb: string) => boolean): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `DFA` | no |  |
| `b` | `DFA` | no |  |
| `acceptPair` | `(sa: string, sb: string) => boolean` | no |  |

### Returns

`DFA` — 


## `dfaUnion`

> Function · `reasoning/automata/dfa.ts:131`

```ts
export function dfaUnion(a: DFA, b: DFA): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `DFA` | no |  |
| `b` | `DFA` | no |  |

### Returns

`DFA` — 


## `dfaIntersection`

> Function · `reasoning/automata/dfa.ts:135`

```ts
export function dfaIntersection(a: DFA, b: DFA): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `DFA` | no |  |
| `b` | `DFA` | no |  |

### Returns

`DFA` — 


## `dfaMinimize`

> Function · `reasoning/automata/dfa.ts:150`

```ts
export function dfaMinimize(M: DFA): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `DFA` | no |  |

### Returns

`DFA` — 

