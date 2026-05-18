# `reasoning/argumentation/extensions.ts`

============================================================ ST Argumentation — Computación de extensiones (Dung 1995) ============================================================

## Contents

- [`groundedExtension`](#groundedextension) — Function
- [`isComplete`](#iscomplete) — Function
- [`isStable`](#isstable) — Function
- [`lazyAdmissibleSets`](#lazyadmissiblesets) — Function
- [`preferredExtensions`](#preferredextensions) — Function
- [`completeExtensions`](#completeextensions) — Function
- [`stableExtensions`](#stableextensions) — Function
- [`semiStableExtensions`](#semistableextensions) — Function
- [`computeExtensions`](#computeextensions) — Function

## `groundedExtension`

> Function · `reasoning/argumentation/extensions.ts:20`

```ts
export function groundedExtension(af: ArgumentationFramework): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |

### Returns

`Set<string>` — 


## `isComplete`

> Function · `reasoning/argumentation/extensions.ts:29`

```ts
export function isComplete(af: ArgumentationFramework, set: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `isStable`

> Function · `reasoning/argumentation/extensions.ts:35`

```ts
export function isStable(af: ArgumentationFramework, set: Set<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `set` | `Set<string>` | no |  |

### Returns

`boolean` — 


## `lazyAdmissibleSets`

> Function · `reasoning/argumentation/extensions.ts:73`

```ts
export function* lazyAdmissibleSets(af: ArgumentationFramework): Generator<Set<string>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |

### Returns

`Generator<Set<string>>` — 


## `preferredExtensions`

> Function · `reasoning/argumentation/extensions.ts:114`

```ts
export function preferredExtensions( af: ArgumentationFramework, options: Required<ComputeOptions>, ): Set<string>[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `options` | `Required<ComputeOptions>` | no |  |

### Returns

`Set<string>[]` — 


## `completeExtensions`

> Function · `reasoning/argumentation/extensions.ts:122`

```ts
export function completeExtensions( af: ArgumentationFramework, options: Required<ComputeOptions>, ): Set<string>[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `options` | `Required<ComputeOptions>` | no |  |

### Returns

`Set<string>[]` — 


## `stableExtensions`

> Function · `reasoning/argumentation/extensions.ts:135`

```ts
export function stableExtensions( af: ArgumentationFramework, options: Required<ComputeOptions>, ): Set<string>[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `options` | `Required<ComputeOptions>` | no |  |

### Returns

`Set<string>[]` — 


## `semiStableExtensions`

> Function · `reasoning/argumentation/extensions.ts:147`

```ts
export function semiStableExtensions( af: ArgumentationFramework, options: Required<ComputeOptions>, ): Set<string>[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `options` | `Required<ComputeOptions>` | no |  |

### Returns

`Set<string>[]` — 


## `computeExtensions`

> Function · `reasoning/argumentation/extensions.ts:167`

```ts
export function computeExtensions( af: ArgumentationFramework, semantics: Semantics, options: ComputeOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `af` | `ArgumentationFramework` | no |  |
| `semantics` | `Semantics` | no |  |
| `options` | `ComputeOptions` | yes |  |

### Returns

`Set<string>[]` — 

