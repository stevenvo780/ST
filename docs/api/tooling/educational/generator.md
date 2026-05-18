# `tooling/educational/generator.ts`

============================================================ generateExercise + generateLessonPath ============================================================

## Contents

- [`generateExercise`](#generateexercise) — Function
- [`generateLessonPath`](#generatelessonpath) — Function

## `generateExercise`

> Function · `tooling/educational/generator.ts:111`

```ts
export function generateExercise( level: ExerciseLevel, profile: ProfileName, kind: ExerciseKind, options: GenerateOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `level` | `ExerciseLevel` | no |  |
| `profile` | `ProfileName` | no |  |
| `kind` | `ExerciseKind` | no |  |
| `options` | `GenerateOptions` | yes |  |

### Returns

`Exercise` — 


## `generateLessonPath`

> Function · `tooling/educational/generator.ts:169`

```ts
export function generateLessonPath( profile: ProfileName, targetLevel: ExerciseLevel, options: GenerateOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `profile` | `ProfileName` | no |  |
| `targetLevel` | `ExerciseLevel` | no |  |
| `options` | `GenerateOptions` | yes |  |

### Returns

`Exercise[]` — 

