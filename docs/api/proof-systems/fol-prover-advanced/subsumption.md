# `proof-systems/fol-prover-advanced/subsumption.ts`

## Contents

- [`subsumes`](#subsumes) — Function
- [`removeSubsumed`](#removesubsumed) — Function
- [`clausesAlphaEqual`](#clausesalphaequal) — Function
- [`unitPreference`](#unitpreference) — Function

## `subsumes`

> Function · `proof-systems/fol-prover-advanced/subsumption.ts:12`

Subsumption clásico: c1 subsume c2 si existe una sustitución σ tal que
cada literal de c1·σ aparece en c2.

Estrategia: backtracking sobre el matching de cada literal de c1 contra c2.
Costoso en el caso general, pero acotado: cláusulas en pruebas reales
tienen pocas literales.

```ts
export function subsumes(c1: FOLClause, c2: FOLClause): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c1` | `FOLClause` | no |  |
| `c2` | `FOLClause` | no |  |

### Returns

`boolean` — 


## `removeSubsumed`

> Function · `proof-systems/fol-prover-advanced/subsumption.ts:95`

Filtra cláusulas dejando sólo las no-subsumidas por otras del mismo set.
Conserva orden de la primera aparición.

```ts
export function removeSubsumed(clauses: FOLClause[]): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `FOLClause[]` | no |  |

### Returns

`FOLClause[]` — 


## `clausesAlphaEqual`

> Function · `proof-systems/fol-prover-advanced/subsumption.ts:124`

Igualdad sintáctica módulo orden de literales y renombre de variables
(alpha-equivalencia simple). Suficiente para detectar duplicados producidos
por resolución sobre instancias renombradas.

```ts
export function clausesAlphaEqual(a: FOLClause, b: FOLClause): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLClause` | no |  |
| `b` | `FOLClause` | no |  |

### Returns

`boolean` — 


## `unitPreference`

> Function · `proof-systems/fol-prover-advanced/subsumption.ts:146`

Reordena cláusulas para que las unitarias (1 literal) vayan primero.
Patrón "unit preference" — reduce drásticamente el espacio de búsqueda en
problemas tipo modus-ponens encadenado.

```ts
export function unitPreference(clauses: FOLClause[]): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `FOLClause[]` | no |  |

### Returns

`FOLClause[]` — 

