# `tooling/test-harness/coverage.ts`

## `runWithCoverage`

> Function · `tooling/test-harness/coverage.ts:3`

```ts
export async function runWithCoverage<T>( suite: TestSuite<T>, runner: (c: TestCase<T>) => Promise<boolean> ): Promise<CoverageReport>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `suite` | `TestSuite<T>` | no |  |
| `runner` | `(c: TestCase<T>) => Promise<boolean>` | no |  |

### Returns

`Promise<CoverageReport>` — 

