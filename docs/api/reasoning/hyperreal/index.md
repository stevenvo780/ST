# `reasoning/hyperreal/index.ts`

A first-order hyperreal number `standard + infinitesimal · ε`,
where ε is a formal infinitesimal (ε² ≈ 0).

## Contents

- [`Hyperreal`](#hyperreal) — Interface
- [`hr`](#hr) — Function
- [`HR_ZERO`](#hr-zero) — Const
- [`HR_ONE`](#hr-one) — Const
- [`HR_EPSILON`](#hr-epsilon) — Const
- [`add`](#add) — Function
- [`sub`](#sub) — Function
- [`mul`](#mul) — Function
- [`compare`](#compare) — Function
- [`eq`](#eq) — Function
- [`lt`](#lt) — Function
- [`gt`](#gt) — Function
- [`hrAnd`](#hrand) — Function
- [`hrOr`](#hror) — Function
- [`hrNot`](#hrnot) — Function
- [`hrImplies`](#hrimplies) — Function
- [`UncertaintyBound`](#uncertaintybound) — Interface
- [`bound`](#bound) — Function
- [`propagate`](#propagate) — Function
- [`hrToString`](#hrtostring) — Function

## `Hyperreal`

> Interface · `reasoning/hyperreal/index.ts:41`

A first-order hyperreal number `standard + infinitesimal · ε`,
where ε is a formal infinitesimal (ε² ≈ 0).

```ts
export interface Hyperreal
```


## `hr`

> Function · `reasoning/hyperreal/index.ts:50`

Constructs a {@link Hyperreal} from its standard and optional infinitesimal parts.
`hr(x)` produces the standard real `x + 0ε`.

```ts
export function hr(standard: number, infinitesimal: number = 0): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `standard` | `number` | no |  |
| `infinitesimal` | `number` | yes |  |

### Returns

`Hyperreal` — 


## `HR_ZERO`

> Const · `reasoning/hyperreal/index.ts:55`

The hyperreal zero: 0 + 0ε.

```ts
const HR_ZERO: Hyperreal
```


## `HR_ONE`

> Const · `reasoning/hyperreal/index.ts:57`

The hyperreal one: 1 + 0ε.

```ts
const HR_ONE: Hyperreal
```


## `HR_EPSILON`

> Const · `reasoning/hyperreal/index.ts:59`

The formal infinitesimal ε: 0 + 1ε.

```ts
const HR_EPSILON: Hyperreal
```


## `add`

> Function · `reasoning/hyperreal/index.ts:64`

Returns `a + b` (component-wise addition).

```ts
export function add(a: Hyperreal, b: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `sub`

> Function · `reasoning/hyperreal/index.ts:72`

Returns `a - b` (component-wise subtraction).

```ts
export function sub(a: Hyperreal, b: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `mul`

> Function · `reasoning/hyperreal/index.ts:83`

Returns `a * b`, discarding O(ε²) terms:
`(a.s + a.i ε)(b.s + b.i ε) = a.s·b.s + (a.s·b.i + a.i·b.s)·ε`.

```ts
export function mul(a: Hyperreal, b: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `compare`

> Function · `reasoning/hyperreal/index.ts:99`

Compara dos hiperreales lexicográficamente: primero la parte estándar,
luego la infinitesimal. Devuelve -1, 0 o 1.

Usa una tolerancia ínfima sobre las componentes para absorber el ruido
de coma flotante; los infinitesimales formales no se ven afectados
porque su magnitud es de orden O(1) en el coeficiente.

```ts
export function compare(a: Hyperreal, b: Hyperreal): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`-1 \| 0 \| 1` — 


## `eq`

> Function · `reasoning/hyperreal/index.ts:111`

Returns `true` when `a` and `b` are equal under the lexicographic order.

```ts
export function eq(a: Hyperreal, b: Hyperreal): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`boolean` — 


## `lt`

> Function · `reasoning/hyperreal/index.ts:116`

Returns `true` when `a < b` in the hyperreal order.

```ts
export function lt(a: Hyperreal, b: Hyperreal): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`boolean` — 


## `gt`

> Function · `reasoning/hyperreal/index.ts:121`

Returns `true` when `a > b` in the hyperreal order.

```ts
export function gt(a: Hyperreal, b: Hyperreal): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Hyperreal` | no |  |
| `b` | `Hyperreal` | no |  |

### Returns

`boolean` — 


## `hrAnd`

> Function · `reasoning/hyperreal/index.ts:128`

Probabilistic AND: `p ∧ q = p · q`.

```ts
export function hrAnd(p: Hyperreal, q: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Hyperreal` | no |  |
| `q` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `hrOr`

> Function · `reasoning/hyperreal/index.ts:133`

Probabilistic OR (inclusion-exclusion): `p ∨ q = p + q − p·q`.

```ts
export function hrOr(p: Hyperreal, q: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Hyperreal` | no |  |
| `q` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `hrNot`

> Function · `reasoning/hyperreal/index.ts:138`

Probabilistic NOT: `¬p = 1 − p`.

```ts
export function hrNot(p: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `hrImplies`

> Function · `reasoning/hyperreal/index.ts:143`

Probabilistic implication: `p → q = ¬p ∨ q`.

```ts
export function hrImplies(p: Hyperreal, q: Hyperreal): Hyperreal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Hyperreal` | no |  |
| `q` | `Hyperreal` | no |  |

### Returns

`Hyperreal` — 


## `UncertaintyBound`

> Interface · `reasoning/hyperreal/index.ts:151`

A closed interval `[lower, upper]` of hyperreal probabilities.

```ts
export interface UncertaintyBound
```


## `bound`

> Function · `reasoning/hyperreal/index.ts:160`

Constructs a validated {@link UncertaintyBound}.

```ts
export function bound(lower: Hyperreal, upper: Hyperreal): UncertaintyBound
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lower` | `Hyperreal` | no |  |
| `upper` | `Hyperreal` | no |  |

### Returns

`UncertaintyBound` — 


## `propagate`

> Function · `reasoning/hyperreal/index.ts:179`

Propaga una operación lógica sobre cotas de incertidumbre.

- `and`/`or` requieren `other`; ambas operaciones son monótonas en
  sus dos argumentos, por lo que la cota se obtiene aplicando la
  operación a (lower, lower) y (upper, upper) respectivamente.
- `not` invierte la cota: ¬[a, b] = [1 − b, 1 − a].
- `implies` requiere `other`. p → q es decreciente en p y creciente
  en q ⇒ lower = (upper_p → lower_q), upper = (lower_p → upper_q).

```ts
export function propagate( b: UncertaintyBound, op: 'and' | 'or' | 'not' | 'implies', other?: UncertaintyBound, ): UncertaintyBound
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `b` | `UncertaintyBound` | no |  |
| `op` | `'and' \| 'or' \| 'not' \| 'implies'` | no |  |
| `other` | `UncertaintyBound` | yes |  |

### Returns

`UncertaintyBound` — 


## `hrToString`

> Function · `reasoning/hyperreal/index.ts:218`

Returns a human-readable string like `"0.9 + 3ε"` or `"1"` (when infinitesimal is 0).

```ts
export function hrToString(x: Hyperreal): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `Hyperreal` | no |  |

### Returns

`string` — 

