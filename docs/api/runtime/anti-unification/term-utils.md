# `runtime/anti-unification/term-utils.ts`

============================================================ ST Anti-Unification — Utilidades de términos ============================================================ Helpers locales al módulo de anti-unification. Se mantienen separados de term-rewriting/term-utils porque el shape de Term es distinto (admite `kind: 'const'` con `args?` opcional).

## Contents

- [`termEquals`](#termequals) — Function
- [`termKey`](#termkey) — Function
- [`varsOf`](#varsof) — Function
- [`applySubst`](#applysubst) — Function
- [`termSize`](#termsize) — Function
- [`v`](#v) — Function
- [`c`](#c) — Function
- [`f`](#f) — Function

## `termEquals`

> Function · `runtime/anti-unification/term-utils.ts:19`

Igualdad estructural de términos (iterativa, soporta árboles
profundos sin stack overflow).

Tolera la dualidad const/func-con-args=[]: un `const a` y un
`func a` con args=[] cuentan como iguales para no penalizar al
cliente que mezcle ambas convenciones.

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


## `termKey`

> Function · `runtime/anti-unification/term-utils.ts:53`

Serialización canónica de un término. Usada para comparar pares
(t1, t2) en la tabla de desacuerdos del algoritmo de Plotkin.

Usa caracteres no-alfanuméricos como separadores para evitar
ambigüedades con nombres que contengan paréntesis o comas.

```ts
export function termKey(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 


## `varsOf`

> Function · `runtime/anti-unification/term-utils.ts:92`

Conjunto de variables que aparecen en t (iterativo).

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

> Function · `runtime/anti-unification/term-utils.ts:112`

Aplica una sustitución a un término (no compone cadenas — la
sustitución es plana, no recursiva, porque las generadas por
antiUnify son siempre con vars frescas a la izquierda y términos
cerrados-respecto-a-vars-frescas a la derecha).

```ts
export function applySubst(t: Term, subst: Map<string, Term>): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `subst` | `Map<string, Term>` | no |  |

### Returns

`Term` — 


## `termSize`

> Function · `runtime/anti-unification/term-utils.ts:134`

Tamaño del término (cantidad de nodos).

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

> Function · `runtime/anti-unification/term-utils.ts:147`

Variable.

```ts
export function v(name: string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Term` — 


## `c`

> Function · `runtime/anti-unification/term-utils.ts:152`

Constante (sin args).

```ts
export function c(name: string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Term` — 


## `f`

> Function · `runtime/anti-unification/term-utils.ts:157`

Aplicación de función.

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

