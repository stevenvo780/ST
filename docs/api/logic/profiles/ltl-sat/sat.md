# `logic/profiles/ltl-sat/sat.ts`

============================================================ ST LTL-SAT — Decisor SAT vía búsqueda de lazo aceptante ============================================================ Algoritmo (Vardi-Wolper en versión explícita):   1. NNF + clausura + enumerar atoms localmente consistentes.   2. Construir relación de transición sobre atoms.   3. Filtrar atoms iniciales: aquellos que contienen φ.   4. SAT(φ) ⇔ existe lazo (prefix → loop) accesible desde un      atom inicial donde, para cada eventualidad presente en      cualquier atom del lazo, hay un atom del lazo donde el      "witness" está presente. La construcción es exponencial en |φ|; suficiente para fórmulas pedagógicas y tests (≤ ~15 operadores). No es competitivo con SPOT, pero es correcto y didáctico. ============================================================

## Contents

- [`isSatisfiable`](#issatisfiable) — Function
- [`isValid`](#isvalid) — Function
- [`toBuchi`](#tobuchi) — Function

## `isSatisfiable`

> Function · `logic/profiles/ltl-sat/sat.ts:130`

```ts
export function isSatisfiable(phi: LTLFormula): SatResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `LTLFormula` | no |  |

### Returns

`SatResult` — 


## `isValid`

> Function · `logic/profiles/ltl-sat/sat.ts:141`

```ts
export function isValid(phi: LTLFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `LTLFormula` | no |  |

### Returns

`boolean` — 


## `toBuchi`

> Function · `logic/profiles/ltl-sat/sat.ts:149`

```ts
export function toBuchi(phi: LTLFormula):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `LTLFormula` | no |  |

### Returns

`{ states: number; accepting: number }` — 

