# `proof-systems/fol-prover-advanced/resolve.ts`

## Contents

- [`resetRenameCounter`](#resetrenamecounter) — Function
- [`renameClause`](#renameclause) — Function
- [`binaryResolve`](#binaryresolve) — Function
- [`hyperresolve`](#hyperresolve) — Function
- [`hyperresolveMany`](#hyperresolvemany) — Function
- [`factor`](#factor) — Function
- [`dedupLiterals`](#dedupliterals) — Function
- [`isTautology`](#istautology) — Function

## `resetRenameCounter`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:6`

```ts
export function resetRenameCounter(): void
```

### Returns

`void` — 


## `renameClause`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:14`

Renombra todas las variables de una cláusula con sufijos frescos, para
evitar captura accidental al resolver con otra cláusula.

```ts
export function renameClause(c: FOLClause): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause` — 


## `binaryResolve`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:49`

Resolución binaria: une dos cláusulas eliminando un par de literales
complementarias unificables. Devuelve cero o más resolventes (uno por par
de literales complementarias que unifiquen).

```ts
export function binaryResolve( a: FOLClause, b: FOLClause, ): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLClause` | no |  |
| `b` | `FOLClause` | no |  |

### Returns

`Array<{ clause: FOLClause; sub: Substitution }>` — 


## `hyperresolve`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:93`

Hyperresolución: en un solo paso, elimina **todas** las literales negativas
de un "núcleo" (nucleus) usando cláusulas auxiliares positivas (electrons)
que sean unitarias o tengan sólo literales positivas. El resultado es una
cláusula con sólo literales positivas (positive hyperresolvent).

`positive` aquí es una lista; en la práctica el caller pasa cláusulas
positivas candidatas y la función produce todos los hyperresolventes
posibles del núcleo contra ese conjunto. Para mantener la API del spec,
exportamos `hyperresolve(positive, nucleus)` con la primera cláusula como
electron (cubre el caso "3 units + nucleus" si se llama en cadena).

```ts
export function hyperresolve(positive: FOLClause, nucleus: FOLClause): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `positive` | `FOLClause` | no |  |
| `nucleus` | `FOLClause` | no |  |

### Returns

`FOLClause[]` — 


## `hyperresolveMany`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:97`

```ts
export function hyperresolveMany( positives: FOLClause[], nucleus: FOLClause, ): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `positives` | `FOLClause[]` | no |  |
| `nucleus` | `FOLClause` | no |  |

### Returns

`Array<{ clause: FOLClause; sub: Substitution; usedElectrons: number[] }>` — 


## `factor`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:213`

Factoring: si dos literales del mismo signo unifican, colapsarlas reduce la
cláusula. Indispensable para completar la resolución.

```ts
export function factor(c: FOLClause): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause[]` — 


## `dedupLiterals`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:235`

```ts
export function dedupLiterals(c: FOLClause): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause` — 


## `isTautology`

> Function · `proof-systems/fol-prover-advanced/resolve.ts:244`

Detecta cláusulas tautológicas (P ∨ ¬P).

```ts
export function isTautology(c: FOLClause): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`boolean` — 

