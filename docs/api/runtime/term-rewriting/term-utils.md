# `runtime/term-rewriting/term-utils.ts`

============================================================ ST Term Rewriting — Utilidades de términos ============================================================ Operaciones básicas sobre términos de primer orden:   - igualdad estructural   - sustitución   - matching (un sentido) y unificación (Robinson)   - occurs check   - recolección de variables   - clonación Las sustituciones son Map<string, Term>. Componer dos sustituciones σ ∘ τ se hace aplicando τ a los rangos de σ y uniendo: composeSubst(σ, τ).

## Contents

- [`termEquals`](#termequals) — Function
- [`cloneTerm`](#cloneterm) — Function
- [`varsOf`](#varsof) — Function
- [`applySubst`](#applysubst) — Function
- [`occursIn`](#occursin) — Function
- [`match`](#match) — Function
- [`unify`](#unify) — Function
- [`renameVars`](#renamevars) — Function
- [`termSize`](#termsize) — Function
- [`v`](#v) — Function
- [`f`](#f) — Function
- [`c`](#c) — Function

## `termEquals`

> Function · `runtime/term-rewriting/term-utils.ts:23`

Igualdad estructural de términos (iterativa para soportar
términos muy profundos sin stack overflow).

```ts
export function termEquals(a: Term, b: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Term` | no |  |
| `b` | `Term` | no |  |

### Returns

`boolean` — 


## `cloneTerm`

> Function · `runtime/term-rewriting/term-utils.ts:50`

Clona un término (iterativo, soporta árboles profundos).

```ts
export function cloneTerm(t: Term): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`Term` — 


## `varsOf`

> Function · `runtime/term-rewriting/term-utils.ts:109`

Conjunto de variables que aparecen en t.

```ts
export function varsOf(t: Term, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `applySubst`

> Function · `runtime/term-rewriting/term-utils.ts:127`

Aplica una sustitución a t (iterativo, soporta términos profundos).

Para variables, sigue la cadena de bindings con detección de
ciclos (un MGU de Robinson puede tener cadenas x → y → f(z)
que sólo terminan tras varios saltos).

```ts
export function applySubst(t: Term, subst: Substitution): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `subst` | `Substitution` | no |  |

### Returns

`Term` — 


## `occursIn`

> Function · `runtime/term-rewriting/term-utils.ts:198`

Occurs check: ¿aparece la variable v en t?

Indispensable para evitar unificar x con f(x) creando términos
infinitos como f(f(f(...))).

```ts
export function occursIn(v: string, t: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `string` | no |  |
| `t` | `Term` | no |  |

### Returns

`boolean` — 


## `match`

> Function · `runtime/term-rewriting/term-utils.ts:219`

Matching (pattern matching): encuentra σ tal que σ(pattern) = target.

A diferencia de la unificación, solo las variables del pattern
pueden ligarse. Si target contiene variables, se tratan como
constantes opacas. Devuelve null si no hay match.

```ts
export function match( pattern: Term, target: Term, subst: Substitution = new Map(), ): Substitution | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pattern` | `Term` | no |  |
| `target` | `Term` | no |  |
| `subst` | `Substitution` | yes |  |

### Returns

`Substitution \| null` — 


## `unify`

> Function · `runtime/term-rewriting/term-utils.ts:258`

Unificación de Robinson. Devuelve un MGU (most general unifier)
o null si los términos no unifican.

Implementación recursiva con occurs check.

```ts
export function unify(s: Term, t: Term, subst: Substitution = new Map()): Substitution | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Term` | no |  |
| `t` | `Term` | no |  |
| `subst` | `Substitution` | yes |  |

### Returns

`Substitution \| null` — 


## `renameVars`

> Function · `runtime/term-rewriting/term-utils.ts:312`

Renombra todas las variables de t agregándole un sufijo (`_<suffix>`).

Necesario antes de unificar dos reglas en KB completion: las variables
deben ser disjuntas para que LHS₁ y LHS₂ no compartan nombres
espuriamente.

```ts
export function renameVars(t: Term, suffix: string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `suffix` | `string` | no |  |

### Returns

`Term` — 


## `termSize`

> Function · `runtime/term-rewriting/term-utils.ts:320`

Tamaño del término (número de nodos). Iterativo para evitar
stack overflow en términos muy profundos.

```ts
export function termSize(t: Term): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`number` — 


## `v`

> Function · `runtime/term-rewriting/term-utils.ts:337`

Helpers para construir términos (azúcar para tests).

```ts
export function v(name: string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Term` — 


## `f`

> Function · `runtime/term-rewriting/term-utils.ts:341`

```ts
export function f(name: string, ...args: Term[]): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `args` | `Term[]` | no |  |

### Returns

`Term` — 


## `c`

> Function · `runtime/term-rewriting/term-utils.ts:345`

```ts
export function c(name: string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Term` — 

