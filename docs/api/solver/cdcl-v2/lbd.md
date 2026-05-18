# `solver/cdcl-v2/lbd.ts`

Calcula el LBD de una cláusula dado el nivel de decisión actual de cada
variable. Usa un buffer compartido `seenLevels` (reseteado internamente
cada llamada) para evitar allocaciones repetidas.

Si una variable no está asignada (level = -1), no se cuenta.

## Contents

- [`computeLBD`](#computelbd) — Function
- [`LearnedMeta`](#learnedmeta) — Interface
- [`selectClausesToRemove`](#selectclausestoremove) — Function

## `computeLBD`

> Function · `solver/cdcl-v2/lbd.ts:14`

Calcula el LBD de una cláusula dado el nivel de decisión actual de cada
variable. Usa un buffer compartido `seenLevels` (reseteado internamente
cada llamada) para evitar allocaciones repetidas.

Si una variable no está asignada (level = -1), no se cuenta.

```ts
export function computeLBD( clause: Int32Array, varLevel: Int32Array, seenBuffer: Uint8Array, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clause` | `Int32Array` | no |  |
| `varLevel` | `Int32Array` | no |  |
| `seenBuffer` | `Uint8Array` | no |  |

### Returns

`number` — 


## `LearnedMeta`

> Interface · `solver/cdcl-v2/lbd.ts:42`

Metadatos de una cláusula aprendida usados para decidir si conservarla.

```ts
export interface LearnedMeta
```


## `selectClausesToRemove`

> Function · `solver/cdcl-v2/lbd.ts:64`

Selecciona cláusulas a eliminar de un conjunto de aprendidas.

Política: preservar siempre las "glue clauses" (LBD <= 2). Del resto,
ordenar por (lbd desc, activity asc, length desc) y eliminar la mitad
con menor utilidad. Cláusulas locked nunca se eliminan.

Retorna los `index` (relativos a `metas`) a eliminar.

```ts
export function selectClausesToRemove( metas: ReadonlyArray<LearnedMeta>, lbdProtectThreshold: number = 2, ): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `metas` | `ReadonlyArray<LearnedMeta>` | no |  |
| `lbdProtectThreshold` | `number` | yes |  |

### Returns

`number[]` — 

