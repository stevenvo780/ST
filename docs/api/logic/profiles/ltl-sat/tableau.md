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

> Function · `logic/profiles/ltl-sat/tableau.ts:27`

Convierte una fórmula LTL a Negation Normal Form (NNF): negaciones empujadas hasta átomos.

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

> Function · `logic/profiles/ltl-sat/tableau.ts:97`

Calcula la clausura de subfórmulas de `f` (incluyendo duales de F, G, U, R via X).
El conjunto resultado es el universo de fórmulas sobre el que se construyen los atoms.

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

> Interface · `logic/profiles/ltl-sat/tableau.ts:150`

Subconjunto de la clausura localmente consistente con las reglas de tableau.
Cada `Atom` representa un estado posible del autómata de Büchi implícito.

```ts
export interface Atom
```


## `enumerateAtoms`

> Function · `logic/profiles/ltl-sat/tableau.ts:248`

Genera todos los atoms localmente consistentes a partir de la clausura dada.
Usa backtracking con poda de contradicciones átomo/¬átomo.
Límite de seguridad: 200 000 atoms para evitar explosión exponencial.

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

> Function · `logic/profiles/ltl-sat/tableau.ts:328`

Construye la relación de transición entre atoms.
A → B sii para toda Xφ ∈ A se cumple φ ∈ B.

```ts
export function transitions(atoms: Atom[]): Map<number, number[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atoms` | `Atom[]` | no |  |

### Returns

`Map<number, number[]>` — Mapa de id de atom origen a lista de ids de atoms destino.


## `Eventuality`

> Interface · `logic/profiles/ltl-sat/tableau.ts:363`

Eventualidad LTL que debe cumplirse dentro del lazo aceptante.
F ψ y φ U ψ son eventualidades; se satisfacen cuando ψ aparece en algún estado del ciclo.

```ts
export interface Eventuality
```


## `eventualitiesIn`

> Function · `logic/profiles/ltl-sat/tableau.ts:371`

Extrae todas las eventualidades (F ψ y φ U ψ) presentes en un atom.

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

> Function · `logic/profiles/ltl-sat/tableau.ts:384`

Describe un atom por sus literales: "p,¬q" o "∅" si está vacío.

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

> Function · `logic/profiles/ltl-sat/tableau.ts:392`

Alias de `formulaToString` para uso en contextos de depuración del tableau.

```ts
export function describeFormula(f: LTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`string` — 

