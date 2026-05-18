# `runtime/pi-calculus/substitution.ts`

============================================================ π-calculus — sustitución capture-avoiding P[x := v]. ============================================================ Reemplaza ocurrencias libres de `x` por `v` en P. Si `v` cae bajo un binder que lo capturaría (input o new que liga el mismo nombre `v`), se α-renombra el binder con un nombre fresco antes de descender. ============================================================

## `substitute`

> Function · `runtime/pi-calculus/substitution.ts:20`

Sustitución `p[x := v]` capture-avoiding.

 - Si `x === v` o `x` no aparece libre, devuelve `p` sin cambios
   estructurales (pero retorna un AST nuevo solo donde fue necesario).
 - En binders (input, new) verifica que el nombre ligado no capture
   `v`: si lo hiciera, refresca el binder con `freshName`.

```ts
export function substitute(p: PiProcess, x: string, v: string): PiProcess
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |
| `x` | `string` | no |  |
| `v` | `string` | no |  |

### Returns

`PiProcess` — 

