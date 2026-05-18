# `tooling/doc-gen/jsdoc.ts`

...

## Contents

- [`stripCommentMarkers`](#stripcommentmarkers) — Function
- [`parseJSDoc`](#parsejsdoc) — Function
- [`parseParamTag`](#parseparamtag) — Function
- [`parseReturnsTag`](#parsereturnstag) — Function

## `stripCommentMarkers`

> Function · `tooling/doc-gen/jsdoc.ts:19`

Quita los marcadores `/**`, `*\/` y el `*` líder de cada línea
para dejar el contenido textual del comentario.

```ts
export function stripCommentMarkers(raw: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `raw` | `string` | no |  |

### Returns

`string` — 


## `parseJSDoc`

> Function · `tooling/doc-gen/jsdoc.ts:44`

Parsea un comentario JSDoc/TSDoc en `description` + `tags`.
Acepta tanto el raw con `/** ... *\/` como el contenido ya limpio.

Cada tag se reconoce con la heurística clásica de TypeDoc/TSDoc:
una línea que empieza con `@<word>` abre un nuevo tag y consume
todas las líneas siguientes hasta el próximo `@<word>` o EOF.

```ts
export function parseJSDoc(comment: string): ParsedJSDoc
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `comment` | `string` | no |  |

### Returns

`ParsedJSDoc` — 


## `parseParamTag`

> Function · `tooling/doc-gen/jsdoc.ts:88`

`@param name description` → { name, description, optional }.

También soporta el formato con tipo `@param {Type} name desc` aunque
los tipos reales los tomamos del compilador, no del JSDoc.

```ts
export function parseParamTag( content: string, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `content` | `string` | no |  |

### Returns

`{ name: string; description: string; optional: boolean } \| null` — 


## `parseReturnsTag`

> Function · `tooling/doc-gen/jsdoc.ts:127`

`@returns description` → description string.

```ts
export function parseReturnsTag(content: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `content` | `string` | no |  |

### Returns

`string` — 

