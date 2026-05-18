# `semantics/text-layer/compiler.ts`

ST Text Layer — Compilador texto -> formula/claim

## Contents

- [`createTextLayerState`](#createtextlayerstate) — Function
- [`parseAnchorPath`](#parseanchorpath) — Function
- [`registerPassage`](#registerpassage) — Function
- [`registerFormalization`](#registerformalization) — Function
- [`registerClaim`](#registerclaim) — Function
- [`registerSupport`](#registersupport) — Function
- [`registerConfidence`](#registerconfidence) — Function
- [`registerContext`](#registercontext) — Function
- [`compileClaimsToTheory`](#compileclaimstotheory) — Function
- [`registerDefinition`](#registerdefinition) — Function
- [`registerSource`](#registersource) — Function
- [`registerInterpretation`](#registerinterpretation) — Function

## `createTextLayerState`

> Function · `semantics/text-layer/compiler.ts:19`

Crea un `TextLayerState` vacío listo para recibir passages, claims y definiciones.

```ts
export function createTextLayerState(): TextLayerState
```

### Returns

`TextLayerState` — 


## `parseAnchorPath`

> Function · `semantics/text-layer/compiler.ts:43`

Parsea una ruta de anchor con formato `"archivo.md#fragmento"` en un `Anchor`.
Infiere el tipo (`heading`, `paragraph`, `range`, `block`) a partir del fragmento.

```ts
export function parseAnchorPath(raw: string): Anchor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `raw` | `string` | no |  |

### Returns

`Anchor` — 


## `registerPassage`

> Function · `semantics/text-layer/compiler.ts:82`

Registra un passage en el estado, parseando `anchorPath` con `parseAnchorPath`.

```ts
export function registerPassage( state: TextLayerState, name: string, anchorPath: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `anchorPath` | `string` | no |  |

### Returns

`Diagnostic[]` — Diagnósticos de error si el anchor es inválido; vacío en caso de éxito.


## `registerFormalization`

> Function · `semantics/text-layer/compiler.ts:102`

Registra una formalización (passage + fórmula) en el estado.
Emite un warning si el passage referenciado no existe aún.

```ts
export function registerFormalization( state: TextLayerState, name: string, passageName: string, formula: Formula, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `passageName` | `string` | no |  |
| `formula` | `Formula` | no |  |

### Returns

`Diagnostic[]` — 


## `registerClaim`

> Function · `semantics/text-layer/compiler.ts:125`

Registra un claim con fórmula directa o referencia a una formalización.
Emite un warning si `formalizationRef` no apunta a ningún pasaje o formalización conocida.

```ts
export function registerClaim( state: TextLayerState, name: string, formula?: Formula, formalizationRef?: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `formula` | `Formula` | yes |  |
| `formalizationRef` | `string` | yes |  |

### Returns

`Diagnostic[]` — 


## `registerSupport`

> Function · `semantics/text-layer/compiler.ts:152`

Asocia una fuente bibliográfica (`sourceName`) como soporte de un claim.
Emite un warning si el claim no existe en el estado.

```ts
export function registerSupport( state: TextLayerState, claimName: string, sourceName: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `sourceName` | `string` | no |  |

### Returns

`Diagnostic[]` — 


## `registerConfidence`

> Function · `semantics/text-layer/compiler.ts:181`

Registra el nivel de confianza `value ∈ [0,1]` para un claim.

```ts
export function registerConfidence( state: TextLayerState, claimName: string, value: number, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `value` | `number` | no |  |

### Returns

`Diagnostic[]` — Error si `value` está fuera de rango; warning si el claim no existe.


## `registerContext`

> Function · `semantics/text-layer/compiler.ts:216`

Registra texto de contexto libre asociado a un claim.
Emite un warning si el claim no existe en el estado.

```ts
export function registerContext( state: TextLayerState, claimName: string, text: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `text` | `string` | no |  |

### Returns

`Diagnostic[]` — 


## `compileClaimsToTheory`

> Function · `semantics/text-layer/compiler.ts:244`

Copia todos los claims con fórmula (directa o vía formalización) a `theory.claims`.

```ts
export function compileClaimsToTheory(state: TextLayerState, theory: Theory): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `theory` | `Theory` | no |  |

### Returns

`Diagnostic[]` — Diagnósticos de error para claims con referencia a formalización inexistente.


## `registerDefinition`

> Function · `semantics/text-layer/compiler.ts:271`

Registra una entrada de definición formal en el estado (v3).
Emite un warning si el nombre ya fue definido anteriormente.

```ts
export function registerDefinition(state: TextLayerState, entry: DefinitionEntry): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `entry` | `DefinitionEntry` | no |  |

### Returns

`Diagnostic[]` — 


## `registerSource`

> Function · `semantics/text-layer/compiler.ts:287`

Registra una fuente bibliográfica en el estado (v3).
Emite un warning si el `source.id` ya fue registrado.

```ts
export function registerSource(state: TextLayerState, source: SourceInfo): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `source` | `SourceInfo` | no |  |

### Returns

`Diagnostic[]` — 


## `registerInterpretation`

> Function · `semantics/text-layer/compiler.ts:303`

Registra una entrada de interpretación semántica bajo la clave `key` (v3).
Sobreescribe silenciosamente si la clave ya existe.

```ts
export function registerInterpretation( state: TextLayerState, key: string, entry: InterpretationEntry, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `key` | `string` | no |  |
| `entry` | `InterpretationEntry` | no |  |

### Returns

`Diagnostic[]` — 

