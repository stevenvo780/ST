# `type-theory/hol/connectives.ts`

============================================================ HOL — Conectivas y cuantificadores definidos ============================================================ Siguiendo HOL Light, todo se define a partir de la igualdad primitiva (`=`) y λ-binding. Cada conectiva es un `const` con un tipo polimórfico fijo; las definiciones internas (qué λ-término representa) se documentan pero el núcleo no las usa directamente — son referencias para constructores ergonómicos. Definiciones canónicas:   T            = (λp:bool. p) = (λp:bool. p)   ∧ p q        = (λf. f p q) = (λf. f T T)   ⇒ p q        = (p ∧ q) = p   ∀ (P : α→bool) = P = (λx:α. T)   ∃ (P : α→bool) = ∀ q. (∀ x. P x ⇒ q) ⇒ q   ∨ p q        = ∀ r. (p ⇒ r) ⇒ (q ⇒ r) ⇒ r   ⊥            = ∀ p:bool. p   ¬ p          = p ⇒ ⊥

## Contents

- [`True`](#true) — Const
- [`Bottom`](#bottom) — Const
- [`And`](#and) — Const
- [`Or`](#or) — Const
- [`Not`](#not) — Const
- [`Implies`](#implies) — Const
- [`Forall`](#forall) — Const
- [`Exists`](#exists) — Const
- [`mkAnd`](#mkand) — Function
- [`mkOr`](#mkor) — Function
- [`mkNot`](#mknot) — Function
- [`mkImplies`](#mkimplies) — Function
- [`mkForall`](#mkforall) — Function
- [`mkExists`](#mkexists) — Function
- [`assertBool`](#assertbool) — Function

## `True`

> Const · `type-theory/hol/connectives.ts:29`

Constante `T : bool`.

```ts
const True: HOLTerm
```


## `Bottom`

> Const · `type-theory/hol/connectives.ts:32`

Constante `⊥ : bool`.

```ts
const Bottom: HOLTerm
```


## `And`

> Const · `type-theory/hol/connectives.ts:35`

Constante `∧ : bool → bool → bool`.

```ts
const And: HOLTerm
```


## `Or`

> Const · `type-theory/hol/connectives.ts:38`

Constante `∨ : bool → bool → bool`.

```ts
const Or: HOLTerm
```


## `Not`

> Const · `type-theory/hol/connectives.ts:41`

Constante `¬ : bool → bool`.

```ts
const Not: HOLTerm
```


## `Implies`

> Const · `type-theory/hol/connectives.ts:44`

Constante `⇒ : bool → bool → bool`.

```ts
const Implies: HOLTerm
```


## `Forall`

> Const · `type-theory/hol/connectives.ts:51`

Constante `∀ : (α → bool) → bool`. Polimórfica vía la tvar `α`.
El consumidor debe usar `mkForall` para instanciar al tipo
correcto antes de aplicar.

```ts
const Forall: HOLTerm
```


## `Exists`

> Const · `type-theory/hol/connectives.ts:56`

Constante `∃ : (α → bool) → bool`. Igual que `∀`, polimórfica.

```ts
const Exists: HOLTerm
```


## `mkAnd`

> Function · `type-theory/hol/connectives.ts:61`

Construye `p ∧ q`.

```ts
export function mkAnd(p: HOLTerm, q: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HOLTerm` | no |  |
| `q` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `mkOr`

> Function · `type-theory/hol/connectives.ts:66`

Construye `p ∨ q`.

```ts
export function mkOr(p: HOLTerm, q: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HOLTerm` | no |  |
| `q` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `mkNot`

> Function · `type-theory/hol/connectives.ts:71`

Construye `¬ p`.

```ts
export function mkNot(p: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `mkImplies`

> Function · `type-theory/hol/connectives.ts:76`

Construye `p ⇒ q`.

```ts
export function mkImplies(p: HOLTerm, q: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HOLTerm` | no |  |
| `q` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `mkForall`

> Function · `type-theory/hol/connectives.ts:84`

Construye `∀x:α. body`. Internamente: `(∀ : (α→bool)→bool) (λx:α. body)`
con el `∀` instanciado al tipo correcto.

```ts
export function mkForall(param: string, paramType: HOLType, body: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `param` | `string` | no |  |
| `paramType` | `HOLType` | no |  |
| `body` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `mkExists`

> Function · `type-theory/hol/connectives.ts:95`

Construye `∃x:α. body`. Análogo a `mkForall`.

```ts
export function mkExists(param: string, paramType: HOLType, body: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `param` | `string` | no |  |
| `paramType` | `HOLType` | no |  |
| `body` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `assertBool`

> Function · `type-theory/hol/connectives.ts:108`

Validador: lanza si `t` no tiene tipo `bool`. Útil para checks
externos antes de pasarle a `assume` o construir conectivas.

```ts
export function assertBool(t: HOLTerm): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`void` — 

