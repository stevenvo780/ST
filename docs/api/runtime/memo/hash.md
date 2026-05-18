# `runtime/memo/hash.ts`

## `hashFormula`

> Function · `runtime/memo/hash.ts:85`

Genera un hash canónico y estable para una fórmula.
- Ignora whitespace/metadatos de source.
- Aplica alpha-renaming antes de serializar: fórmulas alfa-equivalentes
  producen el mismo hash.

```ts
export function hashFormula(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 

