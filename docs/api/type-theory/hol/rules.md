# `type-theory/hol/rules.ts`

============================================================ HOL — Reglas primitivas de inferencia ============================================================ Núcleo deductivo estilo HOL Light. 10 reglas primitivas:   REFL                 : |- t = t   TRANS                : |- a = b, |- b = c  ⇒  |- a = c   MK_COMB              : |- f = g, |- x = y  ⇒  |- f x = g y   ABS                  : |- s = t            ⇒  |- (λv.s) = (λv.t)   BETA                 : |- (λv.t) v = t   ASSUME(p)            : p |- p   EQ_MP                : |- p ↔ q, |- p     ⇒  |- q   DEDUCT_ANTISYM_RULE  : A |- p, B |- q      ⇒  (A\{q}) ∪ (B\{p}) |- p ↔ q   INST_TYPE            : sustitución de tipos   INST                 : sustitución de términos en variables libres Las hipótesis son una multiset modelada como array; al unir hipótesis deduplicamos por α-equivalencia.

## Contents

- [`refl`](#refl) — Function
- [`trans`](#trans) — Function
- [`mkCombRule`](#mkcombrule) — Function
- [`abs`](#abs) — Function
- [`beta`](#beta) — Function
- [`assume`](#assume) — Function
- [`eqMp`](#eqmp) — Function
- [`deductAntisymRule`](#deductantisymrule) — Function
- [`instType`](#insttype) — Function
- [`inst`](#inst) — Function
- [`instTyped`](#insttyped) — Function

## `refl`

> Function · `type-theory/hol/rules.ts:69`

```ts
export function refl(t: HOLTerm): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`HOLTheorem` — 


## `trans`

> Function · `type-theory/hol/rules.ts:77`

```ts
export function trans(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm1` | `HOLTheorem` | no |  |
| `thm2` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `mkCombRule`

> Function · `type-theory/hol/rules.ts:96`

```ts
export function mkCombRule(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm1` | `HOLTheorem` | no |  |
| `thm2` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `abs`

> Function · `type-theory/hol/rules.ts:120`

```ts
export function abs(v: HOLTerm, thm1: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `HOLTerm` | no |  |
| `thm1` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `beta`

> Function · `type-theory/hol/rules.ts:145`

```ts
export function beta(t: HOLTerm): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`HOLTheorem` — 


## `assume`

> Function · `type-theory/hol/rules.ts:163`

```ts
export function assume(p: HOLTerm): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HOLTerm` | no |  |

### Returns

`HOLTheorem` — 


## `eqMp`

> Function · `type-theory/hol/rules.ts:173`

```ts
export function eqMp(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm1` | `HOLTheorem` | no |  |
| `thm2` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `deductAntisymRule`

> Function · `type-theory/hol/rules.ts:195`

```ts
export function deductAntisymRule(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm1` | `HOLTheorem` | no |  |
| `thm2` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `instType`

> Function · `type-theory/hol/rules.ts:210`

```ts
export function instType(subst: Record<string, HOLType>, thm1: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `subst` | `Record<string, HOLType>` | no |  |
| `thm1` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `inst`

> Function · `type-theory/hol/rules.ts:235`

Sustituye variables libres en `thm1` según `subst`. El mapa
usa keys `name::typeString` para distinguir variables con
mismo nombre y distinto tipo.

```ts
export function inst(subst: Record<string, HOLTerm>, thm1: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `subst` | `Record<string, HOLTerm>` | no |  |
| `thm1` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 


## `instTyped`

> Function · `type-theory/hol/rules.ts:254`

Variante explícita: cada entrada especifica `{ name, type, value }`.
Necesaria si dos variables comparten nombre pero distinto tipo.

```ts
export function instTyped(entries: InstEntry[], thm1: HOLTheorem): HOLTheorem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `entries` | `InstEntry[]` | no |  |
| `thm1` | `HOLTheorem` | no |  |

### Returns

`HOLTheorem` — 

