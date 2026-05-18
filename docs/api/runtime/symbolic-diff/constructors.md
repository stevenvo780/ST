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

> Function · `runtime/symbolic-diff/constructors.ts:4`

Creates a numeric constant expression node.

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

> Function · `runtime/symbolic-diff/constructors.ts:9`

Creates a variable expression node with the given name.

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

> Function · `runtime/symbolic-diff/constructors.ts:17`

Creates an addition expression. With zero args returns `cst(0)`;
with one arg returns it directly (no wrapper node).

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

> Function · `runtime/symbolic-diff/constructors.ts:31`

Creates a multiplication expression. With zero args returns `cst(1)`;
with one arg returns it directly (no wrapper node).

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

> Function · `runtime/symbolic-diff/constructors.ts:42`

Creates a subtraction expression `left - right`.

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

> Function · `runtime/symbolic-diff/constructors.ts:47`

Creates a division expression `left / right`.

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

> Function · `runtime/symbolic-diff/constructors.ts:52`

Creates a power expression `base ^ exp`.

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

> Function · `runtime/symbolic-diff/constructors.ts:57`

Creates a unary negation expression `-arg`.

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

> Function · `runtime/symbolic-diff/constructors.ts:62`

Creates a unary function expression for any supported `UnaryFn` name.

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

> Function · `runtime/symbolic-diff/constructors.ts:67`

Creates a `sin(arg)` expression node.

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

> Function · `runtime/symbolic-diff/constructors.ts:72`

Creates a `cos(arg)` expression node.

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

> Function · `runtime/symbolic-diff/constructors.ts:77`

Creates a `tan(arg)` expression node.

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

> Function · `runtime/symbolic-diff/constructors.ts:82`

Creates a natural `log(arg)` expression node.

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

> Function · `runtime/symbolic-diff/constructors.ts:87`

Creates an `exp(arg)` (i.e. e^arg) expression node.

```ts
export function exp(arg: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `Expr` | no |  |

### Returns

`Expr` — 

