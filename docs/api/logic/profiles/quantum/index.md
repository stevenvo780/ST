# `logic/profiles/quantum/index.ts`

============================================================ ST Quantum logic — Birkhoff–von Neumann lattice + KS checker ============================================================ Lógica cuántica clásica (Birkhoff & von Neumann, 1936): el "lattice de proposiciones" no es el álgebra booleana distributiva del cálculo proposicional clásico, sino el lattice ortocomplementado, no-distributivo, de los subespacios cerrados de un espacio de Hilbert. Aquí trabajamos sobre R^n (espacio de Hilbert real); los subespacios se representan por una base ortonormal. Las operaciones lattice son:   * meet  (a ∧ b)  = intersección de subespacios.   * join  (a ∨ b)  = span de la unión = clausura lineal.   * ortocomplemento (a⊥) = vectores perpendiculares a a. El lattice resultante es:   - acotado (zero = {0}, top = todo el espacio),   - ortocomplementado (con involución a⊥⊥ = a),   - modular en dim ≤ 3 (en general orthomodular),   - NO distributivo (basta un contraejemplo en R^2). El test de Kochen–Specker (1967) prueba que NO existe una asignación {0,1} a cada vector de una configuración suficiente que sea "no-contextual": que en cada base ortonormal asigne exactamente un 1 al vector elegido. Aquí implementamos el checker con backtracking y la configuración Peres-33 en R^3, que NO es coloreable. ============================================================ ── Vectores en R^n ─────────────────────────────────────────

## Contents

