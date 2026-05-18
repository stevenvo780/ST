# `type-theory/cubical/substitute.ts`

============================================================ Cubical — Sustitución capture-avoiding ============================================================ Las variables de término y las variables de intervalo viven en el mismo espacio sintáctico (ambas son nombres). Sustituimos uniformemente; el sustituidor decide por la posición sintáctica (var vs iVar) si reemplaza o no.

## `substituteCubical`

> Function · `type-theory/cubical/substitute.ts:21`

```ts
export function substituteCubical( term: CubicalTerm, name: string, value: CubicalTerm, ): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |
| `name` | `string` | no |  |
| `value` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 

