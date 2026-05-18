# `logic/profiles/description-logic/tableau.ts`

============================================================ ST Description Logic — Tableau de decisión para ALC ============================================================ Procedimiento estándar de tableau con blocking (subset blocking) para garantizar terminación con TBox cíclica. Estado de la rama:   - individuals: id -> Set<conceptHash> (labels)   - roles:       roleName -> Array<[from, to]>   - blocked:     id -> id  (ancestro que bloquea, si aplica) Reglas:   ⊓: añade ambos children   ⊔: bifurca   ∃R.C: si no hay R-sucesor con C, crea fresh y, R(x,y), C(y)   ∀R.C: para todo R(x,y), añade C(y) Clash: A ∈ labels(x) y ¬A ∈ labels(x); o ⊥ ∈ labels(x). TBox internalization: cada axioma C ⊑ D se convierte en el concepto axiom = ¬C ⊔ D, que se añade a cada individuo (existente y futuro). C ≡ D se desdobla en C ⊑ D y D ⊑ C. ============================================================

## Contents

- [`isSatisfiable`](#issatisfiable) — Function
- [`isSubsumed`](#issubsumed) — Function
- [`isInstance`](#isinstance) — Function
- [`classify`](#classify) — Function

## `isSatisfiable`

> Function · `logic/profiles/description-logic/tableau.ts:377`

Decide si `concept` es satisfacible (eventualmente bajo la KB).
Construye un tableau iniciando con un individuo fresco x : concept,
y aplica las reglas hasta cerrar todas las ramas o encontrar una abierta.

```ts
export function isSatisfiable(concept: DLConcept, kb?: DLKnowledgeBase): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `concept` | `DLConcept` | no |  |
| `kb` | `DLKnowledgeBase` | yes |  |

### Returns

`boolean` — 


## `isSubsumed`

> Function · `logic/profiles/description-logic/tableau.ts:399`

Decide si `sub ⊑ sup` (bajo la KB). Equivale a: ¬(sub ⊓ ¬sup) es válida,
o sea, `sub ⊓ ¬sup` es insatisfacible.

```ts
export function isSubsumed(sub: DLConcept, sup: DLConcept, kb?: DLKnowledgeBase): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sub` | `DLConcept` | no |  |
| `sup` | `DLConcept` | no |  |
| `kb` | `DLKnowledgeBase` | yes |  |

### Returns

`boolean` — 


## `isInstance`

> Function · `logic/profiles/description-logic/tableau.ts:408`

Decide si `individual` es instancia de `concept` bajo la KB.
Equivale a: KB ∪ {individual : ¬concept} es inconsistente.

```ts
export function isInstance(individual: string, concept: DLConcept, kb: DLKnowledgeBase): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `individual` | `string` | no |  |
| `concept` | `DLConcept` | no |  |
| `kb` | `DLKnowledgeBase` | no |  |

### Returns

`boolean` — 


## `classify`

> Function · `logic/profiles/description-logic/tableau.ts:432`

Clasificación: produce taxonomía de conceptos atómicos de la KB.
Devuelve Map<conceptName, Set<conceptName>> donde `Set` contiene
los conceptos atómicos que subsumen al name (es decir: superconceptos).
⊤ y ⊥ se incluyen siempre.

```ts
export function classify(kb: DLKnowledgeBase): Map<string, Set<string>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `kb` | `DLKnowledgeBase` | no |  |

### Returns

`Map<string, Set<string>>` — 

