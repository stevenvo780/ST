# `logic/profiles/ctl/check.ts`

============================================================ CTL model checker — algoritmo clásico de labelling por punto fijo. ============================================================ Complejidad O(|φ| · (|S| + |R|)) sobre modelos finitos. EX/AX: paso local sobre la relación R. EF/AF: punto fijo mínimo (lfp). EG/AG: punto fijo máximo (gfp). EU:    punto fijo mínimo de E[A U B]. AU:    punto fijo mínimo de A[A U B]  (fórmula con sucesores universales). Reducciones equivalentes (no usadas en el camino principal por eficiencia y claridad de witness):   AX φ  ≡ ¬EX ¬φ   AF φ  ≡ ¬EG ¬φ   AG φ  ≡ ¬EF ¬φ ============================================================

## Contents

- [`modelCheckCTL`](#modelcheckctl) — Function
- [`satisfiesCTL`](#satisfiesctl) — Function

## `modelCheckCTL`

> Function · `logic/profiles/ctl/check.ts:345`

Model checking de Computation Tree Logic.
Devuelve un mapa `stateId → φ se cumple en ese estado`.

```ts
export function modelCheckCTL(M: KripkeStructure, phi: CTLFormula): Map<string, boolean>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `KripkeStructure` | no |  |
| `phi` | `CTLFormula` | no |  |

### Returns

`Map<string, boolean>` — 


## `satisfiesCTL`

> Function · `logic/profiles/ctl/check.ts:355`

`M ⊨ φ` cuando φ se cumple en todos los estados iniciales.
Si `initial` está vacío, devuelve `true` por vacuidad (consistente con
la lectura "no hay contraejemplo en S0").

```ts
export function satisfiesCTL(M: KripkeStructure, phi: CTLFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `KripkeStructure` | no |  |
| `phi` | `CTLFormula` | no |  |

### Returns

`boolean` — 

