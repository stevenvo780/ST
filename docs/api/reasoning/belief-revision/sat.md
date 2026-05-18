# `reasoning/belief-revision/sat.ts`

============================================================ ST Belief Revision — Mini SAT por enumeración (clásico propositional) ============================================================ Para las fórmulas y belief sets manejados por AGM, el número de átomos típico es pequeño (< 20). Usamos enumeración 2^n directa: simple, exacto y suficiente para tests y uso pedagógico. Para casos grandes el caller debería usar el SAT solver de st-lang (CDCL).

## Contents

- [`Valuation`](#valuation) — Type
- [`evalFormula`](#evalformula) — Function
- [`isSatisfiable`](#issatisfiable) — Function
- [`entailsFormula`](#entailsformula) — Function
- [`areEquivalent`](#areequivalent) — Function

## `Valuation`

> Type · `reasoning/belief-revision/sat.ts:13`

```ts
export type Valuation = Record<string, boolean>;
```


## `evalFormula`

> Function · `reasoning/belief-revision/sat.ts:16`

Evalúa una fórmula bajo una valuación clásica.

```ts
export function evalFormula(f: PropFormula, v: Valuation): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `PropFormula` | no |  |
| `v` | `Valuation` | no |  |

### Returns

`boolean` — 


## `isSatisfiable`

> Function · `reasoning/belief-revision/sat.ts:61`

¿Es satisfactible la conjunción de `formulas`?
Conjunto vacío → trivialmente satisfactible.

```ts
export function isSatisfiable(formulas: PropFormula[]): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formulas` | `PropFormula[]` | no |  |

### Returns

`boolean` — 


## `entailsFormula`

> Function · `reasoning/belief-revision/sat.ts:77`

¿K (conjunción de fórmulas) implica φ?
Equivalente a: K ∧ ¬φ es insatisfactible.

```ts
export function entailsFormula(K: PropFormula[], phi: PropFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `PropFormula[]` | no |  |
| `phi` | `PropFormula` | no |  |

### Returns

`boolean` — 


## `areEquivalent`

> Function · `reasoning/belief-revision/sat.ts:85`

¿Son φ y ψ lógicamente equivalentes? (φ ↔ ψ es tautología)

```ts
export function areEquivalent(a: PropFormula, b: PropFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `PropFormula` | no |  |
| `b` | `PropFormula` | no |  |

### Returns

`boolean` — 

