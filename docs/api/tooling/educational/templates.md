# `tooling/educational/templates.ts`

============================================================ Plantillas de ejercicios por nivel ============================================================

## Contents

- [`TemplateContext`](#templatecontext) — Interface
- [`BuildResult`](#buildresult) — Interface
- [`ExerciseTemplate`](#exercisetemplate) — Interface
- [`pickVars`](#pickvars) — Function
- [`listTemplates`](#listtemplates) — Function
- [`findTemplatesFor`](#findtemplatesfor) — Function
- [`findTemplateById`](#findtemplatebyid) — Function

## `TemplateContext`

> Interface · `tooling/educational/templates.ts:8`

```ts
export interface TemplateContext
```


## `BuildResult`

> Interface · `tooling/educational/templates.ts:13`

```ts
export interface BuildResult
```


## `ExerciseTemplate`

> Interface · `tooling/educational/templates.ts:25`

```ts
export interface ExerciseTemplate
```


## `pickVars`

> Function · `tooling/educational/templates.ts:36`

```ts
export function pickVars(rng: SeededRng, count: number): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rng` | `SeededRng` | no |  |
| `count` | `number` | no |  |

### Returns

`string[]` — 


## `listTemplates`

> Function · `tooling/educational/templates.ts:616`

```ts
export function listTemplates(): ExerciseTemplate[]
```

### Returns

`ExerciseTemplate[]` — 


## `findTemplatesFor`

> Function · `tooling/educational/templates.ts:620`

```ts
export function findTemplatesFor( level: ExerciseLevel, profile: ProfileName, kind: ExerciseKind, ): ExerciseTemplate[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `level` | `ExerciseLevel` | no |  |
| `profile` | `ProfileName` | no |  |
| `kind` | `ExerciseKind` | no |  |

### Returns

`ExerciseTemplate[]` — 


## `findTemplateById`

> Function · `tooling/educational/templates.ts:630`

```ts
export function findTemplateById(id: string): ExerciseTemplate | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `id` | `string` | no |  |

### Returns

`ExerciseTemplate \| undefined` — 

