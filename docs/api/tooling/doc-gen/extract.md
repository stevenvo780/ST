# `tooling/doc-gen/extract.ts`

============================================================ Extractor — recorre los `.ts` de un rootDir con el TS Compiler API y construye un DocModule[] con todos los símbolos exportados (top-level) más su JSDoc/TSDoc asociado. Skip:  - archivos de tests (`*.test.ts`, `src/tests/**`)  - `index.ts` SIN re-export con doc propio (igual lo escaneamos,    pero los re-exports sin doc no entran como ApiDoc — typescript    los exporta sin nodo de declaración local).  - símbolos no exportados, salvo `includeInternal: true`. ============================================================

## Contents

- [`ExtractOptions`](#extractoptions) — Interface
- [`extractDocs`](#extractdocs) — Function

## `ExtractOptions`

> Interface · `tooling/doc-gen/extract.ts:21`

```ts
export interface ExtractOptions
```


## `extractDocs`

> Function · `tooling/doc-gen/extract.ts:32`

Entrada principal. Recorre `rootDir` recursivamente, parsea cada
archivo `.ts` y devuelve un `DocModule` por archivo con contenido.

Archivos sin exports documentados se omiten (no aparecen en el
resultado) para mantener el output compacto.

```ts
export function extractDocs(rootDir: string, opts: ExtractOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rootDir` | `string` | no |  |
| `opts` | `ExtractOptions` | yes |  |

### Returns

`DocModule[]` — 

