# `runtime/theorem-cache/canonical.ts`

Canonicalización de fórmulas (string-based) para el theorem cache.

El objetivo no es parsear lógica completa, sino normalizar:
- whitespace
- mapear identificadores (átomos / metavariables) a placeholders
  canónicos en orden de primera aparición, preservando estructura.

Resultado: `P -> P` y `Q -> Q` producen la misma forma canónica
(`?0 -> ?0`), mientras que `P -> Q` produce `?0 -> ?1`. Esto soporta
proof reuse via substitución.

Símbolos lógicos reservados (palabras clave) NO se renombran:
  not, and, or, implies, iff, forall, exists, true, false, ->,
  →, ∧, ∨, ¬, ↔, ∀, ∃, ⊤, ⊥

## Contents

- [`normalizeWhitespace`](#normalizewhitespace) — Function
- [`CanonicalResult`](#canonicalresult) — Interface
- [`canonicalize`](#canonicalize) — Function
- [`canonicalString`](#canonicalstring) — Function
- [`computeSubstitution`](#computesubstitution) — Function
- [`applySubstitution`](#applysubstitution) — Function

## `normalizeWhitespace`

> Function · `runtime/theorem-cache/canonical.ts:40`

Normaliza whitespace: colapsa runs de espacio/tabs/newlines a un solo
espacio, y trimea. Mantiene la separación de tokens.

```ts
export function normalizeWhitespace(formula: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |

### Returns

`string` — 


## `CanonicalResult`

> Interface · `runtime/theorem-cache/canonical.ts:54`

Devuelve la forma canónica de una fórmula como string.

Cada identificador no reservado se reemplaza por `?N` donde N es el
orden de primera aparición. La estructura (operadores, paréntesis,
cuantificadores) se preserva intacta tras normalizar whitespace.

También devuelve el mapping inverso (canonical → original) para
poder reconstruir substituciones.

```ts
export interface CanonicalResult
```


## `canonicalize`

> Function · `runtime/theorem-cache/canonical.ts:62`

```ts
export function canonicalize(formula: string): CanonicalResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |

### Returns

`CanonicalResult` — 


## `canonicalString`

> Function · `runtime/theorem-cache/canonical.ts:85`

Versión simple que sólo devuelve el string canónico.

```ts
export function canonicalString(formula: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |

### Returns

`string` — 


## `computeSubstitution`

> Function · `runtime/theorem-cache/canonical.ts:97`

Intenta encontrar una substitución que mapee la fórmula cacheada
al target. Si las formas canónicas coinciden, calcula el mapping
desde los identificadores originales del teorema hacia los del
target.

Retorna `undefined` si no son canónicamente equivalentes.

```ts
export function computeSubstitution( cachedFormula: string, targetFormula: string, ): Record<string, string> | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cachedFormula` | `string` | no |  |
| `targetFormula` | `string` | no |  |

### Returns

`Record<string, string> \| undefined` — 


## `applySubstitution`

> Function · `runtime/theorem-cache/canonical.ts:120`

Aplica una substitución textual (mapping original → reemplazo) a
una fórmula, respetando límites de identificador. Útil para
rehidratar pruebas reutilizadas.

```ts
export function applySubstitution(formula: string, substitution: Record<string, string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |
| `substitution` | `Record<string, string>` | no |  |

### Returns

`string` — 

