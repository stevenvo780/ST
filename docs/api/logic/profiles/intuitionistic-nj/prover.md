# `logic/profiles/intuitionistic-nj/prover.ts`

============================================================ Intuitionistic Natural Deduction — Backward proof search ============================================================ Estrategia: búsqueda hacia atrás en un cálculo de secuentes intuicionista (G3i-style, single-succedent) que se traduce a NJ "on the fly". El árbol NJ producido se valida luego con `verifyProof` (ver al final). Notas:   - Sólo hay UN consecuente (eso es lo que vuelve NJ     intuicionista; la lógica clásica usa multi-succedent).   - La regla `impL` (modus ponens hacia atrás) y `orL`     (eliminación de disyunción) no son invertibles, lo que     obliga a buscar con memoización para evitar bucles.   - Para `notI` aplicamos el patrón: si la meta es `¬φ`,     entonces es lo mismo que probar `φ ⊢ ⊥`. Completitud: G3i es completo para IPC (Dyckhoff, "Contraction- free sequent calculi for intuitionistic logic", 1992). Esta implementación es una variante pragmática con loop-checking; es completa para el fragmento proposicional dentro del budget.

## Contents

- [`proveIntuitionistically`](#proveintuitionistically) — Function
- [`verifyProof`](#verifyproof) — Function

## `proveIntuitionistically`

> Function · `logic/profiles/intuitionistic-nj/prover.ts:312`

API pública.

Devuelve un árbol NJ que demuestra `goal` a partir de las
`premises` dadas, o `null` si no encontró prueba dentro del
budget configurado.

```ts
export function proveIntuitionistically( premises: IntuitFormula[], goal: IntuitFormula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `IntuitFormula[]` | no |  |
| `goal` | `IntuitFormula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`NJProof \| null` — 


## `verifyProof`

> Function · `logic/profiles/intuitionistic-nj/prover.ts:327`

```ts
export function verifyProof(proof: NJProof, initialContext: IntuitFormula[] = []): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `NJProof` | no |  |
| `initialContext` | `IntuitFormula[]` | yes |  |

### Returns

`boolean` — 

