# `reasoning/fca/context.ts`

============================================================ FCA — construcción del contexto y operadores polares de Galois. ============================================================ Aquí viven las primitivas de bajo nivel: construir K = (G, M, I) y computar las dos derivaciones A → A' y B → B' que sustentan toda la teoría (definición de concepto, clausura, implicación). Notación interna: codificamos un par (g, m) ∈ I como la cadena "g|m". El delimitador '|' es seguro porque obligamos que ningún identificador lo contenga (createContext lo valida); de lo contrario usaríamos un Map<string, Set<string>>. ============================================================

## Contents

- [`createContext`](#createcontext) — Function
- [`hasIncidence`](#hasincidence) — Function
- [`derivativeObjects`](#derivativeobjects) — Function
- [`derivativeAttributes`](#derivativeattributes) — Function
- [`isConcept`](#isconcept) — Function
- [`closeIntent`](#closeintent) — Function
- [`closeExtent`](#closeextent) — Function

## `createContext`

> Function · `reasoning/fca/context.ts:31`

Construye un contexto formal a partir de listas de objetos, atributos y
la lista bruta de incidencias.

Valida:
 - Los identificadores no pueden contener el separador '|'.
 - No se admiten objetos o atributos duplicados.
 - Cada incidencia [g, m] debe referirse a objetos/atributos declarados.

```ts
export function createContext( objects: string[], attributes: string[], incidence: Array<[string, string]>, ): FormalContext
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `objects` | `string[]` | no |  |
| `attributes` | `string[]` | no |  |
| `incidence` | `Array<[string, string]>` | no |  |

### Returns

`FormalContext` — 


## `hasIncidence`

> Function · `reasoning/fca/context.ts:79`

Indica si el objeto `g` tiene el atributo `m` en el contexto.
O(1) gracias a la representación como Set de pares codificados.

```ts
export function hasIncidence(ctx: FormalContext, g: string, m: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `g` | `string` | no |  |
| `m` | `string` | no |  |

### Returns

`boolean` — 


## `derivativeObjects`

> Function · `reasoning/fca/context.ts:88`

Operador polar B → B'  (atributos → objetos).
Devuelve el conjunto de objetos que poseen TODOS los atributos de `attrs`.
Si `attrs` es vacío, el resultado es G (convención: ∀ trivialmente cierto).

```ts
export function derivativeObjects(ctx: FormalContext, attrs: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `attrs` | `Set<string>` | no |  |

### Returns

`Set<string>` — 


## `derivativeAttributes`

> Function · `reasoning/fca/context.ts:108`

Operador polar A → A'  (objetos → atributos).
Devuelve los atributos compartidos por TODOS los objetos de `objs`.
Si `objs` es vacío, el resultado es M.

```ts
export function derivativeAttributes(ctx: FormalContext, objs: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `objs` | `Set<string>` | no |  |

### Returns

`Set<string>` — 


## `isConcept`

> Function · `reasoning/fca/context.ts:130`

Verifica si (extent, intent) es un concepto formal en `ctx`:
  extent' = intent  y  intent' = extent.

Equivale a verificar la doble clausura, pero se computa directo desde la
relación de incidencia, sin acumular intermedios.

```ts
export function isConcept(ctx: FormalContext, extent: Set<string>, intent: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `extent` | `Set<string>` | no |  |
| `intent` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `closeIntent`

> Function · `reasoning/fca/context.ts:140`

Clausura de Galois sobre intents:  B → B'' = (B')'.
Idempotente: closeIntent(closeIntent(B)) = closeIntent(B).

```ts
export function closeIntent(ctx: FormalContext, intent: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `intent` | `Set<string>` | no |  |

### Returns

`Set<string>` — 


## `closeExtent`

> Function · `reasoning/fca/context.ts:147`

Clausura sobre extents:  A → A'' = (A')'.

```ts
export function closeExtent(ctx: FormalContext, extent: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |
| `extent` | `Set<string>` | no |  |

### Returns

`Set<string>` — 

