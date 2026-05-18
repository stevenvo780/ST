# `semantics/categorical/free.ts`

============================================================ ST Categorical — Categoría libre sobre un grafo ============================================================ Dado un grafo dirigido (vertices + aristas con nombres), construye la categoría libre cuyos morfismos son paths (cadenas de aristas componibles), módulo la equivalencia asociativa con la identidad como path vacío. ============================================================

## Contents

- [`FreeMor`](#freemor) — Interface
- [`Free`](#free) — Function

## `FreeMor`

> Interface · `semantics/categorical/free.ts:17`

Morfismo de la categoría libre = path. Representamos un path
como la lista de nombres de aristas (o vacío para la identidad)
junto con su origen y destino.

```ts
export interface FreeMor
```


## `Free`

> Function · `semantics/categorical/free.ts:33`

Construye la categoría libre. `generators` es una lista de tripletas
`[from, to, name]` donde `name` debe ser único globalmente.

`maxLength` acota la longitud máxima de paths considerados al
"materializar" la categoría como `Map<MorId, FreeMor>`. Esto es
inevitable: la categoría libre sobre un grafo con ciclos es
infinita. Para tests usamos `maxLength=3`.

```ts
export function Free( vertices: ReadonlyArray<string>, generators: ReadonlyArray<readonly [string, string, string]>, maxLength = 3, ): Category<string, FreeMor>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vertices` | `ReadonlyArray<string>` | no |  |
| `generators` | `ReadonlyArray<readonly [string, string, string]>` | no |  |
| `maxLength` | `any` | yes |  |

### Returns

`Category<string, FreeMor>` — 

