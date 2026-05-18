# `runtime/pi-calculus/names.ts`

============================================================ π-calculus — nombres libres / ligados y α-renaming. ============================================================ Definiciones estándar (Milner, "Communicating and Mobile Systems"):   fn(0)          = ∅   fn(c(x).P)     = {c} ∪ (fn(P) \ {x})         x está ligado en P   fn(c̄⟨v⟩.P)    = {c, v} ∪ fn(P)   fn(P|Q)        = fn(P) ∪ fn(Q)   fn((νc) P)     = fn(P) \ {c}                  c está ligado en P   fn(!P)         = fn(P)   fn(P+Q)        = fn(P) ∪ fn(Q)   fn([x=y].P)    = {x, y} ∪ fn(P)   bn(0)          = ∅   bn(c(x).P)     = {x} ∪ bn(P)   bn((νc) P)     = {c} ∪ bn(P)   (resto = unión de los hijos) ============================================================

## Contents

- [`freeNames`](#freenames) — Function
- [`boundNames`](#boundnames) — Function
- [`alphaRename`](#alpharename) — Function
- [`freshName`](#freshname) — Function

## `freeNames`

> Function · `runtime/pi-calculus/names.ts:28`

Conjunto de nombres libres de un proceso π. Un nombre es "libre" si
aparece referenciado pero no está bajo el alcance de un binder
(input `c(x)` liga `x`; new `(νc)` liga `c`).

```ts
export function freeNames(p: PiProcess): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |

### Returns

`Set<string>` — 


## `boundNames`

> Function · `runtime/pi-calculus/names.ts:67`

Conjunto de nombres ligados (introducidos por algún binder en el
subárbol). Útil para detectar shadowing y evitar capturas.

```ts
export function boundNames(p: PiProcess): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |

### Returns

`Set<string>` — 


## `alphaRename`

> Function · `runtime/pi-calculus/names.ts:102`

α-renaming: renombrar un nombre en todo el AST. Útil para:
  - Refrescar nombres ligados antes de sustituir (evitar capturas).
  - Normalizar canales restringidos al testear congruencia estructural.

No diferencia entre nombres libres y ligados: simplemente reemplaza
cada ocurrencia de `oldN` por `newN`. La diferenciación libre/ligado
se hace en `substitute`, que usa `alphaRename` como utility.

```ts
export function alphaRename(p: PiProcess, oldN: string, newN: string): PiProcess
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |
| `oldN` | `string` | no |  |
| `newN` | `string` | no |  |

### Returns

`PiProcess` — 


## `freshName`

> Function · `runtime/pi-calculus/names.ts:167`

Genera un nombre fresco que no aparece en ninguno de los conjuntos
`avoid`. Estrategia simple: base + sufijo numérico incremental.

```ts
export function freshName(base: string, avoid: ReadonlySet<string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `base` | `string` | no |  |
| `avoid` | `ReadonlySet<string>` | no |  |

### Returns

`string` — 

