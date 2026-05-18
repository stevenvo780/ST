# `runtime/bisimulation/operations.ts`

============================================================ Operaciones derivadas sobre bisimulación. ============================================================   - areBisimilar(M, s, t)       : ¿s y t están en el mismo bloque?   - quotientLTS(M)              : LTS mínimo módulo bisimulación.   - strongBisimulation(M1, M2)  : ¿dos LTS son fuertemente bisimilares?   - weakBisimulation(M, τ)      : partición que oculta transiciones τ. Para weakBisimulation usamos la construcción estándar:   1. saturar: ⇒ = τ* (con loops auto-incluidos)   2. para cada arista s -a-> t con a ≠ τ, agregar todas las composiciones      τ* ; a ; τ*   3. para a = τ, agregar todos los pares (s, t) tales que s ⇒ t  (incluido      el reflexivo) bajo la acción τ.   4. Aplicar Paige-Tarjan sobre el LTS saturado. El resultado es la partición de bisimulación débil (~_w o "observational equivalence" de Milner). ============================================================

## Contents

- [`areBisimilar`](#arebisimilar) — Function
- [`quotientLTS`](#quotientlts) — Function
- [`strongBisimulation`](#strongbisimulation) — Function
- [`weakBisimulation`](#weakbisimulation) — Function

## `areBisimilar`

> Function · `runtime/bisimulation/operations.ts:28`

Devuelve `true` si los estados `s` y `t` caen en el mismo bloque de la
partición de bisimulación fuerte. Lanza si alguno no existe en M.

```ts
export function areBisimilar(lts: LTS, s: string, t: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lts` | `LTS` | no |  |
| `s` | `string` | no |  |
| `t` | `string` | no |  |

### Returns

`boolean` — 


## `quotientLTS`

> Function · `runtime/bisimulation/operations.ts:44`

Construye el LTS cociente M/~ donde cada bloque de la partición de
bisimulación se convierte en un único estado. Las transiciones se
deduplican: si s -a-> t, entonces [s] -a-> [t] aparece una sola vez.

El labelling del bloque es el labelling común de sus miembros
(todos los miembros tienen el mismo labelling por construcción).

```ts
export function quotientLTS(lts: LTS): LTS
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lts` | `LTS` | no |  |

### Returns

`LTS` — 


## `strongBisimulation`

> Function · `runtime/bisimulation/operations.ts:97`

Verifica si dos LTS son fuertemente bisimilares.
Los espacios de estados deben ser disjuntos; si no lo son, los renombramos
internamente con prefijos "L:" y "R:".

El criterio: en el LTS combinado, los conjuntos iniciales (o, en ausencia
de iniciales explícitos, todos los estados) deben quedar particionados de
forma que cada estado de L tenga al menos un estado equivalente en R y
viceversa. Como API simple, se compara la firma de la partición sobre
el LTS combinado: dos LTS son bisimilares como sistemas sii existe una
biyección entre sus bloques tal que cada bloque contiene estados de ambos
lados (interpretación de "los autómatas son indistinguibles").

```ts
export function strongBisimulation(lts1: LTS, lts2: LTS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lts1` | `LTS` | no |  |
| `lts2` | `LTS` | no |  |

### Returns

`boolean` — 


## `weakBisimulation`

> Function · `runtime/bisimulation/operations.ts:154`

Bisimulación débil: oculta transiciones τ y satura ⇒ = τ* antes de aplicar
Paige-Tarjan. Útil para CCS / process algebras donde τ representa una
acción interna no observable.

Cuesta O(n³) por la saturación (transitivos τ); para LTS grandes con muchas
acciones reales esto es aceptable. La partición resultante es la mayor
relación de bisimulación débil.

```ts
export function weakBisimulation(lts: LTS, tau: string): BisimulationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lts` | `LTS` | no |  |
| `tau` | `string` | no |  |

### Returns

`BisimulationResult` — 

