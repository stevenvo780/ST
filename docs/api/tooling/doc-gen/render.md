# `tooling/doc-gen/render.ts`

============================================================ Renderers — Markdown / JSON / index. renderMarkdown devuelve Map<filePath, contenido>. La clave es relativa (`tooling/doc-gen.md`, `index.md`...) y se compone a partir del modulePath original (sin extensión `.ts`). ============================================================

## Contents

- [`renderMarkdown`](#rendermarkdown) — Function
- [`renderJSON`](#renderjson) — Function
- [`renderIndex`](#renderindex) — Function
- [`toMarkdownPath`](#tomarkdownpath) — Function

## `renderMarkdown`

> Function · `tooling/doc-gen/render.ts:29`

Renderiza la documentación a Markdown. La salida es un Map en
el que la clave es la ruta del archivo `.md` correspondiente
(relativa) y el valor es su contenido textual.

Además del archivo por módulo, se incluye `index.md` con el
overview generado por `renderIndex`.

```ts
export function renderMarkdown(modules: DocModule[]): Map<string, string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `modules` | `DocModule[]` | no |  |

### Returns

`Map<string, string>` — 


## `renderJSON`

> Function · `tooling/doc-gen/render.ts:45`

Serializa la estructura completa a JSON pretty-printed.

Útil cuando el consumidor (otro generador, un buscador, un
sitio estático) prefiere consumir la data cruda.

```ts
export function renderJSON(modules: DocModule[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `modules` | `DocModule[]` | no |  |

### Returns

`string` — 


## `renderIndex`

> Function · `tooling/doc-gen/render.ts:55`

Construye un `index.md` resumen con:
 - conteo total de módulos y símbolos
 - tabla por módulo con # de exports y descripción opcional
 - sub-tablas por kind (functions, classes, etc.)

```ts
export function renderIndex(modules: DocModule[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `modules` | `DocModule[]` | no |  |

### Returns

`string` — 


## `toMarkdownPath`

> Function · `tooling/doc-gen/render.ts:223`

`tooling/doc-gen/extract.ts` → `tooling/doc-gen/extract.md`.

```ts
export function toMarkdownPath(modulePath: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `modulePath` | `string` | no |  |

### Returns

`string` — 

