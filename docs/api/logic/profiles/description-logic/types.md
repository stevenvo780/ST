# `logic/profiles/description-logic/types.ts`

Variantes sintácticas de un concepto ALC.

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

> Type · `logic/profiles/description-logic/types.ts:15`

Variantes sintácticas de un concepto ALC.

```ts
export type DLConceptKind = | 'top' | 'bottom' | 'atomic' | 'not' | 'and' | 'or' | 'exists' | 'forall';
```


## `DLConcept`

> Interface · `logic/profiles/description-logic/types.ts:25`

```ts
export interface DLConcept
```


## `DLAxiomKind`

> Type · `logic/profiles/description-logic/types.ts:38`

Variantes de axioma ALC: subsunción, equivalencia y aserciones de instancia.

```ts
export type DLAxiomKind = 'subsumes' | 'equivalent' | 'instance' | 'role-instance';
```


## `DLAxiom`

> Interface · `logic/profiles/description-logic/types.ts:40`

```ts
export interface DLAxiom
```


## `DLKnowledgeBase`

> Interface · `logic/profiles/description-logic/types.ts:53`

```ts
export interface DLKnowledgeBase
```


## `TOP`

> Const · `logic/profiles/description-logic/types.ts:63`

Concepto universal ⊤ (todo individuo lo satisface).

```ts
const TOP: DLConcept
```


## `BOTTOM`

> Const · `logic/profiles/description-logic/types.ts:65`

Concepto vacío ⊥ (ningún individuo lo satisface).

```ts
const BOTTOM: DLConcept
```


## `atomic`

> Function · `logic/profiles/description-logic/types.ts:68`

Crea un concepto atómico con el nombre dado.

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

> Function · `logic/profiles/description-logic/types.ts:73`

Negación de un concepto: ¬C.

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

> Function · `logic/profiles/description-logic/types.ts:78`

Intersección de conceptos: C ⊓ D. Sin argumentos devuelve ⊤.

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

> Function · `logic/profiles/description-logic/types.ts:85`

Unión de conceptos: C ⊔ D. Sin argumentos devuelve ⊥.

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

> Function · `logic/profiles/description-logic/types.ts:92`

Restricción existencial: ∃role.C.

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

> Function · `logic/profiles/description-logic/types.ts:97`

Restricción de valor: ∀role.C.

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

> Function · `logic/profiles/description-logic/types.ts:102`

Axioma TBox de subsunción: left ⊑ right.

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

> Function · `logic/profiles/description-logic/types.ts:107`

Axioma TBox de equivalencia: left ≡ right.

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

> Function · `logic/profiles/description-logic/types.ts:112`

Aserción ABox: `individual` pertenece a `concept`.

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

> Function · `logic/profiles/description-logic/types.ts:117`

Aserción de rol ABox: (from, to) ∈ role.

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

> Function · `logic/profiles/description-logic/types.ts:122`

Devuelve una base de conocimiento vacía (TBox y ABox vacíos).

```ts
export function emptyKB(): DLKnowledgeBase
```

### Returns

`DLKnowledgeBase` — 

