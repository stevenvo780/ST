# `logic/profiles/sequent-lk/prover.ts`

============================================================ LK — Backward proof search ============================================================ Demostrador hacia atras para LK clasico multisuccedente. La estrategia es la siguiente:  1. Si Γ ⊢ Δ comparte una formula identica en ambos lados,     se cierra con `axiom` precedido (si es necesario) de     weakenings.  2. Aplicamos reglas no ramificantes (notL/notR, andL, orR, impR)     antes que las ramificantes (andR, orL, impL). Esto reduce el     branching factor y mantiene el arbol pequeño.  3. La contraccion implicita se obtiene "conservando" la formula     principal en la premisa (estandar en presentaciones LK con     contraccion implicita). Esto evita reglas explicitas de     contraccion en el prover, pero las exportamos para clientes     que construyan derivaciones a mano. El prover NO introduce cortes — produce derivaciones cut-free. La eliminacion de cortes vive en `cut-elimination.ts`.

## Contents

- [`proveLK`](#provelk) — Function
- [`proveLKFormula`](#provelkformula) — Function
- [`isValid`](#isvalid) — Function
- [`hasCut`](#hascut) — Function

## `proveLK`

> Function · `logic/profiles/sequent-lk/prover.ts:209`

Demuestra el secuente `seq` en LK clasico (sin cortes).
Devuelve `null` si no encuentra derivacion dentro del budget.

```ts
export function proveLK(seq: LKSequent, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seq` | `LKSequent` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`LKProof \| null` — 


## `proveLKFormula`

> Function · `logic/profiles/sequent-lk/prover.ts:216`

Atajo: ⊢ φ.

```ts
export function proveLKFormula( formula: LKFormula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `LKFormula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`LKProof \| null` — 


## `isValid`

> Function · `logic/profiles/sequent-lk/prover.ts:253`

Verifica que `proof` sea una derivacion LK valida segun la regla
declarada en cada nodo. La validacion es estructural — comprueba
que las premisas y la conclusion encajen con el patron de la regla.

Es deliberadamente flexible respecto al orden (multisets) y permite
contraccion implicita en las reglas logicas (la formula principal
puede aparecer en las premisas, como en presentaciones modernas).

```ts
export function isValid(proof: LKProof): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LKProof` | no |  |

### Returns

`boolean` — 


## `hasCut`

> Function · `logic/profiles/sequent-lk/prover.ts:475`

Cuenta si existe al menos un nodo `cut` en la derivacion.

```ts
export function hasCut(proof: LKProof): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LKProof` | no |  |

### Returns

`boolean` — 

