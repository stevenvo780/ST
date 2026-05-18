# `reasoning/hyperreal/index.ts`

============================================================ ST Hyperreal — Lógica probabilística con infinitesimales ============================================================ Modela valores como números hiperreales de primer orden:   x = standard + infinitesimal · ε donde ε es un infinitesimal formal con ε² ≈ 0. Esto permite:   • distinguir 1 y 1 + ε (probabilidad "casi 1" pero no exacta).   • razonar sobre diferencias infinitamente pequeñas sin colapsar     al límite estándar.   • propagar incertidumbre con cotas inferior/superior conservadoras     bajo operadores booleanos probabilísticos. Aritmética (sólo primer orden en ε; los términos ε² se descartan):   (a_s + a_i ε) + (b_s + b_i ε) = (a_s + b_s) + (a_i + b_i) ε   (a_s + a_i ε) - (b_s + b_i ε) = (a_s - b_s) + (a_i - b_i) ε   (a_s + a_i ε) · (b_s + b_i ε) = a_s b_s + (a_s b_i + a_i b_s) ε                                    [+ a_i b_i ε² → 0] Orden total (lexicográfico standard primero, después infinitesimal):   a < b  ⇔  a_s < b_s  ∨  (a_s = b_s ∧ a_i < b_i) Lógica probabilística hiperreal:   p ∧ q = p · q   p ∨ q = p + q − p·q       (inclusión-exclusión)   ¬p     = 1 − p   p → q = ¬p ∨ q = 1 − p + p·q Propagación de cotas [lower, upper]:   AND y OR son monótonas crecientes en ambas variables.   NOT invierte y refleja la cota.   IMPLIES es decreciente en p y creciente en q ⇒ la cota inferior   sale del lado conservador (upper_p, lower_q) y viceversa. ============================================================

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

> Interface · `reasoning/hyperreal/index.ts:37`

```ts
export interface Hyperreal
```


## `hr`

> Function · `reasoning/hyperreal/index.ts:42`

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

> Const · `reasoning/hyperreal/index.ts:46`

```ts
const HR_ZERO: Hyperreal
```


## `HR_ONE`

> Const · `reasoning/hyperreal/index.ts:47`

```ts
const HR_ONE: Hyperreal
```


## `HR_EPSILON`

> Const · `reasoning/hyperreal/index.ts:48`

```ts
const HR_EPSILON: Hyperreal
```


## `add`

> Function · `reasoning/hyperreal/index.ts:52`

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

> Function · `reasoning/hyperreal/index.ts:59`

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

> Function · `reasoning/hyperreal/index.ts:66`

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

> Function · `reasoning/hyperreal/index.ts:82`

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

> Function · `reasoning/hyperreal/index.ts:93`

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

> Function · `reasoning/hyperreal/index.ts:97`

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

> Function · `reasoning/hyperreal/index.ts:101`

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

> Function · `reasoning/hyperreal/index.ts:107`

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

> Function · `reasoning/hyperreal/index.ts:111`

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

> Function · `reasoning/hyperreal/index.ts:115`

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

> Function · `reasoning/hyperreal/index.ts:119`

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

> Interface · `reasoning/hyperreal/index.ts:126`

```ts
export interface UncertaintyBound
```


## `bound`

> Function · `reasoning/hyperreal/index.ts:131`

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

> Function · `reasoning/hyperreal/index.ts:150`

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

> Function · `reasoning/hyperreal/index.ts:188`

```ts
export function hrToString(x: Hyperreal): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `Hyperreal` | no |  |

### Returns

`string` — 

