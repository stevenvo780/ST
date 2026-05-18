# `reasoning/separation-logic/index.ts`

Valor que puede almacenarse en el heap de separación: entero, dirección o null.

## Contents

- [`SLValue`](#slvalue) — Type
- [`intVal`](#intval) — Function
- [`addrVal`](#addrval) — Function
- [`nullVal`](#nullval) — Function
- [`valueEquals`](#valueequals) — Function
- [`valueKey`](#valuekey) — Function
- [`asLoc`](#asloc) — Function
- [`Heap`](#heap) — Interface
- [`newHeap`](#newheap) — Function
- [`fromMap`](#frommap) — Function
- [`disjoint`](#disjoint) — Function
- [`combine`](#combine) — Function
- [`heapEquals`](#heapequals) — Function
- [`splits`](#splits) — Function
- [`SLFormula`](#slformula) — Type
- [`PurePredicate`](#purepredicate) — Type
- [`emp`](#emp) — Const
- [`pointsTo`](#pointsto) — Const
- [`star`](#star) — Const
- [`magicWand`](#magicwand) — Const
- [`pure`](#pure) — Const
- [`andF`](#andf) — Const
- [`orF`](#orf) — Const
- [`impliesF`](#impliesf) — Const
- [`notF`](#notf) — Const
- [`existsF`](#existsf) — Const
- [`forallF`](#forallf) — Const
- [`formulaToString`](#formulatostring) — Function
- [`valueToString`](#valuetostring) — Function
- [`SLValuation`](#slvaluation) — Interface
- [`bind`](#bind) — Function
- [`satisfies`](#satisfies) — Function
- [`SLCommand`](#slcommand) — Interface
- [`SLTriple`](#sltriple) — Interface
- [`ExecResult`](#execresult) — Interface
- [`executeCommand`](#executecommand) — Function
- [`CheckTripleOptions`](#checktripleoptions) — Interface
- [`CheckTripleResult`](#checktripleresult) — Interface
- [`checkTriple`](#checktriple) — Function
- [`isListSegment`](#islistsegment) — Function
- [`listSegment`](#listsegment) — Function
- [`satisfiesShape`](#satisfiesshape) — Function
- [`tree`](#tree) — Function
- [`isTree`](#istree) — Function
- [`frame`](#frame) — Function
- [`Cmd`](#cmd) — Const

## `SLValue`

> Type · `reasoning/separation-logic/index.ts:24`

Valor que puede almacenarse en el heap de separación: entero, dirección o null.

```ts
export type SLValue = | { kind: 'int'; value: number } | { kind: 'addr'; loc: number } | { kind: 'null' };
```


## `intVal`

> Function · `reasoning/separation-logic/index.ts:30`

Constructor de valor entero del heap de separación.

```ts
export function intVal(value: number): SLValue
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `number` | no |  |

### Returns

`SLValue` — 


## `addrVal`

> Function · `reasoning/separation-logic/index.ts:35`

Constructor de valor dirección del heap de separación.

```ts
export function addrVal(loc: number): SLValue
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `loc` | `number` | no |  |

### Returns

`SLValue` — 


## `nullVal`

> Function · `reasoning/separation-logic/index.ts:40`

Singleton null del heap de separación (puntero nulo).

```ts
export function nullVal(): SLValue
```

### Returns

`SLValue` — 


## `valueEquals`

> Function · `reasoning/separation-logic/index.ts:45`

Igualdad estructural entre dos valores del heap de separación.

```ts
export function valueEquals(a: SLValue, b: SLValue): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `SLValue` | no |  |
| `b` | `SLValue` | no |  |

### Returns

`boolean` — 


## `valueKey`

> Function · `reasoning/separation-logic/index.ts:53`

Convierte un SLValue a una clave string estable para Maps.

```ts
export function valueKey(v: SLValue): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `SLValue` | no |  |

### Returns

`string` — 


## `asLoc`

> Function · `reasoning/separation-logic/index.ts:61`

Devuelve la dirección de un SLValue si es addr, o null en cualquier
otro caso. La null-location no se direcciona.

```ts
export function asLoc(v: SLValue): number | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `SLValue` | no |  |

### Returns

`number \| null` — 


## `Heap`

> Interface · `reasoning/separation-logic/index.ts:67`

```ts
export interface Heap
```


## `newHeap`

> Function · `reasoning/separation-logic/index.ts:119`

```ts
export function newHeap(): Heap
```

### Returns

`Heap` — 


## `fromMap`

> Function · `reasoning/separation-logic/index.ts:123`

```ts
export function fromMap(entries: Array<[number, SLValue]>): Heap
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `entries` | `Array<[number, SLValue]>` | no |  |

### Returns

`Heap` — 


## `disjoint`

> Function · `reasoning/separation-logic/index.ts:128`

Dos heaps son disjuntos sii sus dominios no se intersectan.

```ts
export function disjoint(h1: Heap, h2: Heap): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h1` | `Heap` | no |  |
| `h2` | `Heap` | no |  |

### Returns

`boolean` — 


## `combine`

> Function · `reasoning/separation-logic/index.ts:138`

Unión disjunta `h1 ⊎ h2`. Devuelve null si los heaps comparten alguna
dirección — la unión disjunta sólo está definida cuando son disjoint.

```ts
export function combine(h1: Heap, h2: Heap): Heap | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h1` | `Heap` | no |  |
| `h2` | `Heap` | no |  |

### Returns

`Heap \| null` — 


## `heapEquals`

> Function · `reasoning/separation-logic/index.ts:146`

Igualdad estructural de heaps.

```ts
export function heapEquals(h1: Heap, h2: Heap): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h1` | `Heap` | no |  |
| `h2` | `Heap` | no |  |

### Returns

`boolean` — 


## `splits`

> Function · `reasoning/separation-logic/index.ts:159`

Enumera todas las particiones del heap en `(h1, h2)` con `h1 ⊎ h2 = h`.

```ts
export function splits(h: Heap): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h` | `Heap` | no |  |

### Returns

`Array<{ h1: Heap; h2: Heap }>` — 


## `SLFormula`

> Type · `reasoning/separation-logic/index.ts:181`

```ts
export type SLFormula = | { kind: 'emp' } | { kind: 'pointsTo'; loc: SLValue; val: SLValue } | { kind: 'star'; left: SLFormula; right: SLFormula } | { kind: 'magicWand'; left: SLFormula; right: SLFormula } | { kind: 'pure'; expression: string; predicate: PurePredicate } | { kind: 'and'; left: SLFormula; right: SLFormula } | { kind: 'or'; left: SLFormula; right: SLFormula } | { kind: 'implies'; left: SLFormula; right: SLFormula } | { kind: 'not'; body: SLFormula } | { kind: 'exists'; bind: string; body: SLFormula } | { kind: 'forall'; bind: string; body: SLFormula };
```


## `PurePredicate`

> Type · `reasoning/separation-logic/index.ts:194`

```ts
export type PurePredicate = (val: SLValuation) => boolean;
```


## `emp`

> Const · `reasoning/separation-logic/index.ts:196`

```ts
const emp
```


## `pointsTo`

> Const · `reasoning/separation-logic/index.ts:198`

```ts
const pointsTo
```


## `star`

> Const · `reasoning/separation-logic/index.ts:204`

```ts
const star
```


## `magicWand`

> Const · `reasoning/separation-logic/index.ts:210`

```ts
const magicWand
```


## `pure`

> Const · `reasoning/separation-logic/index.ts:216`

```ts
const pure
```


## `andF`

> Const · `reasoning/separation-logic/index.ts:222`

```ts
const andF
```


## `orF`

> Const · `reasoning/separation-logic/index.ts:228`

```ts
const orF
```


## `impliesF`

> Const · `reasoning/separation-logic/index.ts:234`

```ts
const impliesF
```


## `notF`

> Const · `reasoning/separation-logic/index.ts:240`

```ts
const notF
```


## `existsF`

> Const · `reasoning/separation-logic/index.ts:242`

```ts
const existsF
```


## `forallF`

> Const · `reasoning/separation-logic/index.ts:248`

```ts
const forallF
```


## `formulaToString`

> Function · `reasoning/separation-logic/index.ts:256`

```ts
export function formulaToString(f: SLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `SLFormula` | no |  |

### Returns

`string` — 


## `valueToString`

> Function · `reasoning/separation-logic/index.ts:283`

```ts
export function valueToString(v: SLValue): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `SLValue` | no |  |

### Returns

`string` — 


## `SLValuation`

> Interface · `reasoning/separation-logic/index.ts:291`

```ts
export interface SLValuation
```


## `bind`

> Function · `reasoning/separation-logic/index.ts:296`

Devuelve una copia del valuation con `name → v`.

```ts
export function bind(val: SLValuation, name: string, v: SLValue): SLValuation
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `val` | `SLValuation` | no |  |
| `name` | `string` | no |  |
| `v` | `SLValue` | no |  |

### Returns

`SLValuation` — 


## `satisfies`

> Function · `reasoning/separation-logic/index.ts:303`

`satisfies(P, h, ν)` — el modelo `(h, ν)` satisface la fórmula P.

```ts
export function satisfies(formula: SLFormula, heap: Heap, val: SLValuation): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `SLFormula` | no |  |
| `heap` | `Heap` | no |  |
| `val` | `SLValuation` | no |  |

### Returns

`boolean` — 


## `SLCommand`

> Interface · `reasoning/separation-logic/index.ts:454`

```ts
export interface SLCommand
```


## `SLTriple`

> Interface · `reasoning/separation-logic/index.ts:464`

```ts
export interface SLTriple
```


## `ExecResult`

> Interface · `reasoning/separation-logic/index.ts:471`

Resultado de ejecutar un comando paso-a-paso sobre `(heap, val)`.

```ts
export interface ExecResult
```


## `executeCommand`

> Function · `reasoning/separation-logic/index.ts:481`

Ejecuta un único comando de forma small-step.

```ts
export function executeCommand(cmd: SLCommand, heap: Heap, val: SLValuation): ExecResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cmd` | `SLCommand` | no |  |
| `heap` | `Heap` | no |  |
| `val` | `SLValuation` | no |  |

### Returns

`ExecResult` — 


## `CheckTripleOptions`

> Interface · `reasoning/separation-logic/index.ts:552`

```ts
export interface CheckTripleOptions
```


## `CheckTripleResult`

> Interface · `reasoning/separation-logic/index.ts:561`

```ts
export interface CheckTripleResult
```


## `checkTriple`

> Function · `reasoning/separation-logic/index.ts:571`

Verifica una tripla `{P} c {Q}` por muestreo finito: enumera modelos
(heap, val) que satisfagan P, los ejecuta y comprueba Q sobre el
estado final. Devuelve `valid: false` con contraejemplo al primer
fallo. No es completo — es una verificación de testing/random.

```ts
export function checkTriple(triple: SLTriple, options: CheckTripleOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `triple` | `SLTriple` | no |  |
| `options` | `CheckTripleOptions` | yes |  |

### Returns

`CheckTripleResult` — 


## `isListSegment`

> Function · `reasoning/separation-logic/index.ts:667`

`ls(x, y)` — list-segment de x a y. Definido por:
  ls(x, y) ≡ (x = y ∧ emp) ∨ ∃z. (x ↦ z * ls(z, y))

Para mantener semántica computable, se interpreta directamente sobre
el heap: existe una cadena de celdas desde `start` a `end` cuyos
contenidos son punteros, sin ciclos ni celdas extra.

```ts
export function isListSegment(start: SLValue, end: SLValue, heap: Heap): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `start` | `SLValue` | no |  |
| `end` | `SLValue` | no |  |
| `heap` | `Heap` | no |  |

### Returns

`boolean` — 


## `listSegment`

> Function · `reasoning/separation-logic/index.ts:689`

Predicado SL para list-segment `ls(start, end)`. Se evalúa como
predicado puro sobre el heap (cumple `satisfies`).

```ts
export function listSegment(start: SLValue, end: SLValue): SLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `start` | `SLValue` | no |  |
| `end` | `SLValue` | no |  |

### Returns

`SLFormula` — 


## `satisfiesShape`

> Function · `reasoning/separation-logic/index.ts:714`

Evalúa una fórmula con soporte de predicados inductivos sobre forma de
heap (ls, tree). Se usa cuando la fórmula contiene `listSegment` o
`tree` — `satisfies` solo no basta porque su rama `pure` ignora el heap.

```ts
export function satisfiesShape(formula: SLFormula, heap: Heap, val: SLValuation): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `SLFormula` | no |  |
| `heap` | `Heap` | no |  |
| `val` | `SLValuation` | no |  |

### Returns

`boolean` — 


## `tree`

> Function · `reasoning/separation-logic/index.ts:773`

`tree(root)` — el heap representa un árbol binario con raíz `root`.
  tree(x) ≡ (x = null ∧ emp) ∨ ∃l, r. (x ↦ l * x.next ↦ r * tree(l) * tree(r))

Modelo simplificado: cada nodo ocupa 2 celdas consecutivas
(loc, loc+1) con los punteros izquierdo y derecho.

```ts
export function tree(root: SLValue): SLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `root` | `SLValue` | no |  |

### Returns

`SLFormula` — 


## `isTree`

> Function · `reasoning/separation-logic/index.ts:781`

```ts
export function isTree(root: SLValue, heap: Heap): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `root` | `SLValue` | no |  |
| `heap` | `Heap` | no |  |

### Returns

`boolean` — 


## `frame`

> Function · `reasoning/separation-logic/index.ts:812`

Frame rule: si `{P} c {Q}` y `c` no modifica las variables libres de
`R`, entonces `{P * R} c {Q * R}`. Esta función construye la tripla
compuesta — la validación queda a cargo de `checkTriple`.

```ts
export function frame(triple: SLTriple, frameFormula: SLFormula): SLTriple
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `triple` | `SLTriple` | no |  |
| `frameFormula` | `SLFormula` | no |  |

### Returns

`SLTriple` — 


## `Cmd`

> Const · `reasoning/separation-logic/index.ts:822`

```ts
const Cmd
```

