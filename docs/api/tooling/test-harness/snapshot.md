# `tooling/test-harness/snapshot.ts`

## Contents

- [`snapshotHash`](#snapshothash) — Function
- [`takeSnapshot`](#takesnapshot) — Function
- [`compareSnapshot`](#comparesnapshot) — Function

## `snapshotHash`

> Function · `tooling/test-harness/snapshot.ts:56`

```ts
export function snapshotHash(input: unknown, output: unknown): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `unknown` | no |  |
| `output` | `unknown` | no |  |

### Returns

`string` — 


## `takeSnapshot`

> Function · `tooling/test-harness/snapshot.ts:60`

```ts
export function takeSnapshot(input: unknown, output: unknown): Snapshot
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `unknown` | no |  |
| `output` | `unknown` | no |  |

### Returns

`Snapshot` — 


## `compareSnapshot`

> Function · `tooling/test-harness/snapshot.ts:68`

```ts
export function compareSnapshot(snap: Snapshot, current: unknown): SnapshotComparison
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `snap` | `Snapshot` | no |  |
| `current` | `unknown` | no |  |

### Returns

`SnapshotComparison` — 

