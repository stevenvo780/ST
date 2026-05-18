# `tooling/doc-gen/generate.ts`

============================================================ generateDocs — glue. extractDocs → render(markdown|json|html-minimal) → escribe a outputDir, devolviendo lista de archivos y warnings detectados durante el proceso (símbolos sin descripción, etc.). ============================================================

## `generateDocs`

> Function · `tooling/doc-gen/generate.ts:22`

Genera documentación a disco según `opts.template`. Crea
`outputDir` y subdirectorios necesarios.

El default cuando `template` no se especifica es `'markdown'`.

```ts
export async function generateDocs(opts: DocOptions): Promise<GenerateResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `opts` | `DocOptions` | no |  |

### Returns

`Promise<GenerateResult>` — 