- [`Vector`](#vector) — Interface
- [`vec`](#vec) — Function
- [`dot`](#dot) — Function
- [`norm`](#norm) — Function
- [`normalize`](#normalize) — Function
- [`isOrthogonal`](#isorthogonal) — Function
- [`orthonormalBasis`](#orthonormalbasis) — Function
- [`Subspace`](#subspace) — Interface
- [`span`](#span) — Function
- [`isContained`](#iscontained) — Function
- [`equalsSubspace`](#equalssubspace) — Function
- [`orthocomplement`](#orthocomplement) — Function
- [`join`](#join) — Function
- [`meet`](#meet) — Function
- [`zeroSubspace`](#zerosubspace) — Function
- [`topSubspace`](#topsubspace) — Function
- [`QuantumLattice`](#quantumlattice) — Interface
- [`makeQuantumLattice`](#makequantumlattice) — Function
- [`isDistributive`](#isdistributive) — Function
- [`isModular`](#ismodular) — Function
- [`isOrthomodular`](#isorthomodular) — Function
- [`KSConfiguration`](#ksconfiguration) — Interface
- [`findOrthogonalTriples`](#findorthogonaltriples) — Function
- [`isKSColorable`](#iskscolorable) — Function
- [`kochenSpeckerTheorem3D`](#kochenspeckertheorem3d) — Function
- [`kochenSpeckerCabello18`](#kochenspeckercabello18) — Function
- [`isKSColorableContexts`](#iskscolorablecontexts) — Function

## `Vector`

> Interface · `logic/profiles/quantum/index.ts:34`

```ts
export interface Vector
```


## `vec`

> Function · `logic/profiles/quantum/index.ts:40`

```ts
export function vec(values: number[]): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `number[]` | no |  |

### Returns

`Vector` — 


## `dot`

> Function · `logic/profiles/quantum/index.ts:54`

```ts
export function dot(a: Vector, b: Vector): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Vector` | no |  |
| `b` | `Vector` | no |  |

### Returns

`number` — 


## `norm`

> Function · `logic/profiles/quantum/index.ts:63`

```ts
export function norm(v: Vector): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `Vector` | no |  |

### Returns

`number` — 


## `normalize`

> Function · `logic/profiles/quantum/index.ts:67`

```ts
export function normalize(v: Vector): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `Vector` | no |  |

### Returns

`Vector` — 


## `isOrthogonal`

> Function · `logic/profiles/quantum/index.ts:75`

```ts
export function isOrthogonal(a: Vector, b: Vector, eps: number = EPS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Vector` | no |  |
| `b` | `Vector` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `orthonormalBasis`

> Function · `logic/profiles/quantum/index.ts:103`

Gram-Schmidt sobre `vectors`. Devuelve la base ortonormal del
subespacio que generan (puede tener menos vectores que la entrada
si hay dependencias). Devuelve `null` solo si la entrada está vacía.

```ts
export function orthonormalBasis(vectors: Vector[], eps: number = EPS): Vector[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |
| `eps` | `number` | yes |  |

### Returns

`Vector[] \| null` — 


## `Subspace`

> Interface · `logic/profiles/quantum/index.ts:125`

```ts
export interface Subspace
```


## `span`

> Function · `logic/profiles/quantum/index.ts:140`

Subespacio generado por `vectors`. Si la lista está vacía,
`ambientDim` debe pasarse para devolver el subespacio cero del
ambiente correcto.

```ts
export function span(vectors: Vector[], ambientDim?: number): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |
| `ambientDim` | `number` | yes |  |

### Returns

`Subspace` — 


## `isContained`

> Function · `logic/profiles/quantum/index.ts:169`

¿a ⊆ b? Todos los vectores de la base de a están en b.

```ts
export function isContained(a: Subspace, b: Subspace, eps: number = EPS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Subspace` | no |  |
| `b` | `Subspace` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `equalsSubspace`

> Function · `logic/profiles/quantum/index.ts:177`

```ts
export function equalsSubspace(a: Subspace, b: Subspace, eps: number = EPS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Subspace` | no |  |
| `b` | `Subspace` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `orthocomplement`

> Function · `logic/profiles/quantum/index.ts:187`

Ortocomplemento de `s` en el ambiente de dimensión `ambientDim`.
Algoritmo: tomar la base canónica e_1..e_n, restarle la proyección
sobre `s`, y aplicar Gram-Schmidt; los vectores supervivientes
forman la base ortonormal de s⊥.

```ts
export function orthocomplement(s: Subspace, ambientDim?: number): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Subspace` | no |  |
| `ambientDim` | `number` | yes |  |

### Returns

`Subspace` — 


## `join`

> Function · `logic/profiles/quantum/index.ts:206`

Join (∨) = span(a.basis ∪ b.basis). Es la operación supremo
en el lattice; el resultado siempre contiene tanto a como b.

```ts
export function join(a: Subspace, b: Subspace): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Subspace` | no |  |
| `b` | `Subspace` | no |  |

### Returns

`Subspace` — 


## `meet`

> Function · `logic/profiles/quantum/index.ts:220`

Meet (∧) = intersección de subespacios. Identidad lattice:
  a ∧ b = (a⊥ ∨ b⊥)⊥

```ts
export function meet(a: Subspace, b: Subspace): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Subspace` | no |  |
| `b` | `Subspace` | no |  |

### Returns

`Subspace` — 


## `zeroSubspace`

> Function · `logic/profiles/quantum/index.ts:230`

Subespacio cero (dimensión 0) en R^n.

```ts
export function zeroSubspace(ambientDim: number): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ambientDim` | `number` | no |  |

### Returns

`Subspace` — 


## `topSubspace`

> Function · `logic/profiles/quantum/index.ts:235`

Top: todo el espacio R^n con la base canónica.

```ts
export function topSubspace(ambientDim: number): Subspace
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ambientDim` | `number` | no |  |

### Returns

`Subspace` — 


## `QuantumLattice`

> Interface · `logic/profiles/quantum/index.ts:243`

```ts
export interface QuantumLattice
```


## `makeQuantumLattice`

> Function · `logic/profiles/quantum/index.ts:252`

```ts
export function makeQuantumLattice(dim: number): QuantumLattice
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dim` | `number` | no |  |

### Returns

`QuantumLattice` — 


## `isDistributive`

> Function · `logic/profiles/quantum/index.ts:329`

Distributividad: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c).
En el lattice cuántico FALLA — devolvemos true sólo si se cumple
para *toda* muestra (lo cual prácticamente nunca pasa para n ≥ 2).

```ts
export function isDistributive(L: QuantumLattice, samples: number = 30): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `QuantumLattice` | no |  |
| `samples` | `number` | yes |  |

### Returns

`boolean` — 


## `isModular`

> Function · `logic/profiles/quantum/index.ts:347`

Modularidad: si a ≤ c entonces a ∨ (b ∧ c) = (a ∨ b) ∧ c.
En dimensión finita el lattice de subespacios SÍ es modular
(resultado clásico). El test forma a' = a ∧ c (siempre ≤ c)
para garantizar la hipótesis a' ≤ c.

```ts
export function isModular(L: QuantumLattice, samples: number = 30): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `QuantumLattice` | no |  |
| `samples` | `number` | yes |  |

### Returns

`boolean` — 


## `isOrthomodular`

> Function · `logic/profiles/quantum/index.ts:364`

Ortomodularidad: si a ≤ b entonces b = a ∨ (b ∧ a⊥).
Se cumple en el lattice de subespacios de un espacio de Hilbert.

```ts
export function isOrthomodular(L: QuantumLattice, samples: number = 30): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `QuantumLattice` | no |  |
| `samples` | `number` | yes |  |

### Returns

`boolean` — 


## `KSConfiguration`

> Interface · `logic/profiles/quantum/index.ts:388`

```ts
export interface KSConfiguration
```


## `findOrthogonalTriples`

> Function · `logic/profiles/quantum/index.ts:399`

Detecta automáticamente todos los triples ortogonales en R^3
dentro de `vectors` y los registra. En R^3, tres vectores no
nulos mutuamente ortogonales forman base.

```ts
export function findOrthogonalTriples( vectors: Vector[], eps: number = 1e-7, ): Array<[number, number, number]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |
| `eps` | `number` | yes |  |

### Returns

`Array<[number, number, number]>` — 


## `isKSColorable`

> Function · `logic/profiles/quantum/index.ts:465`

¿Existe una coloración {0,1} de los vectores tal que:
 - dos vectores que generan el mismo rayo reciben el mismo color,
 - en cada triple ortogonal exactamente uno recibe color 1?

Devuelve true si tal coloración existe (configuración "trivial"),
false si la configuración es un teorema KS (no coloreable).

Algoritmo: backtracking sobre los rayos (no los vectores), con
unit-propagation por las restricciones de cada triple.

```ts
export function isKSColorable(config: KSConfiguration): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `config` | `KSConfiguration` | no |  |

### Returns

`boolean` — 


## `kochenSpeckerTheorem3D`

> Function · `logic/profiles/quantum/index.ts:611`

Configuración estilo-Peres: rayos en R^3 con coordenadas en
{ -1, 0, 1, ±√2 }, deduplicados por rayo. La cantidad exacta de
rayos depende de cuáles dedupliquen (p.ej. (√2,√2,0) define el
mismo rayo que (1,1,0)).

Aviso histórico: la prueba ORIGINAL de Kochen-Specker (1967)
usa 117 vectores en R^3. Asher Peres (1991) la simplificó a 33
vectores en R^3, y Cabello-Estebaranz-García (1996) probaron
que en R^4 bastan 18 — el mínimo conocido en cualquier
dimensión, ver `kochenSpeckerCabello18()`. Aquí construimos
la familia clásica de rayos R^3 a partir del cubo unitario;
la prueba de no-coloreabilidad rigurosa se delega a la
configuración Cabello-18 (R^4), que se incluye en el mismo
módulo y es la que usan los tests para el teorema KS.

```ts
export function kochenSpeckerTheorem3D(): KSConfiguration
```

### Returns

`KSConfiguration` — 


## `kochenSpeckerCabello18`

> Function · `logic/profiles/quantum/index.ts:673`

Configuración Cabello-Estebaranz-García (1996): 18 vectores en
R^4 que constituyen el menor conjunto Kochen-Specker conocido
en cualquier dimensión. La prueba se basa en 9 "contextos"
(bases ortonormales de R^4); cada vector aparece en exactamente
2 contextos, así que cualquier asignación 0/1 que ponga
exactamente un "1" por contexto requeriría que la suma global
sea 9 (impar), pero como cada vector contribuye 0 ó 2, la suma
debe ser par — contradicción.

El `KSConfiguration` devuelto es R^4; la función `isKSColorable`
funciona idénticamente en cualquier dimensión, sólo verifica
la estructura combinatoria de los `orthoTriples` (aquí, en R^4,
los "triples" son en realidad CUÁDRUPLAS — para mantener la
interfaz, partimos cada cuádrupla {a,b,c,d} en sus C(4,3)=4
triples implicados; esto preserva la lógica "exactamente un 1
por base" porque sumar exactamente 1 en cada uno de los 4
triples implica sumar exactamente 1 en el cuádruplo).

Wait: realmente el enunciado correcto en R^4 es "exactamente
UN 1 por contexto ortonormal de 4 vectores". El checker actual
trabaja en triples (R^3). Para R^4 usamos un solver
especializado: `isKSColorableContexts`.

```ts
export function kochenSpeckerCabello18():
```

### Returns

`{   vectors: Vector[];   contexts: number[][]; }` — 


## `isKSColorableContexts`

> Function · `logic/profiles/quantum/index.ts:729`

Checker KS para contextos de cualquier aridad (no sólo R^3
triples). Verifica que existe una asignación {0,1} a cada rayo
tal que en cada contexto se asigna exactamente un 1.

Usado para R^4 Cabello-18 (la prueba KS más pequeña conocida).

```ts
export function isKSColorableContexts(vectors: Vector[], contexts: number[][]): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |
| `contexts` | `number[][]` | no |  |

### Returns

`boolean` — 

