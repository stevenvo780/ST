# `proof-systems/higher-order-unify/normalize.ts`

============================================================ Higher-order unification — β-normalización y sustitución ============================================================

## Contents

- [`freeVarsHO`](#freevarsho) — Function
- [`allNamesHO`](#allnamesho) — Function
- [`freshName`](#freshname) — Function
- [`resetFreshCounter`](#resetfreshcounter) — Function
- [`substituteHO`](#substituteho) — Function
- [`applyHOSubst`](#applyhosubst) — Function
- [`normalize`](#normalize) — Function

## `freeVarsHO`

> Function · `proof-systems/higher-order-unify/normalize.ts:9`

```ts
export function freeVarsHO(t: HOTerm): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |

### Returns

`Set<string>` — 


## `allNamesHO`

> Function · `proof-systems/higher-order-unify/normalize.ts:35`

```ts
export function allNamesHO(t: HOTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `freshName`

> Function · `proof-systems/higher-order-unify/normalize.ts:57`

```ts
export function freshName(avoid: Set<string>, base = '_h'): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `avoid` | `Set<string>` | no |  |
| `base` | `any` | yes |  |

### Returns

`string` — 


## `resetFreshCounter`

> Function · `proof-systems/higher-order-unify/normalize.ts:65`

```ts
export function resetFreshCounter(): void
```

### Returns

`void` — 


## `substituteHO`

> Function · `proof-systems/higher-order-unify/normalize.ts:71`

```ts
export function substituteHO(t: HOTerm, varName: string, replacement: HOTerm): HOTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |
| `varName` | `string` | no |  |
| `replacement` | `HOTerm` | no |  |

### Returns

`HOTerm` — 


## `applyHOSubst`

> Function · `proof-systems/higher-order-unify/normalize.ts:104`

```ts
export function applyHOSubst(t: HOTerm, subst: HOSubst): HOTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |
| `subst` | `HOSubst` | no |  |

### Returns

`HOTerm` — 


## `normalize`

> Function · `proof-systems/higher-order-unify/normalize.ts:140`

```ts
export function normalize(t: HOTerm): HOTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOTerm` | no |  |

### Returns

`HOTerm` — 

