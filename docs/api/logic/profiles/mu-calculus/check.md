# `logic/profiles/mu-calculus/check.ts`

============================================================ μ-calculus model checker — algoritmo Emerson-Lei / Tarski ============================================================ Semántica denotacional: ⟦φ⟧^ρ ⊆ S, donde ρ : Var → 2^S es el "environment" que asigna conjuntos de estados a variables.   ⟦p⟧ρ        = { s ∈ S | p ∈ L(s) }   ⟦X⟧ρ        = ρ(X)   ⟦¬φ⟧ρ       = S \ ⟦φ⟧ρ   ⟦φ ∧ ψ⟧ρ    = ⟦φ⟧ρ ∩ ⟦ψ⟧ρ   ⟦φ ∨ ψ⟧ρ    = ⟦φ⟧ρ ∪ ⟦ψ⟧ρ   ⟦□φ⟧ρ       = { s | ∀s'. s→s' ⇒ s' ∈ ⟦φ⟧ρ }   ⟦◇φ⟧ρ       = { s | ∃s'. s→s' ∧ s' ∈ ⟦φ⟧ρ }   ⟦μX. φ⟧ρ    = lfp T,  T(U) = ⟦φ⟧ρ[X↦U]   ⟦νX. φ⟧ρ    = gfp T,  idem lfp/gfp se computan iterando desde ∅ / S hasta punto fijo (Knaster-Tarski). Modelos finitos terminan en ≤ |S| iteraciones. Complejidad O(|φ| · |S|^{ad(φ)+1}) en el peor caso. ============================================================

## Contents

- [`modelCheck`](#modelcheck) — Function
- [`satisfiesAt`](#satisfiesat) — Function

## `modelCheck`

> Function · `logic/profiles/mu-calculus/check.ts:164`

Model checking de modal μ-calculus.
Devuelve el conjunto de estados que satisfacen φ.

Lanza si φ tiene variables libres no ligadas o si la fórmula no
está bien formada en tiempo de ejecución (se recomienda chequear
`isWellFormed(φ)` antes de invocar).

```ts
export function modelCheck(K: KripkeStructure, phi: MuFormula): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `KripkeStructure` | no |  |
| `phi` | `MuFormula` | no |  |

### Returns

`Set<string>` — 


## `satisfiesAt`

> Function · `logic/profiles/mu-calculus/check.ts:172`

`K, s ⊨ φ` para un estado puntual. Conveniencia sobre `modelCheck`.

```ts
export function satisfiesAt(K: KripkeStructure, phi: MuFormula, state: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `KripkeStructure` | no |  |
| `phi` | `MuFormula` | no |  |
| `state` | `string` | no |  |

### Returns

`boolean` — 

