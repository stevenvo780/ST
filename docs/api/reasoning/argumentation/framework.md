# `reasoning/argumentation/framework.ts`

============================================================ ST Argumentation — Core predicates sobre AF de Dung ============================================================

## Contents

- [`createFramework`](#createframework) — Function
- [`attackersOf`](#attackersof) — Function
- [`attackedBy`](#attackedby) — Function
- [`attackedBySet`](#attackedbyset) — Function
- [`isConflictFree`](#isconflictfree) — Function
- [`defends`](#defends) — Function
- [`hasAttack`](#hasattack) — Function
- [`isAdmissible`](#isadmissible) — Function
- [`characteristicFunction`](#characteristicfunction) — Function
- [`setsEqual`](#setsequal) — Function
- [`isSubset`](#issubset) — Function

## `createFramework`

> Function · `reasoning/argumentation/framework.ts:7`

```ts
export function createFramework( args: Iterable<string>, attacks: Iterable<[string, string]>, ): ArgumentationFramework
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `Iterable<string>` | no |  |
| `attacks` | `Iterable<[string, string]>` | no |  |

### Returns

`ArgumentationFramework` — 


## `attackersOf`

> Function · `reasoning/argumentation/framework.ts:25`

```ts
export function attackersOf(af: ArgumentationFramework, arg: string): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `arg` | `string` | no |  |

### Returns

`Set<string>` — 


## `attackedBy`

> Function · `reasoning/argumentation/framework.ts:33`

```ts
export function attackedBy(af: ArgumentationFramework, arg: string): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `arg` | `string` | no |  |

### Returns

`Set<string>` — 


## `attackedBySet`

> Function · `reasoning/argumentation/framework.ts:41`

```ts
export function attackedBySet(af: ArgumentationFramework, set: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`Set<string>` — 


## `isConflictFree`

> Function · `reasoning/argumentation/framework.ts:49`

```ts
export function isConflictFree(af: ArgumentationFramework, set: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `defends`

> Function · `reasoning/argumentation/framework.ts:56`

```ts
export function defends(af: ArgumentationFramework, set: Set<string>, arg: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |
| `arg` | `string` | no |  |

### Returns

`boolean` — 


## `hasAttack`

> Function · `reasoning/argumentation/framework.ts:71`

```ts
export function hasAttack(af: ArgumentationFramework, from: string, to: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `from` | `string` | no |  |
| `to` | `string` | no |  |

### Returns

`boolean` — 


## `isAdmissible`

> Function · `reasoning/argumentation/framework.ts:78`

```ts
export function isAdmissible(af: ArgumentationFramework, set: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `characteristicFunction`

> Function · `reasoning/argumentation/framework.ts:86`

```ts
export function characteristicFunction(af: ArgumentationFramework, set: Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`Set<string>` — 


## `setsEqual`

> Function · `reasoning/argumentation/framework.ts:94`

```ts
export function setsEqual(a: Set<string>, b: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Set<string>` | no |  |
| `b` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `isSubset`

> Function · `reasoning/argumentation/framework.ts:100`

```ts
export function isSubset(a: Set<string>, b: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Set<string>` | no |  |
| `b` | `Set<string>` | no |  |

### Returns

`boolean` — 

