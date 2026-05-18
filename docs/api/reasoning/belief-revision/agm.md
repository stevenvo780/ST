# `reasoning/belief-revision/agm.ts`

============================================================ ST Belief Revision — Operadores AGM ============================================================ Implementa los tres operadores básicos AGM sobre belief sets:   - expand     (K + φ): unión sintáctica.   - contract   (K - φ): partial-meet contraction guiada por entrenchment.   - revise     (K * φ): identidad de Levi → (K - ¬φ) + φ. Verificación de postulados básicos:   - K1 (cierre lógico): aquí trabajamos sobre belief BASES (no cierres     deductivos completos). `verifyClosure` chequea que toda fórmula que     `entails(K, φ)` produzca el mismo veredicto que K (idempotencia     semántica). Es una versión finitizada del postulado original.   - K2 (éxito): φ ∈ Cn(K * φ).   - K3 (inclusión): K * φ ⊆ K + φ. Las fórmulas se almacenan como CADENAS para preservar la representación sintáctica que el usuario provee; las operaciones lógicas (entailment, consistencia) parsean a AST cuando hace falta.

## Contents

- [`newBeliefSet`](#newbeliefset) — Function
- [`isConsistent`](#isconsistent) — Function
- [`entails`](#entails) — Function
- [`expand`](#expand) — Function
- [`contract`](#contract) — Function
- [`revise`](#revise) — Function
- [`verifyClosure`](#verifyclosure) — Function
- [`verifySuccess`](#verifysuccess) — Function
- [`verifyInclusion`](#verifyinclusion) — Function
- [`beliefSetToArray`](#beliefsettoarray) — Function
- [`canonicalize`](#canonicalize) — Function

## `newBeliefSet`

> Function · `reasoning/belief-revision/agm.ts:63`

Construye un belief set a partir de un arreglo de fórmulas iniciales.
Duplicados sintácticos se colapsan automáticamente.

```ts
export function newBeliefSet(initial: string[]): BeliefSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `initial` | `string[]` | no |  |

### Returns

`BeliefSet` — 


## `isConsistent`

> Function · `reasoning/belief-revision/agm.ts:76`

¿Es K consistente? (la conjunción de todas sus fórmulas es satisfactible)

```ts
export function isConsistent(K: BeliefSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |

### Returns

`boolean` — 


## `entails`

> Function · `reasoning/belief-revision/agm.ts:84`

¿K implica lógicamente φ?
φ se pasa como cadena (se parsea con la misma sintaxis que las creencias).

```ts
export function entails(K: BeliefSet, phi: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |

### Returns

`boolean` — 


## `expand`

> Function · `reasoning/belief-revision/agm.ts:99`

Expansion: K + φ.
Definición AGM: K + φ = Cn(K ∪ {φ}).
Sobre belief bases: añadimos φ al conjunto sintáctico (sin clausurar).
NO garantiza consistencia (el caller suele preferir `revise` en su lugar).

```ts
export function expand(K: BeliefSet, phi: string): BeliefSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |

### Returns

`BeliefSet` — 


## `contract`

> Function · `reasoning/belief-revision/agm.ts:163`

Contraction: K - φ.
Definición AGM: K - φ es el mayor subconjunto de K que NO implica φ.

Casos especiales:
- Si φ es tautología (vacuidad K-5): K - φ = K (no se puede remover).
- Si K no implica φ: K - φ = K.
- En cualquier otro caso: se aplica partial-meet con `ordering`.

El parámetro opcional `ordering` define el "epistemic entrenchment":
fórmulas con mayor número son más arraigadas y se preservan primero.

```ts
export function contract(K: BeliefSet, phi: string, ordering?: PartialOrder): BeliefSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |
| `ordering` | `PartialOrder` | yes |  |

### Returns

`BeliefSet` — 


## `revise`

> Function · `reasoning/belief-revision/agm.ts:191`

Revision: K * φ.
Identidad de Levi: K * φ = (K - ¬φ) + φ.

Garantiza:
- K2 (éxito): φ ∈ K * φ.
- K5 (consistencia): si φ es consistente, K * φ es consistente.

El parámetro `ordering` se usa para la contracción interna por ¬φ.

```ts
export function revise(K: BeliefSet, phi: string, ordering?: PartialOrder): BeliefSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |
| `ordering` | `PartialOrder` | yes |  |

### Returns

`BeliefSet` — 


## `verifyClosure`

> Function · `reasoning/belief-revision/agm.ts:214`

Verifica una versión finitizada del postulado K1 (cierre lógico):
para cada φ ∈ K, K entails φ (autocontención lógica).
En belief bases puras esto es trivial; aquí adicionalmente exigimos
que K sea consistente o que cada fórmula sea bien-formada.

```ts
export function verifyClosure(K: BeliefSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |

### Returns

`boolean` — 


## `verifySuccess`

> Function · `reasoning/belief-revision/agm.ts:226`

K2 (éxito): φ ∈ Cn(K * φ).
Tras revisar por φ, el belief set debe implicar φ.

```ts
export function verifySuccess(K_revised: BeliefSet, phi: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K_revised` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |

### Returns

`boolean` — 


## `verifyInclusion`

> Function · `reasoning/belief-revision/agm.ts:236`

K3 (inclusión): K * φ ⊆ K + φ.
Toda fórmula derivable de K * φ debe ser derivable de K + φ.
Para belief bases finitas, basta verificar que cada formula sintáctica
de K_revised sea derivable desde K ∪ {φ}.

```ts
export function verifyInclusion(K_revised: BeliefSet, K: BeliefSet, phi: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K_revised` | `BeliefSet` | no |  |
| `K` | `BeliefSet` | no |  |
| `phi` | `string` | no |  |

### Returns

`boolean` — 


## `beliefSetToArray`

> Function · `reasoning/belief-revision/agm.ts:250`

Helper utilitario: devuelve K como arreglo ordenado de fórmulas
(útil para tests, debugging, hashing estable).

```ts
export function beliefSetToArray(K: BeliefSet): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |

### Returns

`string[]` — 


## `canonicalize`

> Function · `reasoning/belief-revision/agm.ts:258`

Serialización canónica de un belief set: ordena alfabéticamente y
normaliza cada fórmula vía `formulaToString` sobre su AST parseado.

```ts
export function canonicalize(K: BeliefSet): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `BeliefSet` | no |  |

### Returns

`string` — 

