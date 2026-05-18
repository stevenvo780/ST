# `logic/profiles/sequent-g3/prover.ts`

============================================================ G3 — Backward proof search ============================================================ Busqueda hacia atras (root-first). Las reglas de G3 son invertibles, por lo que NO hay que retroceder al elegir la proxima regla: cualquier formula compleja que aplique cierra el subgoal sii la version sin descomponer era cerrable. Terminacion: cada paso reemplaza una formula compleja por sub-formulas estrictamente menores. Para evitar contracciones redundantes en multisets, se dedupica por clave sintactica antes de aplicar la siguiente regla. Branching:   - andR, orL, impL ramifican en 2 premisas (cada una debe cerrar).   - andL, orR, impR, notL, notR son lineales (1 premisa).

## Contents

- [`proveSequent`](#provesequent) — Function
- [`proveFormula`](#proveformula) — Function

## `proveSequent`

> Function · `logic/profiles/sequent-g3/prover.ts:369`

Demuestra `seq` (Γ ⊢ Δ) por backward search en G3.
Normaliza las formulas antes de comenzar.

```ts
export function proveSequent(seq: Sequent, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seq` | `Sequent` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`ProveResult` — 


## `proveFormula`

> Function · `logic/profiles/sequent-g3/prover.ts:381`

Atajo: demuestra que `⊢ φ` (formula sin hipotesis) es valida en G3.

```ts
export function proveFormula(formula: Formula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`ProveResult` — 

