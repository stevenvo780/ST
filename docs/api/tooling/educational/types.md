# `tooling/educational/types.ts`

============================================================ ST Educational — Tipos públicos del generador de ejercicios ============================================================

## Contents

- [`ExerciseLevel`](#exerciselevel) — Type
- [`ExerciseKind`](#exercisekind) — Type
- [`ProfileName`](#profilename) — Type
- [`SolutionKind`](#solutionkind) — Type
- [`ExerciseSolution`](#exercisesolution) — Interface
- [`Exercise`](#exercise) — Interface
- [`AnswerResult`](#answerresult) — Interface
- [`GenerateOptions`](#generateoptions) — Interface
- [`StudentAnswer`](#studentanswer) — Type
- [`StudentAnswerObject`](#studentanswerobject) — Interface
- [`PublicExercise`](#publicexercise) — Type
- [`toPublicExercise`](#topublicexercise) — Function

## `ExerciseLevel`

> Type · `tooling/educational/types.ts:5`

```ts
export type ExerciseLevel = 1 | 2 | 3 | 4;
```


## `ExerciseKind`

> Type · `tooling/educational/types.ts:7`

```ts
export type ExerciseKind = 'satisfiability' | 'validity' | 'derive' | 'countermodel' | 'translate';
```


## `ProfileName`

> Type · `tooling/educational/types.ts:9`

```ts
export type ProfileName = | 'classical.propositional' | 'classical.first_order' | 'intuitionistic.propositional' | 'paraconsistent.belnap' | 'modal.k' | 'epistemic.s5' | 'deontic.standard' | 'temporal.ltl' | 'aristotelian.syllogistic' | 'probabilistic.basic' | 'arithmetic';
```


## `SolutionKind`

> Type · `tooling/educational/types.ts:22`

```ts
export type SolutionKind = | 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'provable' | 'refutable' | 'translate';
```


## `ExerciseSolution`

> Interface · `tooling/educational/types.ts:31`

```ts
export interface ExerciseSolution
```


## `Exercise`

> Interface · `tooling/educational/types.ts:40`

```ts
export interface Exercise
```


## `AnswerResult`

> Interface · `tooling/educational/types.ts:53`

```ts
export interface AnswerResult
```


## `GenerateOptions`

> Interface · `tooling/educational/types.ts:60`

```ts
export interface GenerateOptions
```


## `StudentAnswer`

> Type · `tooling/educational/types.ts:65`

```ts
export type StudentAnswer = string | StudentAnswerObject;
```


## `StudentAnswerObject`

> Interface · `tooling/educational/types.ts:67`

```ts
export interface StudentAnswerObject
```


## `PublicExercise`

> Type · `tooling/educational/types.ts:74`

```ts
export type PublicExercise = Omit<Exercise, 'solution'>;
```


## `toPublicExercise`

> Function · `tooling/educational/types.ts:76`

```ts
export function toPublicExercise(ex: Exercise): PublicExercise
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ex` | `Exercise` | no |  |

### Returns

`PublicExercise` — 

