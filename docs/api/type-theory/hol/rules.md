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

> Function · `type-theory/hol/rules.ts:70`

Regla REFL: produce el teorema `⊢ t = t` para cualquier término `t`.

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

> Function · `type-theory/hol/rules.ts:82`

Regla TRANS: dados `⊢ a = b` y `⊢ b = c` produce `⊢ a = c`.

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

> Function · `type-theory/hol/rules.ts:105`

Regla MK_COMB: dados `⊢ f = g` y `⊢ x = y` produce `⊢ f x = g y`.

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

> Function · `type-theory/hol/rules.ts:134`

Regla ABS: dado `⊢ s = t` produce `⊢ (λv.s) = (λv.t)`.
`v` no puede aparecer libre en las hipótesis de `thm1`.

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

> Function · `type-theory/hol/rules.ts:164`

Regla BETA: dado `(λv.t) v` produce `⊢ (λv.t) v = t`.
Solo acepta la forma exacta donde el argumento es el propio binder; usar INST para otros.

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

> Function · `type-theory/hol/rules.ts:186`

Regla ASSUME: produce `p ⊢ p` (hipótesis no descargada).

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

> Function · `type-theory/hol/rules.ts:200`

Regla EQ_MP: dados `⊢ p = q` y `⊢ p` produce `⊢ q` (modus ponens vía igualdad booleana).

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

> Function · `type-theory/hol/rules.ts:227`

Regla DEDUCT_ANTISYM_RULE: dados `A ⊢ p` y `B ⊢ q` produce
`(A \ {q}) ∪ (B \ {p}) ⊢ p ↔ q`.

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

> Function · `type-theory/hol/rules.ts:246`

Regla INST_TYPE: instancia variables de tipo en `thm1` según `subst`.
Deduplica hipótesis que colapsen tras la sustitución.

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

> Function · `type-theory/hol/rules.ts:271`

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

> Function · `type-theory/hol/rules.ts:290`

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

