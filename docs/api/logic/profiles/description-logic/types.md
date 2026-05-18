# `logic/profiles/description-logic/types.ts`

============================================================ ST Description Logic — ALC types ============================================================ ALC: el fragmento base de OWL/DL. Conceptos C, roles R (binarios), individuos a.   ⊤ ⊥   top / bottom   ¬C    complemento   C ⊓ D intersección   C ⊔ D unión   ∃R.C  restricción existencial   ∀R.C  restricción de valor ============================================================

## Contents

- [`DLConceptKind`](#dlconceptkind) — Type
- [`DLConcept`](#dlconcept) — Interface
- [`DLAxiomKind`](#dlaxiomkind) — Type
- [`DLAxiom`](#dlaxiom) — Interface
- [`DLKnowledgeBase`](#dlknowledgebase) — Interface
- [`TOP`](#top) — Const
- [`BOTTOM`](#bottom) — Const
- [`atomic`](#atomic) — Function
- [`not`](#not) — Function
- [`and`](#and) — Function
- [`or`](#or) — Function
- [`exists`](#exists) — Function
- [`forall`](#forall) — Function
- [`subsumes`](#subsumes) — Function
- [`equivalent`](#equivalent) — Function
- [`instance`](#instance) — Function
- [`roleInstance`](#roleinstance) — Function
- [`emptyKB`](#emptykb) — Function

## `DLConceptKind`

> Type · `logic/profiles/description-logic/types.ts:14`

```ts
export type DLConceptKind = | 'top' | 'bottom' | 'atomic' | 'not' | 'and' | 'or' | 'exists' | 'forall';
```


## `DLConcept`

> Interface · `logic/profiles/description-logic/types.ts:24`

```ts
export interface DLConcept
```


## `DLAxiomKind`

> Type · `logic/profiles/description-logic/types.ts:36`

```ts
export type DLAxiomKind = 'subsumes' | 'equivalent' | 'instance' | 'role-instance';
```


## `DLAxiom`

> Interface · `logic/profiles/description-logic/types.ts:38`

```ts
export interface DLAxiom
```


## `DLKnowledgeBase`

> Interface · `logic/profiles/description-logic/types.ts:51`

```ts
export interface DLKnowledgeBase
```


## `TOP`

> Const · `logic/profiles/description-logic/types.ts:60`

```ts
const TOP: DLConcept
```


## `BOTTOM`

> Const · `logic/profiles/description-logic/types.ts:61`

```ts
const BOTTOM: DLConcept
```


## `atomic`

> Function · `logic/profiles/description-logic/types.ts:63`

```ts
export function atomic(name: string): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`DLConcept` — 


## `not`

> Function · `logic/profiles/description-logic/types.ts:67`

```ts
export function not(c: DLConcept): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `DLConcept` | no |  |

### Returns

`DLConcept` — 


## `and`

> Function · `logic/profiles/description-logic/types.ts:71`

```ts
export function and(...args: DLConcept[]): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `DLConcept[]` | no |  |

### Returns

`DLConcept` — 


## `or`

> Function · `logic/profiles/description-logic/types.ts:77`

```ts
export function or(...args: DLConcept[]): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `DLConcept[]` | no |  |

### Returns

`DLConcept` — 


## `exists`

> Function · `logic/profiles/description-logic/types.ts:83`

```ts
export function exists(role: string, c: DLConcept): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `role` | `string` | no |  |
| `c` | `DLConcept` | no |  |

### Returns

`DLConcept` — 


## `forall`

> Function · `logic/profiles/description-logic/types.ts:87`

```ts
export function forall(role: string, c: DLConcept): DLConcept
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `role` | `string` | no |  |
| `c` | `DLConcept` | no |  |

### Returns

`DLConcept` — 


## `subsumes`

> Function · `logic/profiles/description-logic/types.ts:91`

```ts
export function subsumes(left: DLConcept, right: DLConcept): DLAxiom
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `DLConcept` | no |  |
| `right` | `DLConcept` | no |  |

### Returns

`DLAxiom` — 


## `equivalent`

> Function · `logic/profiles/description-logic/types.ts:95`

```ts
export function equivalent(left: DLConcept, right: DLConcept): DLAxiom
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `DLConcept` | no |  |
| `right` | `DLConcept` | no |  |

### Returns

`DLAxiom` — 


## `instance`

> Function · `logic/profiles/description-logic/types.ts:99`

```ts
export function instance(individual: string, concept: DLConcept): DLAxiom
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `individual` | `string` | no |  |
| `concept` | `DLConcept` | no |  |

### Returns

`DLAxiom` — 


## `roleInstance`

> Function · `logic/profiles/description-logic/types.ts:103`

```ts
export function roleInstance(from: string, role: string, to: string): DLAxiom
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `from` | `string` | no |  |
| `role` | `string` | no |  |
| `to` | `string` | no |  |

### Returns

`DLAxiom` — 


## `emptyKB`

> Function · `logic/profiles/description-logic/types.ts:107`

```ts
export function emptyKB(): DLKnowledgeBase
```

### Returns

`DLKnowledgeBase` — 

