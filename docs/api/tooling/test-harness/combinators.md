# `tooling/test-harness/combinators.ts`

## Contents

- [`crossProduct`](#crossproduct) — Function
- [`parameterize`](#parameterize) — Function
- [`filter`](#filter) — Function
- [`filterByTags`](#filterbytags) — Function
- [`tag`](#tag) — Function
- [`makeSuite`](#makesuite) — Function

## `crossProduct`

> Function · `tooling/test-harness/combinators.ts:29`

```ts
export function crossProduct<T1, T2>( s1: TestSuite<T1>, s2: TestSuite<T2>, opts?: CrossProductOptions, ): TestSuite<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s1` | `TestSuite<T1>` | no |  |
| `s2` | `TestSuite<T2>` | no |  |
| `opts` | `CrossProductOptions` | yes |  |

### Returns

`TestSuite<{ a: T1; b: T2 }>` — 


## `parameterize`

> Function · `tooling/test-harness/combinators.ts:61`

```ts
export function parameterize<T, P>( suite: TestSuite<T>, params: P[], ): TestSuite<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `suite` | `TestSuite<T>` | no |  |
| `params` | `P[]` | no |  |

### Returns

`TestSuite<{ input: T; param: P }>` — 


## `filter`

> Function · `tooling/test-harness/combinators.ts:93`

```ts
export function filter<T>(suite: TestSuite<T>, pred: (c: TestCase<T>) => boolean): TestSuite<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `suite` | `TestSuite<T>` | no |  |
| `pred` | `(c: TestCase<T>) => boolean` | no |  |

### Returns

`TestSuite<T>` — 


## `filterByTags`

> Function · `tooling/test-harness/combinators.ts:100`

```ts
export function filterByTags<T>(suite: TestSuite<T>, tags: string[]): TestSuite<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `suite` | `TestSuite<T>` | no |  |
| `tags` | `string[]` | no |  |

### Returns

`TestSuite<T>` — 


## `tag`

> Function · `tooling/test-harness/combinators.ts:104`

```ts
export function tag<T>(suite: TestSuite<T>, tagFn: (c: TestCase<T>) => string[]): TestSuite<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `suite` | `TestSuite<T>` | no |  |
| `tagFn` | `(c: TestCase<T>) => string[]` | no |  |

### Returns

`TestSuite<T>` — 


## `makeSuite`

> Function · `tooling/test-harness/combinators.ts:115`

```ts
export function makeSuite<T>(name: string, cases: TestCase<T>[]): TestSuite<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `cases` | `TestCase<T>[]` | no |  |

### Returns

`TestSuite<T>` — 

