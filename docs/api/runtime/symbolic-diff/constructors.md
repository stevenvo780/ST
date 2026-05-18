# `runtime/symbolic-diff/constructors.ts`

## Contents

- [`cst`](#cst) — Function
- [`v`](#v) — Function
- [`add`](#add) — Function
- [`mul`](#mul) — Function
- [`sub`](#sub) — Function
- [`div`](#div) — Function
- [`pow`](#pow) — Function
- [`neg`](#neg) — Function
- [`fn`](#fn) — Function
- [`sin`](#sin) — Function
- [`cos`](#cos) — Function
- [`tan`](#tan) — Function
- [`log`](#log) — Function
- [`exp`](#exp) — Function

## `cst`

> Function · `runtime/symbolic-diff/constructors.ts:3`

```ts
export function cst(value: number): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `number` | no |  |

### Returns

`Expr` — 


## `v`

> Function · `runtime/symbolic-diff/constructors.ts:7`

```ts
export function v(name: string): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Expr` — 


## `add`

> Function · `runtime/symbolic-diff/constructors.ts:11`

```ts
export function add(...args: Expr[]): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `Expr[]` | no |  |

### Returns

`Expr` — 


## `mul`

> Function · `runtime/symbolic-diff/constructors.ts:21`

```ts
export function mul(...args: Expr[]): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `Expr[]` | no |  |

### Returns

`Expr` — 


## `sub`

> Function · `runtime/symbolic-diff/constructors.ts:31`

```ts
export function sub(left: Expr, right: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Expr` | no |  |
| `right` | `Expr` | no |  |

### Returns

`Expr` — 


## `div`

> Function · `runtime/symbolic-diff/constructors.ts:35`

```ts
export function div(left: Expr, right: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Expr` | no |  |
| `right` | `Expr` | no |  |

### Returns

`Expr` — 


## `pow`

> Function · `runtime/symbolic-diff/constructors.ts:39`

```ts
export function pow(base: Expr, exp: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `base` | `Expr` | no |  |
| `exp` | `Expr` | no |  |

### Returns

`Expr` — 


## `neg`

> Function · `runtime/symbolic-diff/constructors.ts:43`

```ts
export function neg(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `fn`

> Function · `runtime/symbolic-diff/constructors.ts:47`

```ts
export function fn(name: UnaryFn, arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `UnaryFn` | no |  |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `sin`

> Function · `runtime/symbolic-diff/constructors.ts:51`

```ts
export function sin(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `cos`

> Function · `runtime/symbolic-diff/constructors.ts:55`

```ts
export function cos(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `tan`

> Function · `runtime/symbolic-diff/constructors.ts:59`

```ts
export function tan(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `log`

> Function · `runtime/symbolic-diff/constructors.ts:63`

```ts
export function log(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 


## `exp`

> Function · `runtime/symbolic-diff/constructors.ts:67`

```ts
export function exp(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 

