# `semantics/categorical/fin-set.ts`

============================================================ ST Categorical — FinSet ============================================================ Categoría de conjuntos finitos (representados como objetos nombrados con su carrier explícito) y funciones totales entre ellos. Los morfismos llevan un mapa `fn: Map<string,string>` para que la igualdad e identidad sean computables. ============================================================

## Contents

- [`FinSetObj`](#finsetobj) — Interface
- [`FinSetMor`](#finsetmor) — Interface
- [`mkFinSetMor`](#mkfinsetmor) — Function
- [`FinSet`](#finset) — Function

## `FinSetObj`

> Interface · `semantics/categorical/fin-set.ts:16`

Objeto FinSet = nombre + conjunto de elementos. El nombre actúa
como identidad estable; los elementos viven como strings.

```ts
export interface FinSetObj
```


## `FinSetMor`

> Interface · `semantics/categorical/fin-set.ts:26`

Morfismo FinSet: función total entre los elementos de src y tgt.
`id` es la clave única en `morphisms`. Construirla via
`mkFinSetMor` garantiza coherencia con la categoría.

```ts
export interface FinSetMor
```


## `mkFinSetMor`

> Function · `semantics/categorical/fin-set.ts:39`

Construye un morfismo en FinSet validando que `fn` cubra
todos los elementos del dominio y que sus imágenes vivan en el
codominio. Lanza si el cliente intenta crear una función parcial
o con valores fuera de tgt.

```ts
export function mkFinSetMor( name: string, src: FinSetObj, tgt: FinSetObj, table: Record<string, string> | ReadonlyMap<string, string>, ): FinSetMor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `src` | `FinSetObj` | no |  |
| `tgt` | `FinSetObj` | no |  |
| `table` | `Record<string, string> \| ReadonlyMap<string, string>` | no |  |

### Returns

`FinSetMor` — 


## `FinSet`

> Function · `semantics/categorical/fin-set.ts:79`

Construye FinSet sobre un conjunto explícito de objetos y morfismos.
Cierra automáticamente bajo identidades y composiciones (transitive
closure) para que `verifyAssociativity` no falle por morfismos
intermedios faltantes.

`maxClosureSteps` limita la expansión por seguridad cuando la
categoría tiene ciclos densos; default 4 es suficiente para
todos los tests del módulo.

```ts
export function FinSet( objs: ReadonlyArray<FinSetObj>, generators: ReadonlyArray<FinSetMor> = [], maxClosureSteps = 4, ): Category<FinSetObj, FinSetMor>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `objs` | `ReadonlyArray<FinSetObj>` | no |  |
| `generators` | `ReadonlyArray<FinSetMor>` | yes |  |
| `maxClosureSteps` | `any` | yes |  |

### Returns

`Category<FinSetObj, FinSetMor>` — 

