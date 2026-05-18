# `api.ts`

ST — API programática para uso como librería

Uso:
  import { evaluate, parse, check, createInterpreter } from 'st-lang/api';
  const result = evaluate('logic classical.propositional\ncheck valid (P -> P)');

## Contents

- [`STEvalResult`](#stevalresult) — Interface
- [`STParseResult`](#stparseresult) — Interface
- [`STCheckResult`](#stcheckresult) — Interface
- [`evaluate`](#evaluate) — Function
- [`parse`](#parse) — Function
- [`check`](#check) — Function
- [`quickEval`](#quickeval) — Function
- [`STInterpreter`](#stinterpreter) — Interface
- [`TheorySummary`](#theorysummary) — Interface
- [`createInterpreter`](#createinterpreter) — Function
- [`listProfiles`](#listprofiles) — Function
- [`STHoverResult`](#sthoverresult) — Interface
- [`STRenderResult`](#strenderresult) — Interface
- [`hover`](#hover) — Function
- [`symbols`](#symbols) — Function
- [`gotoDefinition`](#gotodefinition) — Function
- [`completion`](#completion) — Function
- [`render`](#render) — Function

## `STEvalResult`

> Interface · `api.ts:28`

Resultado de evaluate()

```ts
export interface STEvalResult
```


## `STParseResult`

> Interface · `api.ts:44`

Resultado de parse()

```ts
export interface STParseResult
```


## `STCheckResult`

> Interface · `api.ts:51`

Resultado de check()

```ts
export interface STCheckResult
```


## `evaluate`

> Function · `api.ts:73`

Ejecuta código ST completo y devuelve resultado estructurado.

```ts
export function evaluate(source: string, file?: string): STEvalResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `file` | `string` | yes |  |

### Returns

`STEvalResult` — 

### Examples

```ts
const r = evaluate(`
  logic classical.propositional
  axiom a1 : P -> Q
  axiom a2 : P
  derive Q from a1, a2
`);
console.log(r.ok);     // true
console.log(r.stdout); // "✓ [derive] Q es DERIVABLE..."
```


## `parse`

> Function · `api.ts:89`

Parsea código ST sin ejecutarlo. Útil para validación de sintaxis.

```ts
export function parse(source: string, file?: string): STParseResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `file` | `string` | yes |  |

### Returns

`STParseResult` — 


## `check`

> Function · `api.ts:104`

Verifica sintaxis y bien-formación sin ejecutar comandos lógicos.
Parsea el código y reporta errores.

```ts
export function check(source: string, file?: string): STCheckResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `file` | `string` | yes |  |

### Returns

`STCheckResult` — 


## `quickEval`

> Function · `api.ts:125`

Evalúa una expresión lógica rápida (auto-prepone "logic classical.propositional").
Útil para validaciones inline sin necesidad de declarar perfil.

```ts
export function quickEval(expression: string): STEvalResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expression` | `string` | no |  |

### Returns

`STEvalResult` — 

### Examples

```ts
const r = quickEval('check valid (P -> (Q -> P))');
console.log(r.ok);              // true
console.log(r.results[0].status); // 'valid'
```


## `STInterpreter`

> Interface · `api.ts:146`

Intérprete con estado persistente. Permite ejecutar líneas incrementalmente
manteniendo axiomas, teoremas, claims y perfil entre llamadas.

```ts
export interface STInterpreter
```

### Examples

```ts
const st = createInterpreter();
st.exec('logic classical.propositional');
st.exec('axiom a1 : P -> Q');
st.exec('axiom a2 : P');
const r = st.exec('derive Q from a1, a2');
console.log(r.results[0].status); // 'valid'
console.log(st.getTheorySummary()); // { axioms: ['a1', 'a2'], ... }
```


## `TheorySummary`

> Interface · `api.ts:165`

```ts
export interface TheorySummary
```


## `createInterpreter`

> Function · `api.ts:176`

Crea una instancia de intérprete ST con estado persistente.

```ts
export function createInterpreter(): STInterpreter
```

### Returns

`STInterpreter` — 


## `listProfiles`

> Function · `api.ts:287`

Lista los perfiles lógicos disponibles

```ts
export function listProfiles(): string[]
```

### Returns

`string[]` — 


## `STHoverResult`

> Interface · `api.ts:298`

Resultado de hover()

```ts
export interface STHoverResult
```


## `STRenderResult`

> Interface · `api.ts:304`

Resultado de render()

```ts
export interface STRenderResult
```


## `hover`

> Function · `api.ts:316`

Obtiene información de hover para una posición en el código ST.
Útil para tooltips en editores.

```ts
export function hover( source: string, line: number, column: number, file?: string, ): HoverInfo | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `line` | `number` | no |  |
| `column` | `number` | no |  |
| `file` | `string` | yes |  |

### Returns

`HoverInfo \| null` — HoverInfo o null si no hay info en esa posición


## `symbols`

> Function · `api.ts:335`

Lista todos los símbolos definidos en el código ST (axiomas, teoremas, claims, passages, etc.).
Útil para panel de símbolos en editores.

```ts
export function symbols(source: string, file?: string): SymbolInfo[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `file` | `string` | yes |  |

### Returns

`SymbolInfo[]` — 


## `gotoDefinition`

> Function · `api.ts:351`

Busca la definición de un símbolo por nombre en el código ST.
Útil para "Go to Definition" en editores.

```ts
export function gotoDefinition(source: string, name: string, file?: string): SourceLocation | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `name` | `string` | no |  |
| `file` | `string` | yes |  |

### Returns

`SourceLocation \| null` — SourceLocation de la definición o null si no se encuentra


## `completion`

> Function · `api.ts:365`

Obtiene sugerencias de completado para el lenguaje ST.
Devuelve keywords y snippets disponibles.

```ts
export function completion(): CompletionItem[]
```

### Returns

`CompletionItem[]` — 


## `render`

> Function · `api.ts:380`

Ejecuta y renderiza el código ST en el formato especificado.

```ts
export function render(source: string, format?: string, file?: string): STRenderResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `format` | `string` | yes | 'markdown' \| 'json' (default: 'markdown') |
| `file` | `string` | yes |  |

### Returns

`STRenderResult` — 

