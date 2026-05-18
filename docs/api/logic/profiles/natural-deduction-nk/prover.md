# `logic/profiles/natural-deduction-nk/prover.ts`

============================================================ Natural Deduction NK (classical) — Backward proof search ============================================================ Estrategia: reutilizamos el motor intuicionista NJ y añadimos la regla clásica `rAA` (reductio ad absurdum) como recurso global. Con rAA disponible se obtiene completitud clásica: si Γ ⊨ φ entonces Γ ⊢_NK φ. Heurística de búsqueda:   1. Intentar las reglas estándar NJ.   2. Si la meta es atómica o disyuntiva (no descomponible por      reglas de introducción) y no hubo prueba, intentar rAA:      asume ¬φ y trata de derivar ⊥.   3. Si la meta es exactamente `¬¬φ → φ`, atajamos con      doubleNegE como axioma derivado. El árbol generado es válido NK (verificable por verifyProof). Cuando la prueba evita rAA/LEM/Peirce/doubleNegE, se traduce automáticamente a NJ (ver `nkToNJ`).

## Contents

- [`proveClassically`](#proveclassically) — Function
- [`proveIntuitOnly`](#proveintuitonly) — Function
- [`verifyProof`](#verifyproof) — Function
- [`provedPeirce`](#provedpeirce) — Function
- [`provedDNE`](#proveddne) — Function
- [`provedLEM`](#provedlem) — Function
- [`nkToNJ`](#nktonj) — Function

## `proveClassically`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:298`

API pública: prueba clásica.

Devuelve un árbol NK que demuestra `goal` a partir de las
`premises` dadas, o `null` si no encontró prueba.

```ts
export function proveClassically( premises: NKFormula[], goal: NKFormula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `NKFormula[]` | no |  |
| `goal` | `NKFormula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`NKProof \| null` — 


## `proveIntuitOnly`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:311`

Variante restringida: intenta probar usando sólo reglas
intuicionistas (NJ). Útil internamente para `nkToNJ`.

```ts
export function proveIntuitOnly( premises: NKFormula[], goal: NKFormula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `NKFormula[]` | no |  |
| `goal` | `NKFormula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`NKProof \| null` — 


## `verifyProof`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:326`

Verifica recursivamente el árbol NK. Comprueba cada regla
localmente contra su conclusión y contexto.

```ts
export function verifyProof(proof: NKProof, initialContext: NKFormula[] = []): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `NKProof` | no |  |
| `initialContext` | `NKFormula[]` | yes |  |

### Returns

`boolean` — 


## `provedPeirce`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:482`

Devuelve una prueba NK de la ley de Peirce: ((P→Q)→P)→P.

```ts
export function provedPeirce(): NKProof
```

### Returns

`NKProof` — 


## `provedDNE`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:500`

Devuelve una prueba NK de la eliminación de doble negación: ¬¬P → P.

```ts
export function provedDNE(): NKProof
```

### Returns

`NKProof` — 


## `provedLEM`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:521`

Devuelve una prueba NK del tercero excluido: P ∨ ¬P.

```ts
export function provedLEM(): NKProof
```

### Returns

`NKProof` — 


## `nkToNJ`

> Function · `logic/profiles/natural-deduction-nk/prover.ts:545`

Indica si una prueba NK puede traducirse a NJ sin pérdida.
Si contiene alguna regla puramente clásica, la traducción
falla con `reason`. Si es puramente intuicionista, se
devuelve la prueba intacta (cast estructural a NJProof).

No intentamos la traducción de Glivenko ni doble-negación
uniforme aquí: el objetivo es detectar si la prueba ya está
en el fragmento intuicionista.

```ts
export function nkToNJ(proof: NKProof):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `NKProof` | no |  |

### Returns

`{ converted?: NKProof; reason?: string }` — 

