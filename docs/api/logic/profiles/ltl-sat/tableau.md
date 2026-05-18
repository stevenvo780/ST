# `logic/profiles/ltl-sat/tableau.ts`

============================================================ ST LTL-SAT — Tableau / construcción de autómata estilo Büchi ============================================================ Procedimiento de decisión clásico (Wolper, Vardi-Wolper):   1. Normalizar a NNF (negaciones empujadas hasta átomos).   2. Cerrar bajo subfórmulas y duales.   3. Generar "atoms" = subconjuntos máximalmente consistentes      de la clausura que cumplen las reglas locales de tableau      (α/β rules: una ∧ requiere ambas conyuntas; una ∨      requiere ≥1 disyunta; etc.).   4. Construir transición: atom A → atom B sii cada Xφ ∈ A      cumple φ ∈ B (y nada más restringe el siguiente estado).   5. Decidir SAT: existe lazo accesible desde un átomo que      contiene φ tal que cada eventualidad (F ψ o φ U ψ) se      cumple en el ciclo (presencia de ψ). El procedimiento es decidible: 2^O(|φ|) atoms, búsqueda de lazo en el grafo resultante (NL en el tamaño del grafo). ============================================================

## Contents

- [`toNNF`](#tonnf) — Function
- [`closure`](#closure) — Function
- [`Atom`](#atom) — Interface
- [`enumerateAtoms`](#enumerateatoms) — Function
- [`transitions`](#transitions) — Function
- [`Eventuality`](#eventuality) — Interface
- [`eventualitiesIn`](#eventualitiesin) — Function
- [`describeAtom`](#describeatom) — Function
- [`describeFormula`](#describeformula) — Function

## `toNNF`

> Function · `logic/profiles/ltl-sat/tableau.ts:26`

```ts
export function toNNF(f: LTLFormula): LTLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`LTLFormula` — 


## `closure`

> Function · `logic/profiles/ltl-sat/tableau.ts:92`

```ts
export function closure(f: LTLFormula): LTLFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`LTLFormula[]` — 


## `Atom`

> Interface · `logic/profiles/ltl-sat/tableau.ts:141`

```ts
export interface Atom
```


## `enumerateAtoms`

> Function · `logic/profiles/ltl-sat/tableau.ts:233`

```ts
export function enumerateAtoms(closureFormulas: LTLFormula[]): Atom[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `closureFormulas` | `LTLFormula[]` | no |  |

### Returns

`Atom[]` — 


## `transitions`

> Function · `logic/profiles/ltl-sat/tableau.ts:308`

```ts
export function transitions(atoms: Atom[]): Map<number, number[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atoms` | `Atom[]` | no |  |

### Returns

`Map<number, number[]>` — 


## `Eventuality`

> Interface · `logic/profiles/ltl-sat/tableau.ts:339`

```ts
export interface Eventuality
```


## `eventualitiesIn`

> Function · `logic/profiles/ltl-sat/tableau.ts:346`

```ts
export function eventualitiesIn(atom: Atom): Eventuality[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atom` | `Atom` | no |  |

### Returns

`Eventuality[]` — 


## `describeAtom`

> Function · `logic/profiles/ltl-sat/tableau.ts:358`

```ts
export function describeAtom(a: Atom): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Atom` | no |  |

### Returns

`string` — 


## `describeFormula`

> Function · `logic/profiles/ltl-sat/tableau.ts:365`

```ts
export function describeFormula(f: LTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`string` — 

