# `logic/profiles/mu-calculus/ctl-translate.ts`

============================================================ CTL → modal μ-calculus translator ============================================================ Encoding clásico (Emerson 1990 — "Temporal and Modal Logic"):   EX φ        ≡ ◇φ   AX φ        ≡ □φ   EF φ        ≡ μX. φ ∨ ◇X   AF φ        ≡ μX. φ ∨ □X   EG φ        ≡ νX. φ ∧ ◇X   AG φ        ≡ νX. φ ∧ □X   E[φ U ψ]    ≡ μX. ψ ∨ (φ ∧ ◇X)   A[φ U ψ]    ≡ μX. ψ ∨ (φ ∧ □X ∧ ◇true)                  (la cláusula `◇true` excluye deadlocks que no han                   alcanzado ψ — coincide con la semántica AU clásica                   donde un camino debe existir hasta ψ). Para evitar capturas accidentales en fórmulas anidadas (`EF (EF p)`), generamos nombres de variable frescos en cada `gensym()`. ============================================================

## Contents

- [`CTLLike`](#ctllike) — Type
- [`ctlToMu`](#ctltomu) — Function

## `CTLLike`

> Type · `logic/profiles/mu-calculus/ctl-translate.ts:26`

Subset de CTL que el translator entiende. Reproduce la forma del AST
 de `src/profiles/ctl/types.ts` para que se pueda pasar tal cual.

```ts
export type CTLLike = | { kind: 'atom'; name: string } | { kind: 'true' } | { kind: 'false' } | { kind: 'not'; arg: CTLLike } | { kind: 'and'; args: CTLLike[] } | { kind: 'or'; args: CTLLike[] } | { kind: 'implies'; left: CTLLike; right: CTLLike } | { kind: 'EX'; arg: CTLLike } | { kind: 'AX'; arg: CTLLike } | { kind: 'EF'; arg: CTLLike } | { kind: 'AF'; arg: CTLLike } | { kind: 'EG'; arg: CTLLike } | { kind: 'AG'; arg: CTLLike } | { kind: 'EU'; left: CTLLike; right: CTLLike } | { kind: 'AU'; left: CTLLike; right: CTLLike };
```


## `ctlToMu`

> Function · `logic/profiles/mu-calculus/ctl-translate.ts:207`

Traduce una fórmula CTL a su equivalente en μ-cálculo.

Acepta el shape estructural del AST de CTL (sin importar la fuente
exacta) — útil para evitar acoplamiento directo con `src/profiles/ctl`.

```ts
export function ctlToMu(ctlFormula:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctlFormula` | `{ kind: string; [k: string]: unknown }` | no |  |

### Returns

`MuFormula` — 

