# `proof-systems/fol-prover-advanced/unify.ts`

## Contents

- [`unify`](#unify) — Function
- [`unifyLiterals`](#unifyliterals) — Function
- [`applySubToTerm`](#applysubtoterm) — Function
- [`applySubToLiteral`](#applysubtoliteral) — Function
- [`termsEqual`](#termsequal) — Function
- [`literalsEqual`](#literalsequal) — Function

## `unify`

> Function · `proof-systems/fol-prover-advanced/unify.ts:10`

Unificación de Robinson con occurs-check. Devuelve la sustitución más
general (mgu) o `null` si no unifica.

Implementación iterativa sobre una pila de pares (t1,t2) para evitar
recursión profunda en cláusulas grandes.

```ts
export function unify(t1: FOLTerm, t2: FOLTerm): Substitution | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `FOLTerm` | no |  |
| `t2` | `FOLTerm` | no |  |

### Returns

`Substitution \| null` — 


## `unifyLiterals`

> Function · `proof-systems/fol-prover-advanced/unify.ts:46`

```ts
export function unifyLiterals(l1: FOLLiteral, l2: FOLLiteral): Substitution | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `l1` | `FOLLiteral` | no |  |
| `l2` | `FOLLiteral` | no |  |

### Returns

`Substitution \| null` — 


## `applySubToTerm`

> Function · `proof-systems/fol-prover-advanced/unify.ts:63`

```ts
export function applySubToTerm(t: FOLTerm, sub: Substitution): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |
| `sub` | `Substitution` | no |  |

### Returns

`FOLTerm` — 


## `applySubToLiteral`

> Function · `proof-systems/fol-prover-advanced/unify.ts:77`

```ts
export function applySubToLiteral(l: FOLLiteral, sub: Substitution): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `l` | `FOLLiteral` | no |  |
| `sub` | `Substitution` | no |  |

### Returns

`FOLLiteral` — 


## `termsEqual`

> Function · `proof-systems/fol-prover-advanced/unify.ts:85`

```ts
export function termsEqual(a: FOLTerm, b: FOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLTerm` | no |  |
| `b` | `FOLTerm` | no |  |

### Returns

`boolean` — 


## `literalsEqual`

> Function · `proof-systems/fol-prover-advanced/unify.ts:101`

```ts
export function literalsEqual(a: FOLLiteral, b: FOLLiteral): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLLiteral` | no |  |
| `b` | `FOLLiteral` | no |  |

### Returns

`boolean` — 

